import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create essential users for single-tenant system
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
        permissions: ['pos', 'inventory', 'reports', 'customers', 'manufacturing']
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

  // Create inventory configuration (required for the system to function)
  const inventoryConfig = await prisma.inventoryConfig.create({
    data: {
      calculateMethod: 'fifo'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${users.length} users`);
  console.log(`   - 1 inventory configuration`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('===================');
  console.log('Admin: admin@habicore.com, Password: password123');
  console.log('Manager: manager@habicore.com, Password: password123');
  console.log('Cashier: cashier@habicore.com, Password: password123');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('- Log in with admin credentials');
  console.log('- Create categories, suppliers, and products through the UI');
  console.log('- Set up your inventory and start using the POS system');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
