/*
  Warnings:

  - You are about to drop the column `height` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "height",
DROP COLUMN "width";
