# STUDIO 54 Completion Plan

This roadmap is intentionally gated. The website implementation should remain unchanged until the first task is approved with **GO**. Each phase is small enough to review and test independently.

## Phase 1 — Fix critical bugs and build errors

### 1. Establish a safe baseline
- [ ] **What:** Put the project under source control, capture the current baseline, and document local setup.
- **Why:** The project is currently not a Git repository, so changes cannot be reviewed or safely reverted.
- **Files:** Project root, `README.md` (only if approved).
- **Expected result:** A clean, reviewable baseline with documented start and test commands.
- **Success test:** `git status` is clean after baseline capture; `npm start` serves the homepage.

### 2. Repair text encoding and shared branding
- [ ] **What:** Normalise affected HTML files to UTF-8, fix corrupted punctuation, and align header/footer markup.
- **Why:** Visible mojibake harms trust and shared navigation currently differs by page.
- **Files:** All HTML pages, `style.css`.
- **Expected result:** Correct punctuation and one consistent public navigation/brand system.
- **Success test:** Search finds no `â`, `Â`, or `Ã`; every page has the same navigation labels and keyboard/mobile behavior.

### 3. Add baseline automated checks
- [x] **What:** Add lightweight smoke/API tests and a validation script without changing runtime behavior.
- **Why:** The project currently has no repeatable regression check.
- **Files:** `package.json`, new test files (scope to be approved).
- **Expected result:** Page response, API validation, and core behavior can be checked consistently.
- **Success test:** `npm test` passes locally and reports failures clearly.
- **Progress:** Coverage now includes incomplete data, malformed email, malformed date/time, missing storage, all public page responses, and baseline security headers.

## Phase 2 — Complete missing page content

### 4. Make public content production-ready
- [ ] **What:** Replace fictional copy, prices, team, contact, and social placeholders with approved salon content.
- **Why:** The current site explicitly contains demonstration content.
- **Files:** `index.html`, `services.html`, `about.html`, `contact.html`, `products.html`, `tutorials.html`, `gallery.html`.
- **Expected result:** Public pages accurately represent the real business.
- **Success test:** Content owner review confirms every address, price, person, link, and legal label.

### 5. Unify content data
- [x] **What:** Use database-managed services and stylists for booking and public service presentation, with an explicit demonstration fallback when storage is unavailable.
- **Why:** Duplicated values will drift between services and booking.
- **Files:** `db/schema.sql`, `server.js`, `services.html`, `booking.html`, `script.js`.
- **Expected result:** One authoritative source for services and stylists.
- **Success test:** Updating a service in the approved source changes both the public list and booking choices.
- **Progress:** The services page now consumes `/api/services` and renders the same service records used by booking. Its static demonstration list remains visible with an explicit status when database storage is unavailable; stylist choices were already database-backed.

## Phase 3 — Repair existing functionality

### 6. Improve shared interaction states
- [x] **What:** Add robust loading, error, disabled, focus, and success states to forms, menu, matcher, lightbox, and booking.
- **Why:** Current interactions are mostly client-only and do not consistently communicate state.
- **Files:** `script.js`, `style.css`, relevant HTML pages.
- **Expected result:** Users always know what happened and what to do next.
- **Success test:** Keyboard and mouse checks cover menu Escape handling, lightbox focus return, matcher upload errors, and booking/API failure states.

### 7. Repair homepage call-to-action destinations
- [x] **What:** Point service, matcher, gallery, and salon-story homepage links to their corresponding public pages.
- **Why:** Several links incorrectly sent visitors to the booking anchor instead of the content they promised.
- **Files:** `index.html`.
- **Expected result:** Homepage calls-to-action lead to the relevant page and booking remains available through the dedicated booking links.
- **Success test:** Browser navigation from each corrected CTA reaches the expected page with HTTP 200.

### 8. Polish form focus and validation states
- [x] **What:** Add visible focus rings and invalid-field styling to shared form controls and booking choices.
- **Why:** Keyboard and validation feedback should remain clear across all customer journeys.
- **Files:** `style.css`.
- **Expected result:** Focused controls and invalid values are visually distinct without changing submission behavior.
- **Success test:** Keyboard focus is visible in browser checks and existing smoke/API tests remain green.

