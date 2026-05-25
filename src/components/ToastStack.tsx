"use client";

import { useEffect } from "react";

export type Toast = {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
  durationMs?: number;
};

type ToastStackProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const toneStyles: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  useEffect(() => {
    const timers = toasts.map((toast) => {
      const duration = toast.durationMs ?? 3000;
      return setTimeout(() => onDismiss(toast.id), duration);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-[60] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${
            toneStyles[toast.tone || "info"]
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
