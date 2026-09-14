import { useEffect, useMemo, useState } from 'react';
import LoginGate from '../components/LoginGate';
import { PAYMENT_LABELS } from '../config';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { exportCSV, fmtBnDate, formatTaka, toBn, toEn } from '../lib/bn';
import { adminLogin, type Session } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';
import { WalletIcon } from '../components/WalletIcon';
import { Alert, Card, Field, inputBase, PanelBody, PanelHead, PrimaryButton } from '../components/ui';
import type { AppUser, FieldCollection, PublicDonation, UserLog, VerificationLog } from '../lib/types';

type Tab = 'online' | 'field' | 'users' | 'logs';

const ROLE_LABEL: Record<string, string> = {
  subadmin: 'সাব-অ্যাডমিন',
  collector: 'সংগ্রাহক',
};

// ─── ডেটা লোড ───────────────────────────────────────────────
function useFetch(tab: Tab, refreshKey: number) {
  const [rows, setRows] = useState<(PublicDonation & FieldCollection)[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      try {
        if (!isSupabaseConfigured) throw new Error('Supabase কনফিগার করা হয়নি (.env দেখুন)');
        const table = tab === 'online' ? 'public_donations' : 'field_collections';
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);
        if (error) throw error;
        setRows((data ?? []) as never[]);
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, refreshKey]);
  return { rows, loading, err };
}

