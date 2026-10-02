import { useState } from 'react';
interface Option { value: string; label: string; priority?: boolean }
export default function LocationSelect({ id, label, value, options, placeholder, onChange, disabled = false, required = false }: { id: string; label: string; value: string; options: Option[]; placeholder: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean }) {
  const [query, setQuery] = useState('');
  const visible = options.filter(item => item.value === value || item.label.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg')));
  const priority = visible.filter(item => item.priority);
  const other = visible.filter(item => !item.priority);
  const render = (items: Option[]) => items.map(item => <option key={item.value} value={item.value}>{item.label}</option>);
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>{options.length > 12 && <input aria-label={`Търси в ${label.toLocaleLowerCase('bg')}`} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Напиши име за по-кратък списък" className="mb-2 h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm" />}<select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required={required} className="h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm disabled:opacity-60"><option value="">{placeholder}</option>{priority.length ? <><optgroup label="Университетски градове">{render(priority)}</optgroup><optgroup label="Всички останали">{render(other)}</optgroup></> : render(other)}</select>{query && <p role="status" className="mt-1 text-xs text-foreground-600">{visible.length} възможности</p>}</div>;
}
