/*
  Warnings:

  - Added the required column `created_by` to the `Clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Clinic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "created_by" VARCHAR(255) NOT NULL,
ADD COLUMN     "name" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "num_of_created_clinics" INTEGER NOT NULL DEFAULT 0;
