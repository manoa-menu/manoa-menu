/*
  Warnings:

  - You are about to drop the `MenuImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MenuImages";

-- CreateTable
CREATE TABLE "FoodTable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT[],
    "translation" TEXT[],

    CONSTRAINT "FoodTable_pkey" PRIMARY KEY ("id")
);
