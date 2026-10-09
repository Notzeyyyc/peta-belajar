# PRD — Peta Belajar

**Versi:** 0.2
**Status:** Draft siap implementasi
**Produk:** Peta Belajar
**Tema lomba:** Innovating Education Through Technology — Web Education for Kids (SD)
**Bahasa UI:** Indonesia, kasual-sopan dengan “kamu”

## 1. Ringkasan

Peta Belajar membantu siswa SD mengubah tujuan belajar satu kalimat menjadi roadmap kemampuan yang relevan. AI tidak memberi jawaban tugas secara instan; AI bertanya singkat untuk memahami tujuan, pengalaman awal, dan gaya belajar, lalu menghasilkan peta kompetensi dengan status `kuasai`, `setengah`, atau `gap`. Siswa mengikuti materi dan checklist, lalu roadmap berubah saat progres diperbarui.

**Kalimat produk:** AI yang membantu menentukan arah belajar, bukan yang membuat siswa berhenti berpikir.

## 2. Masalah

- Siswa punya tujuan tetapi tidak tahu harus mulai dari mana.
- Chatbot umum cenderung memberi jawaban jadi.
- Roadmap statis tidak tahu posisi awal siswa.
- Guru/juri membutuhkan hasil yang bisa dipahami dalam kurang dari satu menit.

## 3. Tujuan dan batasan

### Tujuan

1. Tujuan satu kalimat menjadi peta awal dalam kurang dari 60 detik.
2. AI mengklarifikasi dengan 2–3 pertanyaan chip.
3. Peta menunjukkan status per kompetensi dan langkah berikutnya.
4. Checklist menyimpan progres dan mengubah status secara konsisten.
5. Demo juri bisa berjalan tanpa email dan data tersimpan setelah refresh.

### Bukan tujuan versi 0.2

- LMS penuh, marketplace, komunitas, feed sosial, atau chat AI bebas.
- Kuis penilaian otomatis yang menentukan nilai akademik.
- RAG/vector database.
- Gamifikasi kompleks.
- Penggunaan produksi anak tanpa consent/guardian flow dan review keamanan.

## 4. Target pengguna

- **Siswa SD kelas 4–6:** membutuhkan bahasa sederhana, visual jelas, tombol besar, dan satu langkah berikutnya.
- **Orang tua/guru:** membutuhkan ringkasan gap dan progres, bukan percakapan AI panjang.
- **Juri:** membutuhkan demo cepat, akun demo, dan roadmap yang tampak nyata.

## 5. Screen wajib

1. **Landing page:** proposisi produk, contoh peta, CTA `Buat petaku` dan `Lihat contoh`.
2. **Login/Register:** magic link atau demo login; tanpa password pada MVP.
3. **Home:** roadmap aktif, progress terbaru, materi relevan, CTA `Tanya AI`.
4. **Tanya AI:** tujuan belajar, 2–3 pertanyaan chip, ringkasan sebelum generate.
5. **Roadmap menu:** daftar kompetensi vertikal dengan status gap/setengah/kuasai.
6. **Roadmap materi:** detail kompetensi, format materi, durasi, resource allowlist, checklist.
7. **Profile:** nama, roadmap tersimpan, gap kumulatif, progres, preferensi gaya belajar.

## 6. Alur utama demo

1. Buka landing.
2. Klik `Buat petaku` atau `Lihat contoh`.
3. Masuk demo tanpa email.
4. Masukkan: `Aku mau bisa bikin web sendiri buat jualan.`
5. Jawab 2–3 chip klarifikasi.
6. Backend memanggil OpenAI SDK dan memvalidasi output terstruktur.
7. Roadmap tampil dengan 3–6 kompetensi.
8. Buka materi dan centang satu langkah.
9. Status/progress berubah dan tersimpan.
10. Refresh atau buka ulang → roadmap tetap ada.

## 7. Persyaratan fungsional

### Auth dan sesi

- Demo account seeded untuk juri.
- MVP dapat memakai magic link; provider email dapat ditambahkan setelah flow demo stabil.
- Session cookie HTTP-only, secure di production, SameSite sesuai deployment.

### AI clarification dan generation

- Input tujuan maksimal 240 karakter.
- Pertanyaan AI maksimal 3, masing-masing memiliki 2–4 pilihan jawaban.
- Model menghasilkan JSON tervalidasi Zod:
  - `title`
  - `summary`
  - `competencies[]`
  - setiap kompetensi: `name`, `description`, `status`, `reason`, `nextAction`, `resourceIds[]`
- `status` hanya `gap | half | master`.
- Jika output invalid, jangan simpan; tampilkan retry yang ramah.
- Resource hanya berasal dari katalog internal berdasarkan `resourceIds`.

### Roadmap dan progres

- Setiap roadmap punya owner, goal, status, timestamps, dan kompetensi berurutan.
- Completion idempotent; refresh tidak menggandakan progres.
- Progres dihitung dari langkah selesai, bukan angka buatan.
- Siswa dapat membuat roadmap baru dan melihat roadmap tersimpan.

