"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AuthGuardModal, Button } from "@/assets/assets";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { getBlobPublicBaseUrl } from "@/lib/config";
import type { CaseStatus } from "@/lib/types";
import logo from "../../assets/logo/logo.png";

interface ApiMediaDownload {
  downloadUrl?: string | null;
  expiresAt?: string | null;
}

interface ApiMediaPayload {
  download?: string | ApiMediaDownload | null;
  blobName?: string | null;
  analysis?: {
    severityImageScore?: number | null;
    visionRanAt?: string | null;
    markers?: Record<string, unknown> | null;
    qualityMetrics?: Record<string, unknown> | null;
  } | null;
}

interface ApiChatMessage {
  id: string;
  caseId: string;
  type: "text" | "image";
  content?: string | null;
  blobRef?: string | null;
  meta?: Record<string, unknown> | null;
  media?: ApiMediaPayload | null;
  createdAt: string;
}

interface MessageMediaAnalysis {
  severityImageScore?: number | null;
  visionRanAt?: string | null;
  markers?: Record<string, unknown>;
  qualityMetrics?: Record<string, unknown>;
}

interface MessageMedia {
  downloadUrl: string | null;
  expiresAt?: string | null;
  blobName?: string | null;
  analysis?: MessageMediaAnalysis | null;
  localObjectUrl?: string | null;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  type: "text" | "image";
  media?: MessageMedia;
  pending?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  status: "active" | "completed";
  preview: string;
}

interface UploadUrlResponse {
  blobName: string;
  uploadUrl: string | null;
  expiresAt: string;
  contentType?: string | null;
  fileSizeBytes?: number | null;
}

const statusLabel: Record<CaseStatus, string> = {
  IN_CHATBOT: "Dalam Investigasi",
  WAITING_DOCTOR: "Menunggu Dokter",
  MILD: "Klasifikasi: Ringan",
  MODERATE: "Klasifikasi: Sedang",
  SEVERE: "Klasifikasi: Berat",
};

const statusSessionState: Record<CaseStatus, "active" | "completed"> = {
  IN_CHATBOT: "active",
  WAITING_DOCTOR: "active",
  MILD: "completed",
  MODERATE: "completed",
  SEVERE: "completed",
};

const fallbackStatus: CaseStatus = "IN_CHATBOT";
const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const extractDirection = (meta?: Record<string, unknown> | null): string | undefined => {
  if (!meta || typeof meta !== "object") {
    return undefined;
  }
  const value = (meta as { direction?: unknown }).direction;
  return typeof value === "string" ? value : undefined;
};

const mapApiMessageToUi = (entry: ApiChatMessage, blobBaseUrl: string | null): Message => {
  const direction = extractDirection(entry.meta ?? undefined);
  const rawText = typeof entry.content === "string" ? entry.content : null;
  const text = rawText && rawText.trim().length > 0 ? rawText.trim() : entry.type === "image" ? "Media terkirim" : "";
  const created = new Date(entry.createdAt);
  const timestamp = Number.isNaN(created.getTime()) ? new Date() : created;

  let media: MessageMedia | undefined;
  if (entry.type === "image") {
    const downloadRef = entry.media?.download ?? null;
    let downloadUrl: string | null = null;
    let expiresAt: string | null | undefined;
    if (typeof downloadRef === "string") {
      downloadUrl = downloadRef;
    } else if (downloadRef && typeof downloadRef === "object") {
      const parsed = downloadRef as ApiMediaDownload;
      downloadUrl = parsed.downloadUrl ?? null;
      expiresAt = parsed.expiresAt ?? null;
    }
    const fallbackBlobRef = entry.media?.blobName ?? entry.blobRef ?? null;
    if (!downloadUrl && blobBaseUrl && fallbackBlobRef) {
      const sanitizedBlob = fallbackBlobRef.replace(/^\/+/, "");
      downloadUrl = `${blobBaseUrl}/${sanitizedBlob}`;
    }
    const analysisPayload = entry.media?.analysis;
    const analysis = analysisPayload && typeof analysisPayload === "object" ? (analysisPayload as MessageMediaAnalysis) : null;
    media = {
      downloadUrl,
      expiresAt: expiresAt ?? undefined,
      blobName: fallbackBlobRef,
      analysis,
      localObjectUrl: null,
    };
  }

  return {
    id: entry.id,
    text,
    sender: direction === "OUTBOUND" ? "bot" : "user",
    timestamp,
    type: entry.type,
    media,
  };
};

