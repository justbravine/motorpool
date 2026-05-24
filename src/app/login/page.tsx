"use client";

import AuthCard from "@/components/AuthCard";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center px-6">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Breadcrumbs />
        </div>
        <div className="flex items-center justify-center">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}
