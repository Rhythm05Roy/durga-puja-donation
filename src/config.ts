// ─── Central site configuration ─────────────────────────────
// সব দাম / পেমেন্ট নম্বর এখানে বদলান।

export const SITE = {
  title: 'শারদীয় দুর্গাপূজা প্রণামি সংগ্রহ',
  org: 'ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দূর্গা মন্দির',
  yearBn: '১৪৩৩',
  greeting: 'শারদীয় শুভেচ্ছা! মা দুর্গার আশীর্বাদে আপনার প্রণামি পৌঁছে যাবে সঠিক হাতে।',
};

// প্রতিটি প্রণামি-আইটেমের একক মূল্য (টাকা)
export const PRICES = {
  geeta: 250, // গীতা বই প্রতি পিস
  tree: 100, // গাছ প্রতি পিস
  cloth: 350, // কাপড় প্রতি সেট
};

// টাকা পাঠানোর (রিসিভার) নম্বর — বিকাশ / রকেট / নগদ
export const PAYMENT_NUMBERS: Record<string, string> = {
  bkash: '+8801956508898',
  rocket: '+8801956508898',
  nagad: '+8801956508898',
};

export const PAYMENT_LABELS: Record<string, string> = {
  bkash: 'বিকাশ',
  rocket: 'রকেট',
  nagad: 'নগদ',
};

/** ওয়ালেট ব্র্যান্ড কালার (UI-তে) */
export const PAYMENT_BRAND: Record<string, string> = {
  bkash: '#E2136E',
  rocket: '#8C3494',
  nagad: '#F6921E',
};

/** '+8801956508898' → '+880 1956-508898' (দেখানোর জন্য) */
export function formatPayNumber(n: string): string {
  const d = n.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('880')) return `+880 ${d.slice(3, 7)}-${d.slice(7)}`;
  return n;
}

/** কপি করার জন্য লোকাল ফরম্যাট: '01956508898' */
export function localPayNumber(n: string): string {
  const d = n.replace(/\D/g, '');
  return d.startsWith('880') ? '0' + d.slice(3) : d;
}

export const AUTH = {
  adminUser: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  adminPass: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
  collectorUser: import.meta.env.VITE_COLLECTOR_USERNAME || 'collector',
  collectorPass: import.meta.env.VITE_COLLECTOR_PASSWORD || 'collect123',
};
