-- AlterTable: add settings column with default empty object
ALTER TABLE "Navigation" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