// ─── ইউজার ম্যানেজমেন্ট ─────────────────────────────────────
function UserManager({ session }: { session: Session }) {
  const isMain = session.role === 'mainadmin';
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [uid, setUid] = useState('');
  const [pw, setPw] = useState('');
  const [role, setRole] = useState<'collector' | 'subadmin'>('collector');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase.rpc('app_list_users');
      if (error) throw error;
      setUsers((data ?? []) as AppUser[]);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // সব অ্যাডমিন (প্রধান + সাব) সব ইউজারের বিবরণ দেখতে পারেন;
  // শুধু প্রধান অ্যাডমিন সাব-অ্যাডমিন মুছতে পারেন
  const visible = users;

  async function create() {
    setErr('');
    setOk('');
    const phoneEn = toEn(phone).replace(/\D/g, '');
    if (!name.trim()) return setErr('নাম লিখুন');
    if (!address.trim()) return setErr('ঠিকানা লিখুন');
    if (phone.trim() && !phoneEn.match(/^01\d{9}$/))
      return setErr('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX) বা খালি রাখুন');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uid.trim()))
      return setErr('ইউজার আইডি ৩-২০ অক্ষরের হতে হবে (ইংরেজি অক্ষর/সংখ্যা/আন্ডারস্কোর)');
    if (pw.length < 4) return setErr('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন');
    if (!isMain && role === 'subadmin') return setErr('অনুমতি নেই!');
    setSaving(true);
    try {
      const { error } = await supabase.rpc('app_create_user', {
        p_username: uid.trim(),
        p_password: pw,
        p_role: role,
        p_name: name.trim(),
        p_address: address.trim(),
        p_phone: phoneEn || null,
        p_created_by: session.username,
        p_admin_name: session.name,
      });
      if (error) throw error;
      setOk(`✅ ${ROLE_LABEL[role]} তৈরি হয়েছে — নাম: ${name.trim()}, ইউজার আইডি: ${uid.trim().toLowerCase()}`);
      setName('');
      setAddress('');
      setPhone('');
      setUid('');
      setPw('');
      await load();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: AppUser) {
    if (!window.confirm(`"${u.name}" (${u.username}) কে মুছে ফেলতে চান? এটি ফেরানো যাবে না।`)) return;
    setErr('');
    setOk('');
    try {
      const { data, error } = await supabase.rpc('app_delete_user', {
        p_username: u.username,
        p_admin_username: session.username,
        p_admin_name: session.name,
      });
      if (error) throw error;
      if (!data || data < 1) throw new Error('ইউজার পাওয়া যায়নি — রিফ্রেশ করে আবার চেষ্টা করুন');
      setOk(`🗑️ ${u.name} মুছে ফেলা হয়েছে`);
      await load();
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  }

  return (
    <div className="space-y-4">
      {/* নতুন ইউজার তৈরি */}
      {!showCreate ? (
        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-bold text-maroon-900">
                {isMain ? 'সাব-অ্যাডমিন / সংগ্রাহক' : 'সংগ্রাহক'} তৈরি করুন
              </p>
              <p className="text-xs text-stone-500">ইউজার আইডি ও পাসওয়ার্ড দিয়ে তিনি লগইন করবেন</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="whitespace-nowrap rounded-xl bg-maroon-700 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-maroon-800 active:scale-95"
            >
              ➕ নতুন যোগ করুন
            </button>
          </div>
        </Card>
      ) : (
        <Card>
        <PanelHead
          icon="➕"
          title={`নতুন ${isMain ? 'সাব-অ্যাডমিন / সংগ্রাহক' : 'সংগ্রাহক'} তৈরি করুন`}
          sub="ইউজার আইডি ও পাসওয়ার্ড দিয়ে তিনি লগইন করবেন"
        />
        {err && <div className="mt-3"><Alert kind="error">⚠️ {err}</Alert></div>}
        {ok && <div className="mt-3"><Alert kind="ok">{ok}</Alert></div>}
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="নাম" required>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputBase} placeholder="পুরো নাম (বাংলায়)" />
          </Field>
          <Field label="ঠিকানা" required>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputBase} placeholder="বর্তমান ঠিকানা" />
          </Field>
          <Field label="মোবাইল নম্বর" optional>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputBase} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="ইউজার আইডি" required>
            <input value={uid} onChange={(e) => setUid(e.target.value)} className={inputBase} placeholder="যেমন: Tonay2026" autoComplete="off" />
          </Field>
          <Field label="পাসওয়ার্ড" required>
            <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} className={inputBase} placeholder="কমপক্ষে ৪ অক্ষর" autoComplete="off" />
          </Field>
          {isMain && (
            <Field label="ভূমিকা" required>
              <select value={role} onChange={(e) => setRole(e.target.value as 'collector' | 'subadmin')} className={inputBase}>
                <option value="collector">সংগ্রাহক (মাঠে প্রণামি সংগ্রহ করবে)</option>
                <option value="subadmin">সাব-অ্যাডমিন (প্যানেল দেখাশোনা)</option>
              </select>
            </Field>
          )}
        </div>
        <PrimaryButton onClick={() => void create()} disabled={saving} className="mt-4 w-full sm:w-auto sm:px-10">
          {saving ? '⏳ তৈরি হচ্ছে...' : '✅ তৈরি করুন'}
        </PrimaryButton>
        <button
          onClick={() => { setShowCreate(false); setErr(''); setOk(''); }}
          className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
        >
          বাতিল করুন
        </button>
      </Card>
      )}

      {/* ইউজার তালিকা */}
      <Card>
        <PanelHead
          icon="👥"
          title="ইউজার তালিকা"
          sub={isMain ? `সাব-অ্যাডমিন: ${toBn(users.filter((u) => u.role === 'subadmin').length)} • সংগ্রাহক: ${toBn(users.filter((u) => u.role === 'collector').length)}` : undefined}
          action={
            <button onClick={() => void load()} className="rounded-lg bg-gold-100 px-3 py-1.5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-200">🔄 রিফ্রেশ</button>
          }
        />
        <PanelBody loading={loading}>
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((u) => (
            <article key={u.id} className="flex items-start justify-between gap-3 rounded-2xl border border-gold-200 bg-linen/60 p-3.5">
              <div>
                <p className="font-bold text-maroon-900">
                  {u.name}{' '}
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${u.role === 'subadmin' ? 'bg-maroon-700 text-amber-200' : 'bg-gold-100 text-maroon-800'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-600">🆔 {u.username} {u.phone && <>• 📞 {toBn(u.phone)}</>}</p>
                <p className="mt-0.5 text-xs text-stone-500">📍 {u.address}</p>
                <p className="mt-0.5 text-[11px] text-stone-400">তৈরি করেছেন: {u.created_by || '—'}</p>
              </div>
              {(!isMain && u.role !== 'collector') ? (
                <span className="whitespace-nowrap rounded-lg bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-400">
                  মুছতে পারবেন না
                </span>
              ) : (
                <button
                  onClick={() => void remove(u)}
                  className="whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-95"
                >
                  🗑️ মুছুন
                </button>
              )}
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <p className="py-6 text-center text-stone-400">কোনো ইউজার নেই — উপরে তৈরি করুন</p>
          )}
        </div>
        </PanelBody>
      </Card>
    </div>
  );
}

