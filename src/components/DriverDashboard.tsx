"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CarFront, Flag, Gauge, Navigation } from "lucide-react";
import { Trip, Vehicle } from "@/lib/schemas";
import { getTrips, getVehicles, startTrip, completeTrip, getAuthedUserId } from "@/lib/mockDb";
import DriverAccountSection from "@/components/DriverAccountSection";
import RequestVehicleForm from "@/components/RequestVehicleForm";
import ToastStack, { Toast } from "@/components/ToastStack";

export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Store inputs for the odometer readings (keyed by trip id)
  const [odometerInputs, setOdometerInputs] = useState<Record<string, string>>({});


  const fetchDriverData = useCallback(async () => {
    const authedUserId = await getAuthedUserId();
    setUserId(authedUserId);
    const [fetchedTrips, fetchedVehicles] = await Promise.all([getTrips(), getVehicles()]);
    setTrips(fetchedTrips);
    setVehicles(fetchedVehicles);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        await fetchDriverData();
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, [fetchDriverData]);

  const assignedTrips = useMemo(
    () => trips.filter(t => t.driver_id === userId && (t.status === "Approved" || t.status === "In Progress")),
    [trips, userId]
  );

  const requestedTrips = useMemo(
    () => trips.filter(t => t.requester_id === userId),
    [trips, userId]
  );

  const statusStyles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-slate-100 text-slate-700",
    Rejected: "bg-rose-100 text-rose-700",
  };

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message, tone },
    ]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleOdometerChange = (tripId: string, value: string) => {
    setOdometerInputs(prev => ({ ...prev, [tripId]: value }));
  };

  const handleStartTrip = async (tripId: string) => {
    const odoValue = parseInt(odometerInputs[tripId]);
    if (isNaN(odoValue) || odoValue < 0) {
      return pushToast("Enter a valid starting odometer reading.", "error");
    }

    try {
      await startTrip(tripId, odoValue);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: "In Progress", start_odometer: odoValue } : t));
      pushToast("Trip started. Drive safely.", "success");
    } catch {
      pushToast("Error starting trip.", "error");
    }
  };

  const handleCompleteTrip = async (tripId: string, startOdo: number | undefined) => {
    const endOdoValue = parseInt(odometerInputs[tripId]);
    if (isNaN(endOdoValue) || endOdoValue < (startOdo || 0)) {
      return pushToast("Enter a valid ending odometer reading.", "error");
    }

    try {
      await completeTrip(tripId, endOdoValue);
      // Remove from the active list once completed
      setTrips(prev => prev.filter(t => t.id !== tripId));
      pushToast("Trip completed and mileage updated.", "success");
    } catch {
      pushToast("Error completing trip.", "error");
    }
  };

  if (loading) return <div className="p-6">Loading your schedule...</div>;

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <DriverAccountSection />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-4 md:p-5 shadow-lg glass-panel">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver actions</p>
          <p className="text-sm text-[color:var(--muted)]">Submit a new request for dispatch approval.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRequestOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          Request a vehicle
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-5 md:p-6 bg-[color:var(--panel)] rounded-3xl shadow-lg glass-panel">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[color:var(--panel-edge)] pb-3 mb-5 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver ops</p>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">My Assigned Trips</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CarFront size={14} /> {assignedTrips.length} active routes
            </div>
          </div>

          {assignedTrips.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-5 text-sm">
              <p className="text-[color:var(--foreground)] font-semibold">No trips assigned yet.</p>
              <p className="text-xs text-[color:var(--muted)] mt-1">
                Submit a request to get started. Dispatch will assign your next run here.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-emerald-700">
                Status: Available
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedTrips.map(trip => {
                const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
                const isApproved = trip.status === "Approved";

                return (
                  <div
                    key={trip.id}
                    className="border border-[color:var(--panel-edge)] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-[color:var(--panel-strong)] shadow-sm"
                  >
                    <div className="mb-4 md:mb-0">
                      <h3 className="font-semibold text-lg text-[color:var(--foreground)] flex items-center gap-2">
                        <Navigation size={16} className="text-emerald-700" /> {trip.destination}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        Departure: {new Date(trip.start_time).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-emerald-700 mt-1">
                        Vehicle: {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate_number})` : "Unassigned"}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[color:var(--panel)] p-3 rounded-2xl shadow-sm border border-[color:var(--panel-edge)] w-full md:w-auto mt-4 md:mt-0">
                      <div className="flex flex-col flex-1 sm:flex-initial">
                        <label className="text-xs font-semibold text-[color:var(--muted)] mb-1 flex items-center gap-2">
                          <Gauge size={12} /> {isApproved ? "Start Odometer" : "End Odometer"}
                        </label>
                        <input
                          type="number"
                          className="border border-[color:var(--panel-edge)] rounded-xl p-1.5 text-sm w-full sm:w-32 bg-[color:var(--panel-strong)] text-[color:var(--foreground)]"
                          placeholder="e.g. 12000"
                          value={odometerInputs[trip.id] || ""}
                          onChange={(e) => handleOdometerChange(trip.id, e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() =>
                          isApproved ? handleStartTrip(trip.id) : handleCompleteTrip(trip.id, trip.start_odometer)
                        }
                        className={`px-4 py-2 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 mt-auto sm:mt-5 ${
                          isApproved ? "bg-emerald-700 hover:bg-emerald-800" : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {isApproved ? <Flag size={14} /> : <CarFront size={14} />}
                        {isApproved ? "Start Trip" : "End Trip"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 md:p-6 bg-[color:var(--panel)] rounded-3xl shadow-lg glass-panel">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[color:var(--panel-edge)] pb-3 mb-5 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Request tracker</p>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">My Requests</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CarFront size={14} /> {requestedTrips.length} total
            </div>
          </div>

          {requestedTrips.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-5 text-sm">
              <p className="text-[color:var(--foreground)] font-semibold">No requests yet.</p>
              <p className="text-xs text-[color:var(--muted)] mt-1">
                Submit a travel request to get dispatch approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requestedTrips.map(trip => (
                <div
                  key={trip.id}
                  className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">{trip.destination}</p>
                    <p className="text-xs text-[color:var(--muted)] mt-1">
                      {new Date(trip.start_time).toLocaleString()} - {new Date(trip.end_time).toLocaleString()}
                    </p>
                    <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-1">{trip.purpose}</p>
                    {trip.status === "Rejected" && trip.rejection_reason && (
                      <p className="text-xs text-rose-600 mt-1">Reason: {trip.rejection_reason}</p>
                    )}
                  </div>
                  {trip.status !== "Pending" && (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[trip.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {trip.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close request form"
            onClick={() => setIsRequestOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--panel-edge)] px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Request dispatch</p>
                <h2 className="text-lg font-semibold text-[color:var(--foreground)] font-display">Request a Vehicle</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestOpen(false)}
                className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)] hover:border-emerald-400"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
              <RequestVehicleForm
                onSubmitted={() => {
                  fetchDriverData();
                  setIsRequestOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}