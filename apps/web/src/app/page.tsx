"use client";

import Link from "next/link";
import {
  Map,
  ArrowRight,
  Route,
  Check,
  Minus,
  Flag,
  Lock,
  ShieldCheck,
  Pencil,
  Footprints,
  MessageCircleQuestion,
  BookOpen,
} from "lucide-react";
import { useApiData, SkeletonBlock, ErrorState } from "@/components/async";
import { api } from "@/lib/api";

type NodeVisual = {
  title: string;
  label: string;
  Icon: typeof Check;
  dotClass: string;
  badgeClass: string;
};

/** Konten statis fallback — persis mockup landing.html (dipakai saat API error/empty). */
const FALLBACK_NODES: NodeVisual[] = [
  {
    title: "Arti pecahan sederhana",
    label: "Kuasai",
    Icon: Check,
    dotClass: "bg-status-master border-status-master text-inverse",
    badgeClass: "bg-status-master text-inverse",
  },
  {
    title: "Membandingkan pecahan",
    label: "Setengah",
    Icon: Minus,
    dotClass: "bg-status-half border-status-half text-ink",
    badgeClass: "bg-status-half text-ink",
  },
  {
    title: "Menjumlahkan pecahan",
    label: "Langkah berikutnya",
    Icon: Flag,
    dotClass: "bg-status-gap border-status-gap text-inverse",
    badgeClass: "bg-dark text-inverse",
  },
  {
    title: "Pecahan campuran",
    label: "Terkunci",
    Icon: Lock,
    dotClass: "bg-card border-line text-ink-2",
    badgeClass: "bg-window text-ink-2",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Tulis tujuanmu",
    body: "“Aku mau bisa pecahan” sudah cukup. AI akan bertanya 2–3 hal singkat supaya petanya pas buat kamu.",
    Icon: MessageCircleQuestion,
  },
  {
    num: "2",
    title: "Dapatkan peta kompetensi",
    body: "Lihat mana yang sudah kamu kuasai, setengah paham, dan mana celah yang perlu dilatih dulu.",
    Icon: Map,
  },
  {
    num: "3",
    title: "Belajar terpandu",
    body: "Materi singkat dan latihan yang membantumu berpikir — bukan memberi jawaban PR secara instan.",
    Icon: BookOpen,
  },
];

const CHIPS = [
  { label: "Bukan mesin jawaban", Icon: ShieldCheck },
  { label: "Peta bisa kamu edit", Icon: Pencil },
  { label: "Satu langkah jelas tiap layar", Icon: Footprints },
];

