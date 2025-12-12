export interface MedicalRecord {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  ipfsCid: string;
  summary?: string;
  ownerMsp?: string;
  authorizedMsps?: string[];
}
