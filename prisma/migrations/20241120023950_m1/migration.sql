/*
  Warnings:

  - You are about to drop the `Stuff` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Location" AS ENUM ('CAMPUS_CENTER', 'GATEWAY', 'HALE_ALOHA');

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
    "location" "Location" NOT NULL DEFAULT 'CAMPUS_CENTER',
    "menu" JSONB NOT NULL DEFAULT '[]',
    "language" TEXT NOT NULL DEFAULT 'English',
    "country" TEXT NOT NULL DEFAULT 'USA',

    CONSTRAINT "Menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuImages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "MenuImages_pkey" PRIMARY KEY ("id")
);
