import { error } from '@sveltejs/kit';
import type { User } from '$lib/db/schema';

export type Role = 'admin' | 'operator' | 'viewer';

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  operator: 2,
  admin: 3
};

export function hasRole(user: User | null, minimum: Role): boolean {
  if (!user) return false;
  const userRank = ROLE_RANK[(user.role as Role) ?? 'viewer'];
  return userRank >= ROLE_RANK[minimum];
}

export function requireRole(user: User | null, minimum: Role): User {
  if (!user) throw error(401, 'não autenticado');
  if (!hasRole(user, minimum)) {
    throw error(403, `requer role ${minimum} (você é ${user.role})`);
  }
  return user;
}

export function canEditServer(user: User | null): boolean {
  return hasRole(user, 'operator');
}

export function canCreateServer(user: User | null): boolean {
  return hasRole(user, 'admin');
}

export function canDeleteServer(user: User | null): boolean {
  return hasRole(user, 'admin');
}

export function canManageUsers(user: User | null): boolean {
  return hasRole(user, 'admin');
}

export function canChangeSettings(user: User | null): boolean {
  return hasRole(user, 'admin');
}
