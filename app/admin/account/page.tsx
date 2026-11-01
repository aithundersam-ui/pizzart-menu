'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useMe } from '@/components/admin/AdminShell';
import { useToast } from '@/components/admin/ui';
import { useT } from '@/components/admin/i18n';

type User = { id: number; email: string; name: string; role: 'owner' | 'staff' };

export default function AccountPage() {
  const me = useMe();
  const toast = useToast();
  const { t } = useT();
  const [users, setUsers] = useState<User[]>([]);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [nu, setNu] = useState({ email: '', name: '', password: '', role: 'staff' });
  const owner = me?.role === 'owner';

  const load = useCallback(() => {
    if (owner) api<User[]>('GET', '/api/admin/users').then(setUsers);
  }, [owner]);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
      return true;
    } catch (e) {
      toast((e as Error).message, 'err');
      return false;
    }
  };

  return (
    <>
      <h1>{t('Accounts')}</h1>
      <section className="card">
        <h2>{t('My password')}</h2>
        <form
          className="form grid2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api('POST', '/api/admin/password', pw), 'Password changed')) setPw({ current: '', next: '' });
          }}
        >
          <label>
            {t('Current password')}
            <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </label>
          <label>
            {t('New password (8+ characters)')}
            <input type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          </label>
          <div>
            <button className="btn primary">{t('Change password')}</button>
          </div>
        </form>
      </section>

      {owner && (
        <>
          <section className="card">
            <h2>{t('People who can sign in')}</h2>
            <p className="muted small">{t('Staff can mark dishes sold out and change prices. Owners can change everything.')}</p>
            <ul className="items">
              {users.map((u) => (
                <li key={u.id} className="item-row">
                  <div className="item-main">
                    <b>{u.name || u.email}</b>
                    <span className="muted small">
                      {u.email} · {u.role === 'owner' ? t('Owner') : t('Staff')}
                    </span>
                  </div>
                  {u.id !== me?.uid && (
                    <div className="row-wrap tight">
                      <button
                        className="btn small ghost"
                        onClick={() => {
                          const p = prompt(t('New password for {email} (8+ characters)', { email: u.email }));
                          if (p) run(() => api('PATCH', `/api/admin/users/${u.id}`, { password: p }), 'Password reset');
                        }}
                      >
                        {t('Reset password')}
                      </button>
                      <button className="btn small danger" onClick={() => confirm(t('Remove {email}?', { email: u.email })) && run(() => api('DELETE', `/api/admin/users/${u.id}`), 'Account removed')}>
                        {t('Remove')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="form grid2 add-user"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run(() => api('POST', '/api/admin/users', nu), 'Account created')) setNu({ email: '', name: '', password: '', role: 'staff' });
              }}
            >
              <label>
                {t('Name')}
                <input value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
              </label>
              <label>
                {t('Email')}
                <input type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} required />
              </label>
              <label>
                {t('Password (8+ characters)')}
                <input type="text" minLength={8} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} required />
              </label>
              <label>
                {t('Role')}
                <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
                  <option value="staff">{t('Staff')}</option>
                  <option value="owner">{t('Owner')}</option>
                </select>
              </label>
              <div>
                <button className="btn primary">{t('Add account')}</button>
              </div>
            </form>
          </section>
          <section className="card">
            <h2>{t('Backup')}</h2>
            <p className="muted small">{t('Download the whole menu, settings and photos as one file. Keep a copy now and then.')}</p>
            <a className="btn" href="/api/admin/export">
              {t('Download backup')}
            </a>
          </section>
        </>
      )}
    </>
  );
}
