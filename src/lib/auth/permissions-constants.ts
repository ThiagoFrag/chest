export const SERVER_PERMISSIONS = [
  'control',
  'console',
  'edit_config',
  'edit_world',
  'manage_backups',
  'manage_files',
  'manage_players',
  'manage_scheduled',
  'manage_discord',
  'view_logs',
  'delete'
] as const;

export type ServerPermission = (typeof SERVER_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<ServerPermission, string> = {
  control: 'iniciar / parar / reiniciar',
  console: 'enviar comandos RCON pelo console',
  edit_config: 'editar server.properties',
  edit_world: 'resetar/trocar seed do mundo',
  manage_backups: 'criar/restaurar/baixar backups',
  manage_files: 'browser de arquivos',
  manage_players: 'whitelist / ops / bans',
  manage_scheduled: 'tarefas agendadas',
  manage_discord: 'configurar bridge Discord',
  view_logs: 'ver logs em tempo real',
  delete: 'deletar este server'
};

export const ROLE_DEFAULTS: Record<'admin' | 'operator' | 'viewer', ServerPermission[]> = {
  admin: [...SERVER_PERMISSIONS],
  operator: [
    'control',
    'console',
    'edit_config',
    'manage_backups',
    'manage_files',
    'manage_players',
    'manage_scheduled',
    'manage_discord',
    'view_logs'
  ],
  viewer: ['view_logs']
};

export function parsePermissions(json: string | null | undefined): ServerPermission[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter((p): p is ServerPermission =>
      SERVER_PERMISSIONS.includes(p as ServerPermission)
    );
  } catch {
    return [];
  }
}

export function serializePermissions(perms: ServerPermission[]): string {
  const unique = Array.from(new Set(perms)).filter((p) =>
    SERVER_PERMISSIONS.includes(p)
  );
  return JSON.stringify(unique);
}
