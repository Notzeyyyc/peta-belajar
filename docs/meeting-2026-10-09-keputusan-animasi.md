# Hasil Meeting — Animasi & Motion (9 Okt 2026)

> Briefing untuk orchestrator & sub-agent frontend. Keputusan scope motion Peta Belajar
> dalam sprint A+C+B. Baca bareng `meeting-2026-10-09-keputusan-sprint.md`, `AGENTS.md`, `DESIGN.md`.

---

## 0. Konteks & kenapa ini penting

- Repo udah punya fondasi: `prefers-reduced-motion` di `globals.css`, skeleton monokrom di
  `async.tsx`. Yang belum: koreografi — website kerasa kaku.
- Juri lomba menilai **"animasi in/out halus, hover relevan"** di bobot UI/UX (20 poin), dan
  warna/tipografi/gerak yang "tidak generik AI". Motion = cuan, bukan hiasan.

## 1. Prinsip motion (nggak bisa diganggu)

1. **Animasi ngasih tau, bukan ngasih liat.** Tiap gerak harus ada alasan UX tertulis.
2. **Nggak ada loop abadi** — no floating blob, no infinite pulse, no shimmer warna-warni.
   One-shot only. (Satu-satunya pengecualian: shimmer monokrom pelan di skeleton loading.)
3. **Satu event, satu animasi.** Nggak semua elemen bergerak barengan; home/profile tetap
   kalem — peta yang jadi bintang.
4. **CSS-only**: `transition` + `@keyframes`. **DILARANG** nambah dependency (Framer Motion,
   GSAP, dll) — bundle kecil, performa juri (15 poin teknis), demo <60 detik aman.
5. Semua animasi baru WAJIB tetap mati saat `prefers-reduced-motion: reduce` (cek rule global
   yang udah ada; jangan bikin keyframe yang lolos dari media query itu).
6. Tetep flat sesuai DESIGN.md: gerak pakai translate/scale/opacity, **bukan** shadow/glow baru.
   Warna status nggak berubah, cuma transisi antar warna yang udah ada.
7. DOM order nggak boleh berubah (screen reader & keyboard nav tetap waras).

## 2. Keputusan fitur motion

### IN — disetujui owner (prioritas 1+2+4+5 duluan)

**M1. Roadmap Reveal (wow-moment demo)** ⭐
- Saat roadmap hasil generate tampil, node muncul **stagger**: fade + slide-up 12px,
  jeda ±60ms per node (cap 6 node), durasi 300ms, ease-out.
- Efek: peta "tersusun" di depan mata — persepsi AI beneran ngerjain.

**M2. Transisi status kompetensi (feedback progress)**
- Node gap→setengah→kuasai: warna **transisi 400ms**, bukan lompat instan.
- Ikon centang / CheckCircle masuk **scale 0.8→1 one-shot** (bukan loop).
- Alasan: progress visual adalah inti produk — momentum anak SD dibangun di sini.

**M4. Hover & press states (micro, murah)**
- Card langkah: `translateY(-2px)` + border sedikit lebih terang, 150ms. Tetap flat, no shadow.
- Chip klarifikasi (tanya): saat dipilih — check-icon muncul + background mint transisi halus.
- Button primary: `:active { scale(0.98) }`.

**M5. Skeleton → konten cross-fade**
- Konten dateng: fade 200ms dari skeleton ke hasil (bukan tukar instan).
- Skeleton dapat shimmer monokrom pelan (satu arah, tidak norak) biar loading AI 3–5 detik
  kerasa "sengaja", bukan "lemot".

### IN — kalau waktu sisa (opsional, jangan blok M1/M2/M4/M5)

**M3. Connectors draw-in** — garis penghubung antar node kegambar via
`stroke-dasharray`→`stroke-dashoffset` 500ms, mulai ±200ms setelah stagger M1 kelar.
Catatan: kalau roadmap belum punya garis penghubung, ini boleh dibikin (SVG sederhana),
karena nguatin metafora "peta". Tapi jangan redesign layout roadmap.

**M6. Materi Anak per-bagian reveal** — 4 bagian (pengantar→analogi→inti→tantangan) stagger
fade+slide-up, pola sama dengan M1. Terapkan pas layar Materi (fitur A) kelar dibangun.

### OUT (jangan dibangun)

- ❌ Library animasi (Framer Motion/GSAP/Lottie) dan dependency baru apa pun buat motion.
- ❌ Parallax, scroll-triggered beruntun, confetti/particle pas selesai, animasi logo/hero loop.
- ❌ Animasi yang mengubah layout (height/width animate) — cuma transform/opacity, biar GPU-friendly.
- ❌ Maksimal 1 animasi per event layar; kalau dua rebutan perhatian, buang yang keduax.

## 3. Parameter standar (pakai nilai ini, jangan ngarang)

| Token | Nilai |
|---|---|
| Durasi micro (hover/press) | 150ms ease-out |
| Durasi masuk (reveal) | 300ms ease-out |
| Durasi transisi status | 400ms ease-in-out |
| Stagger antar item | 60ms, cap 6 item |
| Easing default | `cubic-bezier(0.22, 1, 0.36, 1)` untuk masuk, `ease-out` untuk hover |
| Jarak slide | 12px max |

Taruh di `:root` CSS vars (`--motion-fast`, `--motion-in`, `--motion-stagger`) biar konsisten.

## 4. Aturan delegasi

- **Satu agent frontend**, domain: `apps/web/src/**` (komponen `status.tsx`, `async.tsx`,
  `app-shell.tsx`, `globals.css`, layar roadmap/tanya/home/materi).
- **DILARUH sentuh**: API/backend, schema DB, DESIGN.md, packages/shared.
- Jurnal prompt SEBELUM spawn (aturan emas). Verifikasi orchestrator setelahnya:
  typecheck + lint + build, lalu cek visual desktop & mobile.

## 5. Definisi selesai

- [ ] Buka hasil generate roadmap → node stagger masuk (M1), kelihatan di rekaman/screenshot burst.
- [ ] Centang langkah → warna nyusul 400ms + centang pop one-shot (M2).
- [ ] Hover card/chip + `:active` button terasa, tanpa shadow baru (M4).
- [ ] Skeleton → konten cross-fade; loading AI nggak pernah blank mendadak (M5).
- [ ] `prefers-reduced-motion: reduce` aktifkan di devtools → SEMUA motion di atas mati/instan.
- [ ] Zero dependency baru; `git diff package.json` kosong di sisi motion.
- [ ] Build hijau, konsol bersih, demo path tetap <60 detik.
