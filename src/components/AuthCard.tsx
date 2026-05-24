"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FleetLogo from "@/components/FleetLogo";

type AuthCardProps = {
  showClose?: boolean;
  onClose?: () => void;
};

export default function AuthCard({
  showClose = false,
  onClose,
}: AuthCardProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"Admin" | "Driver">("Driver");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/home");
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        role,
        full_name: fullName || email.split("@")[0],
      });

      if (profileError) {
        setLoading(false);
        setError(profileError.message);
        return;
      }
    }

    setLoading(false);
    router.push("/home");
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-8 shadow-lg relative">
      <div className="absolute right-5 top-5 flex items-center gap-2">
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="space-y-3 text-center flex flex-col items-center">
        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-sm flex items-center justify-center mb-2 transition-transform duration-500 hover:scale-110 hover:-rotate-12">
          <FleetLogo className="w-10 h-10" />
        </div>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold">
          Fleet Command
        </p>
        <h1 className="text-2xl font-semibold text-[color:var(--foreground)] font-display">
          {mode === "login" ? "Sign in to dispatch" : "Create your account"}
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          {mode === "login"
            ? "Use your credentials to access your role dashboard."
            : "Choose a role to start managing assignments."}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--muted)]">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]"
              placeholder="e.g. Ama Kofi"
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[color:var(--muted)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]"
            placeholder="name@agency.gov"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[color:var(--muted)]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]"
            placeholder="********"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>
        {mode === "signup" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--muted)]">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "Admin" | "Driver")}
              className="w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]"
            >
              <option value="Driver">Driver</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-70"
        >
          {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[color:var(--muted)]">
        {mode === "login" ? "New here?" : "Already have access?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
