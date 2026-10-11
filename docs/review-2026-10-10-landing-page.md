# Review Pagi — Arah Refactor Landing Page Peta Belajar

**Tanggal:** 10 Oktober 2026  
**Tujuan:** Briefing untuk designer sebelum refactor landing page.  
**Status:** Review arah desain; belum ada perubahan kode atau `DESIGN.md`.

---

## 1. Konteks produk

Peta Belajar adalah workspace learning-map untuk siswa SD. Produk membantu anak menentukan tujuan belajar, menjawab 2–3 pertanyaan klarifikasi singkat, lalu mendapatkan peta kompetensi yang bisa dipahami dan diikuti.

Prinsip utama:

- Peta belajar, bukan game.
- Membantu anak berpikir, bukan memberikan jawaban pekerjaan rumah secara instan.
- Satu langkah utama yang jelas pada setiap layar.
- Copy sederhana dalam bahasa Indonesia dengan sapaan “kamu”.
- Tidak boleh mengarang progress, resource, testimonial, metrik, atau klaim hasil belajar.

Alur utama yang harus tetap aman setelah refactor:

`Landing → demo/login/register → home → Tanya AI → roadmap → materi`

---

## 2. Status screenshot referensi

Screenshot referensi tersedia di:

`/root/.hermes/cache/images/img_f59ec9b1e4e5.jpg`

Ukuran file terdeteksi **1080×1920 px**, tetapi analisis vision gagal karena error gateway/backend vision. Karena itu, layout, warna, tipografi, CTA, komponen, dan perilaku responsive dari screenshot **belum dapat dipastikan**.

Konsekuensi:

- Jangan menyalin screenshot secara pixel-perfect.
- Jangan menganggap elemen visual tertentu sebagai keputusan final.
- Jika screenshot penting untuk arah implementasi, kirim ulang screenshot atau beri anotasi manual untuk hero, CTA, navigasi, kartu, dan elemen mobile.

---

## 3. Keputusan desain yang disetujui

### Identitas visual

Pertahankan identitas utama dari `DESIGN.md`:

- App frame mint di atas dark canvas.
- Surface flat.
- Tidak memakai gradient, shadow, blur, atau glassmorphism.
- Manrope sebagai font utama.
- Lucide untuk ikon fungsional.
- Radius memakai token yang sudah ada.
- Warna merah, kuning, dan hijau hanya untuk status roadmap:
  - `gap`
  - `setengah`
  - `kuasai`
- Status tidak boleh disampaikan lewat warna saja; sertakan label teks dan/atau ikon.

### Struktur hero

Landing harus punya hierarchy tunggal:

1. Heading yang menjelaskan manfaat inti.
2. Penjelasan singkat tentang memulai tujuan belajar dan mendapatkan peta.
3. Tepat satu CTA primer yang paling menonjol.

CTA primer menggunakan token `button-primary` dan harus mengarah ke alur produk yang benar-benar tersedia.

CTA sekunder boleh dipakai bila dibutuhkan, tetapi tidak boleh terlihat setara atau mengalahkan CTA primer.

### Responsive

Desktop:

- App frame rounded 40px.
- Navigasi atas tetap jelas tetapi tidak mengambil perhatian lebih besar daripada hero.
- Komposisi lapang dengan fokus pada tujuan belajar dan langkah berikutnya.

Mobile:

- Satu kolom.
- Tidak ada horizontal overflow.
- CTA utama mudah dijangkau dan tidak terpotong.
- Kontrol interaktif minimal 44×44px.
- Bottom navigation hanya digunakan bila memang relevan dengan konteks landing.

### Aksesibilitas

- Focus state keyboard harus terlihat.
- Label CTA harus konkret dan mudah dipahami.
- Accessible name tersedia untuk ikon dan tombol.
- Struktur heading, landmark, dan urutan tab logis.
- Kontras teks dan kontrol memadai.
- Jangan memakai warna sebagai satu-satunya penanda makna.

### Motion

Motion mengikuti keputusan proyek yang sudah ada:

