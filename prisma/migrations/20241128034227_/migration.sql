/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `FoodTable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FoodTable_name_key" ON "FoodTable"("name");
