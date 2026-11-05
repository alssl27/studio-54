# STUDIO 54 Website Audit

**Audit date:** 4 November 2026  
**Scope:** Read-only audit of the existing project before implementation work.

## Executive summary

STUDIO 54 is a small, server-rendered/static HTML salon site with a shared CSS file, one shared browser JavaScript file, an Express server, and a PostgreSQL schema. The public-facing experience is present across the planned marketing pages and has a coherent editorial salon direction. The current implementation is best described as a polished prototype rather than a production booking platform: the booking UI is multi-step, but availability is hard-coded and the API cannot be used without database configuration; the AI matcher is explicitly a local demonstration; and no staff administration or authentication surface exists.

The visual refresh already present in the working files has been preserved. The audit was initially read-only; the separately approved baseline and encoding/navigation tasks have since been completed and are recorded in the completion plan.

## 1. Project overview and technology stack

| Area | Current implementation | Assessment |
|---|---|---|
| Front end | Nine standalone HTML pages | Functional static-site approach; repeated header/footer markup creates consistency and maintenance risk |
| Styling | `style.css` with responsive media queries and shared components | Broad coverage; needs a focused accessibility/consistency pass |
| Client behavior | `script.js` with vanilla DOM event handlers | Functional for demonstrations; lacks robust state, error, and focus management |
| Server | Express in `server.js`, static file serving, one POST API | Minimal API foundation; no authentication, availability endpoints, or admin routes |
| Database | PostgreSQL schema in `db/schema.sql` | Treatments, stylists, and appointments exist; schema does not yet enforce schedule/business rules |
| Dependencies | `express`, `pg`, `dotenv` | Small and appropriate; no test, lint, or build tooling is configured |
| Assets | One local hero image plus remote Unsplash images | Hero is local; most content images depend on third-party network availability |

The project folder is **not a Git repository** (`git status` returns “not a git repository”), so there is no commit history or worktree diff available for change protection.

## 2. Complete page inventory

| Page | Purpose | Current state |
|---|---|---|
| `index.html` | Homepage, hero, services teaser, matcher teaser, gallery teaser, booking CTA | Present; primary marketing page |
| `services.html` | Services and prices | Present; static price list |
| `gallery.html` | Portfolio with category filters and lightbox | Present; client-side demo works |
| `matcher.html` | Preference-based style consultation | Present; explicitly not AI-powered |
| `booking.html` | Four-step appointment request flow | Present; availability and choices are static |
| `about.html` | Salon story and team | Present; fictional content |
| `contact.html` | Contact details and enquiry form | Present; submits to the validated contact API |
| `products.html` | Product editorial cards | Present; no commerce or stock workflow |
| `tutorials.html` | Editorial tutorial cards | Present; content is static |

All nine pages were opened through the running Express server and returned HTTP 200 with a page title and primary heading.

## 3. Existing functional features

- Shared skip link and responsive menu toggle are present across pages.
- Client-side navigation links connect the public pages.
- Homepage hero and CTAs are present in `index.html`.
- Services and price content is rendered in `services.html`.
- Gallery category filters toggle `[data-category]` items in `script.js`.
- Gallery images open in a lightbox by click or keyboard activation.
- Matcher accepts an image file, validates that it is an image, previews it locally, and displays a static recommendation.
- Booking flow validates required selections, date, name, and email before attempting the API request.
- Booking API validates required strings, basic email format, and date/time formats.
- Contact form displays a client-side acknowledgement and resets.
- PostgreSQL queries use parameter placeholders rather than string concatenation.
- Images have useful alternative text on the reviewed pages and most content images use lazy loading.

## 4. Incomplete features

### High priority

1. **Booking storage is not configured by default.** `server.js` returns HTTP 503 when `DATABASE_URL` is absent. The live probe confirmed this behavior.
2. **Booking availability requires configured scheduling data.** The booking UI now reads services, active stylists, and date-specific slots from the API; without database configuration it clearly reports that booking data is unavailable.
3. **Booking conflicts are now blocked at the API and database layers.** Active appointments use a unique date/time index, and stale availability requests return a conflict response.
4. **Booking lifecycle is request-based pending staff operations.** New appointments now receive a stable reference and status; confirmation email, cancellation, rescheduling, and staff status management remain future operational work.
5. **The style consultation is intentionally preference-based, not AI-powered.** `matcher.html` explains that images remain local and are not uploaded or stored.

### Medium priority

6. Contact enquiries now persist through `POST /api/contact` when database storage is configured.
7. Treatments, stylists, and booking availability are now read from database-backed APIs; the public services page also consumes the treatments API and explicitly labels its demonstration fallback when storage is unavailable.
8. The footer and branding are not fully consistent across pages; some pages still use the older `studio 54` brand markup while the homepage has the newer lockup.
9. Page content, prices, team data, products, and tutorials are static and cannot be managed without editing files.

## 5. Missing planned features

The following requirements are not implemented:

