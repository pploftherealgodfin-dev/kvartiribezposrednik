import { useRef, useState, type KeyboardEvent } from 'react';
export interface LocationOption { value: string; label: string; priority?: boolean }
interface Props { id: string; label: string; value: string; options: LocationOption[]; placeholder: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean }

export default function LocationSelect({ id, label, value, options, placeholder, onChange, disabled = false, required = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const selected = options.find(item => item.value === value);
  const matches = options.filter(item => item.label.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg')));
  const items = [{ value: '', label: placeholder }, ...matches.slice(0, 60)];
  const choose = (next: string) => { onChange(next); setOpen(false); setQuery(''); };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setQuery(''); }
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true);
      setActive(index => Math.max(0, Math.min(items.length - 1, open ? index + (event.key === 'ArrowDown' ? 1 : -1) : 1)));
    } else if (event.key === 'Enter' && open) { event.preventDefault(); if (items[active]) choose(items[active].value); }
    else if (event.key === 'Tab') { setOpen(false); setQuery(''); }
  };
  return <div className="relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setQuery(''); } }}>
    <label htmlFor={id} className="ui-label">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <div className="relative">
      <input ref={input} id={id} role="combobox" type="text" autoComplete="off" required={required} disabled={disabled} value={open ? query : selected?.label ?? ''}
        placeholder={placeholder} aria-autocomplete="list" aria-expanded={open} aria-controls={id + '-options'} aria-activedescendant={open ? id + '-option-' + active : undefined}
        onFocus={() => { setOpen(true); setQuery(''); setActive(0); }} onClick={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={onKeyDown} className="ui-field pr-10" />
      {value && !disabled ? <button type="button" aria-label={'Изчисти ' + label.toLocaleLowerCase('bg')} onClick={() => choose('')} className="absolute inset-y-0 right-0 w-10 text-foreground-500"><i className="ri-close-line" aria-hidden="true" /></button>
        : <i className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-3 text-foreground-500" aria-hidden="true" />}
    </div>
    {open && !disabled && <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-background-300 bg-background-50 shadow-lg">
      <ul id={id + '-options'} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
        {items.map((item, index) => <li id={id + '-option-' + index} role="option" aria-selected={item.value === value} key={item.value} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(item.value)} className={'cursor-pointer rounded-md px-3 py-3 text-sm ' + (index === active ? 'bg-primary-50 text-primary-800' : 'text-foreground-800')}>
          {item.label}{item.priority && <span className="ml-2 text-[10px] text-primary-700">университетски град</span>}
        </li>)}
      </ul>
      {matches.length === 0 && <p role="status" className="px-4 py-3 text-sm text-foreground-600">Няма съвпадение. Опитай с друга част от името.</p>}
      {matches.length > 60 && <p className="border-t border-background-200 px-4 py-2 text-xs text-foreground-600">Изпиши име, за да стесниш списъка.</p>}
    </div>}
  </div>;
}
