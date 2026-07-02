/*
  Warnings:

  - You are about to drop the column `bonus_file_public_id` on the `Nurse` table. All the data in the column will be lost.
  - You are about to drop the column `bonus_file_url` on the `Nurse` table. All the data in the column will be lost.
  - You are about to drop the column `national_id_public_id` on the `Nurse` table. All the data in the column will be lost.
  - You are about to drop the column `national_id_url` on the `Nurse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Nurse" DROP COLUMN "bonus_file_public_id",
DROP COLUMN "bonus_file_url",
DROP COLUMN "national_id_public_id",
DROP COLUMN "national_id_url",
ADD COLUMN     "bonusFilePublicId" VARCHAR(500),
ADD COLUMN     "bonusFileUrl" VARCHAR(500),
ADD COLUMN     "nationalCardPublicId" VARCHAR(500),
ADD COLUMN     "nationalCardUrl" VARCHAR(500);
