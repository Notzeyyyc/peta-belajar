import crypto from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { asc, eq, inArray, and } from "drizzle-orm";
import {
  ClarifyRequestSchema,
  GenerateRequestSchema,
  LearningStyleSchema,
  MateriAnakSchema,
  type LearningStyle,
  type MateriSumber,
} from "@peta-belajar/shared";
import { db, schema } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { AppError, ERR, sendError } from "./lib/errors.js";
import {
  createSession,
  requireAuth,
  sessionMiddleware,
  setSessionCookie,
  type AuthedRequest,
} from "./auth/session.js";
import { aiModel, clarifyGoal, generateMateriAnak, generateRoadmap, hashInput } from "./ai/client.js";
import { consumeMagicToken, createMagicToken, MAGIC_LINK_TTL_MS, normalizeEmail, sendMagicLink } from "./auth/magic-link.js";

const DEMO_USER_ID = "user_demo_juri";
const MAGIC_LINK_RESPONSE = { ok: true, message: "Jika email terdaftar, tautan masuk telah dikirim." };

/** Baca gaya belajar user (default visual bila belum pernah diset). */
function currentLearningStyle(userId: string): LearningStyle {
  const prefs = db
    .select()
    .from(schema.learningPreferences)
    .where(eq(schema.learningPreferences.userId, userId))
    .get();
  return LearningStyleSchema.safeParse(prefs?.style).data ?? "visual";
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(sessionMiddleware);

  const magicLinkLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
    handler: (_req, res) => res.json(MAGIC_LINK_RESPONSE),
  });

  /* ------------------------------- Health ------------------------------- */
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "peta-belajar-api", time: new Date().toISOString() });
  });

  /* -------------------------------- Auth -------------------------------- */
  app.post("/api/auth/demo", (_req, res) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, DEMO_USER_ID)).get();
    if (!user) {
      sendError(res, 500, ERR.INTERNAL, "Akun demo belum di-seed. Jalankan db:seed.");
      return;
    }
    setSessionCookie(res, createSession(user.id));
    res.json({ user: { id: user.id, displayName: user.displayName, role: user.role } });
  });

  app.post("/api/auth/magic-link/request", magicLinkLimiter, async (req, res) => {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    const email = normalizeEmail(rawEmail);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Format email tidak valid.");
      return;
    }
    try {
      const { token, tokenHash } = createMagicToken();
      const now = new Date();
      const id = crypto.randomUUID();
      db.insert(schema.magicLinkTokens)
        .values({ id, email, tokenHash, expiresAt: new Date(now.getTime() + MAGIC_LINK_TTL_MS), usedAt: null, createdAt: now })
        .run();
      await sendMagicLink(email, token);
    } catch (err) {
      logger.error({ err }, "magic-link request failed");
    }
    res.json(MAGIC_LINK_RESPONSE);
  });

  app.get("/api/auth/magic-link/verify", (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Tautan masuk tidak valid atau kedaluwarsa.");
      return;
    }
    const email = consumeMagicToken(token);
    if (!email) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Tautan masuk tidak valid atau kedaluwarsa.");
      return;
    }
    const now = new Date();
    let user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (!user) {
      const userId = `user_${crypto.randomUUID()}`;
      db.insert(schema.users).values({ id: userId, displayName: email.split("@")[0].slice(0, 80) || "Siswa", email, role: "student", createdAt: now }).run();
      user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    }
    if (!user) {
      sendError(res, 500, ERR.INTERNAL, "Tidak dapat membuat sesi.");
      return;
    }
    setSessionCookie(res, createSession(user.id));
    res.redirect(302, "/home?verified=1");
  });

  app.get("/api/me", requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.user });
  });

  /* --------------------------- Preferences -------------------------------- */
  app.put("/api/me/preferences", requireAuth, (req: AuthedRequest, res) => {
    const parsed = LearningStyleSchema.safeParse(req.body?.learningStyle);
    if (!parsed.success) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Gaya belajar harus visual, praktik, atau teori.");
      return;
    }
    const userId = req.user!.id;
    const now = new Date();
    db.insert(schema.learningPreferences)
      .values({ userId, style: parsed.data, updatedAt: now })
      .onConflictDoUpdate({ target: schema.learningPreferences.userId, set: { style: parsed.data, updatedAt: now } })
      .run();
    res.json({ ok: true, learningStyle: parsed.data });
  });

  /* ------------------------------ Resources ----------------------------- */
  // Contoh peta statis untuk landing (publik, data sisi server — bukan dummy klien).
  app.get("/api/example", (_req, res) => {
    res.json({
      example: {
        goal: "Bisa bikin website pertamaku",
        competencies: [
          { name: "Mengenal HTML", status: "master", reason: "Kamu sudah bisa menandai teks dengan tag dasar." },
          { name: "Gaya dengan CSS", status: "half", reason: "Warna dan font sudah bisa, layout belum lancar." },
          { name: "Logika JavaScript", status: "gap", reason: "Ini bagian yang belum pernah kamu coba." },
        ],
      },
    });
  });

  app.get("/api/resources", (_req, res) => {
    res.json({
      resources: db.select().from(schema.resources).where(eq(schema.resources.active, true)).all(),
    });
  });

  /* --------------------------- AI rate limiting -------------------------- */
  const aiLimiter = rateLimit({
    windowMs: 60_000,
    limit: Number(process.env.AI_RATE_LIMIT_PER_MIN ?? 10),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => (req as AuthedRequest).user?.id ?? ipKeyGenerator(req.ip ?? ""),
    handler: (_req, res) =>
      sendError(res, 429, ERR.RATE_LIMITED, "Terlalu banyak permintaan AI. Tunggu sebentar ya."),
  });

  /* ------------------------------ Clarify ------------------------------- */
  app.post("/api/roadmaps/clarify", aiLimiter, requireAuth, async (req: AuthedRequest, res) => {
    const parsed = ClarifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Tujuan belajar harus 3–240 karakter.");
      return;
    }
    try {
      const result = await clarifyGoal(parsed.data.goal);
      res.json(result); // output invalid = error, tidak disimpan apa pun
    } catch (err) {
      handleRouteError(err, res);
    }
  });

  /* ------------------------------ Generate ------------------------------ */
  app.post("/api/roadmaps/generate", aiLimiter, requireAuth, async (req: AuthedRequest, res) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, ERR.INVALID_REQUEST, "Permintaan tidak valid (goal 3–240 karakter, maks 3 jawaban).");
      return;
    }
    const userId = req.user!.id;
    const started = Date.now();
    const inputHash = hashInput(parsed.data);

    const logRun = (status: "success" | "invalid_output" | "error" | "timeout", errorCode: string | null, roadmapId: string | null = null) => {
      db.insert(schema.aiRuns)
        .values({
          id: crypto.randomUUID(),
          userId,
          roadmapId,
          inputHash, // HANYA hash — prompt lengkap tidak pernah disimpan
          model: process.env.AI_MOCK === "true" ? "mock" : aiModel(),
          latencyMs: Date.now() - started,
          status,
          errorCode,
          createdAt: new Date(),
        })
        .run();
    };

    try {
      const catalog = db.select().from(schema.resources).where(eq(schema.resources.active, true)).all();
      const catalogIds = new Set(catalog.map((r) => r.id));

      const output = await generateRoadmap(parsed.data, [...catalogIds]);

      // Filter ketat resourceIds: hanya ID yang ada & aktif di katalog; dedupe.
      const cleaned = output.competencies.map((c) => ({
        ...c,
        resourceIds: [...new Set(c.resourceIds.filter((id) => catalogIds.has(id)))],
      }));

      const roadmapId = crypto.randomUUID();
      const now = new Date();
      // SATU transaksi: roadmap + competencies + competency_resources.
      db.transaction((tx) => {
        tx.insert(schema.roadmaps)
          .values({
            id: roadmapId,
            userId,
            goal: parsed.data.goal,
            title: output.title,
            summary: output.summary,
            createdAt: now,
            updatedAt: now,
          })
          .run();
        cleaned.forEach((c, i) => {
          const compId = crypto.randomUUID();
          tx.insert(schema.competencies)
            .values({
              id: compId,
              roadmapId,
              position: i,
              name: c.name,
              description: c.description,
              status: c.status,
              reason: c.reason,
              nextAction: c.nextAction,
            })
            .run();
          for (const rid of c.resourceIds) {
            tx.insert(schema.competencyResources)
              .values({ competencyId: compId, resourceId: rid })
              .run();
          }
        });
      });

      logRun("success", null, roadmapId);
      const detail = loadRoadmapDetail(roadmapId, userId);
      res.status(201).json(detail);
    } catch (err) {
      if (err instanceof AppError && err.code === ERR.AI_INVALID_OUTPUT) logRun("invalid_output", err.code);
      else logRun("error", err instanceof AppError ? err.code : ERR.INTERNAL);
      handleRouteError(err, res);
    }
  });

  /* ---------------------------- Materi Anak (A) --------------------------- */
  function plainSumber(r: typeof schema.resources.$inferSelect): MateriSumber {
    return { id: r.id, title: r.title, url: r.url, type: r.type, durationMinutes: r.durationMinutes };
  }

  app.get(
    "/api/roadmaps/:id/steps/:stepId/materi",
    requireAuth,
    aiLimiter,
    async (req: AuthedRequest, res) => {
      const userId = req.user!.id;
      const roadmap = db
        .select()
        .from(schema.roadmaps)
        .where(and(eq(schema.roadmaps.id, req.params.id), eq(schema.roadmaps.userId, userId)))
        .get();
      if (!roadmap) {
        sendError(res, 404, ERR.NOT_FOUND, "Roadmap tidak ditemukan.");
        return;
      }
      const step = db
        .select()
        .from(schema.competencies)
        .where(and(eq(schema.competencies.id, req.params.stepId), eq(schema.competencies.roadmapId, roadmap.id)))
        .get();
      if (!step) {
        sendError(res, 404, ERR.NOT_FOUND, "Langkah tidak ditemukan pada roadmap ini.");
        return;
      }

      // Resource langkah (deterministik: urut id), pilih yang pertama PUNYA content kurasi.
      const linked = db
        .select({ resource: schema.resources })
        .from(schema.competencyResources)
        .innerJoin(schema.resources, eq(schema.competencyResources.resourceId, schema.resources.id))
        .where(eq(schema.competencyResources.competencyId, step.id))
        .orderBy(asc(schema.resources.id))
        .all()
        .map((l) => l.resource);
      if (linked.length === 0) {
        // Fallback ramah: katalog polos, tanpa AI, tanpa cache.
        const anyResource = db
          .select()
          .from(schema.resources)
          .orderBy(asc(schema.resources.id))
          .all()[0];
        if (!anyResource) {
          sendError(res, 404, ERR.NOT_FOUND, "Katalog materi masih kosong.");
          return;
        }
        res.json({
          mode: "fallback",
          reason: "Materi khusus untuk langkah ini sedang disiapkan. Sementara, coba materi umum ini dulu ya.",
          resource: plainSumber(anyResource),
          learningStyle: currentLearningStyle(userId),
        });
        return;
      }
      const source = linked.find((r) => r.content && r.content.trim().length > 0);
      if (!source) {
        // Fallback ramah: katalog polos, tanpa AI, tanpa cache.
        res.json({
          mode: "fallback",
          reason: "Sumber materi belum punya teks kurasi.",
          resource: plainSumber(linked[0]!),
          learningStyle: currentLearningStyle(userId),
        });
        return;
      }

      const style = currentLearningStyle(userId);

      // 1) Cache hit → instan, tanpa panggilan model.
      const cached = db
        .select()
        .from(schema.materiCache)
        .where(and(eq(schema.materiCache.resourceId, source.id), eq(schema.materiCache.learningStyle, style)))
        .get();
      if (cached) {
        const validated = MateriAnakSchema.safeParse(safeJson(cached.payloadJson));
        if (validated.success) {
          res.json({
            mode: "ai",
            cached: true,
            materi: validated.data,
            sumber: plainSumber(source),
            learningStyle: style,
          });
          return;
        }
        // Baris cache korup → buang, regenerasi.
        db.delete(schema.materiCache).where(eq(schema.materiCache.id, cached.id)).run();
      }

      // 2) Cache miss → AI (prompt terkunci), validasi Zod, simpan cache.
      try {
        const materi = await generateMateriAnak(source.content!, style, source.title);
        db.insert(schema.materiCache)
          .values({
            id: crypto.randomUUID(),
            resourceId: source.id,
            learningStyle: style,
            payloadJson: JSON.stringify(materi),
            createdAt: new Date(),
          })
          .onConflictDoNothing()
          .run();
        res.json({ mode: "ai", cached: false, materi, sumber: plainSumber(source), learningStyle: style });
      } catch (err) {
        // Fallback ramah untuk error/invalid/timeout provider — TANPA cache hasil gagal.
        logger.warn(
          { err: err instanceof Error ? err.message : String(err), resourceId: source.id },
          "materi: fallback karena AI gagal",
        );
        res.json({
          mode: "fallback",
          reason: "Layanan AI sedang tidak tersedia. Ini sumber aslinya ya.",
          resource: plainSumber(source),
          learningStyle: style,
        });
      }
    },
  );

  /* ---------------------------- Home & Profile --------------------------- */
  function summarizeRoadmap(roadmapId: string, userId: string) {
    const detail = loadRoadmapDetail(roadmapId, userId);
    if (!detail) return null;
    const comps = detail.competencies;
    const done = comps.filter((c) => c.completed).length;
    const open = comps.filter((c) => !c.completed);
    return {
      id: detail.roadmap.id,
      goal: detail.roadmap.goal,
      title: detail.roadmap.title,
      summary: detail.roadmap.summary,
      updatedAt: detail.roadmap.updatedAt,
      totalCount: comps.length,
      completedCount: done,
      gapCount: open.filter((c) => c.status === "gap").length,
      halfCount: open.filter((c) => c.status === "half").length,
      progressPct: comps.length ? Math.round((done / comps.length) * 100) : 0,
    };
  }

  app.get("/api/home", requireAuth, (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const rows = db
      .select()
      .from(schema.roadmaps)
      .where(eq(schema.roadmaps.userId, userId))
      .orderBy(asc(schema.roadmaps.createdAt))
      .all();
    const active = rows.length ? summarizeRoadmap(rows[rows.length - 1]!.id, userId) : null;
    let nextResources: unknown[] = [];
    if (active) {
      const detail = loadRoadmapDetail(active.id, userId)!;
      const target =
        detail.competencies.find((c) => c.status === "gap" && !c.completed) ??
        detail.competencies.find((c) => !c.completed);
      if (target) nextResources = target.resources;
    }
    res.json({ user: req.user, activeRoadmap: active, nextResources });
  });

  app.get("/api/profile", requireAuth, (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const prefs = db
      .select()
      .from(schema.learningPreferences)
      .where(eq(schema.learningPreferences.userId, userId))
      .get();
    const rows = db
      .select()
      .from(schema.roadmaps)
      .where(eq(schema.roadmaps.userId, userId))
      .orderBy(asc(schema.roadmaps.createdAt))
      .all()
      .map((r) => summarizeRoadmap(r.id, userId)!)
      .filter(Boolean);
    res.json({
      user: req.user,
      learningStyle: prefs?.style ?? null,
      roadmaps: rows,
      stats: {
        cumulativeGap: rows.reduce((a, r) => a + r.gapCount + r.halfCount, 0),
        completed: rows.reduce((a, r) => a + r.completedCount, 0),
        total: rows.reduce((a, r) => a + r.totalCount, 0),
      },
    });
  });

  /* ---------------------------- Roadmap queries -------------------------- */
  function loadRoadmapDetail(roadmapId: string, userId: string) {
    const roadmap = db
      .select()
      .from(schema.roadmaps)
      .where(and(eq(schema.roadmaps.id, roadmapId), eq(schema.roadmaps.userId, userId)))
      .get();
    if (!roadmap) return null;

    const comps = db
      .select()
      .from(schema.competencies)
      .where(eq(schema.competencies.roadmapId, roadmapId))
      .orderBy(asc(schema.competencies.position))
      .all();

    const compIds = comps.map((c) => c.id);
    const links = compIds.length
      ? db
          .select({ link: schema.competencyResources, resource: schema.resources })
          .from(schema.competencyResources)
          .innerJoin(schema.resources, eq(schema.competencyResources.resourceId, schema.resources.id))
          .where(inArray(schema.competencyResources.competencyId, compIds))
          .all()
      : [];

    const done = db
      .select()
      .from(schema.progress)
      .where(and(eq(schema.progress.userId, userId), compIds.length ? inArray(schema.progress.competencyId, compIds) : undefined))
      .all();
    const doneSet = new Set(done.map((p) => p.competencyId));

    return {
      roadmap,
      competencies: comps.map((c) => ({
        ...c,
        completed: doneSet.has(c.id),
        resources: links.filter((l) => l.link.competencyId === c.id).map((l) => l.resource),
      })),
    };
  }

  app.get("/api/roadmaps", requireAuth, (req: AuthedRequest, res) => {
    const rows = db
      .select()
      .from(schema.roadmaps)
      .where(eq(schema.roadmaps.userId, req.user!.id))
      .orderBy(asc(schema.roadmaps.createdAt))
      .all();
    res.json({ roadmaps: rows });
  });

  app.get("/api/roadmaps/:id", requireAuth, (req: AuthedRequest, res) => {
    const detail = loadRoadmapDetail(req.params.id, req.user!.id);
    if (!detail) {
      sendError(res, 404, ERR.NOT_FOUND, "Roadmap tidak ditemukan.");
      return;
    }
    res.json(detail);
  });

  /* ------------------------- Complete step (idempotent) ------------------ */
  app.post("/api/roadmaps/:id/steps/:stepId/complete", requireAuth, (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const roadmap = db
      .select()
      .from(schema.roadmaps)
      .where(and(eq(schema.roadmaps.id, req.params.id), eq(schema.roadmaps.userId, userId)))
      .get();
    if (!roadmap) {
      sendError(res, 404, ERR.NOT_FOUND, "Roadmap tidak ditemukan.");
      return;
    }
    const step = db
      .select()
      .from(schema.competencies)
      .where(and(eq(schema.competencies.id, req.params.stepId), eq(schema.competencies.roadmapId, roadmap.id)))
      .get();
    if (!step) {
      sendError(res, 404, ERR.NOT_FOUND, "Langkah tidak ditemukan pada roadmap ini.");
      return;
    }
    const existing = db
      .select()
      .from(schema.progress)
      .where(and(eq(schema.progress.userId, userId), eq(schema.progress.competencyId, step.id)))
      .get();
    if (existing) {
      res.json({ ok: true, alreadyCompleted: true, completedAt: existing.completedAt });
      return;
    }
    const row = {
      id: crypto.randomUUID(),
      userId,
      competencyId: step.id,
      completedAt: new Date(),
    };
    db.insert(schema.progress).values(row).run();
    res.status(201).json({ ok: true, alreadyCompleted: false, completedAt: row.completedAt });
  });

  /* ---------------------------- Error fallback --------------------------- */
  app.use((_req, res) => sendError(res, 404, ERR.NOT_FOUND, "Endpoint tidak ditemukan."));
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    handleRouteError(err, res);
  });

  return app;
}

function handleRouteError(err: unknown, res: express.Response) {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message);
    return;
  }
  logger.error({ err: err instanceof Error ? err.message : String(err) }, "unhandled error");
  if (!res.headersSent) sendError(res, 500, ERR.INTERNAL, "Terjadi kesalahan pada server.");
}
