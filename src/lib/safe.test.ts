import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { silent, silentSync, logFail } from "./safe";

describe("silent", () => {
  it("returns value on success", async () => {
    expect(await silent(Promise.resolve(42))).toBe(42);
  });
  it("returns undefined on failure", async () => {
    expect(await silent(Promise.reject(new Error("boom")))).toBeUndefined();
  });
});

describe("silentSync", () => {
  it("returns value on success", () => {
    expect(silentSync(() => 42)).toBe(42);
  });
  it("returns undefined on throw", () => {
    expect(silentSync(() => { throw new Error("nope"); })).toBeUndefined();
  });
});

describe("logFail", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined); });
  afterEach(() => { errSpy.mockRestore(); });

  it("returns value and does not log on success", async () => {
    expect(await logFail(Promise.resolve(1), "test")).toBe(1);
    expect(errSpy).not.toHaveBeenCalled();
  });
  it("returns undefined and logs on failure", async () => {
    expect(await logFail(Promise.reject(new Error("x")), "test")).toBeUndefined();
    expect(errSpy).toHaveBeenCalledOnce();
  });
});
