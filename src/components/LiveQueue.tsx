"use client";

import { useEffect, useMemo, useState } from "react";

type DriverStatus = "Available" | "Assigned" | "On route" | "Returning";

type LiveDriver = {
  id: string;
  full_name: string | null;
  status: DriverStatus;
  assigned_vehicle: string | null;
};

type PublicFeedResponse = {
  ok: boolean;
  drivers: LiveDriver[];
  error?: string;
};

const STATUS_TONE: Record<DriverStatus, string> = {
  "On route": "text-sky-600",
  Assigned: "text-amber-600",
  Returning: "text-amber-600",
  Available: "text-emerald-700",
};

export default function LiveQueue() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeed() {
      try {
        const response = await fetch("/api/public-feed", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as PublicFeedResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Unable to load feed");
        }

        setDrivers(data.drivers ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Unable to load live queue.");
      } finally {
        setLoading(false);
      }
    }

    loadFeed();

    const interval = setInterval(loadFeed, 180000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-14 rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)]"
          />
        ))}
      </div>
    );
  }

  if (error || drivers.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 text-xs text-[color:var(--muted)]">
        {error || "No drivers available yet."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drivers.slice(0, 3).map((driver) => {
        const tone = STATUS_TONE[driver.status] ?? "text-emerald-700";

        return (
          <div
            key={driver.id}
            className="grid grid-cols-1 gap-2 rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                {driver.full_name || "Driver"}
              </p>
              <p className={`text-xs font-semibold ${tone}`}>{driver.status}</p>
            </div>
            <span className="text-xs text-[color:var(--muted)] sm:text-right">
              Assigned vehicle: {driver.assigned_vehicle || "TBD"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
