import pino from "pino";

/** Logger pino dengan redaction untuk field sensitif (PRD §10). */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.prompt",
    ],
    censor: "[redacted]",
  },
});
