import type { CompetencyStatus } from "@peta-belajar/shared";
import { COMPETENCY_STATUS_LABEL } from "@peta-belajar/shared";
import { CircleAlert, CircleDot, CheckCircle2, Lock } from "lucide-react";
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

/** Status visual jalur: 3 status kompetensi + "locked" (turunan, bukan status API). */
export type NodeStatus = CompetencyStatus | "locked";

export const NODE_STATUS_META: Record<
  NodeStatus,
  { label: string; Icon: typeof CircleAlert; className: string }
> = {
  ...STATUS_META,
  locked: { label: "Terkunci", Icon: Lock, className: "text-ink-2" },
};

/** Label status peta (level roadmap, bukan kompetensi). */
export type MapStatus = "active" | "new" | "done";

export const MAP_STATUS_META: Record<
  MapStatus,
  { label: string; Icon: typeof CircleAlert; className: string }
> = {
  active: { label: "Sedang berjalan", Icon: CircleDot, className: "text-status-half" },
  new: { label: "Belum mulai", Icon: CircleAlert, className: "text-status-gap" },
  done: { label: "Tuntas", Icon: CheckCircle2, className: "text-status-master" },
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-card px-3 py-1.5 text-[11px] font-semibold",
        color,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

/** Pill status untuk node jalur (termasuk "Terkunci"). */
export function NodeStatusPill({
  status,
  className,
}: {
  status: NodeStatus;
  className?: string;
}) {
  const { label, Icon, className: color } = NODE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-card px-3 py-1.5 text-[11px] font-semibold",
        color,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

const STATUS_FILL: Record<CompetencyStatus, string> = {
  master: "bg-dark",
  half: "bg-status-half",
  gap: "bg-line",
};

/** Bar progres animasi 0→nilai (600ms ease-out, stagger via index*60ms). */
export function ProgressBar({
  pct,
  index = 0,
  status = "master",
}: {
  pct: number;
  index?: number;
  status?: CompetencyStatus;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres ${pct} persen`}
      className="h-2 w-full overflow-hidden rounded-pill bg-ink/15 md:h-2.5"
    >
      <div
        className={cn("animate-bar h-full rounded-pill", STATUS_FILL[status])}
        style={{ width: `${pct}%`, ["--stagger-delay" as string]: `${index * 60}ms` }}
      />
    </div>
  );
}
