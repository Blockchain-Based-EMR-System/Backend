/*
  Warnings:

  - You are about to drop the `MedicalRecords` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MedicalRecords" DROP CONSTRAINT "MedicalRecords_patient_id_fkey";

-- DropTable
DROP TABLE "public"."MedicalRecords";

-- DropEnum
DROP TYPE "public"."RecordType";
