"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Camera, FileCheck2, Phone, ShieldCheck, User } from "lucide-react";
import { getAuthedUserId, getDriverProfile, uploadDriverDocument, upsertDriverProfile } from "@/lib/mockDb";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Phone number is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(5, "Address is required").optional().or(z.literal("")),
  licenseNumber: z.string().min(4, "License number is required"),
  licenseClass: z.string().optional().or(z.literal("")),
  licenseExpiry: z.coerce.date({ message: "License expiry is required" }),
  passportNumber: z.string().optional().or(z.literal("")),
  emergencyName: z.string().min(2, "Emergency contact name is required"),
  emergencyPhone: z.string().min(7, "Emergency contact phone is required"),
  passportPhoto: z.any().optional(),
  licensePhoto: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function DriverAccountSection() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [passportPath, setPassportPath] = useState<string | null>(null);
  const [licensePath, setLicensePath] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
  });

  const [userId, setUserId] = useState<string | null>(null);

  const passportFiles = watch("passportPhoto");
  const licenseFiles = watch("licensePhoto");

  const passportFile = useMemo(() => passportFiles?.[0] as File | undefined, [passportFiles]);
  const licenseFile = useMemo(() => licenseFiles?.[0] as File | undefined, [licenseFiles]);

  useEffect(() => {
    if (!passportFile) {
      setPassportPreview(null);
      return;
    }

    const url = URL.createObjectURL(passportFile);
    setPassportPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [passportFile]);

  useEffect(() => {
    if (!licenseFile) {
      setLicensePreview(null);
      return;
    }

    const url = URL.createObjectURL(licenseFile);
    setLicensePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [licenseFile]);

  // Auto-dismiss toast message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        const authedUserId = await getAuthedUserId();
        if (!isActive) return;
        setUserId(authedUserId);

        const data = await getDriverProfile(authedUserId);
        if (!isActive || !data) return;

        reset({
          fullName: data.full_name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          licenseNumber: data.license_number ?? "",
          licenseClass: data.license_class ?? "",
          licenseExpiry: data.license_expiry ? new Date(data.license_expiry) : undefined,
          passportNumber: data.passport_number ?? "",
          emergencyName: data.emergency_name ?? "",
          emergencyPhone: data.emergency_phone ?? "",
        });
        setPassportPath(data.passport_photo_path ?? null);
        setLicensePath(data.license_photo_path ?? null);
      } catch {
        if (isActive) {
          setMessage({ type: "error", text: "Unable to load profile data." });
        }
      } finally {
        if (isActive) setIsLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setMessage(null);

    try {
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const uploadedPassportPath = passportFile
        ? await uploadDriverDocument(userId, passportFile, "passport")
        : null;
      const uploadedLicensePath = licenseFile
        ? await uploadDriverDocument(userId, licenseFile, "license")
        : null;

      const nextPassportPath = uploadedPassportPath ?? passportPath;
      const nextLicensePath = uploadedLicensePath ?? licensePath;

      await upsertDriverProfile({
        id: userId,
        full_name: data.fullName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        license_number: data.licenseNumber,
        license_class: data.licenseClass || null,
        license_expiry: data.licenseExpiry.toISOString(),
        passport_number: data.passportNumber || null,
        emergency_name: data.emergencyName,
        emergency_phone: data.emergencyPhone,
        passport_photo_path: nextPassportPath,
        license_photo_path: nextLicensePath,
      });

      setPassportPath(nextPassportPath);
      setLicensePath(nextLicensePath);

      setMessage({
        type: "success",
        text: "Profile saved successfully.",
      });
      setIsCollapsed(true);
    } catch {
      setMessage({ type: "error", text: "Unable to save profile. Please try again." });
    }
  };

  return (
    <section className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 md:p-6 shadow-lg glass-panel">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[color:var(--panel-edge)] pb-3 mb-5 gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700 font-semibold">Driver profile</p>
          <h2 className="text-xl md:text-2xl font-semibold text-[color:var(--foreground)] font-display">Account Details</h2>
          {message?.type === "success" && (
            <p className="text-xs text-emerald-700 font-semibold">Saved just now</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={14} /> Verified identity
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(current => !current)}
            aria-expanded={!isCollapsed}
            className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] transition hover:border-emerald-400"
          >
            {isCollapsed ? "Edit profile" : "Minimize"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-6 py-4 shadow-xl text-sm font-semibold animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div
        className={`transition-[max-height,opacity] duration-300 ease-out overflow-hidden ${
          isCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[3000px] opacity-100"
        }`}
        aria-hidden={isCollapsed}
      >
        {isLoadingProfile ? (
          <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-6 text-sm text-[color:var(--muted)]">
            Loading profile data...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--muted)] font-semibold">Identity</p>
              <span className="text-[11px] text-[color:var(--muted)]">Required</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ama Kofi"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("fullName")}
                />
                {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">Phone number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. +233 55 123 4567"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("phone")}
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@agency.gov"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[color:var(--muted)]">Base address</label>
                <input
                  type="text"
                  autoComplete="street-address"
                  placeholder="Agency Motorpool, Accra"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("address")}
                />
                {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-[color:var(--panel-edge)] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--muted)] font-semibold">License</p>
              <span className="text-[11px] text-[color:var(--muted)]">Required</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">License number</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="DL-239104"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("licenseNumber")}
                />
                {errors.licenseNumber && <p className="mt-1 text-xs text-rose-600">{errors.licenseNumber.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">License class</label>
                <input
                  type="text"
                  placeholder="Class C"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("licenseClass")}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">License expiry</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("licenseExpiry")}
                />
                {errors.licenseExpiry && <p className="mt-1 text-xs text-rose-600">{errors.licenseExpiry.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-[color:var(--panel-edge)] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--muted)] font-semibold">Emergency</p>
              <span className="text-[11px] text-[color:var(--muted)]">Required</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[color:var(--muted)]">Passport number</label>
                <input
                  type="text"
                  placeholder="G1234567"
                  className="mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  {...register("passportNumber")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[color:var(--muted)]">Emergency contact</label>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Contact name"
                    className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    {...register("emergencyName")}
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Contact phone"
                    className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    {...register("emergencyPhone")}
                  />
                </div>
                {(errors.emergencyName || errors.emergencyPhone) && (
                  <p className="mt-1 text-xs text-rose-600">Both emergency contact fields are required.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-[color:var(--panel-edge)] pt-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--muted)] font-semibold">Documents</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                    <Camera size={16} /> Passport photo
                  </div>
                  <span className="text-[11px] text-[color:var(--muted)]">JPG/PNG</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-xs text-[color:var(--muted)]"
                  {...register("passportPhoto")}
                />
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)]">
                    {passportPreview ? (
                      <img src={passportPreview} alt="Passport preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[color:var(--muted)]">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--muted)]">Clear, front-facing headshot.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                    <FileCheck2 size={16} /> Driver license photo
                  </div>
                  <span className="text-[11px] text-[color:var(--muted)]">Front side</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-xs text-[color:var(--muted)]"
                  {...register("licensePhoto")}
                />
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)]">
                    {licensePreview ? (
                      <img src={licensePreview} alt="License preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[color:var(--muted)]">
                        <BadgeCheck size={18} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--muted)]">Readable image for validation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[color:var(--panel-edge)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[color:var(--muted)] text-center sm:text-left">
              Sensitive documents are only visible to dispatch supervisors.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 sm:py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-70"
            >
              <Phone size={14} /> Save profile
            </button>
          </div>
        </form>
        )}
      </div>

      <div
        className={`transition-[max-height,opacity] duration-300 ease-out overflow-hidden ${
          isCollapsed ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isCollapsed}
      >
        <div className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-3 text-sm text-[color:var(--muted)]">
          Profile saved. Select "Edit profile" to make changes.
        </div>
      </div>
    </section>
  );
}
