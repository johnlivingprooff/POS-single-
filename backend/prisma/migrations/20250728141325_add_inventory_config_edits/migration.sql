-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_config" (
    "id" TEXT NOT NULL,
    "calculationMethod" TEXT NOT NULL DEFAULT 'fifo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
