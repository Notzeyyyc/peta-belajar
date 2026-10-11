"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Mail, MailCheck } from "lucide-react";
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
      await api.demoLogin(); // POST /api/auth/demo
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
      await api.magicLink(email); // POST /api/auth/magic-link/request
      setSent(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim tautan. Coba lagi ya.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-canvas p-3 md:p-6">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1180px] rounded-[28px] bg-window md:min-h-[calc(100vh-48px)] md:rounded-frame">
        <div className="flex min-h-[calc(100vh-24px)] items-center justify-center p-6 md:min-h-[calc(100vh-48px)]">
          <div className="w-full max-w-[400px] rounded-card border border-line bg-card p-5">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-tile bg-dark text-inverse">
              <Map className="h-[26px] w-[26px]" aria-hidden />
            </div>
            <h1 className="text-center text-[28px] font-normal tracking-[-1px] text-ink">
              Selamat datang kembali!
            </h1>
            <p className="mb-6 mt-1.5 text-center text-sm leading-[1.6] text-ink-2">
              Masuk untuk melanjutkan perjalanan belajarmu.
            </p>

            {sent ? (
              <div role="status" className="rounded-tile border border-line bg-window p-5 text-center">
                <MailCheck className="mx-auto h-8 w-8 text-ink" aria-hidden />
                <p className="mt-3 text-sm font-bold text-ink">Tautan masuk terkirim!</p>
                <p className="mt-1 text-sm leading-[1.6] text-ink-2">
                  Cek kotak masuk <span className="font-semibold text-ink">{sent}</span> dan klik
                  tautannya untuk masuk. Sampai jumpa di petamu! 🎉
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} noValidate>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kamu@email.com"
                    className="min-h-[44px] w-full rounded-control border-[1.5px] border-line bg-inverse px-3.5 py-3 text-sm text-ink placeholder:text-ink-2 focus:border-dark focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pill bg-dark px-6 py-3.5 text-[15px] font-bold text-inverse transition-all hover:bg-dark-elev active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {busy === "magic" ? "Mengirim…" : "Kirim tautan masuk"}
                </button>
              </form>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-control bg-window p-3 text-sm font-semibold text-ink">
                {error}
              </p>
            )}

            {!sent && (
              <p className="mt-4 text-center text-sm leading-[1.6] text-ink-2">
                Kami kirim tautan ajaib ke emailmu — tanpa kata sandi.
              </p>
            )}
            <p className="mt-5 text-center text-sm leading-[1.6] text-ink-2">
              Baru di sini?{" "}
              <button
                type="button"
                onClick={handleDemo}
                disabled={busy !== null}
                className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-ink-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy === "demo" ? "Memproses…" : "Coba demo dulu"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
