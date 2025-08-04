import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/categories - List all categories
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description }
    });
    return res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, isActive }
    });
    return res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
