const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} = require("./auth");

const app = express();
const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

app.use(express.json({ limit: "10kb" }));
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; connect-src 'self'",
  );
  next();
});
app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && ["/api/appointments", "/api/contact"].includes(request.path)) {
    return response.status(400).json({ error: "Request body must be valid JSON." });
  }
  return next(error);
});
app.use(express.static(__dirname));

app.get("/healthz", (request, response) => {
  response.json({
    status: "ok",
    databaseConfigured: Boolean(pool),
  });
});

const getSessionToken = (request) => {
    const cookie = request.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith("studio54_staff_session="));
    return cookie?.slice("studio54_staff_session=".length) || null;
  };

const requireStaff = async (request, response, next) => {
    if (!pool) {
      return response.status(503).json({ error: "Staff storage is not configured. Add DATABASE_URL to .env." });
    }
    const token = getSessionToken(request);
    if (!token) return response.status(401).json({ error: "Staff authentication is required." });
    try {
      const result = await pool.query(
        `SELECT staff_users.id, staff_users.email, staff_users.role
         FROM staff_sessions
         JOIN staff_users ON staff_users.id = staff_sessions.staff_user_id
         WHERE staff_sessions.token_hash = $1
           AND staff_sessions.expires_at > NOW()
           AND staff_users.active = TRUE`,
        [hashSessionToken(token)],
      );
      if (result.rowCount === 0) return response.status(401).json({ error: "Staff authentication is required." });
      request.staff = result.rows[0];
      return next();
    } catch (error) {
      console.error("Staff authentication lookup failed:", error);
      return response.status(500).json({ error: "Staff authentication could not be checked." });
    }
  };

app.post("/api/staff/login", async (request, response) => {
    if (!pool) {
      return response.status(503).json({ error: "Staff storage is not configured. Add DATABASE_URL to .env." });
    }
    const { email, password } = request.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return response.status(400).json({ error: "Email and password are required." });
    }
    try {
      const result = await pool.query(
        `SELECT id, email, role, password_hash
         FROM staff_users WHERE email = $1 AND active = TRUE`,
        [email.trim().toLowerCase()],
      );
      const user = result.rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) {
        return response.status(401).json({ error: "Email or password is incorrect." });
      }
      const token = createSessionToken();
      await pool.query(
        `INSERT INTO staff_sessions (staff_user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
        [user.id, hashSessionToken(token)],
      );
      response.setHeader("Set-Cookie", `studio54_staff_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
      return response.json({ staff: { email: user.email, role: user.role } });
    } catch (error) {
      console.error("Staff login failed:", error);
      return response.status(500).json({ error: "Staff login could not be completed." });
    }
  });

app.post("/api/staff/logout", async (request, response) => {
    const token = getSessionToken(request);
    try {
      if (pool && token) {
        await pool.query("DELETE FROM staff_sessions WHERE token_hash = $1", [hashSessionToken(token)]);
      }
    } catch (error) {
      console.error("Staff logout failed:", error);
      return response.status(500).json({ error: "Staff logout could not be completed." });
    }
    response.setHeader("Set-Cookie", "studio54_staff_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    return response.status(204).end();
  });

app.get("/api/staff/session", requireStaff, (request, response) => {
    response.json({ staff: request.staff });
  });

app.get("/api/staff/appointments", requireStaff, async (request, response) => {
    try {
      const result = await pool.query(
        `SELECT id, treatment, stylist, appointment_date, appointment_time,
                customer_name, customer_email, confirmation_reference, status, created_at
         FROM appointments ORDER BY appointment_date, appointment_time`,
      );
      return response.json({ appointments: result.rows });
    } catch (error) {
      console.error("Staff appointment lookup failed:", error);
      return response.status(500).json({ error: "Appointments could not be loaded." });
    }
  });

app.patch("/api/staff/appointments/:id", requireStaff, async (request, response) => {
    const { status } = request.body || {};
    if (!["requested", "confirmed", "cancelled"].includes(status)) {
      return response.status(400).json({ error: "Appointment status is invalid." });
    }
    try {
      const result = await pool.query(
        `UPDATE appointments SET status = $1 WHERE id = $2
         RETURNING id, status, confirmation_reference`,
        [status, request.params.id],
      );
      if (result.rowCount === 0) return response.status(404).json({ error: "Appointment not found." });
      return response.json({ appointment: result.rows[0] });
    } catch (error) {
      if (error.code === "23505" && error.constraint === "appointments_active_slot_idx") {
        return response.status(409).json({ error: "That appointment time conflicts with another active appointment." });
      }
      console.error("Staff appointment update failed:", error);
      return response.status(500).json({ error: "Appointment status could not be updated." });
    }
  });

app.get("/api/staff/enquiries", requireStaff, async (request, response) => {
    try {
      const result = await pool.query(
        `SELECT id, customer_name, customer_email, message, status, created_at
         FROM contact_enquiries ORDER BY created_at DESC`,
      );
      return response.json({ enquiries: result.rows });
    } catch (error) {
      console.error("Staff enquiry lookup failed:", error);
      return response.status(500).json({ error: "Enquiries could not be loaded." });
    }
  });

app.get("/api/services", async (request, response) => {
  if (!pool) {
    return response.status(503).json({ error: "Booking data is not configured. Add DATABASE_URL to .env." });
  }
  try {
    const result = await pool.query(
      `SELECT name, description, price_from, duration_minutes
       FROM treatments ORDER BY name`,
    );
    return response.json({ services: result.rows });
  } catch (error) {
    console.error("Service lookup failed:", error);
    return response.status(500).json({ error: "Services could not be loaded." });
  }
});

app.get("/api/stylists", async (request, response) => {
  if (!pool) {
    return response.status(503).json({ error: "Booking data is not configured. Add DATABASE_URL to .env." });
  }
  try {
    const result = await pool.query(
      `SELECT name, speciality FROM stylists WHERE active = TRUE ORDER BY name`,
    );
    return response.json({ stylists: result.rows });
  } catch (error) {
    console.error("Stylist lookup failed:", error);
    return response.status(500).json({ error: "Stylists could not be loaded." });
  }
});

app.get("/api/availability", async (request, response) => {
  const { date } = request.query;
  const dateParts = typeof date === "string" && date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const validDate = dateParts
    && new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))).toISOString().slice(0, 10) === date;
  if (!validDate) {
    return response.status(400).json({ error: "Please provide a valid availability date." });
  }
  if (!pool) {
    return response.status(503).json({ error: "Booking data is not configured. Add DATABASE_URL to .env." });
  }
  try {
    const result = await pool.query(
      `SELECT DISTINCT TO_CHAR(slot_time, 'HH24:MI') AS slot_time
       FROM availability_slots
       WHERE slot_date = $1
         AND active = TRUE
         AND NOT EXISTS (
           SELECT 1
           FROM appointments
           WHERE appointment_date = availability_slots.slot_date
             AND appointment_time = availability_slots.slot_time
             AND status <> 'cancelled'
         )
       ORDER BY slot_time`,
      [date],
    );
    return response.json({ date, slots: result.rows.map((row) => row.slot_time) });
  } catch (error) {
    console.error("Availability lookup failed:", error);
    return response.status(500).json({ error: "Availability could not be loaded." });
  }
});

