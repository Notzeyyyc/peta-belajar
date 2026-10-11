"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lightbulb, ListChecks, Puzzle, RotateCcw, Send, Sparkles } from "lucide-react";
import { AppShell, AppNav } from "@/components/app-shell";
import { SkeletonBlock } from "@/components/async";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_GOAL = 240;

type Question = { id: string; question: string; options: string[] };
type Phase =
  | { kind: "input" }
  | { kind: "clarifying"; questions: Question[] }
  | { kind: "summary"; questions: Question[] }
  | { kind: "generating" };

/** Chip saran tujuan — contoh pemantik, bukan jawaban. */
const SUGGESTIONS = [
  { icon: Lightbulb, text: "Aku ingin bisa bikin game sederhana" },
  { icon: Puzzle, text: "Aku ingin paham pecahan dengan seru" },
  { icon: ListChecks, text: "Aku ingin belajar menulis cerita pendek" },
];

/** Gelembung AI: card kiri + avatar ikon sparkles. */
function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark text-inverse"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <div className="max-w-[85%] rounded-card bg-card p-4 text-[15px] leading-[1.6] text-ink">
        {children}
      </div>
    </div>
  );
}

/** Gelembung user: dark, rata kanan. */
function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-card bg-dark p-4 text-[15px] font-semibold text-inverse">
        {children}
      </div>
    </div>
  );
}

