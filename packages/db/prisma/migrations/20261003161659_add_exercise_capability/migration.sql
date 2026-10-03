-- CreateTable
CREATE TABLE "exercise_capabilities" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "reps" INTEGER,
    "repsUnit" TEXT,
    "duration" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_capabilities_exerciseId_key" ON "exercise_capabilities"("exerciseId");

-- AddForeignKey
ALTER TABLE "exercise_capabilities" ADD CONSTRAINT "exercise_capabilities_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
