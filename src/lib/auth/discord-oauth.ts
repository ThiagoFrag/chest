const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const USER_URL = 'https://discord.com/api/users/@me';
const GUILDS_URL = 'https://discord.com/api/users/@me/guilds';

const TOKEN_TIMEOUT_MS = 10_000;
const API_TIMEOUT_MS = 8_000;

export const SCOPES = 'identify guilds';

export interface PkcePair {
	verifier: string;
	challenge: string;
}

export interface AuthorizeParams {
	clientId: string;
	redirectUri: string;
	state: string;
	challenge: string;
	prompt?: 'consent' | 'none';
}

export interface ExchangeParams {
	clientId: string;
	clientSecret: string;
	code: string;
	redirectUri: string;
	verifier: string;
}

export interface ExchangeResult {
	accessToken: string;
	tokenType: string;
	scope: string;
}

export interface DiscordUser {
	id: string;
	username: string;
	globalName: string | null;
	avatar: string | null;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBase64Url(byteLength: number): string {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return toBase64Url(bytes);
}

export function generateState(): string {
	return randomBase64Url(32);
}

export async function generatePkce(): Promise<PkcePair> {
	const verifier = randomBase64Url(48).slice(0, 64);
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	const challenge = toBase64Url(new Uint8Array(digest));
	return { verifier, challenge };
}

export function buildAuthorizeUrl({
	clientId,
	redirectUri,
	state,
	challenge,
	prompt = 'consent',
}: AuthorizeParams): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: SCOPES,
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256',
		prompt,
	});
	return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function readErrorBody(res: Response): Promise<string> {
	try {
		const text = await res.text();
		return text.slice(0, 500);
	} catch {
		return '<unreadable body>';
	}
}

export async function exchangeCode({
	clientId,
	clientSecret,
	code,
	redirectUri,
	verifier,
}: ExchangeParams): Promise<ExchangeResult> {
	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		code_verifier: verifier,
	});

	const res = await fetchWithTimeout(
		TOKEN_URL,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				accept: 'application/json',
			},
			body: body.toString(),
		},
		TOKEN_TIMEOUT_MS
	);

	if (!res.ok) {
		const detail = await readErrorBody(res);
		throw new Error(`Discord token exchange failed (${res.status}): ${detail}`);
	}

	const data = (await res.json()) as {
		access_token?: string;
		token_type?: string;
		scope?: string;
	};

	if (!data.access_token) {
		throw new Error('Discord token exchange returned no access_token');
	}

	return {
		accessToken: data.access_token,
		tokenType: data.token_type ?? 'Bearer',
		scope: data.scope ?? '',
	};
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
	const res = await fetchWithTimeout(
		USER_URL,
		{ headers: { authorization: `Bearer ${accessToken}` } },
		API_TIMEOUT_MS
	);

	if (!res.ok) {
		const detail = await readErrorBody(res);
		throw new Error(`Discord user fetch failed (${res.status}): ${detail}`);
	}

	const data = (await res.json()) as {
		id: string;
		username: string;
		global_name?: string | null;
		avatar?: string | null;
	};

	return {
		id: data.id,
		username: data.username,
		globalName: data.global_name ?? null,
		avatar: data.avatar ?? null,
	};
}

export async function fetchUserGuildIds(accessToken: string): Promise<string[]> {
	let res: Response;
	try {
		res = await fetchWithTimeout(
			GUILDS_URL,
			{ headers: { authorization: `Bearer ${accessToken}` } },
			API_TIMEOUT_MS
		);
	} catch (err) {
		console.warn('Discord guilds fetch errored, returning empty list:', err);
		return [];
	}

	if (!res.ok) {
		console.warn(`Discord guilds fetch failed (${res.status}), returning empty list`);
		return [];
	}

	const data = (await res.json()) as Array<{ id: string }>;
	if (!Array.isArray(data)) return [];
	return data.map((guild) => guild.id);
}
