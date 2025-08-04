import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';

import type { Response } from 'express';
import type { AuthRequest } from '../types/authRequest';
const router = express.Router();

// DELETE /api/manufacturing/orders/:id - Delete a manufacturing order by ID
router.delete('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Check if order exists
    const order = await prisma.manufacturingOrder.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Manufacturing order not found' });
    }
    // Delete related items if any (optional, depending on schema)
    await prisma.manufacturingOrderItem.deleteMany({ where: { orderId: id } });
    // Delete the order
    await prisma.manufacturingOrder.delete({ where: { id } });
    return res.json({ message: 'Manufacturing order deleted successfully' });
  } catch (error) {
    console.error('Error deleting manufacturing order:', error);
    return res.status(500).json({ error: 'Failed to delete manufacturing order' });
  }
});

// GET /api/manufacturing/bom/:id/price - Get price calculation breakdown for a BOM
// Use Request if AuthRequest is not a type
router.get('/bom/:id/price', async (req: AuthRequest, res: Response) => {
  try {
    const bom = await prisma.bOM.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        items: {
          include: {
            rawMaterial: true
          }
        }
      }
    });
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    const costBreakdown: Array<{ name: string; sku: string; unitCost: number; quantity: number; total: number }> = [];
    let unitCost = 0;
    if (bom.items && Array.isArray(bom.items)) {
      for (let i = 0; i < bom.items.length; i++) {
        const item = bom.items[i];
        const raw = item.rawMaterial;
        const rawCost = (Number(raw?.unitCost) || 0) * (item.quantity || 0);
        costBreakdown.push({
          name: raw?.name || '',
          sku: raw?.sku || '',
          unitCost: Number(raw?.unitCost) || 0,
          quantity: item.quantity || 0,
          total: rawCost
        });
        unitCost += rawCost;
      }
    }
    // Price calculation
    let price = unitCost;
    let priceMethod = bom.product?.pricingMethod || 'markup';
    
    // Fetch default pricing settings
    const salesSettings = await prisma.salesSettings.findFirst();
    const defaultMarkup = salesSettings?.defaultMarkupPercentage || 25;
    const defaultMargin = salesSettings?.defaultMarginPercentage || 20;
    
    let priceFormula = '';
    if (bom.product?.pricingOverride && typeof bom.product?.price === 'number' && !isNaN(Number(bom.product.price))) {
      price = Number(bom.product.price);
      priceFormula = 'Override';
    } else if (priceMethod === 'markup') {
      price = unitCost * (1 + defaultMarkup / 100);
      priceFormula = `costPrice * (1 + ${defaultMarkup}%) = ${unitCost} * ${1 + defaultMarkup / 100}`;
    } else if (priceMethod === 'margin') {
      price = unitCost / (1 - (defaultMargin / 100));
      priceFormula = `costPrice / (1 - ${defaultMargin}%) = ${unitCost} / ${1 - defaultMargin / 100}`;
    } else {
      priceFormula = 'Unknown pricing method, using costPrice';
    }
    price = Math.round(price * 100) / 100;
    return res.json({
      priceDetails: {
        unitCost,
        price,
        priceFormula,
        costBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching BOM price:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products that need reordering (manufacturing perspective)
router.get('/reorder-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { stock: { lte: prisma.product.fields.reorderLevel } },
          { stock: 0 }
        ],
        isActive: true
      },
      include: {
        category: true,
        supplier: true
      },
      orderBy: { stock: 'asc' }
    });
    return res.json({
      message: 'Products requiring reorder or production',
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
        reorderLevel: product.reorderLevel,
        category: product.category?.name || 'No Category',
        supplier: product.supplier?.name || 'No Supplier',
        status: product.stock === 0 ? 'Out of Stock' : 'Below Reorder Level'
      }))
    });
  } catch (error) {
    console.error('Error fetching reorder alerts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reorder levels (production planning)
router.put('/reorder-levels', [
  body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
  body('updates.*.productId').isLength({ min: 10 }).withMessage('Valid product ID is required'),
  body('updates.*.reorderLevel').isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;
    // Validate all products exist
    const productIds = updates.map((update: any) => update.productId);
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds }
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Perform bulk update
    const updatePromises = updates.map((update: any) =>
      prisma.product.update({
        where: { id: update.productId },
        data: { reorderLevel: update.reorderLevel }
      })
    );

    await Promise.all(updatePromises);

    const updatedProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds }
      },
      include: {
        category: true,
        supplier: true
      }
    });

    return res.json({
      message: 'Reorder levels updated successfully',
      products: updatedProducts
    });
  } catch (error) {
    console.error('Error updating reorder levels:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Production report (based on sales data)
router.get('/production-report', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateFilter = {
          createdAt: {
            gte: weekStart
          }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        dateFilter = {
          createdAt: {
            gte: quarterStart
          }
        };
        break;
      default:
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
    }

    // Get most sold products (indicates production demand)
    const productDemand = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          ...dateFilter
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 20
    });

    // Get product details
    const productIds = productDemand.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds }
      },
      include: {
        category: true,
        supplier: true
      }
    });

    const demandWithProducts = productDemand.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: {
          id: product?.id,
          name: product?.name,
          sku: product?.sku,
          category: product?.category?.name || 'No Category',
          supplier: product?.supplier?.name || 'No Supplier'
        },
        demandQuantity: item._sum.quantity || 0,
        currentStock: product?.stock || 0,
        reorderLevel: product?.reorderLevel || 0,
        needsProduction: (product?.stock || 0) < (item._sum.quantity || 0),
        suggestedProduction: Math.max(0, (item._sum.quantity || 0) - (product?.stock || 0))
      };
    });

    return res.json({
      period,
      generatedAt: new Date(),
      summary: {
        totalProductsAnalyzed: demandWithProducts.length,
        productsNeedingProduction: demandWithProducts.filter(p => p.needsProduction).length,
        totalSuggestedProduction: demandWithProducts.reduce((sum, p) => sum + p.suggestedProduction, 0)
      },
      productDemand: demandWithProducts
    });
  } catch (error) {
    console.error('Error generating production report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Supplier analysis for manufacturing
router.get('/supplier-analysis', async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { 
        isActive: true
      },
      include: {
        products: {
          where: { 
            isActive: true
          },
          select: {
            id: true,
            name: true,
            stock: true,
            reorderLevel: true,
            costPrice: true
          }
        }
      }
    });

    const supplierAnalysis = suppliers.map(supplier => {
      const products = supplier.products;
      const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel);
      const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.costPrice)), 0);

      return {
        id: supplier.id,
        name: supplier.name,
        contact: {
          email: supplier.email,
          phone: supplier.phone
        },
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.length,
        inventoryValue: totalValue,
        needsReorder: lowStockProducts.length > 0
      };
    });

    return res.json({
      message: 'Supplier analysis for manufacturing planning',
      suppliers: supplierAnalysis.sort((a, b) => b.lowStockProducts - a.lowStockProducts)
    });
  } catch (error) {
    console.error('Error generating supplier analysis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Bill of Materials (BOM) ---
// GET /api/manufacturing/bom - List all BOMs with their items and raw material details
router.get('/bom', async (req: AuthRequest, res: Response) => {
  try {
    const boms = await prisma.bOM.findMany({
      include: {
        product: true,
        items: {
          include: {
            rawMaterial: true
          }
        }
      }
    });
    return res.json({ boms });
  } catch (error) {
    console.error('Error fetching BOMs:', error);
    return res.status(500).json({ error: 'Failed to fetch BOMs' });
  }
});
// DELETE /api/manufacturing/bom/:id - Delete a BOM and its items
router.delete('/bom/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Check if BOM exists
    const bom = await prisma.bOM.findFirst({ 
      where: { 
        id,
        product: {
          
        }
      } 
    });
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    // Delete BOM items first
    await prisma.bOMItem.deleteMany({ where: { bomId: id } });
    // Delete the BOM itself
    await prisma.bOM.delete({ where: { id } });
    return res.json({ message: 'BOM deleted successfully' });
  } catch (error) {
    console.error('Error deleting BOM:', error);
    return res.status(500).json({ error: 'Failed to delete BOM' });
  }
});

