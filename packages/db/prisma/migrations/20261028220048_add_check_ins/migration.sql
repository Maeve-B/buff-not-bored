-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "sleep" TEXT,
    "energy" TEXT,
    "soreness" TEXT,
    "painRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_date_key" ON "check_ins"("date");
