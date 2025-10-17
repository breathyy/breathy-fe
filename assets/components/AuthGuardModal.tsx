'use client';

import { useEffect, useState } from "react";

import Button from "./Button";

interface AuthGuardModalProps {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  autoRedirectMs?: number;
}

export default function AuthGuardModal({ open, title, message, actionLabel, onAction, autoRedirectMs = 2000 }: AuthGuardModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return undefined;
    }

    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const percentage = Math.min(100, Math.round((elapsed / autoRedirectMs) * 100));
      setProgress(percentage);
      if (elapsed >= autoRedirectMs) {
        window.clearInterval(interval);
        onAction();
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [open, autoRedirectMs, onAction]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-pink-100 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-400 text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 7v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
            <path d="M12 21c4.971 0 9-4.029 9-9s-4.029-9-9-9-9 4.029-9 9 4.029 9 9 9z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        <Button type="button" onClick={onAction} className="w-full justify-center" >
          {actionLabel}
        </Button>
        <p className="mt-3 text-xs text-gray-400">Mengalihkan dalam {Math.max(0, Math.ceil((autoRedirectMs * (100 - progress) / 100) / 1000))} detik…</p>
      </div>
    </div>
  );
}
