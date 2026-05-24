"use client";

import { Activity, Radar, Wrench } from "lucide-react";

const highlights = [
  {
    label: "Fleet uptime",
    value: "94.6%",
    detail: "+1.4% this week",
    icon: Activity,
    accent: "text-emerald-600",
  },
  {
    label: "Active trips",
    value: "128",
    detail: "17 starting soon",
    icon: Radar,
    accent: "text-sky-600",
  },
  {
    label: "Maintenance queue",
    value: "9",
    detail: "3 urgent",
    icon: Wrench,
    accent: "text-amber-600",
  },
];

export default function FleetHighlights() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {highlights.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] font-semibold">
                {item.label}
              </p>
              <div className={`h-9 w-9 rounded-full bg-[color:var(--accent-soft)] flex items-center justify-center ${item.accent}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-semibold text-[color:var(--foreground)] font-display">
                {item.value}
              </p>
              <p className="text-sm text-[color:var(--muted)]">{item.detail}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
