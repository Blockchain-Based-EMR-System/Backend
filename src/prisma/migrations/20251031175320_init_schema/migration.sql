-- CreateEnum
CREATE TYPE "ScanLabType" AS ENUM ('SCAN', 'LAB');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "gender" "Gender" NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "specialization" VARCHAR(255) NOT NULL,
    "avg_time" TIME(0),

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "bc_address" VARCHAR(255) NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "controlling_nurse_id" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT,
    "doctor_id" TEXT,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "estimated_time" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medications" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "treatment_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "medication_end_date" TIMESTAMP(3) NOT NULL,
    "medication_start_time" TIME(0) NOT NULL,
    "frequency" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scans_Labs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TIME(0),
    "frequency" INTEGER,
    "period" "Period",
    "description" TEXT,
    "type" "ScanLabType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Scans_Labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "opening_at" TIME(0) NOT NULL,
    "closing_at" TIME(0) NOT NULL,
    "address" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicNurse" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "nurse_id" TEXT NOT NULL,

    CONSTRAINT "ClinicNurse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicDoctor" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,

    CONSTRAINT "ClinicDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "bc_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE INDEX "Appointments_patient_id_idx" ON "Appointments"("patient_id");

-- CreateIndex
CREATE INDEX "Appointments_doctor_id_idx" ON "Appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "Appointments_scheduled_time_idx" ON "Appointments"("scheduled_time");

-- CreateIndex
CREATE INDEX "Medications_patient_id_idx" ON "Medications"("patient_id");

-- CreateIndex
CREATE INDEX "Medications_doctor_id_idx" ON "Medications"("doctor_id");

-- CreateIndex
CREATE INDEX "Scans_Labs_patient_id_idx" ON "Scans_Labs"("patient_id");

-- CreateIndex
CREATE INDEX "Scans_Labs_doctor_id_idx" ON "Scans_Labs"("doctor_id");

-- CreateIndex
CREATE INDEX "ClinicNurse_nurse_id_idx" ON "ClinicNurse"("nurse_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicNurse_clinic_id_nurse_id_key" ON "ClinicNurse"("clinic_id", "nurse_id");

-- CreateIndex
CREATE INDEX "ClinicDoctor_doctor_id_idx" ON "ClinicDoctor"("doctor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicDoctor_clinic_id_doctor_id_key" ON "ClinicDoctor"("clinic_id", "doctor_id");

-- CreateIndex
CREATE INDEX "AuditLogs_user_id_idx" ON "AuditLogs"("user_id");

-- CreateIndex
CREATE INDEX "AuditLogs_created_at_idx" ON "AuditLogs"("created_at");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_id_fkey" FOREIGN KEY ("id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_id_fkey" FOREIGN KEY ("id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_controlling_nurse_id_fkey" FOREIGN KEY ("controlling_nurse_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medications" ADD CONSTRAINT "Medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medications" ADD CONSTRAINT "Medications_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scans_Labs" ADD CONSTRAINT "Scans_Labs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scans_Labs" ADD CONSTRAINT "Scans_Labs_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicNurse" ADD CONSTRAINT "ClinicNurse_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicNurse" ADD CONSTRAINT "ClinicNurse_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicDoctor" ADD CONSTRAINT "ClinicDoctor_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicDoctor" ADD CONSTRAINT "ClinicDoctor_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
