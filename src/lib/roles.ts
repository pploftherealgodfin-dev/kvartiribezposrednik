import type { Role } from './types';

/** Ролята, която потребителят избира преди вход (наемодател или наемател). */
export type RegisterRole = 'owner' | 'tenant';

const PENDING_ROLE_KEY = 'kb_register_role';

export function setPendingRole(role: RegisterRole): void {
  try {
    window.localStorage.setItem(PENDING_ROLE_KEY, role);
  } catch {
    /* localStorage може да е недостъпен — не е критично */
  }
}

export function readPendingRole(): RegisterRole | null {
  try {
    const value = window.localStorage.getItem(PENDING_ROLE_KEY);
    return value === 'owner' || value === 'tenant' ? value : null;
  } catch {
    return null;
  }
}

export function clearPendingRole(): void {
  try {
    window.localStorage.removeItem(PENDING_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

/** Къде води всеки тип акаунт след вход. */
export function dashboardPath(role: Role | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/panel/naemodatel';
    case 'tenant':
      return '/panel/naematel';
    default:
      return '/vhod';
  }
}

export function isOwnerRole(role: Role | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function isTenantRole(role: Role | null | undefined): boolean {
  return role === 'tenant';
}