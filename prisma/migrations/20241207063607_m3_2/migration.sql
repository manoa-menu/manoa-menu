/*
  Warnings:

  - You are about to drop the column `date` on the `CampusCenterMenus` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CampusCenterMenus" DROP COLUMN "date",
ADD COLUMN     "week_of" TEXT NOT NULL DEFAULT '1996-12-29';
