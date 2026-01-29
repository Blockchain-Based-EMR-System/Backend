/*
  Warnings:

  - Changed the type of `slot_duration` on the `Appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Appointments" DROP COLUMN "slot_duration",
ADD COLUMN     "slot_duration" INTEGER NOT NULL;