app.post("/api/appointments", async (request, response) => {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    return response.status(400).json({ error: "All appointment fields are required." });
  }
  const { treatment, stylist, appointmentDate, appointmentTime, customerName, customerEmail } = request.body;
  const values = [treatment, stylist, appointmentDate, appointmentTime, customerName, customerEmail];

  if (values.some((value) => typeof value !== "string" || value.trim() === "")) {
    return response.status(400).json({ error: "All appointment fields are required." });
  }
  if (treatment.length > 120 || stylist.length > 120 || customerName.length > 120 || customerEmail.length > 254) {
    return response.status(400).json({ error: "Appointment details are too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return response.status(400).json({ error: "Please provide a valid email address." });
  }
  const dateParts = appointmentDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeParts = appointmentTime.match(/^(\d{2}):(\d{2})$/);
  const validDate = dateParts
    && new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))).toISOString().slice(0, 10) === appointmentDate;
  const validTime = timeParts
    && Number(timeParts[1]) <= 23
    && Number(timeParts[2]) <= 59;
  if (!validDate || !validTime) {
    return response.status(400).json({ error: "Please provide a valid appointment date and time." });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (appointmentDate < today) {
    return response.status(400).json({ error: "Please choose a future appointment date." });
  }
  if (!pool) {
    return response.status(503).json({ error: "Booking storage is not configured. Add DATABASE_URL to .env." });
  }

  try {
    const availability = await pool.query(
      `SELECT 1
       FROM availability_slots
       WHERE slot_date = $1 AND slot_time = $2 AND active = TRUE
       LIMIT 1`,
      [appointmentDate, appointmentTime],
    );
    if (availability.rowCount === 0) {
      return response.status(409).json({ error: "That appointment time is no longer available." });
    }
    const confirmationReference = `ST54-${randomBytes(4).toString("hex").toUpperCase()}`;
    const result = await pool.query(
      `INSERT INTO appointments
        (treatment, stylist, appointment_date, appointment_time, customer_name, customer_email, confirmation_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING confirmation_reference, status, appointment_date, appointment_time`,
      [...values, confirmationReference],
    );
    return response.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "appointments_active_slot_idx") {
      return response.status(409).json({ error: "That appointment time has just been booked. Please choose another." });
    }
    console.error("Appointment creation failed:", error);
    return response.status(500).json({ error: "The appointment could not be created." });
  }
});

app.post("/api/contact", async (request, response) => {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    return response.status(400).json({ error: "Name, email, and message are required." });
  }
  const { name, email, message } = request.body;
  if ([name, email, message].some((value) => typeof value !== "string" || value.trim() === "")) {
    return response.status(400).json({ error: "Name, email, and message are required." });
  }
  if (name.length > 120 || email.length > 254 || message.length > 2000) {
    return response.status(400).json({ error: "Your enquiry is too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: "Please provide a valid email address." });
  }
  if (!pool) {
    return response.status(503).json({ error: "Enquiry storage is not configured. Add DATABASE_URL to .env." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contact_enquiries (customer_name, customer_email, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [name.trim(), email.trim(), message.trim()],
    );
    return response.status(201).json({ enquiry: result.rows[0] });
  } catch (error) {
    console.error("Contact enquiry creation failed:", error);
    return response.status(500).json({ error: "The enquiry could not be sent." });
  }
});

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`STUDIO 54 is running at http://localhost:${port}`);
});