export default function ChatbotPage() {
  const router = useRouter();
  const { patientSession, doctorSession, loading, setPatientCaseStatus } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [blobBaseUrl] = useState(() => getBlobPublicBaseUrl());
  const [showGuard, setShowGuard] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const hasPatientSession = Boolean(patientSession);
  const hasDoctorSession = Boolean(doctorSession);
  const hasAccess = hasPatientSession || hasDoctorSession;

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

  const caseId = patientSession?.caseId ?? null;
  const token = patientSession?.token ?? null;
  const status = patientSession?.caseStatus ?? fallbackStatus;

  useEffect(() => {
    if (caseId) {
      setCurrentChatId(caseId);
    } else {
      setCurrentChatId(null);
    }
  }, [caseId]);

  const fetchMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      const shouldToggleLoading = !options?.silent;
      if (!caseId || !token) {
        setMessages([]);
        if (shouldToggleLoading) {
          setLoadingMessages(false);
        }
        return;
      }

      if (shouldToggleLoading) {
        setLoadingMessages(true);
      }
      setChatError(null);

      try {
        const data = await apiFetch<ApiChatMessage[]>(`/cases/${caseId}/chat`, {
          method: "GET",
          token,
        });

        const formatted = data
          .map((item) => mapApiMessageToUi(item, blobBaseUrl))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages(formatted);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat riwayat chat";
        setChatError(message);
      } finally {
        if (shouldToggleLoading) {
          setLoadingMessages(false);
        }
      }
    },
    [caseId, token, blobBaseUrl]
  );

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!caseId || !token) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    fetchMessages();
  }, [caseId, token, loading, fetchMessages]);

  const chatSession = useMemo<ChatSession | null>(() => {
    if (!caseId) {
      return null;
    }

    const latestMessage = messages[messages.length - 1];
    const storedAt = patientSession?.storedAt ? new Date(patientSession.storedAt) : new Date();
    const fallbackDate = Number.isNaN(storedAt.getTime()) ? new Date() : storedAt;

    return {
      id: caseId,
      title: statusLabel[status] ?? statusLabel[fallbackStatus],
      timestamp: latestMessage?.timestamp ?? fallbackDate,
      status: statusSessionState[status] ?? statusSessionState[fallbackStatus],
      preview: latestMessage?.text ?? "Belum ada percakapan",
    };
  }, [caseId, messages, patientSession?.storedAt, status]);

  const chatSessions = chatSession ? [chatSession] : [];

  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
        <AuthGuardModal
          open={showGuard}
          title="Perlu Masuk Dulu"
          message="Masuk ke akun Breathy kamu untuk mengakses Chatbot."
          actionLabel="Ke Halaman Masuk"
          onAction={handleRedirectToLogin}
          autoRedirectMs={3000}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E0446A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasPatientSession && hasDoctorSession) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center text-center px-6">
        <Image src={logo} alt="Breathy Logo" width={120} height={120} className="rounded-full" />
        <h1 className="mt-6 text-2xl font-semibold text-gray-900">Chatbot Memerlukan Akun Pasien</h1>
        <p className="mt-3 text-sm text-gray-600 max-w-md">
          Kamu saat ini masuk sebagai dokter. Untuk mencoba alur chatbot, silakan masuk menggunakan akun pasien demo atau buat akun baru terlebih dahulu.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Button href="/login">Masuk sebagai Pasien</Button>
          <Button href="/dashboard" className="sm:ml-0">Kembali ke Dashboard Dokter</Button>
        </div>
      </div>
    );
  }

  const handleSessionClick = (sessionId: string) => {
    setCurrentChatId(sessionId);
  };

  const handleRefresh = () => {
    if (!loadingMessages) {
      fetchMessages();
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAttachmentClick = () => {
    if (!caseId || !token) {
      setChatError("Sesi pasien tidak valid untuk mengunggah media.");
      return;
    }
    if (isUploadingMedia) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleMediaSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    resetFileInput();
    if (!file) {
      return;
    }

    if (!caseId || !token) {
      setChatError("Sesi pasien tidak valid untuk mengunggah media.");
      return;
    }

    if (isUploadingMedia) {
      return;
    }

    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      const limitMb = (MAX_MEDIA_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      setChatError(`Ukuran file maksimal ${limitMb}MB.`);
      return;
    }

    const caption = inputText.trim();
    const optimisticId = `media-${Date.now()}`;
    const objectUrl = URL.createObjectURL(file);
    const optimisticMessage: Message = {
      id: optimisticId,
      text: caption.length > 0 ? caption : "Mengunggah media...",
      sender: "user",
      timestamp: new Date(),
      type: "image",
      media: {
        downloadUrl: objectUrl,
        blobName: null,
        analysis: null,
        expiresAt: undefined,
        localObjectUrl: objectUrl,
      },
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setIsUploadingMedia(true);
    setChatError(null);

    try {
      const uploadInfo = await apiFetch<UploadUrlResponse>(`/cases/${caseId}/chat/upload-url`, {
        method: "POST",
        token,
        json: {
          contentType: file.type || "application/octet-stream",
          fileSizeBytes: file.size,
        },
      });

      if (!uploadInfo?.blobName) {
        throw new Error("Gagal menyiapkan unggahan media");
      }

      if (uploadInfo.uploadUrl) {
        const uploadResponse = await fetch(uploadInfo.uploadUrl, {
          method: "PUT",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error("Gagal mengunggah media ke penyimpanan");
        }
      }

      const postResponse = await apiFetch<{ caseId: string; chatMessageId: string; caseStatus: CaseStatus }>(
        `/cases/${caseId}/chat`,
        {
          method: "POST",
          token,
          json: {
            type: "image",
            blobName: uploadInfo.blobName,
            caption: caption.length > 0 ? caption : undefined,
            contentType: file.type || undefined,
            fileSizeBytes: file.size,
          },
        }
      );

      if (postResponse?.caseStatus) {
        setPatientCaseStatus(postResponse.caseStatus);
      }

      await fetchMessages({ silent: true });
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      const message = error instanceof Error ? error.message : "Gagal mengirim media";
      setChatError(message);
    } finally {
      setIsUploadingMedia(false);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleSendTextMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !caseId || !token || isSendingText) {
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setIsSendingText(true);
    setChatError(null);

    try {
      const response = await apiFetch<{ caseId: string; chatMessageId: string; caseStatus: CaseStatus }>(
        `/cases/${caseId}/chat`,
        {
          method: "POST",
          token,
          json: { message: trimmed },
        }
      );

      if (response?.caseStatus) {
        setPatientCaseStatus(response.caseStatus);
      }

      await fetchMessages({ silent: true });
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      const message = error instanceof Error ? error.message : "Gagal mengirim pesan";
      setChatError(message);
    } finally {
      setIsSendingText(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendTextMessage();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const formatMessageTime = (timestamp: Date) =>
    timestamp.toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatSessionDate = (timestamp: Date) =>
    timestamp.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-[#FFF5F7]">
      <header className="bg-white shadow px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="Breathy Logo" width={40} height={40} />
            <div>
              <h1 className="text-xl font-semibold text-[#1F2937]">Breathy Care Assistant</h1>
              <p className="text-sm text-[#6B7280]">Kelola percakapan Anda dengan dokter secara real-time</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#E0446A] hover:bg-[#C53757] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E0446A]"
          >
            {isSidebarOpen ? "Tutup" : "Chat"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside
            className={`md:col-span-4 lg:col-span-3 space-y-4 ${isSidebarOpen ? "block" : "hidden md:block"}`}
          >
            <div className="bg-white rounded-3xl shadow-sm border border-[#FFE1E8] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Percakapan Terakhir</h2>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#E0446A] hover:bg-[#C53757] disabled:opacity-60"
                  disabled={loadingMessages}
                >
                  Segarkan
                </button>
              </div>

              <div className="space-y-4">
                {chatSessions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-dashed border-[#F8B1C1] text-sm text-[#6B7280]">
                    Belum ada percakapan aktif.
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border hover:border-[#F8B1C1] ${
                        currentChatId === session.id
                          ? "bg-[#FFE7ED] border-[#E0446A]"
                          : "bg-white border-transparent shadow-sm"
                      }`}
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-[#1F2937]">{session.title}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === "active"
                              ? "bg-[#FFE1E8] text-[#E0446A]"
                              : "bg-[#E5E7EB] text-[#4B5563]"
                          }`}
                        >
                          {session.status === "active" ? "Aktif" : "Selesai"}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B7280] mb-1">{session.preview}</p>
                      <p className="text-xs text-[#9CA3AF]">{formatSessionDate(session.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-[#FFE1E8]">
              <div className="px-6 py-4 border-b border-[#FFE1E8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#FFE1E8] p-3 text-[#E0446A]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 11a3 3 0 100-6 3 3 0 000 6z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 20v-1a7 7 0 10-14 0v1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2937]">
                      {statusLabel[status] ?? statusLabel[fallbackStatus]}
                    </h3>
                    <p className="text-sm text-[#6B7280]">Status kasus akan diperbarui setelah dokter meninjau</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 h-[480px] overflow-y-auto bg-white space-y-6">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-10 h-10 border-4 border-[#E0446A] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : chatError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#6B7280] gap-2">
                    <p className="text-sm">{chatError}</p>
                    <button
                      onClick={() => fetchMessages()}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-[#E0446A] rounded-md hover:bg-[#C53757]"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-[#6B7280]">
                    <div>
                      <p className="text-lg font-semibold text-[#1F2937] mb-2">
                        Selamat datang di Breathy Care Assistant!
                      </p>
                      <p className="text-sm">
                        Mulai percakapan dengan menyampaikan keluhan atau pertanyaan seputar kondisi pernapasanmu.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.sender === "user"
                            ? "bg-[#E0446A] text-white rounded-br-none"
                            : "bg-[#F3F4F6] text-[#1F2937] rounded-bl-none"
                        }`}
                      >
                        {message.type === "image" ? (
                          <div className="space-y-2">
                            {message.media?.downloadUrl ? (
                              <div className="overflow-hidden rounded-xl bg-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={message.media.downloadUrl}
                                  alt={message.text && message.text.trim().length > 0 ? message.text : "Lampiran Breathy"}
                                  className="w-full max-h-64 object-contain"
                                />
                              </div>
                            ) : (
                              <p className={`text-xs italic ${message.sender === "user" ? "text-[#FBD0D9]" : "text-[#6B7280]"}`}>
                                Lampiran tidak tersedia.
                              </p>
                            )}
                            {message.text && message.text.trim().length > 0 && (
                              <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                            )}
                            {message.pending && (
                              <p className={`text-xs italic ${message.sender === "user" ? "text-[#FBD0D9]" : "text-[#6B7280]"}`}>
                                Sedang mengunggah...
                              </p>
                            )}
                            {!message.pending &&
                              typeof message.media?.analysis?.severityImageScore === "number" && (
                                <p className={`text-xs ${message.sender === "user" ? "text-[#FBD0D9]" : "text-[#6B7280]"}`}>
                                  Skor gambar: {message.media.analysis.severityImageScore?.toFixed(2)}
                                </p>
                              )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                        )}
                        <p
                          className={`text-xs mt-2 ${
                            message.sender === "user" ? "text-[#FBD0D9]" : "text-[#9CA3AF]"
                          }`}
                        >
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-4 bg-white border-t border-[#FFE1E8]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAttachmentClick}
                    className="flex items-center justify-center w-10 h-10 bg-[#FFE7ED] text-[#E0446A] rounded-full hover:bg-[#FCD1DC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E0446A] disabled:opacity-60 disabled:hover:bg-[#FFE7ED]"
                    disabled={isUploadingMedia || !caseId || !token}
                    aria-label="Lampirkan media"
                    title="Lampirkan media"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        d="M8.5 6h3a2.5 2.5 0 010 5H9a1 1 0 010-2h2.3a.5.5 0 000-1H8.5a2.5 2.5 0 010-5h3a5.5 5.5 0 110 11H9a1 1 0 110-2h2.5a3.5 3.5 0 000-7h-3a.5.5 0 000 1z"
                      />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMediaSelected}
                  />
                  <input
                    type="text"
                    placeholder="Tulis pesanmu di sini..."
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E0446A]"
                  />
                  <button
                    type="button"
                    onClick={handleSendTextMessage}
                    disabled={!inputText.trim() || isSendingText || isUploadingMedia}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-[#E0446A] hover:bg-[#C53757] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E0446A] disabled:opacity-60"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isSendingText ? "Mengirim..." : "Kirim Pesan"}
                  </button>
                </div>
                {chatError && !loadingMessages && (
                  <p className="mt-2 text-xs text-[#DC2626]">Sistem mengalami gangguan: {chatError}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}