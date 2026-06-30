import { Router, type RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";
import type { Config } from "./config";

/** constant-time string compare that doesn't leak length via early throw. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ab, bb);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** gate for protected routes: 401 unless a session user is present. */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    next();
    return;
  }
  res.status(401).json({ error: "unauthorized" });
};

export function createAuthRouter(cfg: Config): Router {
  const router = Router();

  // public liveness probe (used by docker healthcheck). no auth.
  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  router.post("/login", async (req, res) => {
    const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
    const u = typeof body.username === "string" ? body.username : "";
    const p = typeof body.password === "string" ? body.password : "";

    // evaluate both comparisons regardless of the first result to limit timing signal.
    const userOk = safeEqual(u, cfg.user);
    const passOk = safeEqual(p, cfg.pass);

    if (!(userOk && passOk)) {
      await sleep(500); // light brute-force friction
      res.status(401).json({ error: "access denied" });
      return;
    }

    if (req.session) {
      req.session.user = u;
    }
    res.json({ username: u });
  });

  router.post("/logout", (req, res) => {
    req.session = null;
    res.json({ ok: true });
  });

  router.get("/me", (req, res) => {
    const user = req.session?.user;
    if (!user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    res.json({ username: user });
  });

  return router;
}
