'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import { apiFetch, ApiError } from '@/lib/api';
import {
  clearDoctorSession,
  clearPatientSession,
  loadDoctorSession,
  loadPatientSession,
  saveDoctorSession,
  savePatientSession,
  updateStoredPatientStatus,
} from '@/lib/auth-storage';
import type { CaseStatus, DoctorProfile, DoctorSession, PatientSession } from '@/lib/types';

interface PatientRegisterPayload {
  phone: string;
  password: string;
  displayName?: string;
}

interface PatientLoginPayload {
  phone: string;
  password: string;
}

interface PatientAuthResult {
  userId: string;
  caseId: string;
  caseStatus: CaseStatus;
  token: string;
  expiresIn: string;
}

interface DoctorLoginPayload {
  email: string;
  password: string;
  role: DoctorProfile['role'];
}

interface AuthContextValue {
  patientSession: PatientSession | null;
  doctorSession: DoctorSession | null;
  loading: boolean;
  registerPatient: (payload: PatientRegisterPayload) => Promise<PatientSession>;
  loginPatient: (payload: PatientLoginPayload) => Promise<PatientSession>;
  loginDoctor: (payload: DoctorLoginPayload) => Promise<DoctorSession>;
  refreshDoctorProfile: () => Promise<DoctorSession | null>;
  setPatientCaseStatus: (status: CaseStatus) => void;
  logoutPatient: () => void;
  logoutDoctor: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren<{ children: ReactNode }>) {
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patient = loadPatientSession();
    const doctor = loadDoctorSession();
    setPatientSession(patient);
    setDoctorSession(doctor);
    setLoading(false);
  }, []);

  const composePatientSession = useCallback((data: PatientAuthResult): PatientSession => ({
    token: data.token,
    caseId: data.caseId,
    caseStatus: data.caseStatus,
    userId: data.userId,
    expiresIn: data.expiresIn,
    storedAt: new Date().toISOString(),
  }), []);

  const registerPatient = useCallback(async ({ phone, password, displayName }: PatientRegisterPayload) => {
    const data = await apiFetch<PatientAuthResult>('/auth/patient/register', {
      method: 'POST',
      json: { phone, password, displayName },
    });

    const session = composePatientSession(data);
    setPatientSession(session);
    savePatientSession(session);
    return session;
  }, [composePatientSession]);

  const loginPatient = useCallback(async ({ phone, password }: PatientLoginPayload) => {
    const data = await apiFetch<PatientAuthResult>('/auth/patient/login', {
      method: 'POST',
      json: { phone, password },
    });

    const session = composePatientSession(data);
    setPatientSession(session);
    savePatientSession(session);
    return session;
  }, [composePatientSession]);

  const loginDoctor = useCallback(async ({ email, password, role }: DoctorLoginPayload) => {
    const data = await apiFetch<{ token: string; expiresIn: string; profile: DoctorProfile }>('/auth/login', {
      method: 'POST',
      json: { email, password, role },
    });

    const session: DoctorSession = {
      token: data.token,
      expiresIn: data.expiresIn,
      profile: data.profile,
      storedAt: new Date().toISOString(),
    };

    setDoctorSession(session);
    saveDoctorSession(session);
    return session;
  }, []);

  const refreshDoctorProfile = useCallback(async () => {
    if (!doctorSession?.token) {
      return null;
    }
    try {
      const profile = await apiFetch<DoctorProfile>('/auth/me', {
        method: 'GET',
        token: doctorSession.token,
      });
      const updatedSession: DoctorSession = {
        ...doctorSession,
        profile,
      };
      setDoctorSession(updatedSession);
      saveDoctorSession(updatedSession);
      return updatedSession;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setDoctorSession(null);
        clearDoctorSession();
        return null;
      }
      throw error;
    }
  }, [doctorSession]);

  const setPatientCaseStatus = useCallback((status: CaseStatus) => {
    setPatientSession((prev: PatientSession | null) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, caseStatus: status };
      updateStoredPatientStatus(status);
      return next;
    });
  }, []);

  const logoutPatient = useCallback(() => {
    setPatientSession(null);
    clearPatientSession();
  }, []);

  const logoutDoctor = useCallback(() => {
    setDoctorSession(null);
    clearDoctorSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      patientSession,
      doctorSession,
      loading,
  registerPatient,
  loginPatient,
      loginDoctor,
      refreshDoctorProfile,
      setPatientCaseStatus,
      logoutPatient,
      logoutDoctor,
    }),
    [patientSession, doctorSession, loading, registerPatient, loginPatient, loginDoctor, refreshDoctorProfile, setPatientCaseStatus, logoutPatient, logoutDoctor]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
