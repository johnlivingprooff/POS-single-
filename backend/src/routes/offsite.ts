import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { 
  triggerRequisitionCreated, 
  triggerRequisitionApproved, 
  triggerRequisitionRejected, 
  triggerRequisitionReturned 
} from '../lib/notifications';

const router = express.Router();

// Get all off-site requisitions
router.get('/requisitions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, requesterId } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    const where: any = {};
    if (status) where.status = status;
    if (requesterId) where.requesterId = requesterId;
    
    // For employees, only show their own requisitions
    if (userRole === 'employee') {
      where.requesterId = userId;
    }

    const requisitions = await prisma.offSiteRequisition.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockType: true } }
          }
        },
        returns: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requisitions);
  } catch (error) {
    console.error('Error fetching off-site requisitions:', error);
    res.status(500).json({ error: 'Failed to fetch off-site requisitions' });
  }
});

// Create new off-site requisition
router.post('/requisitions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { destination, purpose, items } = req.body;
    const requesterId = req.user?.id;

    console.log('=== Offsite Requisition Creation Debug ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Destination:', destination);
    console.log('Purpose:', purpose);
    console.log('Items:', items);
    console.log('Creating requisition with user:', req.user);
    console.log('Requester ID:', requesterId);
    console.log('User ID type:', typeof requesterId);

    if (!requesterId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user exists in database - first try by ID
    let userExists = await prisma.user.findUnique({
      where: { id: requesterId }
    });

    // If not found by ID, try to find by email (fallback for stale JWT tokens)
    if (!userExists && req.user?.email) {
      console.log('User not found by ID, trying by email:', req.user.email);
      userExists = await prisma.user.findUnique({
        where: { email: req.user.email }
      });
      
      if (userExists) {
        // Use the correct user ID from database
        req.user.id = userExists.id;
        console.log('Updated user ID to:', userExists.id);
      }
    }

    console.log('Database lookup result:', userExists);

    if (!userExists) {
      console.error('User not found in database by ID or email. ID:', requesterId, 'Email:', req.user?.email);
      return res.status(401).json({ error: 'User not found in database. Please log in again.' });
    }

    console.log('User verified:', userExists.email);

    // Use the verified user ID
    const verifiedRequesterId = userExists.id;

    console.log('=== Stock Validation ===');
    // Validate stock availability
    for (const item of items) {
      console.log(`Checking stock for item:`, item);
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      
      console.log(`Product found:`, product ? { id: product.id, name: product.name, stock: product.stock } : 'NOT FOUND');
      
      if (!product || product.stock < item.quantityOut) {
        const errorMsg = `Insufficient stock for ${product?.name || 'product'}. Available: ${product?.stock || 0}, Requested: ${item.quantityOut}`;
        console.log('Stock validation failed:', errorMsg);
        return res.status(400).json({ 
          error: errorMsg
        });
      }
    }

    console.log('=== Creating Requisition ===');

    const requisition = await prisma.offSiteRequisition.create({
      data: {
        requesterId: verifiedRequesterId,
        destination,
        purpose,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantityOut: item.quantityOut
          }))
        }
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockType: true } }
          }
        }
      }
    });

    console.log('=== Requisition Created ===');
    console.log('Requisition ID:', requisition.id);

    // Trigger notification for new requisition
    try {
      await triggerRequisitionCreated(
        requisition.id, 
        verifiedRequesterId, 
        destination, 
        items.length
      );
      console.log('=== Notification Triggered ===');
    } catch (notificationError) {
      console.error('Error triggering requisition created notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // If auto-approved (for now, we'll implement approval workflow later)
    // Update stock levels
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantityOut }
        }
      });

      // Log inventory movement
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          type: 'offsite_out',
          quantity: -item.quantityOut,
          previousStock: (await prisma.product.findUnique({ where: { id: item.productId } }))!.stock + item.quantityOut,
          newStock: (await prisma.product.findUnique({ where: { id: item.productId } }))!.stock,
          reason: `Off-site requisition: ${destination}`,
          reference: requisition.id
        }
      });
    }

    return res.status(201).json(requisition);
  } catch (error) {
    console.error('Error creating off-site requisition:', error);
    return res.status(500).json({ error: 'Failed to create off-site requisition' });
  }
});

// Update requisition status (approve/dispatch)
router.patch('/requisitions/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let requisition;
    try {
      requisition = await prisma.offSiteRequisition.update({
        where: { id },
        data: {
          status,
          ...(status === 'approved' && { approvedBy: approverId, approvedAt: new Date() })
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, stockType: true } }
            }
          }
        }
      });
    } catch (updateError) {
      // If update fails (e.g., not found), return 404
      return res.status(404).json({ error: 'Requisition not found or update failed' });
    }

    return res.json(requisition);
  } catch (error) {
    console.error('Error updating requisition status:', error);
    return res.status(500).json({ error: 'Failed to update requisition status' });
  }
});

