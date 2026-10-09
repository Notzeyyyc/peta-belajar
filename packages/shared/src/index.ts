import { z } from "zod";

/** Status kompetensi pada roadmap. */
export const CompetencyStatusSchema = z.enum(["gap", "half", "master"]);
export type CompetencyStatus = z.infer<typeof CompetencyStatusSchema>;

export const COMPETENCY_STATUS_LABEL: Record<CompetencyStatus, string> = {
  gap: "Gap",
  half: "Setengah",
  master: "Kuasai",
};

/** Kontrak output AI: roadmap terstruktur (PRD §7). */
export const AiCompetencySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  status: CompetencyStatusSchema,
  reason: z.string().min(1).max(500),
  nextAction: z.string().min(1).max(300),
  resourceIds: z.array(z.string().min(1)).max(6),
});
export type AiCompetency = z.infer<typeof AiCompetencySchema>;

export const AiRoadmapOutputSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
  competencies: z.array(AiCompetencySchema).min(3).max(6),
});
export type AiRoadmapOutput = z.infer<typeof AiRoadmapOutputSchema>;

/** Kontrak request: klarifikasi. */
export const ClarifyRequestSchema = z.object({
  goal: z.string().min(3).max(240),
});
export type ClarifyRequest = z.infer<typeof ClarifyRequestSchema>;

export const ClarifyQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(120)).min(2).max(4),
});
export const ClarifyResponseSchema = z.object({
  questions: z.array(ClarifyQuestionSchema).min(2).max(3),
});
export type ClarifyResponse = z.infer<typeof ClarifyResponseSchema>;

/** Kontrak request: generate roadmap. */
export const GenerateRequestSchema = z.object({
  goal: z.string().min(3).max(240),
  answers: z
    .array(z.object({ questionId: z.string().min(1), answer: z.string().min(1).max(200) }))
    .max(3)
    .default([]),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
