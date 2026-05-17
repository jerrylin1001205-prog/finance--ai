import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ebnmlobonllzqtlftbfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibm1sb2JvbmxsenF0bGZ0YmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTAyMjIsImV4cCI6MjA5NDQ4NjIyMn0.eEccoc-bYDgSLeVQ1HFASHcl8sJkP0eCYhr4ZMbJ2Jk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // web uses localStorage by default; native needs AsyncStorage
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
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

export const backupTransactions = async (transactions: any[]) => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');

  await supabase.from('transactions').delete().eq('user_id', user.id);

  if (transactions.length === 0) return;

  const rows = transactions.map(t => ({ ...t, user_id: user.id }));
  const { error } = await supabase.from('transactions').insert(rows);
  if (error) throw new Error(error.message);
};

export const restoreTransactions = async () => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return data.map(({ user_id, ...rest }: any) => rest);
};

export const backupBudget = async (budget: any) => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');

  await supabase.from('budgets').delete().eq('user_id', user.id);
  const { error } = await supabase.from('budgets').insert({ ...budget, user_id: user.id });
  if (error) throw new Error(error.message);
};

export const restoreBudget = async () => {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  const { user_id, ...rest } = data;
  return rest;
};
