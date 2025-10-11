"use client";

import React, { useState } from "react";
import Image from "next/image";
import Button from "../../assets/components/Button";
import { useRouter } from 'next/navigation';
import login from "../../assets/images/login.png";

export default function LoginPage() {
  const [role, setRole] = useState<'patient'|'doctor'>('patient');
  const router = useRouter();

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
        {/* left hero */}
        <div className="p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-[500px] ">
              <Image src={login} alt="mascot" width={820} height={820} className="rounded-3xl" />
            </div>
          </div>
        </div>

        {/* right form */}
        <div className="py-8 px-6">
          <h2 className="text-3xl font-bold mb-2">Selamat Datang Kembali</h2>
          <p className="text-sm text-gray-600 mb-6">Mulai investigasimu bersama Breathy disini!</p>

          <div className="bg-gray-50 p-2 rounded-lg inline-flex mb-6 w-full">
            <button
              onClick={() => setRole('patient')}
              className={`px-6 py-2 w-full rounded-lg ${role==='patient' ? 'bg-white text-pink-500 font-medium' : 'text-gray-500'}`}
            >
              Pasien
            </button>
            <button
              onClick={() => setRole('doctor')}
              className={`px-6 py-2 rounded-lg w-full ${role==='doctor' ? 'bg-white text-pink-500 font-medium' : 'text-gray-500'}`}
            >
              Dokter
            </button>
          </div>

          <br></br>

          <label className="text-sm text-gray-600">Nomor Whatsapp</label>
          <input className="w-full border border-gray-200 rounded-md px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300" placeholder="6288976453123" />

          <label className="text-sm text-gray-600">Kata Sandi</label>
          <input type="password" className="w-full border border-gray-200 rounded-md px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300" placeholder="*****" />

          <div className="flex items-center gap-3 mb-6">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember" className="text-sm text-gray-500">Ingat akun</label>
          </div>

          <Button href="#" className="w-full px-6 py-3 text-lg text-center rounded-lg">Submit →</Button>

          <p className="text-center text-sm text-gray-500 mt-4">Belum punya akun? <a className="text-pink-500" href="/register">Daftar sekarang</a></p>
        </div>
      </div>
    </div>
  );
}
