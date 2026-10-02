import { Link } from 'react-router-dom';
import { setListingStatus, verifyListing, type AdminListingRow } from '@/lib/repository/admin';
import { formatEur } from '@/lib/format';
import ModerationAction from '@/components/feature/ModerationAction';
export default function AdminListings({ listings, onChanged }: { listings: AdminListingRow[]; onChanged: () => void }) {
  if (!listings.length) return <p className="py-6">Няма обяви за преглед.</p>;
  return <ul className="mt-4 divide-y rounded-lg border">{listings.map(item => <li key={item.id} className="space-y-3 p-4">
    <Link className="font-semibold" to={`/obiava/${item.slug}`}>{item.title}</Link>
    <p className="text-sm">{item.ownerName} · {formatEur(item.priceEur)} · {item.status}</p>
    <div className="flex flex-wrap gap-2">
      {['pending_review','flagged'].includes(item.status) && <>
        <ModerationAction label="Запиши проверка на имота" verification onConfirm={async (reason, method) => { await verifyListing(item.id, method, reason); onChanged(); }} />
        <ModerationAction label="Одобри обявата" onConfirm={async reason => { await setListingStatus(item.id, 'active', reason); onChanged(); }} />
        <ModerationAction label="Отхвърли" onConfirm={async reason => { await setListingStatus(item.id, 'rejected', reason); onChanged(); }} />
      </>}
      {item.status === 'active' && <ModerationAction label="Скрий за проверка" onConfirm={async reason => { await setListingStatus(item.id, 'flagged', reason); onChanged(); }} />}
      {item.status !== 'removed' && <ModerationAction label="Премахни от публикуване" onConfirm={async reason => { await setListingStatus(item.id, 'removed', reason); onChanged(); }} />}
    </div>
  </li>)}</ul>;
}
