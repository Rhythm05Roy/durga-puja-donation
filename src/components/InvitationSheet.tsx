import { forwardRef } from 'react';
import { EVENTS, PUJA_SCHEDULE, SITE } from '../config';
import { formatTaka, todayBn } from '../lib/bn';
import Logo from './Logo';

/* ─── A4 @96dpi — ডাউনলোডের জন্য নির্দিষ্ট মাপের আমন্ত্রণপত্র ───
   পুরো লেআউট inline style-এ, যাতে স্ক্রিন সাইজ/breakpoint নির্বিশেষে
   আউটপুট হুবহু এক থাকে।
   html2canvas-এর সীমাবদ্ধতা মাথায় রেখে:
   • box-shadow ব্যবহার করা হয়নি (আঁকা হয় না) — বর্ডার/গ্রেডিয়েন্টে গভীরতা
   • সব অলংকরণ (পাড়, ফ্রেম, কোণা) একটিমাত্র SVG-তে, CSS transform ছাড়া
   • বাংলা লেখায় বড় letter-spacing নেই — যুক্তাক্ষর ভেঙে যায় */
export const SHEET_W = 794;
export const SHEET_H = 1123;

const C = {
  paper: '#FFFDF7',
  cream: '#FDF8EA',
  gold: '#e0b455',
  goldDeep: '#b08a3e',
  goldDark: '#8f6c31',
  goldPale: '#f0e1bb',
  maroon: '#7a1e29',
  maroonDeep: '#651822',
  maroonMid: '#8d2430',
  ink: '#4a1520',
  muted: '#7d6155',
};

const BAND = 11;
const FRAME_X = 20;
const FRAME_Y = 22;

/** পাড় + দ্বৈত ফ্রেম + চার কোণার নকশা — এক SVG-তে, তাই ক্যাপচারেও নিখুঁত */
function FrameOverlay() {
  const corner = (
    <>
      <path d="M0 30C0 13.4 13.4 0 30 0" stroke={C.goldDeep} strokeWidth="1.4" fill="none" />
      <path d="M0 46C0 20.6 20.6 0 46 0" stroke={C.gold} strokeWidth="1" strokeDasharray="3 5" fill="none" />
      <path d="M13 13c9.4 0 17 7.6 17 17 0-9.4 7.6-17 17-17-9.4 0-17-7.6-17-17 0 9.4-7.6 17-17 17Z" fill={C.gold} opacity=".8" />
      <circle cx="30" cy="30" r="2.8" fill={C.maroonMid} />
      <circle cx="9" cy="9" r="2" fill={C.goldDeep} />
    </>
  );
  const corners: { t: string }[] = [
    { t: `translate(${FRAME_X},${FRAME_Y})` },
    { t: `translate(${SHEET_W - FRAME_X},${FRAME_Y}) scale(-1,1)` },
    { t: `translate(${FRAME_X},${SHEET_H - FRAME_Y}) scale(1,-1)` },
    { t: `translate(${SHEET_W - FRAME_X},${SHEET_H - FRAME_Y}) scale(-1,-1)` },
  ];
  return (
    <svg
      width={SHEET_W}
      height={SHEET_H}
      viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
      fill="none"
      aria-hidden="true"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <pattern id="alpana" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="30" height="30" fill={C.paper} />
          <rect x="0" width="10" height="30" fill={C.maroonMid} />
          <rect x="10" width="10" height="30" fill={C.gold} />
        </pattern>
      </defs>

      {/* উপর ও নিচের আলপনা পাড় */}
      <rect x="0" y="0" width={SHEET_W} height={BAND} fill="url(#alpana)" />
      <rect x="0" y={SHEET_H - BAND} width={SHEET_W} height={BAND} fill="url(#alpana)" />

      {/* দ্বৈত সোনালি ফ্রেম */}
      <rect
        x={FRAME_X} y={FRAME_Y} width={SHEET_W - FRAME_X * 2} height={SHEET_H - FRAME_Y * 2}
        rx="6" stroke={C.maroonMid} strokeWidth="2"
      />
      <rect
        x={FRAME_X + 7} y={FRAME_Y + 7} width={SHEET_W - (FRAME_X + 7) * 2} height={SHEET_H - (FRAME_Y + 7) * 2}
        rx="3" stroke={C.gold} strokeWidth="1"
      />

      {corners.map((c, i) => (
        <g key={i} transform={c.t}>
          {corner}
        </g>
      ))}
    </svg>
  );
}

