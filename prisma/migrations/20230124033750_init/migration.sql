/*
  Warnings:

  - You are about to drop the column `recentSubmissionsId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `RecentSubmissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_recentSubmissionsId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "recentSubmissionsId";

-- DropTable
DROP TABLE "RecentSubmissions";
