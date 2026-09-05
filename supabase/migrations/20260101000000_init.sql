-- PawPatrol initial schema: profiles, cases, shelters, adoptable animals,
-- notifications, chat, push tokens. RLS + RPC functions enforce the real
-- case status state machine (see design-reference/PAWPATROL_SPEC.md §4.2/§4.3),
-- replacing the prototype's client-only fake logic.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('reporter', 'volunteer', 'ngo');
create type case_species as enum ('Dog', 'Cat', 'Cattle');
create type case_urgency as enum ('critical', 'attention', 'monitoring');
create type case_status as enum ('open', 'claimed', 'in_progress', 'pending_verification', 'resolved');
create type notification_type as enum ('new', 'claim', 'chat', 'status');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'New user',
  role user_role not null default 'reporter',
  org_name text,
  avatar_url text,
  language_code text not null default 'en' check (language_code in ('en', 'ml', 'hi')),
  notif_prefs_on boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row when a new auth user signs up.
-- full_name/role/org_name are passed through from signup's user_metadata.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role, org_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'reporter'),
    new.raw_user_meta_data ->> 'org_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------
create sequence case_code_seq start 1000;

create table cases (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('C-' || nextval('case_code_seq')::text),
  reporter_id uuid not null references profiles (id),
  species case_species not null,
  breed text,
  tags text[] not null default '{}',
  urgency case_urgency not null,
  status case_status not null default 'open',
  claimed_by uuid references profiles (id),
  note text not null default '',
  photo_url text,
  lat double precision not null,
  lng double precision not null,
  address text,
  ngo_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cases_status_idx on cases (status);
create index cases_reporter_idx on cases (reporter_id);
create index cases_claimed_by_idx on cases (claimed_by);

alter table cases enable row level security;

create policy "cases are readable by any authenticated user"
  on cases for select
  to authenticated
  using (true);

create policy "reporters insert their own case as open"
  on cases for insert
  to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and claimed_by is null);

-- All other mutation (claim/advance/verify/assign/notes) goes through the
-- RPC functions below (security definer), not direct client UPDATEs, so the
-- state machine can be enforced in one place. No blanket UPDATE policy is
-- granted to authenticated users.

create table case_status_history (
  id bigint generated always as identity primary key,
  case_id uuid not null references cases (id) on delete cascade,
  status case_status not null,
  changed_by uuid references profiles (id),
  changed_at timestamptz not null default now()
);

alter table case_status_history enable row level security;

create policy "case history is readable by any authenticated user"
  on case_status_history for select
  to authenticated
  using (true);

create function touch_case_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger cases_touch_updated_at
  before update on cases
  for each row execute function touch_case_updated_at();

create function record_case_opened()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into case_status_history (case_id, status, changed_by)
  values (new.id, new.status, new.reporter_id);

  -- Notify every volunteer/NGO responder of a new case (community model —
  -- no per-user radius matching yet).
  insert into notifications (user_id, type, text, related_case_id)
  select id, 'new', new.species || ' reported nearby (' || new.code || ')', new.id
  from profiles
  where role in ('volunteer', 'ngo');

  return new;
end;
$$;

create trigger cases_after_insert
  after insert on cases
  for each row execute function record_case_opened();

-- ---------------------------------------------------------------------------
-- Case state-machine RPCs
-- ---------------------------------------------------------------------------

-- Volunteer (or anyone but the reporter) claims an open case as themselves.
create function claim_case(p_case_id uuid)
returns cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
begin
  select * into v_case from cases where id = p_case_id for update;
  if v_case is null then
    raise exception 'Case not found';
  end if;
  if v_case.status <> 'open' then
    raise exception 'Case is not open';
  end if;
  if v_case.reporter_id = auth.uid() then
    raise exception 'Reporters cannot claim their own case';
  end if;

  update cases set status = 'claimed', claimed_by = auth.uid()
    where id = p_case_id returning * into v_case;

  insert into case_status_history (case_id, status, changed_by) values (p_case_id, 'claimed', auth.uid());
  insert into notifications (user_id, type, text, related_case_id)
    values (v_case.reporter_id, 'claim', 'Your case ' || v_case.code || ' was claimed', p_case_id);

  return v_case;
end;
$$;

-- The claiming volunteer advances their own case one step:
-- claimed -> in_progress -> pending_verification.
create function advance_case(p_case_id uuid)
returns cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
  v_next case_status;
begin
  select * into v_case from cases where id = p_case_id for update;
  if v_case is null then
    raise exception 'Case not found';
  end if;
  if v_case.claimed_by <> auth.uid() then
    raise exception 'Only the assigned volunteer can advance this case';
  end if;

  if v_case.status = 'claimed' then
    v_next := 'in_progress';
  elsif v_case.status = 'in_progress' then
    v_next := 'pending_verification';
  else
    raise exception 'Case cannot be advanced from its current status';
  end if;

  update cases set status = v_next where id = p_case_id returning * into v_case;

  insert into case_status_history (case_id, status, changed_by) values (p_case_id, v_next, auth.uid());
  insert into notifications (user_id, type, text, related_case_id)
    values (v_case.reporter_id, 'status', 'Case ' || v_case.code || ' is now ' || v_next, p_case_id);

  return v_case;
