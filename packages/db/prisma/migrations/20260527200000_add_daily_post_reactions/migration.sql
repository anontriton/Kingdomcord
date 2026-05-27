-- AlterTable: add messageId to DailyPost
ALTER TABLE "DailyPost" ADD COLUMN "messageId" TEXT;
CREATE UNIQUE INDEX "DailyPost_messageId_key" ON "DailyPost"("messageId");

-- CreateTable: reaction deduplication for KP awards
CREATE TABLE "DailyPostReaction" (
    "id" TEXT NOT NULL,
    "dailyPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "reactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPostReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyPostReaction_dailyPostId_userId_key" ON "DailyPostReaction"("dailyPostId", "userId");

ALTER TABLE "DailyPostReaction" ADD CONSTRAINT "DailyPostReaction_dailyPostId_fkey"
    FOREIGN KEY ("dailyPostId") REFERENCES "DailyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DailyPostReaction" ADD CONSTRAINT "DailyPostReaction_userId_guildId_fkey"
    FOREIGN KEY ("userId", "guildId") REFERENCES "User"("userId", "guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
