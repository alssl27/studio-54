# STUDIO 54

STUDIO 54 is an Express-served salon website prototype with static HTML pages, shared CSS/JavaScript, and a PostgreSQL-backed appointment API.

## Local setup

Requirements:

- Node.js 18 or newer
- PostgreSQL, if appointment storage is required

Install dependencies:

```powershell
npm install
```

Create a local `.env` file from `.env.example` and set `DATABASE_URL` when using the booking API.

Start the site:

```powershell
npm start
```

Open <http://localhost:3000>.

## Project structure

- `index.html` — homepage
- `services.html`, `gallery.html`, `matcher.html`, `booking.html` — primary customer journeys
- `about.html`, `contact.html`, `products.html`, `tutorials.html` — supporting pages
- `style.css` — shared visual system and responsive rules
- `script.js` — shared browser interactions
- `server.js` — Express static server and appointment API
- `db/schema.sql` — PostgreSQL tables and indexes
- `assets/` — local image assets

The current booking and matcher experiences are prototypes. See `STUDIO54_WEBSITE_AUDIT.md` and `STUDIO54_COMPLETION_PLAN.md` for known limitations and the gated completion roadmap.
