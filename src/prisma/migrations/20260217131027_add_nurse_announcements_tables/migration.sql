-- CreateEnum
CREATE TYPE "NurseAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('POSTED', 'PENDING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AnnouncementNurseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Nurse" (
    "id" TEXT NOT NULL,
    "account_status" "NurseAccountStatus" NOT NULL DEFAULT 'PENDING',
    "years_of_experience" INTEGER NOT NULL,
    "national_id_url" VARCHAR(500),
    "national_id_public_id" VARCHAR(500),
    "bonus_file_url" VARCHAR(500),
    "bonus_file_public_id" VARCHAR(500),
    "brief" TEXT,

    CONSTRAINT "Nurse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseSchedules" (
    "id" TEXT NOT NULL,
    "nurse_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" VARCHAR(12) NOT NULL,
    "end_time" VARCHAR(12) NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "NurseSchedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcements" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'PENDING',
    "gender" "Gender",
    "max_age" INTEGER,
    "years_of_experience" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementDays" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "AnnouncementDays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementNurses" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "nurse_id" TEXT NOT NULL,
    "status" "AnnouncementNurseStatus" NOT NULL DEFAULT 'PENDING',
    "doctor_id" TEXT,
    "clinic_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "AnnouncementNurses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NurseSchedules_nurse_id_idx" ON "NurseSchedules"("nurse_id");

-- CreateIndex
CREATE INDEX "NurseSchedules_doctor_id_idx" ON "NurseSchedules"("doctor_id");

-- CreateIndex
CREATE INDEX "NurseSchedules_clinic_id_idx" ON "NurseSchedules"("clinic_id");

-- CreateIndex
CREATE INDEX "Announcements_doctor_id_idx" ON "Announcements"("doctor_id");

-- CreateIndex
CREATE INDEX "Announcements_clinic_id_idx" ON "Announcements"("clinic_id");

-- CreateIndex
CREATE INDEX "Announcements_status_idx" ON "Announcements"("status");

-- CreateIndex
CREATE INDEX "AnnouncementDays_announcement_id_idx" ON "AnnouncementDays"("announcement_id");

-- CreateIndex
CREATE INDEX "AnnouncementNurses_announcement_id_idx" ON "AnnouncementNurses"("announcement_id");

-- CreateIndex
CREATE INDEX "AnnouncementNurses_nurse_id_idx" ON "AnnouncementNurses"("nurse_id");

-- CreateIndex
CREATE INDEX "AnnouncementNurses_doctor_id_idx" ON "AnnouncementNurses"("doctor_id");

-- CreateIndex
CREATE INDEX "AnnouncementNurses_clinic_id_idx" ON "AnnouncementNurses"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementNurses_announcement_id_nurse_id_key" ON "AnnouncementNurses"("announcement_id", "nurse_id");

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_id_fkey" FOREIGN KEY ("id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseSchedules" ADD CONSTRAINT "NurseSchedules_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "Nurse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseSchedules" ADD CONSTRAINT "NurseSchedules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseSchedules" ADD CONSTRAINT "NurseSchedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDays" ADD CONSTRAINT "AnnouncementDays_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "Announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementNurses" ADD CONSTRAINT "AnnouncementNurses_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "Announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementNurses" ADD CONSTRAINT "AnnouncementNurses_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "Nurse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementNurses" ADD CONSTRAINT "AnnouncementNurses_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementNurses" ADD CONSTRAINT "AnnouncementNurses_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementNurses" ADD CONSTRAINT "AnnouncementNurses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
