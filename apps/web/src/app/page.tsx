"use client";

import Link from "next/link";
import { Map, Sparkles, ArrowRight } from "lucide-react";
import { useApiData, SkeletonBlock, ErrorState } from "@/components/async";
import { STATUS_META } from "@/components/status";
import { api } from "@/lib/api";

export default function LandingPage() {
  const { state, retry } = useApiData(() => api.example());

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-6">
      <section className="w-full max-w-3xl rounded-frame bg-window p-6 md:p-[42px]">
        <div className="flex items-center gap-2 text-ink-2">
          <Map className="h-5 w-5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Peta Belajar</span>
        </div>
        <h1 className="mt-6 text-[42px] leading-[1.04] tracking-[-2px] text-ink md:text-[60px]">
          Ubah tujuan belajarmu jadi{" "}
          <span className="font-extrabold">peta langkah yang jelas</span>.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-[1.6] text-ink-2">
          AI bertanya singkat untuk memahami tujuanmu, lalu membuat peta kompetensi dengan status
          kuasai, setengah, atau gap — satu langkah berikutnya yang jelas setiap kali.
        </p>

        {/* Contoh peta statis dari API */}
        <div className="mt-8" aria-label="Contoh peta belajar">
          {state.kind === "loading" && <SkeletonBlock lines={4} />}
          {state.kind === "error" && (
            <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
          )}
          {state.kind === "ready" && (
            <ul className="space-y-3">
              {state.data.example.competencies.map((c) => {
                const meta = STATUS_META[c.status];
                return (
                  <li
                    key={c.name}
                    className="flex items-center justify-between gap-3 rounded-card bg-card p-5"
                  >
                    <div>
                      <span className="text-[15px] font-bold text-ink">{c.name}</span>
                      <p className="mt-0.5 text-xs text-ink-2">{c.reason}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-semibold ${meta.className} bg-window`}
                    >
                      <meta.Icon className="h-4 w-4" aria-hidden />
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse transition-colors hover:bg-dark-elev"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Buat petaku
          </Link>
          <a
            href="#contoh"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector('[aria-label="Contoh peta belajar"]')
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-card px-6 py-3.5 text-[15px] font-bold text-ink transition-colors hover:bg-line"
          >
            Lihat contoh
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>
    </main>
  );
}
