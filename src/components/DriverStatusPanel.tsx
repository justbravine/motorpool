"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, User as UserIcon } from "lucide-react";
import { getTrips, getUsers } from "@/lib/mockDb";
import { Trip, User } from "@/lib/schemas";

const MAX_ROWS = 6;

type DriverStatus = "Available" | "Assigned" | "On route";

export default function DriverStatusPanel() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const [fetchedUsers, fetchedTrips] = await Promise.all([getUsers(), getTrips()]);
        if (!isActive) return;
        setDrivers(fetchedUsers.filter((user) => user.role === "Driver"));
        setTrips(fetchedTrips);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const statusByDriver = useMemo(() => {
    const map = new Map<string, DriverStatus>();
    drivers.forEach((driver) => map.set(driver.id, "Available"));

    trips.forEach((trip) => {
      if (!trip.driver_id) return;
      if (trip.status === "In Progress") {
        map.set(trip.driver_id, "On route");
        return;
      }
      if (trip.status === "Approved") {
        const current = map.get(trip.driver_id);
        if (current !== "On route") {
          map.set(trip.driver_id, "Assigned");
        }
      }
    });

    return map;
  }, [drivers, trips]);

  const counts = useMemo(() => {
    let available = 0;
    let assigned = 0;
    let onRoute = 0;

    drivers.forEach((driver) => {
      const status = statusByDriver.get(driver.id) ?? "Available";
      if (status === "Available") available += 1;
      if (status === "Assigned") assigned += 1;
      if (status === "On route") onRoute += 1;
    });

    return { available, assigned, onRoute };
  }, [drivers, statusByDriver]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel text-sm text-[color:var(--muted)]">
        Loading driver status...
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver status</p>
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Availability Watch</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <UserIcon size={14} /> {drivers.length} drivers
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">Available</p>
          <p className="text-sm font-semibold text-emerald-700">{counts.available}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">Assigned</p>
          <p className="text-sm font-semibold text-amber-600">{counts.assigned}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">On route</p>
          <p className="text-sm font-semibold text-sky-600">{counts.onRoute}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {drivers.slice(0, MAX_ROWS).map((driver) => {
          const status = statusByDriver.get(driver.id) ?? "Available";
          const tone =
            status === "On route"
              ? "text-sky-600"
              : status === "Assigned"
              ? "text-amber-600"
              : "text-emerald-700";

          return (
            <div
              key={driver.id}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[color:var(--accent-soft)] text-emerald-700 flex items-center justify-center text-xs font-semibold">
                  {driver.full_name?.charAt(0) || "D"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">{driver.full_name || "Driver"}</p>
                  <p className={`text-xs font-semibold ${tone}`}>{status}</p>
                </div>
              </div>
              <span className="text-xs text-[color:var(--muted)] flex items-center gap-1">
                {status === "On route" ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}
                {status === "On route" ? "Active" : "Ready"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