// ─── যাচাই লগ ────────────────────────────────────────────────
function LogsPanel() {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase.rpc('app_list_logs');
      if (error) throw error;
      setLogs((data ?? []) as VerificationLog[]);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <PanelHead
        icon="📋"
        title="যাচাই লগ"
        sub="কোন অ্যাডমিন কোন প্রণামি যাচাই/অযাচাই করেছেন — সব অ্যাডমিন দেখতে পারেন"
        action={
          <button onClick={() => void load()} className="rounded-lg bg-gold-100 px-3 py-1.5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-200">🔄 রিফ্রেশ</button>
        }
      />
      {err && <div className="mt-3"><Alert kind="error">⚠️ {err}</Alert></div>}
      <PanelBody loading={loading}>
        <div className="grid gap-2 md:grid-cols-2">
          {logs.map((l) => (
            <article
              key={l.id}
              className={`rounded-xl border-l-4 p-3 ${l.action === 'verified' ? 'border-green-500 bg-green-50/60' : 'border-amber-500 bg-amber-50/60'}`}
            >
              <p className="text-sm font-bold text-maroon-900">
                {l.action === 'verified' ? '✅' : '⏸️'} {l.record_name} — {formatTaka(l.amount)}
              </p>
              <p className="mt-0.5 text-xs text-stone-600">
                {l.action === 'verified' ? 'যাচাই করেছেন' : 'অযাচাই করেছেন'}: <b>{l.admin_name}</b> ({l.admin_username})
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                {l.table_name === 'online' ? '📝 অনলাইন প্রণামি' : '🤝 মাঠ সংগ্রহ'} • {l.created_at ? new Date(l.created_at).toLocaleString('bn-BD') : ''}
              </p>
            </article>
          ))}
          {!loading && logs.length === 0 && !err && <p className="py-6 text-center text-stone-400">কোনো লগ নেই</p>}
        </div>
      </PanelBody>
    </Card>
  );
}

// ─── ইউজার লগ (কে কোন সাব-অ্যাডমিন/সংগ্রাহক তৈরি/মুছেছেন) ───
function UserLogsPanel() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase.rpc('app_list_user_logs');
      if (error) throw error;
      setLogs((data ?? []) as UserLog[]);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <PanelHead
        icon="🧾"
        title="ইউজার লগ"
        sub="কোন অ্যাডমিন কোন সাব-অ্যাডমিন/সংগ্রাহক তৈরি বা মুছেছেন — সব অ্যাডমিন দেখতে পারেন"
        action={
          <button onClick={() => void load()} className="rounded-lg bg-gold-100 px-3 py-1.5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-200">🔄 রিফ্রেশ</button>
        }
      />
      {err && <div className="mt-3"><Alert kind="error">⚠️ {err}</Alert></div>}
      <PanelBody loading={loading}>
        <div className="grid gap-2 md:grid-cols-2">
          {logs.map((l) => (
            <article
              key={l.id}
              className={`rounded-xl border-l-4 p-3 ${l.action === 'created' ? 'border-maroon-500 bg-maroon-50/60' : 'border-red-400 bg-red-50/50'}`}
            >
              <p className="text-sm font-bold text-maroon-900">
                {l.action === 'created' ? '➕' : '🗑️'} {l.name}{' '}
                <span className="rounded-lg bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-maroon-700">
                  {ROLE_LABEL[l.role] ?? l.role}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-stone-600">
                {l.action === 'created' ? 'তৈরি করেছেন' : 'মুছেছেন'}: <b>{l.admin_name}</b> ({l.admin_username})
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                🆔 {l.username}{l.phone ? ` • 📞 ${toBn(l.phone)}` : ''} • {l.created_at ? new Date(l.created_at).toLocaleString('bn-BD') : ''}
              </p>
            </article>
          ))}
          {!loading && logs.length === 0 && !err && <p className="py-6 text-center text-stone-400">কোনো লগ নেই</p>}
        </div>
      </PanelBody>
    </Card>
  );
}

