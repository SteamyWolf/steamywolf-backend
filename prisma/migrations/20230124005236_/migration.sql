-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "recentSubmissionsId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "RecentSubmissions" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RecentSubmissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_recentSubmissionsId_fkey" FOREIGN KEY ("recentSubmissionsId") REFERENCES "RecentSubmissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
