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

test("mobile navigation closes when focus moves outside the menu", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /navigation\.classList\.contains\("is-open"\)/);
  assert.match(script, /!navigation\.contains\(event\.target\)/);
  assert.match(script, /!menuToggle\.contains\(event\.target\)/);
  assert.match(script, /closeMenu\(\);\s*\n\s*}\s*\n\s*}\);\s*\n}/);
});

test("shared navigation marks the current page", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /window\.location\.pathname\.split\("\/"\)\.pop\(\) \|\| "index\.html"/);
  assert.match(script, /link\.setAttribute\("aria-current", "page"\)/);
});

test("gallery filters announce the visible result count", async () => {
  const gallery = await (await fetch(`${baseUrl}/gallery.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(gallery, /class="gallery-filter-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(script, /galleryFilterStatus && \(galleryFilterStatus\.textContent =/);
  assert.match(script, /updateGalleryFilterStatus\(category, filter\.textContent\.trim\(\)\)/);
});

test("gallery filters identify the gallery they control", async () => {
  const gallery = await (await fetch(`${baseUrl}/gallery.html`)).text();

  assert.match(gallery, /aria-controls="editorial-gallery"/);
  assert.match(gallery, /class="editorial-grid" id="editorial-gallery"/);
});

test("gallery lightbox synchronizes its dialog visibility", async () => {
  const gallery = await (await fetch(`${baseUrl}/gallery.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(gallery, /id="gallery-lightbox" class="lightbox" role="dialog"/);
  assert.match(script, /image\.setAttribute\("aria-controls", "gallery-lightbox"\)/);
  assert.match(script, /image\.setAttribute\("aria-haspopup", "dialog"\)/);
  assert.match(script, /document\.body\.classList\.add\("lightbox-open"\)/);
  assert.match(script, /document\.body\.classList\.remove\("lightbox-open"\)/);
  assert.match(script, /image\.setAttribute\("aria-expanded", "false"\)/);
  assert.match(script, /image\.setAttribute\("aria-expanded", "true"\)/);
  assert.match(script, /lightboxTrigger\?\.setAttribute\("aria-expanded", "false"\)/);
  assert.match(gallery, /role="dialog" aria-modal="true" aria-hidden="true"/);
  assert.match(script, /lightbox\.setAttribute\("aria-hidden", "false"\)/);
  assert.match(script, /lightbox\?\.setAttribute\("aria-hidden", "true"\)/);
});

test("gallery lightbox names the open image", async () => {
  const gallery = await (await fetch(`${baseUrl}/gallery.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(gallery, /aria-describedby="lightbox-image"/);
  assert.match(gallery, /<img id="lightbox-image" src="" alt="">/);
  assert.match(script, /lightbox\.setAttribute\("aria-label", `Enlarged gallery image: \$\{image\.alt\}`\)/);
  assert.match(script, /lightbox\?\.setAttribute\("aria-label", "Enlarged gallery image"\)/);
});

test("homepage booking capture has an explicit email label", async () => {
  const homepage = await (await fetch(`${baseUrl}/index.html`)).text();

  assert.match(homepage, /<label for="booking-email">Start with your email<\/label>/);
  assert.match(homepage, /id="booking-email"[^>]+inputmode="email"[^>]+enterkeyhint="next"/);
  assert.doesNotMatch(homepage, /class="visually-hidden" for="booking-email"/);
});

test("homepage booking handoff prevents duplicate submissions", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /submitButton\.disabled = true/);
  assert.match(script, /submitButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(script, /submitButton\.setAttribute\("aria-label", "Opening booking journey"\)/);
  assert.match(script, /submitButton\.textContent = "Opening booking\.\.\."/);
});

test("homepage booking feedback is linked to the email field", async () => {
  const homepage = await (await fetch(`${baseUrl}/index.html`)).text();

  assert.match(homepage, /id="booking-email"[^>]+aria-describedby="booking-form-message"/);
  assert.match(homepage, /class="form-message" id="booking-form-message" role="status" aria-live="polite" aria-atomic="true"/);
});

test("homepage booking email feedback clears and marks invalid input", async () => {
  const styles = await (await fetch(`${baseUrl}/style.css`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(styles, /\.form-row input\[aria-invalid="true"\]/);
  assert.match(script, /bookingEmailInput\?\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(script, /bookingEmailInput\?\.setAttribute\("aria-errormessage", "booking-form-message"\)/);
  assert.match(script, /bookingEmailInput\?\.focus\(\)/);
  assert.match(script, /bookingEmailInput\.removeAttribute\("aria-invalid"\)/);
  assert.match(script, /bookingEmailInput\.removeAttribute\("aria-errormessage"\)/);
  assert.match(script, /formMessage\.textContent = ""/);
  assert.match(script, /bookingEmailInput\?\.addEventListener\("invalid"/);
});

test("contact form exposes linked sending feedback", async () => {
  const contact = await (await fetch(`${baseUrl}/contact.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(contact, /class="contact-form" aria-describedby="contact-form-status"/);
  assert.match(contact, /class="form-status" id="contact-form-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(script, /button\.setAttribute\("aria-label", "Sending enquiry"\)/);
  assert.match(script, /button\.textContent = "Sending enquiry\.\.\."/);
});

test("contact form exposes recoverable native validation feedback", async () => {
  const styles = await (await fetch(`${baseUrl}/style.css`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(styles, /\.contact-form input\[aria-invalid="true"\]/);
  assert.match(script, /form\.addEventListener\("invalid", \(event\) =>/);
  assert.match(script, /field\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(script, /field\.setAttribute\("aria-errormessage", "contact-form-status"\)/);
  assert.match(script, /field\.removeAttribute\("aria-invalid"\)/);
  assert.match(script, /field\.removeAttribute\("aria-errormessage"\)/);
  assert.match(script, /Please complete the highlighted field/);
});

test("style consultation feedback regions announce updates", async () => {
  const matcher = await (await fetch(`${baseUrl}/matcher.html`)).text();

  assert.match(matcher, /class="recommendation" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(matcher, /class="upload-preview" aria-live="polite"/);
});

test("style consultation notes expose linked validation feedback", async () => {
  const matcher = await (await fetch(`${baseUrl}/matcher.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();
  const styles = await (await fetch(`${baseUrl}/style.css`)).text();

  assert.match(matcher, /id="style-notes" aria-describedby="matcher-notes-error"/);
  assert.match(matcher, /id="matcher-notes-error" role="status" aria-live="polite"/);
  assert.match(script, /notes\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(script, /matcherNotesError\) matcherNotesError\.textContent = ""/);
  assert.match(styles, /\.matcher-panel textarea\[aria-invalid="true"\]/);
});

test("style consultation upload errors expose recovery state", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();
  const styles = await (await fetch(`${baseUrl}/style.css`)).text();

  assert.match(script, /uploadPreview\.querySelector\("img"\)\?\.remove\(\)/);
  assert.match(script, /uploadPreview\.prepend\(image\)/);
  assert.match(script, /uploadMessage\(/);
  assert.match(script, /message\.setAttribute\("aria-atomic", "true"\)/);
  assert.match(script, /matcherUpload\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(script, /matcherUpload\.removeAttribute\("aria-invalid"\)/);
  assert.match(styles, /\.matcher-panel input\[type="file"\]\[aria-invalid="true"\]/);
});

test("booking completion copy describes a pending request", async () => {
  const markup = await (await fetch(`${baseUrl}/booking.html`)).text();

  assert.match(markup, /pending confirmation from the house/);
  assert.doesNotMatch(markup, /does not confirm availability/);
});

test("booking submission restores its action label after an error", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /button\.textContent = "Send booking request →"/);
  assert.doesNotMatch(script, /button\.textContent = "Review request →"/);
});

test("booking validation errors use atomic live regions", async () => {
  const booking = await (await fetch(`${baseUrl}/booking.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(booking, /class="booking-error" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(script, /error\.setAttribute\("role", "status"\)/);
  assert.match(script, /error\.setAttribute\("aria-atomic", "true"\)/);
});

test("booking availability feedback is atomic", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /status\.setAttribute\("aria-atomic", "true"\)/);
});

test("robots policy keeps operational endpoints out of search", async () => {
  const response = await fetch(`${baseUrl}/robots.txt`);
  const robots = await response.text();

  assert.equal(response.status, 200);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/healthz/);
});

test("internal HTML links resolve successfully", async () => {
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
  const internalLinks = new Set();

  for (const page of pages) {
    const markup = await (await fetch(`${baseUrl}/${page}`)).text();
    for (const match of markup.matchAll(/href="([^"#?]+\.html)"/gi)) {
      internalLinks.add(match[1]);
    }
  }

  for (const target of internalLinks) {
    const response = await fetch(`${baseUrl}/${target}`);
    assert.equal(response.status, 200, `${target} should resolve successfully`);
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

test("health endpoint reports application readiness", async () => {
  const response = await fetch(`${baseUrl}/healthz`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    databaseConfigured: false,
  });
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

test("services page preserves a visible fallback when live data is unavailable", async () => {
  const response = await fetch(`${baseUrl}/services.html`);
  const markup = await response.text();

  assert.equal(response.status, 200);
  assert.match(markup, /data-services-list/);
  assert.match(markup, /Signature cut/);
});

test("customer forms expose autofill hints and server-aligned limits", async () => {
  const [homeMarkup, bookingMarkup, contactMarkup] = await Promise.all([
    (await fetch(`${baseUrl}/index.html`)).text(),
    (await fetch(`${baseUrl}/booking.html`)).text(),
    (await fetch(`${baseUrl}/contact.html`)).text(),
  ]);

  assert.match(homeMarkup, /id="booking-email"[^>]+autocomplete="email"[^>]+maxlength="254"/);
  assert.match(bookingMarkup, /name="customerName"[^>]+autocomplete="name"[^>]+maxlength="120"/);
  assert.match(bookingMarkup, /name="customerEmail"[^>]+autocomplete="email"[^>]+maxlength="254"/);
  assert.match(contactMarkup, /name="name"[^>]+autocomplete="name"[^>]+maxlength="120"/);
  assert.match(contactMarkup, /name="email"[^>]+autocomplete="email"[^>]+maxlength="254"/);
});

test("homepage booking form routes into the real booking journey", async () => {
  const markup = await (await fetch(`${baseUrl}/index.html`)).text();
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(markup, /id="booking-form"/);
  assert.match(script, /sessionStorage\.setItem\("studio54\.bookingEmail"/);
  assert.match(script, /window\.location\.href = "booking\.html"/);
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

test("availability query excludes active appointment conflicts", async () => {
  const source = await (await fetch(`${baseUrl}/server.js`)).text();

  assert.match(source, /NOT EXISTS\s*\(\s*SELECT 1\s+FROM appointments/);
  assert.match(source, /status <> 'cancelled'/);
});

test("booking availability guards against stale responses", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /availabilityRequestId/);
  assert.match(script, /bookingDate\.value !== requestedDate/);
});

test("booking loading states expose aria-busy semantics", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /setAttribute\("aria-busy", "true"\)/);
  assert.match(script, /setAttribute\("aria-busy", "false"\)/);
});

test("booking hides inactive steps from assistive technology", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();
  const booking = await (await fetch(`${baseUrl}/booking.html`)).text();

  assert.match(script, /item\.setAttribute\("aria-hidden", String\(!isActive\)\)/);
  assert.match(script, /item\.setAttribute\("aria-live", isActive \? "polite" : "off"\)/);
  assert.match(script, /showBookingStep\(currentStep\);\s*document\.querySelectorAll\("\[data-next-step\]/);
  assert.match(booking, /class="step-indicator" role="list" aria-label="Booking progress"/);
  assert.match(booking, /role="listitem" aria-current="step"/);
});

test("booking date guidance describes the available-time picker", async () => {
  const booking = await (await fetch(`${baseUrl}/booking.html`)).text();

  assert.match(booking, /aria-describedby="booking-date-hint"/);
  assert.match(booking, /id="available-times" role="group" aria-label="Available appointment times"/);
});

test("booking panels have explicit accessible names", async () => {
  const booking = await (await fetch(`${baseUrl}/booking.html`)).text();

  assert.match(booking, /aria-labelledby="booking-treatment-heading"/);
  assert.match(booking, /aria-labelledby="booking-stylist-heading"/);
  assert.match(booking, /aria-labelledby="booking-date-heading"/);
  assert.match(booking, /aria-labelledby="booking-details-heading"/);
  assert.match(booking, /aria-labelledby="booking-confirmation-heading"/);
});

test("booking choices announce the selected option", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /booking-selection-status visually-hidden/);
  assert.match(script, /status\.textContent = `\$\{value\} selected\.`/);
  assert.match(script, /announceBookingSelection\(choice\.parentElement, selectedValue\)/);
});

test("clearing the booking date invalidates availability work", async () => {
  const script = await (await fetch(`${baseUrl}/script.js`)).text();

  assert.match(script, /const requestId = \+\+availabilityRequestId;\s*if \(!timeGrid \|\| !bookingDate\.value\)/);
  assert.match(script, /timeGrid\?\.replaceChildren\(\)/);
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
