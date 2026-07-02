-- Drop the foreign key constraint and the key_id column from MedicalRecords
-- since encryption keys are now stored on the Hyperledger Fabric blockchain.

ALTER TABLE "MedicalRecords" DROP CONSTRAINT IF EXISTS "MedicalRecords_key_id_fkey";
ALTER TABLE "MedicalRecords" DROP COLUMN IF EXISTS "key_id";
