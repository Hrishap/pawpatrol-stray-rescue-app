-- Location-scoped lookups.
--
-- The app was fetching every shelter in the table and sorting client-side,
-- which is fine for a handful of demo rows and wrong for real data: a user in
-- Bengaluru would download shelters in every other city just to hide them.
-- These do the distance filter in Postgres and return nearest-first.
--
-- Great-circle distance via the haversine formula; no PostGIS dependency, and
-- accurate enough for "shelters near me" at city scale. Both functions are
-- SECURITY INVOKER (the default for SQL functions), so row-level security
-- still applies to the caller.

create or replace function km_between(
  lat_a double precision,
  lng_a double precision,
  lat_b double precision,
  lng_b double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians(lat_b - lat_a) / 2), 2)
      + cos(radians(lat_a)) * cos(radians(lat_b))
        * power(sin(radians(lng_b - lng_a) / 2), 2)
    )
  );
$$;

create or replace function shelters_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 50
)
returns setof shelters
language sql
stable
as $$
  select *
  from shelters
  where km_between(p_lat, p_lng, lat, lng) <= p_radius_km
  order by km_between(p_lat, p_lng, lat, lng);
$$;

create or replace function adoptable_animals_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 50
)
returns setof adoptable_animals
language sql
stable
as $$
  select a.*
  from adoptable_animals a
  join shelters s on s.id = a.shelter_id
  where km_between(p_lat, p_lng, s.lat, s.lng) <= p_radius_km
  order by km_between(p_lat, p_lng, s.lat, s.lng), a.name;
$$;
