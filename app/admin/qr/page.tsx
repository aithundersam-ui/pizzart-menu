'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/components/admin/i18n';

const qr = (table: string, format: 'svg' | 'png', download = false) =>
  `/api/admin/qr?format=${format}${table ? `&table=${encodeURIComponent(table)}` : ''}${download ? '&download=1' : ''}`;

export default function QrPage() {
  const [url, setUrl] = useState('');
  const [tables, setTables] = useState(12);
  const [withGeneral, setWithGeneral] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const { t } = useT();

  useEffect(() => {
    fetch(qr('', 'svg')).then((r) => setUrl(r.headers.get('X-Menu-Url') ?? ''));
    fetch('/api/admin/settings/branding').then((r) => r.json()).then((b) => setLogo(b.logoImageId));
  }, []);

  const cards = [...(withGeneral ? [''] : []), ...Array.from({ length: Math.max(0, Math.min(100, tables)) }, (_, i) => String(i + 1))];

  return (
    <>
      <div className="page-head no-print">
        <h1>{t('QR codes')}</h1>
      </div>
      <div className="grid2 no-print">
        <section className="card qr-main">
          <h2>{t('Main QR code')}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr('', 'svg')} alt={t('QR code to the menu')} className="qr-big" />
          <p className="muted small">
            {t('Opens {url}. This address never changes, so printed codes keep working after any menu change.', { url: '\u0000' }).split('\u0000')[0]}
            <code>{url || '…'}</code>
            {t('Opens {url}. This address never changes, so printed codes keep working after any menu change.', { url: '\u0000' }).split('\u0000')[1]}
          </p>
          <div className="row-wrap">
            <a className="btn primary" href={qr('', 'png', true)}>
              {t('Download PNG')}
            </a>
            <a className="btn" href={qr('', 'svg', true)}>
              {t('Download SVG (for the printer)')}
            </a>
          </div>
        </section>
        <section className="card">
          <h2>{t('Table cards')}</h2>
          <p className="muted small">
            {t('Each table gets its own code, so the overview shows which tables scan most. Print on A4, cut along the lines, or save as PDF from the print window.')}
          </p>
          <label>
            {t('Number of tables')}
            <input type="number" min={0} max={100} value={tables} onChange={(e) => setTables(Number(e.target.value))} />
          </label>
          <label className="check">
            <input type="checkbox" checked={withGeneral} onChange={(e) => setWithGeneral(e.target.checked)} />
            {t('Also add a card with the main code (for the counter or window)')}
          </label>
          <button className="btn primary" onClick={() => window.print()}>
            {t('Print {n} cards / Save as PDF', { n: cards.length })}
          </button>
        </section>
      </div>

      <h2 className="no-print">{t('Preview')}</h2>
      <div className="print-sheet">
        {cards.map((t) => (
          <div key={t || 'main'} className="qr-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo && <img className="qr-logo" src={`/api/img/${logo}`} alt="PizzArt" />}
            <div className="qr-cta">Scannez pour voir le menu</div>
            <div className="qr-cta ar" dir="rtl">
              امسح الرمز لرؤية القائمة
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="qr-img" src={qr(t, 'svg')} alt="" loading="lazy" />
            <div className="qr-table">{t ? `Table ${t}` : 'Menu'}</div>
          </div>
        ))}
      </div>
    </>
  );
}
