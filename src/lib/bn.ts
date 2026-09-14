const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** 1234 -> ১২৩৪ */
export function toBn(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** ১২৩৪ -> 1234 */
export function toEn(input: string): string {
  const map: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  return input.replace(/[০-৯]/g, (d) => map[d] ?? d);
}

export function formatTaka(n: number): string {
  return `৳${toBn(n.toLocaleString('en-IN'))}`;
}

export function todayBn(): string {
  try {
    return new Date().toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}

/** লোকাল টাইমজোনে আজকের তারিখ 'YYYY-MM-DD' (date input-এর জন্য) */
export function todayISO(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** '2026-09-15' → '১৫/০৯/২০২৬' */
export function fmtBnDate(iso?: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '';
  return `${toBn(d)}/${toBn(m)}/${toBn(y)}`;
}

/** CSV export helper (UTF-8 BOM so Excel shows Bangla correctly) */
export function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
