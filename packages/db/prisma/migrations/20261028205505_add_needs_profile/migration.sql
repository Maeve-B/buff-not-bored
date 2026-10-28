-- CreateTable
CREATE TABLE "needs_profiles" (
    "id" TEXT NOT NULL DEFAULT 'me',
    "goal" TEXT NOT NULL,
    "emphasis" TEXT,
    "trainingDuration" TEXT NOT NULL,
    "trainingKind" TEXT NOT NULL,
    "techniqueConfidence" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "preferredDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "sessionMinutes" INTEGER NOT NULL,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heaviestDumbbellKg" DOUBLE PRECISION,
    "limitations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limitationNote" TEXT,
    "avoidExerciseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favouriteExerciseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likesDislikes" TEXT,
    "source" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_profiles_pkey" PRIMARY KEY ("id")
);
