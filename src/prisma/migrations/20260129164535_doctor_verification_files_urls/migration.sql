-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "fellowshipCertificatePublicId" VARCHAR(500),
ADD COLUMN     "fellowshipCertificateUrl" VARCHAR(500),
ADD COLUMN     "graduationCertificatePublicId" VARCHAR(500),
ADD COLUMN     "graduationCertificateUrl" VARCHAR(500),
ADD COLUMN     "mastersCertificatePublicId" VARCHAR(500),
ADD COLUMN     "mastersCertificateUrl" VARCHAR(500),
ADD COLUMN     "membershipCardPublicId" VARCHAR(500),
ADD COLUMN     "membershipCardUrl" VARCHAR(500),
ADD COLUMN     "professionalPracticeCardPublicId" VARCHAR(500),
ADD COLUMN     "professionalPracticeCardUrl" VARCHAR(500),
ADD COLUMN     "unionSpecializationCertificatePublicId" VARCHAR(500),
ADD COLUMN     "unionSpecializationCertificateUrl" VARCHAR(500);
