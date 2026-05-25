"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ClipboardList, Clock } from "lucide-react";
import { Trip, Vehicle, User } from "@/lib/schemas";
import { getTrips, getVehicles, getUsers, approveTrip, getAuthedUserId, rejectTrip, updateTrip } from "@/lib/mockDb";
import ConfirmDialog from "@/components/ConfirmDialog";
import ToastStack, { Toast } from "@/components/ToastStack";

export default function PendingRequestsTable() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Pending" | "Rejected" | "All">("Pending");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rejectTarget, setRejectTarget] = useState<Trip | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // State to hold the selected vehicle/driver for each trip being approved
  const [assignments, setAssignments] = useState<Record<string, { vehicle_id: string; driver_id: string }>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedTrips, fetchedVehicles, fetchedUsers] = await Promise.all([
          getTrips(),
          getVehicles(),
          getUsers(),
        ]);
        
        setTrips(fetchedTrips.filter(t => t.status === "Pending" || t.status === "Rejected"));
        setVehicles(fetchedVehicles.filter(v => v.status === "Available"));
        setUsers(fetchedUsers);
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message, tone },
    ]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleAssignmentChange = (tripId: string, field: "vehicle_id" | "driver_id", value: string) => {
    setAssignments(prev => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        [field]: value
      }
    }));
  };

  const notifyRequester = async (trip: Trip, status: "Approved" | "Rejected" | "Reopened") => {
    const requester = users.find(u => u.id === trip.requester_id);
    const email = requester?.email;
    if (!email) return;

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          requesterName: requester?.full_name || "Driver",
          status,
          destination: trip.destination,
          startTime: trip.start_time instanceof Date ? trip.start_time.toISOString() : trip.start_time,
          endTime: trip.end_time instanceof Date ? trip.end_time.toISOString() : trip.end_time,
        }),
      });
    } catch {
      // Notification failures should not block approvals.
    }
  };

  const handleApprove = async (tripId: string) => {
    const assignment = assignments[tripId];
    if (!assignment?.vehicle_id || !assignment?.driver_id) {
      pushToast("Select both a vehicle and a driver.", "error");
      return;
    }

    const previousTrips = trips;
    const trip = trips.find(t => t.id === tripId);
    setTrips(prev => prev.filter(t => t.id !== tripId));

    try {
      const adminId = await getAuthedUserId();
      await approveTrip(tripId, assignment.vehicle_id, assignment.driver_id, adminId);
      if (trip) {
        const updatedTrip = { ...trip, status: "Approved", driver_id: assignment.driver_id, vehicle_id: assignment.vehicle_id } as Trip;
        await notifyRequester(updatedTrip, "Approved");
        window.dispatchEvent(new CustomEvent("trip-status-updated", { detail: { trip: updatedTrip } }));
      }
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      pushToast("Trip approved successfully.", "success");
    } catch (err) {
      setTrips(previousTrips);
      pushToast("Failed to approve trip.", "error");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    const previousTrips = trips;
    const trimmedReason = rejectReason.trim() || null;
    setTrips(prev => prev.map(t => (t.id === rejectTarget.id ? { ...t, status: "Rejected", rejection_reason: trimmedReason } : t)));

    try {
      const adminId = await getAuthedUserId();
      await rejectTrip(rejectTarget.id, adminId, trimmedReason);
      const updatedTrip = { ...rejectTarget, status: "Rejected", rejection_reason: trimmedReason } as Trip;
      await notifyRequester(updatedTrip, "Rejected");
      window.dispatchEvent(new CustomEvent("trip-status-updated", { detail: { trip: updatedTrip } }));
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      pushToast("Trip rejected.", "success");
    } catch (err) {
      setTrips(previousTrips);
      pushToast("Failed to reject trip.", "error");
    } finally {
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  const handleReopen = async (tripId: string) => {
    const previousTrips = trips;
    const trip = trips.find(t => t.id === tripId);
    setTrips(prev => prev.map(t => (t.id === tripId ? { ...t, status: "Pending", rejection_reason: null } : t)));

    try {
      await updateTrip(tripId, { status: "Pending", rejection_reason: null });
      if (trip) {
        const updatedTrip = { ...trip, status: "Pending", rejection_reason: null } as Trip;
        await notifyRequester(updatedTrip, "Reopened");
        window.dispatchEvent(new CustomEvent("trip-status-updated", { detail: { trip: updatedTrip } }));
      }
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      pushToast("Trip reopened for review.", "success");
    } catch (err) {
      setTrips(previousTrips);
      pushToast("Failed to reopen trip.", "error");
    }
  };

  const rejectTitle = useMemo(
    () => (rejectTarget ? `Reject request to ${rejectTarget.destination}` : "Reject request"),
    [rejectTarget]
  );

  if (loading) return <div className="p-6">Loading pending requests...</div>;
  if (error) return <div className="p-6 text-rose-500">{error}</div>;

  // Filter down to users who have the Driver role
  const drivers = users.filter(u => u.role === "Driver" && u.is_approved);
  const filteredTrips = trips.filter((trip) => {
    if (statusFilter === "All") return true;
    return trip.status === statusFilter;
  });

  return (
    <div className="bg-[color:var(--panel)] rounded-2xl shadow-sm border border-[color:var(--panel-edge)] overflow-hidden w-full min-w-0">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="p-6 border-b border-[color:var(--panel-edge)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--foreground)]">Dispatch Queue</h2>
          <p className="text-sm text-[color:var(--muted)] mt-1">Review and assign drivers to pending travel requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-[color:var(--accent-soft)] text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-[color:var(--panel-edge)]">
            <ClipboardList size={16} /> {filteredTrips.length} showing
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-1 text-xs font-semibold">
            {(["Pending", "Rejected", "All"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 ${
                  statusFilter === status
                    ? "bg-emerald-700 text-white"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {filteredTrips.length === 0 ? (
        <div className="p-12 text-center">
           <div className="w-16 h-16 bg-[color:var(--panel-strong)] text-[color:var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
             <ClipboardList size={32} />
           </div>
           <p className="text-[color:var(--foreground)] font-medium">Inbox Zero</p>
           <p className="text-[color:var(--muted)] text-sm mt-1">No pending requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden lg:grid grid-cols-[1.1fr_1.4fr_1.3fr_1.6fr_0.9fr] gap-4 px-6 py-3 bg-[color:var(--panel-strong)] border-b border-[color:var(--panel-edge)] text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">
            <div>Requester</div>
            <div>Itinerary</div>
            <div>Schedule</div>
            <div>Assignment</div>
            <div className="text-right">Action</div>
          </div>
          {filteredTrips.map(trip => {
            const requester = users.find(u => u.id === trip.requester_id);
            const assignment = assignments[trip.id] || { vehicle_id: "", driver_id: "" };
            const isRejected = trip.status === "Rejected";
            const startTime = new Date(trip.start_time);
            const endTime = new Date(trip.end_time);
            const startDateLabel = startTime.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            });
            const endDateLabel = endTime.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            });
            const startTimeLabel = startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const endTimeLabel = endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={trip.id}
                className="grid grid-cols-1 gap-4 rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] px-6 py-4 lg:grid-cols-[1.1fr_1.4fr_1.3fr_1.6fr_0.9fr] lg:items-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[color:var(--accent-soft)] text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {requester?.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="font-semibold text-[color:var(--foreground)]">{requester?.full_name || "Unknown"}</div>
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-[color:var(--foreground)]">{trip.destination}</div>
                    {isRejected && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[color:var(--muted)] mt-1 max-w-[260px] truncate" title={trip.purpose}>{trip.purpose}</div>
                  {isRejected && trip.rejection_reason && (
                    <div className="text-xs text-rose-600 mt-1">Reason: {trip.rejection_reason}</div>
                  )}
                </div>
                <div className="space-y-2 text-sm pt-1">
                  <div className="flex items-center gap-2 text-[color:var(--foreground)] font-semibold">
                    <span className="inline-flex h-5 items-center rounded-full bg-[color:var(--accent-soft)] px-2 text-[9px] font-bold tracking-[0.2em] text-emerald-700">
                      FROM
                    </span>
                    <span className="whitespace-nowrap">
                      {startDateLabel} at {startTimeLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                    <span className="inline-flex h-5 items-center rounded-full border border-[color:var(--panel-edge)] px-2 text-[9px] font-bold tracking-[0.2em] text-[color:var(--muted)]">
                      TO
                    </span>
                    <span className="whitespace-nowrap">
                      {endDateLabel} at {endTimeLabel}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="min-w-0">
                      <label className="block text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted)] font-semibold mb-1">
                        Vehicle
                      </label>
                      <select
                        className="w-full border border-[color:var(--panel-edge)] rounded-xl px-3 py-2.5 pr-8 text-sm leading-tight bg-[color:var(--panel)] text-[color:var(--foreground)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none truncate"
                        value={assignment.vehicle_id}
                        onChange={(e) => handleAssignmentChange(trip.id, "vehicle_id", e.target.value)}
                      >
                        <option value="">Select vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted)] font-semibold mb-1">
                        Driver
                      </label>
                      <select
                        className="w-full border border-[color:var(--panel-edge)] rounded-xl px-3 py-2.5 pr-8 text-sm leading-tight bg-[color:var(--panel)] text-[color:var(--foreground)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none truncate"
                        value={assignment.driver_id}
                        onChange={(e) => handleAssignmentChange(trip.id, "driver_id", e.target.value)}
                      >
                        <option value="">Select driver</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col justify-start gap-2 pt-1">
                  <button 
                    onClick={() => handleApprove(trip.id)}
                    className="w-full bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-800 active:scale-95 transition-all shadow-sm text-center"
                  >
                    Approve
                  </button>
                  {isRejected ? (
                    <button 
                      onClick={() => handleReopen(trip.id)}
                      className="w-full bg-[color:var(--panel-strong)] text-[color:var(--foreground)] px-3 py-2 rounded-lg text-sm font-semibold hover:border-emerald-400 border border-[color:var(--panel-edge)] active:scale-95 transition-all shadow-sm text-center"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setRejectTarget(trip);
                        setRejectReason("");
                      }}
                      className="w-full bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-rose-200 active:scale-95 transition-all shadow-sm text-center"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title={rejectTitle}
        description="Add a rejection note for the requester (optional)."
        confirmLabel="Reject"
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      >
        <textarea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-xs text-[color:var(--foreground)]"
          placeholder="Optional rejection note..."
        />
      </ConfirmDialog>
    </div>
  );
}