// POST /api/manufacturing/bom - Create or update a BOM for a finished good
router.post('/bom', async (req: AuthRequest, res: Response) => {
  try {
    const { finishedGood, components } = req.body;
    // finishedGood: { name, sku, price, category/categoryId, supplierId, reorderLevel, pricingMethod, pricingOverride, description }
    // components: [{ rawMaterialId, quantity }]
    if (!finishedGood || !finishedGood.name || !finishedGood.sku) {
      return res.status(400).json({ error: 'All finished good product details are required.' });
    }
    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'At least one BOM component is required.' });
    }
    // Accept either category or categoryId
    let categoryId = finishedGood.categoryId || finishedGood.category || null;
    // Check if product exists by SKU within the organization
    let product = await prisma.product.findFirst({ 
      where: { 
        sku: finishedGood.sku 
      } 
    });
    if (!product) {
      // Create finished good product
      product = await prisma.product.create({
        data: {
          name: finishedGood.name,
          sku: finishedGood.sku,
          price: 0, // Will be calculated below
          costPrice: 0, // Will be calculated below
          stock: 0,
          reorderLevel: finishedGood.reorderLevel || 0,
          description: finishedGood.description || '',
          categoryId,
          supplierId: finishedGood.supplierId || null,
          stockType: 'finished_good'
        }
      });
    }
    // Upsert BOM for this product
    const bom = await prisma.bOM.upsert({
      where: { productId: product.id },
      update: {
        name: finishedGood.name || undefined,
        description: finishedGood.description || undefined,
        updatedAt: new Date()
      },
      create: {
        productId: product.id,
        name: finishedGood.name || undefined,
        description: finishedGood.description || undefined
      }
    });
    // Delete existing BOM items for this BOM
    await prisma.bOMItem.deleteMany({ where: { bomId: bom.id } });
    // Create new BOM items
    await Promise.all(components.map((c: any) =>
      prisma.bOMItem.create({
        data: {
          bomId: bom.id,
          rawMaterialId: c.rawMaterialId,
          quantity: c.quantity
        }
      })
    ));

    // Calculate costPrice and price from BOM using unitCost for raw materials
    let costPrice = 0;
    const bomItems = await prisma.bOMItem.findMany({
      where: { bomId: bom.id },
      include: { rawMaterial: true }
    });
    const costBreakdown = [];
    for (const item of bomItems) {
      const raw = item.rawMaterial;
      // Use unitCost for BOM calculation (never costPrice)
      const unitCost = Number(raw.unitCost) || 0;
      const rawCost = unitCost * item.quantity;
      costBreakdown.push({
        name: raw.name,
        sku: raw.sku,
        unitCost,
        quantity: item.quantity,
        total: rawCost
      });
      costPrice += rawCost;
    }
    // Price calculation
    let price = costPrice;
    let priceMethod = finishedGood.pricingMethod || 'markup';
    
    // Fetch default pricing settings
    const salesSettings = await prisma.salesSettings.findFirst();
    const defaultMarkup = salesSettings?.defaultMarkupPercentage || 25;
    const defaultMargin = salesSettings?.defaultMarginPercentage || 20;
    
    let priceFormula = '';
    if (finishedGood.pricingOverride && typeof finishedGood.price === 'number' && !isNaN(finishedGood.price)) {
      price = finishedGood.price;
      priceFormula = 'Override';
    } else if (priceMethod === 'markup') {
      price = costPrice * (1 + defaultMarkup / 100);
      priceFormula = `costPrice * (1 + markup/100) = ${costPrice} * (1 + ${defaultMarkup}/100)`;
    } else if (priceMethod === 'margin') {
      price = costPrice / (1 - (defaultMargin / 100));
      priceFormula = `costPrice / (1 - margin/100) = ${costPrice} / (1 - ${defaultMargin}/100)`;
    } else {
      priceFormula = 'Unknown pricing method, using costPrice';
    }
    // Optionally round price
    price = Math.round(price * 100) / 100;
    // Update product with calculated price/costPrice (always store calculated price unless override)
    await prisma.product.update({
      where: { id: product.id },
      data: {
        costPrice,
        price,
        pricingMethod: priceMethod,
        pricingOverride: !!finishedGood.pricingOverride
      }
    });
    // Return the updated BOM with items and price breakdown
    const updatedBOM = await prisma.bOM.findUnique({
      where: { id: bom.id },
      include: {
        product: true,
        items: { include: { rawMaterial: true } }
      }
    });
    return res.json({
      bom: updatedBOM,
      priceDetails: {
        costPrice,
        price,
        priceFormula,
        costBreakdown
      }
    });
  } catch (error) {
    console.error('Error creating/updating BOM:', error);
    return res.status(500).json({ error: 'Failed to create/update BOM' });
  }
});


