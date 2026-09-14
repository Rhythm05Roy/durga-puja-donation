/** Supabase-এর PostgrestError সাধারণ object (Error instance নয়), তাই
 *  আগে আসল মেসেজ হারিয়ে যাচ্ছিল। এখান থেকে সব এরর বাংলায় বোঝা যায়। */
const has = (s: string, ...keys: string[]) => keys.some((k) => s.includes(k));

export function getErrorMessage(e: unknown): string {
  let msg = '';
  if (e instanceof Error) msg = e.message;
  else if (e && typeof e === 'object' && 'message' in e)
    msg = String((e as { message: unknown }).message ?? '');
  const lower = msg.toLowerCase();

  if (has(lower, 'supabase কনফিগার')) return msg;
  if (has(lower, 'could not find the table', 'does not exist', 'schema cache', 'could not find the function'))
    return 'Supabase-এ টেবিল/ফাংশন পাওয়া যায়নি — নতুন supabase/schema.sql পুরোটা SQL Editor-এ আবার চালান';
  if (has(lower, 'invalid api key', 'jwt', 'apikey'))
    return 'Supabase কী ভুল — .env ফাইলের VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY যাচাই করুন';
  if (has(lower, 'duplicate key'))
    return 'এই ইউজার আইডি আগে থেকেই আছে — অন্য আইডি দিন';
  if (has(lower, 'row-level security', 'permission denied'))
    return 'Supabase RLS অনুমতি দিচ্ছে না — supabase/schema.sql আবার চালান';
  return msg || 'অজানা সমস্যা হয়েছে';
}
