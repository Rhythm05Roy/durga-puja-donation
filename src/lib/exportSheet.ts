import type { jsPDF } from 'jspdf';

/* ─── আমন্ত্রণপত্র ছবি/PDF হিসেবে সেভ করার হেল্পার ───
   • স্ক্রিনের রেসপন্সিভ কার্ড নয়, নির্দিষ্ট A4 শিট ক্যাপচার হয় —
     তাই মোবাইল/ডেস্কটপ সব জায়গায় আউটপুট হুবহু এক
   • html2canvas ও jsPDF শুধু ডাউনলোডের সময় লোড হয় (dynamic import),
     ফলে ফরম পেজের প্রথম লোড হালকা থাকে */

const PAPER = '#FFFDF7';
const A4 = { w: 210, h: 297 }; // mm

/** ফন্ট ও ইমেজ বসে যাওয়া পর্যন্ত অপেক্ষা — নইলে ক্যাপচারে লেখা এলোমেলো হয় */
async function waitUntilPainted() {
  try {
    await document.fonts?.ready;
  } catch {
    /* ফন্ট API না থাকলে এড়িয়ে যাই */
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
  await waitUntilPainted();
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(node, {
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

/** উচ্চ রেজোলিউশনের PNG (শেয়ার করার জন্য) */
export async function downloadSheetPng(node: HTMLElement, filename: string) {
  const canvas = await capture(node, 2.5);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('ছবি তৈরি করা যায়নি');
  saveBlob(blob, filename);
}

/** ঠিক এক পাতার A4 PDF তৈরি করে (সেভ করে না) */
async function renderSheetPdf(node: HTMLElement, title: string): Promise<jsPDF> {
  const canvas = await capture(node, 3);
  // JPEG — একই মানে PNG-র চেয়ে ফাইল অনেক ছোট (আগে ~১৪MB, এখন ~০.৮MB)
  const img = canvas.toDataURL('image/jpeg', 0.94);

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title, subject: title, creator: title });

  // কাগজের রং দিয়ে পুরো পাতা ভরাট — ছবির চারপাশে সাদা ফালি থাকে না
  pdf.setFillColor(255, 253, 247);
  pdf.rect(0, 0, A4.w, A4.h, 'F');

  // "contain" ফিট: অনুপাত ঠিক রেখে পাতার ভেতরে বসানো
  let w = A4.w;
  let h = (canvas.height * w) / canvas.width;
  if (h > A4.h) {
    h = A4.h;
    w = (canvas.width * h) / canvas.height;
  }
  pdf.addImage(img, 'JPEG', (A4.w - w) / 2, (A4.h - h) / 2, w, h, undefined, 'FAST');
  return pdf;
}

/** এক পাতার A4 PDF সেভ করে — ছবিটি পাতার ভেতরে পুরোপুরি বসে, কাটা পড়ে না */
export async function downloadSheetPdf(node: HTMLElement, filename: string, title: string) {
  const pdf = await renderSheetPdf(node, title);
  pdf.save(filename);
}
