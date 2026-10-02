import { createSupabaseRepository } from './supabaseRepository';

/**
 * Единствената инстанция на repository-то, която приложението използва.
 * Страниците никога не говорят директно с базата, само с този интерфейс.
 */
export const repository = createSupabaseRepository();

export type { Repository, SearchParams } from './types';
export * as favoritesRepo from './favorites';
export * as ownerRepo from './owner';
export * as reportsRepo from './reports';
export * as adminRepo from './admin';
export * from './views';