/*
  Warnings:

  - You are about to drop the column `cancelled_by` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `clinic_id` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `slot_duration` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `is_accepting` on the `ClinicDoctor` table. All the data in the column will be lost.
  - You are about to drop the column `availability_type` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `present` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the `DoctorSchedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Appointments" DROP CONSTRAINT "Appointments_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorSchedules" DROP CONSTRAINT "DoctorSchedules_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorSchedules" DROP CONSTRAINT "DoctorSchedules_doctor_id_fkey";

-- DropIndex
DROP INDEX "public"."Appointments_clinic_id_idx";

-- DropIndex
DROP INDEX "public"."Appointments_status_idx";

-- AlterTable
ALTER TABLE "Appointments" DROP COLUMN "cancelled_by",
DROP COLUMN "clinic_id",
DROP COLUMN "end_time",
DROP COLUMN "slot_duration",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ClinicDoctor" DROP COLUMN "is_accepting";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "availability_type",
DROP COLUMN "present";

-- DropTable
DROP TABLE "public"."DoctorSchedules";

-- DropEnum
DROP TYPE "public"."AppointmentStatus";

-- DropEnum
DROP TYPE "public"."AvailabilityType";

-- DropEnum
DROP TYPE "public"."DayOfWeek";
