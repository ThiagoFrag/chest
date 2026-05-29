import { describe, it, expect } from 'vitest';
import { buildInviteUrl } from './invite-url';

describe('buildInviteUrl', () => {
  it('builds discord OAuth URL with correct params', () => {
    const url = buildInviteUrl('123456789012345678');
    expect(url).toContain('https://discord.com/oauth2/authorize');
    expect(url).toContain('client_id=123456789012345678');
    expect(url).toContain('scope=bot+applications.commands');
    expect(url).toContain('permissions=');
  });

  it('properly url-encodes scope spaces', () => {
    const url = buildInviteUrl('abc');
    expect(url).not.toContain('scope=bot applications.commands');
  });
});
