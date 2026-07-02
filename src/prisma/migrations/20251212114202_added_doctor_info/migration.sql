/*
  Warnings:

  - Added the required column `phone` to the `Clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fees` to the `ClinicDoctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "address_maps_link" VARCHAR(500),
ADD COLUMN     "canPayOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "ClinicDoctor" ADD COLUMN     "fees" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "photo_public_id" VARCHAR(500),
ADD COLUMN     "photo_url" VARCHAR(500);
