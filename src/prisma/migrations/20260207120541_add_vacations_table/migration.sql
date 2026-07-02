-- CreateEnum
CREATE TYPE "VacationStatus" AS ENUM ('UPCOMING', 'CURRENT', 'ENDED');

-- CreateTable
CREATE TABLE "Vacations" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" "VacationStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Vacations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vacations_doctor_id_idx" ON "Vacations"("doctor_id");

-- CreateIndex
CREATE INDEX "Vacations_schedule_id_idx" ON "Vacations"("schedule_id");

-- CreateIndex
CREATE INDEX "Vacations_start_date_idx" ON "Vacations"("start_date");

-- CreateIndex
CREATE INDEX "Vacations_end_date_idx" ON "Vacations"("end_date");

-- AddForeignKey
ALTER TABLE "Vacations" ADD CONSTRAINT "Vacations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacations" ADD CONSTRAINT "Vacations_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "DoctorSchedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
