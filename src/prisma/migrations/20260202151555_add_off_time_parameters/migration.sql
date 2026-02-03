-- AlterTable
ALTER TABLE "DoctorSchedules" ADD COLUMN     "break_end" TEXT,
ADD COLUMN     "break_start" TEXT,
ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT true;
