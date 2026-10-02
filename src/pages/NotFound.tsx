import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
export default function NotFound() {
  return <SiteLayout><section className="mx-auto max-w-2xl px-4 py-20 text-center"><p className="font-semibold text-primary-700">404 · Страницата не е намерена</p><h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Този адрес не води до страница</h1><p className="mt-5 leading-relaxed text-foreground-600">Връзката може да е променена или съдържанието да е премахнато. Продължи към актуалните обяви или избери град.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/tarsene" className="rounded-md bg-primary-600 px-5 py-3 font-semibold text-background-50">Търси жилище</Link><Link to="/kvartiri-bez-posrednik" className="rounded-md border border-background-300 px-5 py-3 font-semibold">Разгледай градовете</Link><Link to="/" className="px-5 py-3 text-primary-700 underline">Начална страница</Link></div></section></SiteLayout>;
}
