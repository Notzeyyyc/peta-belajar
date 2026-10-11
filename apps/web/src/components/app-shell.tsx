"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, MessageCircleQuestion, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/roadmap", label: "Peta", icon: MapIcon },
  { href: "/tanya", label: "Tanya", icon: MessageCircleQuestion },
  { href: "/profile", label: "Profil", icon: User },
];

const topItems = items.slice(0, 3); // Beranda / Peta / Tanya AI

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navigasi utama: top nav di >=768px, bottom nav 4 item di mobile. */
export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top nav — desktop */}
      <nav
        aria-label="Navigasi utama"
        className="sticky top-0 z-50 hidden border-b border-line bg-window md:block"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-[42px] py-3">
          <Link
            href="/home"
            className="flex min-h-[44px] items-center gap-2 font-extrabold text-ink"
          >
            <MapIcon className="h-5 w-5" aria-hidden />
            Peta Belajar
          </Link>
          <div className="flex items-center gap-1">
            {topItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive(pathname, href)
                    ? "bg-dark text-inverse"
                    : "text-ink-2 hover:bg-card",
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/profile"
              aria-label="Profil"
              aria-current={isActive(pathname, "/profile") ? "page" : undefined}
              className={cn(
                "ml-2 flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold transition-colors",
                isActive(pathname, "/profile")
                  ? "bg-dark text-inverse"
                  : "bg-card text-ink hover:bg-line",
              )}
            >
              <User className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom nav — mobile (home, map, message-circle-question, user) */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-line bg-window md:hidden"
      >
        <div className="grid h-full grid-cols-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold",
                  active ? "text-ink" : "text-ink-2",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "rounded-full bg-dark p-0.5 text-inverse")}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** Bingkai "mint window" di atas dark canvas — radius 40 desktop / 28 mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas md:p-6">
      <div className="mx-auto min-h-screen w-full max-w-6xl rounded-frame-sm bg-window max-md:min-h-[calc(100dvh)] md:min-h-[calc(100vh-3rem)] md:rounded-frame">
        {children}
      </div>
    </div>
  );
}
