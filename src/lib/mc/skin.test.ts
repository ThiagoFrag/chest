import { describe, it, expect } from 'vitest';
import { resolveHeadSource, resolveDraslSkinUrl } from './skin';

describe('resolveHeadSource', () => {
  it('online + uuid -> mc-heads by uuid', () => {
    const r = resolveHeadSource({ mode: 'mojang', uuid: 'abc-123', name: 'Steve', size: 32 });
    expect(r).toEqual({ kind: 'url', url: 'https://mc-heads.net/avatar/abc-123/32/nohelm' });
  });

  it('online without uuid -> mc-heads by name', () => {
    const r = resolveHeadSource({ mode: 'mojang', name: 'Notch', size: 16 });
    expect(r).toEqual({ kind: 'url', url: 'https://mc-heads.net/avatar/Notch/16/nohelm' });
  });

  it('unspecified mode (backward compat name-only) -> mc-heads by name', () => {
    const r = resolveHeadSource({ name: 'Herobrine', size: 32 });
    expect(r).toEqual({ kind: 'url', url: 'https://mc-heads.net/avatar/Herobrine/32/nohelm' });
  });

  it('drasl -> proxy url with uuid, name and size', () => {
    const r = resolveHeadSource({
      mode: 'drasl',
      uuid: 'aaaa-bbbb',
      name: 'Dave',
      containerName: 'mc-survival',
      size: 64
    });
    expect(r.kind).toBe('proxy');
    if (r.kind !== 'proxy') throw new Error('expected proxy');
    expect(r.url).toContain('/api/servers/mc-survival/players/skin?');
    const q = new URLSearchParams(r.url.split('?')[1]);
    expect(q.get('uuid')).toBe('aaaa-bbbb');
    expect(q.get('name')).toBe('Dave');
    expect(q.get('size')).toBe('64');
  });

  it('drasl without containerName -> steve', () => {
    const r = resolveHeadSource({ mode: 'drasl', name: 'Dave', uuid: 'x' });
    expect(r).toEqual({ kind: 'steve' });
  });

  it('offline -> steve', () => {
    const r = resolveHeadSource({ mode: 'offline', name: 'Anyone', uuid: 'xyz' });
    expect(r).toEqual({ kind: 'steve' });
  });

  it('online without uuid and without name -> steve', () => {
    const r = resolveHeadSource({ mode: 'mojang', name: '' });
    expect(r).toEqual({ kind: 'steve' });
  });

  it('clamps invalid size to default', () => {
    const r = resolveHeadSource({ mode: 'mojang', name: 'Steve', size: -5 });
    expect(r).toEqual({ kind: 'url', url: 'https://mc-heads.net/avatar/Steve/32/nohelm' });
  });

  it('encodes container name in proxy url', () => {
    const r = resolveHeadSource({ mode: 'drasl', name: 'D', containerName: 'mc test', size: 32 });
    if (r.kind !== 'proxy') throw new Error('expected proxy');
    expect(r.url).toContain('/api/servers/mc%20test/players/skin?');
  });
});

describe('resolveDraslSkinUrl', () => {
  function fakeProfileFetch(skinUrl: string): typeof fetch {
    const textures = { textures: { SKIN: { url: skinUrl } } };
    const value = Buffer.from(JSON.stringify(textures), 'utf8').toString('base64');
    return (async () =>
      new Response(JSON.stringify({ properties: [{ name: 'textures', value }] }), {
        status: 200
      })) as unknown as typeof fetch;
  }

  it('resolves SKIN url from yggdrasil profile', async () => {
    const url = await resolveDraslSkinUrl(
      'https://drasl.example.com/',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      fakeProfileFetch('https://drasl.example.com/skin.png')
    );
    expect(url).toBe('https://drasl.example.com/skin.png');
  });

  it('returns null for malformed uuid', async () => {
    const url = await resolveDraslSkinUrl('https://d/', 'not-a-uuid', fakeProfileFetch('x'));
    expect(url).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    const fetchFn = (async () => new Response('', { status: 404 })) as unknown as typeof fetch;
    const url = await resolveDraslSkinUrl(
      'https://d/',
      'aaaaaaaabbbbccccddddeeeeeeeeeeee',
      fetchFn
    );
    expect(url).toBeNull();
  });

  it('returns null when textures property is missing', async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ properties: [] }), { status: 200 })) as unknown as typeof fetch;
    const url = await resolveDraslSkinUrl(
      'https://d/',
      'aaaaaaaabbbbccccddddeeeeeeeeeeee',
      fetchFn
    );
    expect(url).toBeNull();
  });
});
