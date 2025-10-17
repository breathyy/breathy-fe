"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Navbar, DateChip, Button, AuthGuardModal } from "../../assets/assets";
import Tentang from "../../assets/images/tentang.png";
import Mascot from "../../assets/images/breathy/breathy2.png";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import type { CaseStatus } from "@/lib/types";

type CompanionResourceType = "hospital" | "pharmacy" | "note" | "task";

interface CompanionResource {
  id: string;
  type: CompanionResourceType;
  title: string;
  description: string;
  meta?: string;
  linkHref?: string;
  linkLabel?: string;
}

interface CompanionPlan {
  statusBadge: string;
  lastUpdate: string;
  statusTitle: string;
  summary: string;
  highlights: string[];
  timeline: Array<{ date: string; label?: string }>;
  resources: CompanionResource[];
}

const companionPlans: Partial<Record<CaseStatus, CompanionPlan>> = {
  MILD: {
    statusBadge: "Rencana Pemantauan 7 Hari",
    lastUpdate: "19 Oktober 2025",
    statusTitle: "Kasus Ringan",
    summary:
      "Dokter mengonfirmasi gejala kamu tergolong ringan dan dapat dipantau dari rumah. Ikuti rencana ini selama tujuh hari dan laporkan perkembanganmu lewat chatbot.",
    highlights: [
      "Minum air hangat minimal 8 gelas per hari untuk membantu mengencerkan dahak.",
      "Istirahat cukup 6-8 jam setiap malam dan hindari udara dingin yang memicu batuk.",
      "Latihan pernapasan diafragma 2 kali sehari untuk melancarkan aliran udara.",
    ],
    timeline: [
      { date: "19 Oktober 2025", label: "Hari ke-1" },
      { date: "20 Oktober 2025", label: "Update Chatbot" },
      { date: "21 Oktober 2025", label: "Latihan Pernapasan" },
      { date: "22 Oktober 2025", label: "Cek Dahak" },
      { date: "23 Oktober 2025", label: "Pantau Suhu" },
      { date: "24 Oktober 2025", label: "Review Gejala" },
      { date: "25 Oktober 2025", label: "Lapor ke Chatbot" },
    ],
    resources: [
      {
        id: "mild-note",
        type: "note",
        title: "Catatan Dokter",
        description:
          "Tidak ada tanda infeksi berat. Fokus pada hidrasi, nutrisi seimbang, dan jaga kebersihan mulut untuk mengurangi produksi dahak.",
        meta: "Dr. Ayanti Putri, Sp.P",
      },
      {
        id: "mild-task",
        type: "task",
        title: "Checklist Harian",
        description:
          "Kumur air hangat + garam setelah bangun tidur, konsumsi buah tinggi vitamin C, dan lakukan peregangan ringan sore hari.",
      },
      {
        id: "mild-note-2",
        type: "note",
        title: "Tanda Bahaya",
        description:
          "Segera hubungi dokter jika demam >38,5°C selama dua hari atau napas terasa semakin sesak.",
      },
    ],
  },
  MODERATE: {
    statusBadge: "Pengawasan Intensif Rumah",
    lastUpdate: "19 Oktober 2025",
    statusTitle: "Kasus Sedang",
    summary:
      "Dokter mendeteksi marker infeksi aktif namun kondisi pernapasan masih stabil. Ikuti terapi yang diberikan dan laporkan perubahan signifikan setiap hari.",
    highlights: [
      "Konsumsi mukolitik sesuai resep untuk membantu pengeluaran dahak.",
      "Catat suhu tubuh pagi dan malam, unggah ke chatbot bila ≥38°C.",
      "Batasi aktivitas berat dan gunakan masker di ruang ventilasi buruk.",
    ],
    timeline: [
      { date: "19 Oktober 2025", label: "Mulai Terapi" },
      { date: "20 Oktober 2025", label: "Kontrol Gejala" },
      { date: "21 Oktober 2025", label: "Upload Foto Dahak" },
      { date: "22 Oktober 2025", label: "Evaluasi Dokter" },
      { date: "23 Oktober 2025", label: "Ringkasan Follow-up" },
    ],
    resources: [
      {
        id: "moderate-prescription",
        type: "note",
        title: "Resep Dokter",
        description:
          "Ambroxol 30mg, diminum 3x sehari setelah makan. Paracetamol 500mg bila demam >38°C (maks 3x sehari).",
        meta: "Gunakan sesuai petunjuk dokter",
      },
      {
        id: "moderate-pharmacy",
        type: "pharmacy",
        title: "Apotek Mitra Medika",
        description: "Jl. Braga No. 25, Bandung. Stok obat resep tersedia hingga 22.00 WIB.",
        linkHref: "https://maps.google.com/?q=Apotek+Mitra+Medika+Bandung",
        linkLabel: "Lihat peta",
      },
      {
        id: "moderate-note",
        type: "note",
        title: "Catatan Dokter",
        description:
          "Kontrol ulang via chatbot pada hari ke-3. Laporkan bila muncul darah pada dahak atau napas berbunyi mengi.",
      },
      {
        id: "moderate-task",
        type: "task",
        title: "Jadwal Nebulizer",
        description:
          "Gunakan nebulizer saline dua kali sehari (pagi & malam). Duduk tegak dan tarik napas perlahan selama 10 menit.",
      },
    ],
  },
  SEVERE: {
    statusBadge: "Prioritas Rujukan Darurat",
    lastUpdate: "17 Oktober 2025",
    statusTitle: "Kasus Berat",
    summary:
      "Dokter merekomendasikan evaluasi langsung di fasilitas kesehatan terdekat karena ditemukan tanda obstruksi dan perubahan warna dahak signifikan.",
    highlights: [
      "Segera menuju IGD terdekat, jangan menunda lebih dari 6 jam.",
      "Bawa riwayat alergi obat dan hasil pemeriksaan terakhir.",
      "Hubungi hotline Breathy 150-990 bila membutuhkan pendampingan transport.",
    ],
    timeline: [
      { date: "17 Oktober 2025", label: "Rujukan IGD" },
      { date: "18 Oktober 2025", label: "Kontrol Lanjutan" },
      { date: "19 Oktober 2025", label: "Pemantauan Dokter" },
    ],
    resources: [
      {
        id: "severe-hospital-1",
        type: "hospital",
        title: "RSUD Kota Bandung",
        description: "Jl. Kencana Wungu No. 12, layanan IGD 24 jam. Ruang isolasi saluran napas tersedia.",
        linkHref: "https://maps.google.com/?q=RSUD+Kota+Bandung",
        linkLabel: "Buka di Maps",
      },
      {
        id: "severe-hospital-2",
        type: "hospital",
        title: "Rumah Sakit Paru Dr. H. A. Rotinsulu",
        description: "Jl. Bungur No. 137, khusus paru dengan fasilitas bronkoskopi lengkap.",
        linkHref: "https://maps.google.com/?q=Rumah+Sakit+Paru+Rotinsulu",
        linkLabel: "Rute tercepat",
      },
      {
        id: "severe-pharmacy",
        type: "pharmacy",
        title: "Apotek Gawat Darurat 24H",
        description: "Jl. Diponegoro No. 45, layanan farmasi darurat buka 24 jam.",
        linkHref: "https://maps.google.com/?q=Apotek+Gawat+Darurat+24H",
        linkLabel: "Hubungi apotek",
      },
      {
        id: "severe-prescription",
        type: "note",
        title: "Resep Dokter",
        description:
          "Antibiotik broad-spectrum (ceftriaxone) IV + terapi bronkodilator nebulizer. Hanya diberikan oleh tenaga medis di fasilitas kesehatan.",
        meta: "Jangan konsumsi mandiri tanpa supervisi dokter",
      },
      {
        id: "severe-note",
        type: "note",
        title: "Catatan Dokter",
        description:
          "Pasien wajib rawat jalan terjadwal setelah perawatan IGD. Catat frekuensi sesak dan warna dahak setiap hari untuk evaluasi lanjutan.",
      },
    ],
  },
};

