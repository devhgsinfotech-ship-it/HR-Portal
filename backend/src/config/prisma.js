// backend/src/config/prisma.js
// Single shared Prisma Client instance — import this everywhere instead of
// creating a new PrismaClient() in each file.

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
