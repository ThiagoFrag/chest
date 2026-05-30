import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks declared via vi.hoisted so they exist before the hoisted vi.mock
// factories run (otherwise the real ../db is loaded, which needs bun:sqlite).
const { getRow, insertRow, ran, invalidateHostCache } = vi.hoisted(() => ({
	getRow: vi.fn(),
	insertRow: vi.fn(),
	ran: vi.fn(),
	invalidateHostCache: vi.fn(),
}));

// db() returns a drizzle-ish fluent builder; only the terminals matter here.
vi.mock("../db", () => ({
	db: () => ({
		select: () => ({
			from: () => ({
				where: () => ({ get: () => getRow() }),
				orderBy: () => Promise.resolve([]),
			}),
		}),
		insert: () => ({
			values: () => ({ returning: () => ({ get: () => insertRow() }) }),
		}),
		update: () => ({
			set: () => ({ where: () => ({ run: () => ran("update") }) }),
		}),
		delete: () => ({ where: () => ({ run: () => ran("delete") }) }),
	}),
}));

vi.mock("../mc/crypto", () => ({
	encrypt: async (s: string) => `enc(${s})`,
	decrypt: async (s: string) => s.replace(/^enc\((.*)\)$/, "$1"),
}));

vi.mock("../settings", () => ({
	getSetting: async () => null,
}));

vi.mock("./pool", () => ({
	dockerForHost: vi.fn(),
	invalidateHostCache: (...args: unknown[]) => invalidateHostCache(...args),
	LOCAL_HOST_ID: "local",
}));

import { createHost, deleteHost, updateHost, LOCAL_HOST_ID } from "./hosts";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createHost validation", () => {
	it("rejects an invalid endpoint", async () => {
		await expect(
			createHost({ name: "box", endpoint: "http://1.2.3.4:2375" }),
		).rejects.toThrow(/invalid endpoint/);
	});

	it("rejects an empty name", async () => {
		await expect(
			createHost({ name: "   ", endpoint: "tcp://1.2.3.4:2376" }),
		).rejects.toThrow(/name cannot be empty/);
	});

	it("accepts tcp:// and never returns encrypted certs", async () => {
		insertRow.mockReturnValue({
			id: "x",
			name: "box",
			endpoint: "tcp://1.2.3.4:2376",
			tlsCaEncrypted: "enc(CA)",
			tlsCertEncrypted: "enc(CERT)",
			tlsKeyEncrypted: "enc(KEY)",
			isDefault: false,
			enabled: true,
			hostAddress: null,
			createdAt: new Date(),
		});

		const host = await createHost({
			name: "box",
			endpoint: "tcp://1.2.3.4:2376",
			tlsCa: "CA",
			tlsCert: "CERT",
			tlsKey: "KEY",
		});

		expect(host.endpoint).toBe("tcp://1.2.3.4:2376");
		expect(host.hasTls).toBe(true);
		expect(host).not.toHaveProperty("tlsCaEncrypted");
		expect(host).not.toHaveProperty("tlsCertEncrypted");
		expect(host).not.toHaveProperty("tlsKeyEncrypted");
	});
});

describe("deleteHost guards", () => {
	it("refuses to delete the local host", async () => {
		await expect(deleteHost(LOCAL_HOST_ID)).rejects.toThrow(
			/local host cannot be deleted/,
		);
		expect(ran).not.toHaveBeenCalled();
	});

	it("refuses to delete a host that still has servers", async () => {
		getRow.mockReturnValue({ value: 3 });
		await expect(deleteHost("remote-1")).rejects.toThrow(
			/move or remove the servers first/,
		);
		expect(ran).not.toHaveBeenCalled();
	});

	it("deletes a host with zero servers and invalidates the cache", async () => {
		getRow.mockReturnValue({ value: 0 });
		await deleteHost("remote-1");
		expect(ran).toHaveBeenCalledWith("delete");
		expect(invalidateHostCache).toHaveBeenCalledWith("remote-1");
	});
});

describe("updateHost guards", () => {
	it("refuses to disable the local host", async () => {
		getRow.mockReturnValue({ id: LOCAL_HOST_ID, name: "local" });
		await expect(updateHost(LOCAL_HOST_ID, { enabled: false })).rejects.toThrow(
			/local host is always required/,
		);
		expect(ran).not.toHaveBeenCalled();
	});

	it("rejects an invalid endpoint on update", async () => {
		getRow.mockReturnValue({ id: "remote-1" });
		await expect(updateHost("remote-1", { endpoint: "ftp://nope" })).rejects.toThrow(
			/invalid endpoint/,
		);
	});

	it("throws when the host does not exist", async () => {
		getRow.mockReturnValue(undefined);
		await expect(updateHost("ghost", { name: "x" })).rejects.toThrow(
			/host not found/,
		);
	});
});
