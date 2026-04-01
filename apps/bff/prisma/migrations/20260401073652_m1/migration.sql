-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR');

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "labels" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DRAFT',
    "icon" TEXT,
    "linkedApis" INTEGER NOT NULL DEFAULT 0,
    "domainId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
