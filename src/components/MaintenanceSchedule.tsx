"use client";

import { CalendarClock, Wrench } from "lucide-react";

const schedule = [
  {
    vehicle: "GK-21A",
    task: "Quarterly service + filters",
    date: "May 24, 2026",
    depot: "Central Depot",
  },
  {
    vehicle: "GK-18D",
    task: "Brake inspection",
    date: "May 28, 2026",
    depot: "North Hub",
  },
  {
    vehicle: "GK-07B",
    task: "Tire rotation",
    date: "May 31, 2026",
    depot: "East Annex",
  },
];

export default function MaintenanceSchedule() {
  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[color:var(--panel-edge)] pb-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] font-semibold">
            Maintenance
          </p>
          <h3 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">
            Upcoming Schedule
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
          <Wrench size={14} /> Next 7 days
        </div>
      </div>
      <div className="space-y-3">
        {schedule.map((item) => (
          <div
            key={`${item.vehicle}-${item.date}`}
            className="rounded-2xl border border-[color:var(--panel-edge)] p-4 bg-[color:var(--panel-strong)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {item.vehicle}
                </p>
                <p className="text-xs text-[color:var(--muted)]">{item.task}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[color:var(--foreground)] flex items-center gap-2 justify-end">
                  <CalendarClock size={14} className="text-amber-500" /> {item.date}
                </p>
                <p className="text-xs text-[color:var(--muted)]">{item.depot}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
