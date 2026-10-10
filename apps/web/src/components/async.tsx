"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export type AsyncState<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string; offline: boolean; unauthorized: boolean; code: string }
  | { kind: "ready"; data: T };

/** Hook data-fetch dengan state loading/error(offline/401)/ready + retry. */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const router = useRouter();
  const [state, setState] = useState<AsyncState<T>>({ kind: "loading" });
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFetcher = useCallback(fetcher, deps);

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    memoFetcher()
      .then((data) => alive && setState({ kind: "ready", data }))
      .catch((err: unknown) => {
        if (!alive) return;
        const apiErr = err instanceof ApiError ? err : null;
        const unauthorized = apiErr?.status === 401;
        setState({
          kind: "error",
          message: apiErr?.message ?? "Terjadi kesalahan. Coba lagi ya.",
          offline: apiErr?.code === "OFFLINE",
          unauthorized,
          code: apiErr?.code ?? "UNKNOWN",
        });
        // Sesi hilang/kedaluwarsa → arahkan login (tanpa flash error).
        if (unauthorized) router.replace("/login");
      });
    return () => {
      alive = false;
    };
  }, [memoFetcher, tick, router]);

  return { state, retry: () => setTick((t) => t + 1) };
}

/** Skeleton monokrom (abu netral, tanpa warna status; diam saat reduced motion). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`motion-safe:animate-pulse rounded-tile bg-ink/10 ${className}`}
    />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Memuat" className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === 0 ? "h-6 w-2/3" : "h-4 w-full"} />
      ))}
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

export function ErrorState({
  message,
  offline,
  onRetry,
}: {
  message: string;
  offline?: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role={offline ? "status" : "alert"}
      className="rounded-card bg-card p-6 text-center"
    >
      <p className="text-sm font-semibold text-ink">
        {offline ? "Kamu sedang offline" : "Ada yang tidak beres"}
      </p>
      <p className="mt-1 text-sm text-ink-2">{message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        <RotateCcw className="h-4 w-4" aria-hidden />
        Coba lagi
      </Button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card bg-card p-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-2">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
