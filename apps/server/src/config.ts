import "dotenv/config";
import path from "node:path";
import crypto from "node:crypto";

export interface Config {
  port: number;
  host: string;
  user: string;
  pass: string;
  sessionSecret: string;
  /** absolute path of the folder to expose. */
  shareDir: string;
  /** absolute path of the built web app (served in production). */
  webDist: string;
  isProd: boolean;
  usingDefaultPass: boolean;
  usingEphemeralSecret: boolean;
}

/**
 * build the runtime config from environment variables. `overrides` lets tests
 * inject a temp directory and fixed credentials. paths are resolved against the
 * current working directory, which is the repo root for all npm scripts.
 */
export function buildConfig(overrides: Partial<Config> = {}): Config {
  const cwd = process.cwd();
  const pass = process.env.SHARE_PASS ?? "changeme";
  const secret = process.env.SESSION_SECRET;

  const base: Config = {
    port: Number(process.env.PORT ?? 8000),
    host: process.env.HOST ?? "0.0.0.0",
    user: process.env.SHARE_USER ?? "admin",
    pass,
    sessionSecret: secret && secret.length > 0 ? secret : crypto.randomBytes(32).toString("hex"),
    shareDir: path.resolve(cwd, process.env.SHARE_DIR ?? "shared"),
    webDist: path.resolve(cwd, "apps/web/dist"),
    isProd: process.env.NODE_ENV === "production",
    usingDefaultPass: pass === "changeme",
    usingEphemeralSecret: !secret || secret.length === 0,
  };

  return { ...base, ...overrides };
}
