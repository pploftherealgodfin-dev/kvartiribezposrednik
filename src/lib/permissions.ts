import type { Role } from './types';

export type Action =
  | 'listing.browse'
  | 'contact.view'
  | 'favorite.manage'
  | 'savedSearch.manage'
  | 'report.create'
  | 'message.send'
  | 'listing.create'
  | 'listing.edit'
  | 'listing.deactivate'
  | 'listing.markRented'
  | 'listing.stats.view'
  | 'verification.request'
  | 'verification.review'
  | 'moderation.review'
  | 'user.search'
  | 'user.ban'
  | 'city.manage'
  | 'neighborhood.manage'
  | 'staticPage.manage'
  | 'auditLog.view'
  | 'data.export';

export interface Actor {
  id?: string;
  role: Role;
  phoneVerified?: boolean;
}

export interface ActionContext {
  /** Собственик на ресурса (напр. на обявата). */
  resourceOwnerId?: string;
}

const ROLE_ORDER: Role[] = ['guest', 'tenant', 'owner', 'moderator', 'admin'];

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

/**
 * Единна проверка на правата. Използва се и в UI, и в логиката.
 * За resource-scoped действия собственикът може да пипа само своите неща,
 * освен ако не е модератор/админ.
 */
export function can(actor: Actor, action: Action, ctx: ActionContext = {}): boolean {
  const role = actor.role;

  switch (action) {
    case 'listing.browse':
      return true;

    case 'contact.view':
    case 'favorite.manage':
    case 'savedSearch.manage':
    case 'report.create':
      return roleAtLeast(role, 'tenant');

    case 'message.send':
      return roleAtLeast(role, 'tenant') && actor.phoneVerified === true;

    case 'listing.create':
    case 'listing.edit':
    case 'listing.deactivate':
    case 'listing.markRented':
    case 'listing.stats.view':
    case 'verification.request':
      if (!roleAtLeast(role, 'owner')) return false;
      if (roleAtLeast(role, 'moderator')) return true;
      if (ctx.resourceOwnerId === undefined) return true;
      return actor.id === ctx.resourceOwnerId;

    case 'moderation.review':
    case 'verification.review':
    case 'user.search':
      return roleAtLeast(role, 'moderator');

    case 'user.ban':
    case 'city.manage':
    case 'neighborhood.manage':
    case 'staticPage.manage':
    case 'auditLog.view':
    case 'data.export':
      return role === 'admin';

    default:
      return false;
  }
}