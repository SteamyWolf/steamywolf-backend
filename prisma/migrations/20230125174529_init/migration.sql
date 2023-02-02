-- CreateTable
CREATE TABLE "RecentSubmissions" (
    "id" SERIAL NOT NULL,
    "submissions" JSONB[],

    CONSTRAINT "RecentSubmissions_pkey" PRIMARY KEY ("id")
);
