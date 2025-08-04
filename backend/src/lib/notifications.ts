import prisma from './prisma';

// Trigger a restock alert notification for a user
export async function triggerRestockAlert(userId: string, productId: string, productName: string, currentStock: number, reorderLevel: number) {
  const message = `Restock alert: ${productName} (ID: ${productId}) is below reorder level (${currentStock} < ${reorderLevel}).`;
  await prisma.notification.create({
    data: {
      userId,
      type: 'restock_alert',
      message
    }
  });
}

// Trigger a delivery confirmation notification for a user
export async function triggerDeliveryConfirmation(userId: string, orderId: string, productName: string, expectedDelivery: Date) {
  const message = `Confirm delivery for Purchase Order ${orderId} (${productName}) scheduled for ${expectedDelivery.toLocaleDateString()}.`;
  await prisma.notification.create({
    data: {
      userId,
      type: 'delivery_confirm',
      message,
      scheduledAt: expectedDelivery
    }
  });
}
