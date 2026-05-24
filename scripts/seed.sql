-- Seed drivers (profiles) and vehicles.
-- NOTE: This assumes profiles.id is not a foreign key to auth.users.id.
-- If it is, create auth users first (service role) and reuse their ids.

insert into profiles (id, role, full_name, driver_license_status)
values
  (gen_random_uuid(), 'Driver', 'Ama Kofi', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Kojo Mensah', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Akosua Boateng', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Yaw Owusu', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Efua Asante', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Kwame Antwi', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Abena Nkrumah', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Kofi Nyarko', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Esi Addo', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Nana Osei', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Adwoa Sarfo', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Samuel Tetteh', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Mary Quaye', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Benjamin Arthur', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Comfort Agyeman', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Daniel Ofori', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Patricia Lamptey', 'Valid'),
  (gen_random_uuid(), 'Driver', 'Michael Appiah', 'Valid'),
  (gen_random_uuid(), 'Admin', 'Grace Mensima', 'Valid'),
  (gen_random_uuid(), 'Admin', 'Joseph Dankwa', 'Valid');

insert into vehicles (make, model, plate_number, capacity, status, current_mileage, maintenance_threshold)
values
  ('Toyota', 'Hilux', 'GK 101A', 5, 'Available', 12450, 15000),
  ('Nissan', 'Navara', 'GK 102B', 5, 'In Transit', 20980, 25000),
  ('Ford', 'Ranger', 'GK 103C', 5, 'Available', 8750, 15000),
  ('Toyota', 'Land Cruiser', 'GK 104D', 7, 'Needs Maintenance', 49500, 45000),
  ('Hyundai', 'Starex', 'GK 105E', 11, 'Available', 11200, 20000),
  ('Mitsubishi', 'L200', 'GK 106F', 5, 'In Transit', 16780, 20000),
  ('Kia', 'Bongo', 'GK 107G', 3, 'Available', 6200, 12000),
  ('Isuzu', 'D-Max', 'GK 108H', 5, 'Available', 9800, 15000),
  ('Suzuki', 'Vitara', 'GK 109J', 4, 'Available', 7450, 12000),
  ('Toyota', 'Hiace', 'GK 110K', 14, 'Available', 15300, 20000);
