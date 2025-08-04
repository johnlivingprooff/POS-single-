import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// Helper function for date filtering
function getDateFilter(period?: string, startDate?: string, endDate?: string) {
  let dateFilter: any = {};
  const now = new Date();
  
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };
  } else {
    switch (period) {
      case 'today':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
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
      case 'year':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), 0, 1)
          }
        };
        break;
    }
  }
  
  return dateFilter;
}

// Sales reports
router.get('/sales', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    const dateFilter = getDateFilter(period as string, startDate as string, endDate as string);
    
    // For employees, only show their own sales data
    const salesFilter = userRole === 'employee' ? { ...dateFilter, userId } : dateFilter;

    const [salesSummary, topProducts, salesByPaymentMethod] = await Promise.all([
      // Sales summary
      prisma.sale.aggregate({
        where: salesFilter,
        _sum: {
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        },
        _count: {
          id: true
        },
        _avg: {
          total: true
        }
      }),
      
      // Top selling products
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: salesFilter
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
        take: 10
      }),
      
      // Sales by payment method
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: salesFilter,
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Get product details for top products
    const productIds = topProducts.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true
      }
    });

    const topProductsWithDetails = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: {
          id: product?.id,
          name: product?.name,
          category: product?.category?.name
        },
        quantitySold: item._sum.quantity,
        revenue: item._sum.total
      };
    });

    return res.json({
      period,
      dateRange: {
        start: startDate || (period === 'today' ? new Date().toISOString().split('T')[0] : null),
        end: endDate || new Date().toISOString().split('T')[0]
      },
      summary: {
        totalSales: salesSummary._count.id || 0,
        totalRevenue: salesSummary._sum.total || 0,
        totalSubtotal: salesSummary._sum.subtotal || 0,
        totalTax: salesSummary._sum.tax || 0,
        totalDiscount: salesSummary._sum.discount || 0,
        averageSale: salesSummary._avg.total || 0
      },
      topProducts: topProductsWithDetails,
      paymentMethods: salesByPaymentMethod
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory reports
router.get('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const [
      inventorySummary,
      lowStockProducts,
      categoryBreakdown,
      topValueProducts
    ] = await Promise.all([
      // Inventory summary
      prisma.product.aggregate({
        _sum: {
          stock: true
        },
        _count: {
          id: true
        }
      }),
      
      // Low stock products
      prisma.product.findMany({
        where: {
          stock: { lte: 10 },
          isActive: true
        },
        include: {
          category: true
        },
        orderBy: { stock: 'asc' },
        take: 10
      }),
      
      // Inventory by category
      prisma.product.groupBy({
        by: ['categoryId'],
        _sum: {
          stock: true
        },
        _count: {
          id: true
        }
      }),
      
      // Top value products (stock * cost)
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true
        },
        orderBy: { stock: 'desc' },
        take: 10
      })
    ]);

    // Get category details
    const categoryIds = categoryBreakdown.map(item => item.categoryId).filter(Boolean);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds as string[] } }
    });

    const categoryBreakdownWithDetails = categoryBreakdown.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId);
      return {
        category: {
          id: item.categoryId,
          name: category?.name || 'No Category'
        },
        productCount: item._count.id,
        totalStock: item._sum.stock || 0
      };
    });

    // Calculate inventory value
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        stock: true,
        costPrice: true
      }
    });

    const totalInventoryValue = allProducts.reduce((sum, product) => {
      return sum + (product.stock * Number(product.costPrice));
    }, 0);

    return res.json({
      summary: {
        totalProducts: inventorySummary._count.id || 0,
        totalStock: inventorySummary._sum.stock || 0,
        totalValue: totalInventoryValue,
        lowStockCount: lowStockProducts.length
      },
      lowStockProducts,
      categoryBreakdown: categoryBreakdownWithDetails,
      topValueProducts: topValueProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'No Category',
        stock: product.stock,
        costPrice: product.costPrice,
        value: product.stock * Number(product.costPrice)
      }))
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer reports
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const [
      customerSummary,
      topCustomers,
      newCustomers
    ] = await Promise.all([
      // Customer summary
      prisma.customer.aggregate({
        _count: {
          id: true
        }
      }),
      
      // Top customers by sales value
      prisma.customer.findMany({
        include: {
          sales: {
            select: {
              total: true
            }
          }
        }
      }),
      
      // New customers (last 30 days)
      prisma.customer.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Calculate top customers by total sales
    const customersWithTotals = topCustomers
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSales: customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0),
        salesCount: customer.sales.length
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return res.json({
      summary: {
        totalCustomers: customerSummary._count.id || 0,
        newCustomersThisMonth: newCustomers.length
      },
      topCustomers: customersWithTotals,
      newCustomers: newCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt
      }))
    });
  } catch (error) {
    console.error('Error generating customer report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Financial reports
router.get('/financial', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
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
      case 'year':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), 0, 1)
          }
        };
        break;
    }

    // For employees, only show their own sales data
    const salesFilter = userRole === 'employee' ? { ...dateFilter, userId } : dateFilter;

    const [salesData, dailySales] = await Promise.all([
      // Overall financial summary
      prisma.sale.aggregate({
        where: salesFilter,
        _sum: {
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        }
      }),
      
      // Daily sales breakdown using findMany instead of raw query
      prisma.sale.findMany({
        where: salesFilter,
        select: {
          createdAt: true,
          total: true
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    return res.json({
      period,
      summary: {
        totalRevenue: Number(salesData._sum.total || 0),
        totalSubtotal: Number(salesData._sum.subtotal || 0),
        totalTax: Number(salesData._sum.tax || 0),
        totalDiscount: Number(salesData._sum.discount || 0),
        netRevenue: Number(salesData._sum.total || 0) - Number(salesData._sum.tax || 0)
      },
      dailyBreakdown: dailySales
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced sales analytics endpoint
router.get('/sales/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      period = 'month',
      categoryId,
      customerId,
      paymentMethod,
      productId
    } = req.query;
    
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    let dateFilter: any = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };
    } else {
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          };
          break;
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
        case 'year':
          dateFilter = {
            createdAt: {
              gte: new Date(now.getFullYear(), 0, 1)
            }
          };
          break;
      }
    }

    // Build additional filters
    let saleFilter: any = { ...dateFilter };
    if (customerId) saleFilter.customerId = customerId;
    if (paymentMethod) saleFilter.paymentMethod = paymentMethod;
    
    // For employees, only show their own sales data
    if (userRole === 'employee') {
      saleFilter.userId = userId;
    }

    const [
      salesTrends,
      topProductsByRevenue,
      topProductsByQuantity,
      salesByCategory,
      salesByCustomer,
      salesByPaymentMethod,
      lowPerformingProducts,
      salesSummary,
      recentSales
    ] = await Promise.all([
      // Sales trends over time (daily breakdown)
      prisma.sale.findMany({
        where: saleFilter,
        select: {
          createdAt: true,
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Top products by revenue
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: saleFilter,
          ...(productId && { productId: productId as string })
        },
        _sum: {
          total: true,
          quantity: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 10
      }),

      // Top products by quantity sold
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: saleFilter,
          ...(productId && { productId: productId as string })
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
        take: 10
      }),

      // Sales by category
      prisma.saleItem.findMany({
        where: {
          sale: saleFilter
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }),

      // Sales by customer
      prisma.sale.groupBy({
        by: ['customerId'],
        where: {
          ...saleFilter,
          customerId: { not: null }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 10
      }),

      // Sales by payment method
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: saleFilter,
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      }),

      // Low performing products (least sold)
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: saleFilter
        },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            quantity: 'asc'
          }
        },
        take: 10
      }),

      // Overall summary
      prisma.sale.aggregate({
        where: saleFilter,
        _sum: {
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        },
        _count: {
          id: true
        },
        _avg: {
          total: true
        }
      }),

      // Recent sales for detail view
      prisma.sale.findMany({
        where: saleFilter,
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
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Process category breakdown
    const categoryStats = salesByCategory.reduce((acc: any, item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          totalRevenue: 0,
          totalQuantity: 0,
          transactionCount: 0
        };
      }
      acc[categoryName].totalRevenue += Number(item.total);
      acc[categoryName].totalQuantity += item.quantity;
      acc[categoryName].transactionCount += 1;
      return acc;
    }, {});

    // Get product details for top products
    const allProductIds = [
      ...topProductsByRevenue.map(item => item.productId),
      ...topProductsByQuantity.map(item => item.productId),
      ...lowPerformingProducts.map(item => item.productId)
    ];
    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      include: { category: true }
    });

    // Get customer details
    const customerIds = salesByCustomer.map(item => item.customerId).filter(Boolean);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds as string[] } }
    });

    // Format response
    const enhancedTopProductsByRevenue = topProductsByRevenue.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: {
          id: product?.id,
          name: product?.name,
          category: product?.category?.name
        },
        revenue: item._sum.total,
        quantitySold: item._sum.quantity
      };
    });

    const enhancedTopProductsByQuantity = topProductsByQuantity.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: {
          id: product?.id,
          name: product?.name,
          category: product?.category?.name
        },
        quantitySold: item._sum.quantity,
        revenue: item._sum.total
      };
    });

    const enhancedLowPerformingProducts = lowPerformingProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: {
          id: product?.id,
          name: product?.name,
          category: product?.category?.name
        },
        quantitySold: item._sum.quantity,
        revenue: item._sum.total
      };
    });

    const enhancedSalesByCustomer = salesByCustomer.map(item => {
      const customer = customers.find(c => c.id === item.customerId);
      return {
        customer: {
          id: customer?.id,
          name: customer?.name,
          email: customer?.email
        },
        totalRevenue: item._sum.total,
        transactionCount: item._count.id
      };
    });

    return res.json({
      period,
      dateRange: {
        start: startDate || dateFilter.createdAt?.gte?.toISOString(),
        end: endDate || new Date().toISOString()
      },
      summary: {
        totalSales: salesSummary._count.id || 0,
        totalRevenue: Number(salesSummary._sum.total || 0),
        totalSubtotal: Number(salesSummary._sum.subtotal || 0),
        totalTax: Number(salesSummary._sum.tax || 0),
        totalDiscount: Number(salesSummary._sum.discount || 0),
        averageSale: Number(salesSummary._avg.total || 0),
        netRevenue: Number(salesSummary._sum.total || 0) - Number(salesSummary._sum.tax || 0)
      },
      trends: salesTrends,
      topProducts: {
        byRevenue: enhancedTopProductsByRevenue,
        byQuantity: enhancedTopProductsByQuantity
      },
      lowPerformingProducts: enhancedLowPerformingProducts,
      categoryBreakdown: Object.values(categoryStats),
      customerAnalysis: enhancedSalesByCustomer,
      paymentMethodBreakdown: salesByPaymentMethod,
      recentTransactions: recentSales
    });
  } catch (error) {
    console.error('Error generating sales analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export endpoints for PDF and Excel
router.get('/sales/export/excel', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    let dateFilter: any = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };
    } else {
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          };
          break;
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
        case 'year':
          dateFilter = {
            createdAt: {
              gte: new Date(now.getFullYear(), 0, 1)
            }
          };
          break;
      }
    }

    // For employees, only show their own sales data
    const salesFilter = userRole === 'employee' ? { ...dateFilter, userId } : dateFilter;

    const sales = await prisma.sale.findMany({
      where: salesFilter,
      include: {
        customer: true,
        user: {
          select: { name: true, email: true }
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for Excel export
    const salesData = sales.map(sale => ({
      saleNumber: sale.saleNumber,
      date: sale.createdAt.toISOString().split('T')[0],
      time: sale.createdAt.toISOString().split('T')[1].split('.')[0],
      customerName: sale.customer?.name || 'Walk-in Customer',
      customerEmail: sale.customer?.email || '',
      cashierName: sale.user?.name || '',
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      itemCount: sale.items.length
    }));

    const itemsData = sales.flatMap(sale => 
      sale.items.map(item => ({
        saleNumber: sale.saleNumber,
        date: sale.createdAt.toISOString().split('T')[0],
        productName: item.product.name,
        productSKU: item.product.sku,
        category: item.product.category?.name || 'Uncategorized',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    );

    return res.json({
      salesSummary: salesData,
      salesItems: itemsData,
      metadata: {
        period,
        dateRange: {
          start: startDate || dateFilter.createdAt?.gte?.toISOString(),
          end: endDate || new Date().toISOString()
        },
        totalRecords: sales.length
      }
    });
  } catch (error) {
    console.error('Error exporting sales data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory reports
router.get('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month', startDate, endDate, categoryId, stockType, userId } = req.query;
    
    const dateFilter = getDateFilter(period as string, startDate as string, endDate as string);
    
    // Build additional filters
    let productFilter: any = {};
    if (categoryId) productFilter.categoryId = categoryId;
    if (stockType) productFilter.stockType = stockType;
    
    let inventoryLogFilter: any = { ...dateFilter };
    if (userId) inventoryLogFilter.reference = { contains: userId as string };

    const [
      currentStock,
      stockMovements,
      inventoryAdjustments,
      lowStockItems,
      inventoryValuation,
      offsiteInventory,
      categoryBreakdown
    ] = await Promise.all([
      // Current stock levels
      prisma.product.findMany({
        where: { ...productFilter, isActive: true },
        include: {
          category: { select: { name: true } },
          supplier: { select: { name: true } }
        },
        orderBy: { stock: 'asc' }
      }),
      
      // Stock movements (inflow vs outflow)
      prisma.inventoryLog.groupBy({
        by: ['type', 'createdAt'],
        where: inventoryLogFilter,
        _sum: { quantity: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Inventory adjustments
      prisma.inventoryLog.findMany({
        where: {
          ...inventoryLogFilter,
          type: 'adjustment'
        },
        include: {
          product: { select: { name: true, sku: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      
      // Low stock alerts
      prisma.product.findMany({
        where: {
          ...productFilter,
          isActive: true,
          stock: { lte: prisma.product.fields.reorderLevel }
        },
        include: {
          category: { select: { name: true } }
        },
        orderBy: { stock: 'asc' }
      }),
      
      // Inventory valuation over time
      prisma.product.findMany({
        where: { ...productFilter, isActive: true },
        select: {
          id: true,
          name: true,
          stock: true,
          costPrice: true,
          stockType: true,
          categoryId: true
        }
      }),
      
      // Off-site inventory summary
      prisma.offSiteRequisition.findMany({
        where: {
          status: { in: ['approved', 'dispatched'] },
          ...dateFilter
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, stockType: true } }
            }
          },
          requester: { select: { name: true } }
        }
      }),
      
      // Stock by category breakdown
      prisma.product.groupBy({
        by: ['categoryId', 'stockType'],
        where: { ...productFilter, isActive: true },
        _sum: {
          stock: true
        },
        _avg: {
          costPrice: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Calculate inventory valuation
    const totalValuation = inventoryValuation.reduce((total: number, product: any) => {
      return total + (product.stock * Number(product.costPrice));
    }, 0);

    // Process stock movements for charts
    const stockMovementChart = stockMovements.reduce((acc: any[], movement: any) => {
      const date = new Date(movement.createdAt).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        if (movement.type === 'stock_in' || movement.type === 'return' || movement.type === 'offsite_return') {
          existing.inflow += movement._sum.quantity || 0;
        } else {
          existing.outflow += Math.abs(movement._sum.quantity || 0);
        }
      } else {
        acc.push({
          date,
          inflow: (movement.type === 'stock_in' || movement.type === 'return' || movement.type === 'offsite_return') ? (movement._sum.quantity || 0) : 0,
          outflow: (movement.type === 'stock_out' || movement.type === 'sale' || movement.type === 'offsite_out') ? Math.abs(movement._sum.quantity || 0) : 0
        });
      }
      
      return acc;
    }, []);

    // Calculate off-site totals
    const offsiteTotals = offsiteInventory.reduce((totals: any, requisition: any) => {
      requisition.items.forEach((item: any) => {
        const key = item.product.stockType;
        if (!totals[key]) totals[key] = { out: 0, returned: 0 };
        totals[key].out += item.quantityOut;
        totals[key].returned += item.quantityReturned;
      });
      return totals;
    }, {});

    res.json({
      summary: {
        totalProducts: currentStock.length,
        totalValuation: Math.round(totalValuation * 100) / 100,
        lowStockCount: lowStockItems.length,
        offsiteItemsCount: offsiteInventory.reduce((sum: number, req: any) => sum + req.items.length, 0)
      },
      currentStock,
      stockMovementChart,
      inventoryAdjustments,
      lowStockItems,
      offsiteInventory,
      categoryBreakdown,
      offsiteTotals,
      filters: {
        period,
        dateRange: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory reports:', error);
    res.status(500).json({ error: 'Failed to fetch inventory reports' });
  }
});

// Export inventory data
router.get('/inventory/export', async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'json', ...filters } = req.query;
    
    // Get inventory data using same logic as above
    const inventoryData = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
        inventoryLogs: {
          where: getDateFilter(filters.period as string, filters.startDate as string, filters.endDate as string),
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    res.json({
      data: inventoryData,
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: inventoryData.length,
        filters
      }
    });
  } catch (error) {
    console.error('Error exporting inventory data:', error);
    res.status(500).json({ error: 'Failed to export inventory data' });
  }
});

export default router;
