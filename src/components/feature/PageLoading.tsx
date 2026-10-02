import SiteLayout from './SiteLayout';

export default function PageLoading() {
  return <SiteLayout><div role="status" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
    <p className="ui-note">Зареждаме страницата…</p>
    <div aria-hidden="true" className="mt-6 h-48 animate-pulse rounded-xl bg-background-100" />
  </div></SiteLayout>;
}
