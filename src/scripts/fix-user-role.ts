import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '6a0578a8d6ae8432a6fc54b8'; // The ID from your error
  console.log(`--- Updating role for user ${userId} ---`);

  try {
    const updated = await prisma.appUser.update({
      where: { id: userId },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log('Success! Updated user:', updated.name, 'Role:', updated.role);
  } catch (error) {
    console.error('Failed to update user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
