/**
 * Delete all product purchase batches for a product where remaining = 0.
 * @param prisma PrismaClient
 * @param productId string
 */
export async function deleteEmptyBatches(prisma: PrismaClient, productId: string) {
  await prisma.productPurchaseBatch.deleteMany({
    where: {
      productId,
      remaining: 0
    }
  });
}
/**
 * Deduct raw material from purchase batches and update product stock.
 * @param prisma PrismaClient
 * @param productId string (raw material id)
 * @param quantity number (units/grams to consume)
 * @param method CostingMethod
 */
export async function deductRawMaterialFromBatches(
  prisma: PrismaClient,
  productId: string,
  quantity: number,
  method: CostingMethod = 'fifo'
) {
  let qtyNeeded = quantity;
  // Fetch all batches for this product, ordered by method
  let batches = await prisma.productPurchaseBatch.findMany({
    where: { productId, remaining: { gt: 0 } },
    orderBy:
      method === 'fifo' ? { receivedAt: 'asc' } :
      method === 'lifo' ? { receivedAt: 'desc' } :
      undefined
  });
  let totalDeducted = 0;
  for (const batch of batches) {
    if (qtyNeeded <= 0) break;
    const take = Math.min(batch.remaining, qtyNeeded);
    await prisma.productPurchaseBatch.update({
      where: { id: batch.id },
      data: { remaining: { decrement: take } }
    });
    qtyNeeded -= take;
    totalDeducted += take;
  }
  if (qtyNeeded > 0) throw new Error(`Insufficient batch stock for deduction: ${productId} - Needed: ${quantity}, Available: ${totalDeducted}`);
  
  // Sync availableQuantities to sum of all batch.remaining for this product with proper clamping
  const updatedBatches = await prisma.productPurchaseBatch.findMany({
    where: { productId }
  });
  const totalAvailable = Math.max(0, updatedBatches.reduce((sum, b) => sum + (b.remaining || 0), 0));
  
  // Get product details for proper stock calculation
  const currentProduct = await prisma.product.findUnique({ where: { id: productId } });
  let newStock = 0;
  
  if (currentProduct?.stockType === 'raw_material' && currentProduct.measurementValue && currentProduct.measurementValue > 0) {
    // For raw materials, calculate stock as number of full packs
    newStock = Math.floor(totalAvailable / currentProduct.measurementValue);
  } else {
    // For finished goods or products without measurement, stock = availableQuantities
    newStock = totalAvailable;
  }
  
  await prisma.product.update({
    where: { id: productId },
    data: { 
      availableQuantities: totalAvailable,
      stock: newStock
    }
  });
  // Delete empty batches (remaining = 0)
  await deleteEmptyBatches(prisma, productId);
}
// costingUtil.ts
// Utility for inventory costing: FIFO, LIFO, Weighted Average
import { PrismaClient } from '@prisma/client';

export type CostingMethod = 'fifo' | 'lifo' | 'wac';

/**
 * Calculate the cost of raw material consumed for a given quantity using the selected costing method.
 * @param prisma PrismaClient
 * @param productId string (raw material id)
 * @param quantity number (units/grams to consume)
 * @param method CostingMethod
 * @returns total cost (number)
 */
export async function calculateRawMaterialCost(
  prisma: PrismaClient,
  productId: string,
  quantity: number,
  method: CostingMethod = 'fifo'
): Promise<number> {
  // Use ProductPurchaseBatch for real costing
  let qtyNeeded = quantity;
  let totalCost = 0;
  // Fetch all batches for this product, ordered by method
  let batches = await prisma.productPurchaseBatch.findMany({
    where: { productId, remaining: { gt: 0 } },
    orderBy:
      method === 'fifo' ? { receivedAt: 'asc' } :
      method === 'lifo' ? { receivedAt: 'desc' } :
      undefined
  });
  if (method === 'wac') {
    // Weighted Average Cost: sum all remaining, divide by total units
    const totalUnits = batches.reduce((sum, b) => sum + b.remaining, 0);
    const totalValue = batches.reduce((sum, b) => sum + (Number(b.costPrice) * b.remaining), 0);
    const avgCost = totalUnits > 0 ? totalValue / totalUnits : 0;
    if (qtyNeeded > totalUnits) throw new Error('Insufficient stock for costing');
    return avgCost * qtyNeeded;
  }
  // FIFO or LIFO: consume from batches in order
  for (const batch of batches) {
    if (qtyNeeded <= 0) break;
    const take = Math.min(batch.remaining, qtyNeeded);
    totalCost += Number(batch.costPrice) * take;
    qtyNeeded -= take;
  }
  if (qtyNeeded > 0) throw new Error('Insufficient stock for costing');
  return totalCost;
}
