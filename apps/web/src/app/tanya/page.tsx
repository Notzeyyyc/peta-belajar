"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, RotateCcw } from "lucide-react";
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
      <main className="mx-auto max-w-2xl px-5 py-8 md:px-[42px] md:py-12">
        <h1 className="flex items-center gap-3 text-[32px] leading-[1.1] tracking-[-1px] text-ink">
          <Sparkles className="h-8 w-8" aria-hidden />
          Tanya AI
        </h1>

        {phase.kind === "input" && (
          <form onSubmit={submitGoal} className="mt-8 space-y-3">
            <label htmlFor="goal" className="block text-sm font-semibold text-ink">
              Apa tujuan belajarmu?
            </label>
            <textarea
              id="goal"
              value={goal}
              maxLength={MAX_GOAL}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
              placeholder="Contoh: aku ingin bisa bikin game sederhana"
              className="w-full rounded-tile border border-line bg-card p-4 text-[15px] text-ink placeholder:text-ink-2"
            />
            <div className="flex items-center justify-between">
              <span
                className={cn("text-xs font-semibold", remaining < 20 ? "text-ink" : "text-ink-2")}
                aria-live="polite"
              >
                {remaining} karakter tersisa
              </span>
              <Button type="submit" disabled={goal.trim().length < 3}>
                <Send className="h-4 w-4" aria-hidden />
                Kirim
              </Button>
            </div>
          </form>
        )}

        {phase.kind === "clarifying" && (
          <section aria-label="Pertanyaan klarifikasi" className="mt-8 space-y-6">
            <div className="rounded-tile bg-card p-4 text-sm text-ink-2">
              <span className="font-semibold text-ink">Tujuanmu:</span> {goal}
            </div>
            {phase.questions.map((q) => (
              <div key={q.id}>
                {/* Bubble pertanyaan */}
                <div className="max-w-[85%] rounded-tile bg-dark p-4 text-[15px] font-semibold text-inverse">
                  {q.question}
                </div>
                {/* Chip jawaban */}
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={q.question}>
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={cn(
                          "min-h-[44px] rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors",
                          selected
                            ? "bg-dark text-inverse" // chip-on
                            : "bg-card text-ink hover:bg-line", // chip
                        )}
                      >
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
          <section aria-label="Ringkasan" className="mt-8">
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
          <div className="mt-8 rounded-card bg-card p-6">
            <SkeletonBlock lines={5} />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-control bg-card p-3 text-sm font-semibold text-ink">
            {error}
          </p>
        )}
      </main>
    </AppShell>
  );
}