- Secure staff login and session management.
- Staff dashboard.
- CRUD management for treatments, prices, stylists, gallery items, and availability.
- Staff booking list with status changes.
- Appointment availability rules, working hours, closures, and stylist-specific schedules.
- Duplicate/conflict prevention at the database and service layers.
- Customer booking confirmation and notification flow.
- Real AI/face-shape/hairstyle analysis integration.
- Uploaded-photo retention policy, deletion workflow, and server-side privacy controls.
- Server-side contact enquiry handling.
- Automated tests, linting, accessibility testing, and production build checks.

No admin page or authentication route exists in the current file inventory.

## 6. Bugs and technical problems

| Priority | Problem | Files affected | Intended fix |
|---|---|---|---|
| Critical | No Git repository is available for safe change tracking | Project root | Initialise/use source control before implementation; do not overwrite existing work |
| Critical | Booking POST returns 503 without `DATABASE_URL` | `server.js`, `.env.example` | Configure deployment secrets, add startup validation, and provide a tested database migration/setup path |
| High | Existing production data must be checked before applying the active-slot unique index | `server.js`, `db/schema.sql` | Reconcile any duplicate non-cancelled appointments before migration |
| High | Booking availability depends on configured scheduling data | `booking.html`, `script.js`, `server.js`, `db/schema.sql` | Populate and maintain availability slots, then add server-side conflict validation |
| High | No authentication or authorization for staff features | No current implementation | Add a separately scoped staff surface with secure password/session handling |
| High | No AI analysis is performed by the style consultation | `matcher.html`, `script.js` | Keep the transparent preference-based scope unless an approved provider and privacy model are introduced |
| Medium | Contact enquiry delivery depends on configured database storage | `contact.html`, `script.js`, `server.js`, `db/schema.sql` | Configure `DATABASE_URL` and operationally monitor persisted enquiries |
| Medium | Character encoding is visibly corrupted in several pages (`â€™`, `â†’`, `Â£`, `Ã—`) | `index.html`, `about.html`, `booking.html`, `contact.html`, `gallery.html`, `services.html`, `matcher.html` | Normalise files to UTF-8 and replace corrupted entities with valid HTML entities or UTF-8 characters |
| Medium | Shared header/footer markup has drifted between pages | All HTML pages | Extract a rendering strategy or apply a controlled shared navigation update |
| Low | Remote Unsplash images create third-party availability and privacy/performance dependency | Most HTML pages | Optimise and self-host approved production imagery, with responsive `srcset`/dimensions |
| Low | No configured test/lint/build scripts | `package.json` | Add lightweight project-appropriate checks after functionality scope is approved |

## 7. Design and responsiveness issues

- The homepage now follows the supplied reference direction, but inner pages still contain legacy brand/header markup and can feel visually inconsistent.
- Repeated full-page markup makes it easy for navigation labels, logo treatments, and footer content to diverge.
- Typography is loaded from Google Fonts in HTML and again via CSS import; this duplicates font-loading responsibility.
- The mobile menu requires careful regression testing because navigation visibility is controlled by both base rules and media-query overrides.
- Form controls and choice cards need a complete keyboard, focus, error, and disabled-state review.
- The lightbox opens correctly, but focus is not returned to the triggering image and focus is not trapped while open.
- Images generally have alt text, but fixed image dimensions/aspect-ratio reservation should be added to reduce layout shift.
- The map is a labelled placeholder rather than an embedded map or verified location experience.
- Footer social links currently point to `#home`, which is not a real social destination.
- The site presents fictional address, prices, contact details, and team content; production launch must replace or clearly retain those labels.

## 8. Security, privacy, and accessibility issues

### Security/privacy

- No staff authentication, authorisation, session management, CSRF protection, rate limiting, or audit logging exists.
- The appointment endpoint is public and has no abuse/rate controls.
- Appointment data is accepted and stored as free text; business validation is minimal.
- Uploaded matcher images are kept in a browser object URL for the current page only, which is safer than uploading them, but the privacy statement should remain explicit and the object URL should be revoked after replacement.
- External image/font hosts are third-party dependencies and should be reviewed for production privacy policy/CSP implications.
- Database credentials are represented in `.env.example`, but production secret handling and startup checks are not documented.

### Accessibility

- Positive: semantic headings, labels, skip links, alt text, keyboard lightbox activation, and `aria-live` status regions are present.
- Needs work: lightbox focus trap/return, visible error association, complete keyboard semantics for all interactive choices, reduced-motion support, stronger colour contrast verification, and consistent page-level landmark/navigation naming.
- The booking date and time controls should expose unavailable states rather than presenting all hard-coded slots as available.

## 9. Recommended improvements

1. Establish source control and a repeatable local setup before modifying application behavior.
2. Fix encoding and shared navigation/branding consistency first because these affect every page.
3. Make booking data-driven: database-backed treatments, stylists, availability, conflict checks, and clear confirmation states.
4. Add a minimal, secure staff workflow only after the public booking contract is defined.
5. Decide the matcher product boundary: approved AI integration with a privacy model, or a clearly labelled consultation quiz.
6. Add server-side contact handling and remove success-shaped client-only fallbacks.
7. Add automated smoke tests for page responses, API validation, booking conflicts, and core client flows.
8. Optimise images, remove duplicate font loading, add security headers, and document deployment variables.
9. Run accessibility and responsive checks at desktop, tablet, and mobile breakpoints before launch.

