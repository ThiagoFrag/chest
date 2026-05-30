import type { Dict } from '../../types';

export const hostsMessages: Dict = {
  'hosts.head': 'Chest · Hosts',
  'hosts.title': 'HOSTS',
  'hosts.subtitle': 'Docker daemons where servers run',
  'hosts.error': 'error: {message}',

  'hosts.badge.default': 'default',
  'hosts.badge.local': 'local',
  'hosts.status.enabled': 'enabled',
  'hosts.status.disabled': 'disabled',
  'hosts.hasTls': 'TLS',

  'hosts.field.endpoint': 'endpoint',
  'hosts.field.hostAddress': 'public address',
  'hosts.field.hostAddress.none': 'inherits global',

  'hosts.test.button': 'test connection',
  'hosts.test.testing': 'testing...',
  'hosts.test.ok': '✓ connected · Docker {version}',
  'hosts.test.fail': '✗ {error}',

  'hosts.list.title': 'CONFIGURED HOSTS',
  'hosts.list.empty': 'no hosts added yet. create the first one below.',

  'hosts.edit': 'edit',
  'hosts.remove': 'remove',
  'hosts.cancel': 'cancel',
  'hosts.save': 'save',
  'hosts.saving': 'saving...',
  'hosts.confirmRemove': 'Remove host "{name}"? This cannot be undone.',
  'hosts.localCannotRemove': 'the local host cannot be removed',

  'hosts.create.title': 'ADD HOST',
  'hosts.create.button': 'add host',
  'hosts.create.creating': 'adding...',
  'hosts.form.name.label': 'name',
  'hosts.form.name.placeholder': 'home-lab',
  'hosts.form.endpoint.label': 'endpoint',
  'hosts.form.endpoint.placeholder': 'tcp://10.0.0.5:2376',
  'hosts.form.endpoint.help': 'tcp://host:port for a remote daemon or unix:///var/run/docker.sock for local',
  'hosts.form.hostAddress.label': 'public address (optional)',
  'hosts.form.hostAddress.placeholder': 'mc.example.com',
  'hosts.form.hostAddress.help': 'hostname/IP shown to players to connect. Empty = uses the global one.',
  'hosts.form.tls.title': 'TLS (optional)',
  'hosts.form.tls.help': 'paste the PEMs to connect over mutual TLS to an exposed remote daemon',
  'hosts.form.tlsCa.label': 'CA certificate (ca.pem)',
  'hosts.form.tlsCert.label': 'client certificate (cert.pem)',
  'hosts.form.tlsKey.label': 'client key (key.pem)',
  'hosts.form.tls.placeholder': '-----BEGIN CERTIFICATE-----',
  'hosts.form.tls.keep': 'leave empty to keep the current one',
  'hosts.form.enabled.label': 'host enabled'
};
