"use client";

import React from "react";
import Image from "next/image";
import { Navbar, DateChip } from "../../assets/assets";
import Tentang from "../../assets/images/tentang.png";
import Mascot from "../../assets/images/breathy/breathy2.png";

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with case info */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full px-6 py-2 shadow-sm border border-[#BF3B6C] mb-4">
            <span className="text-gray-700 font-medium">Last Update - 19 September 2025</span>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Kasus Ringan</h1>
              <p className="text-gray-700 leading-relaxed">
                Dalam kasus ringan, Breathy akan <span className="font-semibold text-pink-500">memantau penyembuhanmu dalam 7 hari</span>. 
                Setelah 7 hari kamu bisa kembali ke ruang percakapan untuk melaporkan kondisimu. Berdasarkan saran dokter, 
                kamu perlu <span className="font-semibold text-pink-500">minum banyak air</span> untuk mengencerkan dahak dan 
                <span className="font-semibold text-pink-500"> istirahat yang cukup</span> dengan tidur minimal 6 jam dalam sehari.
              </p>
            </div>
          </div>
        </div>

        {/* Date chips */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {/* Top row - 4 chips */}
          <div className="flex gap-3">
            <DateChip date="14 Oktober 2025" />
            <DateChip date="15 Oktober 2025" />
            <DateChip date="16 Oktober 2025" />
            <DateChip date="17 Oktober 2025" />
          </div>
          
          {/* Bottom row - 3 chips */}
          <div className="flex gap-3">
            <DateChip date="18 Oktober 2025" />
            <DateChip date="19 Oktober 2025" />
            <DateChip date="20 Oktober 2025" />
          </div>
        </div>

        {/* Recommendation cards */}
        <div className="">
          {/* Sleep card */}
          <div className="relative rounded-2xl overflow-hidden justify-center flex mb-6">
            <Image 
              src={Tentang}
              alt="Sleep recommendation" 
              width={400} 
              height={300}
              className="w-3/4 h-full object-cover"
            />

          </div>
        </div>
      </div>
    </div>
  );
}
