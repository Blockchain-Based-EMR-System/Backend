/*
  Warnings:

  - Added the required column `clinic_id` to the `MedicalRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key_id` to the `MedicalRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `MedicalRecords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RecordType" ADD VALUE 'SOAP_NOTE';
ALTER TYPE "RecordType" ADD VALUE 'MEDICAL_HISTORY';

-- AlterTable
ALTER TABLE "MedicalRecords" ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "clinic_id" TEXT NOT NULL,
ADD COLUMN     "key_id" TEXT NOT NULL,
ADD COLUMN     "mime_type" VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE "EncryptionKeys" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encrypted_key" VARCHAR(500) NOT NULL,
    "algorithm" VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "EncryptionKeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EncryptionKeys_patient_id_key" ON "EncryptionKeys"("patient_id");

-- CreateIndex
CREATE INDEX "MedicalRecords_clinic_id_idx" ON "MedicalRecords"("clinic_id");

-- CreateIndex
CREATE INDEX "MedicalRecords_appointment_id_idx" ON "MedicalRecords"("appointment_id");

-- AddForeignKey
ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "EncryptionKeys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptionKeys" ADD CONSTRAINT "EncryptionKeys_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
