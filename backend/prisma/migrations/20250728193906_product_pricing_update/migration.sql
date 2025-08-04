-- AlterTable
ALTER TABLE "products" ADD COLUMN     "pricingMethod" TEXT DEFAULT 'markup',
ADD COLUMN     "pricingOverride" BOOLEAN NOT NULL DEFAULT false;