// Create return for a requisition
router.post('/requisitions/:id/returns', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: requisitionId } = req.params;
    const { items, notes } = req.body;

    const returnRecord = await prisma.offSiteReturn.create({
      data: {
        requisitionId,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantityReturned: item.quantityReturned,
            quantityDamaged: item.quantityDamaged || 0,
            quantityLost: item.quantityLost || 0
          }))
        }
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });

    // Update stock levels for returned items
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantityReturned }
        }
      });

      // Update requisition item return quantities
      await prisma.offSiteRequisitionItem.updateMany({
        where: {
          requisitionId,
          productId: item.productId
        },
        data: {
          quantityReturned: { increment: item.quantityReturned },
          quantityLost: { increment: item.quantityLost || 0 }
        }
      });

      // Log inventory movement
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          type: 'offsite_return',
          quantity: item.quantityReturned,
          previousStock: (await prisma.product.findUnique({ where: { id: item.productId } }))!.stock - item.quantityReturned,
          newStock: (await prisma.product.findUnique({ where: { id: item.productId } }))!.stock,
          reason: `Off-site return${notes ? `: ${notes}` : ''}`,
          reference: returnRecord.id
        }
      });
    }

    // Check if all items have been returned and update requisition status
    const requisitionItems = await prisma.offSiteRequisitionItem.findMany({
      where: { requisitionId }
    });

    const allReturned = requisitionItems.every(item => 
      item.quantityReturned + item.quantityLost >= item.quantityOut
    );

    let updatedRequisition = null;
    if (allReturned) {
      updatedRequisition = await prisma.offSiteRequisition.update({
        where: { id: requisitionId },
        data: { status: 'returned' },
        include: {
          requester: { select: { id: true, name: true, email: true } }
        }
      });
    } else {
      updatedRequisition = await prisma.offSiteRequisition.findUnique({
        where: { id: requisitionId },
        include: {
          requester: { select: { id: true, name: true, email: true } }
        }
      });
    }

    // Trigger notification for return processed
    try {
      if (updatedRequisition) {
        await triggerRequisitionReturned(
          requisitionId,
          updatedRequisition.requesterId,
          updatedRequisition.destination,
          items.length
        );
      }
    } catch (notificationError) {
      console.error('Error triggering requisition returned notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(returnRecord);
  } catch (error) {
    console.error('Error creating off-site return:', error);
    res.status(500).json({ error: 'Failed to create off-site return' });
  }
});

// Get summary statistics
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const [totalRequisitions, pendingRequisitions, activeRequisitions, totalReturns] = await Promise.all([
      prisma.offSiteRequisition.count(),
      prisma.offSiteRequisition.count({ where: { status: 'pending' } }),
      prisma.offSiteRequisition.count({ where: { status: { in: ['approved', 'dispatched'] } } }),
      prisma.offSiteReturn.count()
    ]);

    res.json({
      totalRequisitions,
      pendingRequisitions,
      activeRequisitions,
      totalReturns
    });
  } catch (error) {
    console.error('Error fetching off-site summary:', error);
    res.status(500).json({ error: 'Failed to fetch off-site summary' });
  }
});

// Approve requisition endpoint
router.patch('/requisitions/:id/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has permission to approve (admin/manager)
    const user = await prisma.user.findUnique({ where: { id: approverId } });
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to approve requisitions' });
    }

    const requisition = await prisma.offSiteRequisition.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date()
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockType: true } }
          }
        }
      }
    });

    // Trigger notification for approved requisition
    try {
      await triggerRequisitionApproved(
        requisition.id,
        requisition.requesterId,
        approverId,
        requisition.destination
      );
    } catch (notificationError) {
      console.error('Error triggering requisition approved notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return res.json(requisition);
  } catch (error: any) {
    console.error('Error approving requisition:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Requisition not found' });
    }
    return res.status(500).json({ error: 'Failed to approve requisition' });
  }
});

// Reject requisition endpoint
router.patch('/requisitions/:id/reject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has permission to reject (admin/manager)
    const user = await prisma.user.findUnique({ where: { id: approverId } });
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to reject requisitions' });
    }

    const requisition = await prisma.offSiteRequisition.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date()
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockType: true } }
          }
        }
      }
    });

    // Trigger notification for rejected requisition
    try {
      await triggerRequisitionRejected(
        requisition.id,
        requisition.requesterId,
        approverId,
        requisition.destination
      );
    } catch (notificationError) {
      console.error('Error triggering requisition rejected notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return res.json(requisition);
  } catch (error: any) {
    console.error('Error rejecting requisition:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Requisition not found' });
    }
    return res.status(500).json({ error: 'Failed to reject requisition' });
  }
});

// Update requisition endpoint (PUT)
router.put('/requisitions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { destination, purpose } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current requisition to check permissions
    const currentRequisition = await prisma.offSiteRequisition.findUnique({
      where: { id },
      select: { requesterId: true, status: true }
    });

    if (!currentRequisition) {
      return res.status(404).json({ error: 'Requisition not found' });
    }

    // Check if user can edit this requisition
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canEdit = currentRequisition.status === 'pending' && 
                   (currentRequisition.requesterId === userId || ['admin', 'manager'].includes(user?.role || ''));

    if (!canEdit) {
      return res.status(403).json({ error: 'Cannot edit this requisition' });
    }

    const requisition = await prisma.offSiteRequisition.update({
      where: { id },
      data: {
        destination,
        purpose
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockType: true } }
          }
        }
      }
    });

    return res.json(requisition);
  } catch (error: any) {
    console.error('Error updating requisition:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Requisition not found' });
    }
    return res.status(500).json({ error: 'Failed to update requisition' });
  }
});

export default router;
