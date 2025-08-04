/*
  Warnings:

  - A unique constraint covering the columns `[name,organizationId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber,organizationId]` on the table `manufacturing_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,organizationId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber,organizationId]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saleNumber,organizationId]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "manufacturing_orders_orderNumber_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "purchase_orders_orderNumber_key";

-- DropIndex
DROP INDEX "sales_saleNumber_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "manufacturing_orders" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_organizationId_key" ON "categories"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_orders_orderNumber_organizationId_key" ON "manufacturing_orders"("orderNumber", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_organizationId_key" ON "products"("sku", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_organizationId_key" ON "purchase_orders"("orderNumber", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNumber_organizationId_key" ON "sales"("saleNumber", "organizationId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
