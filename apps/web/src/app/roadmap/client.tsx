"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Hash, Divide, Ruler, ArrowLeft } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import {
  ProgressBar,
  NodeStatusPill,
  NODE_STATUS_META,
  MAP_STATUS_META,
  type NodeStatus,
  type MapStatus,
} from "@/components/status";
import { api, type RoadmapSummary, type RoadmapDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Ikon netral per peta (JANGAN ikon x — ambigu dengan tombol tutup). */
const MAP_ICONS = [Hash, Divide, Ruler];

export function RoadmapList() {
  const { state, retry } = useApiData(() => api.profile());

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
        <h1 className="text-[32px] leading-[1.1] tracking-[-1px] text-ink md:text-[42px]">
          Peta belajarmu
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Semua peta kompetensi yang pernah kamu buat. Kamu bisa mengeditnya kapan saja.
        </p>
        <div className="mt-6">
          <Link
            href="/tanya"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-center text-[15px] font-bold text-inverse hover:bg-dark-elev"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Buat peta baru
          </Link>
        </div>

        <div className="mt-8">
          {state.kind === "loading" && <SkeletonBlock lines={5} />}
          {state.kind === "error" && (
            <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
          )}
          {state.kind === "ready" &&
            (state.data.roadmaps.length === 0 ? (
              <EmptyState
                title="Belum ada peta belajar"
                description="Tanya AI dulu untuk menggambar peta pertamamu."
              />
            ) : (
              <ul className="space-y-3">
                {state.data.roadmaps.map((r, i) => (
                  <RoadmapRow key={r.id} roadmap={r} icon={MAP_ICONS[i % MAP_ICONS.length]} />
                ))}
              </ul>
            ))}
        </div>
      </main>
    </AppShell>
  );
}

function RoadmapRow({
  roadmap: r,
  icon: Icon,
}: {
  roadmap: RoadmapSummary;
  icon: typeof Hash;
}) {
  const status: MapStatus =
    r.completedCount === r.totalCount && r.totalCount > 0
      ? "done"
      : r.completedCount > 0
        ? "active"
        : "new";
  const meta = MAP_STATUS_META[status];

  return (
    <li className="flex flex-col gap-4 rounded-card bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-window text-ink">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-[15px] font-bold text-ink">{r.title}</p>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-window px-3 py-1 text-[11px] font-semibold",
              meta.className,
            )}
          >
            <meta.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-2">
          {r.totalCount} kompetensi ·{" "}
          {status === "done"
            ? "selesai semua"
            : status === "active"
              ? `${r.completedCount} dikuasai`
              : "belum mulai"}
        </p>
        {status === "active" && (
          <div className="mt-2 w-full sm:max-w-[280px]">
            <ProgressBar pct={r.progressPct} status="half" />
          </div>
        )}
      </div>
      <div className="shrink-0">
        {status === "done" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-window px-3 py-1.5 text-[11px] font-semibold",
              MAP_STATUS_META.done.className,
            )}
          >
            {MAP_STATUS_META.done.label}
          </span>
        ) : (
          <Link
            href={`/roadmap/${r.id}`}
            className={cn(
              "flex min-h-[44px] w-full items-center justify-center rounded-pill px-5 py-2.5 text-center text-sm font-bold sm:inline-flex sm:w-auto",
              status === "active"
                ? "bg-dark text-inverse hover:bg-dark-elev"
                : "bg-window text-ink hover:bg-line",
            )}
          >
            {status === "active" ? "Lanjutkan" : "Mulai"}
          </Link>
        )}
      </div>
    </li>
  );
}

