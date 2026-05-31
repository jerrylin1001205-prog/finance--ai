import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthlyIncome, getMonthExpenses, Expense } from '../services/supabase';
import { fmt } from '../utils/currency';

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMotivation(income: number, totalSpent: number) {
  const remaining = income - totalSpent;
  if (income === 0 && totalSpent === 0) return { text: "Let's get started! Set your income and log your first expense.", bg: '#EFF6FF', color: COLORS.primary };
  if (totalSpent > income) return { text: "You've gone over budget this month. Time to cut back!", bg: '#FEF2F2', color: COLORS.expense };
  if (income > 0) {
    const pct = totalSpent / income;
    if (pct >= 0.8) return { text: "Almost at your limit — spend carefully for the rest of the month.", bg: '#FFFBEB', color: '#D97706' };
    if (pct < 0.5) return { text: "Great job! You're well within budget this month.", bg: '#F0FDF4', color: COLORS.income };
    return { text: "You're on track. Keep it up!", bg: '#F0FDF4', color: COLORS.income };
  }
  return { text: "Set your monthly income to start tracking.", bg: '#EFF6FF', color: COLORS.primary };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};

export default function DashboardScreen() {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [inc, exps] = await Promise.all([getMonthlyIncome(), getMonthExpenses()]);
    setIncome(inc);
    setExpenses(exps);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = income - totalSpent;
  const pct = income > 0 ? Math.min(totalSpent / income, 1) : 0;
  const motivation = getMotivation(income, totalSpent);
  const recentFive = expenses.slice(0, 5);

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.headerTitle}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={[styles.motivationCard, { backgroundColor: motivation.bg }]}>
        <Text style={[styles.motivationText, { color: motivation.color }]}>{motivation.text}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Remaining Balance</Text>
        <Text style={[styles.balanceAmount, { color: remaining >= 0 ? '#4ADE80' : '#FCA5A5' }]}>
          {fmt(remaining)}
        </Text>
        <View style={styles.row}>
          <View style={styles.halfCard}>
            <Text style={styles.miniLabel}>Monthly Income</Text>
            <Text style={[styles.miniAmount, { color: '#4ADE80' }]}>{fmt(income)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.halfCard}>
            <Text style={styles.miniLabel}>Total Spent</Text>
            <Text style={[styles.miniAmount, { color: '#FCA5A5' }]}>{fmt(totalSpent)}</Text>
          </View>
        </View>
      </View>

      {income > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Used</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${pct * 100}%` as any,
              backgroundColor: pct > 0.85 ? COLORS.expense : COLORS.primary,
            }]} />
          </View>
          <Text style={styles.progressText}>{fmt(totalSpent)} / {fmt(income)}</Text>
        </View>
      )}

      {Object.keys(byCategory).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Spending</Text>
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat, amt]) => (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catIcon}>{CATEGORY_ICONS[cat] ?? '📦'}</Text>
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catAmt}>{fmt(amt)}</Text>
              </View>
            ))}
        </View>
      )}

      {recentFive.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses</Text>
          {recentFive.map(exp => (
            <View key={exp.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={[styles.txDot, { backgroundColor: COLORS.expense }]} />
                <View>
                  <Text style={styles.txCategory}>{exp.item_name}</Text>
                  <Text style={styles.txNote}>{exp.category} · {formatDate(exp.date)}</Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: COLORS.expense }]}>
                -{fmt(exp.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No expenses this month</Text>
          <Text style={styles.emptySubText}>Tap Add Expense to log your first one.</Text>
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
  balanceAmount: { fontSize: 42, fontWeight: '800', marginVertical: 4 },
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
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  catIcon: { fontSize: 16, marginRight: 10 },
  catName: { flex: 1, fontSize: 14, color: COLORS.text },
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
