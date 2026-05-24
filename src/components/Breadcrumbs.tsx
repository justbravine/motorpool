"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "": "Home",
  home: "Dashboard",
  login: "Sign in",
};

const ROLE_LABELS: Record<string, string> = {
  Admin: "Admin",
  Driver: "Driver",
};

type BreadcrumbsProps = {
  role?: "Admin" | "Driver" | null;
};

export default function Breadcrumbs({ role }: BreadcrumbsProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [{ href: "/", label: "Home" }];

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = LABELS[segment] ?? segment.replace(/-/g, " ");
      crumbs.push({ href, label });
    });

    if (segments[0] === "home" && role) {
      crumbs.push({ href: "/home", label: ROLE_LABELS[role] ?? "Dashboard" });
    }

    return crumbs;
  }, [pathname, role]);

  return (
    <nav
      className="inline-flex items-center rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)]/85 px-3 py-1.5 text-xs text-[color:var(--muted)] shadow-sm backdrop-blur"
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.href}-${item.label}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-0.5 font-semibold text-[color:var(--foreground)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-full px-2 py-0.5 transition-colors hover:text-[color:var(--foreground)]"
                >
                  {item.label}
                </Link>
              )}
              {!isLast && <span className="text-[color:var(--panel-edge)]">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
