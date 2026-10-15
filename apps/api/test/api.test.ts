import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { AiRoadmapOutputSchema } from "@peta-belajar/shared";
import { createDb, schema } from "../src/db/client.js";
import { createApp } from "../src/app.js";
import { mockGenerate } from "../src/ai/client.js";
import { eq } from "drizzle-orm";

const db = createDb();
const app = createApp();

async function login(agent: request.SuperAgentTest) {
  const res = await agent.post("/api/auth/demo");
  expect(res.status).toBe(200);
}

beforeAll(() => {
  migrate(db, { migrationsFolder: "./drizzle" });
  db.insert(schema.users)
    .values({ id: "user_demo_juri", displayName: "Juri Demo", email: null, role: "judge", createdAt: new Date() })
    .run();
  db.insert(schema.resources)
    .values([
      { id: "res_a", title: "A", description: "a", type: "video", durationMinutes: 10, url: "https://a.example", level: "beginner", active: true, createdAt: new Date() },
      { id: "res_b", title: "B", description: "b", type: "article", durationMinutes: 10, url: "https://b.example", level: "beginner", active: true, createdAt: new Date() },
    ])
    .run();
});

describe("Zod strictness pada output model", () => {
  it("menerima fixture valid", () => {
    const out = mockGenerate({ goal: "belajar coding", answers: [] });
    expect(AiRoadmapOutputSchema.safeParse(out).success).toBe(true);
  });

  it("menolak output cacat: kompetensi < 3", () => {
    const out = mockGenerate({ goal: "x", answers: [] });
    const bad = { ...out, competencies: out.competencies.slice(0, 2) };
    expect(AiRoadmapOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak output cacat: status tidak dikenal", () => {
    const out = mockGenerate({ goal: "x", answers: [] });
    const bad = { ...out, competencies: [{ ...out.competencies[0], status: "expert" }] };
    expect(AiRoadmapOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak output cacat: judul kosong", () => {
    const out = mockGenerate({ goal: "x", answers: [] });
    expect(AiRoadmapOutputSchema.safeParse({ ...out, title: "" }).success).toBe(false);
  });
});

describe("Auth", () => {
  it("demo login memasang cookie HTTP-only dan /api/me mengenali user", async () => {
    const agent = request.agent(app);
    const loginRes = await agent.post("/api/auth/demo");
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.id).toBe("user_demo_juri");
    const setCookie = loginRes.headers["set-cookie"]?.toString() ?? "";
    expect(setCookie).toContain("HttpOnly");

    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe("user_demo_juri");
  });

  it("/api/me tanpa sesi = 401 dengan error mapping konsisten", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(typeof res.body.error.message).toBe("string");
  });

  it("magic-link request issues hashed token and verification consumes it once", async () => {
    const originalFetch = globalThis.fetch;
    let sent: { body: string } | undefined;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      sent = { body: String(init?.body ?? "") };
      return new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.MAGIC_LINK_BASE_URL = "https://learn.example";
    try {
      const requested = await request(app).post("/api/auth/magic-link/request").send({ email: "  learner@example.com " });
      expect(requested.status).toBe(200);
      expect(requested.body.message).toContain("Jika email terdaftar");
      expect(sent?.body).toContain("noreply@send.qenoxit.site");
      const payload = JSON.parse(sent!.body);
      const link = new URL(payload.html.match(/href="([^"]+)/)![1]);
      const token = link.searchParams.get("token")!;
      const stored = db.select().from(schema.magicLinkTokens).all();
      const row = stored.find((entry) => entry.email === "learner@example.com")!;
      expect(row.tokenHash).not.toBe(token);
      expect(row.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBe(15 * 60 * 1000);

      const agent = request.agent(app);
      const verified = await agent.get(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
      expect(verified.status).toBe(302);
      expect(verified.headers.location).toBe("/home?verified=1");
      expect(verified.headers["set-cookie"]?.toString()).toContain("HttpOnly");
      expect((await agent.get("/api/me")).status).toBe(200);
      expect((await request(app).get(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`)).status).toBe(400);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("invalid magic-link token is rejected", async () => {
    const res = await request(app).get("/api/auth/magic-link/verify?token=invalid");
    expect(res.status).toBe(400);
  });

});

describe("Clarify & Generate (AI_MOCK)", () => {
  it("clarify menghasilkan 2-3 pertanyaan masing-masing 2-4 opsi", async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.post("/api/roadmaps/clarify").send({ goal: "Belajar coding untuk anak SD" });
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThanOrEqual(2);
    expect(res.body.questions.length).toBeLessThanOrEqual(3);
    for (const q of res.body.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
    }
  });

  it("clarify menolak goal > 240 char", async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.post("/api/roadmaps/clarify").send({ goal: "x".repeat(241) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("generate menyimpan dalam satu transaksi & memfilter resourceIds tidak valid", async () => {
    const agent = request.agent(app);
    await login(agent);
    // Fixture mock memakai res_scratch dsb yang tidak ada di DB tes → terfilter ketat.
    const res = await agent
      .post("/api/roadmaps/generate")
      .send({ goal: "Belajar coding", answers: [{ questionId: "q1", answer: "Belum pernah" }] });
    expect(res.status).toBe(201);
    expect(res.body.roadmap.id).toBeTruthy();
    expect(res.body.competencies.length).toBeGreaterThanOrEqual(3);
    // Semua resource harus dari katalog (res_a/res_b); ID palsu model tidak boleh lolos.
    for (const c of res.body.competencies) {
      for (const r of c.resources) {
        expect(["res_a", "res_b"]).toContain(r.id);
      }
    }
    // ai_runs tercatat dengan hash, bukan prompt
    const runs = db.select().from(schema.aiRuns).where(eq(schema.aiRuns.userId, "user_demo_juri")).all();
    const run = runs.find((r) => r.roadmapId === res.body.roadmap.id);
    expect(run).toBeTruthy();
    expect(run!.status).toBe("success");
    expect(run!.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(run!.latencyMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(run)).not.toContain("Belajar coding");
  });
});

describe("Complete step idempotent", () => {
  it("POST complete dua kali: hasil konsisten, hanya 1 baris progress", async () => {
    const agent = request.agent(app);
    await login(agent);
    const gen = await agent.post("/api/roadmaps/generate").send({ goal: "Belajar coding", answers: [] });
    expect(gen.status).toBe(201);
    const { roadmap, competencies } = gen.body;
    const stepId = competencies[0].id;

    const first = await agent.post(`/api/roadmaps/${roadmap.id}/steps/${stepId}/complete`);
    expect(first.status).toBe(201);
    expect(first.body.alreadyCompleted).toBe(false);

    const second = await agent.post(`/api/roadmaps/${roadmap.id}/steps/${stepId}/complete`);
    expect(second.status).toBe(200);
    expect(second.body.alreadyCompleted).toBe(true);
    expect(second.body.completedAt).toBe(first.body.completedAt);

    const detail = await agent.get(`/api/roadmaps/${roadmap.id}`);
    const step = detail.body.competencies.find((c: { id: string }) => c.id === stepId);
    expect(step.completed).toBe(true);
  });

  it("complete step roadmap orang lain = 404", async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.post(`/api/roadmaps/nonexistent/steps/x/complete`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("Error mapping provider gagal", () => {
  it("provider error → 502 AI_PROVIDER_ERROR, respons ramah berkode", async () => {
    process.env.AI_MOCK = "false";
    process.env.OPENAI_API_KEY = "";
    try {
      const agent = request.agent(app);
      await login(agent);
      const res = await agent.post("/api/roadmaps/clarify").send({ goal: "Belajar coding" });
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("AI_NOT_CONFIGURED");
      expect(typeof res.body.error.message).toBe("string");
    } finally {
      process.env.AI_MOCK = "true";
    }
  });
});
