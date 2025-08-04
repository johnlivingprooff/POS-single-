import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample organizations with feature toggles
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Acme Retail Store',
        slug: 'acme-retail',
        domain: 'acme.habicore.com',
        subscriptionPlan: 'premium',
        isActive: true,
        maxUsers: 20,
        featureToggles: {
          create: [
            { featureKey: 'pos', isEnabled: true },
            { featureKey: 'inventory', isEnabled: true },
            { featureKey: 'manufacturing', isEnabled: true },
            { featureKey: 'offsite', isEnabled: true },
            { featureKey: 'crm', isEnabled: true },
            { featureKey: 'reports', isEnabled: true },
            { featureKey: 'users', isEnabled: true }
          ]
        }
      }
    }),
    prisma.organization.create({
      data: {
        name: 'Tech Startup POS',
        slug: 'tech-startup',
        domain: null,
        subscriptionPlan: 'basic',
        isActive: true,
        maxUsers: 5,
        featureToggles: {
          create: [
            { featureKey: 'pos', isEnabled: true },
            { featureKey: 'inventory', isEnabled: true },
            { featureKey: 'manufacturing', isEnabled: false },
            { featureKey: 'offsite', isEnabled: false },
            { featureKey: 'crm', isEnabled: true },
            { featureKey: 'reports', isEnabled: true },
            { featureKey: 'users', isEnabled: true }
          ]
        }
      }
    }),
    prisma.organization.create({
      data: {
        name: 'Manufacturing Corp',
        slug: 'manufacturing-corp',
        domain: 'mfg.example.com',
        subscriptionPlan: 'enterprise',
        isActive: true,
        maxUsers: 100,
        featureToggles: {
          create: [
            { featureKey: 'pos', isEnabled: true },
            { featureKey: 'inventory', isEnabled: true },
            { featureKey: 'manufacturing', isEnabled: true },
            { featureKey: 'offsite', isEnabled: true },
            { featureKey: 'crm', isEnabled: true },
            { featureKey: 'reports', isEnabled: true },
            { featureKey: 'users', isEnabled: true }
          ]
        }
      }
    })
  ]);


  // Create categories for each organization
  const categories = await Promise.all([
    // Categories for Acme Retail
    prisma.category.create({
      data: {
        name: 'Coffee',
        description: 'Coffee beans and related products',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    prisma.category.create({
      data: {
        name: 'Equipment',
        description: 'Coffee equipment and machinery',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    prisma.category.create({
      data: {
        name: 'Pastries',
        description: 'Baked goods and pastries',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    // Categories for Tech Startup
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        organizationId: organizations[1].id // Tech Startup
      }
    }),
    // Categories for Manufacturing Corp
    prisma.category.create({
      data: {
        name: 'Raw Materials',
        description: 'Manufacturing raw materials',
        organizationId: organizations[2].id // Manufacturing Corp
      }
    })
  ]);

  // Create suppliers for each organization
  const suppliers = await Promise.all([
    // Suppliers for Acme Retail
    prisma.supplier.create({
      data: {
        name: 'Bean Co',
        contactName: 'John Smith',
        email: 'john@beanco.com',
        phone: '+1-555-0101',
        address: '123 Coffee Street, Bean City, BC 12345',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Equipment Ltd',
        contactName: 'Sarah Johnson',
        email: 'sarah@equipmentltd.com',
        phone: '+1-555-0102',
        address: '456 Machine Ave, Tech Town, TT 67890',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Fresh Bakery',
        contactName: 'Mike Baker',
        email: 'mike@freshbakery.com',
        phone: '+1-555-0103',
        address: '789 Pastry Lane, Sweet City, SC 54321',
        organizationId: organizations[0].id // Acme Retail
      }
    }),
    // Suppliers for Tech Startup
    prisma.supplier.create({
      data: {
        name: 'Tech Distributor Inc',
        contactName: 'Lisa Tech',
        email: 'lisa@techdist.com',
        phone: '+1-555-0201',
        address: '100 Silicon Valley, Tech City, TC 10001',
        organizationId: organizations[1].id // Tech Startup
      }
    }),
    // Suppliers for Manufacturing Corp
    prisma.supplier.create({
      data: {
        name: 'Industrial Materials Co',
        contactName: 'Robert Manufacturing',
        email: 'robert@industrial.com',
        phone: '+1-555-0301',
        address: '500 Industrial Blvd, Manufacturing City, MC 20001',
        organizationId: organizations[2].id // Manufacturing Corp
      }
    })
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Colombian Coffee Beans 1kg',
        sku: 'CB001',
        description: 'Premium coffee beans sourced directly from Colombian highlands',
        price: 24.99,
        costPrice: 15.50,
        unitCost: 0.0155, // costPrice per gram for raw materials
        stock: 45,
        reorderLevel: 10,
        stockType: 'raw_material',
        measurementType: 'grams',
        measurementValue: 1000, // 1kg = 1000g
        availableQuantities: 45000, // stock * measurementValue
        categoryId: categories[0].id,
        supplierId: suppliers[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Ethiopian Arabica Coffee Beans 500g',
        sku: 'CB002',
        description: 'Single origin Ethiopian Arabica with fruity notes',
        price: 18.99,
        costPrice: 12.00,
        unitCost: 0.024, // costPrice per gram
        stock: 32,
        reorderLevel: 8,
        stockType: 'raw_material',
        measurementType: 'grams',
        measurementValue: 500,
        availableQuantities: 16000, // stock * measurementValue
        categoryId: categories[0].id,
        supplierId: suppliers[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Professional Espresso Machine',
        sku: 'EM001',
        description: 'Commercial grade espresso machine with dual boiler',
        price: 2999.99,
        costPrice: 2200.00,
        unitCost: 0, // Not a raw material
        stock: 3,
        reorderLevel: 1,
        stockType: 'asset_equipment',
        categoryId: categories[1].id,
        supplierId: suppliers[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Coffee Grinder - Burr Type',
        sku: 'CG001',
        description: 'Professional burr coffee grinder for consistent grind',
        price: 299.99,
        costPrice: 200.00,
        unitCost: 0, // Not a raw material
        stock: 8,
        reorderLevel: 2,
        stockType: 'asset_equipment',
        categoryId: categories[1].id,
        supplierId: suppliers[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Croissants (6 pack)',
        sku: 'P001',
        description: 'Freshly baked butter croissants, pack of 6',
        price: 8.99,
        costPrice: 4.50,
        unitCost: 0.75, // cost per croissant as raw material
        stock: 20,
        reorderLevel: 5,
        stockType: 'raw_material',
        measurementType: 'pieces',
        measurementValue: 6, // 6 croissants per pack
        availableQuantities: 120, // stock * measurementValue
        categoryId: categories[2].id,
        supplierId: suppliers[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Chocolate Muffins (4 pack)',
        sku: 'P002',
        description: 'Rich chocolate chip muffins, pack of 4',
        price: 6.99,
        costPrice: 3.25,
        unitCost: 0.8125, // cost per muffin as raw material
        stock: 15,
        reorderLevel: 5,
        stockType: 'raw_material',
        measurementType: 'pieces',
        measurementValue: 4, // 4 muffins per pack
        availableQuantities: 60, // stock * measurementValue
        categoryId: categories[2].id,
        supplierId: suppliers[2].id
      }
    })
  ]);

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@habicore.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'System Administrator',
        role: 'admin',
        permissions: ['all']
      }
    }),
    prisma.user.create({
      data: {
        email: 'manager@habicore.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Store Manager',
        role: 'manager',
        permissions: ['pos', 'inventory', 'reports', 'customers']
      }
    }),
    prisma.user.create({
      data: {
        email: 'cashier@habicore.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'John Cashier',
        role: 'employee',
        permissions: ['pos']
      }
    })
  ]);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1-555-1001',
        address: '123 Main St, Anytown, AT 12345',
        loyaltyPoints: 150
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1-555-1002',
        address: '456 Oak Ave, Somewhere, SW 67890',
        loyaltyPoints: 75
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Carol Davis',
        phone: '+1-555-1003',
        loyaltyPoints: 200
      }
    })
  ]);

  // Create inventory configuration
  const inventoryConfig = await prisma.inventoryConfig.create({
    data: {
      calculateMethod: 'fifo'
    }
  });

  // Create some purchase batches for raw materials
  const coffeeBatches = await Promise.all([
    prisma.productPurchaseBatch.create({
      data: {
        productId: products[0].id, // Colombian Coffee
        quantity: 20,
        remaining: 20,
        costPrice: 15.50,
        receivedAt: new Date('2025-07-15'),
        batchRef: 'CB001-2025-001'
      }
    }),
    prisma.productPurchaseBatch.create({
      data: {
        productId: products[0].id, // Colombian Coffee
        quantity: 25,
        remaining: 25,
        costPrice: 15.50,
        receivedAt: new Date('2025-07-20'),
        batchRef: 'CB001-2025-002'
      }
    }),
    prisma.productPurchaseBatch.create({
      data: {
        productId: products[1].id, // Ethiopian Coffee
        quantity: 32,
        remaining: 32,
        costPrice: 12.00,
        receivedAt: new Date('2025-07-18'),
        batchRef: 'CB002-2025-001'
      }
    })
  ]);

  // Create sudo users for system administration
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('sudo123', 10);

  const sudoUsers = await Promise.all([
    prisma.sudoUser.create({
      data: {
        email: 'sudo@habicore.com',
        password: hashedPassword,
        name: 'Sudo Administrator',
        role: 'sudo_admin',
        isActive: true
      }
    })
  ]);

  
  // Create organization users for testing multi-tenant access
  const orgUsers = await Promise.all([
    // Users for Acme Retail Store
    prisma.user.create({
      data: {
        email: 'admin@acme-retail.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Acme Admin',
        role: 'admin',
        permissions: ['all'],
        organizationId: organizations[0].id
      }
    }),
    prisma.user.create({
      data: {
        email: 'manager@acme-retail.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Acme Manager',
        role: 'manager',
        permissions: ['pos', 'inventory', 'reports', 'customers'],
        organizationId: organizations[0].id
      }
    }),
    // Users for Tech Startup
    prisma.user.create({
      data: {
        email: 'founder@tech-startup.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Startup Founder',
        role: 'admin',
        permissions: ['all'],
        organizationId: organizations[1].id
      }
    }),
    prisma.user.create({
      data: {
        email: 'employee@tech-startup.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Tech Employee',
        role: 'employee',
        permissions: ['pos', 'inventory'],
        organizationId: organizations[1].id
      }
    }),
    // Users for Manufacturing Corp
    prisma.user.create({
      data: {
        email: 'admin@manufacturing-corp.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Manufacturing Admin',
        role: 'admin',
        permissions: ['all'],
        organizationId: organizations[2].id
      }
    }),
    prisma.user.create({
      data: {
        email: 'supervisor@manufacturing-corp.com',
        password: '$2a$12$AmaN2FzIxLVAh3.mFPtNFueLv1Oi/NlSLVDdvIvHTmrG5NKHQ0tEm', // 'password123'
        name: 'Production Supervisor',
        role: 'manager',
        permissions: ['manufacturing', 'inventory', 'reports'],
        organizationId: organizations[2].id
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${suppliers.length} suppliers`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${orgUsers.length} organization users`);
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${coffeeBatches.length} purchase batches`);
  console.log(`   - ${sudoUsers.length} sudo users`);
  console.log(`   - ${organizations.length} organizations`);
  console.log(`   - 1 inventory configuration`);
  console.log('');
  console.log('🔑 Test Login Credentials:');
  console.log('=========================');
  console.log('Sudo Admin: http://localhost:3000/sudo/login');
  console.log('  Email: sudo@habicore.com, Password: sudo123');
  console.log('');
  console.log('Organization Logins:');
  console.log('1. Acme Retail: http://localhost:3000/org/acme-retail/login');
  console.log('   Admin: admin@acme-retail.com, Password: password123');
  console.log('   Manager: manager@acme-retail.com, Password: password123');
  console.log('');
  console.log('2. Tech Startup: http://localhost:3000/org/tech-startup/login');
  console.log('   Founder: founder@tech-startup.com, Password: password123');
  console.log('   Employee: employee@tech-startup.com, Password: password123');
  console.log('');
  console.log('3. Manufacturing Corp: http://localhost:3000/org/manufacturing-corp/login');
  console.log('   Admin: admin@manufacturing-corp.com, Password: password123');
  console.log('   Supervisor: supervisor@manufacturing-corp.com, Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