export default function TanyaPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "input" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase({ kind: "generating" });
    try {
      const res = await api.clarify(goal.trim());
      setAnswers({});
      setPhase({ kind: "clarifying", questions: res.questions });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat pertanyaan.");
      setPhase({ kind: "input" });
    }
  }

  async function generate() {
    if (phase.kind !== "summary") return;
    setError(null);
    setPhase({ kind: "generating" });
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const detail = await api.generate(goal.trim(), payload);
      router.push(`/roadmap/${detail.roadmap.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat peta. Coba lagi ya.");
      setPhase({ kind: "summary", questions: phase.questions });
    }
  }

  const remaining = MAX_GOAL - goal.length;

  return (
    <AppShell>
      <AppNav />
      {/* Kolom setinggi layar: area chat scroll, input bar sticky bawah */}
      <main className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-2xl flex-col px-5 pb-36 pt-8 md:px-[42px] md:pb-8 md:pt-12">
        <div className="flex-1 space-y-6 pb-6">
          <h1 className="flex items-center gap-3 text-[32px] leading-[1.1] tracking-[-1px] text-ink">
            <Sparkles className="h-8 w-8" aria-hidden />
            Tanya AI
          </h1>

          {/* Sapaan pembuka — prinsip membimbing, bukan menjawab */}
          <AiBubble>
            Halo! Aku teman belajarmu. Ceritakan apa yang ingin kamu bisa — aku akan bantu
            menyusun langkahnya, dan kamu yang berpikir. Bukan aku yang menjawab semuanya, ya.
          </AiBubble>

          {phase.kind === "input" && (
            <div className="content-fade space-y-6">
              {/* Chip saran pertanyaan */}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Saran tujuan belajar">
                {SUGGESTIONS.map(({ icon: Icon, text }) => {
                  const selected = goal === text;
                  return (
                    <button
                      key={text}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setGoal(selected ? "" : text)}
                      className={cn(
                        "inline-flex min-h-[44px] items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                        selected ? "bg-dark text-inverse" : "bg-card text-ink hover:bg-line",
                      )}
                    >
                      {selected ? (
                        <Check className="h-4 w-4 animate-check" aria-hidden />
                      ) : (
                        <Icon className="h-4 w-4" aria-hidden />
                      )}
                      {text}
                    </button>
                  );
                })}
              </div>

              <form id="goal-form" onSubmit={submitGoal} className="sr-only" aria-hidden />
            </div>
          )}

          {phase.kind === "clarifying" && (
            <section aria-label="Pertanyaan klarifikasi" className="content-fade space-y-6">
              <UserBubble>{goal}</UserBubble>
              <AiBubble>
                Supaya petanya pas buat kamu, aku mau tanya beberapa hal dulu. Pilih yang paling
                mendekati, ya — tidak ada jawaban salah.
              </AiBubble>
              {phase.questions.map((q) => (
                <div key={q.id}>
                  {/* Bubble pertanyaan */}
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark text-inverse"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="max-w-[85%] rounded-card bg-card p-4 text-[15px] font-semibold text-ink">
                      {q.question}
                    </div>
                  </div>
                  {/* Chip jawaban — terpilih: check-icon + transisi halus */}
                  <div className="mt-3 flex flex-wrap gap-2 pl-11" role="group" aria-label={q.question}>
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={cn(
                            "inline-flex min-h-[44px] items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                            selected
                              ? "bg-dark text-inverse" // chip-on
                              : "bg-card text-ink hover:bg-line", // chip
                          )}
                        >
                          {selected && <Check className="h-4 w-4 animate-check" aria-hidden />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button
                className="w-full"
                disabled={phase.questions.some((q) => !answers[q.id])}
                onClick={() => setPhase({ kind: "summary", questions: phase.questions })}
              >
                Lanjut
              </Button>
            </section>
          )}

          {phase.kind === "summary" && (
            <section aria-label="Ringkasan" className="content-fade space-y-6">
              <UserBubble>{goal}</UserBubble>
              <div className="rounded-card bg-card p-6">
                <h2 className="text-lg font-extrabold text-ink">Cek dulu sebelum AI menggambar</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-ink-2">Tujuan</dt>
                    <dd className="font-semibold text-ink">{goal}</dd>
                  </div>
                  {phase.questions.map((q) => (
                    <div key={q.id}>
                      <dt className="font-semibold text-ink-2">{q.question}</dt>
                      <dd className="font-semibold text-ink">{answers[q.id]}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={generate}>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Buat petaku
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPhase({ kind: "clarifying", questions: phase.questions })}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Ubah jawaban
                  </Button>
                </div>
              </div>
            </section>
          )}

          {phase.kind === "generating" && (
            <div className="rounded-card bg-card p-6">
              <SkeletonBlock lines={5} />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-control bg-card p-3 text-sm font-semibold text-ink">
              {error}
            </p>
          )}
        </div>

        {/* Input bar sticky bawah — selalu terlihat ala mockup chat */}
        <div className="sticky bottom-20 -mx-5 border-t border-line bg-window px-5 py-3 md:bottom-0 md:-mx-[42px] md:px-[42px]">
          {phase.kind === "input" ? (
            <div className="space-y-1.5">
              <div className="flex items-end gap-2">
                <label htmlFor="goal" className="sr-only">
                  Tulis tujuan belajarmu
                </label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  maxLength={MAX_GOAL}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && goal.trim().length >= 3) {
                      const form = document.getElementById("goal-form") as HTMLFormElement | null;
                      form?.requestSubmit();
                    }
                  }}
                  placeholder="Tulis tujuan belajarmu di sini…"
                  className="min-h-[44px] min-w-0 flex-1 rounded-pill border border-line bg-card px-4 text-[15px] text-ink placeholder:text-ink-2"
                />
                <Button
                  type="submit"
                  form="goal-form"
                  disabled={goal.trim().length < 3}
                  aria-label="Kirim tujuan belajar"
                >
                  Kirim
                  <Send className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <span
                className={cn(
                  "block text-right text-xs font-semibold",
                  remaining < 20 ? "text-ink" : "text-ink-2",
                )}
                aria-live="polite"
              >
                {remaining} karakter tersisa
              </span>
            </div>
          ) : (
            <p className="py-2 text-center text-xs font-semibold text-ink-2">
              Jawab pertanyaan di atas dulu ya — AI membimbingmu, bukan menjawab untukmu.
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
