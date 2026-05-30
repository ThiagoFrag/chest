import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['admin', 'operator', 'viewer'] })
    .notNull()
    .default('admin'),
  totpSecret: text('totp_secret'),
  totpEnabledAt: integer('totp_enabled_at', { mode: 'timestamp' }),
  backupCodesJson: text('backup_codes_json'),
  discordId: text('discord_id').unique(),
  discordUsername: text('discord_username'),
  discordAvatar: text('discord_avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' })
});

export const invites = sqliteTable('invites', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  role: text('role', { enum: ['admin', 'operator', 'viewer'] })
    .notNull()
    .default('viewer'),
  note: text('note'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  usedBy: text('used_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type Invite = typeof invites.$inferSelect;

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  passed2fa: integer('passed_2fa', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const servers = sqliteTable('servers', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  containerName: text('container_name').notNull().unique(),
  displayName: text('display_name').notNull(),
  modloaderType: text('modloader_type', {
    enum: ['VANILLA', 'PAPER', 'FABRIC', 'FORGE', 'NEOFORGE', 'PURPUR', 'SPIGOT', 'QUILT']
  })
    .notNull()
    .default('VANILLA'),
  mcVersion: text('mc_version').notNull(),
  loaderVersion: text('loader_version'),
  memoryMb: integer('memory_mb').notNull().default(4096),
  maxPlayers: integer('max_players').notNull().default(10),
  difficulty: text('difficulty', {
    enum: ['peaceful', 'easy', 'normal', 'hard']
  })
    .notNull()
    .default('normal'),
  motd: text('motd'),
  hostPortHttp: integer('host_port_http').notNull(),
  hostPortRcon: integer('host_port_rcon').notNull(),
  hostPortMap: integer('host_port_map'),
  mapInstalled: integer('map_installed', { mode: 'boolean' }).notNull().default(false),
  mapType: text('map_type', { enum: ['bluemap', 'dynmap', 'squaremap', 'pl3xmap'] }),
  dataVolume: text('data_volume').notNull(),
  rconPasswordEncrypted: text('rcon_password_encrypted').notNull(),
  draslEnabled: integer('drasl_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  status: text('status', {
    enum: ['creating', 'running', 'stopped', 'failed', 'deleting']
  })
    .notNull()
    .default('creating'),
  statusMessage: text('status_message'),
  discordChannelId: text('discord_channel_id'),
  publicUrl: text('public_url'),
  publicMode: text('public_mode', { enum: ['local', 'domain', 'playit'] }),
  cfDnsRecordId: text('cf_dns_record_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const playerEvents = sqliteTable('player_events', {
  id: text('id').primaryKey(),
  serverId: text('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  event: text('event', {
    enum: ['join', 'leave', 'kick', 'ban', 'unban', 'op', 'deop']
  }).notNull(),
  reason: text('reason'),
  performedBy: text('performed_by'),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const metricSnapshots = sqliteTable('metric_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serverId: text('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  tps: real('tps'),
  mspt: real('mspt'),
  cpuPercent: real('cpu_percent'),
  ramUsedMb: integer('ram_used_mb'),
  playersOnline: integer('players_online')
});

export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  serverId: text('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

export const scheduledTasks = sqliteTable('scheduled_tasks', {
  id: text('id').primaryKey(),
  serverId: text('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  taskType: text('task_type', { enum: ['backup', 'restart', 'command'] }).notNull(),
  cronExpr: text('cron_expr').notNull(),
  params: text('params').notNull().default('{}'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  lastRunStatus: text('last_run_status'),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type NewScheduledTask = typeof scheduledTasks.$inferInsert;

export const serverUsers = sqliteTable('server_users', {
  id: text('id').primaryKey(),
  serverId: text('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permissions: text('permissions').notNull().default('[]'),
  addedBy: text('added_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type ServerUser = typeof serverUsers.$inferSelect;
export type NewServerUser = typeof serverUsers.$inferInsert;

export const webhookEndpoints = sqliteTable('webhook_endpoints', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  eventsJson: text('events_json').notNull().default('["*"]'),
  serverId: text('server_id').references(() => servers.id, { onDelete: 'cascade' }),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  lastDeliveryAt: integer('last_delivery_at', { mode: 'timestamp' }),
  lastDeliveryStatus: text('last_delivery_status', { enum: ['ok', 'fail'] }),
  lastDeliveryMessage: text('last_delivery_message'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0)
});

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

export const auditEvents = sqliteTable('audit_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  userId: text('user_id'),
  username: text('username'),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: text('details'),
  status: text('status', { enum: ['ok', 'fail'] })
    .notNull()
    .default('ok')
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
