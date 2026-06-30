import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildConfig } from "../src/config";
import { createApp } from "../src/app";

const USER = "tester";
const PASS = "secret-pass";

let tmp: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sharenet-"));
  fs.mkdirSync(path.join(tmp, "books"));
  fs.writeFileSync(path.join(tmp, "hello.txt"), "hello world");
  fs.writeFileSync(path.join(tmp, "books", "a.txt"), "aaa");

  app = createApp(
    buildConfig({
      shareDir: tmp,
      user: USER,
      pass: PASS,
      sessionSecret: "test-secret",
      webDist: path.join(tmp, "__no_web__"),
    }),
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
