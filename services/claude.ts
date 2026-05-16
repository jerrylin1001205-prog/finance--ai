import { Transaction, Budget } from './storage';

const GEMINI_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

export const getFinanceAdvice = async (
  apiKey: string,
  transactions: Transaction[],
  budget: Budget
): Promise<string> => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

  const prompt = `You are a friendly and practical personal finance coach. Analyze this user's monthly finances and give clear, actionable advice.

Monthly Data:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpense.toFixed(2)}
- Net Savings: $${(totalIncome - totalExpense).toFixed(2)}
- Savings Goal: $${budget.savingsGoal.toFixed(2)}
- Monthly Budget Limit: $${budget.totalMonthly.toFixed(2)}

Spending by Category:
${Object.entries(byCategory).map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`).join('\n')}

Please:
1. Summarize their financial health in 1-2 sentences
2. Point out 2-3 specific areas where they can save money
3. Give 1-2 practical tips to reach their savings goal
4. End with a short motivational note

Keep it friendly, short, and specific. No bullet point overload.`;

  const response = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600 },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
