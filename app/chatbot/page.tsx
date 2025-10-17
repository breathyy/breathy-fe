"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AuthGuardModal, Button, TypingIndicator } from "@/assets/assets";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
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

interface ResetChatResponse {
  caseId: string;
  caseStatus: CaseStatus;
  clearedMessages: number;
  clearedSymptoms: number;
  clearedTasks: number;
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
  const metaTimestampRaw = entry.meta && typeof entry.meta === "object" ? (entry.meta as { timestamp?: string }).timestamp : undefined;
  const metaTimestamp = typeof metaTimestampRaw === "string" ? new Date(metaTimestampRaw) : null;
  const created = new Date(entry.createdAt);
  const preferredTimestamp = metaTimestamp && !Number.isNaN(metaTimestamp.getTime()) ? metaTimestamp : created;
  const timestamp = Number.isNaN(preferredTimestamp.getTime()) ? new Date() : preferredTimestamp;

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
  const { patientSession, doctorSession, loading, setPatientCaseStatus, logoutPatient } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [blobBaseUrl] = useState(() => getBlobPublicBaseUrl());
  const [showGuard, setShowGuard] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatNotice, setChatNotice] = useState<string | null>(null);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isWaitingForBot, setIsWaitingForBot] = useState(false);
  const isWaitingForBotRef = useRef(false);
  const lastBotMessageIdRef = useRef<string | null>(null);

  const setWaitingForBot = useCallback((value: boolean) => {
    isWaitingForBotRef.current = value;
    setIsWaitingForBot(value);
  }, []);
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

  useEffect(() => {
    if (!chatNotice) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setChatNotice(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [chatNotice]);

  const fetchMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      const shouldToggleLoading = !options?.silent;
      if (!caseId || !token) {
        setMessages([]);
        setWaitingForBot(false);
        lastBotMessageIdRef.current = null;
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
          .sort((a, b) => {
            const delta = a.timestamp.getTime() - b.timestamp.getTime();
            if (delta !== 0) {
              return delta;
            }
            return a.id.localeCompare(b.id);
          });

        const latestBotMessage = [...formatted].reverse().find((message) => message.sender === "bot");
        if (latestBotMessage) {
          if (lastBotMessageIdRef.current !== latestBotMessage.id) {
            lastBotMessageIdRef.current = latestBotMessage.id;
            if (isWaitingForBotRef.current) {
              setWaitingForBot(false);
            }
          }
        } else {
          lastBotMessageIdRef.current = null;
        }

        setMessages(formatted);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setChatError("Sesi kamu sudah berakhir. Silakan masuk kembali.");
          logoutPatient();
          setShowGuard(true);
        } else {
          const message = error instanceof Error ? error.message : "Gagal memuat riwayat chat";
          setChatError(message);
        }
      } finally {
        if (shouldToggleLoading) {
          setLoadingMessages(false);
        }
      }
    },
  [caseId, token, blobBaseUrl, logoutPatient, setWaitingForBot]
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

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleResetChat = useCallback(async () => {
    if (!caseId || !token) {
      setChatError("Sesi pasien tidak valid untuk reset.");
      return;
    }

    const confirmed = window.confirm("Mulai percakapan baru? Riwayat chat sebelumnya akan dibersihkan.");
    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    setChatError(null);

    try {
      const result = await apiFetch<ResetChatResponse>(`/cases/${caseId}/chat/reset`, {
        method: "POST",
        token,
      });

      resetFileInput();
      setInputText("");
      setMessages([]);
      setWaitingForBot(false);
      await fetchMessages({ silent: true });
      setPatientCaseStatus(result.caseStatus ?? "IN_CHATBOT");
      setChatNotice("Percakapan berhasil direset. Kamu bisa mulai cerita lagi kapan saja.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setChatError("Sesi kamu sudah berakhir. Silakan masuk kembali.");
        logoutPatient();
        router.replace("/login");
      } else {
        const message = error instanceof ApiError
          ? error.body?.message || error.message
          : "Gagal mereset percakapan. Coba lagi sebentar lagi.";
        setChatError(message);
      }
    } finally {
      setIsResetting(false);
    }
  }, [caseId, token, fetchMessages, logoutPatient, resetFileInput, router, setPatientCaseStatus, setWaitingForBot]);

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
  setWaitingForBot(true);
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
      setWaitingForBot(false);
      if (error instanceof ApiError && error.status === 401) {
        setChatError("Sesi kamu sudah berakhir. Silakan masuk kembali.");
        logoutPatient();
        setShowGuard(true);
      } else {
        const message = error instanceof Error ? error.message : "Gagal mengirim media";
        setChatError(message);
      }
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
  setWaitingForBot(true);
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
      setWaitingForBot(false);
      if (error instanceof ApiError && error.status === 401) {
        setChatError("Sesi kamu sudah berakhir. Silakan masuk kembali.");
        logoutPatient();
        setShowGuard(true);
      } else {
        const message = error instanceof Error ? error.message : "Gagal mengirim pesan";
        setChatError(message);
      }
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

  type HistoryItem = {
    id: string;
    title: string;
    subtitle: string;
    highlight?: boolean;
    description?: string;
    status?: "active" | "completed" | string;
    interactive?: boolean;
  };

  const defaultHistory: HistoryItem[] = [
    { id: "default-1", title: "Dalam Investigasi", subtitle: "25 September 2025", highlight: true },
    { id: "default-2", title: "Kasus Ringan", subtitle: "19 September 2025" },
    { id: "default-3", title: "Kasus Ringan", subtitle: "15 Agustus 2025" },
    { id: "default-4", title: "Kasus Sedang", subtitle: "1 Agustus 2025" },
    { id: "default-5", title: "Kasus Sedang", subtitle: "29 Juli 2025" },
    { id: "default-6", title: "Kasus Parah", subtitle: "28 Juli 2025" },
    { id: "default-7", title: "Kasus Ringan", subtitle: "8 Juni 2025" },
    { id: "default-8", title: "Kasus Sedang", subtitle: "17 Maret 2025" },
    { id: "default-9", title: "Kasus Ringan", subtitle: "5 Februari 2025" },
    { id: "default-10", title: "Kasus Ringan", subtitle: "16 Januari 2025" },
    { id: "default-11", title: "Kasus Ringan", subtitle: "10 Januari 2025" },
    { id: "default-12", title: "Kasus Sedang", subtitle: "5 Januari 2025" }
  ];

  const historyItems: HistoryItem[] = chatSessions.length > 0
    ? chatSessions.map((session) => ({
        id: session.id,
        title: session.title,
        subtitle: formatSessionDate(session.timestamp),
        description: session.preview,
        status: session.status,
        interactive: true
      }))
    : defaultHistory;

  const renderHistoryList = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Riwayat Investigasi</h3>
          {chatSessions.length > 0 && (
            <button
              onClick={handleRefresh}
              className="text-xs font-medium text-pink-600 hover:text-pink-700 disabled:text-gray-400"
              disabled={loadingMessages}
            >
              
            </button>
          )}
        </div>
        <div className="space-y-1">
          {historyItems.map((item, index) => {
            const isInteractive = Boolean((item as { interactive?: boolean }).interactive);
            const isActive = chatSessions.length > 0 ? currentChatId === item.id : index === 0 || item.highlight;
            const baseClasses = isInteractive
              ? "p-3 rounded-lg transition-colors cursor-pointer"
              : "p-3 rounded-lg";
            const stateClasses = isActive
              ? "bg-pink-50 border-l-4 border-pink-500"
              : "hover:bg-gray-50";
            const description = (item as { description?: string }).description;
            const statusTag = (item as { status?: "active" | "completed" | string }).status;

            return (
              <div
                key={item.id}
                className={`${baseClasses} ${stateClasses}`}
                onClick={isInteractive ? () => {
                  handleSessionClick(item.id);
                  setIsSidebarOpen(false);
                } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  {statusTag && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      statusTag === "active"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {statusTag === "active" ? "Aktif" : "Selesai"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                {description && (
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">{description}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => {
    if (loadingMessages) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (chatError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-600 gap-2">
          <p className="text-sm">{chatError}</p>
          <button
            onClick={() => fetchMessages()}
            className="px-4 py-1.5 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    if (messages.length === 0) {
      const greetingName = "Sahabat Breathy";
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-2">
              Halo, {greetingName}
            </h1>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              Bagaimana
              <Image src={logo} alt="Breathy Logo" width={80} height={20} className="inline-block" />
              bisa membantumu hari ini?
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow ${
                  message.sender === "user"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-800"
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
                      <p className="text-xs italic text-gray-200">Lampiran tidak tersedia.</p>
                    )}
                    {message.text && message.text.trim().length > 0 && (
                      <p className="leading-relaxed whitespace-pre-line">{message.text}</p>
                    )}
                    {message.pending && (
                      <p className="text-xs italic text-gray-200">Sedang mengunggah...</p>
                    )}
                    {!message.pending && typeof message.media?.analysis?.severityImageScore === "number" && (
                      <p className="text-xs text-gray-200">
                        Skor gambar: {message.media.analysis.severityImageScore?.toFixed(2)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="leading-relaxed whitespace-pre-line">{message.text}</p>
                )}
                <p className={`text-[11px] mt-2 ${message.sender === "user" ? "text-pink-100" : "text-gray-500"}`}>
                  {formatMessageTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {isWaitingForBot && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow bg-gray-100 text-gray-800 flex items-center gap-3">
                <TypingIndicator />
                <span className="text-xs text-gray-500">Breathy sedang mengetik...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(110vh-80px)]">
        <aside className="hidden md:flex w-80 bg-gray-100 border-r border-gray-200 flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <span className="inline-block w-4 h-4 bg-pink-500 rounded mr-2" />
                Chat baru
              </h2>
              <button
                className="inline-flex items-center justify-center text-sm font-medium text-pink-600 hover:text-pink-700 disabled:text-pink-300"
                type="button"
                onClick={handleResetChat}
                disabled={isResetting || !caseId || !token}
              >
                {isResetting ? 'Mereset...' : 'Reset chat'}
              </button>
            </div>
          </div>
          {renderHistoryList()}
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={toggleSidebar} aria-hidden="true" />
            <aside className="relative z-50 w-72 bg-gray-100 border-r border-gray-200 flex flex-col h-full">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    <span className="inline-block w-4 h-4 bg-pink-500 rounded mr-2" />
                    Chat baru
                  </h2>
                  <button className="text-gray-400 hover:text-gray-600" type="button" onClick={toggleSidebar}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 11-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 11-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <button
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-pink-600 hover:border-pink-300 hover:text-pink-700 disabled:border-gray-200 disabled:text-gray-300"
                  type="button"
                  onClick={() => {
                    handleResetChat();
                    toggleSidebar();
                  }}
                  disabled={isResetting || !caseId || !token}
                >
                  {isResetting ? 'Mereset...' : 'Reset chat'}
                </button>
              </div>
              {renderHistoryList()}
            </aside>
          </div>
        )}

        <main className="flex-1 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between md:hidden">
            <div>
              <p className="text-sm font-semibold text-gray-900">Breathy Chatbot</p>
              <p className="text-xs text-gray-500">{statusLabel[status] ?? statusLabel[fallbackStatus]}</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-pink-500 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              {isSidebarOpen ? "Tutup" : "Riwayat"}
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
              {renderMessages()}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                <button
                  type="button"
                  onClick={handleAttachmentClick}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                  disabled={isUploadingMedia || !caseId || !token}
                  aria-label="Lampirkan media"
                  title="Lampirkan media"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Lampirkan</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMediaSelected} />
                <input
                  type="text"
                  placeholder="Tulis pertanyaanmu di sini..."
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={handleSendTextMessage}
                  disabled={!inputText.trim() || isSendingText || isUploadingMedia}
                  className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-full p-2 flex items-center justify-center"
                  aria-label="Kirim pesan"
                >
                  {isSendingText ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
              {chatError && !loadingMessages && messages.length > 0 && (
                <p className="mt-2 text-xs text-red-500">Sistem mengalami gangguan: {chatError}</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}