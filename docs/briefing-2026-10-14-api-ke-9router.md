# Briefing Agent — Arahkan `apps/api` Peta Belajar ke 9Router Lokal (AI nyata, bukan mock)

**Tanggal:** 14 Oktober 2026
**Untuk:** agent pelaksana (topic code)
**Repo:** `/root/peta-belajar` (GitHub `Notzeyyyc/peta-belajar`, branch `main`, HEAD `3ab888c`)
**Deadline lomba:** 15 Oktober 2026 — kerjakan minimal, jangan bikin fitur baru.

---

## 1. Tujuan

Ganti backend AI Peta Belajar dari gateway `https://ai.qenoxit.site/api/v1` (**MATI — balas HTTP 530**) ke gateway 9Router lokal `http://127.0.0.1:20128/v1`, lalu matikan `AI_MOCK` supaya demo pakai AI **beneran**.

Hasil akhir yang diharapkan: `POST /api/roadmaps/clarify` dan `POST /api/roadmaps/generate` balas **200/201 dengan JSON valid** (bukan 502 `AI_INVALID_OUTPUT`, bukan 503), dan alur demo di browser jalan tanpa mock.

---

## 2. Fakta yang SUDAH diverifikasi (jangan diulang dari nol)

| Hal | Status terverifikasi (14 Okt 2026) |
|---|---|
| 9Router | **HIDUP**, systemd unit `9router.service` (enabled), listen `0.0.0.0:20128` |
| Base URL gateway | `http://127.0.0.1:20128/v1` (OpenAI-compatible) |
| API key 9Router | tabel `apiKeys`, name `Hermes` di `/root/.9router/db/data.sqlite` — `sk-de9a8c3…` (35 char) |
| Gateway `ai.qenoxit.site` | **MATI** (HTTP 530) — penyebab demo harus pakai mock |
| Provider di 9Router | prefix `knri/` = Kenari (`https://kenari.id/v1`, key **valid**) |
| TokenHarbor (`tknh/`) | **saldo $0** → 402, jangan dipakai |
| AgnesAI (`agnes/`) | belum ada kredensial aktif → 404, jangan dipakai |

### Model yang SUDAH dites patuh `response_format: {"type":"json_object"}` lewat 9Router

Dites langsung 14 Okt dengan prompt persis seperti di `apps/api/src/ai/client.ts`:

| Model | Hasil |
|---|---|
| `knri/agnes-2-5-flash:free` | ✅ JSON valid (`{"questions":[...]}`) — **REKOMENDASI** (gratis, 512K ctx) |
| `knri/gpt-oss-120b` | ✅ JSON valid |
| `knri/deepseek-v4-flash` | ✅ JSON valid |
| `knri/gemini-3-8-flash` | ✅ JSON valid |
| `knri/glm-5-3-flash` | ❌ balas pagar Markdown ` ```json ` → gagal parse |
| `knri/qwen3-coder` | ❌ HTTP 400 |
| `knri/gpt-5-4-mini` | ❌ HTTP 400 |

**Pakai `knri/agnes-2-5-flash:free`** sebagai `OPENAI_MODEL`. Kalau nanti dianggap kurang stabil saat demo, `knri/gpt-oss-120b` adalah cadangan yang sudah terbukti.

---

## 3. Yang harus diubah

### 3.1 `apps/api/.env` (file utama)

Set nilai berikut (JANGAN hapus baris lain):

```
OPENAI_API_KEY=<key 9Router name=Hermes dari /root/.9router/db/data.sqlite>
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
OPENAI_MODEL=knri/agnes-2-5-flash:free
AI_MOCK=false
```

Cara ambil key (jangan tulis key ke chat/log):

```bash
sqlite3 /root/.9router/db/data.sqlite \
  "SELECT key FROM apiKeys WHERE name='Hermes' ORDER BY createdAt DESC LIMIT 1;"
