import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, useWindowDimensions, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMonthlyIncome, getMonthExpenses, Expense } from '../services/supabase';
import { fmt } from '../utils/currency';

const PRIMARY = '#6366F1';
const BG = '#F0F4F8';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', Transport: '#3B82F6', Bills: '#8B5CF6', Shopping: '#EC4899',
  Health: '#10B981', Entertainment: '#06B6D4', Rent: '#F97316', Other: '#6B7280',
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
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
  const pctNum = Math.round(pct * 100);

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const statusColor = pct >= 1 ? '#EF4444' : pct >= 0.8 ? '#F59E0B' : '#10B981';
  const statusLabel = pct >= 1 ? 'Over budget' : pct >= 0.8 ? 'Near limit' : 'On track';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
    >
      {/* ── Header ── */}
      <LinearGradient colors={['#1E1B4B', '#312E81', '#1E1B4B']} style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.headerMonth}>
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <Text style={styles.headerSub}>Here's your financial overview</Text>
      </LinearGradient>

      <View style={styles.body}>

        {/* ── Balance card ── */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={[PRIMARY, '#4F46E5']} style={styles.balanceGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.balanceLabel}>Remaining Budget</Text>
            <Text style={[styles.balanceAmount, { color: remaining >= 0 ? '#fff' : '#FCA5A5' }]}>
              {fmt(Math.abs(remaining))}{remaining < 0 ? ' over' : ''}
            </Text>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <Ionicons name="arrow-down-circle" size={16} color="#4ADE80" />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Income</Text>
                  <Text style={styles.balanceItemValue}>{fmt(income)}</Text>
                </View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <Ionicons name="arrow-up-circle" size={16} color="#FCA5A5" />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Spent</Text>
                  <Text style={styles.balanceItemValue}>{fmt(totalSpent)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Budget progress ── */}
        {income > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Budget Usage</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={pct >= 1 ? ['#EF4444', '#DC2626'] : pct >= 0.8 ? ['#F59E0B', '#D97706'] : [PRIMARY, '#06B6D4']}
                style={[styles.progressFill, { width: `${pctNum}%` as any }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>{fmt(totalSpent)} used</Text>
              <Text style={styles.progressPct}>{pctNum}%</Text>
              <Text style={styles.progressLabel}>{fmt(income)} total</Text>
            </View>
          </View>
        )}

        {/* ── Category breakdown ── */}
        {topCategories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            {topCategories.map(([cat, amt]) => {
              const catPct = totalSpent > 0 ? amt / totalSpent : 0;
              const color = CATEGORY_COLORS[cat] ?? '#6B7280';
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={[styles.catIconWrap, { backgroundColor: color + '18' }]}>
                    <Text style={styles.catEmoji}>{CATEGORY_ICONS[cat] ?? '📦'}</Text>
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catTopRow}>
                      <Text style={styles.catName}>{cat}</Text>
                      <Text style={styles.catAmt}>{fmt(amt)}</Text>
                    </View>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${Math.round(catPct * 100)}%` as any, backgroundColor: color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Recent transactions ── */}
        {expenses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {expenses.slice(0, 6).map((exp, i) => (
              <View key={exp.id} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={[styles.txIcon, { backgroundColor: (CATEGORY_COLORS[exp.category] ?? '#6B7280') + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[exp.category] ?? '📦'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{exp.item_name}</Text>
                  <Text style={styles.txMeta}>{exp.category} · {formatDate(exp.date)}</Text>
                </View>
                <Text style={styles.txAmt}>-{fmt(exp.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {income === 0 && expenses.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyTitle}>Let's get started</Text>
            <Text style={styles.emptySub}>Set your monthly income in the Income tab, then log your first expense.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
  headerMonth: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  body: { padding: 16, marginTop: -16 },

  balanceCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  balanceGradient: { padding: 24 },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#fff', marginBottom: 20, letterSpacing: -1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 16 },
  balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  balanceItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  balanceItemValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  balanceDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  progressBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  catIconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 20 },
  catInfo: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  catAmt: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  catBarBg: { height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 36, alignItems: 'center', marginTop: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
});
