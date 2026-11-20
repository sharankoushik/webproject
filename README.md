# QuickService

QuickService is a home-services marketplace built with HTML, CSS, JavaScript, Node.js, Express and MongoDB.

## Deploy the complete application (recommended: Render)

This project is configured so one Node.js web service serves both the website (`frontend/`) and its API (`/api`). This is important: deploying only the `public` folder to GitHub Pages will not run the API or admin login.

1. Upload the complete project to a GitHub repository. Keep `frontend/`, `backend/`, `package.json`, `render.yaml`, `.gitignore` and `.env.example` in the repository root.
2. In MongoDB Atlas, create a database user with a strong password. In Network Access, allow connections from your hosting provider. For a quick Render test, Atlas may require `0.0.0.0/0`; use a strong unique database password and tighten access where practical.
3. In Render, choose **New + → Blueprint** and connect this GitHub repository. Render reads `render.yaml` and creates the web service.
4. In the Render service's **Environment** settings, enter:
   - `MONGODB_URI`: your Atlas connection string, with the correct database username/password and database name `quickservice`.
   - `ADMIN_EMAIL`: the admin email/username you want to use.
   - `ADMIN_PASSWORD`: a strong admin password. Do not use the old demo password for a public site.
   - `JWT_SECRET`: use a long, random secret (Render can generate one from the Blueprint).
   - `NODE_ENV`: `production` (already set by the Blueprint).
5. Save the environment variables and wait for the service to finish deploying.
6. Open `https://YOUR-SERVICE.onrender.com/api/health`. It should return JSON with `status: "ok"` and `database: "connected"`.
7. Open `https://YOUR-SERVICE.onrender.com/admin.html` to log in. Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values you configured in Render.
8. Open the homepage at `https://YOUR-SERVICE.onrender.com/`.

The frontend uses same-origin `/api` requests. Do not open the admin page from a GitHub Pages URL while expecting its API to run there; use the deployed Render service URL for the whole application.

## Run locally

1. Install Node.js 18 or later and make sure MongoDB is available (local MongoDB or MongoDB Atlas).
2. Copy `.env.example` to `.env` and replace the placeholder values.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000/`.

For local development only, if no `.env` file is provided, the server uses the demo login `admin@123` / `Admin@1234` and local MongoDB. Set your own credentials before any public deployment.

## Project structure

- `frontend/` – website HTML pages, CSS and browser JavaScript
- `backend/` – Node.js/Express server, API routes, MongoDB models, scripts and admin authentication
- `package.json` – Node dependencies and scripts
- `render.yaml` – Render deployment blueprint
- `.env.example` – environment-variable template (contains placeholders only)

## Important security notes

- Never upload `.env` or `node_modules/` to GitHub.
- The MongoDB URI contains a database password. If it has been shared publicly or in a chat, rotate that password in MongoDB Atlas and update the host environment variable.
- Use a unique, strong admin password and JWT secret in production.
