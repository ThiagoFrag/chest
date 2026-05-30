import { describe, it, expect } from 'vitest';
import {
	SCOPES,
	generateState,
	generatePkce,
	buildAuthorizeUrl,
} from './discord-oauth';

async function base64UrlSha256(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	let binary = '';
	for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('generateState', () => {
	it('produces distinct base64url strings', () => {
		const a = generateState();
		const b = generateState();
		expect(a).not.toBe(b);
		expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(a.length).toBeGreaterThan(20);
	});
});

describe('generatePkce', () => {
	it('produces a 64-char base64url verifier', async () => {
		const { verifier } = await generatePkce();
		expect(verifier).toHaveLength(64);
		expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('produces challenge = base64url(sha256(verifier))', async () => {
		const { verifier, challenge } = await generatePkce();
		const expected = await base64UrlSha256(verifier);
		expect(challenge).toBe(expected);
		expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('matches a known precomputed S256 challenge for a fixed verifier', async () => {
		// Independent fixture: SHA-256(verifier) base64url-encoded, computed offline
		// (node crypto). Asserts the helper actually implements RFC 7636 S256.
		const verifier = 'test_verifier_0123456789_abcdefghijklmnopqrstuvwxyz_ABCDEF';
		const expectedFixture = 'i8RWxwINvFebobHGw6CjEeW_NVLZZhzgAwJNZsQVWNE';
		const challenge = await base64UrlSha256(verifier);
		expect(challenge).toBe(expectedFixture);
		expect(challenge).not.toContain('=');
		expect(challenge).not.toMatch(/[+/]/);
	});
});

describe('buildAuthorizeUrl', () => {
	const params = {
		clientId: 'client-123',
		redirectUri: 'https://forja.app/auth/callback',
		state: 'state-abc',
		challenge: 'challenge-xyz',
	};

	it('targets the Discord authorize endpoint', () => {
		const url = new URL(buildAuthorizeUrl(params));
		expect(url.origin + url.pathname).toBe('https://discord.com/oauth2/authorize');
	});

	it('includes the required OAuth + PKCE params', () => {
		const url = new URL(buildAuthorizeUrl(params));
		const q = url.searchParams;
		expect(q.get('client_id')).toBe('client-123');
		expect(q.get('redirect_uri')).toBe('https://forja.app/auth/callback');
		expect(q.get('response_type')).toBe('code');
		expect(q.get('scope')).toBe(SCOPES);
		expect(q.get('state')).toBe('state-abc');
		expect(q.get('code_challenge')).toBe('challenge-xyz');
		expect(q.get('code_challenge_method')).toBe('S256');
		expect(q.get('prompt')).toBe('consent');
	});

	it('never leaks a client secret', () => {
		const url = buildAuthorizeUrl(params);
		expect(url).not.toContain('client_secret');
		expect(url).not.toContain('secret');
	});

	it('honors a custom prompt', () => {
		const url = new URL(buildAuthorizeUrl({ ...params, prompt: 'none' }));
		expect(url.searchParams.get('prompt')).toBe('none');
	});
});

describe('SCOPES', () => {
	it('requests identify and guilds', () => {
		expect(SCOPES).toBe('identify guilds');
	});
});
