'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { Lang, Text } from '@/lib/types';
import { LANG_NAMES } from '@/lib/i18n';
import { uploadImage } from '@/lib/client';
import { useT } from './i18n';

type Toast = { id: number; msg: string; kind: 'ok' | 'err' };
const ToastCtx = createContext<(msg: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const n = useRef(0);
  const { t } = useT();
  const push = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = ++n.current;
    setToasts((list) => [...list, { id, msg: t(msg), kind }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), kind === 'err' ? 6000 : 2500);
  }, [t]);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** One input per language for a translatable text. */
export function TextFields({
  label, value, onChange, multiline, langs = ['fr', 'ar', 'en'], required,
}: {
  label: string; value: Text; onChange: (v: Text) => void; multiline?: boolean; langs?: Lang[]; required?: boolean;
}) {
  const { t } = useT();
  return (
    <fieldset className="tf">
      <legend>{label}</legend>
      {langs.map((l) => {
        const props = {
          value: value[l] ?? '',
          dir: l === 'ar' ? 'rtl' : 'ltr',
          lang: l,
          placeholder: l === 'fr' ? '' : `${LANG_NAMES[l]} ${t('(empty = French text shown)')}`,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [l]: e.target.value }),
          'aria-label': `${label} (${LANG_NAMES[l]})`,
          required: required && l === 'fr',
        };
        return (
          <label key={l} className="tf-row">
            <span className="tf-lang">{l.toUpperCase()}</span>
            {multiline ? <textarea rows={2} {...props} /> : <input {...props} />}
          </label>
        );
      })}
    </fieldset>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch" title={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="switch-label">{label}</span>
    </label>
  );
}

/** Photo picker with preview; uploads immediately and returns the new image id. */
export function ImagePicker({
  value, onChange, label, kind = 'photo', wide,
}: {
  value: string | null; onChange: (id: string | null) => void; label: string; kind?: 'photo' | 'logo'; wide?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { t } = useT();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`imgpick ${wide ? 'wide' : ''}`}>
      <div className="imgpick-box" onClick={() => input.current?.click()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={`/api/img/${value}`} alt="" /> : <span>{busy ? t('Uploading…') : t('+ Add photo')}</span>}
      </div>
      <div className="imgpick-actions">
        <span className="imgpick-label">{label}</span>
        <button type="button" className="btn small" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? t('Uploading…') : value ? t('Replace') : t('Upload')}
        </button>
        {value && (
          <button type="button" className="btn small ghost" onClick={() => onChange(null)}>
            {t('Remove')}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadImage(f, kind));
          } catch (err) {
            toast((err as Error).message, 'err');
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Close')}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
