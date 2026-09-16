import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Cleanup Started ---');

  try {
    // 1. Delete all Purchase records
    const deletedPurchases = await prisma.purchase.deleteMany({});
    console.log(`Deleted ${deletedPurchases.count} purchase records.`);

    // 2. Delete all Order records
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} order records.`);

    // 3. Delete all PaymentSession records
    const deletedSessions = await prisma.paymentSession.deleteMany({});
    console.log(`Deleted ${deletedSessions.count} payment session records.`);

    console.log('--- Database Cleanup Completed Successfully ---');
    console.log('Users will now have to purchase content from scratch.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
