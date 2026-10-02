import { setUserRole, setUserStatus, type AdminUserRow } from '@/lib/repository/admin';
import ModerationAction from '@/components/feature/ModerationAction';
export default function AdminUsers({ users, onChanged }: { users: AdminUserRow[]; onChanged: () => void }) {
  return <ul className="mt-4 divide-y rounded-lg border">{users.map(user => <li key={user.id} className="space-y-2 p-4">
    <p className="font-semibold">{user.name}</p><p className="text-sm">{user.role} · {user.status}</p>
    <div className="flex flex-wrap gap-2">
      {user.status === 'active' ? <ModerationAction label="Временно блокирай" onConfirm={async reason => { await setUserStatus(user.id,'suspended',reason); onChanged(); }} /> : <ModerationAction label="Възстанови профила" onConfirm={async reason => { await setUserStatus(user.id,'active',reason); onChanged(); }} />}
      {user.role !== 'moderator' && user.role !== 'admin' && <ModerationAction label="Назначи модератор" onConfirm={async reason => { await setUserRole(user.id,'moderator',reason); onChanged(); }} />}
      {user.role === 'moderator' && <ModerationAction label="Отнеми модераторската роля" onConfirm={async reason => { await setUserRole(user.id,'tenant',reason); onChanged(); }} />}
    </div>
  </li>)}</ul>;
}
