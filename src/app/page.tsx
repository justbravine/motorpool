import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Truck, Users, ShieldCheck } from "lucide-react";
import FleetLogo from "@/components/FleetLogo";
import LiveQueue from "@/components/LiveQueue";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  return (
    <div className="min-h-screen font-sans relative app-shell flex flex-col bg-[color:var(--background)]">
      <nav className="absolute top-0 left-0 right-0 z-50 mt-[0.3cm] p-3 sm:mt-0 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between rounded-full border border-transparent transition-all duration-500 hover:bg-[color:var(--panel)]/95 hover:backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-500/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-emerald-500/10 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-emerald-500/20 shadow-sm flex items-center justify-center transition-transform duration-500 hover:scale-110 hover:-rotate-12">
              <FleetLogo className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="font-bold text-[color:var(--foreground)] text-base sm:text-xl tracking-tight leading-none">Fleet Command</h1>
              <p className="text-[8px] sm:text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold mt-0.5 sm:mt-1">Vehicle Assignment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/?login=1"
              className="rounded-full bg-emerald-700 text-white px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-emerald-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 -mx-[0.5cm] sm:mx-0">
        <section className="relative min-h-screen overflow-hidden">
          {/* Wrapper: Limit height on mobile to prevent extreme cropping, full screen on desktop */}
          <div className="absolute inset-0 h-[70vh] md:h-auto">
            <Image
              src="/images/2.png"
              alt="Fleet operations"
              fill
              className="object-cover object-[75%_center] md:object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--panel)]/95 via-[color:var(--panel)]/70 to-[color:var(--panel)]/30" />
            <div className="absolute inset-0 bg-black/20" />
            {/* Fade out bottom of image to blend seamlessly with the page background and next sections */}
            <div className="absolute inset-x-0 bottom-0 h-56 sm:h-64 lg:h-80 bg-gradient-to-t from-[color:var(--background)] via-[color:var(--background)]/80 to-transparent pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-6 md:px-12 py-20 md:py-28 flex flex-col min-h-screen">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-4 md:space-y-6 pt-[2cm]">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-[color:var(--foreground)] tracking-tight font-display">
                  Assign vehicles fast, keep drivers moving.
                </h2>
                <p className="text-[color:var(--muted)] text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl">
                  Track who has a vehicle, who has completed a run, and who is next in line. A simple dispatch flow
                  that keeps 10 cars serving 20 people without confusion.
                </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-[0.25cm] md:pt-[0.5cm]">
                  <Link
                    href="/?login=1"
                    className="w-full sm:w-auto text-center rounded-full bg-emerald-700 text-white px-6 py-3 text-sm font-semibold shadow-sm hover:bg-emerald-800"
                  >
                    Start dispatching
                  </Link>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto text-center rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)] px-6 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-sm"
                  >
                    How it works
                  </a>
                </div>
              </div>

              <div className="relative lg:justify-self-end">
                <div className="rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)]/90 p-6 shadow-xl backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] font-semibold">Live queue</p>
                      <span className="text-xs font-semibold text-emerald-700">Today</span>
                    </div>
                    <LiveQueue />
                  </div>
                </div>
              </div>
            </div>

            <section id="how-it-works" className="mt-auto pt-12 md:pt-20 grid gap-4 md:gap-6 md:grid-cols-3">
              {[
                { icon: Truck, title: "Assign vehicles", text: "Dispatchers match available cars to the next driver." },
                { icon: Users, title: "Track turnover", text: "Drivers close a run and return vehicles for reassignment." },
                { icon: ShieldCheck, title: "Stay accountable", text: "Every assignment is logged with a clear audit trail." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl md:rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)]/90 p-4 md:p-6 shadow-sm backdrop-blur flex md:block items-center gap-4 md:gap-0">
                    <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl md:rounded-2xl bg-[color:var(--accent-soft)] text-emerald-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h3 className="mt-0 md:mt-4 text-sm sm:text-base md:text-lg font-semibold text-[color:var(--foreground)]">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-[color:var(--muted)] mt-0.5 md:mt-2">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        </section>
      </main>
      <Suspense fallback={null}>
        <LoginModal />
      </Suspense>
    </div>
  );
}