// --- Production Orders ---

// POST /api/manufacturing/orders - Create a new production order
router.post('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'productId and positive quantity are required' });
    }
    // Generate a unique order number (e.g., MO-YYYYMMDD-HHMMSS-<random>)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const orderNumber = `MO-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.floor(Math.random()*10000)}`;
    // Create the order (status: pending)
    const order = await prisma.manufacturingOrder.create({
      data: {
        orderNumber,
        productId,
        quantity,
        status: 'pending',
        notes: notes || null
      }
    });
    return res.json({ order });
  } catch (error) {
    console.error('Error creating production order:', error);
    return res.status(500).json({ error: 'Failed to create production order' });
  }
});

// GET /api/manufacturing/orders - List/filter production orders
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;
    const orders = await prisma.manufacturingOrder.findMany({
      where,
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ orders });
  } catch (error) {
    console.error('Error listing production orders:', error);
    return res.status(500).json({ error: 'Failed to list production orders' });
  }
});

// PATCH /api/manufacturing/orders/:id - Update status only (no inventory changes)
router.patch('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update order status only - no inventory changes
    const updated = await prisma.manufacturingOrder.update({
      where: { id },
      data: { status }
    });
    return res.json({ order: updated });
  } catch (error) {
    console.error('Error updating production order status:', error);
    return res.status(500).json({ error: 'Failed to update production order status' });
  }
});

