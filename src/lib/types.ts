/**
 * Домейн типове. Огледално отговарят на PostgreSQL схемата
 * (виж project_plan.md), но с camelCase за удобство в кода.
 */

export type Role = 'guest' | 'tenant' | 'owner' | 'moderator' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned';

export type ListingType = 'apartment' | 'room' | 'studio' | 'house';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'rented'
  | 'expired'
  | 'deactivated'
  | 'rejected'
  | 'flagged'
  | 'removed';

export type VerificationType = 'phone' | 'ownership_document' | 'utility_bill';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ReportReason = 'broker' | 'fake' | 'wrong_price' | 'already_rented' | 'other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type BanType = 'phone' | 'device' | 'ip' | 'email';

export type AlertFrequency = 'instant' | 'daily' | 'off';

export interface City {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Neighborhood {
  id: string;
  cityId: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export interface University {
  id: string;
  cityId: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  role: Role;
  phone: string | null;
  phoneVerified: boolean;
  email: string | null;
  name: string;
  trustScore: number;
  status: UserStatus;
  ownerVerified: boolean;
  createdAt: string;
}

/** Публично достъпна част от профила (без телефон/имейл). */
export interface PublicUser {
  id: string;
  name: string;
  memberSince: string;
  verifiedOwner: boolean;
}

export interface ListingPhoto {
  id: string;
  listingId: string;
  url: string;
  position: number;
  phash: string;
}

export interface Listing {
  id: string;
  slug: string;
  ownerId: string;
  type: ListingType;
  status: ListingStatus;
  title: string;
  description: string;
  priceEur: number;
  deposit: number | null;
  areaM2: number;
  rooms: number;
  floor: number | null;
  totalFloors: number | null;
  furnished: boolean;
  petsAllowed: boolean;
  utilitiesIncluded: boolean;
  availableFrom: string;
  minTermMonths: number;
  cityId: string;
  neighborhoodId: string | null;
  addressPrivate: string;
  ownershipVerifiedAt?: string | null;
  verificationExpiresAt?: string | null;
  verificationMethod?: string | null;
  latApprox: number;
  lngApprox: number;
  createdAt: string;
  expiresAt: string | null;
  rentedAt: string | null;
  photos: ListingPhoto[];
}

export interface ListingBadges {
  verifiedOwner: boolean;
  isNew: boolean;
  isRented: boolean;
}

/** Обява с разрешени връзки — това, което UI-ът показва. */
export interface ListingView {
  listing: Listing;
  city: City;
  neighborhood: Neighborhood | null;
  owner: PublicUser;
  badges: ListingBadges;
}

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: ReportReason;
  status: ReportStatus;
  resolvedBy: string | null;
  createdAt: string;
}

export interface Verification {
  id: string;
  userId: string;
  type: VerificationType;
  documentUrl: string;
  status: VerificationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  filtersJson: string;
  alertFrequency: AlertFrequency;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  tenantId: string;
  ownerId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface PhoneReveal {
  id: string;
  listingId: string;
  viewerId: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface Ban {
  id: string;
  type: BanType;
  value: string;
  reason: string;
  createdAt: string;
}