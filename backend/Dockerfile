# backend/Dockerfile

FROM node:20-alpine

# Alpine needs openssl explicitly for Prisma to work correctly
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source
COPY . .

# Prisma client generation is on hold — no models defined yet (schema.prisma
# is still a placeholder). Once you add models, generate it manually with:
#   docker exec -it hr_portal_backend npx prisma generate
# Then uncomment the line below so it runs automatically on future builds:
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
