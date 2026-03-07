export interface MedicalRecord {
  patientId: string;
  recordId: string;
  doctorId: string;
  type: string;
  ipfsCidKey: string;
  ownerMsp?: string;
  authorizedMsps?: string[];
}