## 10. Prioritised project completion checklist

- [x] **Critical:** Establish Git/source control and capture a baseline.
- [ ] **Critical:** Configure and migrate PostgreSQL safely (requires deployment infrastructure).
- [x] **High:** Replace hard-coded booking availability with a validated API.
- [x] **High:** Prevent duplicate/conflicting bookings.
- [x] **High:** Add booking confirmation and operational status handling.
- [x] **High:** Decide and implement the matcher scope with privacy controls.
- [ ] **High:** Define and implement secure staff authentication/authorisation.
- [ ] **Medium:** Add staff management for services, stylists, availability, bookings, and gallery content.
- [x] **Medium:** Repair encoding and unify shared branding/navigation/footer.
- [x] **Medium:** Implement server-side contact enquiries.
- [x] **Medium:** Add automated tests, linting, and accessibility checks (automated tests and browser QA completed; no lint tool configured).
- [ ] **Low:** Optimise/self-host production images and consolidate font loading (font loading complete; remote image hosting remains).
- [x] **Low:** Add deployment documentation, security headers, monitoring, and backups (documentation and headers complete; provider monitoring/backups remain operational responsibilities).

## Audit evidence and limitations

- `node --check script.js` and `node --check server.js` completed successfully.
- Each of the nine HTML pages returned HTTP 200 through the running local Express server.
- A valid-shaped appointment POST returned the expected HTTP 503 because database storage is not configured in the current environment.
- All nine pages now expose the same primary and secondary navigation labels, and malformed encoding sequences were removed from the HTML files.
- `npm test` now provides dependency-free smoke coverage for all public pages and the documented booking API validation/storage states.
- Booking smoke coverage now also protects malformed email and date/time validation responses.
- The appointment API now validates actual calendar dates and 24-hour time ranges instead of checking only string shape.
- The appointment API now rejects dates before the server's current UTC date, matching the client-side minimum-date behavior.
- Availability responses now exclude non-cancelled appointments, reducing stale slot choices before submission; the database-backed query path remains unverified without PostgreSQL.
- Booking date changes now guard against out-of-order availability responses, so a slower request for an earlier date cannot overwrite the current selection.
- Dynamic booking choice grids now expose loading state through `aria-busy` for assistive technology.
- Appointment text fields now have explicit server-side length limits in addition to the 10 KB JSON body limit.
- The appointment endpoint now guards against `null` and array JSON bodies before destructuring request fields.
- Malformed appointment JSON now returns a consistent JSON 400 response instead of Express’s default HTML parser error.
- Shared interaction handling now returns focus after closing the menu/lightbox, rejects matcher images over 10 MB, and revokes replaced preview object URLs.
- Homepage service, matcher, gallery, and salon-story CTAs now point to their corresponding pages instead of incorrectly targeting the booking anchor.
- Shared form controls now expose stronger visible focus rings and invalid-field styling without changing validation behavior.
- The matcher demonstration now announces recommendation feedback, requires style notes before showing a result, and releases temporary preview URLs on page unload.
- Booking progress now exposes the current step, the active step region is live, and API submission exposes an accessible busy state.
- Gallery filters now expose pressed state, the lightbox keeps keyboard focus contained, and a reduced-motion media query is available.
- Font loading is now consolidated: all pages use the same stylesheet link and `style.css` no longer imports fonts separately. Remote image hosting and production domain metadata remain open items.
- The Express server now sends baseline security headers plus a resource-scoped Content Security Policy; deployment security review remains open.
- All nine public pages now include page-specific descriptions plus theme-color, Open Graph, and Twitter card metadata; canonical URLs, structured data, and deployment metadata remain open.
- `robots.txt` now allows public HTML pages and excludes operational API/health endpoints; sitemap and canonical URLs remain deferred until a production domain is approved.
- The local hero image now declares its 828×768 intrinsic dimensions and uses asynchronous decoding; remote image optimization remains open.
- The local hero image now also requests high fetch priority, while remote editorial images remain lazy-loaded until approved assets can be self-hosted and dimensioned.
- No production database, real email provider, AI provider, staff account, or deployment environment was available for end-to-end verification.
- Final browser QA verified all nine pages render with one main landmark, seven shared navigation links, page descriptions, and social metadata. Internal HTML-link resolution is covered by the smoke suite; database-backed success/conflict flows remain unverified without PostgreSQL.
- Mobile QA at 390px verified responsive menu Escape behavior, focus return, and hero containment; the homepage booking email field now matches the booking/contact form autofill and length constraints.
- The homepage booking email capture now routes to `booking.html` with a session-stored email that is cleared after prefill; it no longer exposes the address in the URL or presents a local-only success state.
- The completion checklist in this audit now distinguishes delivered application work from items that require approved business content, PostgreSQL infrastructure, production imagery, or a future authenticated staff surface.
- The approved baseline and encoding/navigation tasks changed only source-control/documentation setup and shared HTML markup; booking, matcher, and API behavior were not expanded.
