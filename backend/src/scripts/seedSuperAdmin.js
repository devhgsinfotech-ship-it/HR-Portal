// backend/src/scripts/seedSuperAdmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Super Admin...');

    const email = 'superadmin@yourhrms.com';
    const password = 'SuperAdmin123!';

    // Check if super admin already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`Super Admin ${email} already exists!`);
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the super admin user
    const superAdmin = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: email,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            accountStatus: 'ACTIVE',
            companyId: null, // Super Admins don't belong to any specific company workspace
        },
    });

    console.log('✅ Super Admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 Login URL: http://localhost:3000/login (No subdomain)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
