'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Badge, Category, Item, Size, Text } from '@/lib/types';
import { formatPrice, tr } from '@/lib/i18n';
import { api } from '@/lib/client';
import { isAdmin, useMe } from '@/components/admin/AdminShell';
import { ImagePicker, Modal, Switch, TextFields, useToast } from '@/components/admin/ui';
import { useT } from '@/components/admin/i18n';

type Cat = Category & { items: Item[] };
type Data = { categories: Cat[]; deleted: Item[] };

const BADGE_LABELS: Record<Badge, string> = { chef: "Chef's pick", new: 'New', spicy: 'Spicy' };

const emptyItem = (categoryId: number): Partial<Item> => ({
  categoryId, name: {}, description: {}, price: null, sizes: [], badges: [], imageId: null, available: true, visible: true,
});

export default function MenuEditor() {
  const me = useMe();
  const owner = isAdmin(me);
  const toast = useToast();
  const { t } = useT();
  const [data, setData] = useState<Data | null>(null);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [editingCat, setEditingCat] = useState<Partial<Cat> | null>(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(() => api<Data>('GET', '/api/admin/menu').then(setData), []);
  useEffect(() => {
    load().catch((e) => toast(e.message, 'err'));
  }, [load, toast]);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn();
      await load();
      if (done) toast(done);
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const patchItem = (id: number, body: Partial<Item>, done?: string) => run(() => api('PATCH', `/api/admin/items/${id}`, body), done);

  const move = (kind: 'categories' | 'items', list: { id: number }[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => api('POST', '/api/admin/reorder', { kind, ids }));
  };

  if (!data) return <p className="muted">{t('Loading…')}</p>;
  const q = filter.trim().toLowerCase();

  return (
    <>
      <div className="page-head">
        <h1>{t('Menu')}</h1>
        <div className="row-wrap">
          <input className="filter" placeholder={t('Find a dish…')} value={filter} onChange={(e) => setFilter(e.target.value)} />
          {owner && (
            <button className="btn" onClick={() => setEditingCat({ name: {}, note: {}, visible: true })}>
              {t('+ Category')}
            </button>
          )}
        </div>
      </div>
      {!owner && <p className="hint">{t('You can mark dishes sold out and change prices. Other changes are made by the owner.')}</p>}

      {data.categories.map((c, ci) => {
        const items = q ? c.items.filter((it) => Object.values(it.name).some((v) => v?.toLowerCase().includes(q))) : c.items;
        if (q && items.length === 0) return null;
        return (
          <section key={c.id} className={`card cat ${c.visible ? '' : 'is-hidden'}`}>
            <div className="cat-head">
              <div>
                <h2>
                  {tr(c.name, 'fr')} <span className="ar-inline">{c.name.ar}</span>
                </h2>
                <span className="muted small">
                  {t('{n} dishes', { n: c.items.length })}{!c.visible && t(' · hidden from guests')}
                </span>
              </div>
              {owner && (
                <div className="row-wrap tight">
                  <button className="icon-btn" title={t('Move up')} onClick={() => move('categories', data.categories, ci, -1)} disabled={ci === 0}>
                    ↑
                  </button>
                  <button className="icon-btn" title={t('Move down')} onClick={() => move('categories', data.categories, ci, 1)} disabled={ci === data.categories.length - 1}>
                    ↓
                  </button>
                  <button className="btn small ghost" onClick={() => setEditingCat(c)}>
                    {t('Edit')}
                  </button>
                  <button className="btn small primary" onClick={() => setEditing(emptyItem(c.id))}>
                    {t('+ Dish')}
                  </button>
                </div>
              )}
            </div>

            <ul className="items">
              {items.map((it, ii) => (
                <li key={it.id} className={`item-row ${it.visible ? '' : 'is-hidden'} ${it.available ? '' : 'is-out'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.imageId ? <img className="thumb" src={`/api/img/${it.imageId}`} alt="" /> : <span className="thumb empty" />}
                  <div className="item-main">
                    <b>{tr(it.name, 'fr')}</b>
                    <span className="muted small">
                      {it.name.ar && <span className="ar-inline">{it.name.ar}</span>}
                      {it.badges.map((x) => (
                        <span key={x} className="tag">
                          {t(BADGE_LABELS[x])}
                        </span>
                      ))}
                      {!it.visible && <span className="tag dark">{t('Hidden')}</span>}
                    </span>
                  </div>
                  <div className="item-price">
                    {it.sizes.length ? (
                      <span className="small">{it.sizes.map((s) => formatPrice(s.price)).join(' / ')} DA</span>
                    ) : (
                      <PriceInput value={it.price} onSave={(price) => patchItem(it.id, { price }, 'Price saved')} />
                    )}
                  </div>
                  <Switch
                    checked={it.available}
                    label={it.available ? t('Available') : t('Sold out')}
                    onChange={(v) => patchItem(it.id, { available: v }, v ? 'Back on the menu' : 'Marked sold out')}
                  />
                  {owner && (
                    <div className="item-actions">
                      <button className="icon-btn" title={t('Move up')} onClick={() => move('items', c.items, c.items.indexOf(it), -1)} disabled={q !== '' || ii === 0}>
                        ↑
                      </button>
                      <button className="icon-btn" title={t('Move down')} onClick={() => move('items', c.items, c.items.indexOf(it), 1)} disabled={q !== '' || ii === items.length - 1}>
                        ↓
                      </button>
                      <button className="btn small ghost" onClick={() => setEditing(it)}>
                        {t('Edit')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {items.length === 0 && <li className="muted small pad">{t('No dishes yet.')}</li>}
            </ul>
          </section>
        );
      })}

      {owner && data.deleted.length > 0 && (
        <section className="card">
          <h2>{t('Recently deleted')}</h2>
          <p className="muted small">{t('Deleted dishes stay here so you can bring them back.')}</p>
          <ul className="items">
            {data.deleted.map((it) => (
              <li key={it.id} className="item-row is-hidden">
                <span className="item-main">
                  <b>{tr(it.name, 'fr')}</b>
                </span>
                <button className="btn small" onClick={() => run(() => api('POST', `/api/admin/items/${it.id}/restore`), 'Dish restored')}>
                  {t('Restore')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <ItemForm
          item={editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setEditing(null);
            await load();
            toast(msg);
          }}
        />
      )}
      {editingCat && (
        <CategoryForm
          cat={editingCat}
          onClose={() => setEditingCat(null)}
          onSaved={async (msg) => {
            setEditingCat(null);
            await load();
            toast(msg);
          }}
        />
      )}
    </>
  );
}

function PriceInput({ value, onSave }: { value: number | null; onSave: (v: number) => void }) {
  const { t } = useT();
  const [v, setV] = useState(value === null ? '' : String(value));
  useEffect(() => setV(value === null ? '' : String(value)), [value]);
  const commit = () => {
    const n = Number(v);
    if (v !== '' && Number.isFinite(n) && n !== value) onSave(Math.round(n));
  };
  return (
    <label className="price-input">
      <input
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={t('Price in dinars')}
      />
      <span>DA</span>
    </label>
  );
}

function ItemForm({
  item, categories, onClose, onSaved,
}: {
  item: Partial<Item>; categories: Cat[]; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const toast = useToast();
  const { t } = useT();
  const [f, setF] = useState<Partial<Item>>(item);
  const [busy, setBusy] = useState(false);
  const [multi, setMulti] = useState((item.sizes?.length ?? 0) > 0);
  const set = (p: Partial<Item>) => setF((x) => ({ ...x, ...p }));
  const isNew = !item.id;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, price: multi ? null : f.price, sizes: multi ? f.sizes : [] };
      if (isNew) await api('POST', '/api/admin/items', body);
      else await api('PATCH', `/api/admin/items/${item.id}`, body);
      onSaved(isNew ? 'Dish added' : 'Dish saved');
    } catch (err) {
      toast((err as Error).message, 'err');
      setBusy(false);
    }
  };

  const action = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      onSaved(msg);
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  const sizes = f.sizes ?? [];
  const setSize = (i: number, p: Partial<Size>) => set({ sizes: sizes.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  return (
    <Modal title={isNew ? t('New dish') : t('Edit {name}', { name: tr(item.name, 'fr') })} onClose={onClose}>
      <form onSubmit={save} className="form">
        <TextFields label={t('Name')} value={f.name ?? {}} onChange={(name) => set({ name })} required />
        <TextFields label={t('Ingredients / description')} value={f.description ?? {}} onChange={(description) => set({ description })} multiline />

        <div className="grid2">
          <label>
            {t('Category')}
            <select value={f.categoryId} onChange={(e) => set({ categoryId: Number(e.target.value) })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {tr(c.name, 'fr')}
                </option>
              ))}
            </select>
          </label>
          {!multi && (
            <label>
              {t('Price (DA)')}
              <input
                inputMode="numeric"
                required
                value={f.price ?? ''}
                onChange={(e) => set({ price: e.target.value === '' ? null : Number(e.target.value.replace(/\D/g, '')) })}
              />
            </label>
          )}
        </div>

        <Switch checked={multi} onChange={(v) => { setMulti(v); if (v && sizes.length === 0) set({ sizes: [{ label: { fr: 'Normale' }, price: f.price ?? 0 }, { label: { fr: 'Large' }, price: 0 }] }); }} label={t('Several sizes or options with different prices')} />
        {multi && (
          <div className="sizes-edit">
            {sizes.map((s, i) => (
              <div key={i} className="size-row">
                <input placeholder={t('Size (FR)')} value={s.label.fr ?? ''} onChange={(e) => setSize(i, { label: { ...s.label, fr: e.target.value } })} />
                <input placeholder="الحجم (AR)" dir="rtl" value={s.label.ar ?? ''} onChange={(e) => setSize(i, { label: { ...s.label, ar: e.target.value } })} />
                <input placeholder={t('Size (EN)')} value={s.label.en ?? ''} onChange={(e) => setSize(i, { label: { ...s.label, en: e.target.value } })} />
                <input inputMode="numeric" placeholder="DA" value={s.price || ''} onChange={(e) => setSize(i, { price: Number(e.target.value.replace(/\D/g, '')) })} />
                <button type="button" className="icon-btn" onClick={() => set({ sizes: sizes.filter((_, j) => j !== i) })} aria-label={t('Remove size')}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="btn small" onClick={() => set({ sizes: [...sizes, { label: {}, price: 0 }] })}>
              {t('+ Add size')}
            </button>
          </div>
        )}

        <ImagePicker label={t('Photo')} value={f.imageId ?? null} onChange={(imageId) => set({ imageId })} />

        <fieldset className="tf">
          <legend>{t('Badges')}</legend>
          <div className="row-wrap">
            {(Object.keys(BADGE_LABELS) as Badge[]).map((b) => (
              <label key={b} className="check">
                <input
                  type="checkbox"
                  checked={f.badges?.includes(b) ?? false}
                  onChange={(e) => set({ badges: e.target.checked ? [...(f.badges ?? []), b] : (f.badges ?? []).filter((x) => x !== b) })}
                />
                {t(BADGE_LABELS[b])}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="row-wrap">
          <Switch checked={f.available ?? true} onChange={(available) => set({ available })} label={t('Available today')} />
          <Switch checked={f.visible ?? true} onChange={(visible) => set({ visible })} label={t('Shown on the menu')} />
        </div>

        <div className="form-foot">
          {!isNew && (
            <div className="row-wrap tight">
              <button type="button" className="btn small ghost" onClick={() => action(() => api('POST', `/api/admin/items/${item.id}/duplicate`), 'Copy created (hidden until you show it)')}>
                {t('Duplicate')}
              </button>
              <button
                type="button"
                className="btn small danger"
                onClick={() => confirm(t('Delete this dish? You can restore it later.')) && action(() => api('DELETE', `/api/admin/items/${item.id}`), 'Dish deleted')}
              >
                {t('Delete')}
              </button>
            </div>
          )}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? t('Saving…') : t('Save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryForm({ cat, onClose, onSaved }: { cat: Partial<Cat>; onClose: () => void; onSaved: (msg: string) => void }) {
  const toast = useToast();
  const { t } = useT();
  const [name, setName] = useState<Text>(cat.name ?? {});
  const [note, setNote] = useState<Text>(cat.note ?? {});
  const [visible, setVisible] = useState(cat.visible ?? true);
  const isNew = !cat.id;

  const go = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      onSaved(msg);
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  return (
    <Modal title={isNew ? t('New category') : t('Edit category')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          go(
            () => (isNew ? api('POST', '/api/admin/categories', { name, note }) : api('PATCH', `/api/admin/categories/${cat.id}`, { name, note, visible })),
            isNew ? 'Category added' : 'Category saved',
          );
        }}
      >
        <TextFields label={t('Name')} value={name} onChange={setName} required />
        <TextFields label={t('Short note under the title (optional)')} value={note} onChange={setNote} />
        {!isNew && <Switch checked={visible} onChange={setVisible} label={t('Shown on the menu')} />}
        <div className="form-foot">
          {!isNew && (
            <button
              type="button"
              className="btn small danger"
              onClick={() => confirm(t('Delete this category?')) && go(() => api('DELETE', `/api/admin/categories/${cat.id}`), 'Category deleted')}
            >
              {t('Delete')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button className="btn primary">{t('Save')}</button>
        </div>
      </form>
    </Modal>
  );
}
