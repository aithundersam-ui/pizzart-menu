'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useMe } from '@/components/admin/AdminShell';
import { useToast } from '@/components/admin/ui';

type User = { id: number; email: string; name: string; role: 'owner' | 'staff' };

export default function AccountPage() {
  const me = useMe();
  const toast = useToast();
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
      <h1>Accounts</h1>
      <section className="card">
        <h2>My password</h2>
        <form
          className="form grid2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api('POST', '/api/admin/password', pw), 'Password changed')) setPw({ current: '', next: '' });
          }}
        >
          <label>
            Current password
            <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </label>
          <label>
            New password (8+ characters)
            <input type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          </label>
          <div>
            <button className="btn primary">Change password</button>
          </div>
        </form>
      </section>

      {owner && (
        <>
          <section className="card">
            <h2>People who can sign in</h2>
            <p className="muted small">Staff can mark dishes sold out and change prices. Owners can change everything.</p>
            <ul className="items">
              {users.map((u) => (
                <li key={u.id} className="item-row">
                  <div className="item-main">
                    <b>{u.name || u.email}</b>
                    <span className="muted small">
                      {u.email} · {u.role === 'owner' ? 'Owner' : 'Staff'}
                    </span>
                  </div>
                  {u.id !== me?.uid && (
                    <div className="row-wrap tight">
                      <button
                        className="btn small ghost"
                        onClick={() => {
                          const p = prompt(`New password for ${u.email} (8+ characters)`);
                          if (p) run(() => api('PATCH', `/api/admin/users/${u.id}`, { password: p }), 'Password reset');
                        }}
                      >
                        Reset password
                      </button>
                      <button className="btn small danger" onClick={() => confirm(`Remove ${u.email}?`) && run(() => api('DELETE', `/api/admin/users/${u.id}`), 'Account removed')}>
                        Remove
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
                Name
                <input value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
              </label>
              <label>
                Email
                <input type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} required />
              </label>
              <label>
                Password (8+ characters)
                <input type="text" minLength={8} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} required />
              </label>
              <label>
                Role
                <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
              <div>
                <button className="btn primary">Add account</button>
              </div>
            </form>
          </section>
          <section className="card">
            <h2>Backup</h2>
            <p className="muted small">Download the whole menu, settings and photos as one file. Keep a copy now and then.</p>
            <a className="btn" href="/api/admin/export">
              Download backup
            </a>
          </section>
        </>
      )}
    </>
  );
}
