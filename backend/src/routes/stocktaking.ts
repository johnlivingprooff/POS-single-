import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/stocktaking/status
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'stocktakingActive' }
    });
    
    const isActive = setting?.value === 'true';
    
    // If there's a user who started stocktaking, fetch their name
    let startedByName = null;
    if (setting?.createdBy) {
      const user = await prisma.user.findUnique({
        where: { id: setting.createdBy },
        select: { name: true }
      });
      startedByName = user?.name || null;
    }
    
    return res.json({ 
      isActive: isActive,
      startedAt: setting?.updatedAt,
      startedBy: startedByName
    });
  } catch (error) {
    console.error('Error fetching stocktaking status:', error);
    return res.status(500).json({ error: 'Failed to fetch stocktaking status' });
  }
});

// POST /api/stocktaking/start
router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if stocktaking is already active
    const existingSetting = await prisma.settings.findUnique({
      where: { key: 'stocktakingActive' }
    });

    if (existingSetting?.value === 'true') {
      return res.status(400).json({ error: 'Stocktaking is already active' });
    }

    // Set stocktaking as active
    await prisma.settings.upsert({
      where: { key: 'stocktakingActive' },
      update: { 
        value: 'true',
        createdBy: userId,
        updatedAt: new Date()
      },
      create: { 
        key: 'stocktakingActive', 
        value: 'true',
        createdBy: userId
      }
    });

    // Get all products for empty stock sheet
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        supplier: true
      },
      orderBy: [
        { stockType: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get the user's name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    return res.json({
      message: 'Stocktaking started successfully',
      isActive: true,
      startedAt: new Date(),
      startedBy: user?.name || null,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockType: product.stockType,
        category: product.category?.name || 'Uncategorized',
        supplier: product.supplier?.name || 'No Supplier',
        measurementType: product.measurementType,
        measurementValue: product.measurementValue,
        currentStock: 0, // Empty for stocktaking sheet
        currentValue: '', // Empty for stocktaking sheet
        actualStock: '', // Empty field for manual entry
        actualValue: '', // Empty field for manual entry
        variance: '', // Empty field for calculation
        notes: '' // Empty field for notes
      }))
    });
  } catch (error) {
    console.error('Error starting stocktaking:', error);
    return res.status(500).json({ error: 'Failed to start stocktaking' });
  }
});

// POST /api/stocktaking/end
router.post('/end', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if stocktaking is active
    const existingSetting = await prisma.settings.findUnique({
      where: { key: 'stocktakingActive' }
    });

    if (existingSetting?.value !== 'true') {
      return res.status(400).json({ error: 'No active stocktaking session found' });
    }

    // Set stocktaking as inactive
    await prisma.settings.update({
      where: { key: 'stocktakingActive' },
      data: { 
        value: 'false',
        updatedAt: new Date()
      }
    });

    // Get all products with current stock for final report
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        supplier: true
      },
      orderBy: [
        { stockType: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get the user's name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    return res.json({
      message: 'Stocktaking ended successfully',
      isActive: false,
      endedAt: new Date(),
      endedBy: user?.name || null,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockType: product.stockType,
        category: product.category?.name || 'Uncategorized',
        supplier: product.supplier?.name || 'No Supplier',
        measurementType: product.measurementType,
        measurementValue: product.measurementValue,
        // For raw materials, show availableQuantities if available
        currentStock: product.stockType === 'raw_material' 
          ? product.availableQuantities || product.stock 
          : product.stock,
        currentValue: (product.stockType === 'raw_material' 
          ? (product.availableQuantities || product.stock) * Number(product.costPrice)
          : product.stock * Number(product.costPrice)).toFixed(2),
        costPrice: Number(product.costPrice).toFixed(2),
        totalValue: (
          (product.stockType === 'raw_material' 
            ? (product.availableQuantities || product.stock) 
            : product.stock) * Number(product.costPrice)
        ).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error ending stocktaking:', error);
    return res.status(500).json({ error: 'Failed to end stocktaking' });
  }
});

// GET /api/stocktaking/report
router.get('/report', async (req: AuthRequest, res: Response) => {
  try {
    // Get current products for stocktaking report
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        supplier: true
      },
      orderBy: [
        { stockType: 'asc' },
        { name: 'asc' }
      ]
    });

    const report = {
      generatedAt: new Date(),
      totalProducts: products.length,
      totalValue: products.reduce((sum, product) => {
        const stock = product.stockType === 'raw_material' 
          ? (product.availableQuantities || product.stock) 
          : product.stock;
        return sum + (stock * Number(product.costPrice));
      }, 0),
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockType: product.stockType,
        category: product.category?.name || 'Uncategorized',
        supplier: product.supplier?.name || 'No Supplier',
        measurementType: product.measurementType,
        measurementValue: product.measurementValue,
        availableQuantities: product.stockType === 'raw_material' 
          ? product.availableQuantities || product.stock 
          : product.stock,
        costPrice: Number(product.costPrice),
        totalValue: (
          (product.stockType === 'raw_material' 
            ? (product.availableQuantities || product.stock) 
            : product.stock) * Number(product.costPrice)
        )
      }))
    };

    return res.json(report);
  } catch (error) {
    console.error('Error generating stocktaking report:', error);
    return res.status(500).json({ error: 'Failed to generate stocktaking report' });
  }
});

export default router;
