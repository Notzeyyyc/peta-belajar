import type { CompetencyStatus } from "@peta-belajar/shared";
import { COMPETENCY_STATUS_LABEL } from "@peta-belajar/shared";
import { CircleAlert, CircleDot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  CompetencyStatus,
  { label: string; Icon: typeof CircleAlert; className: string }
> = {
  gap: { label: COMPETENCY_STATUS_LABEL.gap, Icon: CircleAlert, className: "text-status-gap" },
  half: { label: COMPETENCY_STATUS_LABEL.half, Icon: CircleDot, className: "text-status-half" },
  master: {
    label: COMPETENCY_STATUS_LABEL.master,
    Icon: CheckCircle2,
    className: "text-status-master",
  },
};

/**
 * Badge status — HANYA dipakai di layar roadmap. Warna status selalu
 * disertai label teks + ikon (tidak mengandalkan warna saja).
 */
export function StatusBadge({ status, className }: { status: CompetencyStatus; className?: string }) {
  const { label, Icon, className: color } = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-card px-3 py-1.5 text-[11px] font-semibold",
        color,
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}

/** Bar progres animasi 0→nilai (600ms ease-out, stagger via index*60ms). */
export function ProgressBar({ pct, index = 0 }: { pct: number; index?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres ${pct} persen`}
      className="h-2.5 w-full overflow-hidden rounded-pill bg-ink/10"
    >
      <div
        className="animate-bar h-full rounded-pill bg-dark"
        style={{ width: `${pct}%`, ["--stagger-delay" as string]: `${index * 60}ms` }}
      />
    </div>
  );
}
