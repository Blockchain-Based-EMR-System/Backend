-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('LAB_RESULT', 'SCAN', 'DIAGNOSIS', 'VISIT_SUMMARY');

-- CreateTable
CREATE TABLE "MedicalRecords" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "cid" VARCHAR(255) NOT NULL,
    "type" "RecordType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "MedicalRecords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecords_cid_key" ON "MedicalRecords"("cid");

-- CreateIndex
CREATE INDEX "MedicalRecords_patient_id_idx" ON "MedicalRecords"("patient_id");

-- CreateIndex
CREATE INDEX "MedicalRecords_doctor_id_idx" ON "MedicalRecords"("doctor_id");

-- CreateIndex
CREATE INDEX "MedicalRecords_cid_idx" ON "MedicalRecords"("cid");

-- AddForeignKey
ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
