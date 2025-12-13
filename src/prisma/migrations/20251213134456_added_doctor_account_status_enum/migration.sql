-- CreateEnum
CREATE TYPE "DoctorAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "account_status" "DoctorAccountStatus" NOT NULL DEFAULT 'PENDING';
