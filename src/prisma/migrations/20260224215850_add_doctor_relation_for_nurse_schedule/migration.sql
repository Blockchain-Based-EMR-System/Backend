/*
  Warnings:

  - The values [POSTED] on the enum `AnnouncementStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AnnouncementStatus_new" AS ENUM ('PENDING', 'EXPIRED');
ALTER TABLE "public"."Announcements" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Announcements" ALTER COLUMN "status" TYPE "AnnouncementStatus_new" USING ("status"::text::"AnnouncementStatus_new");
ALTER TYPE "AnnouncementStatus" RENAME TO "AnnouncementStatus_old";
ALTER TYPE "AnnouncementStatus_new" RENAME TO "AnnouncementStatus";
DROP TYPE "public"."AnnouncementStatus_old";
ALTER TABLE "Announcements" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "AnnouncementNurses" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "NurseSchedules" ADD CONSTRAINT "NurseSchedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
