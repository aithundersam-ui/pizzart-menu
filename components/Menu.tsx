'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item, Lang, MenuData } from '@/lib/types';
import { DAY_NAMES, LABELS, LANG_SHORT, formatPrice, tr, type LabelKey } from '@/lib/i18n';
import { openState, type OpenState, algiersNow } from '@/lib/hours';

const img = (id: string | null) => (id ? `/api/img/${id}` : null);
const LANG_KEY = 'pizzart-lang';

const FONT_SETS = {
  classic: { head: "'Playfair Display', serif", script: "'Kaushan Script', cursive", body: "'DM Sans', sans-serif" },
  modern: { head: "'Poppins', sans-serif", script: "'Poppins', sans-serif", body: "'Poppins', sans-serif" },
  street: { head: "'Anton', sans-serif", script: "'Permanent Marker', cursive", body: "'Poppins', sans-serif" },
};

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٟ]/g, '');
}

export default function Menu({ data }: { data: MenuData }) {
  const { restaurant: r, branding: b, languages } = data;
  const enabled = languages.enabled.length ? languages.enabled : (['fr'] as Lang[]);
  const [lang, setLang] = useState<Lang>(languages.default);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<number | null>(data.categories[0]?.id ?? null);
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const [status, setStatus] = useState<OpenState | null>(null);
  const [table, setTable] = useState('');
  const chipsRef = useRef<HTMLDivElement>(null);

  const L = (k: LabelKey) => languages.labels?.[lang]?.[k] || LABELS[k][lang];
  const price = (p: number) => (
    <>
      <bdi dir="ltr">{formatPrice(p)}</bdi> {L('currency')}
    </>
  );

  // Language: ?lang=ar in the link, then the guest's last choice, then the default.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {}
    const wanted = (params.get('lang') || saved) as Lang | null;
    if (wanted && enabled.includes(wanted)) setLang(wanted);

    const t = (params.get('t') ?? '').replace(/[^\w-]/g, '').slice(0, 12);
    setTable(t);
    if (params.has('qr')) {
      try {
        if (!sessionStorage.getItem('pizzart-scan')) {
          sessionStorage.setItem('pizzart-scan', '1');
          navigator.sendBeacon?.('/api/track', JSON.stringify({ type: 'scan', table: t }));
        }
      } catch {}
      params.delete('qr');
      history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const tick = () => setStatus(openState(r.hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [r.hours]);

  // Highlight the category being read while scrolling.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(Number((top.target as HTMLElement).dataset.cat));
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    document.querySelectorAll('[data-cat]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [data.categories, query]);

  useEffect(() => {
    chipsRef.current?.querySelector('.chip.on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = openItem ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenItem(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItem]);

  const chooseLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  const showItem = (it: Item) => {
    setOpenItem(it);
    navigator.sendBeacon?.('/api/track', JSON.stringify({ type: 'item', id: it.id }));
  };

  const featured = useMemo(() => {
    for (const c of data.categories) for (const it of c.items) if (it.id === b.featuredItemId) return it;
    return null;
  }, [data.categories, b.featuredItemId]);

  const categories = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return data.categories;
    return data.categories
      .map((c) => ({
        ...c,
        items: c.items.filter((it) =>
          [it.name, it.description].some((t) => Object.values(t).some((v) => v && normalize(v).includes(q))),
        ),
      }))
      .filter((c) => c.items.length);
  }, [data.categories, query]);

  const fonts = FONT_SETS[b.font] ?? FONT_SETS.classic;
  const style = {
    '--primary': b.primary,
    '--accent': b.accent,
    '--bg': b.background,
    '--ink': b.text,
    '--f-head': fonts.head,
    '--f-script': fonts.script,
    '--f-body': fonts.body,
  } as React.CSSProperties;

  const itemPrice = (it: Item) =>
    it.sizes.length ? (
      <span className="from">
        {it.sizes.map((s, i) => (
          <span key={i}>
            {tr(s.label, lang)} {price(s.price)}
          </span>
        ))}
      </span>
    ) : it.price !== null ? (
      price(it.price)
    ) : null;

  const badges = (it: Item) => (
    <>
      {it.badges.map((x) => (
        <span key={x} className={`badge b-${x}`}>
          {L(x)}
        </span>
      ))}
      {!it.available && <span className="badge b-out">{L('soldOut')}</span>}
    </>
  );

  const today = status ? algiersNow().day : -1;
  const hero = featured ?? null;
  const heroImg = img(hero?.imageId ?? null) ?? img(b.coverImageId);

  return (
    <div className={`menu ${lang === 'ar' ? 'is-ar' : ''}`} style={style} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
      <header className="top">
        {enabled.length > 1 ? (
          <div className="langs" role="group" aria-label="Langue / اللغة / Language">
            {enabled.map((l) => (
              <button key={l} className={l === lang ? 'on' : ''} onClick={() => chooseLang(l)} lang={l}>
                {LANG_SHORT[l]}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {status && (
          <span className={`open ${status.open ? '' : 'is-closed'}`}>
            <i />
            {status.open ? (
              <>
                {L('open')} · {L('until')} <bdi dir="ltr">{status.until}</bdi>
              </>
            ) : (
              <>
                {L('closed')}
                {status.opensAt && (
                  <>
                    {' '}· {L('opensAt')} <bdi dir="ltr">{status.opensAt}</bdi>
                  </>
                )}
              </>
            )}
          </span>
        )}
      </header>

      <div className="head">
        {b.logoImageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="logo" src={img(b.logoImageId)!} alt={r.name} />
        ) : (
          <h1 className="logo-text">{r.name}</h1>
        )}
        {tr(r.slogan, lang) && <div className="slogan">— {tr(r.slogan, lang)} —</div>}
        {table && (
          <div className="table-tag">
            {L('table')} {table}
          </div>
        )}
      </div>

      {tr(r.announcement, lang) && <div className="announce">{tr(r.announcement, lang)}</div>}

      {hero && heroImg && !query && (
        <button className="hero" style={{ backgroundImage: `url(${heroImg})` }} onClick={() => showItem(hero)}>
          <span className="hero-cap">
            <span className="kick">{L('chef')}</span>
            <span className="hn">{tr(hero.name, lang)}</span>
          </span>
          {hero.price !== null && <span className="hp">{price(hero.price)}</span>}
        </button>
      )}

      <div className="sticky">
        <label className="search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L('search')} aria-label={L('search')} />
          {query && (
            <button className="clear" onClick={() => setQuery('')} aria-label={L('close')}>
              ×
            </button>
          )}
        </label>
        <nav className="chips" ref={chipsRef}>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className={`chip ${active === c.id ? 'on' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {tr(c.name, lang)}
            </a>
          ))}
          <a
            href="#info"
            className="chip"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {L('info')}
          </a>
        </nav>
      </div>

      <main>
        {categories.length === 0 && <p className="empty">{L('noResults')}</p>}
        {categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="paper">
            <h2>
              <span>{tr(c.name, lang)}</span>
            </h2>
            {tr(c.note, lang) && <p className="note">{tr(c.note, lang)}</p>}
            {c.items.map((it) => (
              <button key={it.id} className={`ld ${it.available ? '' : 'out'}`} onClick={() => showItem(it)}>
                {it.imageId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={img(it.imageId)!} alt="" loading="lazy" />
                )}
                <span className="ld-body">
                  <span className="ld-top">
                    <span className="nm">{tr(it.name, lang)}</span>
                    <span className="dots" />
                    <span className="pr">{itemPrice(it)}</span>
                  </span>
                  {tr(it.description, lang) && <span className="ds">{tr(it.description, lang)}</span>}
                  {(it.badges.length > 0 || !it.available) && <span className="bdg">{badges(it)}</span>}
                </span>
              </button>
            ))}
          </section>
        ))}

        <section id="info" className="info">
          <h2>
            <span>{L('info')}</span>
          </h2>
          <div className="actions">
            {r.phone && (
              <a className="btn primary" href={`tel:${r.phone.replace(/\s/g, '')}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z" />
                </svg>
                {L('call')} <bdi dir="ltr">{r.phone}</bdi>
              </a>
            )}
            {r.mapsUrl && (
              <a className="btn" href={r.mapsUrl} target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
                </svg>
                {L('directions')}
              </a>
            )}
          </div>
          {tr(r.address, lang) && <p className="addr">{tr(r.address, lang)}</p>}
          {tr(r.delivery, lang) && <p className="delivery">🛵 {tr(r.delivery, lang)}</p>}
          <div className="social">
            {r.instagram && (
              <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noopener">
                Instagram · <bdi dir="ltr">@{r.instagram}</bdi>
              </a>
            )}
            {r.facebook && (
              <a href={/^https?:/.test(r.facebook) ? r.facebook : `https://www.facebook.com/search/top?q=${encodeURIComponent(r.facebook)}`} target="_blank" rel="noopener">
                Facebook · <bdi dir="ltr">{r.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}</bdi>
              </a>
            )}
            {r.tiktok && (
              <a href={`https://www.tiktok.com/@${r.tiktok}`} target="_blank" rel="noopener">
                TikTok · <bdi dir="ltr">@{r.tiktok}</bdi>
              </a>
            )}
            {r.whatsapp && (
              <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '').replace(/^0/, '213')}`} target="_blank" rel="noopener">
                WhatsApp · <bdi dir="ltr">{r.whatsapp}</bdi>
              </a>
            )}
          </div>
          <h3>{L('hours')}</h3>
          <table className="hours">
            <tbody>
              {[6, 0, 1, 2, 3, 4, 5].map((d) => {
                const h = r.hours.find((x) => x.day === d);
                return (
                  <tr key={d} className={d === today ? 'today' : ''}>
                    <td>{DAY_NAMES[lang][d]}</td>
                    <td>
                      {!h || h.closed ? (
                        L('closed')
                      ) : (
                        <bdi dir="ltr">
                          {h.open} – {h.close}
                        </bdi>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="checker" aria-hidden />
          <p className="foot">
            {r.name} · {tr(r.address, lang)}
          </p>
        </section>
      </main>

      {openItem && (
        <div className="sheet-bg" onClick={() => setOpenItem(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={tr(openItem.name, lang)} onClick={(e) => e.stopPropagation()}>
            <button className="sheet-x" onClick={() => setOpenItem(null)} aria-label={L('close')}>
              ×
            </button>
            {openItem.imageId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sheet-img" src={img(openItem.imageId)!} alt={tr(openItem.name, lang)} />
            )}
            <div className="sheet-body">
              <div className="bdg">{badges(openItem)}</div>
              <h3>{tr(openItem.name, lang)}</h3>
              {tr(openItem.description, lang) && <p>{tr(openItem.description, lang)}</p>}
              {openItem.sizes.length ? (
                <ul className="sizes">
                  {openItem.sizes.map((s, i) => (
                    <li key={i}>
                      <span>{tr(s.label, lang)}</span>
                      <b>{price(s.price)}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                openItem.price !== null && <div className="sheet-price">{price(openItem.price)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
