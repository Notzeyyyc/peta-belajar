import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "../db/client.js";
import { ERR, sendError } from "../lib/errors.js";

export const SESSION_COOKIE = "pb_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export interface AuthedRequest extends Request {
  user?: { id: string; displayName: string; role: string };
}

export function createSession(userId: string) {
  const id = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  db.insert(schema.sessions)
    .values({ id, userId, expiresAt: new Date(now.getTime() + SESSION_TTL_MS), createdAt: now })
    .run();
  return id;
}

export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

/** Middleware sesi: baca cookie HTTP-only, validasi, tempel user ke req. */
export function sessionMiddleware(req: AuthedRequest, _res: Response, next: NextFunction) {
  const sid = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!sid) return next();
  const rows = db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sid), gt(schema.sessions.expiresAt, new Date())))
    .all();
  const user = rows[0]?.user;
  if (user) req.user = { id: user.id, displayName: user.displayName, role: user.role };
  next();
}

/** Wajib login — tolak 401 bila tidak ada sesi. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    sendError(res, 401, ERR.UNAUTHORIZED, "Silakan masuk terlebih dahulu.");
    return;
  }
  next();
}
