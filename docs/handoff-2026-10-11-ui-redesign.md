# Handoff — Implementasi Redesign UI Peta Belajar

**Tanggal:** 11 Oktober 2026
**Status:** Mockup disetujui lead. Siap implementasi ke Next.js.
**Referensi wajib:** `/root/peta-belajar/DESIGN.md` (source of truth, **tidak berubah**), mockup HTML di `/root/peta-belajar/docs/mockup/`, screenshot final di `/tmp/mockup4/`.

---

## 1. Ringkasan keputusan (final)

| Topik | Keputusan |
|---|---|
| Skema warna | **Konsep awal dipertahankan**: dark canvas `#161616` + mint app frame `#E3EDE5` radius 40px. Full-mint full-bleed DIBATALKAN. |
| Struktur landing | **Gaya WizardZ diadopsi**: header+CTA → hero 2 kolom (copy kiri, preview roadmap kanan) → trust strip 3 chip → 3 kartu "Cara Kerja" → CTA banner gelap → footer. |
| Visual WizardZ yang DITOLAK | Lime `#B9FF66`, Space Grotesk, stiker tebal, shadow offset, logo klien fiktif, case study/testimonial/metrik fiktif. |
| CTA utama | **`Mulai belajar sekarang`** → masuk alur produk (bukan login dulu). Login/register baru muncul setelahnya. |
| Ilustrasi hero | **Preview roadmap fungsional** (node Kuasai/Setengah/Gap/Terkunci, label teks + ikon) — bukan ilustrasi dekoratif. |
| Home & roadmap detail | Roadmap **bervisual** (jalur node vertikal berwarna + ikon + label status) agar ramah anak. |
| Konten mockup | Anak SD: "Pecahan Kelas 4", dst. BUKAN konten dewasa (frontend developer dsb itu salah, sudah dikoreksi). |
| `DESIGN.md` | **Tidak perlu diubah.** Semua section ke-map ke token yang sudah ada. Nol warna baru. |

---

## 2. Aturan visual (dari DESIGN.md + dokumen review)

- **Flat total**: no gradient, no shadow, no blur, no glass, no sparkle dekoratif.
- Font **Manrope** sesuai token typography. Ikon **Lucide** (bukan emoji, bukan unicode).
- Warna status (`gap #B3452F`, `half #C8A02E`, `master #3E7C4F`) **hanya untuk data roadmap**, selalu ditemani label teks + ikon.
- Radius token: frame 40 (mobile 28), card 24, tile 18, control 14, pill 999.
- Touch target ≥ 44px. Satu CTA primer per layar.
- Motion: CSS-only (`translate`, `scale`, `opacity`), hormati `prefers-reduced-motion`. Tanpa dependency animasi baru.
- Jangan mengarang progress, testimonial, metrik, atau klaim. Stats hanya data nyata milik user.
- Copy: Bahasa Indonesia sederhana, sapaan "kamu".

---

## 3. Scope implementasi per file

Semua di `apps/web/src/`. Mockup referensi: `docs/mockup/<nama>.html`.

### 3.1 Landing — `app/page.tsx` (refactor total)
Struktur persis `mockup/landing.html`:
1. **Header**: logo (Lucide `map` dalam kotak dark) + nav "Cara Kerja", "Tentang" + CTA primer "Mulai belajar sekarang" (`button-primary`).
2. **Hero 2 kolom** (desktop; mobile 1 kolom):
   - Kiri: `display` "Tujuan belajarmu, **jadi peta yang jelas.**" + body copy + CTA primer.
   - Kanan: card "Contoh peta: Pecahan Kelas 4" — 4 node vertikal: Kuasai (check), Setengah (minus), Langkah berikutnya (flag), Terkunci (lock). Garis track `line` 2px.
3. **Trust strip**: 3 chip — "Bukan mesin jawaban" (`shield-check`), "Peta bisa kamu edit" (`pencil`), "Satu langkah jelas tiap layar" (`footprints`).
4. **Cara Kerja**: `sec-label` gelap + heading + 3 kartu bernomor (Tulis tujuanmu / Dapatkan peta kompetensi / Belajar terpandu; ikon `message-circle-question`, `map`, `book-open`).
5. **CTA banner** `panel-dark`: "Siap melihat petamu?" + tombol inverse.
6. **Footer** sederhana, separator dashed.
- Pertahankan integrasi API contoh peta yang sudah ada bila memungkinkan (loading/error/empty state wajib tetap ada), fallback konten statis mockup.
- Hapus CTA kedua "Lihat contoh" — tepat satu CTA primer.

### 3.2 Home — `app/home/page.tsx`
- Pertahankan data fetching `api.home()` + states.
- Tambah **jalur roadmap visual** ("Petamu saat ini") ala `mockup/home.html`: node `done/half/gap/locked` dalam `.roadmap-track`, status badge teks+ikon, CTA "Lanjutkan" pada node aktif.
- Section "Langkah berikutnya": 2 row (Tanya AI, Buka peta).
- Jangan tampilkan stats yang tidak ada di API (tidak ada streak/lencana fiktif).

