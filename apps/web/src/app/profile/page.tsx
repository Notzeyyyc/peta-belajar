"use client";

import Link from "next/link";
import { User, ArrowRight } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { ProgressBar } from "@/components/status";
import { api } from "@/lib/api";

const STYLE_LABEL: Record<string, string> = {
  visual: "Visual — kamu suka belajar lewat gambar dan video",
  audio: "Audio — kamu suka belajar sambil mendengar",
  reading: "Membaca — kamu suka belajar lewat teks langkah demi langkah",
  practice: "Praktik — kamu suka langsung mencoba membuat sesuatu",
};

export default function ProfilePage() {
  const { state, retry } = useApiData(() => api.profile());

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-[42px] md:py-12">
        {state.kind === "loading" && <SkeletonBlock lines={6} />}
        {state.kind === "error" && (
          <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
        )}
        {state.kind === "ready" && (
          <>
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="flex h-16 w-16 items-center justify-center rounded-full bg-card"
              >
                <User className="h-8 w-8 text-ink" aria-hidden />
              </span>
              <div>
                <h1 className="text-[32px] leading-[1.1] tracking-[-1px] text-ink">
                  {state.data.user.displayName}
                </h1>
                <p className="text-sm text-ink-2">
                  {STYLE_LABEL[state.data.learningStyle ?? ""] ?? "Gaya belajar belum diatur"}
                </p>
              </div>
            </div>

            {/* Statistik kumulatif */}
            <section aria-label="Statistik belajar" className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: "Gap kumulatif", value: state.data.stats.cumulativeGap },
                { label: "Langkah selesai", value: state.data.stats.completed },
                { label: "Total langkah", value: state.data.stats.total },
              ].map((s, i) => (
                <div key={s.label} className="rounded-card bg-card p-4 text-center">
                  <p className="text-[28px] font-extrabold text-ink">{s.value}</p>
                  <p className="text-xs font-semibold text-ink-2">{s.label}</p>
                  <div className="mt-2" aria-hidden>
                    <ProgressBar
                      pct={
                        state.data.stats.total
                          ? Math.round((s.value / Math.max(state.data.stats.total, 1)) * 100)
                          : 0
                      }
                      index={i}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Roadmap tersimpan */}
            <section aria-label="Roadmap tersimpan" className="mt-10">
              <h2 className="text-lg font-extrabold text-ink">Peta belajarmu</h2>
              {state.data.roadmaps.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Belum ada peta tersimpan"
                    description="Peta yang kamu buat bersama AI akan tersimpan di sini."
                    action={
                      <Link
                        href="/tanya"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
                      >
                        Buat petaku
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {state.data.roadmaps.map((r, i) => (
                    <li key={r.id} className="rounded-card bg-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-bold text-ink">{r.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-ink-2">
                            {r.completedCount}/{r.totalCount} selesai · {r.gapCount} gap ·{" "}
                            {r.halfCount} setengah
                          </p>
                        </div>
                        <Link
                          href={`/roadmap/${r.id}`}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
                        >
                          Buka
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </div>
                      <div className="mt-3">
                        <ProgressBar pct={r.progressPct} index={i} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
