import { createDb, getDbPath, schema } from "./db/client.js";

const db = createDb();
const now = new Date();

// --- 1 akun demo juri (PRD §7: demo account seeded untuk juri) ---
const DEMO_USER_ID = "user_demo_juri";
db.insert(schema.users)
  .values({
    id: DEMO_USER_ID,
    displayName: "Juri Demo",
    email: null,
    role: "judge",
    createdAt: now,
  })
  .onConflictDoNothing()
  .run();

db.insert(schema.learningPreferences)
  .values({ userId: DEMO_USER_ID, style: "visual", updatedAt: now })
  .onConflictDoNothing()
  .run();

// --- Katalog resource nyata, relevan siswa SD (>= 10) ---
const RESOURCES = [
  { id: "res_scratch", title: "Scratch — Coding untuk Anak", description: "Platform visual dari MIT untuk belajar logika pemrograman lewat blok warna-warni.", type: "interactive", durationMinutes: 45, url: "https://scratch.mit.edu/", level: "beginner" },
  { id: "res_codeorg_course1", title: "Code.org Course 1 (Kelas 1-3)", description: "Kursus pengantar konsep dasar komputer dan coding dengan puzzle seru.", type: "course", durationMinutes: 60, url: "https://studio.code.org/s/course1", level: "beginner" },
  { id: "res_codeorg_express", title: "Code.org Express Course", description: "Kursus ekspres dasar-dasar ilmu komputer untuk siswa SD.", type: "course", durationMinutes: 90, url: "https://studio.code.org/s/express", level: "beginner" },
  { id: "res_khan_computing", title: "Khan Academy — Intro to JS", description: "Belajar JavaScript dengan menggambar dan animasi, cocok untuk pemula.", type: "course", durationMinutes: 60, url: "https://www.khanacademy.org/computing/computer-programming/programming", level: "beginner" },
  { id: "res_belajarhtml_id", title: "Belajar HTML Dasar (Petani Kode)", description: "Tutorial HTML berbahasa Indonesia langkah demi langkah untuk pemula.", type: "article", durationMinutes: 30, url: "https://www.petanikode.com/html-dasar/", level: "beginner" },
  { id: "res_dicoding_web", title: "Dicoding — Belajar Dasar Pemrograman Web", description: "Kelas gratis dasar HTML, CSS, dan JavaScript dengan sertifikat.", type: "course", durationMinutes: 120, url: "https://www.dicoding.com/academies/123", level: "beginner" },
  { id: "res_codepen", title: "CodePen — Tempat Coba Kode", description: "Editor online untuk mencoba HTML, CSS, dan JS langsung di browser.", type: "interactive", durationMinutes: 20, url: "https://codepen.io/", level: "beginner" },
  { id: "res_hour_of_code", title: "Hour of Code — Minecraft", description: "Petualangan coding 1 jam bertema Minecraft dari Code.org.", type: "game", durationMinutes: 60, url: "https://code.org/minecraft", level: "beginner" },
  { id: "res_typing_club", title: "TypingClub — Belajar Mengetik", description: "Latihan mengetik 10 jari agar lebih cepat saat membuat kode.", type: "interactive", durationMinutes: 15, url: "https://www.typingclub.com/", level: "beginner" },
  { id: "res_cs_unplugged", title: "CS Unplugged", description: "Aktivitas ilmu komputer tanpa komputer — kartu, permainan, dan teka-teki.", type: "article", durationMinutes: 30, url: "https://csunplugged.org/en/", level: "beginner" },
  { id: "res_blockly", title: "Blockly Games", description: "Seri permainan edukasi dari Google yang mengenalkan konsep pemrograman.", type: "game", durationMinutes: 40, url: "https://blockly.games/", level: "beginner" },
  { id: "res_khan_pixar", title: "Khan Academy — Pixar in a Box", description: "Bagaimana matematika dan seni dipakai membuat film animasi Pixar.", type: "video", durationMinutes: 45, url: "https://www.khanacademy.org/computing/pixar", level: "beginner" },
] as const;

for (const r of RESOURCES) {
  db.insert(schema.resources)
    .values({ ...r, active: true, createdAt: now })
    .onConflictDoNothing()
    .run();
}

console.log(`[seed] OK -> ${getDbPath()}`);
console.log(`[seed] users=1 (demo juri: ${DEMO_USER_ID}), resources=${RESOURCES.length}`);
