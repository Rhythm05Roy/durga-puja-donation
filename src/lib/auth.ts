import { AUTH } from '../config';
import { supabase } from './supabase';
import { getErrorMessage } from './errors';

export type Role = 'mainadmin' | 'subadmin' | 'collector';

export interface Session {
  username: string;
  name: string;
  role: Role;
}

/** অ্যাডমিন লগইন: প্রধান অ্যাডমিন (.env, fixed) অথবা DB-র সাব-অ্যাডমিন */
export async function adminLogin(uid: string, pw: string): Promise<Session> {
  if (uid === AUTH.adminUser && pw === AUTH.adminPass)
    return { username: uid, name: 'প্রধান অ্যাডমিন', role: 'mainadmin' };

  const { data, error } = await supabase.rpc('app_login', { p_username: uid, p_password: pw });
  if (error) throw new Error(getErrorMessage(error));
  const u = (data ?? [])[0] as { username: string; role: string; name: string } | undefined;
  if (!u || u.role !== 'subadmin') throw new Error('ভুল ইউজার আইডি বা পাসওয়ার্ড!');
  return { username: u.username, name: u.name, role: 'subadmin' };
}

/** সংগ্রাহক লগইন: DB-তে তৈরি সংগ্রাহক অথবা .env-এর ডিফল্ট সংগ্রাহক */
export async function collectorLogin(uid: string, pw: string): Promise<Session> {
  if (uid === AUTH.collectorUser && pw === AUTH.collectorPass)
    return { username: uid, name: 'সংগ্রাহক', role: 'collector' };

  const { data, error } = await supabase.rpc('app_login', { p_username: uid, p_password: pw });
  if (error) throw new Error(getErrorMessage(error));
  const u = (data ?? [])[0] as { username: string; role: string; name: string } | undefined;
  if (!u || u.role !== 'collector') throw new Error('ভুল ইউজার আইডি বা পাসওয়ার্ড!');
  return { username: u.username, name: u.name, role: 'collector' };
}
