export type CaseStatus = "IN_CHATBOT" | "WAITING_DOCTOR" | "MILD" | "MODERATE" | "SEVERE";

export interface PatientSession {
  token: string;
  userId: string;
  caseId: string;
  caseStatus: CaseStatus;
  expiresIn: string;
  storedAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  role: "DOCTOR" | "HOSPITAL" | "ADMIN";
  email: string;
  fullName?: string | null;
  specialty?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  hospital?: {
    id: string;
    name: string;
    contactNumber?: string | null;
  } | null;
}

export interface DoctorSession {
  token: string;
  expiresIn: string;
  storedAt: string;
  profile: DoctorProfile;
}
