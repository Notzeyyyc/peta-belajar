"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock, BookOpen, ExternalLink } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
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

export function MateriView({ id, compId }: { id: string; compId: string }) {
  const { state, retry } = useApiData(() => api.roadmap(id), [id]);
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
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-[42px] md:py-12">
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
                <p className="mt-2 text-sm text-ink-2">
                  <span className="font-semibold text-ink">Kenapa penting: </span>
                  {comp.reason}
                </p>
                <p className="mt-2 text-sm text-ink">
                  <span className="font-semibold">Langkah berikutnya: </span>
                  {comp.nextAction}
                </p>

                <section aria-label="Daftar materi" className="mt-8">
                  <h2 className="text-lg font-extrabold text-ink">Materi belajar</h2>
                  {comp.resources.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState
                        title="Belum ada materi untuk langkah ini"
                        description="Materi akan ditambahkan segera. Sementara itu, coba langkah berikutnya di atas."
                      />
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {comp.resources.map((r) => (
                        <li key={r.id} className="rounded-card bg-card p-5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-2">
                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4" aria-hidden />
                              {TYPE_LABEL[r.type] ?? r.type}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-4 w-4" aria-hidden />
                              {r.durationMinutes} menit
                            </span>
                          </div>
                          <p className="mt-2 text-[15px] font-bold text-ink">{r.title}</p>
                          <p className="mt-1 text-sm text-ink-2">{r.description}</p>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
                          >
                            Buka materi
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="mt-8">
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
