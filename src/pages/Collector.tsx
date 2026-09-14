import { useState } from 'react';
import LoginGate from '../components/LoginGate';
import { collectorLogin, type Session } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fmtBnDate, formatTaka, todayISO, toBn, toEn } from '../lib/bn';
import { getErrorMessage } from '../lib/errors';

const inputCls =
  'mt-1.5 w-full rounded-xl border border-gold-300 bg-white px-3.5 py-3 outline-none transition placeholder:text-stone-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20';
const labelCls = 'block text-sm font-semibold text-maroon-800';

function Inner({ session }: { session: Session }) {
  const [name, setName] = useState('');
  const [present, setPresent] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    setOk('');
    const amt = parseInt(toEn(amount.replace(/[^০-৯0-9]/g, '')), 10);
    if (!name.trim()) return setErr('প্রণামিদাতার নাম লিখুন');
    if (!present.trim()) return setErr('বর্তমান ঠিকানা লিখুন');
    if (!Number.isFinite(amt) || amt <= 0) return setErr('সঠিক প্রণামির পরিমাণ লিখুন');
    if (!date) return setErr('তারিখ নির্বাচন করুন');
    setSending(true);
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase কনফিগার করা হয়নি (.env দেখুন)');
      const { error } = await supabase.from('field_collections').insert({
        name: name.trim(),
        present_address: present.trim(),
        donation_amount: amt,
        collector: session.name,
        collector_name: session.name,
        collector_username: session.username,
        collection_date: date,
      });
      if (error) throw error;
      setOk(`✅ ${formatTaka(amt)} সংরক্ষিত হয়েছে (${name.trim()}) — তারিখ: ${fmtBnDate(date)}`);
      setName('');
      setPresent('');
      setAmount('');
      setDate(todayISO());
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="animate-fadeUp rounded-3xl border border-gold-200 bg-white p-4 shadow-card sm:p-6">
      <h2 className="text-center font-serifbn text-xl font-bold text-maroon-800">🤝 মাঠ পর্যায়ে প্রণামি সংগ্রহ</h2>
      <p className="mt-1 text-center text-xs text-stone-500">
        সংগ্রাহক: <b>{session.name}</b> • আজ {toBn(new Date().toLocaleDateString('bn-BD'))}
      </p>
      {err && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">⚠️ {err}</p>}
      {ok && <p className="mt-3 rounded-xl border border-green-200 bg-green-50 p-2.5 text-sm text-green-700">{ok}</p>}
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className={labelCls}>প্রণামিদাতার নাম <span className="text-red-600">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="প্রণামিদাতার পুরো নাম" />
        </div>
        <div>
          <label className={labelCls}>বর্তমান ঠিকানা <span className="text-red-600">*</span></label>
          <textarea value={present} onChange={(e) => setPresent(e.target.value)} className={inputCls} rows={2} placeholder="এলাকা, থানা, জেলা" />
        </div>
        <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>প্রণামির পরিমাণ (৳) <span className="text-red-600">*</span></label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-maroon-500">৳</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className={`${inputCls} pl-8 font-bold`} placeholder="যেমন: ১০০০" />
          </div>
        </div>
          <div>
            <label className={labelCls}>তারিখ <span className="text-red-600">*</span></label>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-gradient-to-r from-maroon-800 to-maroon-600 py-3.5 font-bold text-amber-200 shadow-card transition hover:brightness-110 active:scale-[.98] disabled:opacity-60"
        >
          {sending ? '⏳ সংরক্ষণ হচ্ছে...' : '✅ সংরক্ষণ করুন'}
        </button>
      </form>
    </div>
  );
}

export default function CollectorPage() {
  return (
    <LoginGate
      title="প্রণামি সংগ্রহ — লগইন"
      hint="অ্যাডমিন-তৈরি সংগ্রাহক আইডি দিয়ে ঢুকুন"
      sessionKey="collector:auth"
      loginFn={collectorLogin}
    >
      {(session) => <Inner session={session} />}
    </LoginGate>
  );
}
