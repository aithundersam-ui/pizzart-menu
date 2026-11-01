'use client';

import { useEffect, useRef, useState } from 'react';
import type { Branding, Category, Item } from '@/lib/types';
import { tr } from '@/lib/i18n';
import { api } from '@/lib/client';
import { ImagePicker } from '@/components/admin/ui';
import { useSetting } from '@/components/admin/useSetting';
import { useT } from '@/components/admin/i18n';

const DEFAULTS = { primary: '#941B25', accent: '#E5A823', background: '#F7F0E3', text: '#3B2A22' };
const FONTS = [
  { id: 'classic', label: 'Classic (Playfair + script)' },
  { id: 'modern', label: 'Modern (Poppins)' },
  { id: 'street', label: 'Street (Anton + marker)' },
] as const;

export default function BrandingPage() {
  const { value: b, setValue, save, saving } = useSetting<Branding>('branding');
  const [items, setItems] = useState<Item[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const { t } = useT();
  useEffect(() => {
    api<{ categories: (Category & { items: Item[] })[] }>('GET', '/api/admin/menu').then((d) => setItems(d.categories.flatMap((c) => c.items)));
  }, []);
  if (!b) return <p className="muted">{t('Loading…')}</p>;
  const set = (p: Partial<Branding>) => setValue({ ...b, ...p });

  const color = (k: 'primary' | 'accent' | 'background' | 'text', label: string, hint: string) => (
    <label className="color">
      <input type="color" value={b[k]} onChange={(e) => set({ [k]: e.target.value.toUpperCase() } as Partial<Branding>)} />
      <span>
        <b>{t(label)}</b>
        <small className="muted">
          {t(hint)} · {b[k]}
        </small>
      </span>
    </label>
  );

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save()) frame.current?.contentWindow?.location.reload();
      }}
    >
      <div className="page-head">
        <h1>{t('Branding')}</h1>
        <button className="btn primary" disabled={saving}>
          {saving ? t('Saving…') : t('Save')}
        </button>
      </div>
      <div className="brand-grid">
        <div>
          <section className="card">
            <h2>{t('Logo and photos')}</h2>
            <ImagePicker label={t('Logo (PNG with transparent background works best)')} kind="logo" wide value={b.logoImageId} onChange={(logoImageId) => set({ logoImageId })} />
            <ImagePicker label={t('Cover photo (used when no featured dish is set)')} wide value={b.coverImageId} onChange={(coverImageId) => set({ coverImageId })} />
            <label>
              {t('Featured dish at the top of the menu')}
              <select value={b.featuredItemId ?? ''} onChange={(e) => set({ featuredItemId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">{t('None')}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {tr(it.name, 'fr')}
                    {it.imageId ? '' : t(' (no photo)')}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="card">
            <h2>{t('Colours')}</h2>
            <div
              className="swatch-preview"
              style={{ background: b.background, color: b.text, borderColor: b.primary }}
            >
              <b style={{ color: b.primary }}>MARGHERITA</b>
              <span style={{ borderBottom: `2px dotted ${b.accent}`, flex: 1 }} />
              <span style={{ background: b.accent, color: '#2a1a10', padding: '2px 10px', borderRadius: 20 }}>450 DA</span>
            </div>
            {color('primary', 'Main colour', 'Dish names, headings, buttons')}
            {color('accent', 'Accent colour', 'Prices, highlights, slogan')}
            {color('background', 'Background', 'Page colour')}
            {color('text', 'Text', 'Descriptions and body text')}
            <button type="button" className="btn small ghost" onClick={() => set(DEFAULTS)}>
              {t('Reset to the PizzArt sign colours')}
            </button>
          </section>
          <section className="card">
            <h2>{t('Fonts')}</h2>
            {FONTS.map((f) => (
              <label key={f.id} className="check">
                <input type="radio" name="font" checked={b.font === f.id} onChange={() => set({ font: f.id })} />
                {t(f.label)}
              </label>
            ))}
          </section>
        </div>
        <div className="phone-preview">
          <p className="muted small">{t('Live menu (refreshes after you save)')}</p>
          <div className="phone-frame">
            <iframe ref={frame} src="/" title={t('Menu preview')} />
          </div>
        </div>
      </div>
    </form>
  );
}
