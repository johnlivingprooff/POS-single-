import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import sudoAuth, { SudoAuthRequest } from '../middleware/sudoAuth';

const router = express.Router();
const prisma = new PrismaClient();

// Sudo admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find sudo user in database
    // @ts-ignore - Prisma client regeneration in progress
    const sudoUser = await prisma.sudoUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!sudoUser || !sudoUser.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, sudoUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: sudoUser.id, email: sudoUser.email, role: sudoUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: sudoUser.id,
        email: sudoUser.email,
        name: sudoUser.name,
        role: sudoUser.role
      }
    });
    return;
  } catch (error) {
    console.error('Sudo login error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Get all organizations
router.get('/organizations', sudoAuth, async (req: SudoAuthRequest, res: Response) => {
  try {
    // @ts-ignore - Prisma client regeneration in progress
    const organizations = await prisma.organization.findMany({
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        featureToggles: true,
        users: {
          select: { id: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the expected format
    const transformedOrganizations = organizations.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      subscriptionPlan: org.subscriptionPlan,
      isActive: org.isActive,
      maxUsers: org.maxUsers,
      userCount: org._count.users,
      createdAt: org.createdAt,
      lastActive: org.updatedAt, // Using updatedAt as proxy for last active
      features: org.featureToggles.reduce((acc: any, toggle: any) => {
        acc[toggle.featureKey] = toggle.isEnabled;
        return acc;
      }, {} as Record<string, boolean>)
    }));

    res.json(transformedOrganizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new organization
router.post('/organizations', sudoAuth, async (req: SudoAuthRequest, res) => {
  try {
    const { name, slug, domain, subscriptionPlan, maxUsers } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check if slug already exists
    // @ts-ignore - Prisma client regeneration in progress
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already exists' });
    }

    // Create organization in database
    // @ts-ignore - Prisma client regeneration in progress
    const newOrganization = await prisma.organization.create({
      data: {
        name,
        slug,
        domain: domain || null,
        subscriptionPlan: subscriptionPlan || 'trial',
        isActive: true,
        maxUsers: maxUsers || 5,
      },
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        featureToggles: true,
        _count: {
          select: { users: true }
        }
      }
    });

    // Create default feature toggles for the organization
    const defaultFeatures = [
      { featureKey: 'pos', isEnabled: true },
      { featureKey: 'inventory', isEnabled: true },
      { featureKey: 'manufacturing', isEnabled: subscriptionPlan === 'premium' || subscriptionPlan === 'enterprise' },
      { featureKey: 'offsite', isEnabled: subscriptionPlan === 'premium' || subscriptionPlan === 'enterprise' },
      { featureKey: 'crm', isEnabled: true },
      { featureKey: 'reports', isEnabled: true },
      { featureKey: 'users', isEnabled: true }
    ];

    // @ts-ignore - Prisma client regeneration in progress
    await prisma.featureToggle.createMany({
      data: defaultFeatures.map(feature => ({
        organizationId: newOrganization.id,
        featureKey: feature.featureKey,
        isEnabled: feature.isEnabled
      }))
    });

    // Fetch the complete organization with feature toggles
    // @ts-ignore - Prisma client regeneration in progress
    const completeOrganization = await prisma.organization.findUnique({
      where: { id: newOrganization.id },
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        featureToggles: true,
        _count: {
          select: { users: true }
        }
      }
    });

    if (!completeOrganization) {
      return res.status(500).json({ error: 'Failed to retrieve created organization' });
    }

    // Transform the data to match the expected format
    const responseData = {
      id: completeOrganization.id,
      name: completeOrganization.name,
      slug: completeOrganization.slug,
      domain: completeOrganization.domain,
      subscriptionPlan: completeOrganization.subscriptionPlan,
      isActive: completeOrganization.isActive,
      maxUsers: completeOrganization.maxUsers,
      userCount: completeOrganization._count.users,
      createdAt: completeOrganization.createdAt,
      lastActive: completeOrganization.updatedAt,
      features: completeOrganization.featureToggles.reduce((acc: any, toggle: any) => {
        acc[toggle.featureKey] = toggle.isEnabled;
        return acc;
      }, {} as Record<string, boolean>)
    };

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Create organization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization
router.put('/organizations/:id', sudoAuth, async (req: SudoAuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, slug, domain, subscriptionPlan, maxUsers } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check if slug already exists for a different organization
    // @ts-ignore - Prisma client regeneration in progress
    const existingOrg = await prisma.organization.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already exists' });
    }

    // Update organization in database
    // @ts-ignore - Prisma client regeneration in progress
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug,
        domain: domain || null,
        subscriptionPlan,
        maxUsers,
        updatedAt: new Date()
      },
      include: {
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        featureToggles: true,
        _count: {
          select: { users: true }
        }
      }
    });

    // Transform the data to match the expected format
    const responseData = {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      slug: updatedOrganization.slug,
      domain: updatedOrganization.domain,
      subscriptionPlan: updatedOrganization.subscriptionPlan,
      isActive: updatedOrganization.isActive,
      maxUsers: updatedOrganization.maxUsers,
      userCount: updatedOrganization._count.users,
      createdAt: updatedOrganization.createdAt,
      lastActive: updatedOrganization.updatedAt,
      features: updatedOrganization.featureToggles.reduce((acc: any, toggle: any) => {
        acc[toggle.featureKey] = toggle.isEnabled;
        return acc;
      }, {} as Record<string, boolean>)
    };

    return res.json(responseData);
  } catch (error) {
    console.error('Update organization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization features
router.put('/organizations/:id/features', sudoAuth, async (req: SudoAuthRequest, res) => {
  try {
    const { id } = req.params;
    const featureUpdates = req.body; // Expecting { featureKey: boolean }

    // Update each feature toggle in the database
    for (const [featureKey, isEnabled] of Object.entries(featureUpdates)) {
      // @ts-ignore - Prisma client regeneration in progress
      await prisma.featureToggle.upsert({
        where: {
          organizationId_featureKey: {
            organizationId: id,
            featureKey: featureKey
          }
        },
        update: {
          isEnabled: isEnabled as boolean
        },
        create: {
          organizationId: id,
          featureKey: featureKey,
          isEnabled: isEnabled as boolean
        }
      });
    }

    // Update organization's updatedAt timestamp
    // @ts-ignore - Prisma client regeneration in progress
    await prisma.organization.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    return res.json({ success: true, updated: featureUpdates });
  } catch (error) {
    console.error('Update organization features error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete organization
router.delete('/organizations/:id', sudoAuth, async (req: SudoAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if organization exists
    // @ts-ignore - Prisma client regeneration in progress
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if organization has active users
    if (organization._count.users > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete organization with active users. Please remove all users first.' 
      });
    }

    // Delete related data first (cascade delete)
    // @ts-ignore - Prisma client regeneration in progress
    await prisma.featureToggle.deleteMany({
      where: { organizationId: id }
    });

    // @ts-ignore - Prisma client regeneration in progress
    await prisma.subscription.deleteMany({
      where: { organizationId: id }
    });

    // Delete the organization
    // @ts-ignore - Prisma client regeneration in progress
    await prisma.organization.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', sudoAuth, async (req: SudoAuthRequest, res: Response) => {
  try {
    const analytics = {
      totalOrganizations: 3,
      activeOrganizations: 3,
      totalUsers: 56,
      activeUsers: 52,
      subscriptionBreakdown: {
        trial: 0,
        basic: 1,
        premium: 1,
        enterprise: 1
      },
      monthlyRevenue: 2850.00,
      growth: {
        organizations: 15.2,
        users: 8.7,
        revenue: 12.3
      },
      featureUsage: {
        pos: 100,
        inventory: 100,
        manufacturing: 66.7,
        offsite: 66.7,
        crm: 100,
        reports: 100,
        users: 100
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription plans
router.get('/subscription-plans', sudoAuth, async (req: SudoAuthRequest, res: Response) => {
  try {
    const plans = [
      {
        id: 'trial',
        name: 'Trial',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        maxUsers: 2,
        features: {
          pos: true,
          inventory: true,
          manufacturing: false,
          offsite: false,
          crm: true,
          reports: true,
          users: true
        },
        limitations: {
          maxProducts: 50,
          maxTransactions: 100
        }
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxUsers: 5,
        features: {
          pos: true,
          inventory: true,
          manufacturing: false,
          offsite: false,
          crm: true,
          reports: true,
          users: true
        },
        limitations: {
          maxProducts: 500,
          maxTransactions: 1000
        }
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 79.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxUsers: 20,
        features: {
          pos: true,
          inventory: true,
          manufacturing: true,
          offsite: true,
          crm: true,
          reports: true,
          users: true
        },
        limitations: {
          maxProducts: 2000,
          maxTransactions: 10000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199.99,
        currency: 'USD',
        billingCycle: 'monthly',
        maxUsers: 100,
        features: {
          pos: true,
          inventory: true,
          manufacturing: true,
          offsite: true,
          crm: true,
          reports: true,
          users: true
        },
        limitations: {
          maxProducts: -1, // Unlimited
          maxTransactions: -1 // Unlimited
        }
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
