import { useEffect, useRef, useState } from 'react';
/** Defer data and JS while retaining a stable, server-rendered placeholder. */
export function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (active && entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '240px 0px' });
    observer.observe(ref.current);
    return () => { active = false; observer.disconnect(); };
  }, [near]);
  return { ref, near };
}
