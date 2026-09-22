// ─── Central site configuration ─────────────────────────────

export const SITE = {
  title: 'শারদীয় দুর্গাপূজা প্রণামি সংগ্রহ',
  org: 'ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দূর্গা মন্দির',
  jubilee: 'সুবর্ণ জয়ন্তী (৫০ বছর)',
  yearBn: '১৪৩৩',
  greeting: 'শারদীয় শুভেচ্ছা! মা দুর্গার আশীর্বাদে আপনার প্রণামি পৌঁছে যাবে সঠিক হাতে।',
  invitationIntro: 'ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দুর্গা পূজোর ৫০ বছর (সুবর্ণ জয়ন্তী) কে স্মরণীয় করে রাখার লক্ষে এবারের পূজার আয়োজনে যে সেবা ও কর্মসূচি সমূহ রয়েছে তা নিম্নে সংক্ষিপ্ত করে দেওয়া হলো:',
};

export const EVENTS = [
  { icon: '🏥', title: 'ফ্রি চিকিৎসা সেবা', desc: 'মেডিকেল কেম্প' },
  { icon: '🌳', title: 'বৃক্ষ বিতরণ', desc: 'শিশুদের মধ্যে ভাগবত গীতা বই ও বৃক্ষ বিতরণ' },
  { icon: '👕', title: 'বস্ত্র বিতরণ', desc: 'এলাকার গরীব দুস্ত মানুষের মধ্যে বস্ত্র বিতরণ' },
  { icon: '🏆', title: 'আরতি ও শঙ্খ প্রতিযোগিতা', desc: '১ম/২য়/৩য় ব্যক্তিদের পুরস্কার' },
  { icon: '🙏', title: 'সম্মাননা অনুষ্ঠান', desc: 'পূজো মন্দিরে সহযোগী ও প্রয়াতদের পরিবারকে সম্মাননা' },
  { icon: '🎤', title: 'বিজয়া দশমী কনসার্ট', desc: 'বিজয়া দশমীতে কনসার্টের আয়োজন' },
];

export const PUJA_SCHEDULE = [
  { date: '১০ অক্টোবর, ২০২৬', day: 'শনিবার', event: 'মহালয়া' },
  { date: '১৫ অক্টোবর, ২০২৬', day: 'বৃহস্পতিবার', event: 'মহাপঞ্চমী' },
  { date: '১৬ অক্টোবর, ২০২৬', day: 'শুক্রবার', event: 'মহাষষ্ঠী' },
  { date: '১৭ অক্টোবর, ২০২৬', day: 'শনিবার', event: 'মহাসপ্তমী' },
  { date: '১৯ অক্টোবর, ২০২৬', day: 'সোমবার', event: 'মহাঅষ্টমী ও সন্ধিপূজা' },
  { date: '২০ অক্টোবর, ২০২৬', day: 'মঙ্গলবার', event: 'মহানবমী' },
  { date: '২১ অক্টোবর, ২০২৬', day: 'বুধবার', event: 'বিজয়া দশমী ও প্রতিমা বিসর্জন' },
];

// প্রতিটি প্রণামি-আইটেমের একক মূল্য (টাকা)
export const PRICES = {
  geeta: 120,
  tree: 80,
  cloth: 500,
};

// টাকা পাঠানোর (রিসিভার) নম্বর
export const PAYMENT_NUMBERS: Record<string, string> = {
  bkash: '01773377786',
  nagad: '01773377786',
};

export const PAYMENT_LABELS: Record<string, string> = {
  bkash: 'বিকাশ',
  nagad: 'নগদ',
};

export const PAYMENT_BRAND: Record<string, string> = {
  bkash: '#E2136E',
  nagad: '#F6921E',
};

export function formatPayNumber(n: string): string {
  const d = n.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('01')) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return n;
}

export function localPayNumber(n: string): string {
  return n.replace(/\D/g, '');
}

export const AUTH = {
  adminUser: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  adminPass: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
  collectorUser: import.meta.env.VITE_COLLECTOR_USERNAME || 'collector',
  collectorPass: import.meta.env.VITE_COLLECTOR_PASSWORD || 'collect123',
};
