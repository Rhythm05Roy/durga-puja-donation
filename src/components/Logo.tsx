/** সুবর্ণ জয়ন্তী লোগো — পুরো সিস্টেমে একই অ্যাসেট।
 *  ছবিটি আগেই গোল করে কাটা (transparent PNG), তাই border-radius/object-fit
 *  ছাড়াই যেকোনো ব্যাকগ্রাউন্ডে বসে — html2canvas ক্যাপচারেও নিখুঁত থাকে। */
export const LOGO_SRC = '/logo.png';

export const LOGO_ALT = 'ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দূর্গা মন্দির — সুবর্ণ জয়ন্তী লোগো';

export default function Logo({
  size = 72,
  ring = false,
  className = '',
  sizeClass,
}: {
  size?: number;
  /** গাঢ় ব্যাকগ্রাউন্ডে আলাদা করতে সোনালি বলয় */
  ring?: boolean;
  className?: string;
  /** রেসপন্সিভ মাপ দরকার হলে Tailwind ক্লাস (তখন size শুধু fallback) */
  sizeClass?: string;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={size}
      height={size}
      loading="eager"
      decoding="sync"
      draggable={false}
      className={sizeClass ? `${sizeClass} ${className}` : className}
      style={{
        width: sizeClass ? undefined : size,
        height: sizeClass ? undefined : size,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: ring ? '2px solid rgba(224,180,85,.65)' : undefined,
      }}
    />
  );
}
