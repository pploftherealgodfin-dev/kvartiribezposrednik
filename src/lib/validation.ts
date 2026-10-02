import { QUALITY } from './config';
import type { ListingType } from './types';

export interface DraftPhoto {
  id: string;
  url: string;
  position: number;
  phash: string;
}

/** Черновата, която wizard-ът за обява поддържа с autosave. */
export interface ListingDraft {
  phoneVerified: boolean;
  type: ListingType | null;
  cityId: string | null;
  neighborhoodId: string | null;
  addressPrivate: string;
  areaM2: number | null;
  floor: number | null;
  totalFloors: number | null;
  rooms: number | null;
  priceEur: number | null;
  deposit: number | null;
  furnished: boolean;
  petsAllowed: boolean;
  utilitiesIncluded: boolean;
  minTermMonths: number | null;
  availableFrom: string;
  photos: DraftPhoto[];
  ownerDeclaration: boolean;
  verificationDocumentUrl: string | null;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface WizardStepInfo {
  step: WizardStep;
  title: string;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  { step: 1, title: 'Потвърждение на телефон' },
  { step: 2, title: 'Основно за имота' },
  { step: 3, title: 'Условия на наема' },
  { step: 4, title: 'Снимки' },
  { step: 5, title: 'Декларация за собственик' },
  { step: 6, title: 'Преглед и публикуване' },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const EMPTY_DRAFT: ListingDraft = {
  phoneVerified: false,
  type: null,
  cityId: null,
  neighborhoodId: null,
  addressPrivate: '',
  areaM2: null,
  floor: null,
  totalFloors: null,
  rooms: null,
  priceEur: null,
  deposit: null,
  furnished: false,
  petsAllowed: false,
  utilitiesIncluded: false,
  minTermMonths: null,
  availableFrom: '',
  photos: [],
  ownerDeclaration: false,
  verificationDocumentUrl: null,
};

export function validateStep(step: WizardStep, draft: ListingDraft): ValidationResult {
  const errors: string[] = [];

  switch (step) {
    case 1:
      if (!draft.phoneVerified) errors.push('Потвърди телефона си, за да продължиш.');
      break;

    case 2:
      if (!draft.type) errors.push('Избери тип имот.');
      if (!draft.cityId) errors.push('Избери град.');
      if (!draft.addressPrivate || draft.addressPrivate.trim().length < 3) {
        errors.push('Въведи адрес (той няма да е публичен).');
      }
      if (!draft.areaM2 || draft.areaM2 <= 0) errors.push('Въведи квадратура.');
      if (!draft.rooms || draft.rooms <= 0) errors.push('Въведи брой стаи.');
      if (draft.floor === null || draft.floor < 0) errors.push('Въведи етаж.');
      if (draft.totalFloors === null || draft.totalFloors <= 0) {
        errors.push('Въведи общ брой етажи.');
      }
      break;

    case 3:
      if (!draft.priceEur || draft.priceEur <= 0) errors.push('Въведи месечен наем.');
      if (!draft.minTermMonths || draft.minTermMonths <= 0) {
        errors.push('Въведи минимален срок на наема.');
      }
      if (!draft.availableFrom) errors.push('Избери свободна от дата.');
      break;

    case 4:
      if (draft.photos.length < QUALITY.minPhotos) {
        errors.push(`Добави поне ${QUALITY.minPhotos} снимки.`);
      }
      if (draft.photos.length > QUALITY.maxPhotos) {
        errors.push(`Максимум ${QUALITY.maxPhotos} снимки.`);
      }
      break;

    case 5:
      if (!draft.ownerDeclaration) {
        errors.push('Отбележи декларацията, че си собственик и не си посредник.');
      }
      break;

    case 6:
      break;

    default:
      break;
  }

  return { valid: errors.length === 0, errors };
}

export function validateAllSteps(draft: ListingDraft): Record<WizardStep, ValidationResult> {
  return {
    1: validateStep(1, draft),
    2: validateStep(2, draft),
    3: validateStep(3, draft),
    4: validateStep(4, draft),
    5: validateStep(5, draft),
    6: validateStep(6, draft),
  };
}

export function isDraftPublishable(draft: ListingDraft): boolean {
  return WIZARD_STEPS.every((s) => validateStep(s.step, draft).valid);
}

/** Колко процента от wizard-а е попълнен (за прогрес бара). */
export function draftProgress(draft: ListingDraft): number {
  const steps = WIZARD_STEPS.filter((s) => s.step <= 5);
  const done = steps.filter((s) => validateStep(s.step, draft).valid).length;
  return Math.round((done / steps.length) * 100);
}