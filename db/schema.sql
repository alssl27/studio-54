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

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  treatment TEXT NOT NULL,
  stylist TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_schedule_idx
  ON appointments (appointment_date, appointment_time);

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
