import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();


// Get inventory overview
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const lowStock = req.query.lowStock === 'true';
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Low stock filter
    if (lowStock) {
      where.stock = { lte: 10 }; // Consider stock <= 10 as low stock
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: true,
          supplier: true
        }
      }),
      prisma.product.count({ where })
    ]);

    return res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add product (with stockType)
router.post('/products', [
  body('name').isLength({ min: 2 }).withMessage('Name is required'),
  body('sku').isLength({ min: 2 }).withMessage('SKU is required'),
  body('price').isDecimal().withMessage('Price must be a decimal'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('stockType').isIn(['raw_material', 'asset_equipment']).withMessage('Stock type must be raw_material or asset_equipment'),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, sku, price, stock, stockType, category, supplier, reorderLevel } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price: price,
        stock: stock,
        stockType: stockType,
        costPrice: price, // Assuming costPrice is same as price for simplicity
        reorderLevel: reorderLevel || 0,
        categoryId: category || undefined,
        supplierId: supplier || undefined,
      },
      include: {
        category: true,
        supplier: true
      }
    });
    return res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalCategories,
      totalValue
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.category.count(),
      prisma.product.aggregate({
        _sum: {
          stock: true
        }
      })
    ]);

    // Get inventory value (approximation using cost price * stock)
    const inventoryValue = await prisma.product.findMany({
      select: {
        stock: true,
        costPrice: true
      }
    });

    const totalInventoryValue = inventoryValue.reduce((sum, product) => {
      return sum + (product.stock * Number(product.costPrice));
    }, 0);

    return res.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalCategories,
      totalUnits: totalValue._sum.stock || 0,
      totalInventoryValue: totalInventoryValue
    });
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req: AuthRequest, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true
      },
      include: {
        category: true,
        supplier: true
      },
      orderBy: { stock: 'asc' }
    });

    return res.json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product stock and optionally create a purchase batch for stock-in events
router.put('/:id/stock', [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('reason').optional().isLength({ min: 3 }).withMessage('Reason must be at least 3 characters'),
  body('unitCost').optional().isDecimal().withMessage('Unit cost must be a decimal'),
  body('batchRef').optional().isString().withMessage('Batch reference must be a string')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { stock, reason, unitCost, batchRef } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If stock is being increased, optionally create a purchase batch for the difference
    if (stock > product.stock) {
      const addedQty = stock - product.stock;
      const cost = unitCost ? Number(unitCost) : Number(product.costPrice);
      await prisma.productPurchaseBatch.create({
        data: {
          productId: id,
          quantity: addedQty,
          remaining: addedQty,
          costPrice: cost,
          batchRef: batchRef || null,
          receivedAt: new Date(),
        }
      });
    }

    // Increment the stock value by the provided amount (additive restock)
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: { increment: stock } },
      include: {
      category: true,
      supplier: true
      }
    });

    // Trigger restock alert if stock falls below reorder level
    if (updatedProduct.stock <= updatedProduct.reorderLevel && req.user?.id) {
      const { triggerRestockAlert } = require('../lib/notifications');
      await triggerRestockAlert(req.user.id, updatedProduct.id, updatedProduct.name, updatedProduct.stock, updatedProduct.reorderLevel);
    }

    console.log(`Stock updated for product ${product.name}: ${product.stock} -> ${stock}. Reason: ${reason || 'Manual adjustment'}`);

    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating stock:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk stock update with batch creation for stock-in events
router.put('/bulk-stock', [
  body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
  body('updates.*.productId').isLength({ min: 10 }).withMessage('Valid product ID is required'),
  body('updates.*.stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('updates.*.unitCost').optional().isDecimal().withMessage('Unit cost must be a decimal'),
  body('updates.*.batchRef').optional().isString().withMessage('Batch reference must be a string'),
  body('reason').optional().isLength({ min: 3 }).withMessage('Reason must be at least 3 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates, reason } = req.body;

    // Validate all products exist
    const productIds = updates.map((update: any) => update.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Perform bulk update and create batches for stock-in
    const updatePromises = updates.map(async (update: any) => {
      const product = products.find((p: any) => p.id === update.productId);
      if (!product) return null;
      // If stock is being increased, create a purchase batch for the difference
      if (update.stock > product.stock) {
        const addedQty = update.stock - product.stock;
        const cost = update.unitCost ? Number(update.unitCost) : Number(product.costPrice);
        await prisma.productPurchaseBatch.create({
          data: {
            productId: update.productId,
            quantity: addedQty,
            remaining: addedQty,
            costPrice: cost,
            batchRef: update.batchRef || null,
            receivedAt: new Date(),
          }
        });
      }
      return prisma.product.update({
        where: { id: update.productId },
        data: { stock: update.stock }
      });
    });

    await Promise.all(updatePromises);

    // Get updated products
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        supplier: true
      }
    });

    console.log(`Bulk stock update completed for ${updates.length} products. Reason: ${reason || 'Bulk adjustment'}`);

    return res.json(updatedProducts);
  } catch (error) {
    console.error('Error performing bulk stock update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// ...existing code...

// Inventory Calculation Method (module-specific config)
// GET /api/inventory/calculation-method
// GET /api/inventory/calculation-method
router.get('/calculation-method', async (req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.inventoryConfig.findFirst();
    return res.json({ value: config?.calculateMethod || 'fifo' });
  } catch (error) {
    console.error('Error fetching inventory calculation method:', error);
    return res.status(500).json({ error: 'Failed to fetch calculation method' });
  }
});

// PUT /api/inventory/calculation-method
router.put('/calculation-method', async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body;
    if (!['fifo', 'lifo', 'wac'].includes(value)) {
      return res.status(400).json({ error: 'Invalid calculation method' });
    }
    // Upsert config row
    const updated = await prisma.inventoryConfig.upsert({
      where: { id: (await prisma.inventoryConfig.findFirst())?.id || '' },
      update: { calculateMethod: value },
      create: { calculateMethod: value }
    });
    return res.json({ value: updated.calculateMethod });
  } catch (error) {
    console.error('Error updating inventory calculation method:', error);
    return res.status(500).json({ error: 'Failed to update calculation method' });
  }
});

export default router;
