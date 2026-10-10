import { existsSync, readFileSync } from "node:fs";
import { isNotNull } from "drizzle-orm";
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

// --- Katalog dasar: 12 resource nyata, relevan siswa SD (fallback) ---
const BASE_RESOURCES = [
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

/* --------- Katalog terkurasi (C): src/data/resources-curated.json ---------
 * Dibuat tim kurasi. Bentuk: array entry ATAU { resources: [...] }.
 * Entry valid punya id/title/description/type/durationMinutes/url; `content`
 * (teks/transkrip sumber) opsional — itulah bahan mentah Materi Anak.
 * Loader defensif: file belum ada / rusak / entry cacat → skip, fallback 12 lama.
 */
const TYPES = new Set(["video", "article", "interactive", "game", "course"]);
const LEVELS = new Set(["beginner", "intermediate"]);

type ResourceType = (typeof BASE_RESOURCES)[number]["type"];
type ResourceLevel = (typeof BASE_RESOURCES)[number]["level"];

interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  durationMinutes: number;
  url: string;
  level: ResourceLevel;
  content: string | null;
}

function isEntry(v: unknown): v is CatalogEntry {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" && o.id.length > 0 &&
    typeof o.title === "string" && o.title.length > 0 &&
    typeof o.description === "string" &&
    typeof o.type === "string" && TYPES.has(o.type) &&
    typeof o.durationMinutes === "number" && o.durationMinutes > 0 &&
    typeof o.url === "string" && /^https?:\/\//.test(o.url) &&
    typeof o.level === "string" && LEVELS.has(o.level) &&
    (o.content === undefined || o.content === null || typeof o.content === "string")
  );
}


// Tim kurasi menulis enum berbahasa Indonesia (sesuai spesifikasi prompt kurasi).
// Normalisasikan ke enum DB sebelum validasi — sumber JSON tidak diubah apa adanya.
const TYPE_MAP: Record<string, string> = {
  artikel: "article",
  article: "article",
  interaktif: "interactive",
  interactive: "interactive",
  praktik: "game",
  video: "video",
  game: "game",
  course: "course",
};
const LEVEL_MAP: Record<string, string> = {
  sd: "beginner",
  "sd-menengah": "intermediate",
  beginner: "beginner",
  intermediate: "intermediate",
};

function normalize(item: unknown): unknown {
  if (typeof item !== "object" || item === null) return item;
  const o = item as Record<string, unknown>;
  const type = typeof o.type === "string" ? TYPE_MAP[o.type.toLowerCase()] : undefined;
  const level = typeof o.level === "string" ? LEVEL_MAP[o.level.toLowerCase()] : undefined;
  // field 'status' hasil kurasi tidak dipakai schema — dibuang
  const { status: _status, ...rest } = o;
  return { ...rest, ...(type ? { type } : {}), ...(level ? { level } : {}) };
}

function loadCurated(): CatalogEntry[] {
  const file = new URL("./data/resources-curated.json", import.meta.url);
  if (!existsSync(file)) return [];
  try {
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
    const arr = Array.isArray(raw) ? raw : (raw as { resources?: unknown[] })?.resources;
    if (!Array.isArray(arr)) return [];
    const out: CatalogEntry[] = [];
    let skipped = 0;
    for (const item of arr) {
      const n = normalize(item);
      if (isEntry(n)) out.push({ ...n, content: n.content ?? null });
      else skipped++;
    }
    if (skipped > 0) console.warn(`[seed] kurasi: ${skipped} entry cacat dilewati`);
    return out;
  } catch (err) {
    console.warn(`[seed] kurasi: gagal baca resources-curated.json (${String(err)}), pakai fallback 12 lama`);
    return [];
  }
}

function upsert(r: CatalogEntry) {
  db.insert(schema.resources)
    .values({ ...r, active: true, createdAt: now })
    .onConflictDoUpdate({
      target: schema.resources.id,
      set: {
        title: r.title,
        description: r.description,
        type: r.type,
        durationMinutes: r.durationMinutes,
        url: r.url,
        level: r.level,
        // content hanya ditimpa kalau kurasi memang punya teks — tidak menghapus isi yang sudah ada.
        ...(r.content ? { content: r.content } : {}),
      },
    })
    .run();
}

// Base 12 lama dulu, lalu kurasi menimpa/menambah (merge → id lama referenced mock fixture tetap ada).
for (const r of BASE_RESOURCES) upsert({ ...r, content: null });
const curated = loadCurated();
const seen = new Set<string>();
for (const r of curated) {
  if (seen.has(r.id)) continue;
  seen.add(r.id);
  upsert(r);
}

const withContent = db
  .select({ id: schema.resources.id })
  .from(schema.resources)
  .where(isNotNull(schema.resources.content))
  .all().length;

console.log(`[seed] OK -> ${getDbPath()}`);
console.log(
  `[seed] users=1 (demo juri: ${DEMO_USER_ID}), base=12, curated=${curated.length}, ` +
    `resources=${db.select({ id: schema.resources.id }).from(schema.resources).all().length}, ` +
    `denganContent=${withContent}`,
);
