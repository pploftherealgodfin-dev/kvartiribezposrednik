import ListingImage from '@/components/feature/ListingImage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface PhotoSortItem {
  id: string;
  url: string;
}

interface PhotoSortGridProps {
  items: PhotoSortItem[];
  /** Извиква се с новия ред след влачене или натискане на стрелка. */
  onReorder: (items: PhotoSortItem[]) => void;
  /** Ако е подадено — показва бутон за премахване. */
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

/**
 * Решетка от снимки с пренареждане чрез влачене. Първата снимка е основна,
 * затова влаченето към първа позиция сменя основната снимка.
 * Добавени са и стрелки за преместване, за да работи и без мишка.
 */
export default function PhotoSortGrid({ items, onReorder, onRemove, disabled }: PhotoSortGridProps) {
  const { t } = useTranslation();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (disabled || from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
        return (
          <li
            key={item.id}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => {
              event.preventDefault();
              if (overIndex !== index) setOverIndex(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              endDrag();
            }}
            onDragEnd={endDrag}
            className={[
              'group relative select-none overflow-hidden rounded-md border bg-background-100 transition-colors',
              isOver ? 'border-primary-500 ring-2 ring-primary-200' : 'border-background-200',
              isDragging ? 'opacity-50' : '',
              disabled ? '' : 'cursor-grab active:cursor-grabbing',
            ].join(' ')}
          >
            <ListingImage
              photoId={item.id}
              src={item.url}
              alt=""
              draggable={false}
              width={160} height={100} loading="lazy" decoding="async"
              className="h-20 w-full object-cover object-top"
            />

            {index === 0 && (
              <span className="absolute left-1 top-1 whitespace-nowrap rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-background-50">
                {t('owner.form.mainPhoto')}
              </span>
            )}

            <div className="absolute right-1 top-1 flex items-center gap-1">
              {index !== 0 && !disabled && (
                <button
                  type="button"
                  onClick={() => move(index, 0)}
                  aria-label={t('owner.form.setMain')}
                  title={t('owner.form.setMain')}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-700 transition-colors hover:text-accent-700"
                >
                  <i className="ri-star-line text-xs" aria-hidden="true" />
                </button>
              )}
              {onRemove && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={t('owner.form.removePhoto')}
                  title={t('owner.form.removePhoto')}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-background-50/90 text-foreground-700 transition-colors hover:text-primary-700"
                >
                  <i className="ri-close-line text-xs" aria-hidden="true" />
                </button>
              )}
            </div>

            {!disabled && (
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded bg-background-50/90 text-foreground-700"
                  title={t('owner.form.dragHint')}
                >
                  <i className="ri-drag-move-2-line text-xs" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={t('owner.form.moveLeft')}
                    title={t('owner.form.moveLeft')}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-background-50/90 text-foreground-700 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="ri-arrow-left-s-line text-sm" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={t('owner.form.moveRight')}
                    title={t('owner.form.moveRight')}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-background-50/90 text-foreground-700 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="ri-arrow-right-s-line text-sm" aria-hidden="true" />
                  </button>
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
