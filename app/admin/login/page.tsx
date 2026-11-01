'use client';

import { useState } from 'react';
import { api } from '@/lib/client';
import { LangSwitch, useT } from '@/components/admin/i18n';

export default function Login() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(true);

  return (
    <div className="login-wrap">
      <form
        className="card login"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api('POST', '/api/auth/login', { email, password });
            location.href = '/admin';
          } catch (err) {
            setError(t((err as Error).message));
            setBusy(false);
          }
        }}
      >
        <div className="login-top">
          <LangSwitch />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img className="login-logo" src="/api/logo" alt="PizzArt" onError={() => setLogo(false)} /> : <div className="brand-text big">PizzArt</div>}
        <div className="login-sub">— {t('admin')} —</div>
        <label>
          {t('Email')}
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('Password')}
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? t('Signing in…') : t('Sign in')}
        </button>
      </form>
    </div>
  );
}