export function RoadmapLoader({ id }: { id: string }) {
  const router = useRouter();
  const { state, retry } = useApiData(() => api.roadmap(id), [id]);

  if (state.kind === "loading") {
    return (
      <AppShell>
        <AppNav />
        <main className="mx-auto max-w-2xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
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
        <main className="mx-auto max-w-2xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
          {noRoadmap ? (
            <EmptyState
              title="Belum ada peta belajar"
              description="Tanya AI dulu untuk menggambar peta pertamamu."
              action={
                <button
                  onClick={() => router.push("/tanya")}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse hover:bg-dark-elev"
                >
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

/** Stagger M1: 60ms per node, maksimal 6 node. */
const nodeDelay = (i: number) => ({ ["--node-delay" as string]: `${Math.min(i, 5) * 60}ms` });

function RoadmapView({ detail }: { detail: RoadmapDetail }) {
  const comps = [...detail.competencies].sort((a, b) => a.position - b.position);
  const firstOpenGapIdx = comps.findIndex((c) => c.status === "gap" && !c.completed);
  const active =
    comps.find((c) => c.status === "half" && !c.completed) ??
    (firstOpenGapIdx >= 0 ? comps[firstOpenGapIdx] : null);
  const total = comps.length;
  const done = comps.filter((c) => c.completed || c.status === "master").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const nodeStatus = (i: number): NodeStatus => {
    const c = comps[i];
    if (c.status === "gap" && firstOpenGapIdx !== -1 && i > firstOpenGapIdx) return "locked";
    return c.status;
  };

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-2xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
        <Link
          href="/roadmap"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Semua peta
        </Link>
        <h1 className="mt-2 min-w-0 text-[32px] leading-[1.1] tracking-[-1px] text-ink md:text-[42px]">
          <span className="block truncate">{detail.roadmap.title}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Ikuti jalurnya satu per satu. Warna menunjukkan statusmu — dan selalu ada keterangannya.
        </p>

        {/* Card progres keseluruhan */}
        <div className="mt-6 rounded-card bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Progres keseluruhan</p>
            <span className="rounded-pill bg-window px-3 py-1 text-[11px] font-semibold text-ink-2">
              {done} dari {total} kompetensi
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar pct={pct} status="master" />
          </div>
        </div>

        {/* Jalur vertikal: circle node 64px + connector SVG draw-in */}
        <ol aria-label="Jalur kompetensi" className="mt-8">
          {comps.map((c, i) => {
            const status = nodeStatus(i);
            const meta = NODE_STATUS_META[status];
            const isActive = active?.id === c.id;
            const delay = nodeDelay(i);
            const prevDone =
              i > 0 && (comps[i - 1].status === "master" || comps[i - 1].completed);
            return (
              <li key={c.id}>
                {i > 0 && (
                  <svg
                    aria-hidden
                    className="animate-draw mx-auto block"
                    width="4"
                    height="32"
                    viewBox="0 0 4 32"
                    style={delay}
                  >
                    <line
                      x1="2"
                      y1="0"
                      x2="2"
                      y2="32"
                      strokeDasharray={32}
                      strokeDashoffset={32}
                      strokeWidth="2"
                      stroke={prevDone ? "var(--c-master)" : "var(--c-line)"}
                      className="transition-colors duration-[400ms]"
                    />
                  </svg>
                )}
                <div className="animate-node flex flex-col items-center text-center" style={delay}>
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full border-2 bg-card transition-colors duration-[400ms]",
                      status === "locked" ? "border-line text-ink-2" : meta.className,
                      status === "locked" ? "" : "border-current",
                    )}
                  >
                    <meta.Icon
                      className={cn("h-7 w-7", status === "master" && "animate-check")}
                      aria-hidden
                    />
                  </span>
                  <p
                    className={cn(
                      "mt-3 text-[15px] font-bold",
                      status === "locked" ? "text-ink-2" : "text-ink",
                    )}
                  >
                    {c.name}
                    {c.completed && <span className="sr-only"> (selesai)</span>}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-2">
                    <NodeStatusPill
                      status={status}
                      className="transition-colors duration-[400ms]"
                    />
                    <span aria-hidden>·</span>
                    {c.resources.length} materi
                  </p>
                  {isActive && (
                    <Link
                      href={`/roadmap/${detail.roadmap.id}/materi/${c.id}`}
                      className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-6 py-3 text-[15px] font-bold text-inverse hover:bg-dark-elev"
                    >
                      Lanjutkan belajar
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </AppShell>
  );
}
