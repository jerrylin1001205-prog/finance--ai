import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getThisMonthTransactions, getBudget, Transaction, Budget } from '../services/storage';
import { registerForNotifications, sendBudgetAlert } from '../services/notifications';
import { useLanguage } from '../services/languageContext';

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

function getGreeting(tr: { good_morning: string; good_afternoon: string; good_evening: string }) {
  const h = new Date().getHours();
  if (h < 12) return tr.good_morning;
  if (h < 17) return tr.good_afternoon;
  return tr.good_evening;
}

function getMotivation(
  tr: { motivation_start: string; motivation_crushing: string; motivation_solid: string; motivation_warning: string; motivation_over: string; motivation_negative: string; motivation_default: string },
  totalIncome: number,
  totalExpense: number,
  budget: Budget,
) {
  if (totalIncome === 0 && totalExpense === 0) return { text: tr.motivation_start, bg: '#EFF6FF', color: COLORS.primary };
  if (totalExpense > totalIncome) return { text: tr.motivation_negative, bg: '#FEF2F2', color: COLORS.expense };
  if (budget.totalMonthly > 0) {
    const pct = totalExpense / budget.totalMonthly;
    if (pct >= 1) return { text: tr.motivation_over, bg: '#FEF2F2', color: COLORS.expense };
    if (pct >= 0.8) return { text: tr.motivation_warning, bg: '#FFFBEB', color: '#D97706' };
    if (pct < 0.5) return { text: tr.motivation_crushing, bg: '#F0FDF4', color: COLORS.income };
    return { text: tr.motivation_solid, bg: '#F0FDF4', color: COLORS.income };
  }
  return { text: tr.motivation_default, bg: '#EFF6FF', color: COLORS.primary };
}

export default function DashboardScreen() {
  const { tr } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget>({ totalMonthly: 0, savingsGoal: 0, categories: {} });
  const [refreshing, setRefreshing] = useState(false);
  const alertSentRef = useRef(false);

  const load = async () => {
    await registerForNotifications();
    const [txs, b] = await Promise.all([getThisMonthTransactions(), getBudget()]);
    setTransactions(txs);
    setBudget(b);
    if (b.totalMonthly > 0) {
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const pct = expense / b.totalMonthly;
      if (pct >= 0.8 && !alertSentRef.current) {
        alertSentRef.current = true;
        await sendBudgetAlert(pct);
      }
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsProgress = budget.savingsGoal > 0 ? Math.min(savings / budget.savingsGoal, 1) : 0;
  const budgetProgress = budget.totalMonthly > 0 ? Math.min(totalExpense / budget.totalMonthly, 1) : 0;

  const byCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const recentTxs = [...transactions].reverse().slice(0, 5);
  const motivation = getMotivation(tr, totalIncome, totalExpense, budget);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting(tr)}</Text>
        <Text style={styles.headerTitle}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={[styles.motivationCard, { backgroundColor: motivation.bg }]}>
        <Text style={[styles.motivationText, { color: motivation.color }]}>{motivation.text}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{tr.net_savings}</Text>
        <Text style={[styles.balanceAmount, { color: savings >= 0 ? '#4ADE80' : '#FCA5A5' }]}>
          ${savings.toFixed(2)}
        </Text>
        <View style={styles.row}>
          <View style={styles.halfCard}>
            <Text style={styles.miniLabel}>{tr.income}</Text>
            <Text style={[styles.miniAmount, { color: '#4ADE80' }]}>${totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.halfCard}>
            <Text style={styles.miniLabel}>{tr.expenses}</Text>
            <Text style={[styles.miniAmount, { color: '#FCA5A5' }]}>${totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {budget.savingsGoal > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.savings_goal}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${savingsProgress * 100}%` as any, backgroundColor: COLORS.income }]} />
          </View>
          <Text style={styles.progressText}>${savings.toFixed(2)} / ${budget.savingsGoal.toFixed(2)}</Text>
        </View>
      )}

      {budget.totalMonthly > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.monthly_budget}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${budgetProgress * 100}%` as any,
              backgroundColor: budgetProgress > 0.85 ? COLORS.expense : COLORS.primary,
            }]} />
          </View>
          <Text style={styles.progressText}>${totalExpense.toFixed(2)} / ${budget.totalMonthly.toFixed(2)}</Text>
        </View>
      )}

      {Object.keys(byCategory).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.top_spending}</Text>
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat, amt]) => (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catAmt}>${amt.toFixed(2)}</Text>
              </View>
            ))}
        </View>
      )}

      {recentTxs.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.recent_transactions}</Text>
          {recentTxs.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={[styles.txDot, { backgroundColor: tx.type === 'income' ? COLORS.income : COLORS.expense }]} />
                <View>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                  {tx.note ? <Text style={styles.txNote}>{tx.note}</Text> : null}
                </View>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{tr.no_transactions}</Text>
          <Text style={styles.emptySubText}>{tr.no_transactions_sub}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  greeting: { fontSize: 14, color: COLORS.sub, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  motivationCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 14, padding: 16,
  },
  motivationText: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  balanceCard: {
    margin: 16, borderRadius: 20, backgroundColor: COLORS.primary,
    padding: 24, shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  balanceAmount: { fontSize: 42, fontWeight: '800', color: '#fff', marginVertical: 4 },
  row: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  halfCard: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  miniLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },
  miniAmount: { fontSize: 18, fontWeight: '700', marginTop: 3 },
  card: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, backgroundColor: COLORS.card,
    padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: COLORS.sub, marginTop: 8, textAlign: 'right' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  catName: { fontSize: 14, color: COLORS.text },
  catAmt: { fontSize: 14, fontWeight: '600', color: COLORS.expense },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txCategory: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  txNote: { fontSize: 12, color: COLORS.sub, marginTop: 1 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 17, fontWeight: '600', color: COLORS.sub },
  emptySubText: { fontSize: 14, color: COLORS.sub, marginTop: 8, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