### 9. Improve matcher feedback and local preview cleanup
- [x] **What:** Add live recommendation semantics, required guidance for matcher notes, and preview URL cleanup.
- **Why:** The local demonstration should communicate state clearly and avoid retaining temporary object URLs.
- **Files:** `matcher.html`, `script.js`.
- **Expected result:** Empty matcher notes are explained, successful feedback is announced, and temporary previews are released.
- **Success test:** Browser checks cover empty submission, valid recommendation feedback, and image preview behavior.

### 10. Improve booking progress and loading semantics
- [x] **What:** Add current-step semantics, live step-region guidance, and an accessible busy state during booking submission.
- **Why:** Customers and assistive technologies need clear progress and feedback during the multi-step flow.
- **Files:** `booking.html`, `script.js`.
- **Expected result:** The active step is announced and the submit request communicates its in-progress state.
- **Success test:** Browser checks confirm `aria-current` moves with the step and `aria-busy` is applied during submission.

### 10a. Tighten appointment date and time validation
- [x] **What:** Reject impossible calendar dates and out-of-range 24-hour times at the API boundary.
- **Why:** Regex-only validation accepts values that look shaped correctly but cannot represent real appointments.
- **Files:** `server.js`, `test/smoke.test.js`.
- **Expected result:** Invalid calendar/time values return the same clear 400 validation response.
- **Success test:** Regression tests cover malformed and impossible date/time values.

### 10b. Reject past appointment dates
- [x] **What:** Enforce a future-date rule in the appointment API.
- **Why:** Client-side `min` attributes can be bypassed by direct API requests.
- **Files:** `server.js`, `test/smoke.test.js`.
- **Expected result:** Past appointment dates return a clear 400 response before storage is attempted.
- **Success test:** Regression coverage verifies a past date is rejected.

### 10c. Limit appointment field sizes
- [x] **What:** Reject oversized appointment text fields before validation or database work.
- **Why:** Request-body limits alone do not prevent unbounded individual field values.
- **Files:** `server.js`, `test/smoke.test.js`.
- **Expected result:** Oversized customer-facing fields return a clear 400 response.
- **Success test:** Regression coverage verifies an oversized customer name is rejected.

### 10d. Guard appointment request body shape
- [x] **What:** Reject `null` and array JSON bodies before appointment field access.
- **Why:** API callers can bypass the browser and malformed bodies must produce a controlled validation response.
- **Files:** `server.js`, `test/smoke.test.js`.
- **Expected result:** Non-object bodies return the required-fields 400 response without a server exception.
- **Success test:** Regression coverage verifies a JSON array body is rejected.

### 10e. Normalize malformed appointment JSON errors
- [x] **What:** Return a JSON 400 response when the appointment endpoint receives malformed JSON.
- **Why:** API consumers should receive a consistent machine-readable error instead of Express’s HTML parser page.
- **Files:** `server.js`, `test/smoke.test.js`.
- **Expected result:** Malformed appointment JSON produces a clear JSON error without affecting valid requests.
- **Success test:** Regression coverage verifies malformed JSON returns HTTP 400 and the documented error shape.

### 11. Complete the contact workflow
- [x] **What:** Add a server-side contact endpoint with validation and PostgreSQL persistence.
- **Why:** Enquiries need a reliable server-side path and must not show success when storage is unavailable.
- **Files:** `contact.html`, `script.js`, `server.js`, `db/schema.sql` if persistence is approved.
- **Expected result:** Enquiries are safely accepted, acknowledged, and operationally retrievable.
- **Success test:** Valid and invalid requests produce correct responses; no success is shown when delivery fails.
- **Progress:** Added `POST /api/contact`, field/email/length validation, a `contact_enquiries` table, and client-side busy/error states. Missing `DATABASE_URL` returns an explicit 503.

## Phase 4 — Finish the appointment booking system

