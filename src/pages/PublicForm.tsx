import { memo, useCallback, useMemo, useState } from 'react';
import { PAYMENT_BRAND, PAYMENT_LABELS, PAYMENT_NUMBERS, PRICES, SITE, formatPayNumber, localPayNumber } from '../config';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';
import { formatTaka, toBn, toEn } from '../lib/bn';
import QtyStepper from '../components/QtyStepper';
import { Diya, OrnamentDivider } from '../components/Ornament';
import { WalletIcon } from '../components/WalletIcon';
import { Card, Field, inputBase, PrimaryButton, SectionHead } from '../components/ui';

/* ─── Memoized donation card — নাম টাইপ করলেও পুনরায় render হয় না ─── */
const DonateOptionCard = memo(function DonateOptionCard({
  icon, title, desc, unitPrice, checked, onToggle, qty, onQty, required,
}: {
  icon: string; title: string; desc: string; unitPrice?: number;
  checked: boolean; onToggle: () => void;
  qty?: number; onQty?: (n: number) => void; required?: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`cursor-pointer select-none rounded-2xl border-2 p-3.5 transition sm:p-4 ${
        checked
          ? 'border-maroon-600 bg-gradient-to-br from-gold-50 to-white shadow-card'
          : 'border-stone-200 bg-white hover:border-gold-400 hover:shadow-card'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold-200 bg-linen text-2xl">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-maroon-900">
            {title}
            {required && <span className="text-maroon-500"> *</span>}
          </p>
          <p className="text-xs text-stone-500">{desc}</p>
          {unitPrice !== undefined && (
            <span className="mt-1 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-maroon-700">
              {formatTaka(unitPrice)} / পিস
            </span>
          )}
        </div>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition ${
            checked ? 'border-maroon-700 bg-maroon-700 text-amber-200' : 'border-stone-300 text-transparent'
          }`}
        >
          ✓
        </span>
      </div>
      {checked && qty !== undefined && onQty && (
        <div
          className="mt-3 flex items-center justify-between border-t border-dashed border-gold-300 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <p className="text-xs text-stone-500">পরিমাণ</p>
            <p className="text-lg font-bold text-maroon-800">{formatTaka(qty * (unitPrice ?? 0))}</p>
          </div>
          <QtyStepper value={qty} onChange={onQty} />
        </div>
      )}
    </div>
  );
});

