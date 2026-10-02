import { Link } from 'react-router-dom';
import { setReportStatus, type ReportRow } from '@/lib/repository/reports';
import ModerationAction from '@/components/feature/ModerationAction';
export default function AdminReports({ reports, adminId, onChanged }: { reports: ReportRow[]; adminId: string; onChanged: () => void }) {
  if (!reports.length) return <p className="py-6">Няма сигнали.</p>;
  return <ul className="mt-4 divide-y rounded-lg border">{reports.map(report => <li key={report.id} className="space-y-2 p-4">
    <p className="break-all text-xs">Сигнал № {report.id} · {report.status} · {report.reason}</p>
    {report.listingSlug && <Link className="font-semibold" to={`/obiava/${report.listingSlug}`}>{report.listingTitle}</Link>}
    <p className="whitespace-pre-wrap text-sm">{report.details}</p>
    {report.resolution_note && <p className="text-sm">Решение: {report.resolution_note}</p>}
    {report.status === 'open' && <div className="flex gap-2">
      <ModerationAction label="Приключи с предприети мерки" onConfirm={async reason => { await setReportStatus(report.id,'resolved',adminId,reason); onChanged(); }} />
      <ModerationAction label="Без установено нарушение" onConfirm={async reason => { await setReportStatus(report.id,'dismissed',adminId,reason); onChanged(); }} />
    </div>}
  </li>)}</ul>;
}
