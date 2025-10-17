import { DoctorSession, PatientSession, CaseStatus } from "./types";

const PATIENT_STORAGE_KEY = "breathy.patient.session";
const DOCTOR_STORAGE_KEY = "breathy.doctor.session";

type Maybe<T> = T | null;

const isBrowser = typeof window !== "undefined";

const readJson = <T>(key: string): Maybe<T> => {
  if (!isBrowser) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse auth storage for key ${key}`, error);
    window.localStorage.removeItem(key);
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeKey = (key: string) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.removeItem(key);
};

export const loadPatientSession = (): Maybe<PatientSession> => {
  return readJson<PatientSession>(PATIENT_STORAGE_KEY);
};

export const savePatientSession = (session: PatientSession) => {
  writeJson(PATIENT_STORAGE_KEY, session);
};

export const clearPatientSession = () => {
  removeKey(PATIENT_STORAGE_KEY);
};

export const loadDoctorSession = (): Maybe<DoctorSession> => {
  return readJson<DoctorSession>(DOCTOR_STORAGE_KEY);
};

export const saveDoctorSession = (session: DoctorSession) => {
  writeJson(DOCTOR_STORAGE_KEY, session);
};

export const clearDoctorSession = () => {
  removeKey(DOCTOR_STORAGE_KEY);
};

export const updateStoredPatientStatus = (status: CaseStatus) => {
  if (!isBrowser) {
    return;
  }
  const current = loadPatientSession();
  if (!current) {
    return;
  }
  const next: PatientSession = { ...current, caseStatus: status };
  savePatientSession(next);
};