```

Simpan `.env` dengan permission `0600`.

### 3.2 PENTING — API **tidak** auto-load `.env`

`apps/api/src/index.ts` baca `process.env` langsung, dan repo **tidak punya `dotenv`**. Jadi `.env` cuma akan terbaca kalau di-export saat start:

```bash
cd /root/peta-belajar/apps/api && set -a && . ./.env && set +a && exec node dist/src/index.js
```

**Jangan** mengubah `src/index.ts` untuk menambah dotenv (di luar scope, nambah dependency). Cukup pakai pola export di atas.

### 3.3 Yang TIDAK boleh diubah

- `apps/api/src/ai/client.ts` — logika prompt, `response_format`, validasi Zod: **biarkan apa adanya**.
- `DESIGN.md`, token visual, `AGENTS.md`, `PRD.md`.
- Schema DB, endpoint, alur produk.
- Jangan `git commit` (aturan proyek: commit hanya lewat orchestrator).

---

## 4. Jebakan yang WAJIB diantisipasi

### 4.1 9Router kadang menempel `data: [DONE]` di akhir respons non-stream

`client.chat.completions.create()` tanpa `stream` akan di-parse sebagai JSON utuh oleh OpenAI SDK. Kalau gateway menempel sentinel SSE, parse gagal → error dilempar → app balas **502**. **Uji dulu**, jangan asumsi:

```bash
KEY=$(sqlite3 /root/.9router/db/data.sqlite "SELECT key FROM apiKeys WHERE name='Hermes' LIMIT 1;")
curl -s -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"knri/agnes-2-5-flash:free","messages":[{"role":"user","content":"balas JSON {\"ok\":true}"}],"response_format":{"type":"json_object"}}'
```

Kalau ada `data: [DONE]` menempel, **lapor ke orchestrator** sebelum menambal `client.ts` — perubahan di file itu harus lewat approval.

### 4.2 Model reasoning bisa mengosongkan `message.content`

`chatJson()` di `client.ts` menganggap `content` kosong = error 502. Kalau model terpilih balas di `reasoning_content` dengan `content: null`, ganti model (lihat tabel §2). Jangan ubah `client.ts` untuk membaca `reasoning_content` tanpa approval.

### 4.3 Rate limit

Ada `AI_RATE_LIMIT_PER_MIN` (default 10/menit). Untuk uji cepat berulang, set sementara lebih tinggi di `.env`, lalu **kembalikan ke default** sebelum selesai.

---

## 5. Langkah kerja (urut)

1. **Ambil key** 9Router dari `apiKeys` (name=`Hermes`).
2. **Uji gateway langsung** dengan `curl` (§4.1) — pastikan model pilihan balas JSON valid tanpa sentinel.
3. **Update `apps/api/.env`** sesuai §3.1, `chmod 600`.
4. **Build API:** `cd /root/peta-belajar && pnpm --filter @peta-belajar/api build`
5. **Jalankan API dengan env ter-export** (pola §3.2), port 4000.
6. **Uji end-to-end lewat HTTP:**
   - `POST /api/auth/demo` → ambil cookie
   - `POST /api/roadmaps/clarify` `{"goal":"..."}` → harap **200** berisi `questions[]`
   - `POST /api/roadmaps/generate` `{"goal":"...","answers":[...]}` → harap **201** berisi `roadmap` + `competencies[]`
   - Pastikan `resourceIds` yang balik **hanya** ID dari katalog (bukan URL/ID karangan)
   - `GET /api/roadmaps/:id/steps/:stepId/materi` → harap `mode:"ai"` (bukan `"fallback"`)
7. **Uji lewat browser** (web `:3000`): alur landing → tanya → klarifikasi → peta, pastikan peta ter-render dari AI nyata.
8. **Kembalikan** `AI_RATE_LIMIT_PER_MIN` ke default bila diubah.

---

## 6. Acceptance criteria (bukti wajib, bukan klaim)

Laporkan dengan output nyata:

- [ ] `curl` gateway 9Router → JSON valid, tempel respons mentahnya (potong).
- [ ] `POST /api/roadmaps/clarify` → **200** + `questions[]` (tempel body).
- [ ] `POST /api/roadmaps/generate` → **201** + `competencies[]` (tempel ringkas).
- [ ] Semua `resourceIds` yang balik ada di tabel `resources` (buktikan dengan query).
- [ ] `/materi` → `mode:"ai"` minimal sekali (bukan fallback).
- [ ] Screenshot alur peta di browser (desktop + mobile 390px), simpan ke `/root/.hermes/cache/scratch/shots/ai-*.png`.
- [ ] `pnpm -r typecheck` + `pnpm -r build` hijau.
- [ ] Uji API lama (27 Vitest) tetap hijau: `cd apps/api && npx vitest run`.

**Kalau salah satu endpoint tetap balas 502/503:** JANGAN diam-diam balik ke `AI_MOCK=true`. Laporkan model yang dicoba + body error mentahnya ke orchestrator.

---

## 7. Larangan

- Jangan tambah fitur/library baru, jangan ubah DESIGN.md/token.
- Jangan taruh API key di client/bundle frontend.
- Jangan `git commit` / `git push`.
- Jangan hapus atau melemahkan validasi Zod.
- Jangan mengubah `client.ts`, schema DB, atau endpoint tanpa approval orchestrator.
- Jangan menulis secret (key) ke dalam log, jurnal, atau chat.

---

## 8. Kalau macet

Lapor ke orchestrator dengan format: **langkah yang dicoba → output mentah → hipotesis → blocker**. Jangan mengarang hasil. Provider 9Router bisa diuji manual kapan saja dengan perintah §4.1.
