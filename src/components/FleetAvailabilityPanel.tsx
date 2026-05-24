"use client";

import { useEffect, useMemo, useState } from "react";
import { CarFront, AlertTriangle } from "lucide-react";
import { getVehicles } from "@/lib/mockDb";
import { Vehicle } from "@/lib/schemas";

const MAX_ROWS = 6;

export default function FleetAvailabilityPanel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadVehicles() {
      try {
        const data = await getVehicles();
        if (!isActive) return;
        setVehicles(data);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadVehicles();

    return () => {
      isActive = false;
    };
  }, []);

  const counts = useMemo(() => {
    let available = 0;
    let inTransit = 0;
    let needsMaintenance = 0;

    vehicles.forEach((vehicle) => {
      if (vehicle.status === "Available") available += 1;
      if (vehicle.status === "In Transit") inTransit += 1;
      if (vehicle.status === "Needs Maintenance") needsMaintenance += 1;
    });

    return { available, inTransit, needsMaintenance };
  }, [vehicles]);

  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "Available").slice(0, MAX_ROWS),
    [vehicles]
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel text-sm text-[color:var(--muted)]">
        Loading fleet availability...
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Fleet readiness</p>
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Vehicle Availability</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CarFront size={14} /> {vehicles.length} units
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">Available</p>
          <p className="text-sm font-semibold text-emerald-700">{counts.available}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">In transit</p>
          <p className="text-sm font-semibold text-sky-600">{counts.inTransit}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-center">
          <p className="text-[color:var(--muted)]">Maintenance</p>
          <p className="text-sm font-semibold text-rose-600">{counts.needsMaintenance}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {availableVehicles.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-4 text-xs text-[color:var(--muted)] flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600" /> No vehicles currently available.
          </div>
        ) : (
          availableVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {vehicle.plate_number}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  {vehicle.make} {vehicle.model}
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Ready</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
