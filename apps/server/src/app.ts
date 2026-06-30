import express from "express";
import cookieSession from "cookie-session";
import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config";
import { createAuthRouter, requireAuth } from "./auth";
import { createFilesRouter } from "./files";

export function createApp(cfg: Config) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use(
    cookieSession({
      name: "share_net",
      keys: [cfg.sessionSecret],
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }),
  );

  // public auth endpoints, then everything else behind the session gate.
  app.use("/api", createAuthRouter(cfg));
  app.use("/api", requireAuth, createFilesRouter(cfg));

  // in production, serve the built web app with spa fallback.
  if (fs.existsSync(cfg.webDist)) {
    app.use(express.static(cfg.webDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(cfg.webDist, "index.html"));
    });
  }

  return app;
}
