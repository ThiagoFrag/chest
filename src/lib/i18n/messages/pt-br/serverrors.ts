import type { Dict } from '../../types';
export const serverrorsMessages: Dict = {
  'serverrors.discord.denied': 'autorização cancelada',
  'serverrors.discord.invalidState': 'sessão expirou, tente de novo',
  'serverrors.discord.noCode': 'resposta inválida do Discord',
  'serverrors.discord.token': 'falha ao trocar o token de acesso',
  'serverrors.discord.noAccount': 'nenhuma conta vinculada a esse Discord',
  'serverrors.discord.notInGuild': 'você não faz parte do servidor exigido',
  'serverrors.discord.2faRequired': 'confirme o segundo fator pra continuar',
  'serverrors.discord.disabled': 'login com Discord está desativado',
  'serverrors.discord.retry': 'tente novamente',
  'serverrors.discord.unexpected': 'erro inesperado',
  'serverrors.login.usernameRequired': 'usuário obrigatório',
  'serverrors.login.passwordRequired': 'senha obrigatória',
  'serverrors.login.invalidData': 'dados inválidos',
  'serverrors.login.invalidCredentials': 'credenciais inválidas',
  'serverrors.invite.notFound': 'convite não encontrado',
  'serverrors.invite.alreadyUsed': 'convite já foi usado',
  'serverrors.invite.expired': 'convite expirado',
  'serverrors.invite.invalid': 'convite inválido',
  'serverrors.invite.unavailable': 'convite indisponível',
  'serverrors.invite.invalidData': 'inválido',
  'serverrors.invite.userExists': 'usuário já existe',
  'serverrors.security.discordNotLinked': 'Discord não está vinculado.',
  'serverrors.security.setPasswordFirst':
    'defina uma senha antes de desvincular o Discord, senão você ficará sem como entrar.',
  'serverrors.servers.notFound': 'server não encontrado'
};
