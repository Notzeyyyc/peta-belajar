import type { LearningStyle, MateriResponse } from "@peta-belajar/shared";

// Selalu pakai path relatif: Next.js me-proxy /api/* ke backend (lihat next.config.mjs).
// Ini membuat cookie sesi same-origin dan tidak bergantung pada hostname klien.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    // fetch reject = jaringan/offline
    throw new ApiError(0, "OFFLINE", "Kamu sedang offline. Cek koneksi internetmu ya.");
  }
  const body = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? "Terjadi kesalahan. Coba lagi ya.",
    );
  }
  return body as T;
}

export interface ApiUser {
  id: string;
  displayName: string;
  role: string;
}

export interface ApiResource {
  id: string;
  title: string;
  description: string;
  type: "video" | "article" | "interactive" | "game" | "course";
  durationMinutes: number;
  url: string;
  level: string;
}

export interface RoadmapSummary {
  id: string;
  goal: string;
  title: string;
  summary: string;
  totalCount: number;
  completedCount: number;
  gapCount: number;
  halfCount: number;
  progressPct: number;
}

export interface ApiCompetency {
  id: string;
  position: number;
  name: string;
  description: string;
  status: "gap" | "half" | "master";
  reason: string;
  nextAction: string;
  completed: boolean;
  resources: ApiResource[];
}

export interface RoadmapDetail {
  roadmap: { id: string; goal: string; title: string; summary: string };
  competencies: ApiCompetency[];
}

export const api = {
  demoLogin: () => request<{ user: ApiUser }>("/api/auth/demo", { method: "POST" }),
  magicLink: (email: string) =>
    request<{ ok: boolean; message: string }>("/api/auth/magic-link/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  me: () => request<{ user: ApiUser }>("/api/me"),
  example: () =>
    request<{
      example: {
        goal: string;
        competencies: { name: string; status: "gap" | "half" | "master"; reason: string }[];
      };
    }>("/api/example"),
  home: () =>
    request<{ user: ApiUser; activeRoadmap: RoadmapSummary | null; nextResources: ApiResource[] }>(
      "/api/home",
    ),
  profile: () =>
    request<{
      user: ApiUser;
      learningStyle: LearningStyle | null;
      roadmaps: RoadmapSummary[];
      stats: { cumulativeGap: number; completed: number; total: number };
    }>("/api/profile"),
  setLearningStyle: (learningStyle: LearningStyle) =>
    request<{ ok: boolean; learningStyle: LearningStyle }>("/api/me/preferences", {
      method: "PUT",
      body: JSON.stringify({ learningStyle }),
    }),
  /** Materi Anak — mode "ai" (materi+cached+sumber) atau "fallback" (reason+resource). */
  materi: (roadmapId: string, stepId: string) =>
    request<MateriResponse>(`/api/roadmaps/${roadmapId}/steps/${stepId}/materi`),
  roadmap: (id: string) => request<RoadmapDetail>(`/api/roadmaps/${id}`),
  clarify: (goal: string) =>
    request<{ questions: { id: string; question: string; options: string[] }[] }>(
      "/api/roadmaps/clarify",
      { method: "POST", body: JSON.stringify({ goal }) },
    ),
  generate: (goal: string, answers: { questionId: string; answer: string }[]) =>
    request<RoadmapDetail>("/api/roadmaps/generate", {
      method: "POST",
      body: JSON.stringify({ goal, answers }),
    }),
  completeStep: (roadmapId: string, stepId: string) =>
    request<{ ok: boolean }>(`/api/roadmaps/${roadmapId}/steps/${stepId}/complete`, {
      method: "POST",
    }),
};