/** Satu CTA primer — mengarah ke alur produk (login → home). */
function PrimaryCta({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-dark font-bold text-inverse transition-all hover:bg-dark-elev active:scale-[0.98] ${
        small
          ? "min-h-[40px] px-[18px] py-2.5 text-[13px]"
          : "min-h-[44px] px-6 py-3.5 text-[15px]"
      }`}
    >
      Mulai belajar sekarang
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function ExampleNodes({ nodes }: { nodes: NodeVisual[] }) {
  return (
    <div className="relative pl-9 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-[2px] before:bg-line">
      {nodes.map((n, i) => (
        <div key={n.title} className={`relative flex items-start gap-3.5 ${i === nodes.length - 1 ? "" : "mb-4"}`}>
          <span
            className={`absolute -left-9 top-0.5 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 ${n.dotClass}`}
          >
            <n.Icon className="h-[13px] w-[13px]" aria-hidden />
          </span>
          <div className="flex min-h-[27px] flex-1 items-center gap-2.5">
            <span className="flex-1 text-sm font-bold text-ink">{n.title}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-semibold ${n.badgeClass}`}
            >
              <n.Icon className="h-[13px] w-[13px]" aria-hidden />
              {n.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kartu contoh peta: API /api/example bila tersedia, fallback konten statis mockup. Cross-fade 200ms (M5). */
function ExampleMapCard() {
  const { state, retry } = useApiData(() => api.example());

  let nodes: NodeVisual[] = FALLBACK_NODES;
  if (state.kind === "ready" && state.data.example.competencies.length >= 4) {
    const comps = state.data.example.competencies.slice(0, 4);
    nodes = comps.map((c, i) => {
      if (i === comps.length - 1) return { ...FALLBACK_NODES[3], title: c.name };
      const base =
        c.status === "master" ? FALLBACK_NODES[0] : c.status === "half" ? FALLBACK_NODES[1] : FALLBACK_NODES[2];
      return { ...base, title: c.name };
    });
  }

  return (
    <div className="rounded-card border border-line bg-card p-5">
      <p className="mb-3.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">
        <Route className="h-[13px] w-[13px]" aria-hidden />
        Contoh peta: Pecahan Kelas 4
      </p>
      {state.kind === "loading" ? (
        <div className="animate-[fadein_200ms_ease-out]">
          <SkeletonBlock lines={4} />
        </div>
      ) : state.kind === "error" ? (
        // Offline/API gagal → tampilkan fallback statis + info retry kecil.
        <div className="animate-[fadein_200ms_ease-out]">
          <ExampleNodes nodes={FALLBACK_NODES} />
          <div className="mt-4">
            <ErrorState message={state.message} offline={state.offline} onRetry={retry} />
          </div>
        </div>
      ) : (
        <div className="animate-[fadein_200ms_ease-out]">
          <ExampleNodes nodes={nodes} />
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas p-3 md:p-6">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1180px] overflow-hidden rounded-[28px] bg-window md:min-h-[calc(100vh-48px)] md:rounded-frame">
        {/* Header */}
        <header className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-[42px]">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-dark text-window">
              <Map className="h-4 w-4" aria-hidden />
            </span>
            Peta Belajar
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold md:gap-[22px]">
            <a href="#cara-kerja" className="hidden text-ink transition-colors hover:text-ink-2 md:inline">
              Cara Kerja
            </a>
            <a href="#tentang" className="hidden text-ink transition-colors hover:text-ink-2 md:inline">
              Tentang
            </a>
            <PrimaryCta small />
          </nav>
        </header>

        {/* Hero: 2 kolom desktop / 1 kolom mobile */}
        <section className="grid grid-cols-1 items-center gap-7 px-5 py-8 md:grid-cols-[1.1fr_1fr] md:gap-[42px] md:px-[42px] md:py-12">
          <div>
            <h1 className="text-[38px] font-normal leading-[1.04] tracking-[-1.2px] text-ink md:text-[60px] md:tracking-[-2px]">
              Tujuan belajarmu, <strong className="font-extrabold">jadi peta yang jelas.</strong>
            </h1>
            <p className="mb-7 mt-5 max-w-[440px] text-sm leading-[1.6] text-ink-2">
              Tulis satu tujuan belajar, jawab 2–3 pertanyaan singkat, dan dapatkan peta kompetensi
              yang bisa kamu ikuti langkah demi langkah — tanpa jawaban instan.
            </p>
            <PrimaryCta />
          </div>
          <ExampleMapCard />
        </section>

        {/* Trust strip */}
        <section className="flex flex-wrap justify-center gap-3 px-5 pb-10 md:px-[42px] md:pb-[42px]">
          {CHIPS.map(({ label, Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-card px-[18px] py-[11px] text-[11px] font-semibold text-ink transition-colors hover:border-ink-2/40 hover:bg-window"
            >
              <Icon className="h-3.5 w-3.5 text-ink-2" aria-hidden />
              {label}
            </span>
          ))}
        </section>

        {/* Cara Kerja */}
        <section id="cara-kerja">
          <div className="px-5 md:px-[42px]">
            <span className="mb-3.5 inline-block rounded-pill bg-dark px-4 py-2 text-[11px] font-semibold tracking-[0.04em] text-inverse">
              Cara Kerja
            </span>
            <h2 className="text-[28px] font-normal tracking-[-1px] text-ink">
              Tiga langkah menuju peta belajarmu
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-[18px] px-5 py-6 md:grid-cols-3 md:px-[42px] md:pb-[42px]">
            {STEPS.map(({ num, title, body, Icon }) => (
              <div
                key={num}
                className="flex flex-col gap-3 rounded-card border border-line bg-card p-[22px]"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-pill bg-dark text-[15px] font-extrabold text-inverse">
                  {num}
                </span>
                <h3 className="text-[15px] font-bold text-ink">{title}</h3>
                <p className="text-sm leading-[1.6] text-ink-2">{body}</p>
                <span className="mt-auto text-ink-2">
                  <Icon className="h-[22px] w-[22px]" aria-hidden />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section
          id="tentang"
          className="mx-5 mb-8 flex flex-wrap items-center justify-between gap-6 rounded-card bg-dark p-6 md:mx-[42px] md:mb-[42px] md:p-8"
        >
          <div>
            <h2 className="text-[28px] font-normal tracking-[-1px] text-inverse">
              Siap melihat petamu?
            </h2>
            <p className="mt-2.5 max-w-[440px] text-sm leading-[1.6] text-[#B9C4BA]">
              Mulai dari satu tujuan kecil hari ini. Gratis dicoba, tanpa perlu daftar dulu.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-inverse px-6 py-3.5 text-[15px] font-bold text-ink transition-all hover:bg-card active:scale-[0.98]"
          >
            Mulai belajar sekarang
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        {/* Footer */}
        <footer className="mx-5 flex flex-wrap justify-between gap-3 border-t border-dashed border-line py-6 text-[11px] font-semibold text-ink-2 md:mx-[42px] md:pb-8">
          <span>© 2026 Peta Belajar</span>
          <span>Dibuat untuk pelajar SD Indonesia</span>
        </footer>
      </div>
    </main>
  );
}
