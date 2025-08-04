import express, { Response } from 'express';
import { AuthRequest } from '../types/authRequest';
import prisma from '../lib/prisma';
import { SUPPORTED_CURRENCIES, getCurrency } from '../lib/currencies';

const router = express.Router();

// --- Global Currency Settings ---
router.get('/currency', async (req: AuthRequest, res: Response) => {
  try {
    // Get global currency setting
    const globalSetting = await prisma.settings.findUnique({
      where: { key: 'currency' }
    });
    
    return res.json({ 
      currency: globalSetting?.value || 'USD'
    });
  } catch (error) {
    console.error('Error fetching currency:', error);
    return res.status(500).json({ error: 'Failed to fetch currency setting' });
  }
});

router.put('/currency', async (req: AuthRequest, res: Response) => {
  try {
    const { currency } = req.body;

    // Validate currency
    const currencyInfo = getCurrency(currency);
    if (!currencyInfo) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }

    // Update global currency setting
    const updated = await prisma.settings.upsert({
      where: { key: 'currency' },
      update: { value: currency },
      create: { 
        key: 'currency',
        value: currency
      }
    });

    return res.json({ 
      currency: updated.value,
      currencyInfo
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    return res.status(500).json({ error: 'Failed to update currency setting' });
  }
});

// Get all supported currencies
router.get('/currencies', async (req: AuthRequest, res: Response) => {
  try {
    return res.json(SUPPORTED_CURRENCIES);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});


// --- Inventory Calculation Method ---
router.get('/inventoryCalculationMethod', async (req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'inventoryCalculationMethod' }
    });
    return res.json({ value: setting?.value || 'fifo' });
  } catch (error) {
    console.error('Error fetching inventory calculation method:', error);
    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

router.put('/inventoryCalculationMethod', async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body;
    if (!['fifo', 'lifo', 'wac'].includes(value)) {
      return res.status(400).json({ error: 'Invalid calculation method' });
    }
    const updated = await prisma.settings.upsert({
      where: { key: 'inventoryCalculationMethod' },
      update: { value },
      create: { key: 'inventoryCalculationMethod', value }
    });
    return res.json({ value: updated.value });
  } catch (error) {
    console.error('Error updating inventory calculation method:', error);
    return res.status(500).json({ error: 'Failed to update setting' });
  }
});

// --- General Settings ---

// GET /api/settings/general
router.get('/general', async (req: AuthRequest, res: Response) => {
  try {
    const keys = ['unitOfMeasurement', 'currency', 'companyName'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } }
    });
    // Map to key-value pairs, with defaults
    const result: Record<string, string> = {
      unitOfMeasurement: settings.find(s => s.key === 'unitOfMeasurement')?.value || 'pcs',
      currency: settings.find(s => s.key === 'currency')?.value || 'USD',
      companyName: settings.find(s => s.key === 'companyName')?.value || ''
    };
    return res.json(result);
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return res.status(500).json({ error: 'Failed to fetch general settings' });
  }
});

// PUT /api/settings/general
router.put('/general', async (req: AuthRequest, res: Response) => {
  try {
    const { unitOfMeasurement, currency, companyName } = req.body;
    const allowedUnits = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'ft', 'custom'];
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'custom'];
    const updates: { key: string, value: string }[] = [];
    if (unitOfMeasurement) {
      if (!allowedUnits.includes(unitOfMeasurement) && unitOfMeasurement !== 'custom') {
        return res.status(400).json({ error: 'Invalid unit of measurement' });
      }
      updates.push({ key: 'unitOfMeasurement', value: unitOfMeasurement });
    }
    if (currency) {
      if (!allowedCurrencies.includes(currency) && currency !== 'custom') {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      updates.push({ key: 'currency', value: currency });
    }
    if (companyName !== undefined) {
      updates.push({ key: 'companyName', value: companyName });
    }
    // Upsert all provided settings
    await Promise.all(updates.map(({ key, value }) =>
      prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    ));
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating general settings:', error);
    return res.status(500).json({ error: 'Failed to update general settings' });
  }
});

