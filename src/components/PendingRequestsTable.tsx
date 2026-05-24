"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Clock, Trash2 } from "lucide-react";
import { Trip, Vehicle, User } from "@/lib/schemas";
import { getTrips, getVehicles, getUsers, approveTrip, getAuthedUserId, deleteTrip } from "@/lib/mockDb";

export default function PendingRequestsTable() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Filter for the admin's view
        setTrips(fetchedTrips.filter(t => t.status === "Pending"));
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

  const handleAssignmentChange = (tripId: string, field: "vehicle_id" | "driver_id", value: string) => {
    setAssignments(prev => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        [field]: value
      }
    }));
  };

  const handleApprove = async (tripId: string) => {
    const assignment = assignments[tripId];
    if (!assignment?.vehicle_id || !assignment?.driver_id) {
      alert("Please select both a vehicle and a driver.");
      return;
    }

    try {
      const adminId = await getAuthedUserId();
      await approveTrip(tripId, assignment.vehicle_id, assignment.driver_id, adminId);
      
      // Optimistically remove from the pending list
      setTrips(prev => prev.filter(t => t.id !== tripId));
      alert("Trip approved successfully!");
    } catch (err) {
      alert("Failed to approve trip.");
    }
  };

  const handleReject = async (tripId: string) => {
    if (confirm("Are you sure you want to reject and delete this request?")) {
      try {
        await deleteTrip(tripId);
        setTrips(prev => prev.filter(t => t.id !== tripId));
      } catch (err) {
        alert("Failed to delete trip.");
      }
    }
  };

  if (loading) return <div className="p-6">Loading pending requests...</div>;
  if (error) return <div className="p-6 text-rose-500">{error}</div>;

  // Filter down to users who have the Driver role
  const drivers = users.filter(u => u.role === "Driver" && u.is_approved);

  return (
    <div className="bg-[color:var(--panel)] rounded-2xl shadow-sm border border-[color:var(--panel-edge)] overflow-hidden">
      <div className="p-6 border-b border-[color:var(--panel-edge)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--foreground)]">Dispatch Queue</h2>
          <p className="text-sm text-[color:var(--muted)] mt-1">Review and assign drivers to pending travel requests.</p>
        </div>
        <div className="flex items-center gap-2 bg-[color:var(--accent-soft)] text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-[color:var(--panel-edge)]">
          <ClipboardList size={16} /> {trips.length} Awaiting
        </div>
      </div>
      
      {trips.length === 0 ? (
        <div className="p-12 text-center">
           <div className="w-16 h-16 bg-[color:var(--panel-strong)] text-[color:var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
             <ClipboardList size={32} />
           </div>
           <p className="text-[color:var(--foreground)] font-medium">Inbox Zero</p>
           <p className="text-[color:var(--muted)] text-sm mt-1">No pending requests at the moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-[color:var(--panel-strong)] border-b border-[color:var(--panel-edge)]">
                <th className="px-6 py-4 text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">Itinerary</th>
                <th className="px-6 py-4 text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-4 text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--panel-edge)]">
              {trips.map(trip => {
                const requester = users.find(u => u.id === trip.requester_id);
                const assignment = assignments[trip.id] || { vehicle_id: "", driver_id: "" };

                return (
                  <tr key={trip.id} className="hover:bg-[color:var(--panel-strong)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[color:var(--accent-soft)] text-emerald-700 flex items-center justify-center font-bold text-sm">
                           {requester?.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="font-semibold text-[color:var(--foreground)]">{requester?.full_name || "Unknown"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[color:var(--foreground)]">{trip.destination}</div>
                      <div className="text-xs text-[color:var(--muted)] mt-1 max-w-[200px] truncate" title={trip.purpose}>{trip.purpose}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1.5 text-[color:var(--foreground)] font-medium">
                        <Clock size={14} className="text-[color:var(--muted)]" />
                        {new Date(trip.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div className="text-[color:var(--muted)] text-xs mt-1 ml-5">
                        to {new Date(trip.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <select 
                        className="w-full border border-[color:var(--panel-edge)] rounded-lg px-3 py-1.5 text-sm bg-[color:var(--panel-strong)] text-[color:var(--foreground)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none"
                        value={assignment.vehicle_id}
                        onChange={(e) => handleAssignmentChange(trip.id, "vehicle_id", e.target.value)}
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                        ))}
                      </select>
                      <select 
                        className="w-full border border-[color:var(--panel-edge)] rounded-lg px-3 py-1.5 text-sm bg-[color:var(--panel-strong)] text-[color:var(--foreground)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none"
                        value={assignment.driver_id}
                        onChange={(e) => handleAssignmentChange(trip.id, "driver_id", e.target.value)}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(trip.id)}
                          className="w-full sm:w-auto bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-800 active:scale-95 transition-all shadow-sm text-center"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(trip.id)}
                          className="w-full sm:w-auto bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-rose-200 active:scale-95 transition-all shadow-sm text-center"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}