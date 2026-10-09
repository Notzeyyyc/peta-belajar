"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, LogIn, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"demo" | "magic" | null>(null);

  async function handleDemo() {
    setError(null);
    setBusy("demo");
    try {
      await api.demoLogin();
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk. Coba lagi ya.");
      setBusy(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("magic");
    try {
      await api.magicLink(email);
      setSent(email); // state terkirim
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim tautan. Coba lagi ya.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-6">
      <section className="w-full max-w-md rounded-frame bg-window p-6 md:p-[42px]">
        <div className="flex items-center gap-2 text-ink-2">
          <Map className="h-5 w-5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Peta Belajar</span>
        </div>
        <h1 className="mt-6 text-[32px] leading-[1.1] tracking-[-1px] text-ink">Masuk dulu yuk</h1>
        <p className="mt-2 text-sm text-ink-2">
          Satu langkah lagi menuju peta belajarmu sendiri.
        </p>

        <Button className="mt-8 w-full" onClick={handleDemo} disabled={busy !== null}>
          <LogIn className="h-4 w-4" aria-hidden />
          {busy === "demo" ? "Memproses…" : "Masuk demo"}
        </Button>

        <div className="my-6 flex items-center gap-3" aria-hidden>
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-semibold text-ink-2">atau</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {sent ? (
          <div role="status" className="rounded-card bg-card p-5 text-center">
            <MailCheck className="mx-auto h-8 w-8 text-ink" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-ink">Tautan masuk terkirim!</p>
            <p className="mt-1 text-sm text-ink-2">
              Cek kotak masuk <span className="font-semibold text-ink">{sent}</span> dan klik
              tautannya untuk masuk.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3" noValidate>
            <label htmlFor="email" className="block text-sm font-semibold text-ink">
              Email kamu
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="min-h-[44px] w-full rounded-control border border-line bg-card px-4 text-[15px] text-ink placeholder:text-ink-2"
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={busy !== null}>
              <Mail className="h-4 w-4" aria-hidden />
              {busy === "magic" ? "Mengirim…" : "Kirim tautan masuk"}
            </Button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-control bg-card p-3 text-sm font-semibold text-ink">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
