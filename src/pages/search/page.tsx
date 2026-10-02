import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '@/components/feature/SiteLayout';
import { repository } from '@/lib/repository';
import { PAGINATION } from '@/lib/config';
import { SORT_KEYS, type SortKey } from '@/lib/ranking';
import type { ListingFilters } from '@/lib/search';
import { applyPageMeta } from '@/lib/seo';
import type { City, ListingView, Neighborhood, University } from '@/lib/types';
import { FIELD_PARAM, parseFilters, parseValues, validateSearchParams } from '@/lib/searchParams';
import { useAuth } from '@/hooks/useAuth';
import { validateSearchFilters } from '@/lib/searchValidation';
import SearchFilters, { type SearchFilterValues } from './components/SearchFilters';
import SearchResults from './components/SearchResults';

const PAGE_PARAM = 'stranica';
const SORT_PARAM = 'sort';

export default function SearchPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();

  const filters = useMemo(() => parseFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const values = useMemo(() => parseValues(new URLSearchParams(paramsKey)), [paramsKey]);

  const sortRaw = searchParams.get(SORT_PARAM) ?? '';
  const sort: SortKey = (SORT_KEYS as string[]).includes(sortRaw) ? (sortRaw as SortKey) : 'relevance';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(searchParams.get(PAGE_PARAM))) || 1));
  const [resultPage, setResultPage] = useState(page);
  const [draftValues, setDraftValues] = useState(values);
  const [draftIssue, setDraftIssue] = useState('');
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const catalog = { cities, neighborhoods, universities };
  const catalogStatus = !filters.citySlug || catalogReady ? 'ready' : catalogError ? 'error' : 'loading';
  const filterIssue = validateSearchParams(searchParams) || validateSearchFilters(filters, catalogReady ? catalog : undefined);

  const [listings, setListings] = useState<ListingView[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    applyPageMeta({
      title: `${t('search.title')} | ${t('brand.name')}`,
      description: t('search.subtitle'),
      canonicalPath: '/tarsene',
    });
  }, [t]);

  useEffect(() => {
    let active = true;
    setCatalogError(false);
    Promise.all([
      repository.getCities(),
      repository.getNeighborhoods(),
      repository.getUniversities(),
    ])
      .then(([cityItems, hoodItems, uniItems]) => {
        if (!active) return;
        setCities(cityItems);
        setNeighborhoods(hoodItems);
        setUniversities(uniItems); setCatalogReady(true);
      })
      .catch(() => {
        if (active) setCatalogError(true);
      });
    return () => {
      active = false;
    };
  }, [catalogRetry]);

  useEffect(() => {
    if (catalogStatus !== 'ready') { setLoading(catalogStatus === 'loading'); setError(catalogStatus === 'error'); return; }
    if (filterIssue) { setListings([]); setTotal(0); setTotalPages(1); setResultPage(1); setLoading(false); setError(false); return; }
    let active = true;
    setLoading(true);
    setError(false);
    repository
      .search({ filters, sort, page, pageSize: PAGINATION.pageSize })
      .then((result) => {
        if (!active) return;
        setListings(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages); setResultPage(result.page);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, sort, page, reloadKey, filterIssue, catalogStatus, user?.id]);

  const patchParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  useEffect(() => { setDraftValues(values); setDraftIssue(''); }, [values]);
  const handleFieldChange = (field: keyof SearchFilterValues, value: string) => {
    setDraftIssue('');
    setDraftValues(old => field === 'citySlug' ? { ...old, citySlug: value, neighborhoodSlug: '', universitySlug: '' } : { ...old, [field]: value });
  };
  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    Object.entries(FIELD_PARAM).forEach(([field, param]) => {
      const value = draftValues[field as keyof SearchFilterValues].trim();
      if (value && !(field === 'type' && value === 'all')) next.set(param, value); else next.delete(param);
    });
    next.delete(PAGE_PARAM);
    const problem = validateSearchParams(next) || validateSearchFilters(parseFilters(next), catalogReady ? catalog : undefined);
    if (problem) { setDraftIssue(problem); return; }
    setSearchParams(next); setShowMobileFilters(false);
  };

  const activeFilters = Object.entries(values).filter(([field,value]) => value && !(field === 'type' && value === 'all')).map(([field,value]) => {
    const labels: Record<string,string> = {citySlug:'Град',neighborhoodSlug:'Квартал',universitySlug:'Учебна локация',type:'Тип',rooms:'Стаи',priceMin:'Наем от',priceMax:'Наем до',areaMin:'Площ от',areaMax:'Площ до',floorMin:'Етаж от',floorMax:'Етаж до',furnished:'Обзавеждане',pets:'Любимци',availableFrom:'Свободно до',text:'Дума'};
    const names: Record<string,string | undefined> = {
      citySlug:cities.find(item => item.slug === value)?.name,
      neighborhoodSlug:neighborhoods.find(item => item.slug === value && item.cityId === cities.find(city => city.slug === values.citySlug)?.id)?.name,
      universitySlug:universities.find(item => item.slug === value)?.name,
      type:({apartment:'Апартамент',room:'Стая',studio:'Студио',house:'Къща'} as Record<string,string>)[value],
      furnished:value === '1' ? 'Обзаведено' : 'Необзаведено',
      pets:value === '1' ? 'Позволени' : 'Непозволени',
    };
    const suffix = field.startsWith('price') ? ' €' : field.startsWith('area') ? ' m²' : '';
    return {field:field as keyof SearchFilterValues,label:labels[field]+': '+(names[field] ?? value)+suffix};
  });
  const removeFilter = (field: keyof SearchFilterValues) => patchParams(next => {
    next.delete(FIELD_PARAM[field]); next.delete(PAGE_PARAM);
    if (field === 'citySlug') { next.delete(FIELD_PARAM.neighborhoodSlug); next.delete(FIELD_PARAM.universitySlug); }
  });

  const handleReset = useCallback(() => {
    setDraftValues(parseValues(new URLSearchParams())); setDraftIssue('');
    patchParams((next) => {
      Object.values(FIELD_PARAM).forEach((key) => next.delete(key));
      next.delete(PAGE_PARAM);
    });
  }, [patchParams]);

  const handleSortChange = useCallback(
    (nextSort: SortKey) => {
      patchParams((next) => {
        if (nextSort === 'relevance') next.delete(SORT_PARAM);
        else next.set(SORT_PARAM, nextSort);
        next.delete(PAGE_PARAM);
      });
    },
    [patchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchParams((next) => {
        if (nextPage <= 1) next.delete(PAGE_PARAM);
        else next.set(PAGE_PARAM, String(nextPage));
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [patchParams],
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
            {t('search.title')}
          </h1>
          <p className="max-w-2xl text-sm text-foreground-600">{t('search.subtitle')}</p>
        </div>

        {catalogError && <div role="alert" className="mb-5 rounded-md border p-4">Каталогът с градове и райони не се зареди. <button onClick={() => setCatalogRetry(v => v + 1)} className="text-primary-700 underline">Опитай отново</button></div>}
        {(draftIssue || filterIssue) && <p role="alert" className="mb-5 rounded-md border border-accent-300 bg-accent-50 p-4">{draftIssue || filterIssue}</p>}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="min-w-0 lg:self-start">
            <button
              type="button"
              onClick={() => setShowMobileFilters((value) => !value)}
              aria-expanded={showMobileFilters}
              aria-controls="search-filter-panel"
              className="mb-3 flex w-full cursor-pointer items-center justify-between rounded-lg border border-background-300 bg-background-50 px-4 py-3 text-sm font-semibold text-foreground-900 lg:hidden"
            >
              <span className="flex items-center gap-2">
                <i className="ri-filter-3-line text-base" aria-hidden="true" />
                {t('search.filters')}
              </span>
              <i
                className={showMobileFilters ? 'ri-arrow-up-s-line text-lg' : 'ri-arrow-down-s-line text-lg'}
                aria-hidden="true"
              />
            </button>

            <div id="search-filter-panel" className={showMobileFilters ? 'block' : 'hidden lg:block'}>
              <SearchFilters
                cities={cities}
                neighborhoods={neighborhoods}
                universities={universities}
                values={draftValues}
                onChange={handleFieldChange}
                onReset={handleReset}
                onApply={applyFilters}
              />
            </div>
          </aside>

          <div className="min-w-0">
            {activeFilters.length > 0 && <div aria-label="Приложени филтри" className="mb-5 flex flex-wrap gap-2">{activeFilters.map(item => <button type="button" key={item.field} onClick={() => removeFilter(item.field)} aria-label={'Премахни филтъра '+item.label} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-left text-xs text-primary-800"><span className="break-words">{item.label}</span><i aria-hidden="true" className="ri-close-line shrink-0" /></button>)}</div>}
            <SearchResults
              listings={listings}
              total={total}
              page={resultPage}
              totalPages={totalPages}
              sort={sort}
              loading={loading}
              error={error}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onRetry={() => { setReloadKey(key => key + 1); if (catalogError) setCatalogRetry(key => key + 1); }}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}