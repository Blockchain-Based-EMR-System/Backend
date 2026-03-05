export enum Period {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum ScanLabType {
  SCAN = 'SCAN',
  LAB = 'LAB',
}

export enum Action {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export enum RecordType {
  LAB_RESULT = 'LAB_RESULT',
  SCAN = 'SCAN',
  DIAGNOSIS = 'DIAGNOSIS',
  VISIT_SUMMARY = 'VISIT_SUMMARY'
}

export enum DOCTOR_FILES {
  GRADUATION_CERTIFICATE = 'graduationCertificate',
  MEMBERSHIP_CARD = 'membershipCard',
  PROFESSIONAL_PRACTICE_CARD = 'professionalPracticeCard',
  MASTERS_CERTIFICATE = 'mastersCertificate',
  FELLOWSHIP_CERTIFICATE = 'fellowshipCertificate',
  UNION_SPECIALIZATION_CERTIFICATE = 'unionSpecializationCertificate',
}

export enum NURSE_FILES {
  NATIONAL_CARD = 'nationalCard',
  BONUS_FILE = 'bonusFile',

}

export enum USER_ROLE {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PATIENT = 'PATIENT',
  ADMIN = 'ADMIN',
}