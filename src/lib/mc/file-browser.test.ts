import { describe, it, expect } from 'vitest';
import { isSafePath, isTextFile } from './file-browser';

describe('isSafePath', () => {
  it('accepts paths under /data', () => {
    expect(isSafePath('/data')).toBe(true);
    expect(isSafePath('/data/world')).toBe(true);
    expect(isSafePath('/data/config/sodium.json')).toBe(true);
  });

  it('rejects paths outside /data', () => {
    expect(isSafePath('/etc/passwd')).toBe(false);
    expect(isSafePath('/root/.ssh')).toBe(false);
    expect(isSafePath('/')).toBe(false);
  });

  it('rejects path traversal attempts', () => {
    expect(isSafePath('/data/../etc/passwd')).toBe(false);
    expect(isSafePath('/data/..')).toBe(false);
  });

  it('rejects null bytes', () => {
    expect(isSafePath('/data/world\0/secret')).toBe(false);
  });
});

describe('isTextFile', () => {
  it('accepts known text extensions', () => {
    expect(isTextFile('/data/server.properties')).toBe(true);
    expect(isTextFile('/data/config/foo.yml')).toBe(true);
    expect(isTextFile('/data/notes.md')).toBe(true);
    expect(isTextFile('/data/script.sh')).toBe(true);
  });

  it('accepts known text filenames', () => {
    expect(isTextFile('/data/whitelist.json')).toBe(true);
    expect(isTextFile('/data/ops.json')).toBe(true);
    expect(isTextFile('/data/eula.txt')).toBe(true);
  });

  it('rejects binary extensions', () => {
    expect(isTextFile('/data/server.jar')).toBe(false);
    expect(isTextFile('/data/world/level.dat')).toBe(false);
    expect(isTextFile('/data/icon.png')).toBe(false);
  });

  it('rejects files without extension and unknown names', () => {
    expect(isTextFile('/data/randomfile')).toBe(false);
  });
});
