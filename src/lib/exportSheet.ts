import type { jsPDF } from 'jspdf';

/* ─── আমন্ত্রণপত্র ছবি/PDF হিসেবে সেভ করার হেল্পার ───
   • স্ক্রিনের রেসপন্সিভ কার্ড নয়, নির্দিষ্ট A4 শিট ক্যাপচার হয় —
     তাই মোবাইল/ডেস্কটপ সব জায়গায় আউটপুট হুবহু এক
   • html2canvas ও jsPDF শুধু ডাউনলোডের সময় লোড হয় (dynamic import),
     ফলে ফরম পেজের প্রথম লোড হালকা থাকে
   • মোবাইলে বড় ক্যানভাস অনেক সময় তৈরি হয় না (বিশেষত iOS Safari) — তাই
     ডিভাইস অনুযায়ী স্কেল বাছা হয় এবং ব্যর্থ হলে ছোট স্কেলে আবার চেষ্টা হয় */

const PAPER = '#FFFDF7';
const A4 = { w: 210, h: 297 }; // mm

/** মোবাইলে ক্যানভাসের নিরাপদ সর্বোচ্চ পিক্সেল (পুরোনো iOS Safari ≈ ৫ মেগাপিক্সেল) */
const PIXEL_BUDGET_MOBILE = 5_000_000;
const PIXEL_BUDGET_DESKTOP = 12_000_000;

function isTouchDevice(): boolean {
  try {
    return (
      (navigator.maxTouchPoints ?? 0) > 1 ||
      window.matchMedia('(pointer: coarse)').matches ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    );
  } catch {
    return false;
  }
}

/** পছন্দের স্কেল থেকে শুরু করে ধাপে ধাপে ছোট স্কেলের তালিকা */
function scaleSteps(node: HTMLElement, preferred: number): number[] {
  const area = Math.max(node.offsetWidth * node.offsetHeight, 1);
  const budget = isTouchDevice() ? PIXEL_BUDGET_MOBILE : PIXEL_BUDGET_DESKTOP;
  const capped = Math.min(preferred, Math.sqrt(budget / area));
  const steps = [capped, capped * 0.75, 1.5, 1];
  // ক্রমহ্রাসমান ও ডুপ্লিকেটমুক্ত
  return steps.filter((s, i) => s >= 1 && (i === 0 || s < steps[i - 1] - 0.05));
}

/** ফন্ট ও ছবি বসে যাওয়া পর্যন্ত অপেক্ষা — নইলে ক্যাপচারে লেখা এলোমেলো হয় */
async function waitUntilPainted(node: HTMLElement) {
  try {
    await document.fonts?.ready;
  } catch {
    /* ফন্ট API না থাকলে এড়িয়ে যাই */
  }
  // শিটের ভেতরের ছবি (লোগো) লোড হয়েছে কি না
  const pending = Array.from(node.querySelectorAll('img')).filter((img) => !img.complete);
  if (pending.length) {
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            })
        )
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
  // দুই ফ্রেম অপেক্ষা — তবে ট্যাব ব্যাকগ্রাউন্ডে থাকলে rAF চলে না,
  // তাই টাইমআউট দিয়ে দৌড় করানো হয় যাতে ডাউনলোড আটকে না যায়
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    setTimeout(finish, 300);
  });
}

async function capture(node: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(node, {
    scale,
    backgroundColor: PAPER,
    useCORS: true,
    logging: false,
    imageTimeout: 15000,
    // অফ-স্ক্রিন শিটটির নিজস্ব মাপেই আঁকা হোক, উইন্ডোর মাপে নয়
    width: node.offsetWidth,
    height: node.offsetHeight,
    windowWidth: Math.max(node.offsetWidth + 80, 1024),
    windowHeight: Math.max(node.offsetHeight + 80, 1200),
  });
  if (!canvas.width || !canvas.height) throw new Error(`ফাঁকা ক্যানভাস (scale ${scale})`);
  return canvas;
}

/** এক ধাপ: ক্যাপচার + এনকোড। বড় ক্যানভাসে এনকোডই ব্যর্থ হয়, তাই দুটো একসাথে রিট্রাই হয় */
async function withFallback<T>(
  node: HTMLElement,
  preferred: number,
  step: (canvas: HTMLCanvasElement) => Promise<T | null>
): Promise<T> {
  await waitUntilPainted(node);
  let lastErr: unknown = null;
  for (const scale of scaleSteps(node, preferred)) {
    try {
      const out = await step(await capture(node, scale));
      if (out) return out;
      lastErr = new Error(`এনকোড ব্যর্থ (scale ${scale.toFixed(2)})`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? 'অজানা ত্রুটি'));
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari-তে সাথে সাথে revoke করলে ডাউনলোড বাতিল হয়ে যেতে পারে
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** রসিদ স্ক্রিনে ঢুকলেই লাইব্রেরি দুটি আগেভাগে নামিয়ে রাখে —
 *  ক্লিকে সাথে সাথে ডাউনলোড শুরু হয়, আর নতুন ডেপ্লয়ে chunk হারানোর ঝুঁকি কমে */
export function prewarmExport() {
  void import('html2canvas').catch(() => {});
  void import('jspdf').catch(() => {});
}

/** উচ্চ রেজোলিউশনের PNG (শেয়ার করার জন্য) */
export async function downloadSheetPng(node: HTMLElement, filename: string) {
  const blob = await withFallback(node, 2.5, async (canvas) => {
    const b = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return b && b.size > 2000 ? b : null;
  });
  saveBlob(blob, filename);
}

/** ঠিক এক পাতার A4 PDF তৈরি করে (সেভ করে না) */
async function renderSheetPdf(node: HTMLElement, title: string): Promise<jsPDF> {
  // JPEG — একই মানে PNG-র চেয়ে ফাইল অনেক ছোট (~০.৮MB বনাম ~১৪MB)
  const shot = await withFallback(node, 3, async (canvas) => {
    const data = canvas.toDataURL('image/jpeg', 0.94);
    return data.startsWith('data:image/jpeg') && data.length > 5000
      ? { data, w: canvas.width, h: canvas.height }
      : null;
  });

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title, subject: title, creator: title });

  // কাগজের রং দিয়ে পুরো পাতা ভরাট — ছবির চারপাশে সাদা ফালি থাকে না
  pdf.setFillColor(255, 253, 247);
  pdf.rect(0, 0, A4.w, A4.h, 'F');

  // "contain" ফিট: অনুপাত ঠিক রেখে পাতার ভেতরে বসানো
  let w = A4.w;
  let h = (shot.h * w) / shot.w;
  if (h > A4.h) {
    h = A4.h;
    w = (shot.w * h) / shot.h;
  }
  pdf.addImage(shot.data, 'JPEG', (A4.w - w) / 2, (A4.h - h) / 2, w, h, undefined, 'FAST');
  return pdf;
}

/** এক পাতার A4 PDF সেভ করে — ছবিটি পাতার ভেতরে পুরোপুরি বসে, কাটা পড়ে না */
export async function downloadSheetPdf(node: HTMLElement, filename: string, title: string) {
  const pdf = await renderSheetPdf(node, title);
  try {
    pdf.save(filename);
  } catch {
    // কিছু ইন-অ্যাপ ব্রাউজারে সরাসরি সেভ আটকে যায় — নতুন ট্যাবে খুলে দিই
    const url = pdf.output('bloburl') as unknown as string;
    window.open(url, '_blank', 'noopener');
  }
}
