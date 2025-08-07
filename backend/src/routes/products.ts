import express, { Response } from 'express';
// Utility to sync availableQuantities with batch.remaining
import { syncAvailableQuantities } from '../lib/syncAvailableQuantities';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { stockType } = req.query;
    const where: any = {};
    if (stockType && typeof stockType === 'string') {
      where.stockType = stockType;
    }
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - Get all categories
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        category: true,
        supplier: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
// Only allow creation of raw_material and asset_equipment here. Finished goods must be created via manufacturing/BOM workflow.
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, costPrice, stock, reorderLevel, description, categoryId, supplierId, stockType, measurementType, measurementValue } = req.body;

    // Enforce: only allow raw_material and asset_equipment
    if (stockType === 'finished_good') {
      return res.status(400).json({ error: 'Finished goods must be created via the BOM workflow. Direct creation is not allowed.' });
    }
    if (stockType !== 'raw_material' && stockType !== 'asset_equipment' && stockType !== 'consumable') {
      return res.status(400).json({ error: 'Invalid stock type. Only raw_material and asset_equipment can be created here.' });
    }

    // For raw_material and asset_equipment, price is always 0 (not for sale), costPrice is used for costing
    let baseCost = parseFloat(costPrice);
    if (isNaN(baseCost)) baseCost = 0;

    const stockInt = parseInt(stock || '0');
    const measurementVal = stockType === 'raw_material' ? parseInt(measurementValue || '0') : 0;
    const availableQuantities = stockType === 'raw_material' ? stockInt * measurementVal : 0;
    let unitCost = 0;
    if (stockType === 'raw_material' && measurementVal > 0) {
      unitCost = baseCost / measurementVal;
    }
    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        price: 0,
        costPrice: baseCost,
        unitCost,
        stock: stockInt,
        reorderLevel: parseInt(reorderLevel || '0'),
        description,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        stockType,
        assetCategory: (stockType === 'asset_equipment') ? 'fixed_asset': 'current_asset',
        measurementType: stockType === 'raw_material' ? measurementType : null,
        measurementValue: stockType === 'raw_material' ? measurementValue : null,
        availableQuantities
      },
      include: {
        category: true,
        supplier: true
      }
    });

    return res.status(201).json(newProduct);
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product SKU already exists' });
    }
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, costPrice, stock, reorderLevel, description, categoryId, supplierId, stockType, measurementType, measurementValue } = req.body;

    const baseCost = parseFloat(costPrice);
    if (isNaN(baseCost)) {
      return res.status(400).json({ error: 'Invalid cost price' });
    }
    const stockInt = parseInt(stock || '0');
    const measurementVal = stockType === 'raw_material' ? parseInt(measurementValue || '0') : 0;
    const availableQuantities = stockType === 'raw_material' ? stockInt * measurementVal : 0;
    let unitCost = 0;
    if (stockType === 'raw_material' && measurementVal > 0) {
      unitCost = baseCost / measurementVal;
    }
    const updatedProduct = await prisma.product.update({
      where: {
        id: req.params.id
      },
      data: {
        name,
        sku,
        price: 0, // Price is always 0 for raw_material and asset_equipment
        costPrice: baseCost,
        unitCost,
        stock: stockInt,
        reorderLevel: parseInt(reorderLevel || '0'),

        description,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        stockType: stockType || 'raw_material',
        measurementType: stockType === 'raw_material' ? measurementType : null,
        measurementValue: stockType === 'raw_material' ? measurementValue : null
        // availableQuantities will be synced after update
      },
      include: {
        category: true,
        supplier: true
      }
    });
    // Sync availableQuantities after update
    await syncAvailableQuantities(req.params.id);

    return res.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product SKU already exists' });
    }
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({
      where: {
        id: req.params.id
      }
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting product:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
