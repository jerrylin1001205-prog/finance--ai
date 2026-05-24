import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Budget {
  totalMonthly: number;
  savingsGoal: number;
  categories: Record<string, number>;
}

const TRANSACTIONS_KEY = 'transactions';
const BUDGET_KEY = 'budget';

export const saveTransaction = async (tx: Transaction) => {
  const existing = await getTransactions();
  existing.push(tx);
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(existing));
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteTransaction = async (id: string) => {
  const existing = await getTransactions();
  const filtered = existing.filter(tx => tx.id !== id);
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
};

export const getThisMonthTransactions = async (): Promise<Transaction[]> => {
  const all = await getTransactions();
  const now = new Date();
  return all.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
};

export const saveBudget = async (budget: Budget) => {
  await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
};

export const getBudget = async (): Promise<Budget> => {
  const data = await AsyncStorage.getItem(BUDGET_KEY);
  return data
    ? JSON.parse(data)
    : { totalMonthly: 0, savingsGoal: 0, categories: {} };
};

