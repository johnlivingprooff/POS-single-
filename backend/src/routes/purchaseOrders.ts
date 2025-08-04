import { Decimal } from '@prisma/client/runtime/library';
import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';
import { triggerDeliveryConfirmation } from '../lib/notifications';

const router = express.Router();

// GET /api/purchase-orders - List all purchase orders
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        product: true,
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// POST /api/purchase-orders - Create a new purchase order
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, supplierId, quantity, costPrice, expectedDelivery } = req.body;
    // Generate order number
    const orderCount = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${(orderCount + 1).toString().padStart(6, '0')}`;
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        productId,
        supplierId,
        quantity,
        costPrice: parseFloat(costPrice),
        expectedDelivery: new Date(expectedDelivery)
      },
      include: {
        product: true,
        supplier: true
      }
    });

    // --- Inventory Costing Logic (FIFO/LIFO/WAC) for raw_materials ---
    // Fetch product to check type and update costPrice/unitCost
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && product.stockType === 'raw_material') {
      // Fetch all delivered purchase orders for this product
      const deliveredOrders = await prisma.purchaseOrder.findMany({
        where: { productId, status: 'delivered' },
        orderBy: { createdAt: 'asc' } // FIFO by default
      });
      // Add this new order to the list (pending delivery, but for preview)
      const allOrders = [
        ...deliveredOrders.map(o => ({
          quantity: o.quantity,
          costPrice: typeof o.costPrice === 'string' ? new Decimal(o.costPrice) : new Decimal(o.costPrice.toString())
        })),
        { quantity, costPrice: new Decimal(costPrice) }
      ];

      // Fetch costing method from settings
      let costingMethod = 'FIFO';
      const calcSetting = await prisma.settings.findUnique({ where: { key: 'inventoryCalculationMethod' } });
      if (calcSetting && typeof calcSetting.value === 'string') {
        costingMethod = calcSetting.value.toUpperCase(); // 'FIFO', 'LIFO', 'WAC'
      }
      let newCostPrice = new Decimal(product.costPrice?.toString() || '0');
      let newUnitCost = new Decimal(product.unitCost?.toString() || '0');
      if (costingMethod === 'FIFO') {
        // Use cost of the oldest batch (first in list)
        const oldest = allOrders[0];
        newCostPrice = new Decimal(oldest.costPrice);
        if (product.measurementValue && product.measurementValue > 0) {
          newUnitCost = newCostPrice.div(product.measurementValue);
        }
      } else if (costingMethod === 'LIFO') {
        // Use cost of the newest batch (last in list)
        const newest = allOrders[allOrders.length - 1];
        newCostPrice = new Decimal(newest.costPrice);
        if (product.measurementValue && product.measurementValue > 0) {
          newUnitCost = newCostPrice.div(product.measurementValue);
        }
      } else if (costingMethod === 'WAC') {
        // Weighted Average Cost
        let totalQty = 0;
        let totalCost = new Decimal(0);
        for (const o of allOrders) {
          totalQty += o.quantity;
          totalCost = totalCost.add(new Decimal(o.costPrice).mul(o.quantity));
        }
        if (totalQty > 0) {
          newCostPrice = totalCost.div(totalQty);
          if (product.measurementValue && product.measurementValue > 0) {
            newUnitCost = newCostPrice.div(product.measurementValue);
          }
        }
      }
      // Update product costPrice/unitCost
      await prisma.product.update({
        where: { id: productId },
        data: { costPrice: newCostPrice, unitCost: newUnitCost }
      });
    }

    // Trigger delivery confirmation notification for the user who created the order
    if (req.user?.id) {
      await triggerDeliveryConfirmation(req.user.id, order.orderNumber, order.product.name, order.expectedDelivery);
    }

    // Auto-confirm delivery if it's an immediate stock replenishment
    // (You can add a flag in the request to control this behavior)
    const autoConfirm = req.body.autoConfirm || false;
    if (autoConfirm && product) {
      // Immediately update stock and availableQuantities
      const newStock = product.stock + quantity;
      let updateData: any = { stock: newStock };
      
      if (product.stockType === 'raw_material' && product.measurementValue) {
        const newAvailableQuantities = newStock * product.measurementValue;
        updateData.availableQuantities = newAvailableQuantities;
      }
      
      await prisma.product.update({
        where: { id: productId },
        data: updateData
      });

      // Create purchase batch for raw materials
      if (product.stockType === 'raw_material') {
        const batchQuantity = product.measurementValue ? quantity * product.measurementValue : quantity;
        
        await prisma.productPurchaseBatch.create({
          data: {
            productId: productId,
            purchaseOrderId: order.id,
            quantity: batchQuantity,
            remaining: batchQuantity,
            costPrice: parseFloat(costPrice.toString()),
            receivedAt: new Date()
          }
        });
      }

      // Update order status to delivered
      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: { status: 'delivered' }
      });
    }

    res.status(201).json({ 
      order, 
      autoConfirmed: autoConfirm,
      message: autoConfirm 
        ? 'Purchase order created and delivery confirmed. Inventory updated immediately.' 
        : 'Purchase order created. Confirm delivery later to update inventory.'
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// PUT /api/purchase-orders/:id/confirm-delivery - Confirm delivery and update stock
router.put('/:id/confirm-delivery', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Order already delivered' });
    }
    // Update product stock and availableQuantities
    const product = order.product;
    const newStock = product.stock + order.quantity;
    
    // For raw materials, calculate availableQuantities based on measurement
    let updateData: any = { stock: newStock };
    
    if (product.stockType === 'raw_material' && product.measurementValue) {
      // availableQuantities = total stock × measurement value per pack
      const newAvailableQuantities = newStock * product.measurementValue;
      updateData.availableQuantities = newAvailableQuantities;
    }
    
    await prisma.product.update({
      where: { id: order.productId },
      data: updateData
    });

    // Create purchase batch for raw materials (for FIFO/LIFO/WAC costing)
    if (product.stockType === 'raw_material') {
      const batchQuantity = product.measurementValue ? order.quantity * product.measurementValue : order.quantity;
      
      await prisma.productPurchaseBatch.create({
        data: {
          productId: order.productId,
          purchaseOrderId: order.id,
          quantity: batchQuantity,
          remaining: batchQuantity,
          costPrice: parseFloat(order.costPrice.toString()),
          receivedAt: new Date()
        }
      });
    }
    // Update order status
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: order.id },
      data: { status: 'delivered' }
    });
    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// GET /api/purchase-orders/:id - Get purchase order details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { product: true, supplier: true }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

export default router;