### 3.3 Roadmap list — `app/roadmap/page.tsx` (+ `client.tsx`)
- Header "Peta belajarmu" + CTA "Buat peta baru" → `/tanya`.
- Row per peta: ikon, judul + status badge, meta, progress bar bila berjalan, aksi kanan (Lanjutkan/Mulai/Tuntas).
- Hindari ikon `x` (ambiguitas tombol tutup) — pakai ikon netral (`hash`, `divide`, `ruler`).

### 3.4 Roadmap detail — `app/roadmap/[id]/page.tsx`
- Jalur vertikal `.path`: circle node 64px, connector, status pill per node, CTA "Lanjutkan belajar" pada node aktif.
- Card progres keseluruhan di atas.

### 3.5 Materi — `app/roadmap/[id]/materi/[compId]/page.tsx`
- Badge meta (Materi x dari y, durasi — ikon `book-open`, `clock`).
- Kartu materi, placeholder video (ikon `play`), kartu latihan dengan opsi jawaban `button-secondary` full-width left-aligned.
- Aksi bawah: Materi sebelumnya / Tanya AI / Tandai selesai & lanjut.

### 3.6 Tanya AI — `app/tanya/page.tsx`
- Chip saran pertanyaan, gelembung chat (AI: card kiri; user: dark kanan), input bar dengan tombol "Kirim" (ikon `send`).
- Pertahankan prinsip: AI membimbing, bukan menjawab instan.

### 3.7 Login — `app/login/page.tsx`
- Kartu auth di tengah frame: logo dark, heading, magic-link email (sesuai API `POST /api/auth/magic-link/request`), link "Coba demo dulu".
- Hapus password field & tombol Google (tidak ada di API surface).

### 3.8 Profile — `app/profile/page.tsx`
- Kartu profil (avatar inisial, nama, kelas), stats **dari data API saja**, daftar peta tersimpan dengan status badge, pengaturan (pengingat, bahasa, keluar).
- Avatar header jangan duplikat jika sudah ada di kartu — cukup satu.

### 3.9 Shell & navigasi
- `AppShell`: body `bg-canvas`, frame mint radius 40 (mobile 28) min-height viewport — **pertahankan pola yang sudah ada**, sesuaikan padding token (page 42px, mobile 20px).
- Top nav desktop: Beranda / Peta / Tanya AI + avatar. Mobile: bottom nav 4 item (`home`, `map`, `message-circle-question`, `user`), state aktif jelas, konten diberi padding-bottom.

---

## 4. Mapping token → Tailwind (sudah ada di config)

| Token | Kelas |
|---|---|
| canvas `#161616` | `bg-canvas` |
| window `#E3EDE5` | `bg-window` |
| card `#F4F6F3` | `bg-card` |
| dark / dark-elev | `bg-dark` / `hover:bg-dark-elev` |
| ink / ink-2 / line | `text-ink` / `text-ink-2` / `border-line` |
| status | `bg-status-gap` dll (cek `tailwind.config.ts` / `components/status.tsx` — `STATUS_META` sudah ada, pakai itu) |
| radius | `rounded-frame/card/tile/control/pill` |
| typography | display 60/400/-2px, heading 28/-1px, title 15/700, body 14/1.6, meta 11/600 |

Komponen existing yang wajib dipakai ulang: `STATUS_META`, `ProgressBar`, `SkeletonBlock`, `ErrorState`, `EmptyState`, `AppShell`, `AppNav`.

---

## 5. Acceptance criteria

- [ ] Semua halaman: mint frame radius 40 di atas dark canvas; flat; nol warna/gradient/shadow di luar token.
- [ ] Landing mengikuti struktur 6 section di §3.1 dengan tepat satu CTA primer "Mulai belajar sekarang".
- [ ] Home & roadmap detail menampilkan jalur node visual; setiap status = warna + label teks + ikon.
- [ ] Login memakai magic link sesuai API, bukan password/Google.
- [ ] Mobile: satu kolom, tanpa horizontal overflow, bottom nav, target ≥44px, CTA tidak terpotong.
- [ ] Loading/empty/error/offline states dengan copy Indonesia jelas; CTA utama tidak hilang.
- [ ] Keyboard focus terlihat; heading/landmark/tab order logis; ikon punya accessible name.
- [ ] Tidak ada data fiktif (streak, lencana, testimonial, metrik).
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` hijau; diverifikasi di browser desktop + mobile tanpa console error.

## 6. Di luar scope (jangan dikerjakan)

- Mengubah `DESIGN.md`, arsitektur API, atau skema DB.
- Menambah dependency (animasi, ikon pack lain, dsb).
- Fitur baru di luar 8 halaman di atas.
