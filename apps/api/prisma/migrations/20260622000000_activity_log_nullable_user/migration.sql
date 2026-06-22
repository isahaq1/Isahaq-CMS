-- Make userId nullable on ActivityLog so logging failures never break operations
-- Also changes onDelete from Cascade to SetNull (user deletion keeps log entries)

-- Drop old FK constraint
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- Allow NULL
ALTER TABLE "ActivityLog" ALTER COLUMN "userId" DROP NOT NULL;

-- Re-add FK with SetNull on delete
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
