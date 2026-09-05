-- Demo shelters and adoptable animals for Bengaluru.
--
-- The original demo set is Kochi-only (matching the design's setting), which
-- leaves the Shelters and Adopt screens showing results hundreds of kilometres
-- away for anyone testing elsewhere. Idempotent, like the Kochi set.
--
-- NOTE: placeholder listings with invented phone numbers, for demos only.
-- Replace with real shelter data before launch.

insert into shelters (id, name, rating, review_count, lat, lng, address, phone, hours_text, is_open, services) values
  ('55555555-5555-5555-5555-555555555555', 'Bengaluru Street Animal Trust', 4.7, 213, 12.9716, 77.5946, 'Shanti Nagar, Bengaluru', '+918042345001', 'Open · Closes 8 PM', true, array['Vaccination','Sterilization','Emergency','Adoption']),
  ('66666666-6666-6666-6666-666666666666', 'Koramangala Paws Clinic', 4.5, 156, 12.9352, 77.6245, 'Koramangala 5th Block, Bengaluru', '+918042345002', 'Open · Closes 9 PM', true, array['Vaccination','Emergency']),
  ('77777777-7777-7777-7777-777777777777', 'Indiranagar Animal Shelter', 4.2, 88, 12.9784, 77.6408, 'Indiranagar, Bengaluru', '+918042345003', 'Opens 9 AM tomorrow', false, array['Sterilization','Adoption']),
  ('88888888-8888-8888-8888-888888888888', 'Jayanagar Care & Rescue', 4.6, 174, 12.9250, 77.5938, 'Jayanagar 4th Block, Bengaluru', '+918042345004', 'Open · Closes 7 PM', true, array['Vaccination','Sterilization','Adoption'])
on conflict (id) do nothing;

insert into adoptable_animals (shelter_id, name, age_text, gender, breed, vaccinated, sterilized, story, photo_url) values
  ('55555555-5555-5555-5555-555555555555', 'Simba', '~2 yrs', 'Male', 'Indie mix', true, true, 'Rescued from a busy junction near Shanti Nagar with a limp. Fully recovered and endlessly cheerful.', null),
  ('55555555-5555-5555-5555-555555555555', 'Mia', '~8 months', 'Female', 'Domestic shorthair', true, false, 'Found sheltering in a scooter seat during the monsoon. Gentle, curious, and very fond of laps.', null),
  ('66666666-6666-6666-6666-666666666666', 'Rocky', '~3 yrs', 'Male', 'Street dog', true, true, 'A regular at the Koramangala tea stalls until he was hit by a bike. Healed well and great with people.', null),
  ('77777777-7777-7777-7777-777777777777', 'Nila', '~1.5 yrs', 'Female', 'Indie cat', true, true, 'Came in badly underweight and has since doubled in size. Independent but loves a warm windowsill.', null),
  ('88888888-8888-8888-8888-888888888888', 'Bhima', '~4 yrs', 'Male', 'Indie mix', true, true, 'A calm, older boy who waited two years for a home. Wonderful with children and other dogs.', null)
on conflict (shelter_id, name) do nothing;
