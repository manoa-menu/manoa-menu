/*
  Warnings:

  - You are about to drop the `Stuff` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favorites" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "Stuff";

-- DropEnum
DROP TYPE "Condition";

-- CreateTable
CREATE TABLE "Menus" (
    "id" SERIAL NOT NULL,
    "week_of" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menu" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Menus_pkey" PRIMARY KEY ("id")
);
