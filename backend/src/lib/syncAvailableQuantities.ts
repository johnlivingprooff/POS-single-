import prisma from './prisma';

/**
 * Syncs the availableQuantities field on the product to match the sum of all batch.remaining for that product.
 * @param productId string
 */

/**
 * Syncs the availableQuantities field on the product to match the sum of all batch.remaining for that product.
 * Also updates the stock (number of packs) based on availableQuantities and measurementValue for raw_materials.
 * E.g. if measurementValue is 500g, and availableQuantities is 1200g, stock should be 2 (full packs), with 200g remainder.
 */
export async function syncAvailableQuantities(productId: string) {
  const batches = await prisma.productPurchaseBatch.findMany({ where: { productId } });
  const totalAvailable = batches.reduce((sum, b) => sum + (b.remaining || 0), 0);
  // Update availableQuantities
  await prisma.product.update({
    where: { id: productId },
    data: { availableQuantities: totalAvailable }
  });
  // Fetch product to check measurementValue and stockType
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product && product.stockType === 'raw_material' && product.measurementValue && product.measurementValue > 0) {
    // Calculate new stock (number of full packs)
    const newStock = Math.floor(totalAvailable / product.measurementValue);
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    });
  }
}
