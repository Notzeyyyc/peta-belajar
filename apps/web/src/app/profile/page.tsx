"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Flag, LogOut } from "lucide-react";
import { LEARNING_STYLE_LABEL, type LearningStyle } from "@peta-belajar/shared";
import { AppShell, AppNav } from "@/components/app-shell";
import { useApiData, SkeletonBlock, ErrorState, EmptyState } from "@/components/async";
import { ProgressBar } from "@/components/status";
import { api, ApiError, type RoadmapSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const STYLES: LearningStyle[] = ["visual", "praktik", "teori"];

const STYLE_DESC: Record<LearningStyle, string> = {
  visual: "Kamu suka belajar lewat gambar, warna, dan video.",
  praktik: "Kamu suka langsung mencoba bikin sesuatu.",
  teori: "Kamu suka membaca langkah demi langkah.",
};

/** Inisial dari nama tampilan — maks 2 huruf, dipakai di SATU avatar profil. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Status badge peta: Tuntas bila semua selesai, Berjalan selain itu. */
function RoadmapStatusBadge({ r }: { r: RoadmapSummary }) {
  const done = r.totalCount > 0 && r.completedCount === r.totalCount;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-semibold",
        done ? "bg-dark text-inverse" : "border border-line bg-window text-ink-2",
      )}
    >
      {done ? <Check className="h-4 w-4" aria-hidden /> : <Flag className="h-4 w-4" aria-hidden />}
      {done ? "Tuntas" : "Berjalan"}
    </span>
  );
}

function LearningStylePicker({ initial }: { initial: LearningStyle | null }) {
  const [style, setStyle] = useState<LearningStyle | null>(initial);
  const [saving, setSaving] = useState<LearningStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: LearningStyle) {
    if (next === style || saving) return;
    const prev = style;
    setStyle(next); // optimis
    setSaving(next);
    setError(null);
    try {
      await api.setLearningStyle(next);
    } catch (err) {
      setStyle(prev); // rollback
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan. Coba lagi ya.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div aria-label="Gaya belajar">
      <p className="text-sm text-ink-2">Pilih satu — AI akan menyesuaikan materimu.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Gaya belajar">
        {STYLES.map((s) => {
          const selected = style === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving !== null}
              onClick={() => choose(s)}
              className={cn(
                "flex min-h-[44px] flex-col items-start gap-1 rounded-card border p-4 text-left transition-colors",
                selected
                  ? "border-dark bg-dark text-inverse"
                  : "border-line bg-card text-ink hover:bg-line",
                saving && saving !== s && "opacity-60",
              )}
            >
              <span className="inline-flex items-center gap-2 text-[15px] font-bold">
                {selected && <Check className="h-4 w-4" aria-hidden />}
                {LEARNING_STYLE_LABEL[s]}
                {saving === s && (
                  <span className="text-xs font-semibold opacity-80">menyimpan…</span>
                )}
              </span>
              <span className={cn("text-xs leading-[1.5]", selected ? "text-inverse/80" : "text-ink-2")}>
                {STYLE_DESC[s]}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-control bg-card p-3 text-sm font-semibold text-ink">
          {error}
        </p>
      )}
      {!style && !error && (
        <p className="mt-3 text-xs font-semibold text-ink-2">
          Gaya belajar belum dipilih — materi pakai gaya Visual dulu, ya.
        </p>
      )}
    </div>
  );
}

/** Keluar: hapus cookie sesi di klien (backend belum punya endpoint logout) lalu ke /login. */
function LogoutButton() {
  const router = useRouter();
  function logout() {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
    });
    router.replace("/login");
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Keluar
    </button>
  );
}

export default function ProfilePage() {
  const { state, retry } = useApiData(() => api.profile());

  return (
    <AppShell>
      <AppNav />
      <main className="mx-auto max-w-2xl px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
        {state.kind === "loading" && <SkeletonBlock lines={6} />}
        {state.kind === "error" && (
          <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
        )}
        {state.kind === "ready" && (
          <div className="content-fade">
            {/* Kartu profil — SATU avatar inisial dari nama */}
            <section aria-label="Profil" className="rounded-card bg-card p-6 text-center">
              <span
                aria-hidden
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-dark text-[28px] font-extrabold text-inverse"
              >
                {initials(state.data.user.displayName)}
              </span>
              <h1 className="mt-3 text-[28px] leading-[1.1] tracking-[-1px] text-ink">
                {state.data.user.displayName}
              </h1>
              <p className="mt-1 text-sm text-ink-2">
                {state.data.learningStyle
                  ? `Gaya belajar: ${LEARNING_STYLE_LABEL[state.data.learningStyle]}`
                  : "Gaya belajar belum diatur"}
              </p>
            </section>

            {/* Perjalananmu — statistik HANYA dari API /api/profile */}
            <h2 className="mt-8 text-lg font-extrabold text-ink">Perjalananmu</h2>
            <section aria-label="Statistik belajar" className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Peta tersimpan", value: state.data.roadmaps.length, pct: null },
                {
                  label: "Langkah selesai",
                  value: state.data.stats.completed,
                  pct: state.data.stats.total
                    ? Math.round((state.data.stats.completed / state.data.stats.total) * 100)
                    : 0,
                },
                { label: "Celah tersisa", value: state.data.stats.cumulativeGap, pct: null },
              ].map((s, i) => (
                <div key={s.label} className="card-hover rounded-card bg-card p-4 text-center">
                  <p className="text-[28px] font-extrabold text-ink">{s.value}</p>
                  <p className="text-xs font-semibold text-ink-2">{s.label}</p>
                  {s.pct !== null && (
                    <div className="mt-2" aria-hidden>
                      <ProgressBar pct={s.pct} index={i} />
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Peta tersimpan — dari API + status badge */}
            <h2 className="mt-8 text-lg font-extrabold text-ink">Peta tersimpan</h2>
            <section aria-label="Peta tersimpan" className="mt-4">
              {state.data.roadmaps.length === 0 ? (
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
              ) : (
                <ul className="space-y-3">
                  {state.data.roadmaps.map((r, i) => (
                    <li key={r.id} className="card-hover rounded-card bg-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-bold text-ink">{r.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-ink-2">
                            {r.completedCount} dari {r.totalCount} kompetensi dikuasai
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoadmapStatusBadge r={r} />
                          <Link
                            href={`/roadmap/${r.id}`}
                            aria-label={`Buka peta ${r.title}`}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-window px-4 py-2 text-sm font-bold text-ink hover:bg-line"
                          >
                            Buka
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar pct={r.progressPct} index={i} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Pengaturan — pemilih gaya belajar + keluar */}
            <h2 className="mt-8 text-lg font-extrabold text-ink">Pengaturan</h2>
            <section aria-label="Pengaturan" className="mt-4 space-y-4 rounded-card bg-card p-6">
              <LearningStylePicker initial={state.data.learningStyle} />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-sm font-bold text-ink">Keluar akun</p>
                  <p className="text-xs text-ink-2">Sesi belajarmu di perangkat ini diakhiri.</p>
                </div>
                <LogoutButton />
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
