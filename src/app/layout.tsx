import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import FleetLogo from "@/components/FleetLogo";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fleet Command | Motorpool Dispatch",
  description: "Government motorpool dispatch console for driver approvals, trip scheduling, and fleet availability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative px-[0.5cm]">
        {children}
        <footer className="mt-auto w-full p-4 md:p-6 lg:p-8 z-10">
          <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border border-[color:var(--panel-edge)] bg-gradient-to-b from-[color:var(--panel-strong)]/90 to-[color:var(--panel)]/90 backdrop-blur-2xl shadow-2xl shadow-emerald-900/5">
            {/* Subtle glow effects in the corners */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 px-6 py-8 md:px-12 lg:py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8 md:gap-8 relative">
                {/* Subtle vertical separators for desktop */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[color:var(--panel-edge)] to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FleetLogo className="w-6 h-6 grayscale opacity-80" />
                  <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] font-semibold">Fleet Command</span>
                </div>
                <h4 className="text-lg font-semibold text-[color:var(--foreground)] font-display">
                  Trusted Motorpool Ops
                </h4>
                <p className="text-sm text-[color:var(--muted)]">
                  Mission-ready logistics with real-time oversight and audited dispatch.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)] border border-[color:var(--panel-edge)]">
                  Status: Operational
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-[color:var(--foreground)]">Legal + Social</h5>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                  <li><a className="hover:text-[color:var(--foreground)]" href="#">Privacy</a></li>
                  <li><a className="hover:text-[color:var(--foreground)]" href="#">Terms</a></li>
                  <li><a className="hover:text-[color:var(--foreground)]" href="#">Compliance</a></li>
                  <li><a className="hover:text-[color:var(--foreground)]" href="#">Contact</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 md:mt-12 flex flex-col gap-3 border-t border-[color:var(--panel-edge)] pt-4 md:pt-6 text-[10px] sm:text-xs text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between relative z-10 text-center sm:text-left">
              <span>© 2026 Fleet Command. All rights reserved.</span>
              <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
                <span>Uptime: 99.98%</span>
                <span>Region: Central Ops</span>
              </div>
            </div>
          </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
