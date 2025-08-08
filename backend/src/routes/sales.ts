import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all sales
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const customerId = req.query.customerId as string;
    const skip = (page - 1) * limit;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const where: any = {};

    // For employees, only show their own sales records
    if (userRole === 'employee') {
      where.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sale by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                supplier: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new sale (POS transaction)
router.post('/', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isLength({ min: 10 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('paymentMethod')
    .custom((value) => {
      const allowed = ['cash', 'card', 'digital', 'mobile_money', 'bank_transfer', 'cheque'];
      if (allowed.includes(value)) return true;
      // Allow any non-empty string for 'other' (custom value)
      if (typeof value === 'string' && value.trim().length > 0) return true;
      return false;
    })
    .withMessage('Invalid payment method'),
  body('customerId').optional().isLength({ min: 10 }).withMessage('Invalid customer ID'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
  body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be positive')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, paymentMethod, customerId, discount = 0, tax = 0, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate all products exist and calculate totals
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Check stock availability and calculate subtotal
    // BUSINESS LOGIC: Direct sales-from-inventory model - products sold at costPrice
    let subtotal = 0;
    const saleItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number; // This now represents costPrice from frontend
      total: number;
    }> = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      // CHANGED: unitPrice now comes from frontend as costPrice (direct sales model)
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: itemTotal
      });
    }

    // Calculate final total
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * tax) / 100;
    const total = subtotal - discountAmount + taxAmount;

    // Generate sale number
    const saleCount = await prisma.sale.count();
    const saleNumber = `SALE-${String(saleCount + 1).padStart(6, '0')}`;

    // Create sale with transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          userId,
          customerId: customerId || null,
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          notes: notes || null,
          items: {
            create: saleItems
          }
        },
        include: {
          customer: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      // Update product stock with proper clamping to prevent negative values
      for (const item of items) {
        const currentProduct = await tx.product.findUnique({ 
          where: { id: item.productId },
          select: { stock: true }
        });
        const newStock = Math.max(0, (currentProduct?.stock || 0) - item.quantity);
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });
      }

      return newSale;
    });

    return res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales statistics
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'today' } = req.query;
    let startDate: Date;
    
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const [salesStats, topProducts] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: {
            createdAt: {
              gte: startDate
            }
          }
        },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Get product details for top products
    const productIds = topProducts.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: { select: { name: true } } }
    });

    const topProductsWithDetails = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product,
        quantitySold: item._sum.quantity,
        revenue: item._sum.total
      };
    });

    res.json({
      period,
      totalSales: salesStats._count.id || 0,
      totalRevenue: salesStats._sum.total || 0,
      topProducts: topProductsWithDetails
    });
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
