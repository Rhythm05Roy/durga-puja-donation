import { toBn } from '../lib/bn';

export default function QtyStepper({
  value, onChange, min = 1, max = 99,
}: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        aria-label="কমান"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-11 w-11 rounded-full border border-gold-300 bg-gold-50 text-xl font-bold leading-none text-maroon-800 transition hover:bg-gold-100 active:scale-90"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="min-w-[3rem] rounded-xl bg-maroon-800 px-2 py-1.5 text-center text-lg font-bold text-amber-200"
      >
        {toBn(value)}
      </span>
      <button
        type="button"
        aria-label="বাড়ান"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-11 w-11 rounded-full bg-maroon-700 text-xl font-bold leading-none text-amber-200 transition hover:bg-maroon-800 active:scale-90"
      >
        +
      </button>
    </div>
  );
}
