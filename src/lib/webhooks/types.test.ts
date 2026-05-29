import { describe, it, expect } from 'vitest';
import { eventMatches } from './types';

describe('eventMatches', () => {
  it('matches wildcard *', () => {
    expect(eventMatches(['*'], 'anything.here')).toBe(true);
  });

  it('matches exact event', () => {
    expect(eventMatches(['server.started'], 'server.started')).toBe(true);
    expect(eventMatches(['server.started'], 'server.stopped')).toBe(false);
  });

  it('matches namespace wildcard server.*', () => {
    expect(eventMatches(['server.*'], 'server.started')).toBe(true);
    expect(eventMatches(['server.*'], 'server.stopped')).toBe(true);
    expect(eventMatches(['server.*'], 'backup.created')).toBe(false);
  });

  it('multiple subscriptions OR-combine', () => {
    const subs = ['server.crashed', 'backup.*'];
    expect(eventMatches(subs, 'server.crashed')).toBe(true);
    expect(eventMatches(subs, 'backup.created')).toBe(true);
    expect(eventMatches(subs, 'auth.login')).toBe(false);
  });

  it('namespace wildcard does not match unrelated events', () => {
    expect(eventMatches(['auth.*'], 'server.started')).toBe(false);
  });
});
