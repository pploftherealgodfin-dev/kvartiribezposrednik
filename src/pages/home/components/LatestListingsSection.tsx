import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useNearViewport } from '@/hooks/useNearViewport';
const LatestListingsData = lazy(() => import('./LatestListingsData'));
function Placeholder() {
  return <section className="mx-auto max-w-6xl px-4 py-14 md:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-2xl font-semibold md:text-3xl">Последни обяви</h2><Link className="ui-secondary" to="/tarsene">Виж всички</Link></div><p className="mt-2 text-sm text-foreground-600">Провери статуса на обявителя, условията и имота преди да платиш.</p><p role="status" className="mt-6 flex min-h-24 items-center justify-center rounded-lg border border-background-200 bg-background-100 text-sm text-foreground-600">Подготвяме последните обяви…</p></section>;
}
export default function LatestListingsSection() {
  const { ref, near } = useNearViewport();
  return <div ref={ref}>{near ? <Suspense fallback={<Placeholder />}><LatestListingsData /></Suspense> : <Placeholder />}</div>;
}
