const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");

const port = 3100 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
let server;

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: String(port), DATABASE_URL: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const startupError = new Promise((_, reject) => {
    server.stderr.once("data", (chunk) => reject(new Error(chunk.toString())));
  });
  const startupOutput = new Promise((resolve) => {
    server.stdout.once("data", (chunk) => resolve(chunk.toString()));
  });

  await Promise.race([startupError, startupOutput]);
});

after(async () => {
  if (!server) return;
  server.kill();
  await once(server, "close");
});

test("all public pages load successfully", async () => {
  const pages = [
    "index.html",
    "services.html",
    "gallery.html",
    "matcher.html",
    "booking.html",
    "about.html",
    "contact.html",
    "products.html",
    "tutorials.html",
  ];

  for (const page of pages) {
    const response = await fetch(`${baseUrl}/${page}`);
    assert.equal(response.status, 200, `${page} should return HTTP 200`);
    const markup = await response.text();
    assert.match(markup, /<main\b/i, `${page} should contain a main landmark`);
    assert.match(markup, /property="og:title"/i, `${page} should include an Open Graph title`);
    assert.match(markup, /name="twitter:card"/i, `${page} should include a Twitter card`);
  }
});

test("public responses include baseline security headers", async () => {
  const response = await fetch(`${baseUrl}/index.html`);

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
});

test("booking data APIs report unavailable storage clearly", async () => {
  for (const endpoint of ["/api/services", "/api/stylists"]) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Booking data is not configured. Add DATABASE_URL to .env.",
    });
  }
});

test("availability API validates the requested date", async () => {
  const response = await fetch(`${baseUrl}/api/availability?date=not-a-date`);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please provide a valid availability date.",
  });
});

test("availability API reports unavailable storage clearly", async () => {
  const response = await fetch(`${baseUrl}/api/availability?date=2026-11-10`);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Booking data is not configured. Add DATABASE_URL to .env.",
  });
});

test("booking API rejects incomplete appointment data", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "All appointment fields are required.",
  });
});

test("booking API rejects array JSON bodies", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "[]",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "All appointment fields are required.",
  });
});

test("booking API reports malformed JSON as JSON", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{\"treatment\":",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Request body must be valid JSON.",
  });
});

test("booking API rejects malformed customer email", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2026-11-10",
      appointmentTime: "10:00",
      customerName: "Test User",
      customerEmail: "not-an-email",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please provide a valid email address.",
  });
});

test("booking API rejects malformed appointment date and time", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "10-11-2026",
      appointmentTime: "ten",
      customerName: "Test User",
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please provide a valid appointment date and time.",
  });
});

test("booking API rejects impossible calendar dates and times", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2026-02-30",
      appointmentTime: "24:00",
      customerName: "Test User",
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please provide a valid appointment date and time.",
  });
});

test("booking API rejects past appointment dates", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2020-01-01",
      appointmentTime: "10:00",
      customerName: "Test User",
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please choose a future appointment date.",
  });
});

test("booking API rejects oversized customer fields", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2026-11-10",
      appointmentTime: "10:00",
      customerName: "x".repeat(121),
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Appointment details are too long.",
  });
});

test("booking API reports unavailable storage clearly", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2026-11-10",
      appointmentTime: "10:00",
      customerName: "Test User",
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Booking storage is not configured. Add DATABASE_URL to .env.",
  });
});

test("booking API checks storage only after validating the appointment", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      treatment: "Signature cut",
      stylist: "Amelia Rose",
      appointmentDate: "2020-01-01",
      appointmentTime: "10:00",
      customerName: "Test User",
      customerEmail: "test@example.com",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please choose a future appointment date.",
  });
});

test("contact API rejects incomplete enquiries", async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test User" }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Name, email, and message are required.",
  });
});

test("contact API rejects malformed email", async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "not-an-email",
      message: "I would like to ask a question.",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Please provide a valid email address.",
  });
});

test("contact API reports unavailable storage clearly", async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      message: "I would like to ask a question.",
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Enquiry storage is not configured. Add DATABASE_URL to .env.",
  });
});
