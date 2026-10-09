"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/tanya", label: "Tanya AI", icon: Sparkles },
  { href: "/roadmap", label: "Roadmap", icon: MapIcon },
  { href: "/profile", label: "Profil", icon: User },
];

/** Navigasi utama: top nav di >=768px, bottom nav di mobile (375px). */
export function AppNav({ hasRoadmap }: { hasRoadmap?: boolean }) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.href !== "/roadmap" || hasRoadmap !== false);

  const linkClass = (href: string) =>
    cn(
      "flex min-h-[44px] items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors",
      pathname.startsWith(href) ? "bg-dark text-inverse" : "text-ink-2 hover:bg-card",
    );

  return (
    <>
      {/* Top nav — desktop */}
      <nav
        aria-label="Navigasi utama"
        className="sticky top-0 z-10 hidden bg-window/100 md:block"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-[42px] py-3">
          <Link href="/home" className="flex min-h-[44px] items-center gap-2 font-extrabold text-ink">
            <MapIcon className="h-5 w-5" aria-hidden />
            Peta Belajar
          </Link>
          <div className="flex gap-1">
            {visible.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom nav — mobile */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-window md:hidden"
      >
        <div className="grid grid-cols-4">
          {visible.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold",
                pathname.startsWith(href) ? "text-ink" : "text-ink-2",
              )}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

/** Bingkai "mint window" di atas dark canvas — frame 40px di desktop, 1 kolom di mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas pb-20 md:pb-0 md:p-6">
      <div className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-6xl bg-window md:rounded-frame">
        {children}
      </div>
    </div>
  );
}
