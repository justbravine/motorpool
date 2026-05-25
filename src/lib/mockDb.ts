import { createClient } from "@/lib/supabase/client";
import { User, Vehicle, Trip, AuditLog } from "./schemas";

export const supabase = createClient();

export async function getAuthedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
}

export async function getUserRole(userId: string): Promise<"Admin" | "Driver" | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as "Admin" | "Driver" | null) ?? null;
}

const DRIVER_DOCS_BUCKET = "driver-docs";

export type DriverProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  license_number: string | null;
  license_class: string | null;
  license_expiry: string | null;
  passport_number: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  passport_photo_path: string | null;
  license_photo_path: string | null;
};

export async function getDriverProfile(userId: string): Promise<DriverProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, email, address, license_number, license_class, license_expiry, passport_number, emergency_name, emergency_phone, passport_photo_path, license_photo_path"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as DriverProfile) ?? null;
}

export async function uploadDriverDocument(
  userId: string,
  file: File,
  kind: "passport" | "license"
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${kind}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(DRIVER_DOCS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw error;
  return path;
}

export async function upsertDriverProfile(payload: DriverProfile): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').order('created_at');
  if (error) throw error;
  return data as Vehicle[];
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  
  // Convert Postgres timestamp strings to JS Date objects
  return data.map(trip => ({
    ...trip,
    start_time: new Date(trip.start_time),
    end_time: new Date(trip.end_time)
  })) as Trip[];
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data as User[];
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select();
  if (error) {
    throw new Error(`profiles update failed: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("profiles update failed: no rows updated (check permissions or profile existence)");
  }
  return data[0] as User;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function createVehicle(vehicleData: Omit<Vehicle, "id">): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').insert([vehicleData]).select().single();
  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  // Assume 'timestamp' exists in the database
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return data as AuditLog[];
}

export async function createTripRequest(tripData: Omit<Trip, "id" | "status">): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert([{
      ...tripData,
      start_time: tripData.start_time.toISOString(),
      end_time: tripData.end_time.toISOString(),
      status: 'Pending'
    }])
    .select()
    .single();
    
  if (error) throw error;
  return { ...data, start_time: new Date(data.start_time), end_time: new Date(data.end_time) } as Trip;
}

export async function approveTrip(tripId: string, vehicleId: string, driverId: string, adminId: string): Promise<Trip> {
  // 1. Update Trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .update({ status: 'Approved', vehicle_id: vehicleId, driver_id: driverId })
    .eq('id', tripId)
    .select()
    .single();
  
  if (tripError) throw tripError;

  // 2. Insert Audit Log
  await supabase.from('audit_logs').insert([{
    user_id: adminId,
    action: 'APPROVED_TRIP',
    entity: 'trips',
    entity_id: tripId
  }]);

  return { ...trip, start_time: new Date(trip.start_time), end_time: new Date(trip.end_time) } as Trip;
}

export async function rejectTrip(tripId: string, adminId: string, reason: string | null): Promise<Trip> {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .update({ status: 'Rejected', rejection_reason: reason })
    .eq('id', tripId)
    .select()
    .single();

  if (tripError) throw tripError;

  await supabase.from('audit_logs').insert([{
    user_id: adminId,
    action: 'REJECTED_TRIP',
    entity: 'trips',
    entity_id: tripId
  }]);

  return { ...trip, start_time: new Date(trip.start_time), end_time: new Date(trip.end_time) } as Trip;
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return { ...data, start_time: new Date(data.start_time), end_time: new Date(data.end_time) } as Trip;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function startTrip(tripId: string, startOdometer: number): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({ status: 'In Progress', start_odometer: startOdometer })
    .eq('id', tripId)
    .select()
    .single();
  if (error) throw error;
  return { ...data, start_time: new Date(data.start_time), end_time: new Date(data.end_time) } as Trip;
}

export async function completeTrip(tripId: string, endOdometer: number): Promise<Trip> {
  // We use Supabase RPC (database function) here ideally, but for now we'll do it client-side
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .update({ status: 'Completed', end_odometer: endOdometer })
    .eq('id', tripId)
    .select()
    .single();
  if (tripError) throw tripError;

  return { ...trip, start_time: new Date(trip.start_time), end_time: new Date(trip.end_time) } as Trip;
}