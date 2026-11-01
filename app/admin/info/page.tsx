'use client';

import type { Restaurant } from '@/lib/types';
import { DAY_NAMES_ADMIN } from '@/lib/admin-i18n';
import { Switch, TextFields } from '@/components/admin/ui';
import { useSetting } from '@/components/admin/useSetting';
import { useT } from '@/components/admin/i18n';

export default function InfoPage() {
  const { value: r, setValue, save, saving } = useSetting<Restaurant>('restaurant');
  const { t, lang } = useT();
  if (!r) return <p className="muted">{t('Loading…')}</p>;
  const set = (p: Partial<Restaurant>) => setValue({ ...r, ...p });
  const field = (k: keyof Restaurant, label: string, hint?: string, type = 'text') => (
    <label>
      {t(label)}
      <input type={type} value={(r[k] as string) ?? ''} onChange={(e) => set({ [k]: e.target.value } as Partial<Restaurant>)} />
      {hint && <small className="muted">{t(hint)}</small>}
    </label>
  );

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="page-head">
        <h1>{t('Restaurant info')}</h1>
        <button className="btn primary" disabled={saving}>
          {saving ? t('Saving…') : t('Save')}
        </button>
      </div>

      <section className="card">
        <h2>{t('Name and slogan')}</h2>
        {field('name', 'Restaurant name', 'Shown when there is no logo, and in the browser tab.')}
        <TextFields label={t('Slogan')} value={r.slogan} onChange={(slogan) => set({ slogan })} />
        <TextFields
          label={t('Announcement banner (leave empty to hide)')}
          value={r.announcement}
          onChange={(announcement) => set({ announcement })}
        />
      </section>

      <section className="card">
        <h2>{t('Contact')}</h2>
        <TextFields label={t('Address')} value={r.address} onChange={(address) => set({ address })} />
        <div className="grid2">
          {field('mapsUrl', 'Google Maps link', 'In Google Maps: Share → Copy link.', 'url')}
          {field('phone', 'Phone (tap to call)')}
          {field('whatsapp', 'WhatsApp number (optional)')}
          {field('instagram', 'Instagram username', 'Without the @, e.g. pizza_art.16')}
          {field('facebook', 'Facebook page name or link')}
          {field('tiktok', 'TikTok username (optional)')}
        </div>
        <TextFields label={t('Delivery note')} value={r.delivery} onChange={(delivery) => set({ delivery })} />
      </section>

      <section className="card">
        <h2>{t('Opening hours')}</h2>
        <p className="muted small">{t('Algiers time. If you close after midnight, e.g. 11:00 to 01:00, enter it as it is.')}</p>
        <div className="hours-edit">
          {[6, 0, 1, 2, 3, 4, 5].map((d) => {
            const h = r.hours.find((x) => x.day === d) ?? { day: d, open: '11:00', close: '23:00', closed: false };
            const upd = (p: Partial<typeof h>) => set({ hours: [...r.hours.filter((x) => x.day !== d), { ...h, ...p }] });
            return (
              <div key={d} className="hours-row">
                <b>{DAY_NAMES_ADMIN[lang][d]}</b>
                <input type="time" value={h.open} disabled={h.closed} onChange={(e) => upd({ open: e.target.value })} aria-label={`${DAY_NAMES_ADMIN[lang][d]} ${t('opens')}`} />
                <span>{t('to')}</span>
                <input type="time" value={h.close} disabled={h.closed} onChange={(e) => upd({ close: e.target.value })} aria-label={`${DAY_NAMES_ADMIN[lang][d]} ${t('closes')}`} />
                <Switch checked={h.closed} onChange={(closed) => upd({ closed })} label={t('Closed')} />
              </div>
            );
          })}
        </div>
      </section>
    </form>
  );
}
