import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SiteLayout from '@/components/feature/SiteLayout';
import { infoPages, faqItems } from './content';
import { breadcrumbJsonLd, faqJsonLd, removeJsonLd, setJsonLd } from '@/lib/seo';
import { organizationJsonLd, SOCIAL_PROFILES } from '@/lib/siteIdentity';
export default function InfoPage() {
  const { pathname } = useLocation();
  const page = infoPages[pathname];
  const faq = pathname === '/faq';
  useEffect(() => {
    const title = faq ? 'Въпроси и отговори' : page.title;
    setJsonLd('ld-info', [breadcrumbJsonLd([{name:'Начало',path:'/'},{name:title,path:pathname}]), ...(faq?[faqJsonLd(faqItems)]:pathname==='/za-nas'?[organizationJsonLd()]:[])]);
    return () => removeJsonLd('ld-info');
  }, [faq,page,pathname]);
  return <SiteLayout><article className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
    <nav aria-label="Път до страницата" className="mb-8 text-sm"><Link to="/" className="text-primary-700 underline">Начало</Link><span aria-hidden="true"> / </span><span>{faq ? 'Въпроси и отговори' : page.title}</span></nav>
    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-700">Квартири без посредник</p>
    <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">{faq ? 'Въпроси с ясни отговори' : page.title}</h1>
    <p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground-600">{faq ? 'Най-важното за търсенето, публикуването и безопасното ползване на платформата.' : page.intro}</p>
    {faq ? <div className="mt-10 divide-y divide-background-300">{faqItems.map(item => <details key={item.question} className="py-5"><summary className="cursor-pointer text-lg font-semibold">{item.question}</summary><p className="mt-3 max-w-3xl leading-relaxed text-foreground-700">{item.answer}</p></details>)}</div> : <div className="mt-12 grid gap-6 md:grid-cols-2">{page.sections.map((section, index) => <section key={section.title} className="rounded-xl border border-background-200 bg-background-100 p-6 md:p-8"><span aria-hidden="true" className="text-sm font-semibold text-primary-700">0{index + 1}</span><h2 className="mt-3 text-xl font-bold">{section.title}</h2>{section.paragraphs.map(text => <p key={text} className="mt-4 leading-relaxed text-foreground-700">{text}</p>)}</section>)}</div>}
    {pathname==='/za-nas' && <section className="ui-panel mt-8"><h2 className="text-lg font-semibold">Официални социални профили</h2><p className="mt-2 text-sm text-foreground-600">Новини и полезни насоки от екипа. За сигнал за обява използвай формата в сайта.</p><div className="mt-4 flex flex-wrap gap-3">{SOCIAL_PROFILES.map(profile=><a key={profile.name} className="ui-secondary" href={profile.url} target="_blank" rel="noopener noreferrer"><i className={profile.icon} aria-hidden="true" />{profile.name}<span className="sr-only"> (нов раздел)</span></a>)}</div></section>}
    <div className="mt-12 flex flex-wrap gap-3"><Link to="/tarsene" className="ui-button">Намери жилище</Link><Link to="/kachi-obiava" className="ui-secondary">Публикувай обява</Link><Link to="/kontakti" className="ui-secondary">Свържи се с нас</Link></div>
  </article></SiteLayout>;
}
