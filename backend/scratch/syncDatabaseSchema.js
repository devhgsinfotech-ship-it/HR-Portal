const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database columns for companies table...');
  
  try {
    // 1. Add domainStatus column if missing
    try {
      await prisma.$executeRawUnsafe("ALTER TABLE companies ADD COLUMN domainStatus VARCHAR(191) NOT NULL DEFAULT 'APPROVED';");
      console.log('✔ Column "domainStatus" added successfully to companies table.');
    } catch (e) {
      if (e.message.includes('Duplicate column name') || e.message.includes('already exists')) {
        console.log('✔ Column "domainStatus" already exists.');
      } else {
        console.warn('Notice on domainStatus column:', e.message);
      }
    }

    // 2. Add emailDomain column if missing
    try {
      await prisma.$executeRawUnsafe("ALTER TABLE companies ADD COLUMN emailDomain VARCHAR(191) NULL;");
      console.log('✔ Column "emailDomain" added successfully to companies table.');
    } catch (e) {
      if (e.message.includes('Duplicate column name') || e.message.includes('already exists')) {
        console.log('✔ Column "emailDomain" already exists.');
      } else {
        console.warn('Notice on emailDomain column:', e.message);
      }
    }

  } catch (error) {
    console.error('Error syncing database schema:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
