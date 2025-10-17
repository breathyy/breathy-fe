import React from "react";

interface TypingIndicatorProps {
  label?: string;
}

export default function TypingIndicator({ label = "Breathy sedang mengetik" }: TypingIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <span className="flex gap-1">
        <span className="block h-2 w-2 animate-pulse rounded-full bg-pink-400" style={{ animationDelay: "0ms" }} />
        <span className="block h-2 w-2 animate-pulse rounded-full bg-pink-400" style={{ animationDelay: "150ms" }} />
        <span className="block h-2 w-2 animate-pulse rounded-full bg-pink-400" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}
