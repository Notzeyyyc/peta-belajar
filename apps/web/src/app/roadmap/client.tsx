"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { StatusBadge, STATUS_META } from "@/components/status";
import { api, type RoadmapDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RoadmapLoader({ id }: { id?: string }) {
  const router = useRouter();
  const { state, retry } = useApiData(
    () =>
      id
        ? api.roadmap(id)
        : api.home().then((h) => {
            if (!h.activeRoadmap) throw new Error("NO_ROADMAP");
            return api.roadmap(h.activeRoadmap.id);
          }),
    [id],
  );

  if (state.kind === "loading") {
    return (
      <AppShell>
        <AppNav />
        <main className="mx-auto max-w-3xl px-5 py-8 md:px-[42px] md:py-12">
          <SkeletonBlock lines={6} />
        </main>
      </AppShell>
    );
  }
  if (state.kind === "error") {
    const noRoadmap = state.message === "NO_ROADMAP";
    return (
      <AppShell>
        <AppNav />
        <main className="mx-auto max-w-3xl px-5 py-8 md:px-[42px] md:py-12">
          {noRoadmap ? (
            <EmptyState
              title="Belum ada peta belajar"
              description="Tanya AI dulu untuk menggambar peta pertamamu."
              action={
                <button
                  onClick={() => router.push("/tanya")}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Tanya AI
                </button>
              }
            />
          ) : (
            <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
          )}
        </main>
      </AppShell>
    );
  }
  return <RoadmapView detail={state.data} />;
}

function RoadmapView({ detail }: { detail: RoadmapDetail }) {
  const comps = [...detail.competencies].sort((a, b) => a.position - b.position);
  const firstGap = comps.find((c) => c.status === "gap" && !c.completed) ?? null;

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-[42px] md:py-12">
        <h1 className="text-[32px] leading-[1.1] tracking-[-1px] text-ink">
          {detail.roadmap.title}
        </h1>
        <p className="mt-2 text-sm text-ink-2">{detail.roadmap.summary}</p>

        {firstGap && (
          <div className="mt-6">
            <Link
              href={`/roadmap/${detail.roadmap.id}/materi/${firstGap.id}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
            >
              Mulai dari sini
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="mt-2 text-xs font-semibold text-ink-2">
              Gap pertamamu: {firstGap.name}
            </p>
          </div>
        )}

        {/* Jalur vertikal — satu-satunya layar dengan warna status, selalu dengan label + ikon */}
        <ol aria-label="Jalur kompetensi" className="relative mt-10 space-y-0">
          {comps.map((c, i) => {
            const meta = STATUS_META[c.status];
            const isFirstGap = firstGap?.id === c.id;
            return (
              <li key={c.id} className="relative flex gap-4 pb-8">
                {/* Garis jalur */}
                {i < comps.length - 1 && (
                  <span aria-hidden className="absolute left-[19px] top-10 h-full w-0.5 bg-line" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card",
                    meta.className,
                  )}
                >
                  <meta.Icon className="h-6 w-6" aria-hidden />
                </span>
                <div
                  className={cn(
                    "flex-1 rounded-card bg-card p-5",
                    isFirstGap && "outline outline-2 outline-dark",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-bold text-ink">
                      {i + 1}. {c.name}
                      {c.completed && <span className="sr-only"> (selesai)</span>}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-2">{c.description}</p>
                  <p className="mt-2 text-sm text-ink-2">
                    <span className="font-semibold text-ink">Kenapa: </span>
                    {c.reason}
                  </p>
                  <p className="mt-2 text-sm text-ink">
                    <span className="font-semibold">Langkah berikutnya: </span>
                    {c.nextAction}
                  </p>
                  <Link
                    href={`/roadmap/${detail.roadmap.id}/materi/${c.id}`}
                    className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
                  >
                    Lihat materi
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </AppShell>
  );
}
