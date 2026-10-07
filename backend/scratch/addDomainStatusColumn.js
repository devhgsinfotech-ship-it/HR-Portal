const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$executeRawUnsafe("ALTER TABLE companies ADD COLUMN domainStatus VARCHAR(191) NOT NULL DEFAULT 'APPROVED';");
    console.log('ALTER TABLE Success:', res);
  } catch (err) {
    console.log('ALTER TABLE Result / Error:', err.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
