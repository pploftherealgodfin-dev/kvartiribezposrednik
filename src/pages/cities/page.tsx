import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { applyPageMeta, absoluteUrl, breadcrumbJsonLd, removeJsonLd, setJsonLd } from '@/lib/seo';
import { getPageMeta } from '@/lib/pageCatalog';
import { nationalCities } from '@/lib/locationCatalog';
import CityDirectory from '@/pages/cities/components/CityDirectory';
import CityGuides from '@/pages/cities/components/CityGuides';
const HERO_IMAGE = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Varna_Panorama.jpg/1920px-Varna_Panorama.jpg';
const HERO_CREDIT = 'Снимка: Sborisova, Wikimedia Commons';
const priorities = nationalCities.filter(city => city.isUniversityCity).sort((a, b) => a.name.localeCompare(b.name, 'bg'));
export default function CitiesHubPage() {
  useEffect(() => {
    applyPageMeta(getPageMeta('/kvartiri-bez-posrednik'));
    setJsonLd('ld-hub', [breadcrumbJsonLd([{ name: 'Начало', path: '/' }, { name: 'Градове', path: '/kvartiri-bez-posrednik' }]), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Жилища под наем по градове', url: absoluteUrl('/kvartiri-bez-posrednik'), inLanguage: 'bg-BG' }]);
    return () => removeJsonLd('ld-hub');
  }, []);
  return <SiteLayout>
    <section className="border-b border-background-200 bg-background-100"><div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
      <div><nav aria-label="Път до страницата" className="flex items-center gap-2 text-xs text-foreground-600"><Link to="/">Начало</Link><span aria-hidden="true">/</span><span aria-current="page">Градове</span></nav><p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary-700">257 града · 28 области</p><h1 className="mt-4 text-balance font-heading text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">Твоят град.<br />Твоето следващо жилище.</h1><p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground-600 md:text-base">Местни справочници за директен наем в България. Избери град, виж включените райони и учебни локации и сравни условията на наличните обяви.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="#vsichki-gradove" className="ui-button"><i className="ri-map-pin-line" aria-hidden="true" />Избери град</Link><Link to="/tarsene" className="ui-secondary">Всички обяви</Link></div><p className="ui-note mt-4">Разглеждаш без вход. Контакт, любими и публикуване след вход.</p></div>
      <figure><img src={HERO_IMAGE} alt="Панорама на Варна" width="960" height="720" className="aspect-[4/3] w-full rounded-2xl object-cover" fetchPriority="high" decoding="async" /><figcaption className="mt-2 text-[10px] leading-relaxed text-foreground-600">{HERO_CREDIT}</figcaption></figure>
    </div></section>
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:space-y-16 md:px-6 md:py-14">
      <section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-heading text-2xl font-semibold">Градове с университети и филиали</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-600">{priorities.length} града с учебни локации в проверения каталог. На градската страница можеш да избереш учебно заведение и да провериш неговия официален източник.</p></div><Link to="/saveti/kvartira-za-studenti" className="inline-flex min-h-11 items-center text-sm font-medium text-primary-700">Съвети за студенти</Link></div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{priorities.map(city => <li key={city.slug}><Link to={`/kvartiri-bez-posrednik/${city.slug}`} className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-background-200 bg-background-50 px-4 py-3 transition-colors hover:border-primary-300 hover:bg-primary-50"><div><p className="text-sm font-semibold group-hover:text-primary-700">{city.name}</p><p className="ui-note mt-1">Област {city.region}</p></div><i className="ri-arrow-right-line text-foreground-500" aria-hidden="true" /></Link></li>)}</ul>
      </section>
      <CityDirectory cities={nationalCities} title="Всички градове, подредени по области" subtitle="Отвори област или търси по име. Градове с едно и също име са отделени според областта." />
      <section className="grid gap-5 rounded-2xl border border-background-200 bg-background-100 p-5 md:p-7 lg:grid-cols-3">{[{ title: '1. Избери място', text: 'Започни с град. Районът и университетът са допълнителни филтри, които можеш да оставиш празни.' }, { title: '2. Сравни условията', text: 'Прочети цената, депозита и статуса на проверката. Когато няма обяви, показваме това открито.' }, { title: '3. Говори директно', text: 'Влез за контакт и съобщения. Уговори оглед и уточни правото за отдаване преди плащане.' }].map(item => <div key={item.title}><h2 className="font-heading text-base font-semibold">{item.title}</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">{item.text}</p></div>)}</section>
      <CityGuides />
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-background-200 pt-6"><div><h2 className="font-heading text-xl font-semibold">Отдаваш свое жилище?</h2><p className="mt-2 text-sm text-foreground-600">Избери град, добави реални снимки и ясни условия. Обявата преминава през преглед.</p></div><Link to="/kachi-obiava" className="ui-button">Качи обява</Link></div>
      <p className="ui-note">Градове: НСИ / ЕКАТТЕ. Учебни локации: НАОА и официални сайтове. Райони: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors, ODbL</a>. Покритието на райони и корпуси е непълно. <Link to="/kontakti" className="underline">Предложи корекция.</Link></p>
    </div>
  </SiteLayout>;
}
