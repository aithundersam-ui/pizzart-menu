'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ToastProvider } from './ui';
import { AdminI18nProvider, LangSwitch, useT } from './i18n';

type Me = { uid: number; email: string; role: 'master' | 'owner' | 'staff' };
/** Master and owner ("admin") can edit the whole site; staff only availability and prices. */
export const isAdmin = (me: Me | null) => me?.role === 'master' || me?.role === 'owner';
export const ROLE_LABEL = { master: 'Master admin', owner: 'Admin', staff: 'Staff' } as const;
const MeCtx = createContext<Me | null>(null);
export const useMe = () => useContext(MeCtx);

const NAV = [
  { href: '/admin', label: 'Overview', icon: 'M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z' },
  { href: '/admin/menu', label: 'Menu', icon: 'M12 2L2 21h20zM9 13a1.5 1.5 0 100 .01M14 16a1.5 1.5 0 100 .01', staff: true },
  { href: '/admin/info', label: 'Restaurant info', icon: 'M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z' },
  { href: '/admin/branding', label: 'Branding', icon: 'M12 3a9 9 0 000 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.4 1.5-1.4H16a5 5 0 005-5c0-4.4-4-8-9-8zM7 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z' },
  { href: '/admin/languages', label: 'Languages', icon: 'M4 5h10M9 3v2m1.5 0c-1 4-3.5 7-6.5 9m2-5c1.5 2.5 4 4.5 6 5.5M13 21l4-9 4 9m-6.5-3h5' },
  { href: '/admin/qr', label: 'QR codes', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 19h2M19 14h2', staff: true },
  { href: '/admin/account', label: 'Accounts', icon: 'M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm-8 9c0-4.4 3.6-7 8-7s8 2.6 8 7', staff: true },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Logo({ logoId }: { logoId: string | null }) {
  return (
    <div className="side-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logoId ? <img src={`/api/img/${logoId}`} alt="PizzArt" /> : <span className="brand-text">PizzArt</span>}
      <small>admin</small>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { t } = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [logoId, setLogoId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const isLogin = path === '/admin/login';

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    if (isLogin) return;
    api<Me>('GET', '/api/admin/me').then(setMe).catch(() => {});
    api<{ logoImageId: string | null }>('GET', '/api/admin/settings/branding').then((b) => setLogoId(b.logoImageId)).catch(() => {});
  }, [isLogin]);

  useEffect(() => setNavOpen(false), [path]);

  if (isLogin) return <div className="admin">{children}</div>;

  const items = NAV.filter((n) => isAdmin(me) || n.staff || n.href === '/admin');
  return (
    <MeCtx.Provider value={me}>
      <div className="admin shell">
        <aside className={`side ${navOpen ? 'open' : ''}`}>
          <Logo logoId={logoId} />
          <nav>
            {items.map((n) => (
              <Link key={n.href} href={n.href} className={path === n.href ? 'on' : ''}>
                <Icon d={n.icon} />
                {t(n.label)}
              </Link>
            ))}
          </nav>
          <div className="side-foot">
            <LangSwitch />
            <a href="/" target="_blank" rel="noopener" className="btn small ghost">
              {t('View menu ↗')}
            </a>
            <div className="who">
              {me?.email}
              <small>{me ? t(ROLE_LABEL[me.role]) : ''}</small>
            </div>
            <button
              className="btn small ghost"
              onClick={async () => {
                await api('POST', '/api/auth/logout');
                location.href = '/admin/login';
              }}
            >
              {t('Sign out')}
            </button>
          </div>
        </aside>
        <div className="main">
          <header className="mobile-bar">
            <button className="icon-btn" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
              ☰
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoId ? <img className="mobile-logo" src={`/api/img/${logoId}`} alt="PizzArt" /> : <span className="brand-text">PizzArt</span>}
            <span className="spacer" />
            <LangSwitch />
          </header>
          {navOpen && <div className="nav-bg" onClick={() => setNavOpen(false)} />}
          <div className="content">{me ? children : <p className="muted">{t('Loading…')}</p>}</div>
        </div>
      </div>
    </MeCtx.Provider>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </AdminI18nProvider>
  );
}
