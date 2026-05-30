import type { Dict } from '../../types';
export const serverrorsMessages: Dict = {
  'serverrors.discord.denied': 'authorization canceled',
  'serverrors.discord.invalidState': 'your session expired, try again',
  'serverrors.discord.noCode': 'invalid response from Discord',
  'serverrors.discord.token': 'failed to exchange the access token',
  'serverrors.discord.noAccount': 'no account is linked to this Discord',
  'serverrors.discord.notInGuild': "you're not a member of the required server",
  'serverrors.discord.2faRequired': 'confirm the second factor to continue',
  'serverrors.discord.disabled': 'Discord login is disabled',
  'serverrors.discord.retry': 'try again',
  'serverrors.discord.unexpected': 'unexpected error',
  'serverrors.login.usernameRequired': 'username is required',
  'serverrors.login.passwordRequired': 'password is required',
  'serverrors.login.invalidData': 'invalid data',
  'serverrors.login.invalidCredentials': 'invalid credentials',
  'serverrors.invite.notFound': 'invite not found',
  'serverrors.invite.alreadyUsed': 'invite has already been used',
  'serverrors.invite.expired': 'invite expired',
  'serverrors.invite.invalid': 'invalid invite',
  'serverrors.invite.unavailable': 'invite unavailable',
  'serverrors.invite.invalidData': 'invalid',
  'serverrors.invite.userExists': 'username already exists',
  'serverrors.security.discordNotLinked': 'Discord is not linked.',
  'serverrors.security.setPasswordFirst':
    "set a password before unlinking Discord, otherwise you'll have no way to sign in.",
  'serverrors.servers.notFound': 'server not found'
};