function Lotus({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 14) / 26} viewBox="0 0 26 14" fill="none" aria-hidden="true">
      <path d="M13 0c2.4 4 4 6.7 4 8.8a4 4 0 1 1-8 0C9 6.7 10.6 4 13 0Z" fill={C.gold} />
      <path d="M0 11c3-2.1 6-2.1 8.3 0M26 11c-3-2.1-6-2.1-8.3 0" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Rule({ marginTop = 0 }: { marginTop?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop }} aria-hidden="true">
      <span style={{ height: 1, flex: 1, background: `linear-gradient(90deg, rgba(224,180,85,0), ${C.gold})` }} />
      <Lotus />
      <span style={{ height: 1, flex: 1, background: `linear-gradient(270deg, rgba(224,180,85,0), ${C.gold})` }} />
    </div>
  );
}

/** হালকা মন্ডলা জলছাপ — সব রঙ explicit, currentColor নয় */
function Watermark() {
  const spokes = Array.from({ length: 16 }).map((_, i) => {
    const a = (i * Math.PI) / 8;
    return {
      x1: 100 + Math.cos(a) * 62, y1: 100 + Math.sin(a) * 62,
      x2: 100 + Math.cos(a) * 94, y2: 100 + Math.sin(a) * 94,
    };
  });
  const petals = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * Math.PI) / 6;
    return { cx: 100 + Math.cos(a) * 44, cy: 100 + Math.sin(a) * 44 };
  });
  return (
    <svg width="460" height="460" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="95" stroke={C.maroonMid} strokeWidth="1" />
      <circle cx="100" cy="100" r="80" stroke={C.maroonMid} strokeWidth="1" strokeDasharray="2 5" />
      <circle cx="100" cy="100" r="62" stroke={C.maroonMid} strokeWidth="1" />
      <circle cx="100" cy="100" r="26" stroke={C.maroonMid} strokeWidth="1" />
      <circle cx="100" cy="100" r="9" fill={C.maroonMid} />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={C.maroonMid} strokeWidth="1" />
      ))}
      {petals.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="10" stroke={C.maroonMid} strokeWidth="1" />
      ))}
    </svg>
  );
}

/** html2canvas-এ overflow:hidden দিলে বাংলা লেখার মাথা/নিচ কেটে যায় —
    তাই CSS ellipsis-এর বদলে লেখাই ছেঁটে দেওয়া হয় */
function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export type SheetProps = {
  name: string;
  total: number;
  payLabel: string;
  txn: string;
  /** "💊 ঔষধ ৳৫০০" ধরনের সংক্ষিপ্ত তালিকা */
  breakdown: string[];
};

