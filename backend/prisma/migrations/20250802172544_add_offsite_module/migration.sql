-- CreateTable
CREATE TABLE "offsite_requisitions" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offsite_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offsite_requisition_items" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityOut" INTEGER NOT NULL,
    "quantityReturned" INTEGER NOT NULL DEFAULT 0,
    "quantityLost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offsite_requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offsite_returns" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offsite_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offsite_return_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityReturned" INTEGER NOT NULL,
    "quantityDamaged" INTEGER NOT NULL DEFAULT 0,
    "quantityLost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offsite_return_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "offsite_requisitions" ADD CONSTRAINT "offsite_requisitions_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offsite_requisition_items" ADD CONSTRAINT "offsite_requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "offsite_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offsite_requisition_items" ADD CONSTRAINT "offsite_requisition_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offsite_returns" ADD CONSTRAINT "offsite_returns_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "offsite_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offsite_return_items" ADD CONSTRAINT "offsite_return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "offsite_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offsite_return_items" ADD CONSTRAINT "offsite_return_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