### 12. Add database-backed services, stylists, and availability
- [x] **What:** Add API reads for active services, stylists, and available slots.
- **Why:** Static choices do not represent real availability.
- **Files:** `db/schema.sql`, `server.js`, `booking.html`, `script.js`.
- **Expected result:** The booking UI reflects current server-side services, stylists, and availability.
- **Success test:** Changing availability in the database changes the displayed slots without editing HTML.
- **Progress:** Added `treatments`, active `stylists`, and `availability_slots` reads, database schema/indexes, dynamic booking choices, and explicit unavailable-storage messaging. Working hours and closure rules remain part of the future scheduling expansion.

### 9. Prevent duplicate and invalid bookings
- [x] **What:** Add transaction-safe conflict checks, a database constraint, past-date checks, and availability validation.
- **Why:** The current index does not prevent duplicate appointments.
- **Files:** `db/schema.sql`, `server.js`.
- **Expected result:** A slot can only be booked when it is valid and still free.
- **Success test:** Concurrent and repeated booking attempts return one success and one clear conflict response.
- **Progress:** Added an active-slot unique index, availability membership check, and explicit HTTP 409 responses for stale or concurrently claimed slots. Database-backed concurrency tests require a configured PostgreSQL environment.
- **Progress:** Availability reads now omit non-cancelled appointment conflicts before the customer selects a time; the database constraint and submit-time conflict response remain the final race-safe guard.
- **Progress:** Client availability rendering now ignores late responses for previous date selections, preventing stale mobile-network responses from replacing the current date's slots.
- **Progress:** Dynamic booking grids now expose `aria-busy` while services, stylists, or date-specific availability are loading.
- **Progress:** Clearing a booking date now invalidates in-flight availability work and removes previously rendered time choices.

### 10. Add confirmation and booking management states
- [x] **What:** Return a stable confirmation reference and expose requested/confirmed/cancelled status handling.
- **Why:** The current “request received” message does not confirm availability or provide a useful reference.
- **Files:** `booking.html`, `script.js`, `server.js`, `db/schema.sql`.
- **Expected result:** Customers receive an accurate state and reference; staff can update it.
- **Success test:** A full booking request can be traced from submission through status change.
- **Progress:** Appointments now receive a unique `ST54-XXXXXXXX` reference and return their current status, date, and time. The customer confirmation step distinguishes a pending request from confirmed availability; staff status-management UI remains part of the future admin surface.

## Phase 5 — Complete planned AI and staff features

### 11. Decide the matcher scope and privacy model
- [x] **What:** Use a transparent preference-based consultation tool rather than an unapproved AI provider integration.
- **Why:** The current page is not AI and must not imply analysis that does not happen.
- **Files:** `matcher.html`, `script.js`, `server.js` if server integration is approved, privacy documentation.
- **Expected result:** Recommendations are technically honest, useful, and privacy-compliant.
- **Success test:** Upload, rejection, loading, success, failure, deletion, and privacy messaging are tested.
- **Progress:** Reframed the public experience as Style Consultation across navigation and metadata. The page now states that it uses preferences only, keeps previews local, and does not upload or store images.

### 12. Add secure staff administration
- [ ] **What:** Implement authentication, authorisation, sessions, protected routes, and staff views for services, stylists, availability, bookings, and gallery content.
- **Why:** No staff surface currently exists.
- **Files:** `server.js`, `db/schema.sql`, new approved admin files, `.env.example`, `package.json` only if a required dependency is approved.
- **Expected result:** Only authorised staff can manage salon operations.
- **Success test:** Unauthenticated, under-authorised, valid, expired-session, and logout cases are covered.

## Phase 6 — Improve responsive layout and accessibility

### 13. Run a complete responsive/accessibility pass
- [x] **What:** Test and refine desktop, tablet, mobile, keyboard navigation, focus visibility, lightbox focus return, reduced motion, labels, errors, and contrast.
- **Why:** The current foundation is good but has known focus and consistency gaps.
- **Files:** `style.css`, `script.js`, all HTML pages.
- **Expected result:** Consistent and usable experience across supported devices and assistive technologies.
- **Success test:** Keyboard checks cover gallery filters/lightbox and mobile menu; reduced-motion support is present; remaining contrast and full-flow findings are documented for the final QA pass.

