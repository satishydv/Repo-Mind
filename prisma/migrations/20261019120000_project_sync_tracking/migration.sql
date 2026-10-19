ALTER TABLE "public"."Project"
ADD COLUMN "syncStatus" TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN "syncStartedAt" TIMESTAMP(3),
ADD COLUMN "lastIndexedCommitSha" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
