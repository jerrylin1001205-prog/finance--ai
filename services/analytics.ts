import { Transaction } from './storage';

export const getSpendingByDay = (transactions: Transaction[], days: number) => {
  const now = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    labels.push(i === 0 ? 'Today' : `${d.getMonth() + 1}/${d.getDate()}`);
    const total = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    data.push(total);
  }
  return { labels, data };
};

export const getCategoryBreakdown = (transactions: Transaction[]) => {
  const map: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

export const getMonthComparison = (transactions: Transaction[]) => {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return t.type === 'expense' && d.getMonth() === lm && d.getFullYear() === ly;
  });

  const byCategory: Record<string, { this: number; last: number; diff: number }> = {};
  [...thisMonth, ...lastMonth].forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { this: 0, last: 0, diff: 0 };
  });
  thisMonth.forEach(t => { byCategory[t.category].this += t.amount; });
  lastMonth.forEach(t => { byCategory[t.category].last += t.amount; });
  Object.keys(byCategory).forEach(cat => {
    const { this: cur, last } = byCategory[cat];
    byCategory[cat].diff = last > 0 ? ((cur - last) / last) * 100 : 0;
  });

  return byCategory;
};

export const detectAnomalies = (transactions: Transaction[]) => {
  const now = new Date();
  const past30 = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
  });

  const avgByCategory: Record<string, number> = {};
  const countByCategory: Record<string, number> = {};
  past30.forEach(t => {
    avgByCategory[t.category] = (avgByCategory[t.category] || 0) + t.amount;
    countByCategory[t.category] = (countByCategory[t.category] || 0) + 1;
  });
  Object.keys(avgByCategory).forEach(cat => {
    avgByCategory[cat] = avgByCategory[cat] / countByCategory[cat];
  });

  const alerts: { category: string; amount: number; avg: number; multiplier: number }[] = [];
  const recentTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  });

  const recentByCategory: Record<string, number> = {};
  recentTxs.forEach(t => {
    recentByCategory[t.category] = (recentByCategory[t.category] || 0) + t.amount;
  });

  Object.entries(recentByCategory).forEach(([cat, amt]) => {
    const avg = avgByCategory[cat] || 0;
    if (avg > 0 && amt > avg * 2) {
      alerts.push({ category: cat, amount: amt, avg, multiplier: Math.round(amt / avg) });
    }
  });

  return alerts;
};

export const getSavingsForecast = (transactions: Transaction[], savingsGoal: number) => {
  const now = new Date();
  const monthlyData: Record<string, { income: number; expense: number }> = {};

  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
    monthlyData[key][t.type] += t.amount;
  });

  const months = Object.values(monthlyData);
  if (months.length === 0) return null;

  const avgMonthlySavings =
    months.reduce((s, m) => s + (m.income - m.expense), 0) / months.length;

  if (avgMonthlySavings <= 0) return null;

  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const currentSavings = monthlyData[thisMonthKey]
    ? monthlyData[thisMonthKey].income - monthlyData[thisMonthKey].expense
    : 0;

  const remaining = savingsGoal - currentSavings;
  const monthsNeeded = remaining > 0 ? Math.ceil(remaining / avgMonthlySavings) : 0;

  return { avgMonthlySavings, currentSavings, monthsNeeded };
};
