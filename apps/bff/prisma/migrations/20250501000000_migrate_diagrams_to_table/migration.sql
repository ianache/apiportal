-- Migration: Migrate diagrams from JSON fields to separate table
-- This migration preserves all existing diagram data

-- Create the Diagram table
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'main',
    "diagramId" TEXT NOT NULL DEFAULT 'main',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagram_pkey" PRIMARY KEY ("id")
);

-- Create unique index for productId + diagramId combination
CREATE UNIQUE INDEX "Diagram_productId_diagramId_key" ON "Diagram"("productId", "diagramId");

-- Create index for faster lookups by productId
CREATE INDEX "Diagram_productId_idx" ON "Diagram"("productId");

-- Add foreign key constraint
ALTER TABLE "Diagram" ADD CONSTRAINT "Diagram_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from old JSON fields to new table
-- First, migrate products with 'diagrams' array (new format)
INSERT INTO "Diagram" ("id", "productId", "name", "diagramId", "nodes", "edges", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    p."id",
    COALESCE(d->>'name', 'diagram-' || row_number() OVER (PARTITION BY p."id")),
    COALESCE(d->>'id', 'diagram-' || row_number() OVER (PARTITION BY p."id")),
    COALESCE(d->'nodes', '[]'),
    COALESCE(d->'edges', '[]'),
    p."createdAt",
    p."updatedAt"
FROM "Product" p
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p."diagrams", '[]'::jsonb)) AS d
WHERE p."diagrams" IS NOT NULL AND jsonb_array_length(p."diagrams") > 0;

-- Then, migrate products with old single 'diagram' field (old format)
-- Only for products that don't have diagrams array
INSERT INTO "Diagram" ("id", "productId", "name", "diagramId", "nodes", "edges", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    p."id",
    'main',
    'main',
    COALESCE(p."diagram"->'nodes', '[]'),
    COALESCE(p."diagram"->'edges', '[]'),
    p."createdAt",
    p."updatedAt"
FROM "Product" p
WHERE p."diagram" IS NOT NULL 
  AND (p."diagrams" IS NULL OR jsonb_array_length(p."diagrams") = 0)
  AND NOT EXISTS (
      SELECT 1 FROM "Diagram" d WHERE d."productId" = p."id"
  );

-- Create default 'main' diagram for products without any diagram data
INSERT INTO "Diagram" ("id", "productId", "name", "diagramId", "nodes", "edges", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    p."id",
    'main',
    'main',
    '[]'::jsonb,
    '[]'::jsonb,
    p."createdAt",
    p."updatedAt"
FROM "Product" p
WHERE NOT EXISTS (
    SELECT 1 FROM "Diagram" d WHERE d."productId" = p."id"
);
