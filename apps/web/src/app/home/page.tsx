"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Map as MapIcon,
  MessageCircleQuestion,
  Target,
} from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { ProgressBar, NodeStatusPill, NODE_STATUS_META } from "@/components/status";
import { api, type RoadmapSummary, type RoadmapDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { state, retry } = useApiData(() => api.home());
  const roadmapId = state.kind === "ready" ? state.data.activeRoadmap?.id : undefined;
  const { state: detailState } = useApiData(
    () => (roadmapId ? api.roadmap(roadmapId) : Promise.resolve(null)),
    [roadmapId],
  );

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
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
            detail={detailState.kind === "ready" ? detailState.data : null}
          />
        )}
      </main>
    </AppShell>
  );
}

function HomeContent({
  name,
  roadmap,
  detail,
}: {
  name: string;
  roadmap: RoadmapSummary | null;
  detail: RoadmapDetail | null;
}) {
  return (
    <>
      <h1 className="text-[32px] leading-[1.1] tracking-[-1px] text-ink md:text-[42px]">
        Halo, <span className="font-extrabold">{name}</span>!
      </h1>
      <p className="mt-2 text-sm text-ink-2">Ini kelanjutan perjalanan belajarmu.</p>

      {!roadmap ? (
        <section aria-label="Roadmap aktif" className="mt-8">
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
        </section>
      ) : (
        <>
          <section aria-label="Peta aktif" className="mt-8 rounded-card bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-lg font-extrabold text-ink">
                <Target className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">Peta aktif: {roadmap.title}</span>
              </h2>
              <Link
                href={`/roadmap/${roadmap.id}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-window px-5 py-2.5 text-center text-sm font-bold text-ink hover:bg-line"
              >
                Lihat detail
              </Link>
            </div>
            <div className="mt-4">
              <ProgressBar pct={roadmap.progressPct} status="master" />
              <p className="mt-2 text-sm text-ink-2">
                {roadmap.completedCount} dari {roadmap.totalCount} kompetensi dikuasai
              </p>
            </div>
          </section>

          {detail && <RoadmapTrack detail={detail} />}
        </>
      )}

      <section aria-label="Langkah berikutnya" className="mt-10">
        <h2 className="text-lg font-extrabold text-ink">Langkah berikutnya</h2>
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-4 rounded-card bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-window text-ink">
              <MessageCircleQuestion className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-ink">Ada yang bikin bingung?</p>
              <p className="text-sm text-ink-2">
                Tanya AI — dia membimbing, bukan memberi jawaban
              </p>
            </div>
            <Link
              href="/tanya"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-pill bg-window px-5 py-2.5 text-center text-sm font-bold text-ink hover:bg-line"
            >
              Tanya
            </Link>
          </div>
          <div className="flex flex-col gap-4 rounded-card bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-window text-ink">
              <MapIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-ink">Lihat semua petamu</p>
              <p className="text-sm text-ink-2">Semua peta belajar yang pernah kamu simpan</p>
            </div>
            <Link
              href="/roadmap"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-pill bg-window px-5 py-2.5 text-center text-sm font-bold text-ink hover:bg-line"
            >
              Buka peta
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Jalur roadmap visual "Petamu saat ini" — node done/half/gap/locked ala mockup/home.html. */
function RoadmapTrack({ detail }: { detail: RoadmapDetail }) {
  const comps = [...detail.competencies].sort((a, b) => a.position - b.position);
  // Locked: gap pertama yang belum selesai dan semua gap setelahnya.
  const firstOpenGapIdx = comps.findIndex((c) => c.status === "gap" && !c.completed);
  const active = comps.find((c) => c.status === "half" && !c.completed) ?? null;

  const nodeStatus = (i: number) => {
    const c = comps[i];
    if (c.status === "gap" && firstOpenGapIdx !== -1 && i >= firstOpenGapIdx) return "locked";
    return c.status;
  };

  return (
    <section aria-label="Petamu saat ini" className="mt-10">
      <h2 className="text-lg font-extrabold text-ink">Petamu saat ini</h2>
      <ol className="relative mt-4 space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-line">
        {comps.map((c, i) => {
          const status = nodeStatus(i);
          const meta = NODE_STATUS_META[status];
          const isActive = active?.id === c.id;
          return (
            <li key={c.id} className="relative flex gap-4">
              <span
                aria-hidden
                className={cn(
                  "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card",
                  meta.className,
                )}
              >
                <meta.Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 rounded-card bg-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "min-w-0 truncate text-[15px] font-bold",
                      status === "locked" ? "text-ink-2" : "text-ink",
                    )}
                  >
                    {c.name}
                  </p>
                  <NodeStatusPill status={status} />
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {c.resources.length} materi
                  {status === "locked" && " · selesaikan langkah sebelumnya dulu ya"}
                </p>
                {isActive && (
                  <Link
                    href={`/roadmap/${detail.roadmap.id}/materi/${c.id}`}
                    className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pill bg-dark px-5 py-2.5 text-center text-sm font-bold text-inverse hover:bg-dark-elev sm:w-auto"
                  >
                    <span className="truncate">Lanjutkan: {c.nextAction}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
