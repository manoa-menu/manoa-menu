/*
  Warnings:

  - You are about to drop the `Menus` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodTable" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "Menus";

-- CreateTable
CREATE TABLE "CampusCenterMenus" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL DEFAULT '1996-12-29',
    "location" "Location" NOT NULL DEFAULT 'CAMPUS_CENTER',
    "menu" JSONB NOT NULL DEFAULT '[]',
    "language" TEXT NOT NULL DEFAULT 'English',

    CONSTRAINT "CampusCenterMenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayMenus" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL DEFAULT '1996-12-29',
    "location" "Location" NOT NULL DEFAULT 'GATEWAY',
    "menu" JSONB NOT NULL DEFAULT '[]',
    "language" TEXT NOT NULL DEFAULT 'English',

    CONSTRAINT "GatewayMenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaleAlohaMenus" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL DEFAULT '1996-12-29',
    "location" "Location" NOT NULL DEFAULT 'HALE_ALOHA',
    "menu" JSONB NOT NULL DEFAULT '[]',
    "language" TEXT NOT NULL DEFAULT 'English',

    CONSTRAINT "HaleAlohaMenus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
