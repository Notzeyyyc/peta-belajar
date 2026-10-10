import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { MateriAnakSchema, type LearningStyle } from "@peta-belajar/shared";
import { createDb, schema } from "../src/db/client.js";
import { mockMateriAnak } from "../src/ai/client.js";
import { createApp } from "../src/app.js";

const db = createDb();
const app = createApp();

/* Bungkus generateMateriAnak asli untuk HITUNG panggilan model (bukti cache). */
const aiSpy = vi.hoisted(() => ({ calls: 0 }));
vi.mock("../src/ai/client.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../src/ai/client.js")>();
  return {
    ...orig,
    generateMateriAnak: async (text: string, style: LearningStyle, title: string) => {
      aiSpy.calls++;
      return orig.generateMateriAnak(text, style, title);
    },
  };
});

const validMateri = (style: LearningStyle) => mockMateriAnak(style);

async function login(agent: request.SuperAgentTest) {
  const res = await agent.post("/api/auth/demo");
  expect(res.status).toBe(200);
}

beforeAll(() => {
  migrate(db, { migrationsFolder: "./drizzle" });
  const now = new Date();
  db.insert(schema.users)
    .values({ id: "user_demo_juri", displayName: "Juri Demo", email: null, role: "judge", createdAt: now })
    .run();
  db.insert(schema.resources)
    .values([
      {
        id: "res_txt", title: "Scratch Dasar", description: "d", type: "interactive",
        durationMinutes: 10, url: "https://scratch.mit.edu/", level: "beginner",
        content: "Scratch memakai blok warna untuk merancang cerita dan permainan. Urutan blok menentukan langkah yang dikerjakan komputer.",
        active: true, createdAt: now,
      },
      {
        id: "res_null", title: "Video Tanpa Teks", description: "d", type: "video",
        durationMinutes: 10, url: "https://youtube.example/watch", level: "beginner",
        content: null, active: true, createdAt: now,
      },
    ])
    .run();
  db.insert(schema.roadmaps)
    .values({ id: "rm_materi", userId: "user_demo_juri", goal: "Belajar coding", title: "T", summary: "S", createdAt: now, updatedAt: now })
    .run();
  db.insert(schema.competencies)
    .values([
      { id: "c_txt", roadmapId: "rm_materi", position: 0, name: "Logika", description: "d", status: "gap", reason: "r", nextAction: "n" },
      { id: "c_null", roadmapId: "rm_materi", position: 1, name: "Animasi", description: "d", status: "gap", reason: "r", nextAction: "n" },
    ])
    .run();
  db.insert(schema.competencyResources)
    .values([
      { competencyId: "c_txt", resourceId: "res_txt" },
      { competencyId: "c_null", resourceId: "res_null" },
    ])
    .run();
});

/* ------------------------- Validasi MateriAnakSchema ------------------------- */

describe("MateriAnakSchema menolak output cacat", () => {
  it("menerima fixture mock (semua gaya) dan tanpa 'http'", () => {
    for (const style of ["visual", "praktik", "teori"] as const) {
      const m = validMateri(style);
      expect(MateriAnakSchema.safeParse(m).success).toBe(true);
      expect(JSON.stringify(m)).not.toContain("http");
    }
  });

  it("inti kurang dari 3 poin ditolak", () => {
    expect(MateriAnakSchema.safeParse({ ...validMateri("visual"), inti: ["cuma satu poin yang cukup panjang kalimatnya", "dua poin saja belum cukup"] }).success).toBe(false);
  });

  it("tantangan kurang dari 2 ditolak", () => {
    expect(MateriAnakSchema.safeParse({ ...validMateri("visual"), tantangan: ["Kenapa urutan blok penting dalam Scratch?"] }).success).toBe(false);
  });

  it("tantangan memuat URL/http ditolak", () => {
    const bad = { ...validMateri("visual"), tantangan: ["Coba buka https://scratch.mit.edu sekarang ya!", "Menurutmu blok mana yang pertama ditekan?"] };
    expect(MateriAnakSchema.safeParse(bad).success).toBe(false);
  });

  it("field wajib hilang ditolak", () => {
    const { analogi: _a, ...rest } = validMateri("visual");
    void _a;
    expect(MateriAnakSchema.safeParse(rest).success).toBe(false);
  });
});

/* ------------------------------ Preferences ------------------------------ */

