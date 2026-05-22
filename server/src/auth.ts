import type { CookieOptions, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret, isProduction } from "./config/env.js";
import { respondIfClientSuspended } from "./lib/client-suspension.js";
import { respondIfTrainerSuspended } from "./lib/trainer-suspension.js";
import type { Role } from "./db/types.js";

const COOKIE = "auth_token";

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function jwtSecret(): string {
  return getJwtSecret();
}

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "14d" });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret());
    if (typeof decoded !== "object" || decoded === null) return null;
    const d = decoded as Record<string, unknown>;
    const sub = typeof d.sub === "string" ? d.sub : null;
    const email = typeof d.email === "string" ? d.email : null;
    const role = d.role as Role | undefined;
    if (!sub || !email || !role) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export function authCookieOptions(): CookieOptions {
  // Cross-origin SPA (Vercel) + API (Railway) requires SameSite=None + Secure.
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, authCookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, authCookieOptions());
}

export function readAuthCookie(req: Request): string | undefined {
  const raw = req.cookies?.[COOKIE];
  return typeof raw === "string" ? raw : undefined;
}

export function attachUser(req: Request): JwtPayload | null {
  const token = readAuthCookie(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

declare global {
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const u = attachUser(req);
  if (!u) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.authUser = u;
  next();
}

export function requireRoles(roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const u = attachUser(req);
    if (!u) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.authUser = u;
    if (!roles.includes(u.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (u.role === "CLIENT" && roles.includes("CLIENT")) {
      if (await respondIfClientSuspended(u.sub, res)) return;
    }
    if (u.role === "TRAINER" && roles.includes("TRAINER")) {
      if (await respondIfTrainerSuspended(u.sub, res)) return;
    }
    next();
  };
}
