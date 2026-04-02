-- CreateEnum
CREATE TYPE "IntegrationVersionStatus" AS ENUM ('Design', 'Testing', 'Published', 'Deprecated');

-- CreateTable
CREATE TABLE "IntegrationVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "IntegrationVersionStatus" NOT NULL DEFAULT 'Design',
    "description" TEXT,
    "integrationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IntegrationVersion" ADD CONSTRAINT "IntegrationVersion_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
