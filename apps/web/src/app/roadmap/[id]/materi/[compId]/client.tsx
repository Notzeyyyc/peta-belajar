"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  BookOpen,
  ExternalLink,
  Lightbulb,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import type { MateriResponse, MateriSumber } from "@peta-belajar/shared";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, Skeleton, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { StatusBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  article: "Artikel",
  interactive: "Interaktif",
  game: "Game",
  course: "Kursus",
};

/** Chip format + durasi — dipakai untuk sumber asli (mode ai & fallback). */
function SumberChips({ sumber }: { sumber: MateriSumber }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <BookOpen className="h-4 w-4" aria-hidden />
        {TYPE_LABEL[sumber.type] ?? sumber.type}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4" aria-hidden />
        {sumber.durationMinutes} menit
      </span>
    </div>
  );
}

/** Skeleton mode loading Materi Anak: 4 blok monokrom + label menenangkan. */
function MateriSkeleton() {
  return (
    <div role="status" aria-label="Menyiapkan materi" className="mt-8 space-y-4">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-24 w-full" />
      <p className="text-sm font-semibold text-ink-2">AI lagi nyiapin materimu...</p>
    </div>
  );
}

/** Kartu sumber asli — judul + URL dari API (katalog, bukan karangan model). */
function SumberCard({ sumber, cached }: { sumber: MateriSumber; cached?: boolean }) {
  return (
    <section aria-label="Sumber asli" className="mt-10 rounded-card bg-card p-5">
      <SumberChips sumber={sumber} />
      <p className="mt-2 text-[15px] font-bold text-ink">{sumber.title}</p>
      <a
        href={sumber.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex min-h-[44px] items-center break-all rounded-control bg-window px-3 text-sm font-semibold text-ink-2 underline underline-offset-4 hover:text-ink"
      >
        {sumber.url}
      </a>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={sumber.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
        >
          Buka sumber asli
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        {cached && (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-window px-3 py-1.5 text-[11px] font-semibold text-ink-2">
            <Check className="h-4 w-4" aria-hidden />
            Sudah siap
          </span>
        )}
      </div>
    </section>
  );
}

/** Empat bagian Materi Anak — urutan tetap sesuai kontrak MateriAnakSchema. */
function MateriAnakSections({ data }: { data: MateriResponse }) {
  const m = data.materi;
  const sumber = data.sumber;
  if (!m || !sumber) return null;
  return (
    <>
      {/* 1. Pengantar — pembuka layar, sapaan "kamu" */}
      <section aria-label="Pengantar" className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-2">Pengantar</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink">{m.pengantar}</p>
      </section>

      {/* 2. Analogi — card + ikon lightbulb */}
      <section aria-label="Analogi" className="mt-6 rounded-card bg-card p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-2">
          <Lightbulb className="h-4 w-4 text-ink" aria-hidden />
          Analogi
        </h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink">{m.analogi}</p>
      </section>

      {/* 3. Inti — poin-poin pendek dengan ikon check */}
      <section aria-label="Inti materi" className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-2">Inti materi</h2>
        <ul className="mt-3 space-y-3">
          {m.inti.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.6] text-ink">
              <Check className="mt-1 h-4 w-4 shrink-0 text-ink" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Tantangan — pemantik pikir, BUKAN jawaban */}
      <section aria-label="Coba pikirin ini" className="mt-8 rounded-card bg-dark p-5 text-inverse">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <HelpCircle className="h-5 w-5" aria-hidden />
          Coba pikirin ini
        </h2>
        <ul className="mt-3 space-y-3 text-sm leading-[1.6]">
          {m.tantangan.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <p className="mt-4 border-t border-dark-elev pt-3 text-xs leading-[1.5] text-inverse/80">
          Tantangan ini buat kamu pikirkan sendiri, bukan buat dijawab AI. Nggak ada jawaban
          benar atau salah — yang penting kamu mulai mikir.
        </p>
      </section>

      <SumberCard sumber={sumber} cached={data.cached === true} />
    </>
  );
}

/** Mode fallback — katalog polos + pesan ramah + tombol coba lagi. */
function MateriFallback({ data, onRetry }: { data: MateriResponse; onRetry: () => void }) {
  const r = data.resource;
  if (!r) return null;
  return (
    <section aria-label="Materi sumber" className="mt-8">
      <div className="rounded-card bg-card p-6">
        <p className="text-sm font-semibold text-ink">
          Materinya lagi belum bisa disederhanakan AI. Nggak apa-apa — sumber aslinya tetap bisa
          kamu baca di bawah ini ya.
        </p>
        <div className="mt-4">
          <SumberChips sumber={r} />
          <p className="mt-2 text-[15px] font-bold text-ink">{r.title}</p>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-[44px] items-center break-all rounded-control bg-window px-3 text-sm font-semibold text-ink-2 underline underline-offset-4 hover:text-ink"
          >
            {r.url}
          </a>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-dark px-5 py-2.5 text-sm font-bold text-inverse hover:bg-dark-elev"
          >
            Buka sumber
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Coba lagi
          </Button>
        </div>
      </div>
    </section>
  );
}

export function MateriView({ id, compId }: { id: string; compId: string }) {
  const { state, retry } = useApiData(() => api.roadmap(id), [id]);
  const {
    state: materiState,
    retry: retryMateri,
  } = useApiData(() => api.materi(id, compId), [id, compId]);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleComplete(current: boolean) {
    if (pending) return;
    // Optimistic update
    setCompleted(!current);
    setPending(true);
    setError(null);
    try {
      await api.completeStep(id, compId);
    } catch (err) {
      // Rollback saat gagal
      setCompleted(current);
      setError(
        err instanceof ApiError ? err.message : "Gagal menyimpan progres. Coba lagi ya.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 py-8 pb-28 md:px-[42px] md:py-12 md:pb-12">
        {state.kind === "loading" && <SkeletonBlock lines={6} />}
        {state.kind === "error" && (
          <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
        )}
        {state.kind === "ready" &&
          (() => {
            const comp = state.data.competencies.find((c) => c.id === compId);
            if (!comp) {
              return (
                <EmptyState
                  title="Kompetensi tidak ditemukan"
                  description="Langkah ini tidak ada di peta belajarmu."
                />
              );
            }
            const isDone = completed ?? comp.completed;
            return (
              <>
                <Link
                  href={`/roadmap/${id}`}
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Kembali ke peta
                </Link>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <StatusBadge status={comp.status} />
                  {isDone && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-dark px-3 py-1.5 text-[11px] font-semibold text-inverse">
                      <Check className="h-4 w-4" aria-hidden />
                      Selesai
                    </span>
                  )}
                </div>
                <h1 className="mt-4 text-[32px] leading-[1.1] tracking-[-1px] text-ink">
                  {comp.name}
                </h1>
                <p className="mt-3 text-sm leading-[1.6] text-ink-2">{comp.description}</p>

                {/* Materi Anak */}
                {materiState.kind === "loading" && <MateriSkeleton />}
                {materiState.kind === "error" && (
                  <div className="mt-8">
                    <ErrorState
                      message={materiState.message}
                      offline={materiState.offline}
                      onRetry={retryMateri}
                    />
                  </div>
                )}
                {materiState.kind === "ready" &&
                  (materiState.data.mode === "ai" ? (
                    <MateriAnakSections data={materiState.data} />
                  ) : (
                    <MateriFallback data={materiState.data} onRetry={retryMateri} />
                  ))}

                <div className="mt-10">
                  <Button
                    onClick={() => toggleComplete(isDone)}
                    disabled={pending}
                    variant={isDone ? "secondary" : "primary"}
                    className={cn(isDone && "line-through-none")}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    {pending
                      ? "Menyimpan…"
                      : isDone
                        ? "Sudah selesai — batalkan?"
                        : "Tandai selesai"}
                  </Button>
                  {error && (
                    <p
                      role="alert"
                      className="mt-3 rounded-control bg-card p-3 text-sm font-semibold text-ink"
                    >
                      {error}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
      </main>
    </AppShell>
  );
}