export default function PublicForm() {
  const [name, setName] = useState('');
  const [present, setPresent] = useState('');
  const [permanent, setPermanent] = useState('');
  const [medOn, setMedOn] = useState(true);
  const [medAmt, setMedAmt] = useState('');
  const [geetaOn, setGeetaOn] = useState(false);
  const [geetaQty, setGeetaQty] = useState(1);
  const [treeOn, setTreeOn] = useState(false);
  const [treeQty, setTreeQty] = useState(1);
  const [clothOn, setClothOn] = useState(false);
  const [clothQty, setClothQty] = useState(1);
  const [pay, setPay] = useState('');
  const [phone, setPhone] = useState('');
  const [txn, setTxn] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const medNum = useMemo(() => {
    const n = parseInt(toEn(medAmt.replace(/[^০-৯0-9]/g, '')), 10);
    return Number.isFinite(n) ? n : 0;
  }, [medAmt]);

  const total = useMemo(
    () =>
      (medOn ? medNum : 0) +
      (geetaOn ? geetaQty * PRICES.geeta : 0) +
      (treeOn ? treeQty * PRICES.tree : 0) +
      (clothOn ? clothQty * PRICES.cloth : 0),
    [medOn, medNum, geetaOn, geetaQty, treeOn, treeQty, clothOn, clothQty]
  );

  // stable toggles so memoized cards skip re-render
  const toggleMed = useCallback(() => setMedOn((v) => !v), []);
  const toggleGeeta = useCallback(() => setGeetaOn((v) => !v), []);
  const toggleTree = useCallback(() => setTreeOn((v) => !v), []);
  const toggleCloth = useCallback(() => setClothOn((v) => !v), []);

  function validate(): string[] {
    const e: string[] = [];
    if (!name.trim()) e.push('নাম আবশ্যক');
    if (!present.trim()) e.push('বর্তমান ঠিকানা আবশ্যক');
    if (medOn && medNum <= 0) e.push('ঔষধের জন্য টাকার পরিমাণ আবশ্যক');
    if (!medOn && !geetaOn && !treeOn && !clothOn) e.push('কমপক্ষে একটি প্রণামির অপশন বেছে নিন');
    if (!pay) e.push('পেমেন্ট মাধ্যম বেছে নিন');
    if (!toEn(phone).replace(/\D/g, '').match(/^01\d{9}$/)) e.push('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
    if (!txn.trim()) e.push('ট্রানজেকশন আইডি আবশ্যক');
    if (total <= 0) e.push('মোট টাকার পরিমাণ শূন্য হতে পারবে না');
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSending(true);
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase কনফিগার করা হয়নি (.env দেখুন)');
      const { error } = await supabase.from('public_donations').insert({
        name: name.trim(),
        present_address: present.trim(),
        permanent_address: permanent.trim() || null,
        medicine_amount: medOn ? medNum : 0,
        donate_geeta: geetaOn,
        geeta_qty: geetaOn ? geetaQty : 0,
        donate_tree: treeOn,
        tree_qty: treeOn ? treeQty : 0,
        donate_cloth: clothOn,
        cloth_qty: clothOn ? clothQty : 0,
        total_amount: total,
        payment_medium: pay,
        sender_phone: toEn(phone).replace(/\D/g, ''),
        transaction_id: txn.trim(),
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrors([getErrorMessage(err)]);
    } finally {
      setSending(false);
    }
  }

  // ─── ✅ সফল প্রণামি রসিদ ───
  if (done) {
    return (
      <div className="relative animate-fadeUp overflow-hidden rounded-3xl border border-gold-200 bg-white shadow-pop">
        <div className="alpana-band" />
        <div className="p-6 text-center sm:p-10">
          <Diya size={56} className="mx-auto" />
          <p className="mt-3 text-xs font-bold tracking-wide text-maroon-600">— শ্রীশ্রী দুর্গাপূজা {SITE.yearBn} —</p>
          <h2 className="mt-2 font-serifbn text-2xl font-bold text-maroon-800 sm:text-3xl">
            ধন্যবাদ, {name}! 🙏
          </h2>
          <p className="mt-4 px-2 leading-8 text-stone-700">
            ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দুর্গা মন্দির কমিটির পক্ষ থেকে আপনাকে জানাই আন্তরিক ধন্যবাদ। মা দুর্গার শ্রীচরণে আপনার ভক্তিপূর্ণ প্রণামি সফলভাবে গৃহীত হয়েছে।পরমেশ্বরী মায়ের অশেষ কৃপায় আপনার ও আপনার পরিবারের সকলের জীবন সুখ, শান্তি, সুস্বাস্থ্য ও সমৃদ্ধিতে ভরে উঠুক। 
          </p>
          <OrnamentDivider className="mx-auto mt-5 max-w-xs" />
          <div className="mx-auto mt-5 inline-block rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 px-8 py-4">
            <p className="text-sm text-stone-500">মোট প্রণামি</p>
            <p className="text-4xl font-bold text-maroon-700">{formatTaka(total)}</p>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <WalletIcon wallet={pay} size={16} /> {PAYMENT_LABELS[pay]} • TrxID: {txn}
            </p>
          </div>
          <p className="mt-6 font-serifbn font-bold text-maroon-800">— {SITE.org} পরিবার 🙏</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-maroon-700 px-8 py-3 font-bold text-amber-200 shadow-card transition hover:bg-maroon-800 active:scale-95"
          >
            নতুন প্রণামি করুন
          </button>
        </div>
        <div className="alpana-band" />
      </div>
    );
  }

  return (
    <form id="pronami-form" onSubmit={submit} className="animate-fadeUp space-y-4 sm:space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-900 via-maroon-700 to-[#a05217] p-5 text-center shadow-pop sm:p-8">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,194,34,.25), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,194,34,.15), transparent 70%)' }}
        />
        <p className="relative font-serifbn text-xl font-bold text-amber-50 [text-shadow:0_1px_3px_rgba(0,0,0,.35)] sm:text-2xl">
          দুর্গাপূজায় আপনার প্রণামি
        </p>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-amber-100 sm:text-base">
          {SITE.greeting}
        </p>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="mb-1 font-bold">⚠️ অনুগ্রহ করে ঠিক করুন:</p>
          <ul className="ml-5 list-disc">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ১. ব্যক্তিগত তথ্য */}
      <Card>
        <SectionHead step="১" title="আপনার তথ্য" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="নাম" required className="sm:col-span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputBase} placeholder="আপনার পুরো নাম" />
          </Field>
          <Field label="বর্তমান ঠিকানা" required className="sm:col-span-2">
            <textarea
              value={present}
              onChange={(e) => setPresent(e.target.value)}
              className={inputBase}
              rows={2}
              placeholder="বাসা/হোল্ডিং, রোড, এলাকা, থানা, জেলা"
            />
          </Field>
          <Field label="স্থায়ী ঠিকানা" optional className="sm:col-span-2">
            <textarea
              value={permanent}
              onChange={(e) => setPermanent(e.target.value)}
              className={inputBase}
              rows={2}
              placeholder="গ্রামের বাড়ির ঠিকানা"
            />
          </Field>
        </div>
      </Card>

      {/* ২. প্রণামি নির্বাচন */}
      <Card>
        <SectionHead step="২" title="প্রণামির ধরন বেছে নিন" hint="একাধিক অপশন একসাথে বেছে নেওয়া যায়" />

        {/* ঔষধ (amount input ভেতরে, তাই আলাদা) */}
        <div className="mt-4 grid gap-3">
          <DonateOptionCard
            icon="💊" title="ঔষধ প্রণামি" desc="অসহায় রোগীদের জন্য ঔষধের টাকা" required
            checked={medOn} onToggle={toggleMed}
          />
          {medOn && (
            <div className="-mt-1 ml-4 mr-4 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50/60 p-3.5">
              <Field label="ঔষধের জন্য টাকার পরিমাণ (৳)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-maroon-600">৳</span>
                  <input
                    value={medAmt}
                    onChange={(e) => setMedAmt(e.target.value)}
                    inputMode="numeric"
                    className={`${inputBase} pl-8 text-lg font-bold`}
                    placeholder="যেমন: ৫০০"
                  />
                </div>
              </Field>
              {medNum > 0 && (
                <p className="mt-2 text-right text-sm font-bold text-maroon-700">= {formatTaka(medNum)}</p>
              )}
            </div>
          )}

          <DonateOptionCard
            icon="📕" title="গীতা বই" desc="ধর্মীয় জ্ঞান বিতরণ" unitPrice={PRICES.geeta}
            checked={geetaOn} onToggle={toggleGeeta} qty={geetaQty} onQty={setGeetaQty}
          />
          <DonateOptionCard
            icon="🌳" title="গাছ" desc="পরিবেশের জন্য বৃক্ষরোপণ" unitPrice={PRICES.tree}
            checked={treeOn} onToggle={toggleTree} qty={treeQty} onQty={setTreeQty}
          />
          <DonateOptionCard
            icon="👕" title="কাপড়" desc="পূজায় নতুন কাপড় বিতরণ" unitPrice={PRICES.cloth}
            checked={clothOn} onToggle={toggleCloth} qty={clothQty} onQty={setClothQty}
          />
        </div>

        {/* Inline total — সব স্ক্রিনে */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-maroon-900 to-maroon-700 p-4 text-amber-50 shadow-card sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">সর্বমোট প্রণামি</p>
            <p className="text-2xl font-bold sm:text-3xl">{formatTaka(total)}</p>
          </div>
          <div className="space-y-0.5 text-right text-xs leading-5 text-amber-100">
            {medOn && <div>💊 ঔষধ: {formatTaka(medNum)}</div>}
            {geetaOn && <div>📕 গীতা × {toBn(geetaQty)} = {formatTaka(geetaQty * PRICES.geeta)}</div>}
            {treeOn && <div>🌳 গাছ × {toBn(treeQty)} = {formatTaka(treeQty * PRICES.tree)}</div>}
            {clothOn && <div>👕 কাপড় × {toBn(clothQty)} = {formatTaka(clothQty * PRICES.cloth)}</div>}
            {!medOn && !geetaOn && !treeOn && !clothOn && <div>উপরে অপশন বেছে নিন 👆</div>}
          </div>
        </div>
      </Card>

      {/* ৩. পেমেন্ট */}
      <Card>
        <SectionHead step="৩" title="পেমেন্টের তথ্য" hint="প্রণামি পাঠাতে নিচের নম্বরে সেন্ড মানি করুন" />
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {Object.keys(PAYMENT_LABELS).map((k) => {
            const active = pay === k;
            const brand = PAYMENT_BRAND[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPay(k)}
                aria-pressed={active}
                style={active ? { borderColor: brand, backgroundColor: `${brand}12`, boxShadow: `0 0 0 3px ${brand}26` } : undefined}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 bg-white px-2 py-3.5 font-bold transition active:scale-95 ${
                  active ? 'text-maroon-900' : 'border-stone-200 text-stone-600 hover:border-gold-300'
                }`}
              >
                <span className="grid h-10 w-full place-items-center">
                  <WalletIcon wallet={k} size={k === 'bkash' ? 24 : 36} />
                </span>
                <span className="text-sm">{PAYMENT_LABELS[k]}</span>
                <span className={`text-[10px] font-bold ${active ? '' : 'text-transparent'}`} style={{ color: active ? brand : undefined }}>
                  ✓ নির্বাচিত
                </span>
              </button>
            );
          })}
        </div>

        {pay && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <WalletIcon wallet={pay} size={38} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-stone-500">{PAYMENT_LABELS[pay]} (সেন্ড মানি)</p>
                <p className="text-lg font-bold tracking-wider text-maroon-800">{formatPayNumber(PAYMENT_NUMBERS[pay])}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(localPayNumber(PAYMENT_NUMBERS[pay]));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 rounded-xl bg-maroon-700 px-4 py-2 text-xs font-bold text-amber-200 transition hover:bg-maroon-800 active:scale-95"
            >
              {copied ? '✓ কপি হয়েছে' : 'কপি'}
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="যে নম্বর থেকে টাকা পাঠিয়েছেন" required>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className={inputBase}
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Field label="ট্রানজেকশন আইডি (TrxID)" required>
            <input
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              className={`${inputBase} uppercase`}
              placeholder="যেমন: 9HXK2LQM4T"
            />
          </Field>
        </div>
      </Card>

      {/* Submit — মোবাইল ও ডেস্কটপে একই */}
      <PrimaryButton
        type="submit"
        disabled={sending}
        className="w-full !py-4 text-lg !text-amber-100"
      >
        {sending ? '⏳ জমা হচ্ছে...' : `🪔 ${formatTaka(total)} প্রণামি নিশ্চিত করুন`}
      </PrimaryButton>
      <p className="text-center text-xs font-semibold text-stone-500">
        জমা দিলে আপনার তথ্য নিরাপদে সংরক্ষিত হবে 🙏
      </p>
    </form>
  );
}
