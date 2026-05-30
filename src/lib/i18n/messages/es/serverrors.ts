import type { Dict } from '../../types';
export const serverrorsMessages: Dict = {
  'serverrors.discord.denied': 'autorización cancelada',
  'serverrors.discord.invalidState': 'tu sesión expiró, inténtalo de nuevo',
  'serverrors.discord.noCode': 'respuesta inválida de Discord',
  'serverrors.discord.token': 'no se pudo intercambiar el token de acceso',
  'serverrors.discord.noAccount': 'no hay ninguna cuenta vinculada a este Discord',
  'serverrors.discord.notInGuild': 'no formas parte del servidor requerido',
  'serverrors.discord.2faRequired': 'confirma el segundo factor para continuar',
  'serverrors.discord.disabled': 'el inicio de sesión con Discord está desactivado',
  'serverrors.discord.retry': 'inténtalo de nuevo',
  'serverrors.discord.unexpected': 'error inesperado',
  'serverrors.login.usernameRequired': 'usuario obligatorio',
  'serverrors.login.passwordRequired': 'contraseña obligatoria',
  'serverrors.login.invalidData': 'datos inválidos',
  'serverrors.login.invalidCredentials': 'credenciales inválidas',
  'serverrors.invite.notFound': 'invitación no encontrada',
  'serverrors.invite.alreadyUsed': 'la invitación ya fue usada',
  'serverrors.invite.expired': 'invitación expirada',
  'serverrors.invite.invalid': 'invitación inválida',
  'serverrors.invite.unavailable': 'invitación no disponible',
  'serverrors.invite.invalidData': 'inválido',
  'serverrors.invite.userExists': 'el usuario ya existe',
  'serverrors.security.discordNotLinked': 'Discord no está vinculado.',
  'serverrors.security.setPasswordFirst':
    'define una contraseña antes de desvincular Discord, de lo contrario te quedarás sin forma de entrar.',
  'serverrors.servers.notFound': 'servidor no encontrado'
};
