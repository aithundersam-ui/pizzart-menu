'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ToastProvider } from './ui';

type Me = { uid: number; email: string; role: 'owner' | 'staff' };
const MeCtx = createContext<Me | null>(null);
export const useMe = () => useContext(MeCtx);

const NAV = [
  { href: '/admin', label: 'Overview', icon: '◎' },
  { href: '/admin/menu', label: 'Menu', icon: '🍕', staff: true },
  { href: '/admin/info', label: 'Restaurant info', icon: '📍' },
  { href: '/admin/branding', label: 'Branding', icon: '🎨' },
  { href: '/admin/languages', label: 'Languages', icon: 'ع' },
  { href: '/admin/qr', label: 'QR codes', icon: '▦', staff: true },
  { href: '/admin/account', label: 'Accounts', icon: '👤', staff: true },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const isLogin = path === '/admin/login';

  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    if (!isLogin) api<Me>('GET', '/api/admin/me').then(setMe).catch(() => {});
  }, [isLogin]);

  useEffect(() => setNavOpen(false), [path]);

  if (isLogin) return <ToastProvider><div className="admin">{children}</div></ToastProvider>;

  const items = NAV.filter((n) => me?.role === 'owner' || n.staff || n.href === '/admin');
  return (
    <ToastProvider>
      <MeCtx.Provider value={me}>
        <div className="admin shell">
          <aside className={`side ${navOpen ? 'open' : ''}`}>
            <div className="brand">
              PizzArt <small>admin</small>
            </div>
            <nav>
              {items.map((n) => (
                <Link key={n.href} href={n.href} className={path === n.href ? 'on' : ''}>
                  <span className="ico">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="side-foot">
              <a href="/" target="_blank" rel="noopener" className="btn small ghost">
                View menu ↗
              </a>
              <div className="who">
                {me?.email}
                <br />
                <small>{me?.role === 'owner' ? 'Owner' : 'Staff'}</small>
              </div>
              <button
                className="btn small ghost"
                onClick={async () => {
                  await api('POST', '/api/auth/logout');
                  location.href = '/admin/login';
                }}
              >
                Sign out
              </button>
            </div>
          </aside>
          <div className="main">
            <header className="mobile-bar">
              <button className="icon-btn" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
                ☰
              </button>
              <span className="brand">PizzArt admin</span>
              <a href="/" target="_blank" rel="noopener" className="btn small ghost">
                View ↗
              </a>
            </header>
            {navOpen && <div className="nav-bg" onClick={() => setNavOpen(false)} />}
            <div className="content">{me ? children : <p className="muted">Loading…</p>}</div>
          </div>
        </div>
      </MeCtx.Provider>
    </ToastProvider>
  );
}
