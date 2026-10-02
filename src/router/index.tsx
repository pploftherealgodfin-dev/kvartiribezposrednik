import RouteBoundary from '@/components/feature/RouteBoundary';
import PageLoading from '@/components/feature/PageLoading';
import { useRoutes } from "react-router-dom";
import { Suspense, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from 'react-router-dom';
import { applyPageMeta } from '@/lib/seo';
import { getPageMeta } from '@/lib/pageCatalog';
import routes from "./config";

export function AppRoutes() {
  const element = useRoutes(routes);
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const firstRoute = useRef(true);
  useLayoutEffect(() => {
    applyPageMeta(getPageMeta(pathname));
    document.getElementById('ld-prerender')?.remove();
    if (!firstRoute.current && navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' });
    firstRoute.current = false;
  }, [pathname, navigationType]);
  return <RouteBoundary key={pathname}><Suspense fallback={<PageLoading />}>{element}</Suspense></RouteBoundary>;
}
