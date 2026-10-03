-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programmeGroup" TEXT NOT NULL,
    "primaryMuscles" TEXT[],
    "secondaryMuscles" TEXT[],
    "movementPatterns" TEXT[],
    "exerciseType" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startingWeight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "prescribedReps" INTEGER,
    "repsUnit" TEXT,
    "prescribedDuration" DOUBLE PRECISION,
    "progressionPercentage" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "workoutType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dateIso" DATE NOT NULL,
    "programmeId" TEXT,
    "weekNumber" INTEGER,
    "scheduledWorkoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "restSeconds" INTEGER,
    "baseWeight" DOUBLE PRECISION,
    "adjustments" JSONB,
    "finalWeight" DOUBLE PRECISION,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "targetReps" INTEGER,
    "repsUnit" TEXT,
    "targetDuration" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "actualWeight" DOUBLE PRECISION,
    "actualReps" INTEGER,
    "actualDuration" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" TIMESTAMP(3),

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercises_workoutId_order_key" ON "workout_exercises"("workoutId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sets_workoutExerciseId_setNumber_key" ON "workout_sets"("workoutExerciseId", "setNumber");

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
