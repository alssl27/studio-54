CREATE TABLE IF NOT EXISTS treatments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_from INTEGER NOT NULL CHECK (price_from >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stylists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  speciality TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id BIGSERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  stylist_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (slot_date, slot_time, stylist_name)
);

CREATE INDEX IF NOT EXISTS availability_slots_lookup_idx
  ON availability_slots (slot_date, active);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  treatment TEXT NOT NULL,
  stylist TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  confirmation_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS confirmation_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_confirmation_reference_idx
  ON appointments (confirmation_reference)
  WHERE confirmation_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS appointments_schedule_idx
  ON appointments (appointment_date, appointment_time);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_idx
  ON appointments (appointment_date, appointment_time)
  WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_enquiries_created_idx
  ON contact_enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS staff_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash TEXT PRIMARY KEY,
  staff_user_id INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS staff_sessions_expiry_idx
  ON staff_sessions (expires_at);