// ─── ড্যাশবোর্ড ─────────────────────────────────────────────
function Inner({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('online');
  const [refreshKey, setRefreshKey] = useState(0);
  const [q, setQ] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [verifyErr, setVerifyErr] = useState('');
  const { rows, loading, err } = useFetch(tab === 'users' ? 'online' : tab, refreshKey);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (payFilter && (r as PublicDonation).payment_medium !== payFilter) return false;
      if (!needle) return true;
      return [r.name, (r as PublicDonation).sender_phone, (r as PublicDonation).transaction_id, r.present_address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, q, payFilter]);

  const verifiedAmt = useMemo(
    () =>
      filtered
        .filter((r) => r.verified)
        .reduce((s, r) => s + Number((r as PublicDonation).total_amount ?? (r as FieldCollection).donation_amount ?? 0), 0),
    [filtered]
  );

  const unverifiedAmt = useMemo(
    () =>
      filtered
        .filter((r) => !r.verified)
        .reduce((s, r) => s + Number((r as PublicDonation).total_amount ?? (r as FieldCollection).donation_amount ?? 0), 0),
    [filtered]
  );

  async function toggleVerify(row: PublicDonation & FieldCollection) {
    setVerifyErr('');
    const { error } = await supabase.rpc('app_set_verified', {
      p_table: tab === 'online' ? 'online' : 'field',
      p_id: row.id,
      p_verified: !row.verified,
      p_admin_username: session.username,
      p_admin_name: session.name,
    });
    if (error) setVerifyErr(getErrorMessage(error));
    else setRefreshKey((k) => k + 1);
  }

  function download() {
    if (tab === 'online') {
      exportCSV(
        'online-pronami.csv',
        ['নাম', 'বর্তমান ঠিকানা', 'স্থায়ী ঠিকানা', 'ঔষধ ৳', 'গীতা', 'গীতা সংখ্যা', 'গাছ', 'গাছ সংখ্যা', 'কাপড়', 'কাপড় সংখ্যা', 'মোট ৳', 'মাধ্যম', 'মোবাইল', 'TrxID', 'যাচাই', 'যাচাই করেছেন', 'তারিখ'],
        filtered.map((r) => {
          const d = r as unknown as PublicDonation;
          return [
            d.name, d.present_address, d.permanent_address, d.medicine_amount,
            d.donate_geeta ? 'হ্যাঁ' : 'না', d.geeta_qty,
            d.donate_tree ? 'হ্যাঁ' : 'না', d.tree_qty,
            d.donate_cloth ? 'হ্যাঁ' : 'না', d.cloth_qty,
            d.total_amount, PAYMENT_LABELS[d.payment_medium] ?? d.payment_medium,
            d.sender_phone, d.transaction_id,
            d.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত', d.verified_by || '', d.created_at,
          ];
        })
      );
    } else {
      exportCSV(
        'field-pronami.csv',
        ['নাম', 'বর্তমান ঠিকানা', 'টাকা', 'সংগ্রাহক', 'সংগ্রাহক আইডি', 'যাচাই', 'যাচাই করেছেন', 'তারিখ', 'জমার সময়'],
        filtered.map((r) => {
          const f = r as unknown as FieldCollection;
          return [
            f.name, f.present_address, f.donation_amount,
            f.collector_name || f.collector, f.collector_username,
            f.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত', f.verified_by || '',
            f.collection_date, f.created_at,
          ];
        })
      );
    }
  }

  const tabs: [Tab, string][] = [
    ['online', '📝 অনলাইন প্রণামি'],
    ['field', '🤝 মাঠ সংগ্রহ'],
    ['users', '👥 ইউজার'],
    ['logs', '📋 যাচাই লগ'],
  ];

  return (
    <div className="animate-fadeUp space-y-4">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gold-200 bg-white p-1.5 shadow-card sm:grid-cols-4">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPayFilter('');
              setQ('');
            }}
            className={`rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              tab === t
                ? 'bg-gradient-to-r from-maroon-800 to-maroon-600 text-amber-200 shadow-card'
                : 'text-maroon-800 hover:bg-gold-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== 'users' && tab !== 'logs' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 p-4 text-amber-50 shadow-card">
              <p className="text-xs font-semibold text-amber-200">{tab === 'online' ? '📝 অনলাইন প্রণামি' : '🤝 মাঠ সংগ্রহ'} — মোট</p>
              <p className="text-2xl font-bold">{toBn(filtered.length)} <span className="text-sm font-normal">টি</span></p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-4 text-emerald-50 shadow-card">
              <p className="text-xs font-semibold text-emerald-200">✅ যাচাইকৃত মোট টাকা</p>
              <p className="text-2xl font-bold">{formatTaka(verifiedAmt)}</p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white shadow-card lg:col-span-1">
              <div>
                <p className="text-xs font-semibold text-amber-50">⏳ অযাচাইকৃত টাকা</p>
                <p className="text-2xl font-bold">{formatTaka(unverifiedAmt)}</p>
              </div>
              <p className="text-right text-[11px] font-semibold leading-4 text-amber-50">
                বাকি: {toBn(filtered.filter((r) => !r.verified).length)} টি<br />
                সম্পন্ন: {toBn(filtered.filter((r) => r.verified).length)} টি
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-gold-200 bg-white p-3 shadow-card sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="🔍 নাম / মোবাইল / TrxID দিয়ে খুঁজুন..."
                className="flex-1 rounded-xl border border-gold-300 bg-linen px-3.5 py-2.5 outline-none transition placeholder:text-stone-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
              />
              {tab === 'online' && (
                <select
                  value={payFilter}
                  onChange={(e) => setPayFilter(e.target.value)}
                  className="rounded-xl border border-gold-300 bg-white px-3 py-2.5 outline-none focus:border-gold-400"
                >
                  <option value="">সব মাধ্যম</option>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRefreshKey((k) => k + 1)} className="rounded-lg bg-gold-100 px-3 py-1.5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-200">🔄 রিফ্রেশ</button>
              <button onClick={download} className="rounded-lg bg-maroon-700 px-3 py-1.5 text-sm font-semibold text-amber-200 transition hover:bg-maroon-800">⬇️ CSV ডাউনলোড</button>
            </div>
          </div>

          <div className="min-h-[300px]">
            {loading && (
              <p className="grid min-h-[300px] place-items-center text-stone-500">⏳ লোড হচ্ছে...</p>
            )}
            {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">⚠️ {err}</p>}
            {verifyErr && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">⚠️ যাচাই: {verifyErr}</p>}

            <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((r) => {
              const d = r as unknown as PublicDonation;
              const f = r as unknown as FieldCollection;
              const amt = Number(d.total_amount ?? f.donation_amount ?? 0);
              return (
                <article key={r.id} className="rounded-2xl border border-gold-200 border-l-4 border-l-gold-400 bg-white p-3.5 shadow-card transition hover:shadow-pop sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-maroon-900">{r.name}</p>
                      <p className="text-xs text-stone-500">📍 {r.present_address}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-lg bg-gold-50 px-2 py-0.5 font-bold text-maroon-700">{formatTaka(amt)}</span>
                  </div>
                  {tab === 'online' ? (
                    <div className="mt-2 flex flex-wrap gap-x-3 text-xs leading-5 text-stone-600">
                      {d.medicine_amount > 0 && <span>💊 ঔষধ {formatTaka(d.medicine_amount)}</span>}
                      {d.donate_geeta && <span>📕 গীতা × {toBn(d.geeta_qty)}</span>}
                      {d.donate_tree && <span>🌳 গাছ × {toBn(d.tree_qty)}</span>}
                      {d.donate_cloth && <span>👕 কাপড় × {toBn(d.cloth_qty)}</span>}
                      <span className="inline-flex items-center gap-1">
                        <WalletIcon wallet={d.payment_medium} size={16} />
                        {PAYMENT_LABELS[d.payment_medium] ?? d.payment_medium}
                      </span>
                      <span>📱 {toBn(d.sender_phone)}</span>
                      <span className="font-mono text-[11px] uppercase">🧾 {d.transaction_id}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-stone-600 leading-5 flex flex-wrap gap-x-3">
                      <span>🤝 সংগ্রাহক: <b>{f.collector_name || f.collector || '—'}</b></span>
                      {f.collection_date && <span>📅 {fmtBnDate(f.collection_date)}</span>}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {r.created_at ? new Date(r.created_at).toLocaleString('bn-BD') : ''}
                    </span>
                    <button
                      onClick={() => void toggleVerify(r)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                        r.verified
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-gold-100'
                      }`}
                    >
                      {r.verified ? '✅ যাচাইকৃত' : '☐ যাচাই করুন'}
                    </button>
                  </div>
                  {r.verified && r.verified_by && (
                    <p className="mt-1.5 text-[11px] text-green-700 bg-green-50 rounded-lg px-2 py-1">
                      ✔️ যাচাই করেছেন: {r.verified_by}
                      {r.verified_at ? ` • ${fmtBnDate(r.verified_at)}` : ''}
                    </p>
                  )}
                </article>
              );
            })}
            {!loading && filtered.length === 0 && !err && (
              <p className="py-10 text-center text-stone-400">কোনো তথ্য পাওয়া যায়নি 🪔</p>
            )}
            </div>
          </div>
        </>
      )}

      {tab === 'users' && <UserManager session={session} />}
      {tab === 'logs' && (
        <div className="space-y-4">
          <LogsPanel />
          <UserLogsPanel />
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <LoginGate
      title="অ্যাডমিন ড্যাশবোর্ড"
      hint="প্রধান অ্যাডমিন বা সাব-অ্যাডমিন আইডি দিয়ে ঢুকুন"
      sessionKey="admin:auth"
      loginFn={adminLogin}
    >
      {(session) => <Inner session={session} />}
    </LoginGate>
  );
}
