-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'English';

-- CreateTable
CREATE TABLE "AIStatus" (
    "id" SERIAL NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "AIStatus_pkey" PRIMARY KEY ("id")
);
