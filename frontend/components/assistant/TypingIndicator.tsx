"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  /** Optional custom contextual label (e.g., trip destination) */
  contextLabel?: string;
  /** Optional custom status steps */
  customSteps?: string[];
  /** Optional compact mode for smaller containers */
  compact?: boolean;
}

const DEFAULT_STEPS = [
  "Membaca & memahami pertanyaan Anda...",
  "Mencari dokumen rujukan di Knowledge Base...",
  "Menganalisis panduan & data perjalanan...",
  "Menyusun dan memvalidasi jawaban...",
  "KelanaAI sedang menyelesaikan respon...",
];

export function TypingIndicator({
  contextLabel,
  customSteps,
  compact = false,
}: TypingIndicatorProps) {
  const steps = customSteps && customSteps.length > 0 ? customSteps : DEFAULT_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Timer to track seconds and cycle status text smoothly
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Transition steps at 1.8s, 4s, 6.5s, 9s...
        if (next === 2 && steps.length > 1) setCurrentStepIndex(1);
        else if (next === 4 && steps.length > 2) setCurrentStepIndex(2);
        else if (next === 7 && steps.length > 3) setCurrentStepIndex(3);
        else if (next === 10 && steps.length > 4) setCurrentStepIndex(4);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex justify-start animate-fadeIn">
      <div
        className={`relative overflow-hidden rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white text-slate-900 shadow-sm transition-all duration-300 ${
          compact ? "max-w-full p-3.5 sm:p-4" : "max-w-[90%] sm:max-w-[80%] p-4 sm:p-5"
        }`}
      >
        {/* Header with Avatar & Live Pulse */}
        <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold tracking-tight text-[#750014]">
              KelanaAI
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            <svg
              className="h-3 w-3 animate-spin text-[#750014]"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8v8H4z"
                fill="currentColor"
              />
            </svg>
            <span>Sedang Mengetik ({elapsedSeconds}s)</span>
          </div>
        </div>

        {/* Typing Dots & Dynamic Status Description */}
        <div className="flex items-center gap-3 py-1">
          {/* 3 Animated Bouncing Wave Dots */}
          <div
            aria-label="AI sedang mengetik"
            className="flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-[#750014] animate-typing-1" />
            <span className="h-2 w-2 rounded-full bg-[#750014] animate-typing-2" />
            <span className="h-2 w-2 rounded-full bg-[#750014] animate-typing-3" />
          </div>

          {/* Dynamic Status Text */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 transition-all duration-300 sm:text-sm">
              {steps[currentStepIndex]}
            </p>
            {contextLabel && (
              <p className="truncate text-[11px] text-slate-400">
                Konteks: {contextLabel}
              </p>
            )}
          </div>
        </div>

        {/* Shimmering Progress Bar Effect at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-slate-100">
          <div className="h-full w-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
