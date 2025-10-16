"use client";

import React from "react";
import Image from "next/image";
import logo from "../../assets/logo/logo.png";

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="flex h-[calc(110vh-80px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-100 flex flex-col">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                <span className="inline-block w-4 h-4 bg-pink-500 rounded mr-2"></span>
                Chat baru
              </h2>
              <button className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Riwayat Investigasi</h3>
              <div className="space-y-1">
                <div className="p-3 rounded-lg bg-pink-50 border-l-4 border-pink-500">
                  <div className="text-sm font-medium text-gray-900">Dalam Investigasi</div>
                  <div className="text-xs text-gray-500 mt-1">25 September 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">19 September 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">15 Agustus 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Sedang</div>
                  <div className="text-xs text-gray-400 mt-1">1 Agustus 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Sedang</div>
                  <div className="text-xs text-gray-400 mt-1">29 Juli 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Parah</div>
                  <div className="text-xs text-gray-400 mt-1">28 Juli 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">8 Juni 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Sedang</div>
                  <div className="text-xs text-gray-400 mt-1">17 Maret 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">5 Februari 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">16 Januari 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Ringan</div>
                  <div className="text-xs text-gray-400 mt-1">10 Januari 2025</div>
                </div>
                <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm text-gray-700">Kasus Sedang</div>
                  <div className="text-xs text-gray-400 mt-1">5 Januari 2025</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col bg-white">
          {/* Messages area */}
          <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-2">
                Halo, Budi Santoso
              </h1>
              <p className="text-gray-600 flex items-center justify-center gap-2">
                Bagaimana <Image src={logo} alt="Breathy Logo" width={80} height={20} className="inline-block" /> bisa membantumu hari ini?
              </p>
            </div>
          </div>

          {/* Input area */}
          <div className="p-6 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <input 
                  type="text" 
                  placeholder="Tulis pertanyaanmu disini..." 
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
                <button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full p-2">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
