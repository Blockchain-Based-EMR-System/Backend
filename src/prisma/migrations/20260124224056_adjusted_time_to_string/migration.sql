/*
  Warnings:

  - Changed the type of `opening_at` on the `Clinic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `closing_at` on the `Clinic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Clinic" DROP COLUMN "opening_at",
ADD COLUMN     "opening_at" VARCHAR(12) NOT NULL,
DROP COLUMN "closing_at",
ADD COLUMN     "closing_at" VARCHAR(12) NOT NULL;
