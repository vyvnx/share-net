import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildConfig } from "../src/config";
import { createApp } from "../src/app";
import { openProgressStore } from "../src/store/progress";

const USER = "tester";
const PASS = "secret-pass";

let tmp: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sharenet-"));
  fs.mkdirSync(path.join(tmp, "books"));
  fs.writeFileSync(path.join(tmp, "hello.txt"), "hello world");
  fs.writeFileSync(path.join(tmp, "books", "a.txt"), "aaa");

  const store = openProgressStore(path.join(tmp, "state", "progress.db"));
  app = createApp(
    buildConfig({
      shareDir: tmp,
      stateDir: path.join(tmp, "state"),
      user: USER,
      pass: PASS,
      sessionSecret: "test-secret",
      webDist: path.join(tmp, "__no_web__"),
    }),
    store,
  );
});

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function loggedIn() {
  const agent = request.agent(app);
  await agent.post("/api/login").send({ username: USER, password: PASS }).expect(200);
  return agent;
}

describe("health", () => {
  it("responds without auth", async () => {
    await request(app).get("/api/health").expect(200, { ok: true });
  });
});

describe("auth", () => {
  it("rejects wrong credentials", async () => {
    await request(app).post("/api/login").send({ username: USER, password: "nope" }).expect(401);
  });

  it("blocks protected routes without a session", async () => {
    await request(app).get("/api/files").expect(401);
  });

  it("reports the user after login", async () => {
    const agent = await loggedIn();
    await agent.get("/api/me").expect(200, { username: USER });
  });

  it("logs out", async () => {
    const agent = await loggedIn();
    await agent.post("/api/logout").expect(200);
    await agent.get("/api/me").expect(401);
  });
});

describe("files", () => {
  it("lists the root directory with directories first", async () => {
    const agent = await loggedIn();
    const res = await agent.get("/api/files").expect(200);
    expect(res.body.entries[0]).toMatchObject({ name: "books", type: "dir" });
    const names = res.body.entries.map((e: { name: string }) => e.name);
    expect(names).toContain("hello.txt");
  });

  it("rejects path traversal", async () => {
    const agent = await loggedIn();
    await agent.get("/api/files").query({ path: "../../etc" }).expect(400);
  });

  it("downloads a file as an attachment", async () => {
    const agent = await loggedIn();
    const res = await agent.get("/api/download").query({ path: "hello.txt" }).expect(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text).toBe("hello world");
  });

  it("serves a byte range", async () => {
    const agent = await loggedIn();
    const res = await agent
      .get("/api/download")
      .query({ path: "hello.txt" })
      .set("Range", "bytes=0-4")
      .expect(206);
    expect(res.text).toBe("hello");
  });

  it("marks downloads no-transform so proxies don't mangle them", async () => {
    const agent = await loggedIn();
    const res = await agent.get("/api/download").query({ path: "hello.txt" }).expect(200);
    expect(res.headers["cache-control"]).toContain("no-transform");
  });

  it("serves raw previews no-transform with range support", async () => {
    const agent = await loggedIn();
    const res = await agent.get("/api/raw").query({ path: "hello.txt" }).expect(200);
    expect(res.headers["cache-control"]).toContain("no-transform");
    expect(res.headers["accept-ranges"]).toBe("bytes");
  });
});

describe("progress", () => {
  it("returns null before anything is saved", async () => {
    const agent = await loggedIn();
    const res = await agent.get("/api/progress").query({ path: "books/a.txt" }).expect(200);
    expect(res.body).toEqual({ page: null });
  });

  it("saves and returns the page", async () => {
    const agent = await loggedIn();
    await agent.put("/api/progress").query({ path: "books/a.txt" }).send({ page: 12 }).expect(200);
    const res = await agent.get("/api/progress").query({ path: "books/a.txt" }).expect(200);
    expect(res.body).toEqual({ page: 12 });
  });

  it("rejects a non-positive page", async () => {
    const agent = await loggedIn();
    await agent.put("/api/progress").query({ path: "books/a.txt" }).send({ page: 0 }).expect(400);
  });

  it("rejects path traversal", async () => {
    const agent = await loggedIn();
    await agent.get("/api/progress").query({ path: "../../etc/passwd" }).expect(400);
  });

  it("requires auth", async () => {
    await request(app).get("/api/progress").query({ path: "books/a.txt" }).expect(401);
  });
});

describe("mkdir", () => {
  it("creates a folder in the current directory", async () => {
    const agent = await loggedIn();
    const res = await agent.post("/api/mkdir").send({ name: "docs" }).expect(201);
    expect(res.body).toEqual({ path: "docs" });
    expect(fs.statSync(path.join(tmp, "docs")).isDirectory()).toBe(true);
  });

  it("creates nested folders recursively and returns the deepest path", async () => {
    const agent = await loggedIn();
    const res = await agent
      .post("/api/mkdir")
      .query({ path: "books" })
      .send({ name: "2026/q3" })
      .expect(201);
    expect(res.body).toEqual({ path: "books/2026/q3" });
    expect(fs.statSync(path.join(tmp, "books", "2026", "q3")).isDirectory()).toBe(true);
  });

  it("rejects creating a folder that already exists", async () => {
    const agent = await loggedIn();
    await agent.post("/api/mkdir").send({ name: "dup" }).expect(201);
    await agent.post("/api/mkdir").send({ name: "dup" }).expect(409);
  });

  it("rejects an empty name", async () => {
    const agent = await loggedIn();
    await agent.post("/api/mkdir").send({ name: "  " }).expect(400);
  });

  it("rejects path traversal", async () => {
    const agent = await loggedIn();
    await agent.post("/api/mkdir").send({ name: "../escape" }).expect(400);
    expect(fs.existsSync(path.join(tmp, "..", "escape"))).toBe(false);
  });

  it("requires auth", async () => {
    await request(app).post("/api/mkdir").send({ name: "nope" }).expect(401);
  });
});

describe("upload", () => {
  it("uploads without overwriting an existing file", async () => {
    const agent = await loggedIn();
    await agent.post("/api/upload").attach("file", Buffer.from("one"), "note.txt").expect(200);
    const second = await agent
      .post("/api/upload")
      .attach("file", Buffer.from("two"), "note.txt")
      .expect(200);

    expect(second.body.name).toBe("note (1).txt");
    expect(fs.readFileSync(path.join(tmp, "note.txt"), "utf8")).toBe("one");
    expect(fs.readFileSync(path.join(tmp, "note (1).txt"), "utf8")).toBe("two");
  });
});
