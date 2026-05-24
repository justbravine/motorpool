"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { getAuditLogs } from "@/lib/mockDb";
import { AuditLog } from "@/lib/schemas";

export default function AlertsFeed() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let isActive = true;

    async function checkBackend() {
      try {
        const fetchedLogs = await getAuditLogs();
        const response = await fetch("/api/test-db", { cache: "no-store" });
        if (!isActive) return;
        setBackendStatus(response.ok ? "online" : "offline");
        setLogs(fetchedLogs.slice(0, 5));
      } catch {
        if (!isActive) return;
        setBackendStatus("offline");
      }
    }

    checkBackend();

    return () => {
      isActive = false;
    };
  }, []);

  const backendBadge =
    backendStatus === "online"
      ? "bg-emerald-100 text-emerald-700"
      : backendStatus === "offline"
      ? "bg-rose-100 text-rose-700"
      : "bg-slate-100 text-slate-600";

  const backendDot =
    backendStatus === "online"
      ? "bg-emerald-500"
      : backendStatus === "offline"
      ? "bg-rose-500"
      : "bg-slate-400";

  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[color:var(--panel-edge)] pb-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] font-semibold">
            Alerts
          </p>
          <h3 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">
            Operations Feed
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${backendBadge}`}>
            <span className={`h-2 w-2 rounded-full ${backendDot}`} />
            {backendStatus === "checking" ? "Backend: checking" : backendStatus === "online" ? "Backend: online" : "Backend: offline"}
          </span>
          <span className="text-xs font-semibold text-[color:var(--muted)]">Last 24 hours</span>
        </div>
      </div>
      <div className="space-y-3">
        {logs.length === 0 && backendStatus !== "checking" && (
          <p className="text-sm text-[color:var(--muted)]">No recent operations logged.</p>
        )}
        {logs.map((log) => {
          const Icon = CheckCircle2;
          return (
            <div
              key={log.id}
              className="rounded-2xl border border-[color:var(--panel-edge)] p-4 bg-[color:var(--panel-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-emerald-600`}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {log.action}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">Entity: {log.entity} | ID: {log.entity_id.substring(0,8)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-[color:var(--accent-soft)] text-[color:var(--foreground)]`}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
