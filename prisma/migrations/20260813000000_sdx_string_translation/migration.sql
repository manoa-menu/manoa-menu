-- CreateTable
CREATE TABLE "SdxStringTranslation" (
    "id" SERIAL NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SdxStringTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdxTranslationLock" (
    "language" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdxTranslationLock_pkey" PRIMARY KEY ("language")
);

-- CreateIndex
CREATE UNIQUE INDEX "SdxStringTranslation_sourceHash_language_key" ON "SdxStringTranslation"("sourceHash", "language");

-- CreateIndex
CREATE INDEX "SdxStringTranslation_language_idx" ON "SdxStringTranslation"("language");
