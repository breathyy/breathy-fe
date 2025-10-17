"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "../../assets/components/Button";
import registerIllustration from "../../assets/images/register.png";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { registerPatient } = useAuth();

  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.trim().length > 0 && password.trim().length > 0 && agree;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await registerPatient({ phone, password, displayName });
      router.push("/chatbot");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
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
        {/* left hero */}
        <div className="p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-[500px] ">
              <Image src={registerIllustration} alt="mascot" width={820} height={820} className="rounded-3xl" />
            </div>
          </div>
        </div>

        {/* right form */}
        <div className="py-8 px-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Selamat Datang</h2>
          <p className="text-sm text-gray-700 mb-6">Mulai investigasimu bersama Breathy disini!</p>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-800 block mb-2">Nama Lengkap</label>
              <input
                value={displayName}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="Nama kamu"
                disabled={submitting}
              />
            </div>

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
              <label className="text-sm text-gray-800 block mb-2">Email (opsional)</label>
              <input
                type="email"
                value={email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="example@email.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm text-gray-800 block mb-2">Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="Minimal 8 karakter"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember"
                checked={agree}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAgree(event.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="remember" className="text-sm text-gray-700">Saya menyetujui kebijakan privasi Breathy</label>
            </div>

            <Button type="submit" className="w-full px-6 py-3 text-lg text-center rounded-lg" disabled={!canSubmit || submitting}>
              {submitting ? "Mendaftarkan..." : "Daftar →"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">Sudah punya akun? <a className="text-pink-500" href="/login">Masuk sekarang</a></p>
        </div>
      </div>
    </div>
  );
}
