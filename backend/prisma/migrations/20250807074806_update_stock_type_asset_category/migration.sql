/*
  Warnings:

  - The `stockType` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('raw_material', 'consumable', 'asset_equipment', 'finished_good');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('current_asset', 'fixed_asset');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "assetCategory" "AssetCategory",
DROP COLUMN "stockType",
ADD COLUMN     "stockType" "StockType" NOT NULL DEFAULT 'raw_material';
