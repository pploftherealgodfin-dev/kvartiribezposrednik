import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { refreshListingPhoto } from '@/lib/storage';

/** Private storage URLs expire. One automatic refresh, then an explicit retry. */
export default function ListingImage({ photoId, retryable = false, src = '', alt = '', className, ...props }: ImgHTMLAttributes<HTMLImageElement> & { photoId: string; retryable?: boolean }) {
  const [state, setState] = useState({ source: src, url: src, failed: false });
  const generation = useRef(0);
  const locked = useRef(false);
  const attempted = useRef(false);
  useEffect(() => {
    const scope = ++generation.current;
    attempted.current = false; locked.current = false;
    return () => { generation.current = scope + 1; };
  }, [src, photoId]);
  const current = state.source === src ? state : { source: src, url: src, failed: false };
  const refresh = async () => {
    if (locked.current) return;
    if (attempted.current || src.startsWith('blob:')) { setState({ source: src, url: '', failed: true }); return; }
    attempted.current = true; locked.current = true;
    const scope = generation.current;
    try {
      const url = await refreshListingPhoto(photoId);
      if (scope === generation.current) setState({ source: src, url, failed: url === current.url });
    } catch {
      if (scope === generation.current) setState({ source: src, url: '', failed: true });
    } finally { if (scope === generation.current) locked.current = false; }
  };
  if (!current.url || current.failed) return <span className={`flex flex-col items-center justify-center gap-2 bg-background-100 text-center text-xs text-foreground-600 ${className ?? ''}`}><span>{alt || 'Снимка'} · временно недостъпна</span>{retryable && <button type="button" className="min-h-11 text-primary-700 underline" onClick={() => { attempted.current = false; void refresh(); }}>Опитай отново</button>}</span>;
  return <img {...props} src={current.url} alt={alt} className={className} onError={() => void refresh()} />;
}
