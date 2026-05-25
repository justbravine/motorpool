"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { getUsers, updateUser } from "@/lib/mockDb";
import { User } from "@/lib/schemas";
import ToastStack, { Toast } from "@/components/ToastStack";

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
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message, tone },
    ]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

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
    const previousDrivers = drivers;
    try {
      const driverSnapshot = drivers.find((driver) => driver.id === driverId);
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId ? { ...driver, is_approved: nextState === "approved" } : driver
        )
      );
      await updateUser(driverId, { is_approved: nextState === "approved" });
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      if (driverSnapshot) {
        window.dispatchEvent(
          new CustomEvent("driver-approval-updated", {
            detail: { driver: { ...driverSnapshot, is_approved: nextState === "approved" }, isApproved: nextState === "approved" },
          })
        );
      }
    } catch (error) {
      setDrivers(previousDrivers);
      const messageText = error instanceof Error ? error.message : "Failed to update driver approval.";
      console.error("Driver approval update failed", error);
      pushToast(messageText, "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSendTest = async () => {
    const trimmed = testEmail.trim();
    if (!trimmed) return pushToast("Enter a test email address.", "error");

    setIsSendingTest(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: trimmed, type: "test" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send test email.");
      }

      pushToast("Test email sent.", "success");
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Failed to send test email.";
      pushToast(messageText, "error");
    } finally {
      setIsSendingTest(false);
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
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
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

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[color:var(--foreground)]">Test email delivery</p>
          <p className="text-xs text-[color:var(--muted)]">Send a one-off email to verify Resend.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="email"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] px-3 py-2 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20 sm:w-56"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest}
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
          >
            {isSendingTest ? "Sending..." : "Send test"}
          </button>
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
