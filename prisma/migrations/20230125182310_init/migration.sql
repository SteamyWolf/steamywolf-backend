/*
  Warnings:

  - Changed the type of `submissions` on the `RecentSubmissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "RecentSubmissions" DROP COLUMN "submissions",
ADD COLUMN     "submissions" JSONB NOT NULL;
