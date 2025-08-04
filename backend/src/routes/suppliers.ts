import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all suppliers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { contactName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { products: true }
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: true }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    return res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new supplier
router.post('/', [
  body('name').isLength({ min: 2 }).trim(),
  body('contactName').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 5 }),
  body('address').optional().isLength({ min: 5 }).trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, contactName, email, phone, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null
      }
    });
    return res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', [
  body('name').optional().isLength({ min: 2 }).trim(),
  body('contactName').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 5 }),
  body('address').optional().isLength({ min: 5 }).trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, contactName, email, phone, address } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(contactName !== undefined && { contactName: contactName || null }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null })
      }
    });
    return res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete supplier
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: true }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    // Prevent deletion if supplier has products
    if (supplier.products.length > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier with associated products. Consider archiving instead.' });
    }
    await prisma.supplier.delete({ where: { id } });
    return res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/suppliers/:id/deactivate
router.patch('/:id/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate supplier' });
  }
});

// PATCH /api/suppliers/:id/activate
router.patch('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: true }
    });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate supplier' });
  }
});

// Optionally, keep PUT for updates (including isActive)

export default router;
