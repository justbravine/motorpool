"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import PendingRequestsTable from "@/components/PendingRequestsTable";
import DriverDashboard from "@/components/DriverDashboard";
import DriverStatusPanel from "@/components/DriverStatusPanel";
import FleetAvailabilityPanel from "@/components/FleetAvailabilityPanel";
import DriverApprovalTable from "@/components/DriverApprovalTable";
import { createClient } from "@/lib/supabase/client";
import { getAuthedUserId, getUserRole } from "@/lib/mockDb";
import FleetLogo from "@/components/FleetLogo";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AppHome() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [role, setRole] = useState<"Admin" | "Driver" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadRole() {
      try {
        const userId = await getAuthedUserId();
        const userRole = await getUserRole(userId);
        if (!isActive) return;
        setRole(userRole ?? null);
      } catch {
        if (isActive) setError("Unable to load user role.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadRole();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen font-sans relative app-shell flex flex-col bg-[color:var(--background)]">
      <nav className="w-full relative z-50 mt-[0.3cm] p-3 sm:mt-0 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between rounded-full border border-transparent transition-all duration-500 hover:bg-[color:var(--panel)]/95 hover:backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-500/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-emerald-500/10 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-emerald-500/20 shadow-sm flex items-center justify-center transition-transform duration-500 hover:scale-110 hover:-rotate-12">
              <FleetLogo className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="font-bold text-[color:var(--foreground)] text-base sm:text-xl tracking-tight leading-none">Fleet Command</h1>
              <p className="text-[8px] sm:text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold mt-0.5 sm:mt-1">Dispatch Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {role && (
              <span className="hidden sm:inline-flex rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)] px-3 py-1 text-xs font-semibold text-[color:var(--muted-strong)]">
                Role: {role}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)]"
              aria-label="Sign out"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <Breadcrumbs role={role} />
          {loading && (
            <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--muted)]">
              Loading workspace...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && role === "Admin" && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-lg glass-panel">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Dispatch overview</p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-[color:var(--foreground)] font-display">
                      Command Center
                    </h2>
                    <p className="text-sm text-[color:var(--muted)] mt-2 max-w-2xl">
                      Assign vehicles quickly, keep drivers rotating, and track availability in real time.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--muted-strong)]">
                      Shift: Morning
                    </span>
                    <span className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--muted-strong)]">
                      Queue active
                    </span>
                    <span className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ops status: Stable
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <DriverApprovalTable />
                  <PendingRequestsTable />
                </div>
                <div className="space-y-6">
                  <DriverStatusPanel />
                  <FleetAvailabilityPanel />
                </div>
              </div>
            </section>
          )}

          {!loading && !error && role === "Driver" && (
            <section className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-full max-w-4xl">
                <DriverDashboard />
              </div>
            </section>
          )}

          {!loading && !error && !role && (
            <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--muted)]">
              No role assigned. Contact an administrator to set your access level.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
