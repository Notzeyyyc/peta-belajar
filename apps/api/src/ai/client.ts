import crypto from "node:crypto";
import OpenAI from "openai";
import {
  AiRoadmapOutputSchema,
  ClarifyResponseSchema,
  MateriAnakSchema,
  type AiRoadmapOutput,
  type ClarifyResponse,
  type GenerateRequest,
  type LearningStyle,
  type MateriAnak,
} from "@peta-belajar/shared";
import { AppError, ERR } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function isAiMock(): boolean {
  return process.env.AI_MOCK === "true";
}

export function aiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError(503, ERR.AI_NOT_CONFIGURED, "Layanan AI belum dikonfigurasi.");
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://ai.qenoxit.site/api/v1",
  });
}

export function hashInput(input: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

/* ------------------------- Fixture deterministic ------------------------ */

export function mockClarify(goal: string): ClarifyResponse {
  void goal;
  return {
    questions: [
      {
        id: "q_level",
        question: "Sudah pernah belajar coding sebelumnya?",
        options: ["Belum pernah sama sekali", "Pernah coba sedikit", "Sudah bisa dasar-dasarnya"],
      },
      {
        id: "q_time",
        question: "Berapa waktu belajar yang tersedia tiap minggu?",
        options: ["Kurang dari 1 jam", "1–3 jam", "Lebih dari 3 jam"],
      },
      {
        id: "q_style",
        question: "Cara belajar mana yang paling disukai?",
        options: ["Video dan permainan", "Membaca langkah demi langkah", "Langsung praktik membuat sesuatu"],
      },
    ],
  };
}

export function mockGenerate(_req: GenerateRequest): AiRoadmapOutput {
  void _req;
  return {
    title: "Roadmap Belajar Coding untuk Pemula",
    summary: "Jalur belajar bertahap dari logika dasar hingga membuat proyek web sederhana, disesuaikan dengan jawaban klarifikasi.",
    competencies: [
      {
        name: "Logika Pemrograman Dasar",
        description: "Memahami konsep urutan, perulangan, dan kondisi lewat permainan blok visual.",
        status: "gap",
        reason: "Fondasi utama sebelum menulis kode teks apa pun.",
        nextAction: "Selesaikan 5 puzzle pertama di Scratch.",
        resourceIds: ["res_scratch", "res_blockly", "res_hour_of_code"],
      },
      {
        name: "Dasar Ilmu Komputer",
        description: "Mengenal cara komputer bekerja, data, dan penyelesaian masalah terstruktur.",
        status: "gap",
        reason: "Membantu siswa memahami 'mengapa' di balik coding.",
        nextAction: "Ikuti satu aktivitas CS Unplugged bersama orang tua.",
        resourceIds: ["res_cs_unplugged", "res_codeorg_course1"],
      },
      {
        name: "HTML & CSS Dasar",
        description: "Membuat halaman web pertama dengan judul, gambar, dan warna.",
        status: "half",
        reason: "Beberapa materi mungkin sudah dikenal dari sekolah.",
        nextAction: "Buat halaman 'Tentang Aku' di CodePen.",
        resourceIds: ["res_belajarhtml_id", "res_codepen", "res_dicoding_web"],
      },
      {
        name: "JavaScript Pertama",
        description: "Menggerakkan gambar dan animasi dengan kode JavaScript sederhana.",
        status: "gap",
        reason: "Langkah pertama ke pemrograman teks sesungguhnya.",
        nextAction: "Coba 3 latihan menggambar di Khan Academy.",
        resourceIds: ["res_khan_computing", "res_codeorg_express"],
      },
    ],
  };
}

/* --------------------------- Panggilan provider -------------------------- */

async function chatJson(system: string, user: string): Promise<string> {
  const client = getClient();
  let res;
  try {
    res = await client.chat.completions.create({
      model: aiModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
  } catch (err) {
    // Jangan log prompt lengkap — hanya metadata error.
    logger.warn({ err: err instanceof Error ? err.message : String(err) }, "AI provider error");
    throw new AppError(502, ERR.AI_PROVIDER_ERROR, "Layanan AI sedang tidak merespons. Coba lagi sebentar lagi ya.");
  }
  const content = res.choices[0]?.message?.content;
  if (!content) throw new AppError(502, ERR.AI_PROVIDER_ERROR, "Layanan AI memberi respons kosong.");
  // 9Router dapat menambahkan sentinel SSE setelah body JSON pada respons non-stream.
  // Hapus hanya sentinel trailing tersebut; jangan mengubah isi JSON dari model.
  return content.replace(/data:\s*\[DONE\]\s*$/i, "").trim();
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError(502, ERR.AI_INVALID_OUTPUT, "AI memberi format jawaban yang tidak valid.");
  }
}

export async function clarifyGoal(goal: string): Promise<ClarifyResponse> {
  if (isAiMock()) return mockClarify(goal);
  const raw = await chatJson(
    "Kamu asisten peta belajar untuk siswa SD di Indonesia. Balas HANYA JSON valid dengan bentuk " +
      '{"questions":[{"id":"q_...","question":"...","options":["...", "..."]}]}. ' +
      "Buat 2-3 pertanyaan klarifikasi singkat dalam Bahasa Indonesia yang ramah anak, masing-masing dengan 2-4 opsi jawaban singkat.",
    `Tujuan belajar siswa: ${goal}`,
  );
  const parsed = ClarifyResponseSchema.safeParse(parseJson(raw));
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.length }, "clarify: AI output tidak valid");
    throw new AppError(502, ERR.AI_INVALID_OUTPUT, "AI memberi jawaban yang tidak sesuai format. Coba lagi ya.");
  }
  return parsed.data;
}

