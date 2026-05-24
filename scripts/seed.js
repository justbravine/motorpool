const { createClient } = require("@supabase/supabase-js");

try {
  // Load local env for seeding when running via npm scripts.
  require("dotenv").config({ path: ".env.local" });
} catch {
  // Ignore if dotenv is not installed; rely on shell env vars.
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use a service role key for seeding."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = "ChangeMe123!";

const USERS = [
  { fullName: "Ama Kofi", role: "Driver", email: "ama.kofi@seed.local" },
  { fullName: "Kojo Mensah", role: "Driver", email: "kojo.mensah@seed.local" },
  { fullName: "Akosua Boateng", role: "Driver", email: "akosua.boateng@seed.local" },
  { fullName: "Yaw Owusu", role: "Driver", email: "yaw.owusu@seed.local" },
  { fullName: "Efua Asante", role: "Driver", email: "efua.asante@seed.local" },
  { fullName: "Kwame Antwi", role: "Driver", email: "kwame.antwi@seed.local" },
  { fullName: "Abena Nkrumah", role: "Driver", email: "abena.nkrumah@seed.local" },
  { fullName: "Kofi Nyarko", role: "Driver", email: "kofi.nyarko@seed.local" },
  { fullName: "Esi Addo", role: "Driver", email: "esi.addo@seed.local" },
  { fullName: "Nana Osei", role: "Driver", email: "nana.osei@seed.local" },
  { fullName: "Adwoa Sarfo", role: "Driver", email: "adwoa.sarfo@seed.local" },
  { fullName: "Samuel Tetteh", role: "Driver", email: "samuel.tetteh@seed.local" },
  { fullName: "Mary Quaye", role: "Driver", email: "mary.quaye@seed.local" },
  { fullName: "Benjamin Arthur", role: "Driver", email: "benjamin.arthur@seed.local" },
  { fullName: "Comfort Agyeman", role: "Driver", email: "comfort.agyeman@seed.local" },
  { fullName: "Daniel Ofori", role: "Driver", email: "daniel.ofori@seed.local" },
  { fullName: "Patricia Lamptey", role: "Driver", email: "patricia.lamptey@seed.local" },
  { fullName: "Michael Appiah", role: "Driver", email: "michael.appiah@seed.local" },
  { fullName: "Grace Mensima", role: "Admin", email: "grace.mensima@seed.local" },
  { fullName: "Joseph Dankwa", role: "Admin", email: "joseph.dankwa@seed.local" },
];

const VEHICLES = [
  { make: "Toyota", model: "Hilux", plate_number: "GK 101A", capacity: 5, status: "Available", current_mileage: 12450, maintenance_threshold: 15000 },
  { make: "Nissan", model: "Navara", plate_number: "GK 102B", capacity: 5, status: "In Transit", current_mileage: 20980, maintenance_threshold: 25000 },
  { make: "Ford", model: "Ranger", plate_number: "GK 103C", capacity: 5, status: "Available", current_mileage: 8750, maintenance_threshold: 15000 },
  { make: "Toyota", model: "Land Cruiser", plate_number: "GK 104D", capacity: 7, status: "Needs Maintenance", current_mileage: 49500, maintenance_threshold: 45000 },
  { make: "Hyundai", model: "Starex", plate_number: "GK 105E", capacity: 11, status: "Available", current_mileage: 11200, maintenance_threshold: 20000 },
  { make: "Mitsubishi", model: "L200", plate_number: "GK 106F", capacity: 5, status: "In Transit", current_mileage: 16780, maintenance_threshold: 20000 },
  { make: "Kia", model: "Bongo", plate_number: "GK 107G", capacity: 3, status: "Available", current_mileage: 6200, maintenance_threshold: 12000 },
  { make: "Isuzu", model: "D-Max", plate_number: "GK 108H", capacity: 5, status: "Available", current_mileage: 9800, maintenance_threshold: 15000 },
  { make: "Suzuki", model: "Vitara", plate_number: "GK 109J", capacity: 4, status: "Available", current_mileage: 7450, maintenance_threshold: 12000 },
  { make: "Toyota", model: "Hiace", plate_number: "GK 110K", capacity: 14, status: "Available", current_mileage: 15300, maintenance_threshold: 20000 },
];

async function getOrCreateUser({ email, fullName }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const alreadyExists =
      typeof error.message === "string" &&
      (error.message.includes("already") || error.message.includes("exists"));

    if (alreadyExists && typeof supabase.auth.admin.getUserByEmail === "function") {
      const { data: existing, error: lookupError } = await supabase.auth.admin.getUserByEmail(email);
      if (lookupError) throw lookupError;
      if (existing?.user?.id) return existing.user.id;
    }

    throw error;
  }

  if (!data.user?.id) throw new Error(`Failed to create user for ${email}`);

  return data.user.id;
}

async function seedProfiles() {
  const rows = [];

  for (const user of USERS) {
    const id = await getOrCreateUser(user);
    rows.push({
      id,
      role: user.role,
      full_name: user.fullName,
      driver_license_status: "Valid",
    });
  }

  const { error } = await supabase.from("profiles").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  return rows.length;
}

async function seedVehicles() {
  const { data: existing, error } = await supabase.from("vehicles").select("plate_number");
  if (error) throw error;

  const existingPlates = new Set((existing ?? []).map((row) => row.plate_number));
  const toInsert = VEHICLES.filter((vehicle) => !existingPlates.has(vehicle.plate_number));

  if (toInsert.length === 0) return 0;

  const { error: insertError } = await supabase.from("vehicles").insert(toInsert);
  if (insertError) throw insertError;

  return toInsert.length;
}

