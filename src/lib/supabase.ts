import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) client = createClient(url as string, anon as string);
  return client;
}

/**
 * Lazy proxy: অ্যাপ লোডের সময় crash করে না। `.env` না থাকলে শুধু
 * আসল ডাটাবেস কল করার সময় বাংলা এরর দেখায় (ফরমের try/catch ধরে নেয়)।
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase কনফিগার করা হয়নি — .env.example দেখে .env ফাইল বানিয়ে VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY বসান (README দেখুন)'
      );
    }
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
