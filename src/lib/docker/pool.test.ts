import { describe, it, expect, beforeEach, vi } from "vitest";
import Docker from "dockerode";

vi.mock("$env/dynamic/private", () => ({
	env: {},
}));

const getHost = vi.fn();
const getServer = vi.fn();

vi.mock("../db", () => ({
	db: () => ({
		select: (cols?: unknown) => ({
			from: () => ({
				where: () => ({
					get: () => (cols ? getServer() : getHost()),
				}),
			}),
		}),
	}),
}));

vi.mock("../mc/crypto", () => ({
	decrypt: (s: string) => `decrypted:${s}`,
}));

import {
	docker,
	dockerForHost,
	dockerForContainer,
	invalidateHostCache,
	LOCAL_HOST_ID,
} from "./pool";

describe("docker pool", () => {
	beforeEach(() => {
		invalidateHostCache();
		getHost.mockReset();
		getServer.mockReset();
	});

	it("LOCAL_HOST_ID is 'local'", () => {
		expect(LOCAL_HOST_ID).toBe("local");
	});

	it("dockerForHost('local') returns a Docker without throwing", async () => {
		const d = await dockerForHost(LOCAL_HOST_ID);
		expect(d).toBeInstanceOf(Docker);
	});

	it("caches the local instance across calls", async () => {
		const a = await dockerForHost(LOCAL_HOST_ID);
		const b = await dockerForHost(LOCAL_HOST_ID);
		expect(a).toBe(b);
	});

	it("docker() returns the same cached local instance as dockerForHost('local')", async () => {
		const sync = docker();
		const fromPool = await dockerForHost(LOCAL_HOST_ID);
		expect(sync).toBe(fromPool);
		expect(docker()).toBe(sync);
	});

	it("invalidateHostCache() forces a fresh local instance", async () => {
		const a = docker();
		invalidateHostCache();
		const b = docker();
		expect(a).not.toBe(b);
	});

	it("invalidateHostCache(id) only drops that host", async () => {
		const localBefore = docker();
		invalidateHostCache("some-remote");
		expect(docker()).toBe(localBefore);
	});

	it("throws a clear error when host is not found", async () => {
		getHost.mockReturnValue(undefined);
		await expect(dockerForHost("ghost")).rejects.toThrow(/not found/);
	});

	it("throws a clear error when host is disabled", async () => {
		getHost.mockReturnValue({ id: "h1", endpoint: "tcp://1.2.3.4:2375", enabled: false });
		await expect(dockerForHost("h1")).rejects.toThrow(/disabled/);
	});

	it("builds a remote tcp host (no tls) and caches it", async () => {
		getHost.mockReturnValue({ id: "h2", endpoint: "tcp://1.2.3.4:2375", enabled: true });
		const a = await dockerForHost("h2");
		expect(a).toBeInstanceOf(Docker);
		const b = await dockerForHost("h2");
		expect(a).toBe(b);
		expect(getHost).toHaveBeenCalledTimes(1);
	});

	it("builds a remote tls host when ca is present", async () => {
		getHost.mockReturnValue({
			id: "h3",
			endpoint: "tcp://1.2.3.4:2376",
			enabled: true,
			tlsCaEncrypted: "ca",
			tlsCertEncrypted: "cert",
			tlsKeyEncrypted: "key",
		});
		const d = await dockerForHost("h3");
		expect(d).toBeInstanceOf(Docker);
	});

	it("dockerForContainer falls back to local for unknown containers", async () => {
		getServer.mockReturnValue(undefined);
		const d = await dockerForContainer("mystery");
		expect(d).toBe(docker());
	});

	it("dockerForContainer with null hostId resolves to local", async () => {
		getServer.mockReturnValue({ hostId: null });
		const d = await dockerForContainer("legacy");
		expect(d).toBe(docker());
	});

	it("dockerForContainer routes to the server's hostId", async () => {
		getServer.mockReturnValue({ hostId: "h2" });
		getHost.mockReturnValue({ id: "h2", endpoint: "tcp://1.2.3.4:2375", enabled: true });
		const d = await dockerForContainer("app");
		expect(d).toBeInstanceOf(Docker);
		expect(d).toBe(await dockerForHost("h2"));
	});
});
