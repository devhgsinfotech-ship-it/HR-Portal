# HR Portal — Full Docker Setup (MySQL + Node Backend + React Theme Frontend)

This runs your entire stack — database, backend API, and your ThemeForest React
frontend — in Docker, all wired together on one network.

## Final folder structure

```
hr-portal/
├── docker-compose.yml
├── .env
├── db/
│   └── init.sql
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── (your Node/Express code)
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── (your purchased React theme code)
└── mysql-data/        (auto-created, holds DB files on your local disk)
```

---

## Step 1 — Place your code

1. Copy your **Node/Express backend project** into the `backend/` folder
   (so `backend/package.json`, `backend/server.js`, etc. sit directly inside it).
2. Extract your **ThemeForest React theme** into the `frontend/` folder the same way
   (so `frontend/package.json` sits directly inside it).

## Step 2 — Check your theme's build tool

Open `frontend/package.json` and look at the `"build"` script and output folder:
- **Vite** themes → output folder is usually `dist` (Dockerfile is already set for this)
- **Create React App** themes → output folder is `build`

If your theme uses CRA, open `frontend/Dockerfile` and change this line:
```
COPY --from=build /app/dist /usr/share/nginx/html
```
to:
```
COPY --from=build /app/build /usr/share/nginx/html
```

## Step 3 — Point the theme's API calls at the backend

Most themes have a config file (often `src/config.js`, `.env`, or similar) where
you set the API base URL. Since nginx proxies `/api/` to the backend container
(see `frontend/nginx.conf`), set your theme's API base URL to:
```
/api
```
This way the frontend doesn't need to know the backend's actual host — nginx
handles the routing internally, and it works the same in Docker and once deployed.

## Step 4 — Make sure your backend reads DB config from environment variables

In your backend's DB connection file (Sequelize/Prisma config), make sure it reads:
```js
host: process.env.DB_HOST,
port: process.env.DB_PORT,
database: process.env.DB_NAME,
username: process.env.DB_USER,
password: process.env.DB_PASSWORD,
```
`docker-compose.yml` already injects these automatically — you don't need a
separate `.env` file inside `backend/` for these particular values.

## Step 5 — Build and start everything

From the `hr-portal/` root folder:

```bash
docker compose up -d --build
```

First run will take a few minutes (installing npm packages, building the React
theme, pulling MySQL/nginx images). Subsequent runs are much faster.

## Step 6 — Access everything

| Service | URL |
|---|---|
| Frontend (React theme) | http://localhost:3000 |
| Backend API (direct) | http://localhost:5000 |
| phpMyAdmin (DB GUI) | http://localhost:8080 |
| MySQL (for external tools) | localhost:3306 |

Your data persists in `./mysql-data` on your local machine — safe across
container restarts and rebuilds.

## Common commands

```bash
# Start everything
docker compose up -d

# Rebuild after code changes to Dockerfiles or dependencies
docker compose up -d --build

# Stop everything (keeps data)
docker compose down

# View logs for one service
docker compose logs -f backend
docker compose logs -f frontend

# Stop and wipe database data too
docker compose down -v
rm -rf mysql-data

# Rebuild just one service
docker compose up -d --build backend
```

## Notes on development workflow

- The `backend/` folder is **mounted live** into the container (see `volumes` in
  `docker-compose.yml`), so backend code changes reflect without rebuilding —
  pair this with `nodemon` in your `package.json` start script for auto-restart.
- The `frontend/` is **not** live-mounted — it's built once into static files by
  nginx for a production-like setup. If you want hot-reload while developing the
  theme, run `npm run dev` locally on your machine (outside Docker) against the
  Dockerized backend/API, and only use the Docker frontend build for final testing.
