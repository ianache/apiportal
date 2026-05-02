-- CreateDiagramTable migration
-- This migration creates the Diagram table for storing product diagrams

CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagram_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups by productId
CREATE INDEX "Diagram_productId_idx" ON "Diagram"("productId");

-- Add foreign key constraint
ALTER TABLE "Diagram" ADD CONSTRAINT "Diagram_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
