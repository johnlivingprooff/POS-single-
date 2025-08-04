/*
  Warnings:

  - You are about to drop the column `calculationMethod` on the `inventory_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventory_config" DROP COLUMN "calculationMethod",
ADD COLUMN     "calculateMethod" TEXT NOT NULL DEFAULT 'fifo';
