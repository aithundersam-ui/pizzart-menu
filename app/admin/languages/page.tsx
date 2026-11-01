'use client';

import type { Lang, Languages } from '@/lib/types';
import { LABELS, LANG_NAMES, type LabelKey } from '@/lib/i18n';
import { Switch } from '@/components/admin/ui';
import { useSetting } from '@/components/admin/useSetting';
import { useT } from '@/components/admin/i18n';

const ALL: Lang[] = ['fr', 'ar', 'en'];

export default function LanguagesPage() {
  const { value: v, setValue, save, saving } = useSetting<Languages>('languages');
  const { t } = useT();
  if (!v) return <p className="muted">{t('Loading…')}</p>;
  const set = (p: Partial<Languages>) => setValue({ ...v, ...p });

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="page-head">
        <h1>{t('Languages')}</h1>
        <button className="btn primary" disabled={saving}>
          {saving ? t('Saving…') : t('Save')}
        </button>
      </div>
      <section className="card">
        <h2>{t('Languages on the menu')}</h2>
        <p className="muted small">{t('Guests switch language with the buttons at the top. Arabic turns the whole page right-to-left.')}</p>
        {ALL.map((l) => (
          <Switch
            key={l}
            checked={v.enabled.includes(l)}
            label={LANG_NAMES[l]}
            onChange={(on) => set({ enabled: on ? ALL.filter((x) => x === l || v.enabled.includes(x)) : v.enabled.filter((x) => x !== l) })}
          />
        ))}
        <label>
          {t('Language shown first')}
          <select value={v.default} onChange={(e) => set({ default: e.target.value as Lang })}>
            {v.enabled.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="card">
        <h2>{t('Words on the menu')}</h2>
        <p className="muted small">{t('Change any fixed word guests see. Leave a box empty to keep the default shown in grey.')}</p>
        <div className="labels-table">
          <div className="lt-head">
            {ALL.map((l) => (
              <span key={l}>{LANG_NAMES[l]}</span>
            ))}
          </div>
          {(Object.keys(LABELS) as LabelKey[]).map((k) => (
            <div key={k} className="lt-row">
              {ALL.map((l) => (
                <input
                  key={l}
                  dir={l === 'ar' ? 'rtl' : 'ltr'}
                  placeholder={LABELS[k][l]}
                  value={v.labels?.[l]?.[k] ?? ''}
                  aria-label={`${k} (${LANG_NAMES[l]})`}
                  onChange={(e) => set({ labels: { ...v.labels, [l]: { ...(v.labels?.[l] ?? {}), [k]: e.target.value } } })}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
