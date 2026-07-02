-- AlterTable
ALTER TABLE "Appointments" ADD COLUMN     "patients_ahead" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;
