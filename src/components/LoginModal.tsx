"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function LoginModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = useMemo(() => searchParams.get("login") === "1", [searchParams]);

  if (!isOpen) return null;

  const handleClose = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("login");
    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `/?${nextQuery}` : "/");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <AuthCard showClose onClose={handleClose} showThemeToggle={false} />
      </div>
    </div>
  );
}
