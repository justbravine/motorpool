"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, BadgeCheck, CarFront, Gauge, Wrench, Plus, Pencil, Trash2, X } from "lucide-react";
import { Vehicle } from "@/lib/schemas";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/mockDb";

export default function VehicleRegistryDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState<number>(4);
  const [status, setStatus] = useState<"Available" | "In Transit" | "Needs Maintenance">("Available");
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [maintenanceThreshold, setMaintenanceThreshold] = useState<number>(5000);

  useEffect(() => {
    async function fetchVehicles() {
      const data = await getVehicles();
      setVehicles(data);
      setLoading(false);
    }
    fetchVehicles();
  }, []);

  async function loadVehicles() {
    setLoading(true);
    const data = await getVehicles();
    setVehicles(data);
    setLoading(false);
  }

  const openAddModal = () => {
    setEditingVehicle(null);
    setMake("");
    setModel("");
    setPlateNumber("");
    setCapacity(4);
    setStatus("Available");
    setCurrentMileage(0);
    setMaintenanceThreshold(5000);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setPlateNumber(vehicle.plate_number);
    setCapacity(vehicle.capacity);
    setStatus(vehicle.status);
    setCurrentMileage(vehicle.current_mileage);
    setMaintenanceThreshold(vehicle.maintenance_threshold);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          make, model, plate_number: plateNumber, capacity, status, current_mileage: currentMileage, maintenance_threshold: maintenanceThreshold
        });
      } else {
        await createVehicle({
          make, model, plate_number: plateNumber, capacity, status, current_mileage: currentMileage, maintenance_threshold: maintenanceThreshold
        });
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err) {
      alert("Failed to save vehicle");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteVehicle(id);
        loadVehicles();
      } catch (err) {
        alert("Failed to delete vehicle");
      }
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading fleet status...</div>;

  return (
    <div className="bg-[color:var(--panel)] rounded-2xl shadow-sm border border-[color:var(--panel-edge)] overflow-hidden">
      <div className="p-4 border-b border-[color:var(--panel-edge)] flex items-center justify-between bg-[color:var(--panel)]">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--foreground)]">Vehicle Registry</h2>
          <p className="text-sm text-[color:var(--muted)] mt-0.5">Live tracking and maintenance status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[color:var(--accent-soft)] text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-[color:var(--panel-edge)]">
            <CarFront size={16} /> {vehicles.length} Units
          </div>
          <button onClick={openAddModal} className="flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-800 transition-colors">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 bg-[color:var(--panel-strong)]">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-[color:var(--panel)] border border-[color:var(--panel-edge)] rounded-xl p-3 hover:border-emerald-300/30 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-4 justify-between group"
          >
            {/* Left: Icon & Identity */}
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[color:var(--panel-strong)] to-[color:var(--accent-soft)] border border-[color:var(--panel-edge)] flex items-center justify-center shrink-0 group-hover:from-[color:var(--accent-soft)] group-hover:to-[color:var(--panel-strong)] transition-colors">
                <CarFront size={20} className="text-[color:var(--muted)] group-hover:text-[color:var(--accent)] transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] leading-tight">{vehicle.plate_number}</h3>
                <p className="text-xs text-[color:var(--muted)] font-medium mt-0.5">{vehicle.make} {vehicle.model}</p>
              </div>
            </div>

            {/* Middle: Mileage Progress */}
            <div className="flex-1 max-w-sm w-full">
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-[color:var(--muted)] font-bold mb-1.5">
                <span className="flex items-center gap-1">
                  <Gauge size={12} className="text-[color:var(--muted)]" />
                  Mileage Tracking
                </span>
                <span className={vehicle.current_mileage >= vehicle.maintenance_threshold ? "text-rose-600 font-bold" : ""}>
                  {vehicle.current_mileage.toLocaleString()} / {vehicle.maintenance_threshold.toLocaleString()} km
                </span>
              </div>
              <div className="w-full bg-[color:var(--accent-soft)] rounded-full h-1.5 overflow-hidden border border-[color:var(--panel-edge)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${vehicle.current_mileage >= vehicle.maintenance_threshold ? "bg-rose-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min((vehicle.current_mileage / vehicle.maintenance_threshold) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Right: Status Badge */}
            <div className="flex flex-col sm:flex-row md:justify-end min-w-[140px] items-start sm:items-center gap-3">
              <span
                className={`inline-flex items-center justify-center w-full sm:w-auto gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border shadow-sm ${
                  vehicle.status === "Available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                  vehicle.status === "Needs Maintenance" ? "bg-rose-50 text-rose-700 border-rose-200" : 
                  "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {vehicle.status === "Available" && <BadgeCheck size={14} />}
                {vehicle.status === "Needs Maintenance" && <Wrench size={14} />}
                {vehicle.status !== "Available" && vehicle.status !== "Needs Maintenance" && <AlertTriangle size={14} />}
                {vehicle.status}
              </span>
              
              <div className="flex items-center justify-end w-full sm:w-auto gap-1 md:ml-3">
                <button onClick={() => openEditModal(vehicle)} className="p-2 text-[color:var(--muted)] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(vehicle.id)} className="p-2 text-[color:var(--muted)] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[color:var(--panel)] border border-[color:var(--panel-edge)] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-[color:var(--foreground)] mb-4">{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
            
            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Make</label>
                  <input type="text" value={make} onChange={e => setMake(e.target.value)} required className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" placeholder="e.g. Toyota" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Model</label>
                  <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" placeholder="e.g. Hilux" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Plate Number</label>
                  <input type="text" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} required className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" placeholder="e.g. GK 123A" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Capacity</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} required min={1} className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                  <option value="Available">Available</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Needs Maintenance">Needs Maintenance</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Current Mileage</label>
                  <input type="number" value={currentMileage} onChange={e => setCurrentMileage(parseInt(e.target.value))} required min={0} className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--muted)] mb-1">Maintenance Threshold</label>
                  <input type="number" value={maintenanceThreshold} onChange={e => setMaintenanceThreshold(parseInt(e.target.value))} required min={1} className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]" />
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors">
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}