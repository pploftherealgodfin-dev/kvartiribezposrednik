import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import ListingCard from '@/components/feature/ListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { repository, recordListingView } from '@/lib/repository';
import { createReport } from '@/lib/repository/reports';
import { formatArea, formatEur, pricePerM2 } from '@/lib/format';
import { applyPageMeta } from '@/lib/seo';
import type { ListingView } from '@/lib/types';
import ListingGallery from './components/ListingGallery';

const TYPE_KEY: Record<string, string> = {
  apartment: 'type.apartment',
  room: 'type.room',
  studio: 'type.studio',
  house: 'type.house',
};

export default function ListingDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();

  const [view, setView] = useState<ListingView | null>(null);
  const [neighborhoodListings, setNeighborhoodListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reason, setReason] = useState('broker');
  const [reportState, setReportState] = useState<'idle' | 'open' | 'sending' | 'done'>('idle');
  const viewedRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    repository
      .getListingViewBySlug(slug ?? '')
      .then((result) => {
        if (!active) return;
        if (!result) {
          setNotFound(true);
        } else {
          setView(result);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!view || viewedRef.current) return;
    viewedRef.current = true;
    recordListingView(view.listing.id, user?.id ?? null).catch(() => {
      /* отчитането не бива да чупи страницата */
    });
  }, [view, user?.id]);

  useEffect(() => {
    if (view) {
      applyPageMeta({
        title: `${view.listing.title} | ${t('brand.name')}`,
        description: view.listing.description.slice(0, 150) || undefined,
        canonicalPath: `/obiava/${view.listing.slug}`,
      });
    }
  }, [view, t]);

  useEffect(() => {
    const neighborhoodId = view?.listing.neighborhoodId;
    const listingId = view?.listing.id;
    if (!neighborhoodId || !listingId) {
      setNeighborhoodListings([]);
      return;
    }
    let active = true;
    repository
      .getNeighborhoodListings(neighborhoodId, listingId, 3)
      .then((items) => {
        if (active) setNeighborhoodListings(items);
      })
      .catch(() => {
        if (active) setNeighborhoodListings([]);
      });
    return () => {
      active = false;
    };
  }, [view?.listing.id, view?.listing.neighborhoodId]);

  const handleFavorite = () => {
    if (!view) return;
    if (!user) {
      navigate('/vhod');
      return;
    }
    toggle(view.listing.id);
  };

  const handleReportOpen = () => {
    if (!user) {
      navigate('/vhod');
      return;
    }
    setReportState('open');
  };

  const handleReportSubmit = async () => {
    if (!view || !user) return;
    setReportState('sending');
    try {
      await createReport(view.listing.id, user.id, reason);
      setReportState('done');
    } catch {
      setReportState('open');
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
          <div className="h-72 animate-pulse rounded-lg border border-background-200 bg-background-100" />
        </div>
      </SiteLayout>
    );
  }

  if (notFound || !view) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="font-heading text-2xl font-extrabold text-foreground-950">
            {t('detail.notFound')}
          </h1>
          <Link
            to="/tarsene"
            className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
          >
            <i className="ri-arrow-left-line text-base" aria-hidden="true" />
            {t('detail.back')}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const { listing, city, neighborhood, owner, badges } = view;
  const saved = isFavorite(listing.id);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="relative">
              <ListingGallery
                photos={listing.photos}
                title={listing.title}
                location={`${neighborhood ? `${neighborhood.name}, ` : ''}${city.name}`}
              />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                {badges.verifiedOwner && (
                  <span className="whitespace-nowrap rounded-md bg-primary-800 px-2.5 py-1 text-[11px] font-semibold text-background-50">
                    {t('badges.verifiedOwner')}
                  </span>
                )}
                {badges.isNew && !badges.isRented && (
                  <span className="whitespace-nowrap rounded-md bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-foreground-950">
                    {t('badges.new')}
                  </span>
                )}
              </div>
            </div>

            <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground-600">
              <i className="ri-map-pin-2-line text-base text-foreground-400" aria-hidden="true" />
              {neighborhood ? `${neighborhood.name}, ` : ''}
              {city.name}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-md border border-background-300 px-2.5 py-1 text-xs font-medium text-foreground-700">
                {t(TYPE_KEY[listing.type] ?? 'type.all')}
              </span>
              <span className="whitespace-nowrap rounded-md border border-background-300 px-2.5 py-1 text-xs font-medium text-foreground-700">
                {formatArea(listing.areaM2)}
              </span>
              <span className="whitespace-nowrap rounded-md border border-background-300 px-2.5 py-1 text-xs font-medium text-foreground-700">
                {listing.rooms} {t('card.rooms')}
              </span>
              {listing.floor !== null && (
                <span className="whitespace-nowrap rounded-md border border-background-300 px-2.5 py-1 text-xs font-medium text-foreground-700">
                  {listing.floor} {t('card.floor')}
                </span>
              )}
              <span className="whitespace-nowrap rounded-md border border-background-300 px-2.5 py-1 text-xs font-medium text-foreground-700">
                {listing.furnished ? t('card.furnished') : t('card.notFurnished')}
              </span>
            </div>

            <h2 className="mt-8 font-heading text-lg font-bold text-foreground-950">
              {t('detail.description')}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground-700">
              {listing.description || '—'}
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-background-200 bg-background-50 p-5 md:p-6">
              <p className="font-heading text-3xl font-extrabold text-foreground-950">
                {formatEur(listing.priceEur)}
              </p>
              <p className="text-xs text-foreground-500">
                {pricePerM2(listing.priceEur, listing.areaM2)} € {t('card.perM2')}
              </p>

              <p className="mt-5 text-sm font-semibold text-foreground-900">{owner.name}</p>
              <p className="text-xs text-foreground-500">
                {badges.verifiedOwner ? t('badges.verifiedOwner') : t('badges.unverifiedOwner')}
              </p>

              <button
                type="button"
                onClick={handleFavorite}
                className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
                  saved
                    ? 'bg-primary-600 text-background-50 hover:bg-primary-700'
                    : 'border border-background-300 bg-background-50 text-foreground-900 hover:border-primary-400'
                }`}
              >
                <i className={saved ? 'ri-heart-fill text-base' : 'ri-heart-line text-base'} aria-hidden="true" />
                {saved ? t('detail.saved') : t('detail.favorite')}
              </button>

              {reportState === 'done' ? (
                <p className="mt-3 rounded-md bg-primary-50 px-3.5 py-2.5 text-xs font-medium text-primary-800">
                  {t('report.success')}
                </p>
              ) : reportState === 'idle' ? (
                <button
                  type="button"
                  onClick={handleReportOpen}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-background-300 px-4 py-3 text-sm font-semibold text-foreground-700 transition-colors hover:bg-background-100"
                >
                  <i className="ri-flag-line text-base" aria-hidden="true" />
                  {t('detail.report')}
                </button>
              ) : (
                <div className="mt-3 rounded-md border border-background-200 bg-background-100 p-3.5">
                  <label className="block text-xs font-semibold text-foreground-800" htmlFor="detail-reason">
                    {t('report.reason')}
                  </label>
                  <select
                    id="detail-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-1.5 w-full rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-900 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="broker">{t('report.reasonBroker')}</option>
                    <option value="fake">{t('report.reasonFake')}</option>
                    <option value="rented">{t('report.reasonRented')}</option>
                    <option value="wrong_info">{t('report.reasonWrongInfo')}</option>
                    <option value="other">{t('report.reasonOther')}</option>
                  </select>
                  <button
                    type="button"
                    disabled={reportState === 'sending'}
                    onClick={handleReportSubmit}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:opacity-60"
                  >
                    <i
                      className={reportState === 'sending' ? 'ri-loader-4-line animate-spin text-base' : 'ri-send-plane-line text-base'}
                      aria-hidden="true"
                    />
                    {t('report.submit')}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {neighborhoodListings.length > 0 && (
          <section className="mt-12 border-t border-background-200 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground-950 md:text-2xl">
                  {t('detail.moreInNeighborhood')}
                </h2>
                {neighborhood && (
                  <p className="mt-1.5 text-sm text-foreground-600">
                    {neighborhood.name}, {city.name}
                  </p>
                )}
              </div>
              {neighborhood && (
                <Link
                  to={`/tarsene?grad=${city.slug}&kvartal=${neighborhood.slug}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3.5 py-2 text-xs font-semibold text-foreground-800 transition-colors hover:border-primary-400 hover:text-primary-700"
                >
                  {t('home.viewAll')}
                  <i className="ri-arrow-right-line text-sm" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {neighborhoodListings.map((item) => (
                <ListingCard key={item.listing.id} view={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}