// scripts/deleteFinishedGoods.ts
// Usage: npx ts-node scripts/deleteFinishedGoods.ts

import prisma from '../backend/src/lib/prisma';

async function main() {
  try {
    // Delete all BOMs and BOM items for finished goods
    const finishedGoods = await prisma.product.findMany({ where: { stockType: 'finished_good' } });
    const finishedGoodIds = finishedGoods.map(p => p.id);
    if (finishedGoodIds.length === 0) {
      console.log('No finished goods found.');
      return;
    }
    // Delete BOM items
    await prisma.bOMItem.deleteMany({ where: { bom: { productId: { in: finishedGoodIds } } } });
    // Delete BOMs
    await prisma.bOM.deleteMany({ where: { productId: { in: finishedGoodIds } } });
    // Delete manufacturing orders for finished goods
    await prisma.manufacturingOrder.deleteMany({ where: { productId: { in: finishedGoodIds } } });
    // Delete the finished goods
    const result = await prisma.product.deleteMany({ where: { id: { in: finishedGoodIds } } });
    console.log(`Deleted ${result.count} finished goods and related BOMs/orders.`);
  } catch (err) {
    console.error('Error deleting finished goods:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
