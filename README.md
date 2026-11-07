# Sitra Sultan – Full-stack Portfolio (MERN)

React (Vite) frontend, Express + MongoDB API, JWT-protected admin panel.

## Run locally
1. `npm run install:all`
2. Copy `server/.env.example` to `server/.env` and set your values (MongoDB URI, secret, admin password)
3. `npm run seed` (adds your projects and skills)
4. Terminal 1: `npm run server`  Terminal 2: `npm run client`
5. Open http://localhost:5173 – admin panel at http://localhost:5173/#/admin

## Attach your project links
Log in at `/#/admin` → Projects. Delete a seeded project and re-add it with its live and GitHub URLs, or add new ones. Certificates, skills and messages are managed there too.

## Deploy
- API: Render/Railway (root `server`, start `npm start`), env vars from `.env.example`, MongoDB Atlas for the database.
- Client: Vercel/Netlify (root `client`, build `npm run build`, output `dist`), set `VITE_API_URL` to the API URL.
