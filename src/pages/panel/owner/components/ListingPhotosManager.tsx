import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addListingPhotos, deleteListingPhoto, getListingPhotos, reorderListingPhotos, type ListingPhotoRow } from '@/lib/repository/owner';
import { PHOTO_LIMITS, uploadListingPhotos, validatePhotoFile } from '@/lib/storage';
import PhotoSortGrid, { type PhotoSortItem } from './PhotoSortGrid';

export default function ListingPhotosManager({ listingId, ownerId, onChanged }: { listingId: string; ownerId: string; onChanged?: () => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const generation = useRef(0);
  const loadTicket = useRef(0);
  const [photos, setPhotos] = useState<ListingPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const ticket = ++loadTicket.current;
    const scope = generation.current;
    setLoading(true); setLoadError(false);
    try {
      const rows = await getListingPhotos(listingId);
      if (scope === generation.current && ticket === loadTicket.current) setPhotos(rows);
      return true;
    } catch {
      if (scope === generation.current && ticket === loadTicket.current) setLoadError(true);
      return false;
    } finally {
      if (scope === generation.current && ticket === loadTicket.current) setLoading(false);
    }
  }, [listingId]);
  useEffect(() => {
    const effectGeneration = ++generation.current; setPhotos([]); void load();
    return () => { generation.current = effectGeneration + 1; };
  }, [load]);

  const change = async (action: () => Promise<string | void>) => {
    if (locked.current || loading || loadError) return;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    const scope = generation.current;
    try {
      const message = await action();
      if (scope !== generation.current) return;
      if (message) setNotice(message);
    } catch {
      if (scope === generation.current) setError('Промяната не е потвърдена. Проверяваме текущите снимки; опитай отново след обновяването.');
    } finally {
      if (scope === generation.current) {
        // Read the actual rows after success or a lost response. Never restore stale rows.
        await load();
        if (scope === generation.current) { locked.current = false; setBusy(false); onChanged?.(); }
      }
    }
  };
  const handleReorder = (next: PhotoSortItem[]) => void change(async () => {
    await reorderListingPhotos(listingId, next.map(photo => photo.id));
  });
  const handleRemove = (id: string) => void change(async () => {
    const cleaned = await deleteListingPhoto(id);
    return cleaned ? undefined : 'Снимката е премахната от обявата. Файлът още чака изчистване от хранилището.';
  });
  const handleAdd = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length || locked.current || loading || loadError) return;
    const invalid = files.map(validatePhotoFile).find(Boolean);
    if (invalid) { setError(t(invalid === 'tooLarge' ? 'owner.form.photoTooLarge' : 'owner.form.photoBadType')); return; }
    if (files.length + photos.length > PHOTO_LIMITS.maxCount) { setError('Максимум 15 снимки на обява. Избери по-малко файлове.'); return; }
    void change(async () => {
      const paths = await uploadListingPhotos(files, ownerId, listingId);
      await addListingPhotos(listingId, paths);
    });
  };
  const disabled = busy || loading || loadError;
  return <div aria-busy={busy || loading}>
    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={disabled || photos.length >= PHOTO_LIMITS.maxCount} onClick={() => inputRef.current?.click()} className="ui-secondary text-xs"><i aria-hidden="true" className="ri-image-add-line" />{t('owner.addPhotos')}</button><span className="text-xs text-foreground-500">{photos.length}/{PHOTO_LIMITS.maxCount}</span></div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} className="hidden" onChange={event => handleAdd(event.target.files)} />
    <p className="ui-note mt-2">{t('owner.form.reorderHint')}</p>
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}{notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    {loading ? <p role="status" className="ui-note mt-4">Обновяваме снимките…</p> : loadError ? <div role="alert" className="mt-4"><p>Снимките не се заредиха. Обнови ги, преди да правиш промени.</p><button type="button" onClick={load} className="ui-secondary mt-3">Обнови снимките</button></div> : photos.length ? <div className="mt-4"><PhotoSortGrid items={photos} onReorder={handleReorder} onRemove={handleRemove} disabled={disabled} /></div> : <p className="ui-note mt-4">{t('owner.noPhotos')}</p>}
  </div>;
}
