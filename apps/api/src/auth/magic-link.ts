import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "../db/client.js";

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createMagicToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashMagicToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendMagicLink(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = process.env.MAGIC_LINK_BASE_URL;
  if (!apiKey || !baseUrl) throw new Error("Magic link is not configured");
  const url = new URL("/api/auth/magic-link/verify", baseUrl);
  url.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Peta Belajar <noreply@send.qenoxit.site>",
      to: [email],
      subject: "Tautan masuk Peta Belajar",
      html: `<p>Klik tautan berikut untuk masuk ke Peta Belajar:</p><p><a href="${url.toString()}">Masuk ke Peta Belajar</a></p><p>Tautan berlaku 15 menit dan hanya dapat digunakan sekali.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}

export function consumeMagicToken(token: string): string | null {
  const tokenHash = hashMagicToken(token);
  const now = new Date();
  const row = db
    .select()
    .from(schema.magicLinkTokens)
    .where(and(eq(schema.magicLinkTokens.tokenHash, tokenHash), gt(schema.magicLinkTokens.expiresAt, now)))
    .get();
  if (!row || row.usedAt) return null;
  const updated = db
    .update(schema.magicLinkTokens)
    .set({ usedAt: now })
    .where(and(eq(schema.magicLinkTokens.id, row.id), eq(schema.magicLinkTokens.tokenHash, tokenHash)))
    .run();
  return updated.changes === 1 ? row.email : null;
}
