import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Readable } from "node:stream";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorage } from "./storage";

describe("LocalStorage", () => {
  let dir: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "chest-storage-test-"));
    storage = new LocalStorage(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("put + get round-trip", async () => {
    const content = "hello world";
    const { sizeBytes } = await storage.put("test.txt", Readable.from([Buffer.from(content)]));
    expect(sizeBytes).toBe(content.length);

    const stream = await storage.get("test.txt");
    const chunks: Buffer[] = [];
    for await (const c of stream as AsyncIterable<Buffer>) chunks.push(c);
    expect(Buffer.concat(chunks).toString()).toBe(content);
  });

  it("list returns put files", async () => {
    await storage.put("a.txt", Readable.from([Buffer.from("a")]));
    await storage.put("b.txt", Readable.from([Buffer.from("bb")]));
    const list = await storage.list();
    expect(list.map(b => b.key).sort()).toEqual(["a.txt", "b.txt"]);
  });

  it("list filters by prefix", async () => {
    await storage.put("foo__1.txt", Readable.from([Buffer.from("a")]));
    await storage.put("bar__1.txt", Readable.from([Buffer.from("b")]));
    const list = await storage.list("foo");
    expect(list.map(b => b.key)).toEqual(["foo__1.txt"]);
  });

  it("delete removes file", async () => {
    await storage.put("x.txt", Readable.from([Buffer.from("x")]));
    await storage.delete("x.txt");
    const list = await storage.list();
    expect(list).toEqual([]);
  });

  it("delete is idempotent (no error if missing)", async () => {
    await expect(storage.delete("ghost.txt")).resolves.not.toThrow();
  });

  it("ping ok for writable dir", async () => {
    const result = await storage.ping();
    expect(result.ok).toBe(true);
  });

  it("driver name is local", () => {
    expect(storage.driver).toBe("local");
  });
});
