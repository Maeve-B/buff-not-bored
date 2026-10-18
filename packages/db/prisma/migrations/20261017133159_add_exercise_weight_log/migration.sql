-- CreateTable
CREATE TABLE "exercise_weight_logs" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_weight_logs_exerciseId_recordedAt_idx" ON "exercise_weight_logs"("exerciseId", "recordedAt");

-- AddForeignKey
ALTER TABLE "exercise_weight_logs" ADD CONSTRAINT "exercise_weight_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
