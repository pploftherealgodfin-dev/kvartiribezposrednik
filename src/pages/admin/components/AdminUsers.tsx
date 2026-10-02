import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setUserRole, setUserStatus, type AdminUserRow } from '@/lib/repository/admin';
import { formatShortDate } from '@/lib/format';
import type { Role } from '@/lib/types';

interface AdminUsersProps {
  users: AdminUserRow[];
  onChanged: () => void;
}

const ROLES: Role[] = ['tenant', 'owner', 'moderator', 'admin'];

const ROLE_LABEL: Record<Role, string> = {
  guest: 'Гост',
  tenant: 'Наемател',
  owner: 'Наемодател',
  moderator: 'Модератор',
  admin: 'Админ',
};

export default function AdminUsers({ users, onChanged }: AdminUsersProps) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState('');

  const changeRole = async (id: string, role: Role) => {
    setBusyId(id);
    try {
      await setUserRole(id, role);
      onChanged();
    } finally {
      setBusyId('');
    }
  };

  const toggleStatus = async (user: AdminUserRow) => {
    setBusyId(user.id);
    try {
      await setUserStatus(user.id, user.status === 'suspended' ? 'active' : 'suspended');
      onChanged();
    } finally {
      setBusyId('');
    }
  };

  if (users.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-background-200 bg-background-100 p-6 text-center text-sm text-foreground-600">
        {t('admin.noData')}
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-background-200">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-background-100 text-xs text-foreground-600">
          <tr>
            <th className="px-4 py-3 font-semibold">{t('admin.colName')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.colContact')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.colRole')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.colStatus')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.colTrust')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.colCreated')}</th>
            <th className="px-4 py-3 font-semibold">{t('admin.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-background-200 bg-background-50">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-foreground-900">{user.name || '—'}</td>
              <td className="px-4 py-3 text-foreground-700">
                <span className="block whitespace-nowrap">{user.phone ?? '—'}</span>
                <span className="block text-xs text-foreground-500">{user.email ?? ''}</span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  disabled={busyId === user.id}
                  onChange={(event) => changeRole(user.id, event.target.value as Role)}
                  className="rounded-md border border-background-300 bg-background-50 px-2.5 py-1.5 text-xs text-foreground-900 focus:border-primary-500 focus:outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    user.status === 'active'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-background-200 text-foreground-700'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground-700">{user.trustScore}</td>
              <td className="px-4 py-3 text-xs text-foreground-600">
                {formatShortDate(user.createdAt)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={busyId === user.id}
                  onClick={() => toggleStatus(user)}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-1.5 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                >
                  {user.status === 'suspended' ? t('admin.unban') : t('admin.ban')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}