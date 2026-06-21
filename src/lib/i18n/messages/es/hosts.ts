import type { Dict } from '../../types';

export const hostsMessages: Dict = {
  'hosts.head': 'Chest · Hosts',
  'hosts.title': 'HOSTS',
  'hosts.subtitle': 'daemons de Docker donde corren los servidores',
  'hosts.error': 'error: {message}',

  'hosts.badge.default': 'predeterminado',
  'hosts.badge.local': 'local',
  'hosts.status.enabled': 'activo',
  'hosts.status.disabled': 'desactivado',
  'hosts.hasTls': 'TLS',

  'hosts.field.endpoint': 'endpoint',
  'hosts.field.hostAddress': 'dirección pública',
  'hosts.field.hostAddress.none': 'hereda del global',

  'hosts.test.button': 'probar conexión',
  'hosts.test.testing': 'probando...',
  'hosts.test.ok': '✓ conectado · Docker {version}',
  'hosts.test.fail': '✗ {error}',

  'hosts.list.title': 'HOSTS CONFIGURADOS',
  'hosts.list.empty': 'aún no hay hosts. crea el primero abajo.',

  'hosts.edit': 'editar',
  'hosts.remove': 'eliminar',
  'hosts.cancel': 'cancelar',
  'hosts.save': 'guardar',
  'hosts.saving': 'guardando...',
  'hosts.confirmRemove': '¿Eliminar host "{name}"? Esto no se puede deshacer.',
  'hosts.localCannotRemove': 'el host local no se puede eliminar',

  'hosts.create.title': 'AÑADIR HOST',
  'hosts.create.button': 'añadir host',
  'hosts.create.creating': 'añadiendo...',
  'hosts.form.name.label': 'nombre',
  'hosts.form.name.placeholder': 'home-lab',
  'hosts.form.endpoint.label': 'endpoint',
  'hosts.form.endpoint.placeholder': 'tcp://10.0.0.5:2376',
  'hosts.form.endpoint.help':
    'tcp://host:puerto para un daemon remoto o unix:///var/run/docker.sock para local',
  'hosts.form.hostAddress.label': 'dirección pública (opcional)',
  'hosts.form.hostAddress.placeholder': 'mc.ejemplo.com',
  'hosts.form.hostAddress.help':
    'hostname/IP que ven los jugadores para conectarse. Vacío = usa el global.',
  'hosts.form.tls.title': 'TLS (opcional)',
  'hosts.form.tls.help':
    'pega los PEM para conectar por TLS mutuo a un daemon remoto expuesto',
  'hosts.form.tlsCa.label': 'certificado CA (ca.pem)',
  'hosts.form.tlsCert.label': 'certificado de cliente (cert.pem)',
  'hosts.form.tlsKey.label': 'clave de cliente (key.pem)',
  'hosts.form.tls.placeholder': '-----BEGIN CERTIFICATE-----',
  'hosts.form.tls.keep': 'déjalo vacío para mantener el actual',
  'hosts.form.enabled.label': 'host activo'
};
