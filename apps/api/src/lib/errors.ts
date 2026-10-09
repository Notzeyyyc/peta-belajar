import type { Response } from "express";

/** Error aplikasi dengan kode stabil untuk mapping { error: { code, message } }. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

/** Kode error konsisten di seluruh API. */
export const ERR = {
  INVALID_REQUEST: "INVALID_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  AI_INVALID_OUTPUT: "AI_INVALID_OUTPUT",
  AI_NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  INTERNAL: "INTERNAL",
} as const;
