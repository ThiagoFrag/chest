import { describe, it, expect } from 'vitest';
import { parseProperties, serializeProperties, mergeProperties } from './files';

describe('parseProperties', () => {
  it('parses simple key=value pairs', () => {
    const out = parseProperties('motd=Hello\nmax-players=20');
    expect(out).toEqual({ motd: 'Hello', 'max-players': '20' });
  });

  it('ignores comments and blank lines', () => {
    const out = parseProperties('# comment\n\nfoo=bar\n#another=skipped');
    expect(out).toEqual({ foo: 'bar' });
  });

  it('trims whitespace around keys and values', () => {
    const out = parseProperties('  key  =  value  ');
    expect(out).toEqual({ key: 'value' });
  });

  it('handles values containing =', () => {
    const out = parseProperties('jvm-args=-Xmx4G -Dfoo=bar');
    expect(out).toEqual({ 'jvm-args': '-Xmx4G -Dfoo=bar' });
  });
});

describe('serializeProperties', () => {
  it('serializes to key=value lines', () => {
    const out = serializeProperties({ a: '1', b: '2' });
    expect(out).toBe('a=1\nb=2\n');
  });
});

describe('mergeProperties', () => {
  it('preserves original comments and order', () => {
    const original = '# header\nmotd=Old\nmax-players=10\n# footer';
    const out = mergeProperties(original, { motd: 'New' });
    expect(out).toBe('# header\nmotd=New\nmax-players=10\n# footer');
  });

  it('appends new keys not present in original', () => {
    const original = 'foo=bar';
    const out = mergeProperties(original, { foo: 'baz', new: 'value' });
    expect(out).toContain('foo=baz');
    expect(out).toContain('new=value');
  });

  it('returns original unchanged when no updates', () => {
    const original = '# top\nfoo=bar\n';
    expect(mergeProperties(original, {})).toBe(original);
  });
});