## 8. Data model awal

- `users`: id, displayName, email nullable, role, createdAt.
- `sessions`: id, userId, expiresAt, createdAt.
- `learning_preferences`: userId, style, updatedAt.
- `roadmaps`: id, userId, goal, title, summary, createdAt, updatedAt.
- `competencies`: id, roadmapId, position, name, description, status, reason, nextAction.
- `resources`: id, title, description, type, durationMinutes, url, level, active.
- `competency_resources`: competencyId, resourceId.
- `progress`: id, userId, competencyId, completedAt.
- `ai_runs`: id, userId, roadmapId nullable, inputHash, model, latencyMs, status, errorCode, createdAt.

## 9. Stack keputusan

### Wajib

- **Frontend:** Next.js App Router + TypeScript.
- **UI:** Tailwind CSS + shadcn/ui + Lucide React.
- **Backend:** Express + TypeScript.
- **Database:** SQLite + Drizzle ORM + better-sqlite3.
- **AI:** OpenAI SDK, server-side only.
- **Validation:** Zod.

### Saran tambahan

- **Monorepo:** pnpm workspaces dengan `apps/web`, `apps/api`, dan `packages/shared` untuk schema/type bersama. Ini mengurangi mismatch antara frontend dan Express.
- **Auth MVP:** custom demo session + magic-link abstraction. Jangan menambah auth provider berat sebelum kebutuhan email jelas.
- **Testing:** Vitest untuk unit/API, Playwright untuk flow demo/browser, Testing Library untuk komponen yang punya state.
- **Logging:** pino dengan redaction; jangan log prompt lengkap atau secrets.
- **Rate limit:** express-rate-limit pada endpoint AI.
- **Deployment:** satu VPS dengan reverse proxy Caddy/Nginx; Next standalone dan Express sebagai dua process service.
- **Backup:** backup SQLite terjadwal dengan file database dan restore test.
- **Observability MVP:** health endpoint, request ID, latency/error counters sederhana.

### Yang jangan ditambah dulu

- Prisma, PostgreSQL, pgvector, LangChain, Redis, queue system, microservices, CMS, analytics suite, atau state-management library besar.
- SQLite cukup untuk demo dan traffic rendah; rencanakan migrasi PostgreSQL hanya jika concurrency, multi-instance deployment, atau data production menuntutnya.
- Express tidak overkill bila backend dipisah dan akan menjadi API utama; untuk MVP super kecil Next Route Handlers lebih sederhana, tetapi pilihan Express tetap valid untuk struktur lomba dan migrasi.

## 10. Endpoint MVP

- `POST /api/auth/demo`
- `POST /api/auth/magic-link/request`
- `GET /api/me`
- `GET /api/roadmaps`
- `POST /api/roadmaps/clarify`
- `POST /api/roadmaps/generate`
- `GET /api/roadmaps/:id`
- `POST /api/roadmaps/:id/competencies/:competencyId/complete`
- `GET /api/resources`
- `GET /health`

## 11. Non-functional requirements

- UI responsive pada 390px dan desktop 1440px.
- Target tap minimal 44px.
- Keyboard focus terlihat.
- Loading, empty, error, retry, timeout, dan rate-limit state tersedia.
- AI timeout dan output invalid tidak merusak roadmap lama.
- API key tidak pernah masuk bundle frontend.
- Input dan output AI dibatasi panjangnya.
- PII minimal dan log ter-redact.
- Production build, typecheck, lint, unit test, dan smoke test wajib lulus.

## 12. Risiko dan kekurangan yang harus diselesaikan

1. **Kualitas roadmap AI:** buat schema ketat, prompt versioning, fixture test, dan fallback error.
2. **Kesesuaian materi:** gunakan katalog resource terkurasi, bukan URL buatan model.
3. **Privasi anak:** MVP gunakan data minimal; sebelum public launch tambahkan consent guardian, privacy policy, retention policy, dan review data provider.
4. **SQLite concurrency:** gunakan satu process writer/backup discipline; migrasi DB bila deployment menjadi multi-instance.
5. **Magic link:** membutuhkan email provider dan expiry/replay protection; demo login harus tetap tersedia untuk juri.
6. **Tanggal dan konten kurikulum:** simpan sumber/referensi konten secara eksplisit; jangan membuat klaim kurikulum tanpa verifikasi.

## 13. Acceptance criteria demo

- Landing → demo login → goal → 2–3 chip → roadmap tampil tanpa console error.
- Roadmap berisi kompetensi dengan status, alasan, langkah berikutnya, dan resource valid.
- Checklist mengubah progres berdasarkan data nyata.
- Refresh mempertahankan roadmap.
- Error AI menampilkan pesan dan retry tanpa kehilangan data lama.
- Flow selesai kurang dari 60 detik untuk juri terlatih.
