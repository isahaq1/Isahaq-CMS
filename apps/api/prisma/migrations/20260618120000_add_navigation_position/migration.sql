-- AlterTable: add position column with default 'header'
ALTER TABLE "Navigation" ADD COLUMN "position" TEXT NOT NULL DEFAULT 'header';

-- Create unique constraint on (siteId, position)
CREATE UNIQUE INDEX "Navigation_siteId_position_key" ON "Navigation"("siteId", "position");
