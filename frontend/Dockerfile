# frontend/Dockerfile
# Multi-stage build: compile the React theme, then serve the static files with nginx

# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# NOTE: change "dist" to "build" below if your theme uses Create React App
# (Vite outputs to /dist, CRA outputs to /build — check your package.json "scripts".build output)
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
