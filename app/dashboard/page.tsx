"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { 
  Navbar, 
  DonutChart, 
  CategoryCard, 
  PatientTable, 
  PatientDetailCard,
  AuthGuardModal,
  Button
} from '../../assets/assets';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { CaseStatus } from '@/lib/types';

const chartData = [
  { label: 'Sakit Tenggorokan', value: 35, color: '#4C78FF', sublabel: '' },
  { label: 'Sesak Napas', value: 25, color: '#FF82AC', sublabel: '' },
  { label: 'Batuk Berdahak', value: 20, color: '#16DBCC', sublabel: '' },
  { label: 'Lainnya', value: 20, color: '#FFBB38', sublabel: '' }
];

const categories = [
  {
    name: 'Ringan',
    color: '#22C55E',
    description: 'Bening/Putih',
    status: 'Ringan' as const
  },
  {
    name: 'Sedang', 
    color: '#F59E0B',
    description: 'Hijau/Kuning',
    status: 'Sedang' as const
  },
  {
    name: 'Berat',
    color: '#EF4444', 
    description: 'Merah/Cokelat/Hitam',
    status: 'Berat' as const
  }
];

type SeverityLabel = 'Ringan' | 'Sedang' | 'Berat';
type CaseSeverity = Extract<CaseStatus, 'MILD' | 'MODERATE' | 'SEVERE'>;
type DecisionAction = 'APPROVE' | 'REVISION_REQUEST' | 'REJECT';

const severityLabelMap: Record<CaseSeverity, SeverityLabel> = {
  MILD: 'Ringan',
  MODERATE: 'Sedang',
  SEVERE: 'Berat'
};

const severityColorMap: Record<SeverityLabel, string> = {
  Ringan: '#22C55E',
  Sedang: '#F59E0B',
  Berat: '#EF4444'
};

const fallbackDescriptions: Record<SeverityLabel, string> = {
  Ringan:
    'Breathy mencatat batuk berdahak ringan selama 1 hari tanpa tanda bahaya. Lanjutkan pemantauan mandiri harian sambil menjaga kondisi tubuh tetap stabil.',
  Sedang:
    'Ditemukan indikasi infeksi aktif sehingga perlu pemantauan ketat. Ikuti anjuran obat, catat suhu pagi dan malam, dan hindari paparan asap atau udara dingin.',
  Berat:
    'Terdapat tanda obstruksi saluran napas dan risiko komplikasi. Pasien dianjurkan segera menuju fasilitas kesehatan untuk evaluasi lanjutan oleh dokter spesialis paru.'
};

const fallbackSymptoms: Record<SeverityLabel, string> = {
  Ringan: 'Catatan gejala: batuk berdahak sedikit selama 1 hari, tanpa sesak atau demam tinggi.',
  Sedang: 'Batuk disertai warna dahak kuning/hijau, sesak saat aktivitas, dan demam ringan yang berulang.',
  Berat: 'Sesak napas saat istirahat, dahak pekat cenderung kemerahan, dan kelelahan berat sepanjang hari.'
};

const fallbackRecommendations: Record<SeverityLabel, string[]> = {
  Ringan: [
    'Lakukan rencana self-care 7 hari di rumah: hidrasi teratur, istirahat cukup, dan pantau warna dahak setiap pagi.'
  ],
  Sedang: [
    'Konsumsi mukolitik sesuai resep dan laporkan demam ≥38°C ke chatbot.',
    'Gunakan nebulizer saline dua kali sehari dan hindari aktivitas berat.'
  ],
  Berat: [
    'Menuju IGD terdekat maksimal 6 jam setelah rekomendasi dokter.',
    'Bawa riwayat alergi obat dan gunakan bantuan transportasi medis bila diperlukan.'
  ]
};

const DETAIL_ERROR_MESSAGE = 'Tidak dapat memuat detail tambahan saat ini.';

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  date: string;
  status: SeverityLabel;
  color: string;
}

interface Category {
  name: string;
  color: string;
  description: string;
  status: SeverityLabel;
}

type DoctorReviewStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
type ClaimStatus = 'CLAIMED' | 'UNCLAIMED';

interface SymptomHighlight {
  label: string;
  value: string;
}

interface PatientProfile {
  displayName: string;
  phoneNumber: string;
  age: string;
  gender: string;
  weight: string;
}

interface ClaimState {
  status: ClaimStatus;
  claimedAt: string | null;
  claimedBy: string | null;
}

interface DoctorReviewSnapshot {
  status: DoctorReviewStatus;
  doctorName: string;
  doctorType: string;
  notes: string;
  lastUpdated: string | null;
}

type PatientMediaItem = { id: string; url: string; contentType: string | null; capturedAt: string | null };

interface PatientDetailState {
  id: string;
  name: string;
  status: SeverityLabel;
  date: string;
  media: PatientMediaItem[];
  breathySummary: string;
  breathyNarrative: string;
  breathyInsights: string[];
  symptomNarrative: string;
  symptomHighlights: SymptomHighlight[];
  recommendations: string[];
  patientProfile: PatientProfile;
  doctorReview: DoctorReviewSnapshot;
  claim: ClaimState;
}

interface ReviewState {
  loading: boolean;
  lastDecision: DecisionAction | null;
  error: string | null;
}

const buildDefaultPatientProfile = (patient?: ApiCasePatient | null): PatientProfile => {
  return {
    displayName: patient?.displayName?.trim() || 'Pasien Tanpa Nama',
    phoneNumber: patient?.phoneNumber?.trim() || 'Nomor belum dicatat',
    age: 'Belum dicatat',
    gender: 'Belum dicatat',
    weight: 'Belum dicatat'
  };
};

const buildDefaultDoctorReview = (): DoctorReviewSnapshot => ({
  status: 'PENDING',
  doctorName: 'Tim Dokter Breathy',
  doctorType: 'Spesialis Paru',
  notes: '',
  lastUpdated: null
});

const buildDefaultClaimState = (): ClaimState => ({
  status: 'UNCLAIMED',
  claimedAt: null,
  claimedBy: null
});

const buildDefaultHighlights = (severity: SeverityLabel): SymptomHighlight[] => [
  { label: 'Keparahan Breathy', value: severity },
  { label: 'Status Data', value: 'Menunggu data tambahan' }
];

interface ApiCasePatient {
  id: string;
  displayName: string | null;
  phoneNumber: string | null;
}

interface ApiCaseSummary {
  id: string;
  status: CaseStatus;
  severityClass: CaseSeverity | null;
  severityScore: number | null;
  sputumCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  patient: ApiCasePatient | null;
  latestMessageAt: string | null;
  triageMetadata?: Record<string, unknown> | null;
}

interface ApiDoctorCasesResponse {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  cases: ApiCaseSummary[];
}

interface ApiCaseDetailDoctor {
  id: string;
  fullName: string | null;
  email: string | null;
  specialty: string | null;
}

interface ApiCaseDetailSymptom {
  rawText?: Record<string, unknown> | null;
  feverStatus?: string | null;
  onsetDays?: number | null;
  dyspnea?: string | null;
  comorbidity?: string | null;
  createdAt?: string | null;
}

interface ApiCaseImage {
  id: string;
  downloadUrl?: string | null;
  contentType?: string | null;
  createdAt?: string | null;
}

interface ApiCaseDetail {
  id: string;
  status: CaseStatus;
  severityClass: CaseSeverity | null;
  severityScore: number | null;
  sputumCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  patient: ApiCasePatient | null;
  doctor: ApiCaseDetailDoctor | null;
  latestSymptoms: ApiCaseDetailSymptom | null;
  recentImages: ApiCaseImage[];
  triageMetadata?: Record<string, unknown> | null;
}

interface ApiApproveResponse {
  case: ApiCaseDetail;
  evaluation: {
    severityClass: CaseSeverity | null;
    severityScore: number | null;
    components?: Record<string, unknown> | null;
  };
}

const formatCaseDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const toSeverityLabel = (severityClass: CaseSeverity | null | undefined, status: CaseStatus | null | undefined): SeverityLabel => {
  if (severityClass && severityLabelMap[severityClass]) {
    return severityLabelMap[severityClass];
  }
  if (status && severityLabelMap[(status as CaseSeverity)] ) {
    const normalized = status as CaseSeverity;
    if (severityLabelMap[normalized]) {
      return severityLabelMap[normalized];
    }
  }
  return 'Ringan';
};

const mapCaseToPatientRow = (summary: ApiCaseSummary): PatientRow => {
  const severity = toSeverityLabel(summary.severityClass, summary.status);
  const patientName = summary.patient?.displayName?.trim() || 'Pasien Tanpa Nama';
  const phone = summary.patient?.phoneNumber?.trim() || '—';
  const referenceDate = summary.latestMessageAt || summary.updatedAt || summary.createdAt;
  return {
    id: summary.id,
    name: patientName,
    phone,
    date: formatCaseDate(referenceDate),
    status: severity,
    color: severityColorMap[severity]
  };
};

const buildDetailFromSummary = (summary: ApiCaseSummary): PatientDetailState => {
  const severity = toSeverityLabel(summary.severityClass, summary.status);
  const patientProfile = buildDefaultPatientProfile(summary.patient);
  return {
    id: summary.id,
    name: patientProfile.displayName,
    status: severity,
    date: formatCaseDate(summary.updatedAt || summary.createdAt),
    media: [],
    breathySummary: fallbackDescriptions[severity],
    breathyNarrative: fallbackSymptoms[severity],
    breathyInsights: [],
    symptomNarrative: fallbackSymptoms[severity],
    symptomHighlights: buildDefaultHighlights(severity),
    recommendations: [...fallbackRecommendations[severity]],
    patientProfile,
    doctorReview: buildDefaultDoctorReview(),
    claim: buildDefaultClaimState()
  };
};

const extractSymptomNarrative = (symptom: ApiCaseDetailSymptom | null): string | null => {
  if (!symptom) {
    return null;
  }
  const raw = symptom.rawText;
  if (raw && typeof raw === 'object') {
    const summary = (raw as Record<string, unknown>).summary;
    if (typeof summary === 'string' && summary.trim().length > 0) {
      return summary.trim();
    }
    const narrative = (raw as Record<string, unknown>).narrative;
    if (typeof narrative === 'string' && narrative.trim().length > 0) {
      return narrative.trim();
    }
  }
  const parts: string[] = [];
  if (typeof symptom.feverStatus === 'string' && symptom.feverStatus.trim().length > 0) {
    parts.push(`Status demam: ${symptom.feverStatus.trim()}`);
  }
  if (typeof symptom.dyspnea === 'string' && symptom.dyspnea.trim().length > 0) {
    parts.push(`Sesak napas: ${symptom.dyspnea.trim()}`);
  }
  if (typeof symptom.comorbidity === 'string' && symptom.comorbidity.trim().length > 0) {
    parts.push(`Komorbid: ${symptom.comorbidity.trim()}`);
  }
  return parts.length > 0 ? parts.join('; ') : null;
};

