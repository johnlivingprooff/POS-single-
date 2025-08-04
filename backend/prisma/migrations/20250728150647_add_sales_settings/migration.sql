-- CreateTable
CREATE TABLE "sales_settings" (
    "id" TEXT NOT NULL,
    "defaultPricingMethod" TEXT NOT NULL DEFAULT 'markup',
    "defaultMarkupPercentage" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "defaultMarginPercentage" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "enablePriceRounding" BOOLEAN NOT NULL DEFAULT true,
    "roundingRule" TEXT NOT NULL DEFAULT 'nearest_cent',
    "showCalculationDetails" BOOLEAN NOT NULL DEFAULT true,
    "allowProductLevelOverrides" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_settings_pkey" PRIMARY KEY ("id")
);
