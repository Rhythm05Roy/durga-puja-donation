import { SITE } from '../config';
import { isSupabaseConfigured } from '../lib/supabase';
import { Diya, Mandala, OrnamentDivider } from './Ornament';

/** পাবলিক প্রণামি লিংকে শুধু ফরম দেখায় — অ্যাডমিন/সংগ্রহের কোনো লিংক নেই।
 *  /collect ও /admin শুধু সরাসরি URL দিয়ে ঢোকা যায় (পাসওয়ার্ড সুরক্ষিত)। */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen puja-bg flex flex-col">
      <div className="alpana-band" />
      <header className="relative overflow-hidden bg-gradient-to-b from-maroon-950 via-maroon-900 to-maroon-800 px-4 pb-5 pt-6 text-center sm:pb-7 sm:pt-8">
        {/* faint mandala rings */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-amber-200/[.07]">
          <div className="h-[420px] w-[420px] max-w-none scale-[1.6]">
            <Mandala />
          </div>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Diya size={40} className="mx-auto" />
          <p className="mt-2 inline-block rounded-full border border-gold-400/60 bg-white/10 px-3 py-0.5 text-xs font-semibold tracking-wide text-amber-100">
            শারদীয় শুভেচ্ছা {SITE.yearBn}
          </p>
          <h1 className="font-serifbn mx-auto mt-2.5 max-w-xl text-xl font-bold leading-snug text-amber-50 [text-shadow:0_1px_3px_rgba(0,0,0,.4)] sm:text-3xl">
            {SITE.org}
          </h1>
          <p className="mt-1 text-sm font-semibold text-amber-100 sm:text-base">{SITE.title}</p>
          <OrnamentDivider className="mt-4 opacity-70" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:max-w-4xl">
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 p-3 text-sm text-maroon-800">
            ⚠️ <b>Supabase যুক্ত করা হয়নি</b> — ডেটা সংরক্ষণ হবে না। <code>.env.example</code> দেখে{' '}
            <code>.env</code> ফাইল বানিয়ে <code>VITE_SUPABASE_URL</code> ও{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> বসান, তারপর সার্ভার আবার চালু করুন। (README)
          </div>
        )}
        {children}
      </main>

      <footer className="px-4 pb-8 pt-2 text-center">
        <OrnamentDivider className="mx-auto mb-4 max-w-3xl" />
        <p className="text-xs font-semibold text-maroon-800">
          © {SITE.yearBn} {SITE.org} • জয় মা দুর্গা 🙏
        </p>
        <p className="mt-1.5 text-[11px] font-semibold text-stone-500">
          Developed by <span className="text-maroon-700">Ridam Roy</span> •{' '}
          <a href="mailto:rhythmroy03@gmail.com" className="text-maroon-700 underline underline-offset-2 hover:text-maroon-900">
            rhythmroy03@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
