/*
  Warnings:

  - A unique constraint covering the columns `[name,deviceId]` on the table `Action` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Action_name_deviceId_key" ON "Action"("name", "deviceId");
