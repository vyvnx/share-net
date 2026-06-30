import { Router } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import type { Config } from "./config";
import { safePath, cleanRel } from "./security";
import type { FileEntry, ListResponse } from "../../../packages/types";

/** pick a filename that doesn't already exist in `dir`, appending " (n)" before the ext. */
function nonCollidingName(dir: string, name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let candidate = name;
  let i = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base} (${i})${ext}`;
    i += 1;
  }
  return candidate;
}

export function createFilesRouter(cfg: Config): Router {
  const router = Router();

  const upload = multer({
    storage: multer.diskStorage({
      destination(req, _file, cb) {
        try {
          const dir = safePath(cfg.shareDir, String(req.query.path ?? ""));
          if (!fs.statSync(dir).isDirectory()) {
            cb(new Error("not a directory"), "");
            return;
          }
          cb(null, dir);
        } catch (e) {
          cb(e as Error, "");
        }
      },
      filename(req, file, cb) {
        try {
          const dir = safePath(cfg.shareDir, String(req.query.path ?? ""));
          const clean = path.basename(file.originalname).replace(/[/\\]/g, "_") || "upload";
          cb(null, nonCollidingName(dir, clean));
        } catch (e) {
          cb(e as Error, "");
        }
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 gb
  });

  router.get("/files", async (req, res) => {
    let dir: string;
    try {
      dir = safePath(cfg.shareDir, String(req.query.path ?? ""));
    } catch {
      res.status(400).json({ error: "bad path" });
      return;
    }

    let st: fs.Stats;
    try {
      st = await fsp.stat(dir);
    } catch {
      res.status(404).json({ error: "not found" });
      return;
    }
    if (!st.isDirectory()) {
      res.status(400).json({ error: "not a directory" });
      return;
    }

    const dirents = await fsp.readdir(dir, { withFileTypes: true });
    const entries: FileEntry[] = [];
    for (const d of dirents) {
      try {
        const s = await fsp.stat(path.join(dir, d.name)); // follow symlinks
        entries.push({
          name: d.name,
          type: s.isDirectory() ? "dir" : "file",
          size: s.isDirectory() ? 0 : s.size,
          mtime: s.mtimeMs,
        });
      } catch {
        // skip broken symlinks / unreadable entries
      }
    }
    entries.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
    );

    const body: ListResponse = { path: cleanRel(String(req.query.path ?? "")), entries };
    res.json(body);
  });

  // download a file as an attachment (supports http range).
  router.get("/download", (req, res) => {
    let file: string;
    try {
      file = safePath(cfg.shareDir, String(req.query.path ?? ""));
    } catch {
      res.status(400).json({ error: "bad path" });
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.download(file, path.basename(file));
    });
  });

  // stream a file inline for previewing (supports http range).
  router.get("/raw", (req, res) => {
    let file: string;
    try {
      file = safePath(cfg.shareDir, String(req.query.path ?? ""));
    } catch {
      res.status(400).json({ error: "bad path" });
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.sendFile(file);
    });
  });

  // upload a file into a directory. never overwrites (auto-renames). no delete exists.
  router.post("/upload", (req, res) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "upload failed";
        res.status(400).json({ error: msg });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "no file" });
        return;
      }
      res.json({ name: req.file.filename });
    });
  });

  return router;
}