- CSS-only; jangan menambah Framer Motion, GSAP, Lottie, atau dependency baru.
- Tidak ada loop abadi, floating blob, parallax, atau animasi logo/hero yang terus berjalan.
- Gunakan motion hanya untuk perubahan state yang membantu orientasi.
- Transformasi yang aman: `translate`, `scale`, dan `opacity`.
- Hormati `prefers-reduced-motion`.
- Landing tidak perlu menjadi layar paling ramai bergerak; roadmap tetap menjadi fokus utama motion produk.

---

## 4. Hal yang ditolak

- Menyalin screenshot sebelum visualnya bisa diverifikasi.
- Menambah hex/token warna baru.
- Gradient, shadow, blur, glassmorphism, atau chrome dekoratif.
- Menggunakan warna status roadmap sebagai dekorasi brand atau CTA.
- Banyak CTA setara di hero.
- Generic dashboard stat grid.
- Angka pengguna, testimonial, activity feed, klaim hasil belajar, atau data progres fiktif.
- AI sparkle atau ornamen AI tanpa tujuan interaksi yang jelas.
- Mengubah arsitektur atau menambah fitur di luar scope.
- Mengubah `DESIGN.md` pada tahap review ini.

---

## 5. Pertanyaan yang perlu diputuskan owner/designer

1. Label CTA utama yang dipilih:
   - `Coba demo`
   - `Mulai belajar sekarang`
2. Apakah login/register tampil sebagai CTA sekunder di landing, atau baru muncul setelah demo entry?
3. Apakah ada ilustrasi, foto, atau dekorasi dari screenshot yang wajib dipertahankan?
4. Apakah aset visual tersebut sudah tersedia dan boleh digunakan?
5. Apakah referensi memiliki desain mobile tersendiri, atau mobile diturunkan dari layout desktop?
6. Apakah bottom navigation relevan di landing, atau cukup header sederhana?
7. Apakah ada copy produk final yang sudah disetujui?
8. Apakah landing perlu motion selain hover/press dan transisi state sederhana?

**Rekomendasi sementara:** gunakan CTA utama `Coba demo`. Login/register dapat muncul setelah user masuk ke demo entry agar landing tetap punya satu langkah awal yang jelas.

---

## 6. Acceptance criteria implementasi

Landing dianggap sesuai apabila:

- Memakai app frame mint, dark canvas, flat surfaces, dan token radius dari `DESIGN.md`.
- Tidak memperkenalkan token visual baru.
- Hero memiliki heading, penjelasan singkat, dan tepat satu CTA primer yang jelas.
- CTA primer berfungsi, dapat diakses keyboard, dan menuju alur yang benar.
- Desktop memakai komposisi lapang dan navigasi atas.
- Mobile menjadi satu kolom tanpa horizontal overflow atau CTA terpotong.
- Manrope diterapkan konsisten sesuai token typography.
- Ikon interface menggunakan Lucide dan punya accessible name yang sesuai.
- Tidak ada gradient, shadow, blur, glassmorphism, sparkle dekoratif, stat grid, testimonial, klaim, atau metrik fiktif.
- Jika preview roadmap muncul di landing, warna status hanya memakai token status dan selalu ditemani teks/ikon.
- Focus indicator, heading hierarchy, landmark, label, dan tab order dapat digunakan.
- Loading, empty, error, dan offline/API-failure state memiliki copy Indonesia yang jelas serta tidak menghilangkan CTA utama.
- Motion tidak mengganggu pembacaan dan mati/minimal saat `prefers-reduced-motion` aktif.
- Diuji pada viewport desktop dan mobile.
- Tidak ada console error, horizontal overflow, atau kegagalan interaksi CTA utama.

---

## 7. Batasan review

Dokumen ini adalah hasil review arah dan kompromi desain, bukan persetujuan final implementasi pixel-level. Implementasi sebaiknya dimulai setelah:

1. Screenshot referensi bisa dianalisis atau diberi anotasi manual.
2. Owner memilih label CTA utama.
3. Designer menyepakati apakah ada aset visual referensi yang wajib dipertahankan.

Tidak ada kode, `DESIGN.md`, atau token visual yang diubah sebagai bagian dari review ini.
