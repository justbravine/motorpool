"use client";

import { Car, Shield, Truck } from "lucide-react";

const showcase = [
  {
    title: "GK Sedan",
    detail: "Executive transport for ministry travel",
    icon: Car,
  },
  {
    title: "GK SUV",
    detail: "Rapid response and field mobility",
    icon: Shield,
  },
  {
    title: "GK Utility",
    detail: "Cargo and logistics support",
    icon: Truck,
  },
];

export default function GkFleetShowcase() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
      {showcase.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="h-28 w-full rounded-xl bg-gradient-to-br from-[color:var(--panel-strong)] to-[color:var(--accent-soft)] border border-[color:var(--panel-edge)] flex items-center justify-center mb-4 group-hover:from-[color:var(--accent-soft)] group-hover:to-[color:var(--panel-strong)] transition-colors">
              <Icon size={40} className="text-[color:var(--muted)] group-hover:text-[color:var(--accent)] transition-colors" />
            </div>
            <div>
              <p className="text-base font-bold text-[color:var(--foreground)]">
                {item.title}
              </p>
              <p className="text-xs text-[color:var(--muted)] mt-1">{item.detail}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