export async function generateRoadmap(
  req: GenerateRequest,
  catalogIds: string[],
): Promise<AiRoadmapOutput> {
  if (isAiMock()) return mockGenerate(req);
  const raw = await chatJson(
    "Kamu asisten peta belajar untuk siswa SD di Indonesia. Balas HANYA JSON valid dengan bentuk " +
      '{"title":"...","summary":"...","competencies":[{"name":"...","description":"...","status":"gap|half|master",' +
      '"reason":"...","nextAction":"...","resourceIds":["..."]}]}. ' +
      "Buat tepat 3-5 kompetensi berurutan. Setiap string WAJIB singkat: title maksimal 80 karakter, summary maksimal 300 karakter, name maksimal 80, description maksimal 300, reason maksimal 300, nextAction maksimal 200. resourceIds HANYA boleh diambil dari daftar ID katalog berikut — " +
      "dilarang keras membuat ID atau URL baru: " +
      catalogIds.join(", "),
    `Tujuan: ${req.goal}\nJawaban klarifikasi: ${JSON.stringify(req.answers)}`,
  );
  const parsed = AiRoadmapOutputSchema.safeParse(parseJson(raw));
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.length }, "generate: AI output tidak valid");
    throw new AppError(502, ERR.AI_INVALID_OUTPUT, "AI memberi jawaban yang tidak sesuai format. Coba lagi ya.");
  }
  return parsed.data;
}

/* --------------------------- Materi Anak (A) ---------------------------- */

const STYLE_GUIDE: Record<LearningStyle, string> = {
  visual: "Banyak pakai gambaran yang bisa dibayangkan (warna, bentuk, diagram).",
  praktik: "Tekankan langkah mencoba langsung dan bikin sesuatu.",
  teori: "Tekankan pengertian istilah dan urutan konsep dengan rapi.",
};

/** Fixture deterministik — tanpa URL/'http', lolos MateriAnakSchema. */
export function mockMateriAnak(style: LearningStyle): MateriAnak {
  const pembuka: Record<LearningStyle, string> = {
    visual: "Halo! Materi ini penuh gambar dan warna supaya kamu mudah membayangkannya.",
    praktik: "Halo! Materi ini mengajak kamu langsung mencoba, langkah demi langkah.",
    teori: "Halo! Materi ini menjelaskan konsepnya pelan-pelan supaya kamu paham urutannya.",
  };
  return {
    pengantar: pembuka[style] + " Kita akan belajar bertahap, mulai dari yang paling dekat dengan kehidupanmu.",
    analogi:
      "Belajar blok kode itu seperti menyusun balok mainan: setiap balok punya bentuk sendiri, dan kalau diurutkan dengan benar, susunan itu bisa bergerak.",
    inti: [
      "Urutan penting: langkah pertama dikerjakan lebih dulu, seperti memakai kaos kaki sebelum sepatu.",
      "Perulangan artinya mengulang hal yang sama tanpa bosan, seperti memutar lagu favoritmu.",
      "Kondisi itu seperti memilih jalan: kalau hujan, pakai payung; kalau panas, pakai topi.",
      "Setiap balok punya namanya sendiri supaya kamu bisa memanggilnya lagi nanti.",
    ],
    tantangan: [
      "Coba tebak: kalau susunan balokmu tidak bergerak, bagian mana yang kamu periksa lebih dulu?",
      "Menurutmu, apa bedanya perintah 'ulangi 3 kali' dengan 'ulangi sampai selesai'?",
      "Kalau kamu membuat permainan sendiri, peristiwa apa yang cocok pakai aturan 'jika... maka...'?",
    ],
  };
}

/** Sederhanakan teks katalog terkurasi menjadi Materi Anak. Prompt dikunci: hanya teks sumber. */
export async function generateMateriAnak(
  sourceText: string,
  style: LearningStyle,
  resourceTitle: string,
): Promise<MateriAnak> {
  if (isAiMock()) {
    // Mock tetap melewati validasi Zod yang sama seperti output provider.
    const mock = mockMateriAnak(style);
    const parsed = MateriAnakSchema.safeParse(mock);
    if (!parsed.success) throw new AppError(502, ERR.AI_INVALID_OUTPUT, "Fixture mock tidak valid.");
    return parsed.data;
  }
  const raw = await chatJson(
    "Kamu menyederhanakan teks pelajaran menjadi materi bahasa anak SD Indonesia. Sapa anak dengan 'kamu'. " +
      "Aturan keras: HANYA gunakan informasi dari teks sumber yang diberikan. " +
      "JANGAN menambah fakta baru, JANGAN menulis URL/tautan/alamat situs apa pun. " +
      "Bagian 'tantangan' harus berupa pertanyaan pemantik cara berpikir, BUKAN jawaban atau kunci soal. " +
      'Balas HANYA JSON valid dengan bentuk {"pengantar":"...","analogi":"...","inti":["...","...","..."],' +
      '"tantangan":["...","..."]}. ' +
      "pengantar 2-3 kalimat; analogi kehidupan sehari-hari anak SD; inti 3-8 poin pendek; tantangan 2-5 pertanyaan.",
    `Gaya belajar: ${STYLE_GUIDE[style]}\nJudul sumber: ${resourceTitle}\nTeks sumber:\n"""${sourceText.slice(0, 6000)}"""`,
  );
  const parsed = MateriAnakSchema.safeParse(parseJson(raw));
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.length }, "materi: AI output tidak valid");
    throw new AppError(502, ERR.AI_INVALID_OUTPUT, "AI memberi jawaban yang tidak sesuai format. Coba lagi ya.");
  }
  return parsed.data;
}
