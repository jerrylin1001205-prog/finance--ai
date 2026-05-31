import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ebnmlobonllzqtlftbfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibm1sb2JvbmxsenF0bGZ0YmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTAyMjIsImV4cCI6MjA5NDQ4NjIyMn0.eEccoc-bYDgSLeVQ1HFASHcl8sJkP0eCYhr4ZMbJ2Jk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // Try auto sign-in immediately (works when email confirmation is disabled in Supabase).
  // We deliberately ignore the result — if it fails (e.g. email not confirmed) the
  // onAuthStateChange listener in App.tsx will keep the user on the auth screens.
  await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// ── Monthly Income ─────────────────────────────────────────────────────────────

export const saveMonthlyIncome = async (amount: number): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  const now = new Date();
  const { error } = await supabase
    .from('monthly_income')
    .upsert(
      { user_id: user.id, year: now.getFullYear(), month: now.getMonth() + 1, amount },
      { onConflict: 'user_id,year,month' }
    );
  if (error) throw new Error(error.message);
};

export const getMonthlyIncome = async (): Promise<number> => {
  const user = await getUser();
  if (!user) return 0;
  const now = new Date();
  const { data } = await supabase
    .from('monthly_income')
    .select('amount')
    .eq('user_id', user.id)
    .eq('year', now.getFullYear())
    .eq('month', now.getMonth() + 1)
    .single();
  return data?.amount ?? 0;
};

// ── Expenses ───────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  item_name: string;
  category: string;
  amount: number;
  date: string;
}

export const addExpense = async (item_name: string, category: string, amount: number): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase
    .from('expenses')
    .insert({ user_id: user.id, item_name, category, amount, date: new Date().toISOString() });
  if (error) throw new Error(error.message);
};

export const getMonthExpenses = async (): Promise<Expense[]> => {
  const user = await getUser();
  if (!user) return [];
  const now = new Date();
  // day 1 of this month to day 1 of next month, then filter locally for timezone safety
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 2).toISOString();
  const { data, error } = await supabase
    .from('expenses')
    .select('id, item_name, category, amount, date')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });
  if (error) return [];
  return ((data ?? []) as Expense[]).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
};

export const removeExpense = async (id: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
};

export const updateExpense = async (id: string, item_name: string, category: string, amount: number): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase
    .from('expenses')
    .update({ item_name, category, amount })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
};

// ── Category Limits ────────────────────────────────────────────────────────────

export interface CategoryLimit {
  category: string;
  limit_amount: number;
}

export const getCategoryLimits = async (): Promise<CategoryLimit[]> => {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('category_limits')
    .select('category, limit_amount')
    .eq('user_id', user.id);
  return (data ?? []) as CategoryLimit[];
};

export const saveCategoryLimit = async (category: string, limit_amount: number): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase
    .from('category_limits')
    .upsert({ user_id: user.id, category, limit_amount }, { onConflict: 'user_id,category' });
  if (error) throw new Error(error.message);
};

export const deleteCategoryLimit = async (category: string): Promise<void> => {
  const user = await getUser();
  if (!user) return;
  await supabase.from('category_limits').delete().eq('user_id', user.id).eq('category', category);
};
