'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { tr } from '@/lib/i18n';
import { useMe } from '@/components/admin/AdminShell';
import { useT } from '@/components/admin/i18n';

type Stats = {
  days: { day: string; scans: number }[];
  tables: { table_label: string; scans: number }[];
  dishes: { id: number; name: Record<string, string>; views: number }[];
  counts: { dishes: number; sold_out: number; hidden: number; categories: number };
};

export default function Overview() {
  const me = useMe();
  const { t } = useT();
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>('GET', '/api/admin/stats').then(setS).catch(() => {});
  }, []);
  if (!s) return <p className="muted">{t('Loading…')}</p>;

  const total = s.days.reduce((a, d) => a + d.scans, 0);
  const max = Math.max(1, ...s.days.map((d) => d.scans));
  const today = s.days.at(-1)?.scans ?? 0;

  return (
    <>
      <h1>{t('Overview')}</h1>
      <div className="kpis">
        <div className="kpi">
          <b>{today}</b>
          <span>{t('menu scans today')}</span>
        </div>
        <div className="kpi">
          <b>{total}</b>
          <span>{t('scans in the last 14 days')}</span>
        </div>
        <div className="kpi">
          <b>{s.counts.dishes}</b>
          <span>{t('dishes in {n} categories', { n: s.counts.categories })}</span>
        </div>
        <div className="kpi">
          <b>{s.counts.sold_out}</b>
          <span>{t('marked sold out')}</span>
        </div>
      </div>

      <section className="card">
        <h2>{t('Scans per day')}</h2>
        <div className="bars" role="img" aria-label={t('Menu scans per day, last 14 days')}>
          {s.days.map((d) => (
            <div key={d.day} className="bar-col" title={`${d.day}: ${d.scans}`}>
              <span className="bar-n">{d.scans || ''}</span>
              <div className="bar" style={{ height: `${(d.scans / max) * 100}%` }} />
              <span className="bar-d">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h2>{t('Most opened dishes (30 days)')}</h2>
          {s.dishes.length === 0 ? (
            <p className="muted">{t('No data yet. It fills in as guests tap dishes.')}</p>
          ) : (
            <ol className="rank">
              {s.dishes.map((d) => (
                <li key={d.id}>
                  <span>{tr(d.name, 'fr')}</span>
                  <b>{d.views}</b>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card">
          <h2>{t('Busiest tables (30 days)')}</h2>
          {s.tables.length === 0 ? (
            <p className="muted">{t('No table QR scans yet. Print table codes from the QR page.')}</p>
          ) : (
            <ol className="rank">
              {s.tables.map((tb) => (
                <li key={tb.table_label}>
                  <span>{t('Table')} {tb.table_label}</span>
                  <b>{tb.scans}</b>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card">
        <h2>{t('Quick actions')}</h2>
        <div className="row-wrap">
          <Link className="btn primary" href="/admin/menu">
            {t('Edit the menu')}
          </Link>
          <Link className="btn" href="/admin/qr">
            {t('Print QR codes')}
          </Link>
          {me?.role === 'owner' && (
            <Link className="btn" href="/admin/info">
              {t('Opening hours & contact')}
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
