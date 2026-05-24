"use client";

import { useState, useEffect } from "react";
import { CarFront, Flag, Gauge, Navigation } from "lucide-react";
import { Trip, Vehicle } from "@/lib/schemas";
import { getTrips, getVehicles, startTrip, completeTrip, getAuthedUserId } from "@/lib/mockDb";
import DriverAccountSection from "@/components/DriverAccountSection";

export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Store inputs for the odometer readings (keyed by trip id)
  const [odometerInputs, setOdometerInputs] = useState<Record<string, string>>({});


  useEffect(() => {
    let isActive = true;

    async function fetchDriverData() {
      try {
        const userId = await getAuthedUserId();
        if (!isActive) return;
        const [fetchedTrips, fetchedVehicles] = await Promise.all([
          getTrips(),
          getVehicles()
        ]);

        // Filter trips assigned to this specific driver
        setTrips(fetchedTrips.filter(t => t.driver_id === userId && (t.status === "Approved" || t.status === "In Progress")));
        setVehicles(fetchedVehicles);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetchDriverData();

    return () => {
      isActive = false;
    };
  }, []);

  const handleOdometerChange = (tripId: string, value: string) => {
    setOdometerInputs(prev => ({ ...prev, [tripId]: value }));
  };

  const handleStartTrip = async (tripId: string) => {
    const odoValue = parseInt(odometerInputs[tripId]);
    if (isNaN(odoValue) || odoValue < 0) return alert("Please enter a valid starting odometer reading.");

    try {
      await startTrip(tripId, odoValue);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: "In Progress", start_odometer: odoValue } : t));
      alert("Trip started! Drive safely.");
    } catch (err) {
      alert("Error starting trip.");
    }
  };

  const handleCompleteTrip = async (tripId: string, startOdo: number | undefined) => {
    const endOdoValue = parseInt(odometerInputs[tripId]);
    if (isNaN(endOdoValue) || endOdoValue < (startOdo || 0)) {
      return alert("Please enter a valid ending odometer reading (must be greater than start).");
    }

    try {
      await completeTrip(tripId, endOdoValue);
      // Remove from the active list once completed
      setTrips(prev => prev.filter(t => t.id !== tripId));
      alert("Trip completed and mileage updated!");
    } catch (err) {
      alert("Error completing trip.");
    }
  };

  if (loading) return <div className="p-6">Loading your schedule...</div>;

  return (
    <div className="space-y-6">
      <DriverAccountSection />

      <div className="p-5 md:p-6 bg-[color:var(--panel)] rounded-3xl shadow-lg glass-panel">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[color:var(--panel-edge)] pb-3 mb-5 gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver ops</p>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">My Assigned Trips</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CarFront size={14} /> {trips.length} active routes
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-5 text-sm">
            <p className="text-[color:var(--foreground)] font-semibold">No trips assigned yet.</p>
            <p className="text-xs text-[color:var(--muted)] mt-1">
              Keep your profile updated. Dispatch will post your next run here.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-emerald-700">
              Status: Available
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {trips.map(trip => {
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
    </div>
  );
}