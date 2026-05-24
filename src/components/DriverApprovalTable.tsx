"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { getUsers, updateUser } from "@/lib/mockDb";
import { User } from "@/lib/schemas";

type ApprovalState = "pending" | "approved";

type PendingAction = {
  id: string;
  nextState: ApprovalState;
};

export default function DriverApprovalTable() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadDrivers() {
      try {
        const users = await getUsers();
        if (!isActive) return;
        setDrivers(users.filter((user) => user.role === "Driver"));
      } catch {
        if (isActive) setError("Unable to load drivers.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadDrivers();

    return () => {
      isActive = false;
    };
  }, []);

  const counts = useMemo(() => {
    let approved = 0;
    let pending = 0;

    drivers.forEach((driver) => {
      if (driver.is_approved) {
        approved += 1;
      } else {
        pending += 1;
      }
    });

    return { approved, pending };
  }, [drivers]);

  const handleApproval = async (driverId: string, nextState: ApprovalState) => {
    setPendingAction({ id: driverId, nextState });
    try {
      await updateUser(driverId, { is_approved: nextState === "approved" });
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId ? { ...driver, is_approved: nextState === "approved" } : driver
        )
      );
    } catch {
      alert("Failed to update driver approval.");
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel text-sm text-[color:var(--muted)]">
        Loading driver approvals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver approvals</p>
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Pending Driver Access</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-emerald-700">
            <Users size={14} /> {drivers.length} total
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-amber-700">
            <ShieldCheck size={14} /> {counts.pending} pending
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {drivers.map((driver) => {
          const isApproved = Boolean(driver.is_approved);
          const isBusy = pendingAction?.id === driver.id;

          return (
            <div
              key={driver.id}
              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {driver.full_name || "Driver"}
                </p>
                <p className={`text-xs font-semibold ${isApproved ? "text-emerald-700" : "text-amber-600"}`}>
                  {isApproved ? "Approved" : "Pending"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApproval(driver.id, "approved")}
                  disabled={isBusy || isApproved}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserCheck size={14} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleApproval(driver.id, "pending")}
                  disabled={isBusy || !isApproved}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={14} /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
