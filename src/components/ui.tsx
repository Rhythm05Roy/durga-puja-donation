import type { ReactNode } from 'react';

/** ─── Shared UI primitives — একই ক্লাস সব পেজে শেয়ার হয় ─── */

export const inputBase =
  'mt-1.5 w-full rounded-xl border border-gold-300 bg-white px-3.5 py-3 outline-none transition placeholder:text-stone-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20';

export const labelBase = 'block text-sm font-semibold text-maroon-800';

export function Field({
  label, required, optional, children, className = '',
}: {
  label: string; required?: boolean; optional?: boolean;
  children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelBase}>
        {label}
        {required && <span className="text-maroon-500"> *</span>}
        {optional && <span className="ml-1 text-xs font-normal text-stone-400">(ঐচ্ছিক)</span>}
      </label>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-gold-200 bg-white p-4 shadow-card sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHead({ step, title, hint }: { step: string; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-extrabold text-white shadow-card">
        {step}
      </span>
      <div>
        <h3 className="font-serifbn text-lg font-bold leading-tight text-maroon-800">{title}</h3>
        {hint && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    </div>
  );
}

/** অ্যাডমিন প্যানেলের সব সেকশনের একই হেডার — consistent look */
export function PanelHead({
  icon, title, sub, action,
}: {
  icon: string; title: string; sub?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold-300 bg-gold-100 text-lg">
          {icon}
        </span>
        <div>
          <h3 className="font-serifbn text-lg font-bold leading-tight text-maroon-800">{title}</h3>
          {sub && <p className="text-xs text-stone-500">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** ট্যাব বদলানোর সময় height collapse ঠেকায় — পেজ shake করে না */
export function PanelBody({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <div className="mt-4 min-h-[280px]">
      {loading ? (
        <p className="grid min-h-[280px] place-items-center text-stone-500">⏳ লোড হচ্ছে...</p>
      ) : (
        children
      )}
    </div>
  );
}

export function PrimaryButton({
  children, className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-gradient-to-r from-maroon-800 to-maroon-600 py-3.5 font-bold text-amber-200 shadow-card transition hover:brightness-110 active:scale-[.98] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
  return (
    <p role="alert" className={`rounded-xl border p-2.5 text-sm ${styles}`}>
      {children}
    </p>
  );
}