const resourceIcons: Record<CompanionResourceType, string> = {
  hospital: "🏥",
  pharmacy: "💊",
  note: "📝",
  task: "✅",
};

const statusLabel: Record<CaseStatus, string> = {
  IN_CHATBOT: "Sedang Konsultasi di Chatbot",
  WAITING_DOCTOR: "Menunggu Tinjauan Dokter",
  MILD: "Kasus Terkonfirmasi Ringan",
  MODERATE: "Kasus Terkonfirmasi Sedang",
  SEVERE: "Kasus Terkonfirmasi Berat",
};

const isEscalatedStatus = (status: CaseStatus | null): boolean => status === "MODERATE" || status === "SEVERE";

export default function TentangPage() {
  const router = useRouter();
  const { patientSession, doctorSession, loading, setPatientCaseStatus } = useAuth();
  const [showGuard, setShowGuard] = useState(false);
  const [redirected, setRedirected] = useState(false);

  const hasPatientSession = Boolean(patientSession);
  const hasDoctorSession = Boolean(doctorSession);
  const patientToken = patientSession?.token ?? null;
  const patientCaseId = patientSession?.caseId ?? null;
  const patientCaseStatus = patientSession?.caseStatus ?? null;
  const hasAccess = hasPatientSession || hasDoctorSession;
  const caseStatus: CaseStatus | null = patientCaseStatus ?? null;
  const plan = useMemo(() => (caseStatus ? companionPlans[caseStatus] : undefined), [caseStatus]);
  const showCompanionPlan = hasPatientSession && Boolean(plan);

  useEffect(() => {
    if (!hasPatientSession || !patientToken || !patientCaseId) {
      return;
    }
    if (patientCaseStatus !== "WAITING_DOCTOR") {
      return;
    }

    let cancelled = false;

    const synchronizeCaseStatus = async () => {
      try {
        const detail = await apiFetch<{ status: CaseStatus }>(`/cases/${patientCaseId}`, {
          method: "GET",
          token: patientToken,
        });

        if (cancelled) {
          return;
        }

        const nextStatus = detail?.status;
        if (nextStatus && nextStatus !== patientCaseStatus) {
          setPatientCaseStatus(nextStatus);
        }
      } catch (error) {
        console.error("Gagal menyegarkan status companion", error);
      }
    };

    synchronizeCaseStatus();

    return () => {
      cancelled = true;
    };
  }, [hasPatientSession, patientToken, patientCaseId, patientCaseStatus, setPatientCaseStatus]);

  useEffect(() => {
    if (!loading && !hasAccess) {
      setShowGuard(true);
    } else {
      setShowGuard(false);
      setRedirected(false);
    }
  }, [loading, hasAccess]);

  const handleRedirectToLogin = useCallback(() => {
    if (redirected) {
      return;
    }
    setRedirected(true);
    setShowGuard(false);
    router.replace("/login");
  }, [redirected, router]);

  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthGuardModal
          open={showGuard}
          title="Perlu Masuk Dulu"
          message="Masuk ke akun Breathy untuk membuka Companion."
          actionLabel="Ke Halaman Masuk"
          onAction={handleRedirectToLogin}
          autoRedirectMs={3000}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E0446A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderNotice = (): React.ReactNode => {
    if (hasDoctorSession && !hasPatientSession) {
      return (
        <div className="rounded-3xl bg-white shadow-lg border border-pink-100 p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Companion Khusus untuk Pasien</h2>
          <p className="mt-3 text-sm text-gray-600">
            Anda sedang melihat halaman Companion dengan akun dokter. Untuk pengalaman penuh, silakan masuk sebagai pasien demo.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/dashboard">Kembali ke Dashboard Dokter</Button>
            <Button href="/login">Masuk sebagai Pasien</Button>
          </div>
        </div>
      );
    }

    if (!hasPatientSession) {
      return (
        <div className="rounded-3xl bg-white shadow-lg border border-pink-100 p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Belum Ada Companion Plan</h2>
          <p className="mt-3 text-sm text-gray-600">
            Kamu belum punya running case aktif. Mulai sesi chatbot untuk melakukan triase dan mendapatkan rencana pendampingan dari Breathy.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/chatbot">Konsultasi Lewat Chatbot</Button>
          </div>
        </div>
      );
    }

    if (caseStatus === "WAITING_DOCTOR") {
      return (
        <div className="rounded-3xl bg-white shadow-lg border border-pink-100 p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Companion Akan Segera Aktif</h2>
          <p className="mt-3 text-sm text-gray-600">
            Kasus kamu sedang ditinjau oleh dokter. Companion akan terbuka otomatis begitu dokter menyetujui hasil triase kamu.
          </p>
        </div>
      );
    }

    if (isEscalatedStatus(caseStatus)) {
      return (
        <div className="rounded-3xl bg-white shadow-lg border border-pink-100 p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Kasus Kamu Perlu Pendampingan Khusus</h2>
          <p className="mt-3 text-sm text-gray-600">
            Status kasus kamu: {caseStatus ? statusLabel[caseStatus] : "Tidak diketahui"}. Tim dokter Breathy akan menghubungi kamu untuk langkah lanjutan.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-3xl bg-white shadow-lg border border-pink-100 p-10 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Belum Ada Companion Plan</h2>
        <p className="mt-3 text-sm text-gray-600">
          Kamu belum punya running case aktif. Konsultasikan gejala kamu melalui chatbot untuk memulai kasus baru.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/chatbot">Konsultasi Lewat Chatbot</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!showCompanionPlan || !plan ? (
          renderNotice()
        ) : (
          <>
            {/* Header with case info */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white rounded-full px-6 py-2 shadow-sm border border-[#BF3B6C] mb-4">
                <span className="text-gray-700 font-medium">{plan.statusBadge} · Pembaruan {plan.lastUpdate}</span>
              </div>
            </div>

            {/* Main content card */}
            <div className="rounded-3xl shadow-lg p-4 mb-8 bg-[#fff3f3]">
              <div className="flex items-start gap-6 bg-[#FDCDD9] rounded-3xl">
                {/* Mascot image */}
                <div className="flex-shrink-0">
                  <Image
                    src={Mascot}
                    alt="Breathy Mascot"
                    width={150}
                    height={120}
                    className="rounded-lg"
                  />
                </div>

                {/* Case information */}
                <div className="flex-1 p-5">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{plan.statusTitle}</h1>
                  <p className="text-gray-700 leading-relaxed">{plan.summary}</p>
                  {plan.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-gray-700">
                      {plan.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-pink-500" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Date chips */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex flex-wrap justify-center gap-3">
                {plan.timeline.map(({ date, label }) => (
                  <div key={`${date}-${label ?? ""}`} className="flex flex-col items-center">
                    <DateChip date={date} />
                    {label && <span className="mt-1 text-xs text-gray-500">{label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {plan.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-2xl bg-white shadow-md border border-pink-100 p-6 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>{resourceIcons[resource.type]}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
                      {resource.meta && <p className="mt-2 text-xs text-gray-500 uppercase tracking-wide">{resource.meta}</p>}
                      {resource.linkHref && (
                        <Link
                          href={resource.linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center text-sm font-medium text-pink-600 hover:underline"
                        >
                          {resource.linkLabel ?? "Lihat detail"}
                        </Link>
                      )}
                    </div>
                  </div>
                  {resource.type === "task" && (
                    <div className="rounded-xl bg-[#fff3f3] border border-[#FDCDD9] px-4 py-3 text-sm text-gray-700">
                      Gunakan checklist ini setiap hari dan centang di aplikasi atau catatan pribadi kamu.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Visual filler for aesthetic continuity */}
            <div className="relative rounded-2xl overflow-hidden justify-center flex">
              <Image
                src={Tentang}
                alt="Breathy Companion Illustration"
                width={400}
                height={300}
                className="w-3/4 h-full object-cover"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