end;
$$;

-- NGO verifies a resolution: pending_verification -> resolved. This is the
-- fix for the prototype's cosmetic-only "Verify resolution" button.
create function verify_case(p_case_id uuid)
returns cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role <> 'ngo' then
    raise exception 'Only NGO staff can verify a resolution';
  end if;

  select * into v_case from cases where id = p_case_id for update;
  if v_case is null then
    raise exception 'Case not found';
  end if;
  if v_case.status <> 'pending_verification' then
    raise exception 'Case is not awaiting verification';
  end if;

  update cases set status = 'resolved' where id = p_case_id returning * into v_case;

  insert into case_status_history (case_id, status, changed_by) values (p_case_id, 'resolved', auth.uid());
  insert into notifications (user_id, type, text, related_case_id)
    values (v_case.reporter_id, 'status', 'Case ' || v_case.code || ' is resolved', p_case_id);

  return v_case;
end;
$$;

-- NGO assigns (or reassigns) a case to a specific volunteer profile.
create function assign_case(p_case_id uuid, p_volunteer_id uuid)
returns cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role <> 'ngo' then
    raise exception 'Only NGO staff can assign cases';
  end if;

  select * into v_case from cases where id = p_case_id for update;
  if v_case is null then
    raise exception 'Case not found';
  end if;
  if v_case.status = 'resolved' then
    raise exception 'Case is already resolved';
  end if;

  update cases
    set claimed_by = p_volunteer_id,
        status = case when status = 'open' then 'claimed' else status end
    where id = p_case_id returning * into v_case;

  insert into case_status_history (case_id, status, changed_by) values (p_case_id, v_case.status, auth.uid());
  insert into notifications (user_id, type, text, related_case_id)
    values (p_volunteer_id, 'claim', 'You were assigned case ' || v_case.code, p_case_id);

  return v_case;
end;
$$;

-- NGO saves internal notes on a case (fix for the prototype's non-persisted notes).
create function set_case_ngo_notes(p_case_id uuid, p_notes text)
returns cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role <> 'ngo' then
    raise exception 'Only NGO staff can edit internal notes';
  end if;

  update cases set ngo_notes = p_notes where id = p_case_id returning * into v_case;
  return v_case;
end;
$$;

-- ---------------------------------------------------------------------------
-- shelters / adoptable_animals (read-only reference data for the app)
-- ---------------------------------------------------------------------------
create table shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  lat double precision not null,
  lng double precision not null,
  address text not null,
  phone text,
  hours_text text not null default '',
  is_open boolean not null default true,
  services text[] not null default '{}'
);

alter table shelters enable row level security;

create policy "shelters are readable by any authenticated user"
  on shelters for select
  to authenticated
  using (true);

create table adoptable_animals (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references shelters (id) on delete cascade,
  name text not null,
  age_text text not null default '',
  gender text not null default 'Male' check (gender in ('Male', 'Female')),
  breed text,
  vaccinated boolean not null default false,
  sterilized boolean not null default false,
  story text not null default '',
  photo_url text
);

alter table adoptable_animals enable row level security;

create policy "adoptable animals are readable by any authenticated user"
  on adoptable_animals for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  text text not null,
  related_case_id uuid references cases (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "users read their own notifications"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create function mark_notification_read(p_notification_id bigint)
returns notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notif notifications;
begin
  update notifications set read_at = now()
    where id = p_notification_id and user_id = auth.uid()
    returning * into v_notif;
  return v_notif;
end;
$$;

create function mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- chat_messages (real per-case thread, replacing the prototype's echo-bot)
-- ---------------------------------------------------------------------------
create table chat_messages (
  id bigint generated always as identity primary key,
  case_id uuid not null references cases (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  text text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_case_idx on chat_messages (case_id, created_at);

alter table chat_messages enable row level security;

create policy "chat is readable by the case's reporter or claimant"
  on chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from cases c
      where c.id = case_id and (c.reporter_id = auth.uid() or c.claimed_by = auth.uid())
    )
  );

create function send_chat_message(p_case_id uuid, p_text text)
returns chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case cases;
  v_message chat_messages;
  v_recipient uuid;
begin
  select * into v_case from cases where id = p_case_id;
  if v_case is null then
    raise exception 'Case not found';
  end if;
  if auth.uid() not in (v_case.reporter_id, v_case.claimed_by) then
    raise exception 'Only the case reporter or claimant can chat on this case';
  end if;

  insert into chat_messages (case_id, sender_id, text)
    values (p_case_id, auth.uid(), p_text)
    returning * into v_message;

  v_recipient := case when auth.uid() = v_case.reporter_id then v_case.claimed_by else v_case.reporter_id end;
  if v_recipient is not null then
    insert into notifications (user_id, type, text, related_case_id)
      values (v_recipient, 'chat', 'New message on case ' || v_case.code, p_case_id);
  end if;

  return v_message;
end;
$$;

-- ---------------------------------------------------------------------------
-- push_tokens (schema-ready; not sent to yet — see plan)
-- ---------------------------------------------------------------------------
create table push_tokens (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

create policy "users manage their own push tokens"
  on push_tokens for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for case/adoption photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');
