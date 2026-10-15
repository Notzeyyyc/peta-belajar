import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  role: text("role", { enum: ["student", "parent", "judge", "admin"] }).notNull().default("student"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const magicLinkTokens = sqliteTable("magic_link_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
export const learningPreferences = sqliteTable("learning_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  style: text("style", { enum: ["visual", "praktik", "teori"] }).notNull().default("visual"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const roadmaps = sqliteTable("roadmaps", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  goal: text("goal").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const competencies = sqliteTable("competencies", {
  id: text("id").primaryKey(),
  roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["gap", "half", "master"] }).notNull(),
  reason: text("reason").notNull(),
  nextAction: text("next_action").notNull(),
});

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["video", "article", "interactive", "game", "course"] }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  url: text("url").notNull(),
  level: text("level", { enum: ["beginner", "intermediate"] }).notNull().default("beginner"),
  /** Teks/transkrip sumber terkurasi — bahan mentah Materi Anak (A+C). NULL = belum ada isi. */
  content: text("content"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const competencyResources = sqliteTable(
  "competency_resources",
  {
    competencyId: text("competency_id").notNull().references(() => competencies.id),
    resourceId: text("resource_id").notNull().references(() => resources.id),
  },
  (t) => ({ pk: primaryKey({ columns: [t.competencyId, t.resourceId] }) }),
);

/** Cache Materi Anak per (resource + gaya belajar) — panggilan kedua instan, demo < 60 detik. */
export const materiCache = sqliteTable(
  "materi_cache",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id),
    learningStyle: text("learning_style", { enum: ["visual", "praktik", "teori"] }).notNull(),
    /** JSON string dari MateriAnakSchema (sudah tervalidasi Zod sebelum disimpan). */
    payloadJson: text("payload_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    byResourceStyle: uniqueIndex("materi_cache_resource_style_uk").on(t.resourceId, t.learningStyle),
  }),
);

export const progress = sqliteTable("progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  competencyId: text("competency_id").notNull().references(() => competencies.id),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
});

export const aiRuns = sqliteTable("ai_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  roadmapId: text("roadmap_id").references(() => roadmaps.id),
  inputHash: text("input_hash").notNull(),
  model: text("model").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  status: text("status", { enum: ["success", "invalid_output", "error", "timeout"] }).notNull(),
  errorCode: text("error_code"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
