-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "email_OTP" VARCHAR(6),
ADD COLUMN     "email_OTP_expires_at" TIMESTAMP(3),
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
