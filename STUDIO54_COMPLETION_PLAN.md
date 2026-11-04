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

## Phase 2 — Complete missing page content

### 4. Make public content production-ready
- [ ] **What:** Replace fictional copy, prices, team, contact, and social placeholders with approved salon content.
- **Why:** The current site explicitly contains demonstration content.
- **Files:** `index.html`, `services.html`, `about.html`, `contact.html`, `products.html`, `tutorials.html`, `gallery.html`.
- **Expected result:** Public pages accurately represent the real business.
- **Success test:** Content owner review confirms every address, price, person, link, and legal label.

### 5. Unify content data
- [ ] **What:** Decide which content should be database-managed and remove duplicated hard-coded service/stylist data.
- **Why:** Duplicated values will drift between services and booking.
- **Files:** `db/schema.sql`, `server.js`, `services.html`, `booking.html`, `script.js`.
- **Expected result:** One authoritative source for services and stylists.
- **Success test:** Updating a service in the approved source changes both the public list and booking choices.

## Phase 3 — Repair existing functionality

### 6. Improve shared interaction states
- [x] **What:** Add robust loading, error, disabled, focus, and success states to forms, menu, matcher, lightbox, and booking.
- **Why:** Current interactions are mostly client-only and do not consistently communicate state.
- **Files:** `script.js`, `style.css`, relevant HTML pages.
- **Expected result:** Users always know what happened and what to do next.
- **Success test:** Keyboard and mouse checks cover menu Escape handling, lightbox focus return, matcher upload errors, and booking/API failure states.

### 7. Complete the contact workflow
- [ ] **What:** Add a server-side contact endpoint with validation and an approved delivery/storage method.
- **Why:** The current contact form only resets locally and does not contact the salon.
- **Files:** `contact.html`, `script.js`, `server.js`, `db/schema.sql` if persistence is approved.
- **Expected result:** Enquiries are safely accepted, acknowledged, and operationally retrievable.
- **Success test:** Valid and invalid requests produce correct responses; no success is shown when delivery fails.

## Phase 4 — Finish the appointment booking system

### 8. Add database-backed services, stylists, and availability
- [ ] **What:** Add API reads for active services, stylists, working hours, closures, and available slots.
- **Why:** Static choices do not represent real availability.
- **Files:** `db/schema.sql`, `server.js`, `booking.html`, `script.js`.
- **Expected result:** The booking UI reflects current server-side availability.
- **Success test:** Changing availability in the database changes the displayed slots without editing HTML.

### 9. Prevent duplicate and invalid bookings
- [ ] **What:** Add transaction-safe conflict checks, database constraints, past-date checks, and business-rule validation.
- **Why:** The current index does not prevent duplicate appointments.
- **Files:** `db/schema.sql`, `server.js`.
- **Expected result:** A slot can only be booked when it is valid and still free.
- **Success test:** Concurrent and repeated booking attempts return one success and one clear conflict response.

### 10. Add confirmation and booking management states
- [ ] **What:** Return a stable confirmation reference and implement requested/confirmed/cancelled handling.
- **Why:** The current “request received” message does not confirm availability or provide a useful reference.
- **Files:** `booking.html`, `script.js`, `server.js`, `db/schema.sql`.
- **Expected result:** Customers receive an accurate state and reference; staff can update it.
- **Success test:** A full booking request can be traced from submission through status change.

## Phase 5 — Complete planned AI and staff features

### 11. Decide the matcher scope and privacy model
- [ ] **What:** Choose between a transparent preference-based consultation tool and an approved AI provider integration.
- **Why:** The current page is not AI and must not imply analysis that does not happen.
- **Files:** `matcher.html`, `script.js`, `server.js` if server integration is approved, privacy documentation.
- **Expected result:** Recommendations are technically honest, useful, and privacy-compliant.
- **Success test:** Upload, rejection, loading, success, failure, deletion, and privacy messaging are tested.

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
- [ ] **What:** Add image dimensions/responsive sources, reduce third-party dependence, consolidate font loading, and improve page metadata/security headers.
- **Progress:** Font loading has been consolidated to one shared Google Fonts stylesheet per page; image hosting, metadata, and security headers remain.
- **Progress:** Baseline `nosniff`, clickjacking, referrer, and permissions headers are now sent by the Express server.
- **Why:** Remote images and duplicate font declarations can affect loading and layout stability.
- **Files:** HTML pages, `style.css`, `server.js`, `assets/`.
- **Expected result:** Faster, more stable, shareable pages with safer delivery defaults.
- **Success test:** Lighthouse-style checks show no critical performance/SEO/accessibility regressions; no image causes avoidable layout shift.

## Phase 8 — Final testing and quality assurance

### 15. Execute end-to-end QA
- [ ] **What:** Test every page, link, form, booking path, matcher path, API error, database conflict, and protected staff route.
- **Why:** Individual pieces can pass while the complete journey fails.
- **Files:** Test suite and all touched application files.
- **Expected result:** A documented release candidate with known limitations.
- **Success test:** Test report is green or every failure has an owner and approved disposition.

## Phase 9 — Prepare for deployment

### 16. Document operations and deployment
- [ ] **What:** Document environment variables, migrations, backups, logs, monitoring, rollback, and deployment steps.
- **Why:** A working local prototype is not enough for a reliable salon service.
- **Files:** `.env.example`, deployment documentation, `server.js`, database migration files.
- **Expected result:** Another developer can deploy and operate the site without guessing.
- **Success test:** Fresh-environment deployment rehearsal succeeds and secrets are not committed.

## Recommended execution order

Start with tasks **1–3**, then **8–10** for the booking foundation. Do not build staff administration or a paid/third-party AI integration until the data model, privacy decision, and public booking contract are approved. After each task, run its stated success test and wait for the next **GO** before starting the following task.
