import { z } from "zod";

// --- Enums ---
export const RoleSchema = z.enum(["Admin", "Driver", "Officer"]);
export const LicenseStatusSchema = z.enum(["Valid", "Expired", "None"]);
export const VehicleStatusSchema = z.enum(["Available", "In Transit", "Needs Maintenance"]);
export const TripStatusSchema = z.enum(["Pending", "Approved", "In Progress", "Completed", "Rejected"]);

// --- Schemas ---
export const UserSchema = z.object({
  id: z.string().uuid(),
  role: RoleSchema,
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  driver_license_status: LicenseStatusSchema.default("None"),
});
export type User = z.infer<typeof UserSchema>;

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  plate_number: z.string().regex(/^GK \d{3}[A-Z]$/, "Must be in GK 123A format"),
  capacity: z.number().int().positive(),
  status: VehicleStatusSchema.default("Available"),
  current_mileage: z.number().int().nonnegative().default(0),
  maintenance_threshold: z.number().int().positive().default(5000),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const TripSchema = z.object({
  id: z.string().uuid(),
  requester_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional(),
  driver_id: z.string().uuid().nullable().optional(),
  start_time: z.date(),
  end_time: z.date(),
  destination: z.string().min(2, "Destination is required"),
  purpose: z.string().min(5, "Please provide a detailed purpose"),
  status: TripStatusSchema.default("Pending"),
  start_odometer: z.number().int().nonnegative().optional(),
  end_odometer: z.number().int().nonnegative().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});
export type Trip = z.infer<typeof TripSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.string(),
  entity: z.string(),
  entity_id: z.string().uuid(),
  timestamp: z.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;