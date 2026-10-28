-- CreateTable
CREATE TABLE "needs_conversation_drafts" (
    "id" TEXT NOT NULL DEFAULT 'me',
    "answers" JSONB NOT NULL,
    "stepId" TEXT NOT NULL,
    "answered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_conversation_drafts_pkey" PRIMARY KEY ("id")
);
