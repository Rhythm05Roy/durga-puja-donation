export type PublicDonation = {
  id?: string;
  name: string;
  present_address: string;
  permanent_address: string | null;
  medicine_amount: number;
  donate_geeta: boolean;
  geeta_qty: number;
  donate_tree: boolean;
  tree_qty: number;
  donate_cloth: boolean;
  cloth_qty: number;
  total_amount: number;
  payment_medium: string;
  sender_phone: string;
  transaction_id: string;
  verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
};

export type FieldCollection = {
  id?: string;
  name: string;
  present_address: string;
  donation_amount: number;
  collector: string | null;
  collector_name?: string | null;
  collector_username?: string | null;
  collection_date?: string | null;
  verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
};

export type VerificationLog = {
  id: string;
  table_name: string;
  record_name: string;
  amount: number;
  action: 'verified' | 'unverified' | string;
  admin_username: string;
  admin_name: string;
  created_at: string;
};

export type UserLog = {
  id: string;
  action: 'created' | 'deleted' | string;
  role: string;
  username: string;
  name: string;
  phone?: string | null;
  admin_username: string;
  admin_name: string;
  created_at: string;
};

export type AppUser = {
  id: string;
  username: string;
  role: 'subadmin' | 'collector' | string;
  name: string;
  address: string;
  phone?: string | null;
  created_by: string | null;
  created_at: string;
};
