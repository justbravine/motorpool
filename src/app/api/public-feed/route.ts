import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DriverRow = {
  id: string;
  full_name: string | null;
};

type TripRow = {
  driver_id: string | null;
  status: string;
  start_time: string;
};

type VehicleRow = {
  plate_number: string | null;
};

type TripWithVehicle = {
  driver_id: string | null;
  status: string;
  vehicles: { plate_number: string | null }[] | null;
};

type DriverStatus = "Available" | "Assigned" | "On route" | "Returning";

type LiveDriver = {
  id: string;
  full_name: string | null;
  status: DriverStatus;
  assigned_vehicle: string | null;
};

const mapTripStatus = (status: string): DriverStatus => {
  if (status === "In Progress") return "On route";
  if (status === "Approved") return "Assigned";
  if (status === "Completed") return "Returning";
  return "Available";
};

const pickRandomDrivers = (drivers: DriverRow[], count: number) => {
  const copy = [...drivers];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: drivers, error: driversError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "Driver")
    .limit(20);

  if (driversError) {
    return NextResponse.json(
      { ok: false, error: driversError.message },
      { status: 500 }
    );
  }

  const driverRows = (drivers ?? []) as DriverRow[];
  if (driverRows.length === 0) {
    return NextResponse.json(
      { ok: true, drivers: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const selectedDrivers = pickRandomDrivers(driverRows, 3);
  const driverIds = selectedDrivers.map((driver) => driver.id);

  let tripRows: TripRow[] = [];
  if (driverIds.length > 0) {
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("driver_id, status, start_time")
      .in("driver_id", driverIds)
      .order("start_time", { ascending: false })
      .limit(200);

    if (tripsError) {
      return NextResponse.json(
        { ok: false, error: tripsError.message },
        { status: 500 }
      );
    }

    tripRows = (trips ?? []) as TripRow[];
  }

  const statusByDriver = new Map<string, DriverStatus>();
  for (const trip of tripRows) {
    if (!trip.driver_id) continue;
    if (statusByDriver.has(trip.driver_id)) continue;
    statusByDriver.set(trip.driver_id, mapTripStatus(trip.status));
  }

  const liveDrivers: LiveDriver[] = selectedDrivers.map((driver) => ({
    id: driver.id,
    full_name: driver.full_name,
    status: statusByDriver.get(driver.id) ?? "Available",
    assigned_vehicle: null,
  }));

  const { data: activeTrips, error: activeTripsError } = await supabase
    .from("trips")
    .select("driver_id, status, vehicles(plate_number)")
    .in("driver_id", driverIds)
    .in("status", ["Approved", "In Progress"])
    .order("start_time", { ascending: false })
    .limit(20);

  if (activeTripsError) {
    return NextResponse.json(
      { ok: false, error: activeTripsError.message },
      { status: 500 }
    );
  }

  const tripRowsWithVehicles = (activeTrips ?? []) as TripWithVehicle[];
  const vehicleByDriver = new Map<string, string>();
  for (const trip of tripRowsWithVehicles) {
    if (!trip.driver_id || vehicleByDriver.has(trip.driver_id)) continue;
    const plate = trip.vehicles?.[0]?.plate_number ?? null;
    if (plate) vehicleByDriver.set(trip.driver_id, plate);
  }

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("plate_number")
    .eq("status", "Available")
    .order("created_at")
    .limit(5);

  if (vehiclesError) {
    return NextResponse.json(
      { ok: false, error: vehiclesError.message },
      { status: 500 }
    );
  }

  const availableVehicles = (vehicles ?? []) as VehicleRow[];
  const usedFallbacks = new Set<string>();

  const enrichedDrivers = liveDrivers.map((driver) => {
    const assignedVehicle = vehicleByDriver.get(driver.id) ?? null;
    if (assignedVehicle) {
      return { ...driver, assigned_vehicle: assignedVehicle };
    }

    const fallback = availableVehicles.find((vehicle) => {
      const plate = vehicle.plate_number ?? null;
      return plate && !usedFallbacks.has(plate);
    })?.plate_number ?? null;

    if (fallback) usedFallbacks.add(fallback);
    return { ...driver, assigned_vehicle: fallback };
  });

  return NextResponse.json(
    { ok: true, drivers: enrichedDrivers },
    { headers: { "Cache-Control": "no-store" } }
  );
}
