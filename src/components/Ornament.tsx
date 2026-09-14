/** Decorative Durga Puja SVG ornaments (inline, zero deps) */

export function Diya({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path
        className="flame"
        d="M32 5c5 7.5 7 13.5 0 20-7-6.5-5-12.5 0-20Z"
        fill="url(#diyaFlame)"
      />
      <ellipse cx="32" cy="27" rx="4" ry="2.2" fill="#FBC222" />
      <path
        d="M13 37.5c1.5 9 9.5 14.5 19 14.5s17.5-5.5 19-14.5c-5.5 3-12 4.5-19 4.5s-13.5-1.5-19-4.5Z"
        fill="#8d2430"
      />
      <path
        d="M16.5 35.8c4.5 2.2 9.8 3.2 15.5 3.2s11-1 15.5-3.2c-.9-2-3.4-3.4-6.8-4l-2.2 2.6-2.8-2.4-3.7 2-3.7-2-2.8 2.4-2.2-2.6c-3.4.6-5.9 2-6.8 4Z"
        fill="#e0b455"
      />
      <defs>
        <linearGradient id="diyaFlame" x1="32" y1="5" x2="32" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBC222" />
          <stop offset="1" stopColor="#E52B00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/70" />
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
        <path d="M11 0c2.2 3.6 3.6 6 3.6 8a3.6 3.6 0 1 1-7.2 0c0-2 1.4-4.4 3.6-8Z" fill="#e0b455" />
        <path d="M0 10.5c2.5-1.8 5-1.8 7 0M22 10.5c-2.5-1.8-5-1.8-7 0" stroke="#e0b455" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/70" />
    </div>
  );
}

/** Faint mandala ring for hero backgrounds */
export function Mandala({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
      <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = 100 + Math.cos(a) * 72;
        const y1 = 100 + Math.sin(a) * 72;
        const x2 = 100 + Math.cos(a) * 96;
        const y2 = 100 + Math.sin(a) * 96;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />;
      })}
    </svg>
  );
}