// --- Tax Settings ---

// GET /api/settings/tax
router.get('/tax', async (req: AuthRequest, res: Response) => {
  try {
    const taxKeys = ['taxEnabled', 'taxType', 'taxPercentage', 'taxName'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: taxKeys } }
    });
    
    const result = {
      taxEnabled: settings.find(s => s.key === 'taxEnabled')?.value === 'true' || false,
      taxType: settings.find(s => s.key === 'taxType')?.value || 'exclusive',
      taxPercentage: parseFloat(settings.find(s => s.key === 'taxPercentage')?.value || '0'),
      taxName: settings.find(s => s.key === 'taxName')?.value || 'Tax'
    };
    
    return res.json(result);
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    return res.status(500).json({ error: 'Failed to fetch tax settings' });
  }
});

// PUT /api/settings/tax
router.put('/tax', async (req: AuthRequest, res: Response) => {
  try {
    const { taxEnabled, taxType, taxPercentage, taxName } = req.body;
    
    // Validation
    if (taxType && !['inclusive', 'exclusive'].includes(taxType)) {
      return res.status(400).json({ error: 'Invalid tax type. Must be "inclusive" or "exclusive"' });
    }
    
    if (taxPercentage !== undefined && (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100)) {
      return res.status(400).json({ error: 'Tax percentage must be a number between 0 and 100' });
    }
    
    const updates: { key: string, value: string }[] = [];
    
    if (taxEnabled !== undefined) {
      updates.push({ key: 'taxEnabled', value: taxEnabled.toString() });
    }
    
    if (taxType) {
      updates.push({ key: 'taxType', value: taxType });
    }
    
    if (taxPercentage !== undefined) {
      updates.push({ key: 'taxPercentage', value: taxPercentage.toString() });
    }
    
    if (taxName !== undefined) {
      updates.push({ key: 'taxName', value: taxName });
    }
    
    // Upsert all provided settings
    await Promise.all(updates.map(({ key, value }) =>
      prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    ));
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating tax settings:', error);
    return res.status(500).json({ error: 'Failed to update tax settings' });
  }
});

// --- Currency Settings ---

// GET /api/settings/currency
router.get('/currency', async (req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'currency' }
    });
    
    const currencyCode = setting?.value || 'USD';
    const currency = getCurrency(currencyCode);

    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    return res.json({
      currency: currency.code,
      currencyName: currency.name,
      currencySymbol: currency.symbol
    });
  } catch (error) {
    console.error('Get currency error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/currency
router.put('/currency', async (req: AuthRequest, res: Response) => {
  try {
    const { currency: currencyCode } = req.body;

    if (!currencyCode) {
      return res.status(400).json({ 
        errors: [{ type: 'field', msg: 'Currency code is required', path: 'currency' }] 
      });
    }

    const currency = getCurrency(currencyCode);
    if (!currency) {
      return res.status(400).json({ 
        errors: [{ type: 'field', msg: 'Unsupported currency', path: 'currency' }] 
      });
    }

    // Update currency setting in database
    await prisma.settings.upsert({
      where: { key: 'currency' },
      update: { value: currencyCode },
      create: { key: 'currency', value: currencyCode }
    });

    return res.json({
      currency: currency.code,
      currencyName: currency.name,
      currencySymbol: currency.symbol,
      message: 'Currency updated successfully'
    });
  } catch (error) {
    console.error('Update currency error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/currencies
router.get('/currencies', async (req: AuthRequest, res: Response) => {
  try {
    const { region } = req.query;

    let currencies = SUPPORTED_CURRENCIES;
    
    // Filter by region if specified
    if (region === 'africa') {
      currencies = SUPPORTED_CURRENCIES.filter(c => c.region === 'africa');
    } else if (region === 'global') {
      currencies = SUPPORTED_CURRENCIES.filter(c => c.region === 'global');
    }

    return res.json(currencies);
  } catch (error) {
    console.error('Get currencies error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
