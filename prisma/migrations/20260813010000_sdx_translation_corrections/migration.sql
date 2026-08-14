-- AlterTable
ALTER TABLE "SdxStringTranslation" ADD COLUMN "aiTranslatedText" TEXT;
UPDATE "SdxStringTranslation" SET "aiTranslatedText" = "translatedText" WHERE "aiTranslatedText" IS NULL;
ALTER TABLE "SdxStringTranslation" ALTER COLUMN "aiTranslatedText" SET NOT NULL;

ALTER TABLE "SdxStringTranslation" ADD COLUMN "isCorrected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SdxStringTranslation" ADD COLUMN "correctedAt" TIMESTAMP(3);
ALTER TABLE "SdxStringTranslation" ADD COLUMN "correctedBy" TEXT;
ALTER TABLE "SdxStringTranslation" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "SdxStringTranslation_language_isCorrected_idx" ON "SdxStringTranslation"("language", "isCorrected");
