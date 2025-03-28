import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);

    const adminPassword = await hashPassword('AdminPass123'); // Use a secure default PW or env var

    const admin = await prisma.user.upsert({
        where: { email: 'admin@inventory.com' },
        update: {},
        create: {
            email: 'admin@inventory.com',
            username: 'admin',
            password: adminPassword,
            role: Role.ADMIN,
            firstName: 'Admin',
            isActive: true,
        },
    });
    console.log(`Created/Found admin user: ${admin.email}`);

    // Add more seeds (e.g., default categories, locations) if needed

    console.log(`Seeding finished.`);
}

main()
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });