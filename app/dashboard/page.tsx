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
    'Gejala lendir bening tanpa demam tinggi cenderung dapat ditangani dari rumah. Fokus pada hidrasi, istirahat cukup, dan pantau perubahan warna dahak setiap hari.',
  Sedang:
    'Ditemukan indikasi infeksi aktif sehingga perlu pemantauan ketat. Ikuti anjuran obat, catat suhu pagi dan malam, dan hindari paparan asap atau udara dingin.',
  Berat:
    'Terdapat tanda obstruksi saluran napas dan risiko komplikasi. Pasien dianjurkan segera menuju fasilitas kesehatan untuk evaluasi lanjutan oleh dokter spesialis paru.'
};

const fallbackSymptoms: Record<SeverityLabel, string> = {
  Ringan: 'Batuk produktif dengan dahak bening, tanpa sesak berat, kadang disertai tenggorokan gatal.',
  Sedang: 'Batuk disertai warna dahak kuning/hijau, sesak saat aktivitas, dan demam ringan yang berulang.',
  Berat: 'Sesak napas saat istirahat, dahak pekat cenderung kemerahan, dan kelelahan berat sepanjang hari.'
};

const fallbackRecommendations: Record<SeverityLabel, string[]> = {
  Ringan: [
    'Minum air hangat 8 gelas per hari untuk mengencerkan dahak.',
    'Tidur minimal 6 jam dan lakukan peregangan napas diafragma pagi-sore.'
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

interface PatientDetailView {
  id: string;
  name: string;
  status: SeverityLabel;
  date: string;
  image?: string;
  description: string;
  symptoms: string;
  recommendations: string[];
  doctorName: string;
  doctorType: string;
}

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
  return 'Sedang';
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

const buildDetailFromSummary = (summary: ApiCaseSummary): PatientDetailView => {
  const severity = toSeverityLabel(summary.severityClass, summary.status);
  const patientName = summary.patient?.displayName?.trim() || 'Pasien Tanpa Nama';
  return {
    id: summary.id,
    name: patientName,
    status: severity,
    date: formatCaseDate(summary.updatedAt || summary.createdAt),
    image: undefined,
    description: fallbackDescriptions[severity],
    symptoms: fallbackSymptoms[severity],
    recommendations: [...fallbackRecommendations[severity]],
    doctorName: 'Tim Dokter Breathy',
    doctorType: 'Spesialis Paru'
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

const mapCaseDetailToView = (detail: ApiCaseDetail, base?: PatientDetailView): PatientDetailView => {
  const severity = toSeverityLabel(detail.severityClass, detail.status);
  const image = Array.isArray(detail.recentImages)
    ? detail.recentImages.find((entry) => entry.downloadUrl)?.downloadUrl || base?.image
    : base?.image;
  const doctorName = detail.doctor?.fullName?.trim() || base?.doctorName || 'Tim Dokter Breathy';
  const doctorType = detail.doctor?.specialty?.trim() || base?.doctorType || 'Spesialis Paru';
  const descriptionBase = base?.description || fallbackDescriptions[severity];
  const metadata = detail.triageMetadata && typeof detail.triageMetadata === 'object' ? detail.triageMetadata : null;
  let description = descriptionBase;
  if (metadata && 'lastApproval' in metadata) {
    const lastApproval = (metadata as { lastApproval?: { notes?: string } }).lastApproval;
    const notes = lastApproval?.notes;
    if (typeof notes === 'string' && notes.trim().length > 0) {
      description = notes.trim();
    }
  }
  const symptomNarrative = extractSymptomNarrative(detail.latestSymptoms);
  const symptoms = symptomNarrative || base?.symptoms || fallbackSymptoms[severity];
  const recommendations = base?.recommendations?.length
    ? base.recommendations
    : [...fallbackRecommendations[severity]];

  return {
    id: detail.id,
    name: detail.patient?.displayName?.trim() || base?.name || 'Pasien Tanpa Nama',
    status: severity,
    date: formatCaseDate(detail.updatedAt || detail.createdAt),
    image,
    description,
    symptoms,
    recommendations,
    doctorName,
    doctorType
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
  const [selectedPatient, setSelectedPatient] = useState<PatientDetailView | null>(null);
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
    if (!hasDoctorSession) {
      setCaseSummaries([]);
      setTablePatients([]);
      setSelectedPatient(null);
      selectedCaseIdRef.current = null;
    }
  }, [hasDoctorSession]);

  useEffect(() => {
    if (!hasDoctorSession || !doctorSession?.token) {
      return;
    }

    let cancelled = false;

    const loadCases = async () => {
      setTableLoading(true);
      try {
        const response = await apiFetch<ApiDoctorCasesResponse>('/doctor/cases', {
          method: 'GET',
          token: doctorSession.token,
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
  }, [doctorSession?.token, hasDoctorSession]);

  const handlePatientSelect = useCallback(async (patient: PatientRow) => {
    if (!hasDoctorSession || !doctorSession?.token || tableLoading) {
      return;
    }

    const summary = caseSummaries.find((item) => item.id === patient.id);
    if (!summary) {
      return;
    }

    selectedCaseIdRef.current = patient.id;
    const baseDetail = buildDetailFromSummary(summary);
    setSelectedPatient(baseDetail);

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
        setSelectedPatient((current) => {
          if (!current) {
            return baseDetail;
          }
          if (current.description.includes(DETAIL_ERROR_MESSAGE)) {
            return current;
          }
          return {
            ...current,
            description: `${current.description}\n\n${DETAIL_ERROR_MESSAGE}`
          };
        });
      }
    }
  }, [caseSummaries, doctorSession?.token, hasDoctorSession, tableLoading]);

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
        {isPatientOnly && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md px-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">You are viewing a doctor page as user</h2>
            <p className="mt-3 text-sm text-gray-600 max-w-md">
              Halaman dashboard dokter hanya untuk keperluan demo ketika kamu masuk sebagai pasien. Konten di bawah dibuat blur dan tidak bisa diklik.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button href="/chatbot">Buka Chatbot</Button>
              <Button href="/tentang">Lihat Companion</Button>
            </div>
          </div>
        )}

        <div className={isPatientOnly ? "pointer-events-none blur-sm" : ""}>
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