/** ডাউনলোডযোগ্য প্রিমিয়াম আমন্ত্রণপত্র (A4 — ৭৯৪×১১২৩px) */
const InvitationSheet = forwardRef<HTMLDivElement, SheetProps>(function InvitationSheet(
  { name, total, payLabel, txn, breakdown },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: SHEET_W,
        height: SHEET_H,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        background: C.paper,
        color: C.ink,
        fontFamily: "'Tiro Bangla', 'Hind Siliguri', serif",
      }}
    >
      <FrameOverlay />

      {/* জলছাপ */}
      <div style={{ position: 'absolute', left: '50%', top: 340, marginLeft: -230, opacity: 0.045 }}>
        <Watermark />
      </div>

      {/* মূল অংশ */}
      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '32px 58px 28px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={78} />
        </div>

        <p style={{ margin: '6px 0 0', fontSize: 12, letterSpacing: '.05em', color: C.goldDeep, fontWeight: 700 }}>
          ওঁ শ্রীশ্রী দুর্গায়ৈ নমঃ
        </p>

        <h1 style={{ margin: '9px 0 0', fontSize: 27, lineHeight: 1.3, fontWeight: 700, color: C.maroonDeep }}>
          {SITE.org}
        </h1>

        {/* সুবর্ণ জয়ন্তী রিবন */}
        <div
          style={{
            width: 340, height: 44, margin: '13px auto 0',
            borderRadius: 22, border: `1px solid ${C.goldDark}`,
            background: `linear-gradient(90deg, ${C.goldDeep} 0%, #f6e3ad 50%, ${C.goldDeep} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, color: C.maroonDeep }}>সুবর্ণ জয়ন্তী · ৫০ বছর</span>
        </div>

        <p style={{ margin: '11px 0 0', fontSize: 15, fontWeight: 600, color: C.maroon }}>
          শারদীয় দুর্গাপূজা {SITE.yearBn}
        </p>

        <Rule marginTop={16} />

        {/* প্রণামি রসিদ */}
        <p style={{ margin: '16px 0 0', fontSize: 12.5, fontWeight: 700, color: C.goldDeep }}>প্রণামি রসিদ</p>
        <p style={{ margin: '5px 0 0', fontSize: 26, fontWeight: 700, color: C.maroonDeep, lineHeight: 1.35, whiteSpace: 'nowrap' }}>
          {clip(name, 34)}
        </p>
        <p style={{ margin: '9px auto 0', maxWidth: 600, fontSize: 13, lineHeight: '25px', color: '#6b4a42' }}>
          মা দুর্গার শ্রীচরণে আপনার ভক্তিপূর্ণ প্রণামি সাদরে গৃহীত হয়েছে। পরমেশ্বরী মায়ের অশেষ কৃপায়
          আপনার ও আপনার পরিবারের সকলের জীবন সুখ, শান্তি, সুস্বাস্থ্য ও সমৃদ্ধিতে ভরে উঠুক।
        </p>

        {/* টাকার প্যানেল */}
        <div
          style={{
            marginTop: 14, display: 'flex', alignItems: 'stretch',
            border: `1.5px solid ${C.gold}`, borderRadius: 14, overflow: 'hidden',
            background: `linear-gradient(180deg, #FFFDF4 0%, ${C.cream} 100%)`,
            textAlign: 'left',
          }}
        >
          <div style={{ width: 300, padding: '13px 20px', borderRight: `1px dashed ${C.gold}` }}>
            <p style={{ margin: 0, fontSize: 11.5, color: C.muted, fontWeight: 700 }}>মোট প্রণামি</p>
            <p style={{ margin: '2px 0 0', fontSize: 34, fontWeight: 700, lineHeight: 1.2, color: C.maroon }}>
              {formatTaka(total)}
            </p>
          </div>
          <div style={{ flex: 1, padding: '13px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {[
              { k: 'পেমেন্ট মাধ্যম', v: payLabel },
              { k: 'ট্রানজেকশন আইডি', v: txn },
              { k: 'তারিখ', v: todayBn() },
            ].map((r) => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, lineHeight: '21px' }}>
                <span style={{ color: C.muted }}>{r.k}</span>
                <span style={{ fontWeight: 700, color: C.maroonDeep }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {breakdown.length > 0 && (
          <p style={{ margin: '9px 0 0', fontSize: 11, color: C.muted }}>{breakdown.join('   ·   ')}</p>
        )}

        {/* সেবা ও কর্মসূচি */}
        <Rule marginTop={12} />
        <p style={{ margin: '13px 0 0', fontSize: 15, fontWeight: 700, color: C.maroonDeep }}>সেবা ও কর্মসূচি</p>
        <div style={{ marginTop: 9, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'left' }}>
          {EVENTS.map((ev, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                border: `1px solid ${C.goldPale}`, borderRadius: 10,
                background: '#FFFCF3', padding: '7px 10px', overflow: 'hidden',
              }}
            >
              <span
                style={{
                  width: 27, height: 27, flexShrink: 0, borderRadius: 14,
                  border: `1px solid ${C.goldPale}`, background: '#FAF2DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}
              >
                {ev.icon}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.maroon, lineHeight: '17px' }}>
                  {ev.title}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: C.muted, lineHeight: '17px', whiteSpace: 'nowrap' }}>
                  {clip(ev.desc, 52)}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* সময়সূচী */}
        <p style={{ margin: '13px 0 0', fontSize: 15, fontWeight: 700, color: C.maroonDeep }}>
          পূজার সময়সূচী {SITE.yearBn}
        </p>
        <div style={{ marginTop: 8, border: `1px solid ${C.goldPale}`, borderRadius: 10, overflow: 'hidden', textAlign: 'left' }}>
          {PUJA_SCHEDULE.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '2px 14px', fontSize: 11.5, lineHeight: '19px',
                background: i % 2 ? '#FFFCF3' : '#FBF4E2',
                borderTop: i ? `1px solid ${C.goldPale}` : 'none',
              }}
            >
              <span style={{ fontWeight: 700, color: C.maroon }}>{s.event}</span>
              <span style={{ color: C.muted }}>
                {s.date} ({s.day})
              </span>
            </div>
          ))}
        </div>

        {/* পাদটীকা */}
        <Rule marginTop={10} />
        <p style={{ margin: '10px 0 0', fontSize: 13.5, fontWeight: 700, color: C.maroonDeep, lineHeight: '20px' }}>
          শুভ শারদীয়া 🙏
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, lineHeight: '16px' }}>
          বিনীত — {SITE.org} পরিবার
        </p>
      </div>
    </div>
  );
});

export default InvitationSheet;
