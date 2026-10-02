import RouteBoundary from '@/components/feature/RouteBoundary';
import PageLoading from '@/components/feature/PageLoading';
import { useRoutes, useNavigate, type NavigateFunction, type NavigateOptions, type To } from "react-router-dom";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from 'react-router-dom';
import { applyPageMeta } from '@/lib/seo';
import { getPageMeta } from '@/lib/pageCatalog';
import routes from "./config";

declare global {
  interface Window {
    REACT_APP_NAVIGATE?: NavigateFunction;
  }
}

let navigateResolver: (navigate: NavigateFunction) => void;
// Keep the resolved handle usable after route changes and StrictMode remounts.
const readyNavigate: NavigateFunction = (to: To | number, options?: NavigateOptions) => {
  const navigate = typeof window === 'undefined' ? undefined : window.REACT_APP_NAVIGATE;
  if (!navigate) throw new Error('Навигацията още не е готова.');
  return typeof to === 'number' ? navigate(to) : navigate(to, options);
};

// Readdy requires this named export from its router entry point.
// eslint-disable-next-line react-refresh/only-export-components
export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const firstRoute = useRef(true);
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(readyNavigate);
    return () => {
      if (window.REACT_APP_NAVIGATE === navigate) delete window.REACT_APP_NAVIGATE;
    };
  }, [navigate]);
  useLayoutEffect(() => {
    applyPageMeta(getPageMeta(pathname));
    document.getElementById('ld-prerender')?.remove();
    if (!firstRoute.current && navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' });
    firstRoute.current = false;
  }, [pathname, navigationType]);
  return <RouteBoundary key={pathname}><Suspense fallback={<PageLoading />}>{element}</Suspense></RouteBoundary>;
}
