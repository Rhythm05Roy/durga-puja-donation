import { useState } from 'react';
import { getErrorMessage } from '../lib/errors';
import type { Session } from '../lib/auth';
import { Diya } from './Ornament';

type Props = {
  title: string;
  hint?: string;
  sessionKey: string;
  loginFn: (uid: string, pw: string) => Promise<Session>;
  children: (session: Session) => React.ReactNode;
};

const ROLE_LABEL: Record<string, string> = {
  mainadmin: 'প্রধান অ্যাডমিন',
  subadmin: 'সাব-অ্যাডমিন',
  collector: 'সংগ্রাহক',
};

export default function LoginGate({ title, hint, sessionKey, loginFn, children }: Props) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });
  const [uid, setUid] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function tryLogin() {
    if (!uid.trim() || !pw) {
      setErr('ইউজার আইডি ও পাসওয়ার্ড দিন');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const s = await loginFn(uid.trim(), pw);
      sessionStorage.setItem(sessionKey, JSON.stringify(s));
      setSession(s);
      setUid('');
      setPw('');
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="animate-fadeUp">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-maroon-900 to-maroon-700 px-4 py-2.5 text-amber-100 shadow-card">
          <span className="text-sm">
            👤 {session.name}{' '}
            <span className="text-xs font-semibold text-amber-200">({ROLE_LABEL[session.role] ?? session.role})</span>
          </span>
          <button
            onClick={() => {
              sessionStorage.removeItem(sessionKey);
              setSession(null);
            }}
            className="rounded-lg px-2 py-1 text-xs underline underline-offset-2 transition hover:bg-white/10 hover:text-amber-300"
          >
            লগআউট
          </button>
        </div>
        {children(session)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md animate-fadeUp rounded-3xl border border-gold-200 bg-white p-6 shadow-card sm:p-8">
      <div className="text-center">
        <Diya size={44} className="mx-auto" />
        <h2 className="mt-2 font-serifbn text-xl font-bold text-maroon-800">{title}</h2>
        {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
      </div>
      <label className="mt-6 block text-sm font-semibold text-maroon-800">ইউজার আইডি</label>
      <input
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-gold-300 bg-linen px-3.5 py-3 outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
        placeholder="ইউজার আইডি লিখুন"
        autoComplete="username"
      />
      <label className="mt-4 block text-sm font-semibold text-maroon-800">পাসওয়ার্ড</label>
      <div className="relative mt-1.5">
        <input
          type={showPw ? 'text' : 'password'}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void tryLogin();
          }}
          className="w-full rounded-xl border border-gold-300 bg-linen px-3.5 py-3 pr-12 outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
          placeholder="পাসওয়ার্ড লিখুন"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-stone-400 transition hover:bg-gold-50 hover:text-maroon-700"
        >
          {showPw ? '🙈' : '👁️'}
        </button>
      </div>
      {err && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {err}
        </p>
      )}
      <button
        onClick={() => void tryLogin()}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-maroon-800 to-maroon-600 py-3.5 font-bold text-amber-200 shadow-card transition hover:brightness-110 active:scale-[.98] disabled:opacity-60"
      >
        {busy ? '⏳ যাচাই হচ্ছে...' : 'প্রবেশ করুন'}
      </button>
    </div>
  );
}
