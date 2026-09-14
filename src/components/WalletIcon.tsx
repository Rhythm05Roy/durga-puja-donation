/** আসল ওয়ালেট লোগো — public/wallets/ এ self-hosted (কোনো external request নেই)
 *  bkash: অফিসিয়াল ওয়ার্ডমার্ক (আনুভূমিক), rocket/nagad: স্কয়ার মার্ক */

const FILES: Record<string, string> = {
  bkash: '/wallets/bkash.webp',
  rocket: '/wallets/rocket.png',
  nagad: '/wallets/nagad.png',
};

export function WalletIcon({ wallet, size = 30 }: { wallet: string; size?: number }) {
  const src = FILES[wallet];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{ height: size, width: 'auto' }}
      loading="lazy"
      decoding="async"
      className="inline-block select-none object-contain"
      draggable={false}
    />
  );
}