const mapCaseDetailToView = (detail: ApiCaseDetail, base?: PatientDetailState): PatientDetailState => {
  const severity = toSeverityLabel(detail.severityClass, detail.status);
  const mediaItems = Array.isArray(detail.recentImages)
    ? detail.recentImages
        .filter((entry) => typeof entry.downloadUrl === 'string' && entry.downloadUrl.trim().length > 0)
        .map((entry) => ({
          id: entry.id,
          url: (entry.downloadUrl as string).trim(),
          contentType: entry.contentType ?? null,
          capturedAt: entry.createdAt ?? null
        }))
    : base?.media ?? [];
  const baseMedia = base?.media ?? [];
  const candidateMedia = mediaItems.length > 0 ? [...mediaItems, ...baseMedia] : baseMedia;
  const seenMedia = new Set<string>();
  const resolvedMedia = candidateMedia.reduce<PatientMediaItem[]>(
    (acc, item) => {
      if (item && typeof item.id === 'string' && !seenMedia.has(item.id)) {
        seenMedia.add(item.id);
        acc.push(item);
      }
      return acc;
    },
    []
  );
  const metadata = detail.triageMetadata && typeof detail.triageMetadata === 'object' ? (detail.triageMetadata as Record<string, unknown>) : null;

  const patientProfile: PatientProfile = {
    displayName: detail.patient?.displayName?.trim() || base?.patientProfile.displayName || 'Pasien Tanpa Nama',
    phoneNumber: detail.patient?.phoneNumber?.trim() || base?.patientProfile.phoneNumber || 'Nomor belum dicatat',
    age: base?.patientProfile.age || 'Belum dicatat',
    gender: base?.patientProfile.gender || 'Belum dicatat',
    weight: base?.patientProfile.weight || 'Belum dicatat'
  };

  const doctorReview: DoctorReviewSnapshot = {
    status: base?.doctorReview.status ?? 'PENDING',
    doctorName: detail.doctor?.fullName?.trim() || base?.doctorReview.doctorName || 'Tim Dokter Breathy',
    doctorType: detail.doctor?.specialty?.trim() || base?.doctorReview.doctorType || 'Spesialis Paru',
    notes: base?.doctorReview.notes ?? '',
    lastUpdated: base?.doctorReview.lastUpdated ?? null
  };

  let claim: ClaimState = base?.claim ?? buildDefaultClaimState();
  if (metadata && typeof metadata.lastClaim === 'object' && metadata.lastClaim) {
    const lastClaim = metadata.lastClaim as { at?: string; doctorId?: string | null };
    claim = {
      status: 'CLAIMED',
      claimedAt: typeof lastClaim.at === 'string' ? lastClaim.at : claim.claimedAt,
      claimedBy: lastClaim.doctorId || claim.claimedBy
    };
  }

  let breathySummary = base?.breathySummary || fallbackDescriptions[severity];
  let breathyNarrative = base?.breathyNarrative || fallbackSymptoms[severity];
  let breathyInsights = base?.breathyInsights ? [...base.breathyInsights] : [];
  const symptomNarrative = extractSymptomNarrative(detail.latestSymptoms) || base?.symptomNarrative || fallbackSymptoms[severity];
  let symptomHighlights = base?.symptomHighlights?.length ? [...base.symptomHighlights] : buildDefaultHighlights(severity);
  const recommendations = base?.recommendations?.length ? base.recommendations : [...fallbackRecommendations[severity]];

  if (metadata) {
    const lastApproval = metadata.lastApproval as { notes?: string; at?: string } | undefined;
    if (lastApproval) {
      doctorReview.status = 'APPROVED';
      if (typeof lastApproval.notes === 'string' && lastApproval.notes.trim().length > 0) {
        doctorReview.notes = lastApproval.notes.trim();
        breathyNarrative = doctorReview.notes;
      }
      if (typeof lastApproval.at === 'string') {
        doctorReview.lastUpdated = lastApproval.at;
      }
    }

    const lastVision = metadata.lastVisionAnalysis as { summary?: string; sputumCategory?: string | null } | undefined;
    if (lastVision) {
      const summary = typeof lastVision.summary === 'string' ? lastVision.summary.trim() : '';
      if (summary) {
        breathySummary = summary;
      }
      const sputumCategory = typeof lastVision.sputumCategory === 'string' ? lastVision.sputumCategory : null;
      if (sputumCategory) {
        breathyInsights = [...new Set([...breathyInsights, `Kategori dahak: ${sputumCategory}`])];
      }
    }

    const symptomStats = metadata.symptomStats as { total?: number } | undefined;
    if (symptomStats && typeof symptomStats.total === 'number') {
      breathyInsights = [...new Set([...breathyInsights, `Jumlah catatan gejala: ${symptomStats.total}`])];
    }
  }

  if (detail.latestSymptoms) {
    const latest = detail.latestSymptoms;
    symptomHighlights = [
      {
        label: 'Demam',
        value:
          typeof latest.feverStatus === 'string'
            ? latest.feverStatus
            : base?.symptomHighlights?.[0]?.value || 'Belum dicatat'
      },
      {
        label: 'Durasi Batuk',
        value:
          typeof latest.onsetDays === 'number'
            ? `${latest.onsetDays} hari`
            : base?.symptomHighlights?.[1]?.value || 'Belum dicatat'
      },
      {
        label: 'Sesak Napas',
        value:
          typeof latest.dyspnea === 'string'
            ? latest.dyspnea
            : base?.symptomHighlights?.[2]?.value || 'Belum dicatat'
      },
      {
        label: 'Komorbid',
        value:
          typeof latest.comorbidity === 'string'
            ? latest.comorbidity
            : base?.symptomHighlights?.[3]?.value || 'Belum dicatat'
      }
    ];
  }

  return {
    id: detail.id,
    name: patientProfile.displayName,
    status: severity,
    date: formatCaseDate(detail.updatedAt || detail.createdAt),
    media: resolvedMedia,
    breathySummary,
    breathyNarrative,
    breathyInsights,
    symptomNarrative,
    symptomHighlights,
    recommendations,
    patientProfile,
    doctorReview,
    claim
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { doctorSession, patientSession, loading } = useAuth();
  const [showGuard, setShowGuard] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [caseSummaries, setCaseSummaries] = useState<ApiCaseSummary[]>([]);
  const [tablePatients, setTablePatients] = useState<PatientRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetailState | null>(null);
  const [patientDemoUnlocked, setPatientDemoUnlocked] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState>({ loading: false, lastDecision: null, error: null });
  const selectedCaseIdRef = useRef<string | null>(null);

  const hasDoctorSession = Boolean(doctorSession);
  const hasPatientSession = Boolean(patientSession);
  const hasAccess = hasDoctorSession || hasPatientSession;
  const isPatientOnly = hasPatientSession && !hasDoctorSession;

  useEffect(() => {
    if (!loading && !doctorSession && !patientSession) {
      setShowGuard(true);
    } else {
      setShowGuard(false);
      setRedirected(false);
    }
  }, [loading, doctorSession, patientSession]);

  useEffect(() => {
    if (!hasAccess) {
      setCaseSummaries([]);
      setTablePatients([]);
      setSelectedPatient(null);
      selectedCaseIdRef.current = null;
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!isPatientOnly) {
      setPatientDemoUnlocked(false);
    }
  }, [isPatientOnly]);

  useEffect(() => {
    if (!hasAccess) {
      return;
    }

    let cancelled = false;

    const loadCases = async () => {
      setTableLoading(true);
      try {
        const response = await apiFetch<ApiDoctorCasesResponse>('/doctor/cases', {
          method: 'GET',
          token: doctorSession?.token,
          query: {
            status: 'WAITING_DOCTOR,MILD,MODERATE,SEVERE',
            pageSize: 50,
            assigned: 'ALL'
          }
        });

        if (cancelled) {
          return;
        }

        const cases = Array.isArray(response.cases) ? response.cases : [];
        setCaseSummaries(cases);
        setTablePatients(cases.map(mapCaseToPatientRow));

        const currentSelected = selectedCaseIdRef.current;
        if (currentSelected && !cases.some((item) => item.id === currentSelected)) {
          selectedCaseIdRef.current = null;
          setSelectedPatient(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('Gagal memuat daftar kasus dokter', error);
        setCaseSummaries([]);
        setTablePatients([]);
        selectedCaseIdRef.current = null;
        setSelectedPatient(null);
      } finally {
        if (!cancelled) {
          setTableLoading(false);
        }
      }
    };

    loadCases();

    return () => {
      cancelled = true;
    };
  }, [doctorSession?.token, hasAccess]);

  const handlePatientSelect = useCallback(async (patient: PatientRow) => {
    if (tableLoading) {
      return;
    }

    const summary = caseSummaries.find((item) => item.id === patient.id);
    if (!summary) {
      return;
    }

    selectedCaseIdRef.current = patient.id;
    const baseDetail = buildDetailFromSummary(summary);
    setSelectedPatient(baseDetail);
    setReviewState({ loading: false, lastDecision: null, error: null });

    if (!doctorSession?.token) {
      return;
    }

    try {
      const detail = await apiFetch<ApiCaseDetail>(`/cases/${patient.id}`, {
        method: 'GET',
        token: doctorSession.token
      });

      if (selectedCaseIdRef.current !== detail.id) {
        return;
      }

      setSelectedPatient(mapCaseDetailToView(detail, baseDetail));
    } catch (error) {
      console.error('Gagal memuat detail kasus', error);
      if (selectedCaseIdRef.current === patient.id) {
        setSelectedPatient((current: PatientDetailState | null) => {
          if (!current) {
            return baseDetail;
          }
          if (current.breathyNarrative.includes(DETAIL_ERROR_MESSAGE)) {
            return current;
          }
          return {
            ...current,
            breathyNarrative: `${current.breathyNarrative}\n\n${DETAIL_ERROR_MESSAGE}`
          };
        });
      }
    }
  }, [caseSummaries, doctorSession?.token, tableLoading]);

  const handleSubmitReview = useCallback(
    async (
      caseId: string,
      decision: DecisionAction,
      submission: { notes: string; severityOverride?: CaseSeverity | null }
    ) => {
      if (!selectedPatient || selectedPatient.id !== caseId) {
        return;
      }

      if (decision !== 'APPROVE') {
        setReviewState({ loading: false, lastDecision: decision, error: 'Aksi ini belum tersedia pada demo.' });
        return;
      }

      if (!doctorSession?.token) {
        setReviewState({ loading: false, lastDecision: null, error: 'Sesi dokter tidak ditemukan.' });
        return;
      }

      setReviewState({ loading: true, lastDecision: null, error: null });

      try {
        const payload: { notes?: string; severityOverride?: CaseSeverity | null } = {};
        if (submission.notes && submission.notes.trim().length > 0) {
          payload.notes = submission.notes.trim();
        }
        if (submission.severityOverride) {
          payload.severityOverride = submission.severityOverride;
        }

        const approveResponse = await apiFetch<ApiApproveResponse>(`/cases/${caseId}/approve`, {
          method: 'POST',
          token: doctorSession.token,
          json: payload
        });

        const updatedCase = approveResponse.case;
        const existingSummary = caseSummaries.find((item) => item.id === caseId) || null;
        const mergedSummary: ApiCaseSummary = existingSummary
          ? {
              ...existingSummary,
              status: updatedCase.status,
              severityClass: updatedCase.severityClass,
              severityScore: updatedCase.severityScore,
              sputumCategory: updatedCase.sputumCategory ?? existingSummary.sputumCategory ?? null,
              updatedAt: updatedCase.updatedAt,
              patient: updatedCase.patient,
              triageMetadata: updatedCase.triageMetadata ?? existingSummary.triageMetadata ?? null
            }
          : {
              id: updatedCase.id,
              status: updatedCase.status,
              severityClass: updatedCase.severityClass,
              severityScore: updatedCase.severityScore,
              sputumCategory: updatedCase.sputumCategory ?? null,
              createdAt: updatedCase.createdAt,
              updatedAt: updatedCase.updatedAt,
              patient: updatedCase.patient,
              latestMessageAt: null,
              triageMetadata: updatedCase.triageMetadata ?? null
            };

        setCaseSummaries((prev) => {
          const exists = prev.some((entry) => entry.id === caseId);
          if (!exists) {
            return [...prev, mergedSummary];
          }
          return prev.map((entry) => (entry.id === caseId ? mergedSummary : entry));
        });

        setTablePatients((prev) => {
          const exists = prev.some((row) => row.id === caseId);
          if (!exists) {
            return [...prev, mapCaseToPatientRow(mergedSummary)];
          }
          return prev.map((row) => (row.id === caseId ? mapCaseToPatientRow(mergedSummary) : row));
        });

        const baseDetail = selectedPatient ?? buildDetailFromSummary(mergedSummary);
        setSelectedPatient((current) => {
          const base = current && current.id === caseId ? current : baseDetail;
          return mapCaseDetailToView(updatedCase, base);
        });

        setReviewState({ loading: false, lastDecision: decision, error: null });
      } catch (error) {
        console.error('Gagal menyetujui kasus', error);
        const message = error instanceof Error ? error.message : 'Gagal menyetujui kasus';
        setReviewState({ loading: false, lastDecision: null, error: message });
      }
    },
    [caseSummaries, doctorSession?.token, selectedPatient]
  );

  const handleRedirectToLogin = useCallback(() => {
    if (redirected) {
      return;
    }
    setRedirected(true);
    setShowGuard(false);
    router.replace('/login');
  }, [redirected, router]);

  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthGuardModal
          open={showGuard}
          title="Perlu Masuk Dulu"
          message="Masuk ke akun Breathy untuk membuka Dashboard monitoring."
          actionLabel="Ke Halaman Masuk"
          onAction={handleRedirectToLogin}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <p className="text-sm text-gray-500">Mengecek sesi pengguna...</p>
        </div>
      </div>
    );
  }

  const handleCategoryView = (category: Category) => {
    console.log('View category:', category);
    // Handle category view details
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="relative min-h-[70vh]">
        {isPatientOnly && !patientDemoUnlocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md px-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Demo Dashboard Dokter</h2>
            <p className="mt-3 text-sm text-gray-600 max-w-md">
              Kamu masuk sebagai pasien. Silakan jelajahi tampilan dokter untuk kebutuhan demo tanpa batasan interaksi.
            </p>
            <div className="mt-6">
              <Button onClick={() => setPatientDemoUnlocked(true)}>Mengerti</Button>
            </div>
          </div>
        )}

        <div className={isPatientOnly && !patientDemoUnlocked ? 'pointer-events-none blur-sm' : ''}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className={`${selectedPatient ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'flex justify-center'}`}>
              {/* Main Content */}
              <div className={`${selectedPatient ? 'lg:col-span-2' : 'max-w-5xl w-full'} space-y-8`}>
                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <DonutChart
                    data={chartData}
                    title="Gejala Awal"
                  />

                  {/* Category Cards */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategori Dahak</h3>
                    <div className="space-y-3">
                      {categories.map((category, index) => (
                        <CategoryCard
                          key={index}
                          category={category}
                          onViewDetails={() => handleCategoryView(category)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Patient Table */}
                <PatientTable
                  patients={tablePatients}
                  onPatientSelect={handlePatientSelect}
                />
              </div>

              {/* Right Column - Patient Details */}
              {selectedPatient && (
                <div className="lg:col-span-1">
                  <PatientDetailCard
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onSubmitReview={handleSubmitReview}
                    reviewState={reviewState}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
