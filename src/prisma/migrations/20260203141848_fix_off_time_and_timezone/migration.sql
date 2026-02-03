/*
  Warnings:

  - Added the required column `end_time` to the `Appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot_duration` to the `Appointments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('UNSET', 'ONLINE', 'OFFLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "Appointments" ADD COLUMN     "cancelled_by" TEXT,
ADD COLUMN     "clinic_id" TEXT,
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slot_duration" INTEGER NOT NULL,
ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "ClinicDoctor" ADD COLUMN     "is_accepting" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "availability_type" "AvailabilityType" NOT NULL DEFAULT 'UNSET',
ADD COLUMN     "present" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DoctorSchedules" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration" INTEGER NOT NULL,
    "buffer_time" INTEGER NOT NULL DEFAULT 0,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "break_start" TEXT,
    "break_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DoctorSchedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorSchedules_doctor_id_idx" ON "DoctorSchedules"("doctor_id");

-- CreateIndex
CREATE INDEX "DoctorSchedules_clinic_id_idx" ON "DoctorSchedules"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSchedules_doctor_id_clinic_id_day_of_week_key" ON "DoctorSchedules"("doctor_id", "clinic_id", "day_of_week");

-- CreateIndex
CREATE INDEX "Appointments_clinic_id_idx" ON "Appointments"("clinic_id");

-- CreateIndex
CREATE INDEX "Appointments_status_idx" ON "Appointments"("status");

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedules" ADD CONSTRAINT "DoctorSchedules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedules" ADD CONSTRAINT "DoctorSchedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
