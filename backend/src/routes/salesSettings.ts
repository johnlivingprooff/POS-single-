import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/settings/sales/pricingConfiguration
router.get('/pricingConfiguration', async (req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.salesSettings.findFirst();
    return res.json(config || {
      defaultPricingMethod: 'markup',
      defaultMarkupPercentage: 25,
      defaultMarginPercentage: 20,
      enablePriceRounding: true,
      roundingRule: 'nearest_cent',
      showCalculationDetails: true,
      allowProductLevelOverrides: true
    });
  } catch (error) {
    console.error('Error fetching sales pricing configuration:', error);
    return res.status(500).json({ error: 'Failed to fetch pricing configuration' });
  }
});

// PUT /api/settings/sales/pricingConfiguration
router.put('/pricingConfiguration', async (req: AuthRequest, res: Response) => {
  try {
    const {
      defaultPricingMethod,
      defaultMarkupPercentage,
      defaultMarginPercentage,
      enablePriceRounding,
      roundingRule,
      showCalculationDetails,
      allowProductLevelOverrides
    } = req.body;
    // Upsert config row
    const existing = await prisma.salesSettings.findFirst();
    const updated = await prisma.salesSettings.upsert({
      where: { id: existing?.id || '' },
      update: {
        defaultPricingMethod,
        defaultMarkupPercentage,
        defaultMarginPercentage,
        enablePriceRounding,
        roundingRule,
        showCalculationDetails,
        allowProductLevelOverrides
      },
      create: {
        defaultPricingMethod,
        defaultMarkupPercentage,
        defaultMarginPercentage,
        enablePriceRounding,
        roundingRule,
        showCalculationDetails,
        allowProductLevelOverrides
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating sales pricing configuration:', error);
    return res.status(500).json({ error: 'Failed to update pricing configuration' });
  }
});

export default router;
