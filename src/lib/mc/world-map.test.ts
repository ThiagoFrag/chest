import { describe, it, expect } from 'vitest';
import {
  loaderSupportsBlueMap,
  pickBlueMapVariant,
  classifyMapFile,
  formatMapHost
} from './world-map-types';

describe('loaderSupportsBlueMap', () => {
  it('returns true for supported loaders', () => {
    expect(loaderSupportsBlueMap('PAPER')).toBe(true);
    expect(loaderSupportsBlueMap('PURPUR')).toBe(true);
    expect(loaderSupportsBlueMap('SPIGOT')).toBe(true);
    expect(loaderSupportsBlueMap('FABRIC')).toBe(true);
    expect(loaderSupportsBlueMap('FORGE')).toBe(true);
    expect(loaderSupportsBlueMap('NEOFORGE')).toBe(true);
    expect(loaderSupportsBlueMap('QUILT')).toBe(true);
  });

  it('returns false for vanilla', () => {
    expect(loaderSupportsBlueMap('VANILLA')).toBe(false);
  });
});

describe('pickBlueMapVariant', () => {
  it('Paper/Purpur/Spigot install in plugins dir', () => {
    expect(pickBlueMapVariant('PAPER')?.installDir).toBe('plugins');
    expect(pickBlueMapVariant('PURPUR')?.installDir).toBe('plugins');
    expect(pickBlueMapVariant('SPIGOT')?.installDir).toBe('plugins');
  });

  it('Fabric/Forge install in mods dir', () => {
    expect(pickBlueMapVariant('FABRIC')?.installDir).toBe('mods');
    expect(pickBlueMapVariant('FORGE')?.installDir).toBe('mods');
    expect(pickBlueMapVariant('NEOFORGE')?.installDir).toBe('mods');
    expect(pickBlueMapVariant('QUILT')?.installDir).toBe('mods');
  });

  it('Modrinth loader keys match expected', () => {
    expect(pickBlueMapVariant('PAPER')?.loaderKey).toBe('paper');
    expect(pickBlueMapVariant('FABRIC')?.loaderKey).toBe('fabric');
    expect(pickBlueMapVariant('FORGE')?.loaderKey).toBe('forge');
    expect(pickBlueMapVariant('NEOFORGE')?.loaderKey).toBe('neoforge');
    expect(pickBlueMapVariant('QUILT')?.loaderKey).toBe('quilt');
  });
});

describe('classifyMapFile', () => {
  it('identifies BlueMap', () => {
    expect(classifyMapFile('bluemap-paper-3.20.jar')).toBe('bluemap');
    expect(classifyMapFile('BlueMap-fabric.jar')).toBe('bluemap');
  });

  it('identifies others case-insensitive', () => {
    expect(classifyMapFile('Dynmap-3.7.jar')).toBe('dynmap');
    expect(classifyMapFile('squaremap-paper-1.21.jar')).toBe('squaremap');
    expect(classifyMapFile('Pl3xMap-1.20.jar')).toBe('pl3xmap');
  });

  it('returns null for unrelated files', () => {
    expect(classifyMapFile('vanilla.jar')).toBeNull();
    expect(classifyMapFile('worldedit.jar')).toBeNull();
  });
});

describe('formatMapHost', () => {
  it('wraps bare IPv6 in brackets', () => {
    expect(formatMapHost('2001:db8::200')).toBe('[2001:db8::200]');
  });

  it('leaves already-bracketed IPv6 alone', () => {
    expect(formatMapHost('[2001:db8::200]')).toBe('[2001:db8::200]');
  });

  it('leaves hostname/IPv4 alone', () => {
    expect(formatMapHost('mc.example.com')).toBe('mc.example.com');
    expect(formatMapHost('192.168.1.50')).toBe('192.168.1.50');
  });

  it('returns null when input is null', () => {
    expect(formatMapHost(null)).toBeNull();
  });
});