## Phase 7 — Optimise performance and SEO

### 14. Optimise assets, metadata, and delivery
- [x] **What:** Add image dimensions/responsive sources, reduce third-party dependence, consolidate font loading, and improve page metadata/security headers.
- **Progress:** Font loading has been consolidated to one shared Google Fonts stylesheet per page, and all public pages now have page-specific meta descriptions; image hosting and richer metadata remain.
- **Progress:** Baseline `nosniff`, clickjacking, referrer, and permissions headers are now sent by the Express server.
- **Progress:** A resource-scoped Content Security Policy now limits scripts, styles, fonts, images, connections, forms, frames, and objects to the site’s required sources.
- **Progress:** The local hero asset now declares intrinsic dimensions and asynchronous decoding to reduce layout shift.
- **Progress:** The above-the-fold hero image now declares high fetch priority; remote editorial images retain lazy loading because their intrinsic dimensions are not locally verifiable and self-hosting is still pending.
- **Progress:** All public pages now expose consistent theme-color, Open Graph title/description/type, and Twitter card metadata without inventing a production domain or social image.
- **Progress:** Added `robots.txt` to allow public pages while excluding `/api/` and `/healthz`; a production sitemap remains intentionally deferred until the real domain is approved.
- **Why:** Remote images and duplicate font declarations can affect loading and layout stability.
- **Files:** HTML pages, `style.css`, `server.js`, `assets/`.
- **Expected result:** Faster, more stable, shareable pages with safer delivery defaults.
- **Success test:** Lighthouse-style checks show no critical performance/SEO/accessibility regressions; no image causes avoidable layout shift.

## Phase 8 — Final testing and quality assurance

### 15. Execute end-to-end QA
- [x] **What:** Test every page, internal link, form surface, booking path, matcher path, and API error path.
- **Why:** Individual pieces can pass while the complete journey fails.
- **Files:** Test suite and all touched application files.
- **Expected result:** A documented release candidate with known limitations.
- **Success test:** Test report is green or every failure has an owner and approved disposition.
- **Progress:** Browser sweep verified all nine pages, shared navigation, landmarks, descriptions, social metadata, matcher privacy copy, and health output. Smoke coverage now verifies every internal `.html` link. Database-backed success/conflict flows and protected staff routes remain blocked by missing production infrastructure/features.
- **Progress:** Mobile QA at 390px verified the menu open/close state, Escape handling, focus return, and contained hero image; customer email fields now share consistent autofill and server-aligned length metadata.
- **Progress:** The homepage email capture now routes into the real booking journey and pre-fills the booking email through session storage, avoiding email exposure in the URL or browser history.
- **Progress:** The booking completion copy now accurately describes a request pending house confirmation rather than using outdated demonstration wording.

## Phase 9 — Prepare for deployment

### 16. Document operations and deployment
- [x] **What:** Document environment variables, migrations, backups, logs, monitoring, rollback, and deployment steps.
- **Why:** A working local prototype is not enough for a reliable salon service.
- **Files:** `.env.example`, deployment documentation, `server.js`, database migration files.
- **Expected result:** Another developer can deploy and operate the site without guessing.
- **Success test:** Fresh-environment deployment rehearsal succeeds and secrets are not committed.
- **Progress:** Added `DEPLOYMENT.md`, a placeholder-only `.env.example`, additive schema instructions, backup/rollback guidance, and a `/healthz` readiness endpoint with regression coverage. A real production rehearsal still requires an approved hosting provider and PostgreSQL instance.

## Recommended execution order

Start with tasks **1–3**, then **8–10** for the booking foundation. Do not build staff administration or a paid/third-party AI integration until the data model, privacy decision, and public booking contract are approved. After each task, run its stated success test and wait for the next **GO** before starting the following task.
