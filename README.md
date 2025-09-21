# HH Champions — Local Server

This project now includes a small Node.js + Express backend (Phase 1) that stores form signups in SQLite and provides a simple admin UI.

Quick start

1. Copy `.env.example` to `.env` and fill in SMTP and session settings.
2. Install dependencies:

   npm install

Note: on some systems the native `bcrypt` module can fail to build. This project includes `bcryptjs` as a fallback so `npm run add-admin` should still work after npm install.

3. Create an admin user (runs against `data.sqlite`):

   npm run add-admin

4. Start the server:

   npm start

By default the server listens on the port configured in `.env` (`PORT`, default 8979).

What was added
- `server.js` — Express server, SQLite initialization, API endpoints, SMTP email via nodemailer
- `add-admin.js` — simple CLI to create admin users
- `admin.html` — admin UI for login and viewing signups
- `.env.example` — template for required environment variables

Notes
- The landing page (`index.html`) now posts signup data to `/api/signup`.
- Admin routes are session-protected. Create an admin using `npm run add-admin` and use that account to log in at `/admin.html`.
 
Development notes (CORS)
- If you open the pages using a different dev server (for example Live Server at http://127.0.0.1:5500), the admin page will still work — the server enables CORS for the common Live Server origins and the client will route API calls to http://localhost:8979 automatically during dev.