// POST /api/manufacturing/orders/:id/complete - Complete production (deduct materials, add finished goods)
router.post('/orders/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Fetch order and BOM
    const order = await prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.productId) return res.status(400).json({ error: 'Order missing productId' });
    
    // Check if already completed
    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Order is already completed' });
    }
    
    // Fetch finished good product
    const finishedProduct = await prisma.product.findUnique({ where: { id: order.productId } });
    if (!finishedProduct) return res.status(404).json({ error: 'Finished good not found' });
    
    // Fetch BOM for this finished good
    const bom = await prisma.bOM.findUnique({
      where: { productId: order.productId },
      include: { items: { include: { rawMaterial: true } } }
    });
    if (!bom) return res.status(400).json({ error: 'No BOM found for finished good' });
    
    // Fetch settings for unit, pricing config, and costing method
    const settings = await prisma.settings.findMany({
      where: { key: { in: ['unitOfMeasurement', 'pricingConfig', 'inventoryCalculationMethod'] } }
    });
    const unit = settings.find(s => s.key === 'unitOfMeasurement')?.value || 'pcs';
    const pricingConfig = settings.find(s => s.key === 'pricingConfig')?.value || 'markup';
    // Ensure costingMethod is always a valid CostingMethod string
    let costingMethodRaw = settings.find(s => s.key === 'inventoryCalculationMethod')?.value || 'fifo';
    const validCostingMethods = ['fifo', 'lifo', 'wac'] as const;
    type CostingMethod = typeof validCostingMethods[number];
    const isCostingMethod = (val: any): val is CostingMethod => validCostingMethods.includes(val);
    const costingMethod: CostingMethod = isCostingMethod(costingMethodRaw) ? costingMethodRaw : 'fifo';

    // Calculate total cost of raw materials using unitCost and deduct from inventory
    let totalCost = 0;
    for (const item of bom.items) {
      const rawMaterial = await prisma.product.findUnique({ where: { id: item.rawMaterialId } });
      if (!rawMaterial) {
        return res.status(400).json({ error: `Raw material not found: ${item.rawMaterialId}` });
      }
      // Calculate required units (e.g., pieces, grams)
      const requiredUnits = item.quantity * order.quantity;
      
      // Deduct from batches and update product stock
      const { deductRawMaterialFromBatches } = await import('../lib/costingUtil');
      try {
        await deductRawMaterialFromBatches(prisma, rawMaterial.id, requiredUnits, costingMethod);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        const batches = await prisma.productPurchaseBatch.findMany({ where: { productId: rawMaterial.id } });
        const batchAvailable = batches.reduce((sum, b) => sum + (b.remaining || 0), 0);

        // Add detailed error with raw material info
        return res.status(400).json({
          error: `Insufficient batch stock for deduction: ${rawMaterial.name} (SKU: ${rawMaterial.sku}, ID: ${rawMaterial.id}) - Needed: ${requiredUnits}, Available: ${batchAvailable} \\n Error: ${errorMsg}`
        });
      }
      
      // Note: deductRawMaterialFromBatches already updates both stock and availableQuantities
      // No need for additional updates here
      
      // Use unitCost for cost calculation
      const unitCost = Number(rawMaterial.unitCost) || 0;
      totalCost += unitCost * requiredUnits;
    }
    
    // Calculate cost per unit (totalCost is for entire order quantity)
    const costPerUnit = totalCost / order.quantity;
    
    // Calculate finished good price using product's own pricing method
    let finishedGoodPrice = Number(finishedProduct.price);
    const pricingMethod = finishedProduct.pricingMethod || 'markup';
    
    // Fetch default pricing settings
    const salesSettings = await prisma.salesSettings.findFirst();
    const defaultMarkup = salesSettings?.defaultMarkupPercentage || 25;
    const defaultMargin = salesSettings?.defaultMarginPercentage || 20;
    
    // Check if product has pricing override
    if (finishedProduct.pricingOverride && typeof finishedProduct.price === 'number' && !isNaN(finishedProduct.price)) {
      // Keep existing price - do not update
      finishedGoodPrice = Number(finishedProduct.price);
    } else if (pricingMethod === 'markup') {
      // Use default markup percentage
      finishedGoodPrice = costPerUnit * (1 + defaultMarkup / 100);
    } else if (pricingMethod === 'margin') {
      // Use default margin percentage  
      finishedGoodPrice = costPerUnit / (1 - (defaultMargin / 100));
    } // else keep existing price for unknown methods
    
    // Round price to 2 decimal places
    finishedGoodPrice = Math.round(finishedGoodPrice * 100) / 100;
    
    // Increase finished good stock and update price if not fixed or overridden
    const shouldUpdatePrice = !finishedProduct.pricingOverride && pricingMethod !== 'fixed';
    await prisma.product.update({
      where: { id: order.productId },
      data: {
        stock: { increment: order.quantity },
        costPrice: costPerUnit,
        ...(shouldUpdatePrice ? { price: finishedGoodPrice } : {})
      }
    });
    
    // Update order status to completed
    const updated = await prisma.manufacturingOrder.update({
      where: { id },
      data: { status: 'completed' }
    });
    
    return res.json({ 
      order: updated, 
      message: 'Production completed successfully',
      producedQuantity: order.quantity,
      totalCost,
      costPerUnit,
      finishedGoodPrice
    });
  } catch (error) {
    console.error('Error completing production order:', error);
    return res.status(500).json({ error: 'Failed to complete production order' });
  }
});

export default router;
