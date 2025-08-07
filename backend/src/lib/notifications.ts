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

// Offsite Requisition Notifications

// Trigger notification when a requisition is created
export async function triggerRequisitionCreated(requisitionId: string, requesterId: string, destination: string, itemCount: number) {
  // Get all admin and manager users who have notifications enabled (excluding the requester)
  const adminsAndManagers = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'manager'] },
      isActive: true,
      id: { not: requesterId } // Don't notify the requester themselves
    },
    include: {
      notificationSettings: true
    }
  });

  // Filter users who have system notifications enabled (proxy for offsite notifications for now)
  const usersToNotify = adminsAndManagers.filter(user => 
    !user.notificationSettings || user.notificationSettings.systemUpdates !== false
  );

  // Create notifications for eligible admin/manager users
  const notifications = usersToNotify.map(user => ({
    userId: user.id,
    type: 'offsite_requisition_created',
    message: `New off-site requisition created for "${destination}" with ${itemCount} item(s). Requires approval.`,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    });
  }
}

// Trigger notification when a requisition is approved
export async function triggerRequisitionApproved(requisitionId: string, requesterId: string, approverId: string, destination: string) {
  // Get requester and approver details
  const [requester, approver] = await Promise.all([
    prisma.user.findUnique({ 
      where: { id: requesterId }, 
      select: { name: true }
    }),
    prisma.user.findUnique({ 
      where: { id: approverId }, 
      select: { name: true, role: true } 
    })
  ]);

  // Check if requester has notifications enabled
  const requesterSettings = await prisma.notificationSettings.findUnique({
    where: { userId: requesterId }
  });

  // Notify the requester if they have notifications enabled (default to true)
  if (!requesterSettings || requesterSettings.systemUpdates !== false) {
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'offsite_requisition_approved',
        message: `Your off-site requisition for "${destination}" has been approved by ${approver?.name || 'Manager'}.`
      }
    });
  }

  // If approved by admin, notify managers as well (except the approver)
  if (approver?.role === 'admin') {
    const managers = await prisma.user.findMany({
      where: {
        role: 'manager',
        isActive: true,
        id: { not: approverId } // Don't notify the approver
      },
      include: {
        notificationSettings: true
      }
    });

    // Filter managers who have notifications enabled
    const managersToNotify = managers.filter(manager => 
      !manager.notificationSettings || manager.notificationSettings.systemUpdates !== false
    );

    if (managersToNotify.length > 0) {
      const managerNotifications = managersToNotify.map(manager => ({
        userId: manager.id,
        type: 'offsite_requisition_approved',
        message: `Off-site requisition for "${destination}" by ${requester?.name || 'User'} has been approved.`,
      }));

      await prisma.notification.createMany({
        data: managerNotifications
      });
    }
  }
}

// Trigger notification when a requisition is rejected
export async function triggerRequisitionRejected(requisitionId: string, requesterId: string, approverId: string, destination: string) {
  // Check if requester has notifications enabled
  const requesterSettings = await prisma.notificationSettings.findUnique({
    where: { userId: requesterId }
  });

  // Only notify if user has notifications enabled (default to true)
  if (!requesterSettings || requesterSettings.systemUpdates !== false) {
    // Get approver details
    const approver = await prisma.user.findUnique({ 
      where: { id: approverId }, 
      select: { name: true } 
    });

    // Notify the requester that their requisition was rejected
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'offsite_requisition_rejected',
        message: `Your off-site requisition for "${destination}" has been rejected by ${approver?.name || 'Manager'}.`
      }
    });
  }
}

// Trigger notification when items are returned
export async function triggerRequisitionReturned(requisitionId: string, requesterId: string, destination: string, returnedItemCount: number) {
  // Get all admin and manager users who have notifications enabled
  const adminsAndManagers = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'manager'] },
      isActive: true
    },
    include: {
      notificationSettings: true
    }
  });

  // Get requester notification settings
  const requesterSettings = await prisma.notificationSettings.findUnique({
    where: { userId: requesterId }
  });

  // Filter admin/manager users who have notifications enabled
  const usersToNotify = adminsAndManagers.filter(user => 
    !user.notificationSettings || user.notificationSettings.systemUpdates !== false
  );

  // Add requester if they have notifications enabled and they're not already in the list
  const allUsersToNotify = [...usersToNotify.map(user => user.id)];
  if ((!requesterSettings || requesterSettings.systemUpdates !== false) && 
      !allUsersToNotify.includes(requesterId)) {
    allUsersToNotify.push(requesterId);
  }

  if (allUsersToNotify.length > 0) {
    const notifications = allUsersToNotify.map(userId => ({
      userId,
      type: 'offsite_requisition_returned',
      message: `Items have been returned from off-site location "${destination}" (${returnedItemCount} item(s) returned).`,
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  }
}
