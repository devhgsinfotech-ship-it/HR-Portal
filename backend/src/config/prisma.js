// backend/src/config/prisma.js
// Single shared Prisma Client instance — import this everywhere instead of
// creating a new PrismaClient() in each file.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
