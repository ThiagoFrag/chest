import type { Dict } from '../../types';

export const hostsMessages: Dict = {
  'hosts.head': 'Chest · Hosts',
  'hosts.title': 'HOSTS',
  'hosts.subtitle': 'daemons Docker onde os servidores rodam',
  'hosts.error': 'erro: {message}',

  'hosts.badge.default': 'padrão',
  'hosts.badge.local': 'local',
  'hosts.status.enabled': 'ativo',
  'hosts.status.disabled': 'desativado',
  'hosts.hasTls': 'TLS',

  'hosts.field.endpoint': 'endpoint',
  'hosts.field.hostAddress': 'endereço público',
  'hosts.field.hostAddress.none': 'herda do global',

  'hosts.test.button': 'testar conexão',
  'hosts.test.testing': 'testando...',
  'hosts.test.ok': '✓ conectado · Docker {version}',
  'hosts.test.fail': '✗ {error}',

  'hosts.list.title': 'HOSTS CONFIGURADOS',
  'hosts.list.empty': 'nenhum host adicionado ainda. crie o primeiro abaixo.',

  'hosts.edit': 'editar',
  'hosts.remove': 'remover',
  'hosts.cancel': 'cancelar',
  'hosts.save': 'salvar',
  'hosts.saving': 'salvando...',
  'hosts.confirmRemove': 'Remover host "{name}"? Essa ação não pode ser desfeita.',
  'hosts.localCannotRemove': 'o host local não pode ser removido',

  'hosts.create.title': 'ADICIONAR HOST',
  'hosts.create.button': 'adicionar host',
  'hosts.create.creating': 'adicionando...',
  'hosts.form.name.label': 'nome',
  'hosts.form.name.placeholder': 'home-lab',
  'hosts.form.endpoint.label': 'endpoint',
  'hosts.form.endpoint.placeholder': 'tcp://10.0.0.5:2376',
  'hosts.form.endpoint.help':
    'tcp://host:porta pra daemon remoto ou unix:///var/run/docker.sock pra local',
  'hosts.form.hostAddress.label': 'endereço público (opcional)',
  'hosts.form.hostAddress.placeholder': 'mc.exemplo.com',
  'hosts.form.hostAddress.help':
    'hostname/IP mostrado aos jogadores pra conectar. Vazio = usa o global.',
  'hosts.form.tls.title': 'TLS (opcional)',
  'hosts.form.tls.help':
    'cole os PEMs pra conectar via TLS mútuo num daemon remoto exposto',
  'hosts.form.tlsCa.label': 'CA certificate (ca.pem)',
  'hosts.form.tlsCert.label': 'client certificate (cert.pem)',
  'hosts.form.tlsKey.label': 'client key (key.pem)',
  'hosts.form.tls.placeholder': '-----BEGIN CERTIFICATE-----',
  'hosts.form.tls.keep': 'deixe vazio pra manter o atual',
  'hosts.form.enabled.label': 'host ativo'
};
