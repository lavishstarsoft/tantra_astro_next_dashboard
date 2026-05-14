import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Clearing all Orders and Purchases ---');

  try {
    // 1. Clear Purchase records (Main app purchases)
    const purchaseDelete = await prisma.purchase.deleteMany({});
    console.log(`Successfully deleted ${purchaseDelete.count} records from 'Purchase' table.`);

    // 2. Clear Order records (Legacy/Stripe orders)
    const orderDelete = await prisma.order.deleteMany({});
    console.log(`Successfully deleted ${orderDelete.count} records from 'Order' table.`);

    // 3. Clear PaymentSession records (Pending sessions)
    const sessionDelete = await prisma.paymentSession.deleteMany({});
    console.log(`Successfully deleted ${sessionDelete.count} records from 'PaymentSession' table.`);

    // 4. Optionally clear purchase notifications to keep it clean
    const notificationDelete = await prisma.notification.deleteMany({
      where: {
        type: 'purchase'
      }
    });
    console.log(`Successfully deleted ${notificationDelete.count} purchase notifications.`);

    console.log('--- All Order data has been cleared successfully! ---');
  } catch (error) {
    console.error('Error clearing order data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