describe("PUT /api/me/preferences", () => {
  it("tanpa sesi = 401", async () => {
    const res = await request(app).put("/api/me/preferences").send({ learningStyle: "praktik" });
    expect(res.status).toBe(401);
  });

  it("nilai tidak valid = 400", async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.put("/api/me/preferences").send({ learningStyle: "auditori" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("upsert visual→praktik tersimpan", async () => {
    const agent = request.agent(app);
    await login(agent);
    const first = await agent.put("/api/me/preferences").send({ learningStyle: "visual" });
    expect(first.status).toBe(200);
    const second = await agent.put("/api/me/preferences").send({ learningStyle: "praktik" });
    expect(second.status).toBe(200);
    const rows = db.select().from(schema.learningPreferences).where(eq(schema.learningPreferences.userId, "user_demo_juri")).all();
    expect(rows.length).toBe(1); // upsert, bukan duplikat
    expect(rows[0]!.style).toBe("praktik");
    await agent.put("/api/me/preferences").send({ learningStyle: "visual" }); // kembalikan
  });
});

/* ------------------------------- Endpoint materi ------------------------------ */

describe("GET materi: cache per (resourceId, learningStyle)", () => {
  it("tanpa sesi = 401", async () => {
    const res = await request(app).get("/api/roadmaps/rm_materi/steps/c_txt/materi");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("miss lalu hit: model dipanggil TEPAT 1x, cache baris = 1", async () => {
    db.delete(schema.materiCache).run();
    aiSpy.calls = 0;
    const agent = request.agent(app);
    await login(agent);

    const miss = await agent.get("/api/roadmaps/rm_materi/steps/c_txt/materi");
    expect(miss.status).toBe(200);
    expect(miss.body.mode).toBe("ai");
    expect(miss.body.cached).toBe(false);
    expect(miss.body.learningStyle).toBe("visual");
    expect(miss.body.sumber.id).toBe("res_txt");
    // sumber dari katalog: url & judul dijamin DB, bukan output model
    expect(miss.body.sumber.url).toBe("https://scratch.mit.edu/");
    expect(miss.body.sumber.title).toBe("Scratch Dasar");
    expect(aiSpy.calls).toBe(1);

    const hit = await agent.get("/api/roadmaps/rm_materi/steps/c_txt/materi");
    expect(hit.status).toBe(200);
    expect(hit.body.mode).toBe("ai");
    expect(hit.body.cached).toBe(true);
    expect(hit.body.materi).toEqual(miss.body.materi);
    expect(aiSpy.calls).toBe(1); // TIDAK ada panggilan model kedua

    const rows = db.select().from(schema.materiCache).all();
    expect(rows.length).toBe(1);
    expect(rows[0]!.resourceId).toBe("res_txt");
    expect(rows[0]!.learningStyle).toBe("visual");

    // tantangan & seluruh payload bebas 'http'
    expect(JSON.stringify(hit.body.materi)).not.toContain("http");
  });

  it("gaya berbeda = cache berbeda (miss lagi untuk praktik)", async () => {
    const agent = request.agent(app);
    await login(agent);
    const before = aiSpy.calls;
    await agent.put("/api/me/preferences").send({ learningStyle: "praktik" });
    const res = await agent.get("/api/roadmaps/rm_materi/steps/c_txt/materi");
    expect(res.body.cached).toBe(false);
    expect(aiSpy.calls).toBe(before + 1);
    expect(db.select().from(schema.materiCache).all().length).toBe(2);
    await agent.put("/api/me/preferences").send({ learningStyle: "visual" });
  });

  it("content NULL → fallback katalog polos, TANPA cache & TANPA model", async () => {
    db.delete(schema.materiCache).run();
    aiSpy.calls = 0;
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.get("/api/roadmaps/rm_materi/steps/c_null/materi");
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(typeof res.body.reason).toBe("string");
    expect(res.body.resource.id).toBe("res_null");
    expect(res.body.materi).toBeUndefined();
    expect(aiSpy.calls).toBe(0);
    expect(db.select().from(schema.materiCache).all().length).toBe(0);
  });

  it("provider error → fallback ramah, TANPA menyimpan cache gagal", async () => {
    db.delete(schema.materiCache).run();
    process.env.AI_MOCK = "false";
    process.env.OPENAI_API_KEY = "";
    try {
      const agent = request.agent(app);
      await login(agent);
      const res = await agent.get("/api/roadmaps/rm_materi/steps/c_txt/materi");
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe("fallback");
      expect(res.body.reason).toBeTruthy();
      expect(res.body.resource.id).toBe("res_txt");
      expect(db.select().from(schema.materiCache).all().length).toBe(0);
    } finally {
      process.env.AI_MOCK = "true";
    }
  });

  it("step roadmap orang lain / tidak ada = 404", async () => {
    const agent = request.agent(app);
    await login(agent);
    expect((await agent.get("/api/roadmaps/nope/steps/c_txt/materi")).status).toBe(404);
    expect((await agent.get("/api/roadmaps/rm_materi/steps/nope/materi")).status).toBe(404);
  });
});
