# Comp4537-Term-Project

## Setup
Inside `backend` directory run:
- npm init -y
- npm install express jsonwebtoken bcrypt cookie-parser cors dotenv


## Start Backend
Server runs at: `http://localhost:3000`

## Start Frontend
Use **VS Code Live Server** and open `frontend/login.html`.

**Important:** Live Server must run on `http://localhost:5500` (not 127.0.0.1).

## Test
- Open `http://localhost:5500/frontend/login.html`
- Login with:
  - Email: `gugu@gugu.com`
  - Password: `123`
- Redirects to `main.html` if login works.
- Logout returns to login page.

## How It Works
- Backend issues JWT on login.
- Token is stored in an `HttpOnly` cookie.
- `/auth/main` verifies the token for protected routes.
- Logout clears the cookie.

## Notes
- Use `secure: true` cookies only on HTTPS.
- Replace demo user and secret key before production.
