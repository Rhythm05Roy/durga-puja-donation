import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PAYMENT_BRAND, PAYMENT_LABELS, PAYMENT_NUMBERS, PRICES, SITE, EVENTS, PUJA_SCHEDULE, formatPayNumber, localPayNumber } from '../config';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';
import { formatTaka, toBn, toEn } from '../lib/bn';
import { downloadSheetPdf, downloadSheetPng, prewarmExport } from '../lib/exportSheet';
import QtyStepper from '../components/QtyStepper';
import InvitationSheet, { SHEET_W } from '../components/InvitationSheet';
import { OrnamentDivider } from '../components/Ornament';
import Logo from '../components/Logo';
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<'png' | 'pdf' | null>(null);
  const [downloadErr, setDownloadErr] = useState<{ msg: string; detail?: string } | null>(null);
  const [name, setName] = useState('');
  const [present, setPresent] = useState('');
  const [permanent, setPermanent] = useState('');
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
      medNum +
      (geetaOn ? geetaQty * PRICES.geeta : 0) +
      (treeOn ? treeQty * PRICES.tree : 0) +
      (clothOn ? clothQty * PRICES.cloth : 0),
    [medNum, geetaOn, geetaQty, treeOn, treeQty, clothOn, clothQty]
  );

  // stable toggles so memoized cards skip re-render
  const toggleGeeta = useCallback(() => setGeetaOn((v) => !v), []);
  const toggleTree = useCallback(() => setTreeOn((v) => !v), []);
  const toggleCloth = useCallback(() => setClothOn((v) => !v), []);

  function validate(): string[] {
    const e: string[] = [];
    if (!name.trim()) e.push('নাম আবশ্যক');
    if (!present.trim()) e.push('বর্তমান ঠিকানা আবশ্যক');
    if (medNum <= 0) e.push('ঔষধের জন্য টাকার পরিমাণ আবশ্যক');
    if (!geetaOn && !treeOn && !clothOn && medNum <= 0) e.push('কমপক্ষে একটি প্রণামির অপশন বেছে নিন');
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
        medicine_amount: medNum,
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

  // রসিদ স্ক্রিনে পৌঁছালেই ক্যাপচার লাইব্রেরিগুলো আগেভাগে নামিয়ে রাখি —
  // বাটনে ক্লিকের সময় অপেক্ষা করতে হয় না, আর নতুন ডেপ্লয়ের সাথে
  // chunk হারিয়ে যাওয়ার ঝুঁকিও কমে
  useEffect(() => {
    if (done) prewarmExport();
  }, [done]);

  // ─── ডাউনলোড: অফ-স্ক্রিন A4 আমন্ত্রণপত্র থেকে ছবি/PDF ───
  const fileBase = useMemo(() => {
    const slug = name.trim().replace(/\s+/g, '-').slice(0, 30);
    return `durga-puja-${SITE.yearBn}-invitation${slug ? `-${slug}` : ''}`;
  }, [name]);

  const breakdown = useMemo(() => {
    const list: string[] = [];
    if (medNum > 0) list.push(`💊 ঔষধ ${formatTaka(medNum)}`);
    if (geetaOn) list.push(`📕 গীতা × ${toBn(geetaQty)} = ${formatTaka(geetaQty * PRICES.geeta)}`);
    if (treeOn) list.push(`🌳 বৃক্ষ × ${toBn(treeQty)} = ${formatTaka(treeQty * PRICES.tree)}`);
    if (clothOn) list.push(`👕 বস্ত্র × ${toBn(clothQty)} = ${formatTaka(clothQty * PRICES.cloth)}`);
    return list;
  }, [medNum, geetaOn, geetaQty, treeOn, treeQty, clothOn, clothQty]);

  async function runDownload(kind: 'png' | 'pdf') {
    const node = sheetRef.current;
    if (!node || downloading) return;
    setDownloading(kind);
    setDownloadErr(null);
    try {
      if (kind === 'png') {
        await downloadSheetPng(node, `${fileBase}.png`);
      } else {
        await downloadSheetPdf(node, `${fileBase}.pdf`, `${SITE.org} — আমন্ত্রণপত্র ${SITE.yearBn}`);
      }
    } catch (err) {
      console.error('Download failed:', err);
      const detail = getErrorMessage(err);
      // নতুন ডেপ্লয়ের পর পুরোনো ট্যাব থেকে চেষ্টা করলে chunk লোড হয় না
      const stale = /dynamically imported module|Importing a module script|Failed to fetch|ChunkLoadError/i.test(detail);
      setDownloadErr(
        stale
          ? { msg: 'সাইটটি আপডেট হয়েছে — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।' }
          : { msg: 'ডাউনলোড করা যায়নি। আবার চেষ্টা করুন অথবা স্ক্রিনশট নিন।', detail }
      );
    } finally {
      setDownloading(null);
    }
  }

  // ─── ✅ সফল প্রণামি রসিদ + আমন্ত্রণ ───
  if (done) {
    return (
      <>
      {/* অফ-স্ক্রিন A4 আমন্ত্রণপত্র — শুধু ডাউনলোডের জন্য রেন্ডার হয়।
          অ্যানিমেটেড কনটেইনারের বাইরে রাখা হয়েছে যাতে ক্যাপচারের সময়
          transform/opacity ক্যাপচারে প্রভাব না ফেলে। */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ position: 'absolute', top: 0, left: -99999, width: SHEET_W, zIndex: -1 }}
      >
        <InvitationSheet
          ref={sheetRef}
          name={name.trim()}
          total={total}
          payLabel={PAYMENT_LABELS[pay] ?? '—'}
          txn={txn.trim()}
          breakdown={breakdown}
        />
      </div>

      <div className="animate-fadeUp space-y-4">
        {/* On-screen receipt */}
        <div className="relative rounded-3xl border-2 border-gold-400 bg-[#fdf6e3] shadow-pop">
          {/* Top Band */}
          <div className="alpana-band" />

          <div className="p-5 text-center sm:p-8">
            <Logo size={76} className="mx-auto" />

            <h1 className="mt-3 font-serifbn text-xl font-bold text-maroon-800 sm:text-2xl">
              {SITE.org}
            </h1>

            {/* Jubilee Banner — full-width golden highlight */}
            <div className="mx-auto mt-3 max-w-sm overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 py-2 shadow-lg" style={{ boxShadow: '0 0 20px rgba(251,191,36,.5), 0 0 40px rgba(251,191,36,.25)' }}>
              <p className="font-serifbn text-sm font-bold tracking-wide text-white [text-shadow:0_2px_4px_rgba(0,0,0,.3)]">সুবর্ণ জয়ন্তী</p>
              <p className="text-2xl font-black text-maroon-900 [text-shadow:0_1px_2px_rgba(255,255,255,.5)]">৫০ বছর</p>
            </div>

            <p className="mt-2 text-sm font-semibold text-maroon-600">শ্রীশ্রী দুর্গাপূজা {SITE.yearBn}</p>

            <OrnamentDivider className="mx-auto mt-4 max-w-xs" />

            {/* Thank You */}
            <p className="mt-4 font-serifbn text-lg font-bold text-maroon-800">
              ধন্যবাদ, {name}! 🙏
            </p>
            <p className="mt-2 mx-auto max-w-md text-sm leading-7 text-stone-600">
              মা দুর্গার শ্রীচরণে আপনার ভক্তিপূর্ণ প্রণামি সফলভাবে গৃহীত হয়েছে।
              পরমেশ্বরী মায়ের অশেষ কৃপায় আপনার ও আপনার পরিবারের সকলের জীবন সুখ, শান্তি, সুস্বাস্থ্য ও সমৃদ্ধিতে ভরে উঠুক।
            </p>

            {/* Donation Summary */}
            <div className="mx-auto mt-4 w-fit max-w-full rounded-2xl border-2 border-gold-400 bg-gold-50 px-6 py-3">
              <p className="text-xs text-stone-500">মোট প্রণামি</p>
              <p className="text-3xl font-bold text-maroon-700">{formatTaka(total)}</p>
              <p className="mt-1 text-[11px] text-stone-500">
                {PAYMENT_LABELS[pay]} • TrxID: {txn}
              </p>
            </div>

            <OrnamentDivider className="mx-auto mt-4 max-w-xs" />

            {/* Invitation */}
            <div className="mt-4 text-left mx-auto max-w-md">
              <p className="text-sm leading-7 text-stone-700 text-center italic">
                {SITE.invitationIntro}
              </p>

              {/* Events */}
              <div className="mt-3 space-y-2">
                {EVENTS.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-gold-50/80 p-2.5">
                    <span className="mt-0.5 text-lg">{ev.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-maroon-800">{ev.title}</p>
                      <p className="text-[11px] text-stone-500">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <OrnamentDivider className="mx-auto mt-4 max-w-[200px]" />

              {/* Puja Schedule */}
              <p className="mt-3 text-center font-serifbn font-bold text-maroon-800 text-sm">পূজার সময়সূচী {SITE.yearBn}</p>
              <div className="mt-2 space-y-1">
                {PUJA_SCHEDULE.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-maroon-50 px-3 py-1.5 text-[11px]">
                    <span className="font-bold text-maroon-800">{s.event}</span>
                    <span className="text-stone-500">{s.date} ({s.day})</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 font-serifbn font-bold text-maroon-800 text-sm">— {SITE.org} পরিবার 🙏</p>
          </div>
          <div className="alpana-band" />
        </div>

        {/* Download Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => void runDownload('png')}
            disabled={downloading !== null}
            className="flex-1 rounded-xl border-2 border-maroon-600 bg-white py-3 font-bold text-maroon-700 shadow-card transition hover:bg-maroon-50 active:scale-95 disabled:opacity-50"
          >
            {downloading === 'png' ? '⏳ তৈরি হচ্ছে...' : '🖼️ ছবি ডাউনলোড'}
          </button>
          <button
            onClick={() => void runDownload('pdf')}
            disabled={downloading !== null}
            className="flex-1 rounded-xl bg-maroon-700 py-3 font-bold text-amber-200 shadow-card transition hover:bg-maroon-800 active:scale-95 disabled:opacity-50"
          >
            {downloading === 'pdf' ? '⏳ তৈরি হচ্ছে...' : '📄 PDF ডাউনলোড'}
          </button>
        </div>
        <p className="text-center text-xs text-stone-500">
          ডাউনলোডে পাবেন সম্পূর্ণ এক পাতার (A4) সাজানো আমন্ত্রণপত্র — ছাপার উপযোগী।
        </p>
        {downloadErr && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-sm text-red-700">
            <p>{downloadErr.msg}</p>
            {downloadErr.detail && (
              <p className="mt-1 break-words text-[11px] leading-4 text-red-500">{downloadErr.detail}</p>
            )}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-xl border border-stone-300 bg-white py-3 font-semibold text-stone-600 transition hover:bg-stone-50"
        >
          নতুন প্রণামি করুন
        </button>
      </div>
      </>
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

        {/* ঔষধ (required) */}
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border-2 border-maroon-600 bg-gradient-to-br from-gold-50 to-white p-3.5 shadow-card sm:p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold-200 bg-linen text-2xl">
                💊
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-maroon-900">
                  ঔষধ প্রণামি <span className="text-maroon-500">*</span>
                </p>
                <p className="text-xs text-stone-500">অসহায় রোগীদের জন্য ঔষধের টাকা</p>
              </div>
            </div>
            <div className="mt-3 ml-4 mr-4">
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
          </div>

          <DonateOptionCard
            icon="📕" title="গীতা বই" desc="ধর্মীয় জ্ঞান বিতরণ" unitPrice={PRICES.geeta}
            checked={geetaOn} onToggle={toggleGeeta} qty={geetaQty} onQty={setGeetaQty}
          />
          <DonateOptionCard
            icon="🌳" title="বৃক্ষ" desc="পরিবেশের জন্য বৃক্ষরোপণ" unitPrice={PRICES.tree}
            checked={treeOn} onToggle={toggleTree} qty={treeQty} onQty={setTreeQty}
          />
          <DonateOptionCard
            icon="👕" title="বস্ত্র" desc="পূজায় নতুন বস্ত্র বিতরণ" unitPrice={PRICES.cloth}
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
            <div>💊 ঔষধ: {formatTaka(medNum)}</div>
            {geetaOn && <div>📕 গীতা × {toBn(geetaQty)} = {formatTaka(geetaQty * PRICES.geeta)}</div>}
            {treeOn && <div>🌳 বৃক্ষ × {toBn(treeQty)} = {formatTaka(treeQty * PRICES.tree)}</div>}
            {clothOn && <div>👕 বস্ত্র × {toBn(clothQty)} = {formatTaka(clothQty * PRICES.cloth)}</div>}
          </div>
        </div>
      </Card>

      {/* ৩. পেমেন্ট */}
      <Card>
        <SectionHead step="৩" title="পেমেন্টের তথ্য" hint="প্রণামি পাঠাতে নিচের নম্বরে সেন্ড মানি করুন" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
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
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-white px-4 py-5 font-bold transition active:scale-95 ${
                  active ? 'text-maroon-900' : 'border-stone-200 text-stone-600 hover:border-gold-300'
                }`}
              >
                <span className="grid h-12 w-full place-items-center">
                  <WalletIcon wallet={k} size={36} />
                </span>
                <span className="text-base">{PAYMENT_LABELS[k]}</span>
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
