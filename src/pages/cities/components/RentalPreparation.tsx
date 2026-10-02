import { useState } from 'react';
import { Link } from 'react-router-dom';
import { calculateRentalBudget, type RentalBudget } from '@/lib/rentalBudget';
const fields: { key: keyof RentalBudget; label: string }[] = [{ key: 'rent', label: 'Наем на месец (€)' }, { key: 'bills', label: 'Сметки на месец (€)' }, { key: 'deposit', label: 'Депозит, еднократно (€)' }, { key: 'moving', label: 'Други начални разходи (€)' }];
const money = (value: number) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(value);
export default function RentalPreparation() {
  const [values, setValues] = useState<RentalBudget>({ rent: '', bills: '', deposit: '', moving: '' });
  const result = calculateRentalBudget(values);
  return <section id="praktichno" tabIndex={-1} className="grid gap-6 outline-none lg:grid-cols-2">
    <div className="ui-panel"><p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Преди решение</p><h2 className="mt-3 font-heading text-2xl font-semibold">Уточни условията при оглед</h2><ol className="mt-5 space-y-4 text-sm leading-relaxed text-foreground-700">
      {['Кой има право да отдава имота и кой ще подпише договора?', 'Кои сметки и такси са включени, какъв е депозитът и кога се връща?', 'Съответстват ли адресът, снимките, мебелите и състоянието на описанието?', 'Какъв е срокът на наема, кога можеш да се нанесеш и как се прекратява договорът?'].map((text, index) => <li key={text} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">{index + 1}</span><span>{text}</span></li>)}
    </ol><Link to="/saveti/ot-ogled-do-dogovor" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-700">От оглед до договор<i className="ri-arrow-right-line" aria-hidden="true" /></Link></div>
    <div className="ui-panel"><h2 className="font-heading text-2xl font-semibold">Сметни своя бюджет</h2><p className="mt-3 text-sm leading-relaxed text-foreground-600">Попълни уговорените или очакваните от теб суми. За разход, който нямаш, въведи 0. Това е твоя сметка, без пазарни оценки.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.key} className="ui-label" htmlFor={`budget-${field.key}`}>{field.label}<input id={`budget-${field.key}`} type="text" inputMode="decimal" maxLength={12} className="ui-field mt-2" placeholder="Въведи сума" value={values[field.key]} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} /></label>)}</div>
      <div aria-live="polite" aria-atomic="true" className="mt-4 rounded-lg bg-primary-50 p-4">{result ? <dl className="space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>На месец</dt><dd className="font-semibold">{money(result.monthly)}</dd></div><div className="flex justify-between gap-3"><dt>За първия месец и нанасянето</dt><dd className="font-semibold">{money(result.initial)}</dd></div></dl> : <p className="text-sm leading-relaxed text-foreground-700">Попълни четирите суми с неотрицателни числа и до два знака след десетичната запетая.</p>}</div><p className="ui-note mt-3">Сумите остават в тази страница и не се изпращат. Началният разход включва първия наем, първите сметки, депозита и другите начални разходи.</p>
    </div>
  </section>;
}
