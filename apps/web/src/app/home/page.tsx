"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Clock } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { ProgressBar } from "@/components/status";
import { api } from "@/lib/api";

export default function HomePage() {
  const { state, retry } = useApiData(() => api.home());

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-5xl px-5 py-8 md:px-[42px] md:py-12">
        {state.kind === "loading" && (
          <div className="space-y-6">
            <SkeletonBlock lines={2} />
            <SkeletonBlock lines={4} />
          </div>
        )}
        {state.kind === "error" && (
          <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
        )}
        {state.kind === "ready" && (
          <HomeContent
            name={state.data.user.displayName}
            roadmap={state.data.activeRoadmap}
            resources={state.data.nextResources}
          />
        )}
      </main>
    </AppShell>
  );
}

function HomeContent({
  name,
  roadmap,
  resources,
}: {
  name: string;
  roadmap: import("@/lib/api").RoadmapSummary | null;
  resources: import("@/lib/api").ApiResource[];
}) {
  return (
    <>
      <h1 className="text-[32px] leading-[1.1] tracking-[-1px] text-ink md:text-[42px]">
        Halo, <span className="font-extrabold">{name}</span>!
      </h1>
      <p className="mt-2 text-sm text-ink-2">Ini kelanjutan perjalanan belajarmu.</p>

      <section aria-label="Roadmap aktif" className="mt-8">
        {!roadmap ? (
          <EmptyState
            title="Kamu belum punya peta belajar"
            description="Ceritakan tujuanmu ke AI, dan dia akan menggambar petanya untukmu."
            action={
              <Link
                href="/tanya"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Tanya AI sekarang
              </Link>
            }
          />
        ) : (
          <div className="rounded-card bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-ink">{roadmap.title}</h2>
                <p className="mt-1 text-sm text-ink-2">{roadmap.summary}</p>
              </div>
              <Link
                href={`/roadmap/${roadmap.id}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-5 py-2.5 text-sm font-bold text-inverse hover:bg-dark-elev"
              >
                Buka peta
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-2">
                <span>
                  {roadmap.completedCount} dari {roadmap.totalCount} langkah selesai
                </span>
                <span>{roadmap.progressPct}%</span>
              </div>
              <div className="mt-2">
                <ProgressBar pct={roadmap.progressPct} />
              </div>
            </div>
          </div>
        )}
      </section>

      {roadmap && (
        <section aria-label="Materi untukmu" className="mt-8">
          <h2 className="text-lg font-extrabold text-ink">Materi untuk langkah berikutnya</h2>
          {resources.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Belum ada materi"
                description="Materi akan muncul setelah kamu mulai mengerjakan langkah di petamu."
              />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {resources.map((r, i) => (
                <li key={r.id} className="rounded-card bg-card p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
                    <BookOpen className="h-4 w-4" aria-hidden />
                    {r.type}
                    <span aria-hidden>·</span>
                    <Clock className="h-4 w-4" aria-hidden />
                    {r.durationMinutes} menit
                  </div>
                  <p className="mt-2 text-[15px] font-bold text-ink">{r.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{r.description}</p>
                  <div className="mt-3" aria-hidden>
                    <ProgressBar pct={0} index={i} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-10">
        <Link
          href="/tanya"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Tanya AI
        </Link>
      </div>
    </>
  );
}
