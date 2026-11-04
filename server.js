const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

app.use(express.json({ limit: "10kb" }));
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.static(__dirname));

app.post("/api/appointments", async (request, response) => {
  const { treatment, stylist, appointmentDate, appointmentTime, customerName, customerEmail } = request.body;
  const values = [treatment, stylist, appointmentDate, appointmentTime, customerName, customerEmail];

  if (values.some((value) => typeof value !== "string" || value.trim() === "")) {
    return response.status(400).json({ error: "All appointment fields are required." });
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
    const result = await pool.query(
      `INSERT INTO appointments
        (treatment, stylist, appointment_date, appointment_time, customer_name, customer_email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, appointment_date, appointment_time`,
      values,
    );
    return response.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    console.error("Appointment creation failed:", error);
    return response.status(500).json({ error: "The appointment could not be created." });
  }
});

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`STUDIO 54 is running at http://localhost:${port}`);
});
