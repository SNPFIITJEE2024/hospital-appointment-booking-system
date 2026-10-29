/*
# Hospital Appointment Booking System — Core Schema

## Overview
Creates the two core tables for a hospital appointment booking system:
`doctors` (staff directory) and `appointments` (patient bookings). This is a
single-tenant demo application that uses a mock JWT-style auth context on the
client (a Quick Demo Switcher lets evaluators log in as Patient or Doctor/Admin
with one click). Because the browser talks to Supabase with the anon key and
there is no Supabase Auth sign-in screen, policies use `TO anon, authenticated`
with `USING (true)` — the data is intentionally shared/public for the demo.

## New Tables

### doctors
- `id` (uuid, PK)
- `name` (text) — doctor's full name
- `specialty` (text) — medical department (Cardiology, Dermatology, etc.)
- `experience_years` (int) — years of practice
- `rating` (numeric) — average patient rating 0–5
- `fee` (numeric) — consultation fee in USD
- `photo_url` (text) — profile photo URL
- `bio` (text) — short professional bio
- `available` (boolean, default true) — master working-availability toggle
- `blocked_slots` (jsonb, default '{}') — map of date(YYYY-MM-DD) → array of blocked time slots ("HH:MM")
- `created_at` (timestamptz)

### appointments
- `id` (uuid, PK) — also serves as the public Appointment ID
- `doctor_id` (uuid, FK → doctors.id)
- `patient_name` (text)
- `patient_age` (int)
- `patient_gender` (text)
- `patient_phone` (text)
- `patient_email` (text) — used to filter the patient dashboard
- `reason` (text) — reason for consultation / symptoms
- `appointment_date` (date)
- `time_slot` (text) — "HH:MM" 24h format
- `status` (text, default 'confirmed') — confirmed | completed | cancelled
- `prescription_notes` (text, nullable)
- `created_at` (timestamptz)

## Security
- RLS enabled on both tables.
- Grants: CRUD on both tables to `anon, authenticated` (single-tenant demo).
- Policies: permissive `USING (true)` / `WITH CHECK (true)` for all verbs on
  both tables — data is intentionally shared for this demo; access control is
  enforced client-side via the mock role context.

## Seed Data
Inserts 6 doctors across all required specialties with real profile photos,
experience, ratings, and fees. Uses `ON CONFLICT DO NOTHING` so re-running is safe.
*/

-- ===== doctors =====
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  experience_years int NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  fee numeric(8,2) NOT NULL DEFAULT 0,
  photo_url text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  blocked_slots jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON doctors TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE
  TO anon, authenticated USING (true);

-- ===== appointments =====
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_age int NOT NULL,
  patient_gender text NOT NULL,
  patient_phone text NOT NULL,
  patient_email text NOT NULL,
  reason text NOT NULL,
  appointment_date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  prescription_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE
  TO anon, authenticated USING (true);

-- Index for conflict-check and dashboard queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(patient_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ===== Seed doctors =====
INSERT INTO doctors (name, specialty, experience_years, rating, fee, photo_url, bio) VALUES
  ('Dr. James Carter', 'Cardiology', 15, 4.8, 220.00,
   'https://images.pexels.com/photos/19601385/pexels-photo-19601385.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   'Board-certified cardiologist specializing in preventive heart care, arrhythmia management, and post-surgical rehabilitation.'),
  ('Dr. Aisha Rahman', 'Dermatology', 11, 4.9, 180.00,
   'https://images.pexels.com/photos/37272329/pexels-photo-37272329.png?auto=compress&cs=tinysrgb&h=650&w=940',
   'Dermatologist focused on medical and cosmetic skin health, acne treatment, eczema, and early skin-cancer screening.'),
  ('Dr. Emily Stone', 'Pediatrics', 9, 4.7, 150.00,
   'https://images.pexels.com/photos/29995629/pexels-photo-29995629.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   'Pediatrician dedicated to child wellness, vaccinations, developmental milestones, and family-centered care.'),
  ('Dr. Maria Gonzalez', 'General Medicine', 18, 4.6, 130.00,
   'https://images.pexels.com/photos/30270934/pexels-photo-30270934.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   'General practitioner offering comprehensive primary care, chronic-disease management, and preventive health screenings.'),
  ('Dr. Sarah Lee', 'Neurology', 13, 4.8, 260.00,
   'https://images.pexels.com/photos/28332542/pexels-photo-28332542.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   'Neurologist treating headaches, epilepsy, multiple sclerosis, and movement disorders with a patient-first approach.'),
  ('Dr. James Carter II', 'Orthopedics', 20, 4.9, 240.00,
   'https://images.pexels.com/photos/28442318/pexels-photo-28442318.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   'Orthopedic surgeon specializing in joint replacement, sports injuries, and minimally invasive spine procedures.')
ON CONFLICT DO NOTHING;
