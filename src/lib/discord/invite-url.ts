const REQUIRED_PERMS = '139653328960';

export function buildInviteUrl(applicationId: string): string {
  const params = new URLSearchParams({
    client_id: applicationId,
    scope: 'bot applications.commands',
    permissions: REQUIRED_PERMS
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}
