'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type SeverityLabel = 'Ringan' | 'Sedang' | 'Berat';
type CaseSeverityValue = 'MILD' | 'MODERATE' | 'SEVERE';
type DoctorReviewStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
type DecisionAction = 'APPROVE' | 'REVISION_REQUEST' | 'REJECT';

interface SymptomHighlight {
  label: string;
  value: string;
}

interface PatientIdentity {
  displayName: string;
  phoneNumber: string;
  age: string;
  gender: string;
  weight: string;
}

interface ClaimState {
  status: 'CLAIMED' | 'UNCLAIMED';
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

interface PatientMediaItem {
  id: string;
  url: string;
  contentType: string | null;
  capturedAt: string | null;
}

interface PatientDetail {
  id: string;
  name: string;
  status: SeverityLabel;
  date: string;
  media: PatientMediaItem[];
  breathyNarrative: string;
  breathySummary: string;
  breathyInsights: string[];
  symptomNarrative: string;
  symptomHighlights: SymptomHighlight[];
  recommendations: string[];
  patientProfile: PatientIdentity;
  doctorReview: DoctorReviewSnapshot;
  claim: ClaimState;
}

interface ReviewStateProp {
  loading: boolean;
  lastDecision: DecisionAction | null;
  error: string | null;
}

interface PatientDetailCardProps {
  patient: PatientDetail | null;
  onClose: () => void;
  onClaim?: (caseId: string) => void;
  claiming?: boolean;
  onSubmitReview?: (caseId: string, decision: DecisionAction, submission: { notes: string; severityOverride?: CaseSeverityValue | null }) => void;
  reviewState?: ReviewStateProp;
}

const severityToValueMap: Record<SeverityLabel, CaseSeverityValue> = {
  Ringan: 'MILD',
  Sedang: 'MODERATE',
  Berat: 'SEVERE'
};

const severityOptionList: Array<{ value: CaseSeverityValue; label: string; description: string }> = [
  { value: 'MILD', label: 'Ringan', description: 'Pemantauan jarak jauh dan edukasi harian.' },
  { value: 'MODERATE', label: 'Sedang', description: 'Butuh konsultasi dokter dalam 24 jam.' },
  { value: 'SEVERE', label: 'Berat', description: 'Rujuk segera ke fasilitas kesehatan.' }
];

const decisionLabelMap: Record<DecisionAction, string> = {
  APPROVE: 'Setujui analisis',
  REVISION_REQUEST: 'Minta revisi',
  REJECT: 'Tolak analisis'
};

export default function PatientDetailCard({ patient, onClose, onClaim, claiming, onSubmitReview, reviewState }: PatientDetailCardProps) {
  const [notes, setNotes] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<CaseSeverityValue>('MODERATE');

  useEffect(() => {
    if (!patient) {
      setNotes('');
      return;
    }
    setNotes(patient.doctorReview.notes || '');
    setSelectedSeverity(severityToValueMap[patient.status] ?? 'MODERATE');
  }, [patient]);

  const identityMissing = useMemo(() => {
    if (!patient) {
      return false;
    }
    return [patient.patientProfile.age, patient.patientProfile.gender, patient.patientProfile.weight].some(
      (value) => value === 'Belum dicatat'
    );
  }, [patient]);

  const reviewLoading = Boolean(reviewState?.loading);
  const reviewError = reviewState?.error ?? null;
  const lastDecision = reviewState?.lastDecision ?? null;

  const severityBadgeClass = (status: SeverityLabel) => {
    switch (status) {
      case 'Ringan':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Sedang':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Berat':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const reviewStatusBadge = (status: DoctorReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REVISION_REQUESTED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatTimestamp = (value: string | null): string => {
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

  const claimDisabled = !patient || patient.claim.status === 'CLAIMED' || Boolean(claiming);

  const handleClaim = () => {
    if (!patient || !onClaim || claimDisabled) {
      return;
    }
    onClaim(patient.id);
  };

  const handleDecision = (decision: DecisionAction) => {
    if (!patient || !onSubmitReview) {
      return;
    }
    onSubmitReview(patient.id, decision, {
      notes,
      severityOverride: selectedSeverity
    });
  };

  if (!patient) {
    return null;
  }

  const primaryMedia = patient.media.length > 0 ? patient.media[0] : null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Detail Kasus</h3>
          <p className="text-sm text-gray-500">Monitor temuan Breathy dan tindak lanjut dokter</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          aria-label="Tutup detail"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-lg font-semibold text-pink-600">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{patient.name}</h4>
            <p className="text-sm text-gray-600">{patient.date}</p>
            <p className="text-sm text-gray-500">{patient.patientProfile.phoneNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-full ${severityBadgeClass(
                patient.status
              )}`}
            >
              <span>
                {patient.status === 'Ringan'
                  ? '🟢'
                  : patient.status === 'Sedang'
                    ? '🟡'
                    : patient.status === 'Berat'
                      ? '🔴'
                      : '⚪'}
              </span>
              <span>Kasus {patient.status}</span>
            </div>
            {patient.claim.status === 'UNCLAIMED' ? (
              <button
                onClick={handleClaim}
                className="px-3 py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={claimDisabled}
              >
                {claiming ? 'Mengklaim...' : 'Klaim Kasus'}
              </button>
            ) : (
              <div className="text-right text-xs text-gray-500">
                <p className="font-medium text-gray-700">Sudah diklaim</p>
                <p>{patient.claim.claimedBy ? `Oleh ${patient.claim.claimedBy}` : 'Dokter belum tercatat'}</p>
                <p>{formatTimestamp(patient.claim.claimedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {identityMissing && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <p className="font-medium">Lengkapi identitas pasien untuk triase akurat.</p>
          <p className="mt-1">
            Pastikan umur, jenis kelamin, dan berat badan pasien sudah ditanyakan melalui chatbot sebelum dokter memberi keputusan.
          </p>
        </div>
      )}

      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Identitas Pasien</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase">Nama panggilan</p>
            <p className="text-sm font-medium text-gray-800">{patient.patientProfile.displayName || patient.name}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase">Nomor kontak</p>
            <p className="text-sm font-medium text-gray-800">{patient.patientProfile.phoneNumber}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase">Usia</p>
            <p className="text-sm font-medium text-gray-800">{patient.patientProfile.age}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase">Jenis kelamin</p>
            <p className="text-sm font-medium text-gray-800">{patient.patientProfile.gender}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Perkiraan berat badan</p>
            <p className="text-sm font-medium text-gray-800">{patient.patientProfile.weight}</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Media Terbaru</h4>
        {primaryMedia ? (
          <div className="space-y-3">
            <div className="w-full h-52 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={primaryMedia.url}
                alt="Dokumentasi kasus"
                width={640}
                height={320}
                className="w-full h-full object-cover"
              />
            </div>
            {patient.media.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {patient.media.slice(1).map((item, index) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <Image
                        src={item.url}
                        alt={`Media tambahan ${index + 2}`}
                        width={320}
                        height={180}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                      <span>Foto {index + 2}</span>
                      {item.capturedAt && <span>{formatTimestamp(item.capturedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500">
              <p>Setiap foto otomatis tersimpan ke kasus untuk ditinjau dokter.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            Belum ada foto yang diunggah. Pasien akan diminta mengirim foto dahak atau tenggorokan sebelum kasus diproses.
          </div>
        )}
      </section>

      {primaryMedia && patient.media.length > 0 && primaryMedia.capturedAt && (
        <section className="mb-6">
          <p className="text-xs text-gray-500 text-right">Terakhir diunggah {formatTimestamp(primaryMedia.capturedAt)}</p>
        </section>
      )}

      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Ringkasan Breathy</h4>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
          <p className="font-medium text-gray-800">{patient.breathySummary}</p>
          <p>{patient.breathyNarrative}</p>
          {patient.breathyInsights.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {patient.breathyInsights.map((insight, index) => (
                <li key={`insight-${index}`}>{insight}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Catatan Gejala</h4>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">{patient.symptomNarrative}</div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {patient.symptomHighlights.map((item) => (
            <div key={item.label} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">{item.label}</p>
              <p className="text-sm font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Rekomendasi Awal</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {patient.recommendations.map((rec, index) => (
            <li key={`recommendation-${index}`} className="flex items-start gap-2">
              <span className="text-gray-400 mt-[2px]">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Tinjauan Dokter</h4>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Status review:</span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${reviewStatusBadge(
                patient.doctorReview.status
              )}`}
            >
              {patient.doctorReview.status === 'APPROVED'
                ? 'Disetujui'
                : patient.doctorReview.status === 'REVISION_REQUESTED'
                  ? 'Butuh revisi'
                  : patient.doctorReview.status === 'REJECTED'
                    ? 'Ditolak'
                    : 'Menunggu keputusan'}
            </span>
            {patient.doctorReview.lastUpdated && (
              <span className="text-xs text-gray-500">
                Terakhir diperbarui {formatTimestamp(patient.doctorReview.lastUpdated)}
              </span>
            )}
          </div>

          {patient.doctorReview.notes && (
            <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
              <p className="font-medium text-gray-800 mb-1">Catatan sebelumnya</p>
              <p>{patient.doctorReview.notes}</p>
            </div>
          )}

          <div>
            <label htmlFor="doctor-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Catatan untuk AI / pasien
            </label>
            <textarea
              id="doctor-notes"
              className="w-full min-h-[96px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-sm text-gray-700 p-3 resize-y"
              placeholder="Masukkan instruksi tambahan atau penilaian dokter..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Pilih kelas keparahan akhir</p>
            <div className="flex flex-col gap-2">
              {severityOptionList.map((option) => {
                const selected = selectedSeverity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedSeverity(option.value)}
                    className={`text-left border rounded-lg px-3 py-2 transition-colors ${
                      selected
                        ? 'border-pink-500 bg-pink-50 text-pink-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-pink-200'
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDecision('APPROVE')}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={reviewLoading}
            >
              Setujui Analisis
            </button>
            <button
              type="button"
              onClick={() => handleDecision('REVISION_REQUEST')}
              className="px-4 py-2 text-sm font-semibold text-yellow-600 border border-yellow-300 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={reviewLoading}
            >
              Minta Revisi AI
            </button>
            <button
              type="button"
              onClick={() => handleDecision('REJECT')}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={reviewLoading}
            >
              Tolak Analisis
            </button>
          </div>

          {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
          {!reviewError && lastDecision && (
            <p className="text-sm text-green-600">
              Aksi terakhir: {decisionLabelMap[lastDecision]} ({patient.doctorReview.doctorName})
            </p>
          )}
        </div>
      </section>
    </div>
  );
}