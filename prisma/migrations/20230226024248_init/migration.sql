/*
  Warnings:

  - Made the column `nsfw_checked` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nsfw_checked" SET NOT NULL;
