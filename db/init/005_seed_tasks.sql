INSERT INTO task_categories (slug, name) VALUES
  ('home',      'Home Maintenance'),
  ('errands',   'Errands & Deliveries'),
  ('bills',     'Bills & Paperwork'),
  ('health',    'Health & Wellness'),
  ('travel',    'Travel & Events')
ON CONFLICT (slug) DO NOTHING;


INSERT INTO tasks (category_id, name, description)
SELECT c.id, t.name, t.description
FROM (VALUES
  ('home',    'Plumbing repairs',          'Leaks, blocked drains and fittings fixed by a vetted plumber'),
  ('home',    'Electrical repairs',        'Switches, wiring, fans and lights repaired safely'),
  ('home',    'Deep cleaning',             'Full-home deep clean, including kitchen and bathrooms'),
  ('home',    'Pest control',              'Scheduled treatment for cockroaches, termites and more'),
  ('home',    'Appliance servicing',       'AC, RO purifier, washing machine and fridge servicing'),

  ('errands', 'Grocery shopping',          'Weekly groceries bought and delivered to your door'),
  ('errands', 'Pharmacy pickups',          'Prescriptions collected from your preferred chemist'),
  ('errands', 'Laundry and dry cleaning',  'Clothes picked up, cleaned and returned'),
  ('errands', 'Courier and parcels',       'Packages sent, collected or returned on your behalf'),
  ('errands', 'Gift shopping',             'Gifts chosen, wrapped and delivered for any occasion'),

  ('bills',   'Utility bill payments',     'Electricity, water, gas and internet bills paid on time'),
  ('bills',   'Document renewals',         'Passport, driving licence and ID renewals handled'),
  ('bills',   'Insurance renewals',        'Health, vehicle and home policies tracked and renewed'),
  ('bills',   'Property tax',              'Municipal property tax filed and paid'),
  ('bills',   'Society follow-ups',        'Maintenance dues, complaints and society paperwork'),

  ('health',  'Doctor appointments',       'Consultations booked with doctors you trust'),
  ('health',  'Lab tests at home',         'Sample collection at home and reports delivered'),
  ('health',  'Elder care visits',         'Regular check-ins and support for elderly family members'),
  ('health',  'Medicine refills',          'Monthly medicines reordered before they run out'),
  ('health',  'Fitness trainer booking',   'Yoga or fitness trainers arranged at home'),

  ('travel',  'Travel bookings',           'Flights, trains and hotels booked to your preferences'),
  ('travel',  'Visa assistance',           'Visa forms, documents and appointments managed'),
  ('travel',  'Party planning',            'Birthdays and get-togethers planned end to end'),
  ('travel',  'Restaurant reservations',   'Tables booked for dinners and celebrations'),
  ('travel',  'Event tickets',             'Tickets for shows, concerts and matches arranged')
) AS t(category_slug, name, description)
JOIN task_categories c ON c.slug = t.category_slug
ON CONFLICT (category_id, name) DO NOTHING;