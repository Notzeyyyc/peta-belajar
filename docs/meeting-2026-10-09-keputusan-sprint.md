# Hasil Meeting — Peta Belajar (9 Okt 2026)

> Dokumen briefing untuk orchestrator. Ini keputusan yang barusan kita ambil bareng owner.
> Baca ini + AGENTS.md + DESIGN.md + PRD sebelum delegasi apa pun. Deadline submission: **15 Okt 2026**.

---

## 1. Kondisi repo saat audit

Monorepo `/root/peta-belajar` (1 commit: scaffold + backend + 7 screen). Alur inti jalan:
clarify → generate → roadmap → complete, divalidasi Zod (`packages/shared`), status gap/half/master
+ `reason` + `nextAction`, katalog resource allowlist, logging `ai_runs`.

**4 bolong yang ditemukan (owner ngerasa "ada yang kurang" — semuanya dikonfirmasi relevan):**
1. Roadmap belum editable — AGENTS.md minta "explainable AND editable", nggak ada PATCH/DELETE + UI.
2. Materi terlalu tipis — tiap kompetensi cuma ngarahin ke link resource; panduan "guide thinking"
   belum terasa di dalam app.
3. Nggak ada memori antar-roadmap — cumulative gaps di Profil baru ada tabelnya, belum ada alurnya.
4. Sisa scaffolding: `/api/example` nyangkut, magic-link kemungkinan masih stub.

---

## 2. Keputusan FITUR — scope terkunci sprint ini: **A + C + B**

### A. Materi Anak ⭐ (prioritas 1)
AI **tidak cari sumber ke internet**. Sumber = teks yang udah ada di katalog (hasil kurasi C).
Saat anak buka langkah, model menyederhanakan teks sumber jadi materi bahasa anak, dengan
**struktur tetap yang divalidasi Zod** (schema baru di `packages/shared`, mis. `MateriAnakSchema`):
1. `pengantar` — 2–3 kalimat, sapaan "kamu"
2. `analogi` — analogi kehidupan sehari-hari anak SD
3. `inti` — poin-poin pendek (array)
4. `tantangan` — pertanyaan pemantik cara berpikir, **BUKAN jawaban** (prinsip anti-homework-bot)

Aturan keras:
- Prompt dikunci: "hanya gunakan teks sumber, jangan tambah fakta baru, tanpa URL."
- **Cache** hasil per (resourceId + learningStyle) → tabel baru `materi_cache` di schema; panggilan
  kedua instan → demo tetap < 60 detik.
- Endpoint baru: `GET /api/roadmaps/:id/steps/:stepId/materi` (pola requireAuth + aiLimiter yang ada).
- Layar materi di `apps/web` dirombak: tampilkan 4 bagian itu + link sumber asli dari katalog.
- Handle failure: AI error/timeout → fallback tampilkan resource katalog polos + pesan ramah (state
  loading/error/empty wajib, sesuai AGENTS.md).

### C. Katalog digedein + kurasi (prioritas 1, barengan A)
- Tambah ~25–30 resource SD, berbahasa Indonesia, terkurasi manual.
- Kolom baru `content` (teks/transkrip sumber) di tabel `resources` → ini bahan mentah buat A.
- Owner (via orchestrator) yang nyiapin kandidat artikel/video + transkripnya; URL tetap dari
  katalog, model nggak pernah ngetik URL.

### B. Roadmap editable (prioritas 2)
- `PATCH /api/roadmaps/:id` (edit goal/judul), `PATCH .../steps/:stepId` (ubah nama/status/catatan),
  `DELETE .../steps/:stepId` (buang langkah yang nggak relevan), validasi Zod di boundary.
- UI: tombol edit/hapus per node di layar roadmap; konfirmasi sebelum hapus; status change
  gap/half/master manual juga boleh (warnanya jangan satu-satunya penanda — tetap teks/ikon).
- Ini nutup prinsip "setiap roadmap harus bisa dijelaskan DAN diubah user".

### Explicitly OUT buat sprint ini (jangan dibangun, boleh disebut di docs sbg rencana)
- ❌ Search API live (YouTube/Brave/Wikipedia) + auto-curation.
- ❌ Panel admin kurasi + status "menunggu moderasi".
  → Keduanya masuk **roadmap pasca-lomba**; di deck/docs ditulis sebagai arsitektur
  *"AI-assisted curation, human-gated"* — nilai inovasi tanpa risiko.
- ❌ D (cumulative gaps Profil) — cuma kalau A+C+B kelar & ada waktu sisa.
- Tetap skip sesuai PRD: kuis otomatis, komunitas/share, gamifikasi.

---

## 3. Keputusan PRODUK/KONSEP yang udah disepakati

- Positioning tetap **"peta, bukan game"** — anti gamifikasi berlebihan, anak SD.
- "Mudah dipahami" jadi fitur inti: bukan sekadar link video, tapi materi yang disederhanakan
  ke bahasa anak + tantangan mikir.
- Masalah nyata yang dijawab (buat docs & deck): mulai dari mana (roadmap), materi terlalu dewasa
  (Materi Anak), nggak ada yang tahu level awal (klarifikasi AI), motivasi turun (progress visual),
  orang tua bingung (ringkasan profil), takut salah jawab (panduan bukan jawaban).
- Semua teks UI: Indonesia sederhana, "kamu", konsisten DESIGN.md (mint frame, status
  #B3452F/#C8A02E/#3E7C4F khusus roadmap, Manrope, Lucide).

---

## 4. Aturan main sprint (diulang biar orchestrator nggak amnesia)

1. **Jurnal sebelum delegasi** — prompt lengkap ke `/root/jurnal_prompt.md`, termasuk prompt
   debugging. Dicocokkan juri dengan riwayat commit.
2. **Verifikasi sendiri** — typecheck/lint/build/test/apps jalanin orchestrator; self-report agent
   bukan bukti.
3. **Satu agent satu domain** — backend schema+API dulu (A+C), frontend materi (A) menyusul,
   roadmap-editable (B) setelahnya atau agent terpisah dengan file non-overlap.
4. **Commit boleh mulai 5 Okt 09.30** (sudah lewat → kini terbuka), pesan rapi & bermakna.
5. Larangan sub-agent: nambah fitur di luar dokumen ini, ganti DESIGN.md, library terlarang
   (Prisma/LangChain/Redux/vector DB), API key di client, `git commit` tanpa izin orchestrator.
6. Gotcha deploy: frontend fetch `/api` relatif + rewrites proxy di `next.config.mjs` (localhost
   ke-bake = error 'offline' di device lain). Cek demo dari device lain + desktop & mobile width.

**Urutan eksekusi yang disetujui owner:** A+C (backend → frontend) → B → hardening (SEO meta,
favicon, lazy load, kompresi aset, hapus `/api/example`, stub magic-link dibenerin/di-note) →
submission (repo public, deploy hidup, jurnal + docs acuan AI Agent dirapikan).

---

## 5. Definisi selesai sprint

- [ ] Buka langkah roadmap → Materi Anak 4 bagian muncul, bahasa anak, tanpa fakta baru.
- [ ] Buka ulang langkah yang sama → instan (cache), nggak ada panggilan AI kedua.
- [ ] ≥25 resource katalog punya `content`, terkurasi, tanpa URL karangan.
- [ ] Roadmap bisa diedit & dihapus langkahnya, tervalidasi, tetap explainable.
- [ ] Typecheck + lint + unit test + build hijau; test gagal-AI & output malformed jalan.
- [ ] Demo end-to-end < 60 detik dari device lain; konsol browser bersih.
