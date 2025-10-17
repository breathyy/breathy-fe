"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "../../assets/components/Button";
import loginIllustration from "../../assets/images/login.png";
import { useAuth } from "@/contexts/AuthContext";

type RoleTab = "patient" | "doctor";
const DOCTOR_ROLE = "DOCTOR";

export default function LoginPage() {
  const router = useRouter();
  const { loginPatient, loginDoctor } = useAuth();

  const [role, setRole] = useState<RoleTab>("patient");

  const [phone, setPhone] = useState("");
  const [patientPassword, setPatientPassword] = useState("");

  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoginPatient = phone.trim().length > 0 && patientPassword.trim().length > 0;
  const canSubmitDoctor = doctorEmail.trim().length > 0 && doctorPassword.trim().length > 0;
  const handlePatientLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canLoginPatient) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await loginPatient({ phone, password: patientPassword });
      router.push("/chatbot");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitDoctor) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
  await loginDoctor({ email: doctorEmail, password: doctorPassword, role: DOCTOR_ROLE });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white">
      <button
        aria-label="Kembali"
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow hover:shadow-md transition text-[#FE61A2]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="#FE61A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Kembali
      </button>
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-12 items-center">
        <div className="p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-[500px]">
              <Image src={loginIllustration} alt="mascot" width={820} height={820} className="rounded-3xl" />
            </div>
          </div>
        </div>

        <div className="py-8 px-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Selamat Datang Kembali</h2>
          <p className="text-sm text-gray-700 mb-6">Hubungkan portal dengan backend Breathy.</p>

          <div className="bg-gray-50 p-2 rounded-lg inline-flex mb-6 w-full">
            <button
              onClick={() => setRole("patient")}
              className={`px-6 py-2 w-full rounded-lg ${role === "patient" ? "bg-white text-pink-500 font-medium" : "text-gray-500"}`}
            >
              Pasien
            </button>
            <button
              onClick={() => setRole("doctor")}
              className={`px-6 py-2 w-full rounded-lg ${role === "doctor" ? "bg-white text-pink-500 font-medium" : "text-gray-500"}`}
            >
              Dokter
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

          {role === "patient" ? (
            <form onSubmit={handlePatientLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-800 block mb-2">Nomor WhatsApp</label>
                <input
                  value={phone}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Contoh: +6281234567890"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-gray-800 block mb-2">Password</label>
                <input
                  type="password"
                  value={patientPassword}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPatientPassword(event.target.value)}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Password"
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full px-6 py-3 text-lg text-center rounded-lg" disabled={!canLoginPatient || submitting}>
                {submitting ? "Memproses..." : "Masuk →"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-800 block mb-2">Email Dokter</label>
                <input
                  type="email"
                  value={doctorEmail}
                  onChange={(event) => setDoctorEmail(event.target.value)}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="dokter@breathy.test"
                />
              </div>

              <div>
                <label className="text-sm text-gray-800 block mb-2">Kata Sandi</label>
                <input
                  type="password"
                  value={doctorPassword}
                  onChange={(event) => setDoctorPassword(event.target.value)}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Password"
                />
              </div>

              <Button type="submit" className="w-full px-6 py-3 text-lg text-center rounded-lg" disabled={!canSubmitDoctor || submitting}>
                {submitting ? "Memproses..." : "Masuk →"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Belum punya akun? <a className="text-pink-500" href="/register">Daftar sekarang</a>
          </p>
        </div>
      </div>
    </div>
  );
}