function addHours(base, hours) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

async function seedTrips() {
  const { count, error: countError } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= 8) return { inserted: 0, tripIds: [], adminId: null };

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, role");
  if (profilesError) throw profilesError;

  const drivers = (profiles ?? []).filter((profile) => profile.role === "Driver");
  const admins = (profiles ?? []).filter((profile) => profile.role === "Admin");

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id, status")
    .limit(6);
  if (vehiclesError) throw vehiclesError;

  if (drivers.length < 4 || (vehicles ?? []).length < 3) {
    return { inserted: 0, tripIds: [], adminId: admins[0]?.id ?? null };
  }

  const now = new Date();
  const trips = [
    {
      requester_id: drivers[0].id,
      vehicle_id: null,
      driver_id: null,
      start_time: addHours(now, 24).toISOString(),
      end_time: addHours(now, 26).toISOString(),
      destination: "Ministry HQ",
      purpose: "Monthly supply run",
      status: "Pending",
    },
    {
      requester_id: drivers[1].id,
      vehicle_id: vehicles[0].id,
      driver_id: drivers[2].id,
      start_time: addHours(now, 4).toISOString(),
      end_time: addHours(now, 8).toISOString(),
      destination: "Regional Depot",
      purpose: "Parts pickup for scheduled maintenance",
      status: "Approved",
    },
    {
      requester_id: drivers[2].id,
      vehicle_id: vehicles[1].id,
      driver_id: drivers[3].id,
      start_time: addHours(now, -2).toISOString(),
      end_time: addHours(now, 2).toISOString(),
      destination: "Airport Annex",
      purpose: "VIP transfer coordination",
      status: "In Progress",
      start_odometer: 18200,
    },
    {
      requester_id: drivers[3].id,
      vehicle_id: vehicles[2].id,
      driver_id: drivers[0].id,
      start_time: addHours(now, -10).toISOString(),
      end_time: addHours(now, -6).toISOString(),
      destination: "Harbor Logistics",
      purpose: "Completed cargo escort",
      status: "Completed",
      start_odometer: 9250,
      end_odometer: 9330,
    },
    {
      requester_id: drivers[4]?.id ?? drivers[0].id,
      vehicle_id: null,
      driver_id: null,
      start_time: addHours(now, 36).toISOString(),
      end_time: addHours(now, 40).toISOString(),
      destination: "Civic Center",
      purpose: "Transport event materials",
      status: "Pending",
    },
    {
      requester_id: drivers[5]?.id ?? drivers[1].id,
      vehicle_id: vehicles[0].id,
      driver_id: drivers[6]?.id ?? drivers[2].id,
      start_time: addHours(now, 6).toISOString(),
      end_time: addHours(now, 10).toISOString(),
      destination: "Fleet Workshop",
      purpose: "Vehicle inspection follow-up",
      status: "Approved",
    },
    {
      requester_id: drivers[6]?.id ?? drivers[2].id,
      vehicle_id: vehicles[1].id,
      driver_id: drivers[7]?.id ?? drivers[3].id,
      start_time: addHours(now, -4).toISOString(),
      end_time: addHours(now, 1).toISOString(),
      destination: "Command Annex",
      purpose: "Urgent document delivery",
      status: "In Progress",
      start_odometer: 15010,
    },
    {
      requester_id: drivers[7]?.id ?? drivers[3].id,
      vehicle_id: vehicles[2].id,
      driver_id: drivers[8]?.id ?? drivers[0].id,
      start_time: addHours(now, -20).toISOString(),
      end_time: addHours(now, -15).toISOString(),
      destination: "Operations Hub",
      purpose: "Completed overnight dispatch",
      status: "Completed",
      start_odometer: 30400,
      end_odometer: 30485,
    },
  ];

  const { data: inserted, error: insertError } = await supabase
    .from("trips")
    .insert(trips)
    .select("id");

  if (insertError) throw insertError;

  return {
    inserted: inserted?.length ?? 0,
    tripIds: (inserted ?? []).map((row) => row.id),
    adminId: admins[0]?.id ?? null,
  };
}

async function seedAuditLogs(tripIds, adminId) {
  if (!adminId || tripIds.length === 0) return 0;

  const { count, error: countError } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= 6) return 0;

  const now = new Date();
  const logs = tripIds.slice(0, 6).map((tripId, index) => ({
    user_id: adminId,
    action: index % 2 === 0 ? "APPROVED_TRIP" : "CREATED_TRIP",
    entity: "trips",
    entity_id: tripId,
    timestamp: addHours(now, -index).toISOString(),
  }));

  const { error } = await supabase.from("audit_logs").insert(logs);
  if (error) throw error;

  return logs.length;
}

async function main() {
  const profileCount = await seedProfiles();
  const vehicleCount = await seedVehicles();
  const { inserted: tripCount, tripIds, adminId } = await seedTrips();
  const auditCount = await seedAuditLogs(tripIds, adminId);

  console.log(`Seeded ${profileCount} profiles.`);
  console.log(`Seeded ${vehicleCount} vehicles.`);
  console.log(`Seeded ${tripCount} trips.`);
  console.log(`Seeded ${auditCount} audit logs.`);
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
}

main().catch((error) => {
  console.error("Seeding failed:", error.message || error);
  if (error?.details) console.error("Details:", error.details);
  if (error?.hint) console.error("Hint:", error.hint);
  process.exit(1);
});
