-- Demo reference data: shelters + adoptable animals.
--
-- Lives in a migration (not seed.sql) so it reaches hosted projects too --
-- `supabase db push` applies migrations only, and without this the Shelters
-- and Adopt screens would be empty in production. Idempotent so re-running
-- against an existing database is safe.
--
-- NOTE: these are placeholder Kochi shelters with invented phone numbers,
-- intended for demos. Replace with real shelter listings before launch.

create unique index if not exists adoptable_animals_shelter_name_idx
  on adoptable_animals (shelter_id, name);

insert into shelters (id, name, rating, review_count, lat, lng, address, phone, hours_text, is_open, services) values
  ('11111111-1111-1111-1111-111111111111', 'Kochi Animal Rescue Trust', 4.6, 128, 9.9312, 76.2673, 'MG Road, Ernakulam, Kochi', '+914842345001', 'Open · Closes 8 PM', true, array['Vaccination','Sterilization','Emergency','Adoption']),
  ('22222222-2222-2222-2222-222222222222', 'Fort Kochi Street Paws', 4.3, 64, 9.9658, 76.2422, 'Fort Kochi, Kochi', '+914842345002', 'Opens 9 AM tomorrow', false, array['Sterilization','Adoption']),
  ('33333333-3333-3333-3333-333333333333', 'Edappally Vet & Shelter', 4.8, 201, 10.0261, 76.3084, 'Edappally, Kochi', '+914842345003', 'Open · Closes 9 PM', true, array['Vaccination','Emergency']),
  ('44444444-4444-4444-4444-444444444444', 'Kakkanad Care Shelter', 4.1, 47, 10.0158, 76.3419, 'Kakkanad, Kochi', '+914842345004', 'Open · Closes 6 PM', true, array['Sterilization','Adoption','Vaccination'])
on conflict (id) do nothing;

insert into adoptable_animals (shelter_id, name, age_text, gender, breed, vaccinated, sterilized, story, photo_url) values
  ('11111111-1111-1111-1111-111111111111', 'Motta', '~1.5 yrs', 'Male', 'Indie mix', true, true, 'Found limping near MG Road, nursed back to health over 3 months. Loves belly rubs and long naps in the sun.', null),
  ('11111111-1111-1111-1111-111111111111', 'Ammu', '~6 months', 'Female', 'Domestic shorthair', true, false, 'Rescued as a malnourished kitten from a construction site. Playful, curious, gets along with other cats.', null),
  ('22222222-2222-2222-2222-222222222222', 'Kappu', '~3 yrs', 'Male', 'Street dog', true, true, 'A calm, friendly former street dog from Fort Kochi. Good with kids, house-trained.', null),
  ('33333333-3333-3333-3333-333333333333', 'Meow Meow', '~2 yrs', 'Female', 'Indie cat', true, true, 'Independent but affectionate once she trusts you. Recovered from a skin condition, fully healthy now.', null),
  ('44444444-4444-4444-4444-444444444444', 'Bruno', '~4 yrs', 'Male', 'Indie mix', true, true, 'Was hit by a vehicle and rescued in critical condition; made a full recovery. Gentle giant, loves other dogs.', null),
  ('44444444-4444-4444-4444-444444444444', 'Chinnu', '~1 yr', 'Female', 'Domestic shorthair', false, false, 'Young and energetic, still needs her vaccinations. Great with families who have time to play.', null)
on conflict (shelter_id, name) do nothing;
