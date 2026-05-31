import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getMonthlyIncome, getMonthExpenses, Expense,
  getCategoryLimits, CategoryLimit,
} from '../services/supabase';
import { fmt } from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

function SkeletonCard({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ height: 110, borderRadius: 18, backgroundColor: '#94A3B8' }, style, { opacity }]} />;
}

export default function DashboardScreen() {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [inc, exps, lims] = await Promise.all([
      getMonthlyIncome(), getMonthExpenses(), getCategoryLimits(),
    ]);
    setIncome(inc); setExpenses(exps); setLimits(lims);
    setLoading(false);
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = income - totalSpent;
  const pct = income > 0 ? Math.min(totalSpent / income, 1) : 0;
  const pctNum = Math.round(pct * 100);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - now.getDate() + 1;
  const dailyBudgetLeft = daysLeftInMonth > 0 ? remaining / daysLeftInMonth : 0;

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const showOverBudget = income > 0 && totalSpent >= income;
  const showNearBudget = income > 0 && !showOverBudget && totalSpent >= income * 0.8;

  const catWarnings = limits.filter(l => {
    if (l.limit_amount <= 0) return false;
    return (byCategory[l.category] ?? 0) >= l.limit_amount * 0.9;
  }).map(l => ({
    category: l.category,
    spent: byCategory[l.category] ?? 0,
    limit: l.limit_amount,
  }));

  const s = makeStyles(t);

  if (loading) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.greeting}>{getGreeting()} 👋</Text>
          <Text style={s.headerMonth}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          <Text style={s.headerSub}>Loading your data...</Text>
        </View>
        <View style={s.body}>
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12, height: 70 }} />
          <SkeletonCard style={{ marginBottom: 12, height: 130 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{getGreeting()} 👋</Text>
        <Text style={s.headerMonth}>
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <Text style={s.headerSub}>Here's your financial overview</Text>
      </View>

      <View style={s.body}>
        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Remaining Budget</Text>
          <Text style={[s.balanceAmount, { color: remaining >= 0 ? t.income : t.expense }]}>
            {remaining < 0 ? '-' : ''}{fmt(Math.abs(remaining))}
          </Text>
          <View style={s.balanceDivider} />
          <View style={s.balanceRow}>
            <View style={s.balanceHalf}>
              <Text style={s.balanceHalfLabel}>Income</Text>
              <Text style={[s.balanceHalfValue, { color: t.income }]}>{fmt(income)}</Text>
            </View>
            <View style={s.balanceHalfDivider} />
            <View style={s.balanceHalf}>
              <Text style={s.balanceHalfLabel}>Spent</Text>
              <Text style={[s.balanceHalfValue, { color: t.expense }]}>{fmt(totalSpent)}</Text>
            </View>
          </View>
        </View>

        {/* Daily budget card */}
        {income > 0 && (
          <View style={s.dailyCard}>
            <View style={s.dailyHalf}>
              <Text style={[s.dailyValue, { color: t.text }]}>{daysLeftInMonth}</Text>
              <Text style={s.dailyLabel}>days left in month</Text>
            </View>
            <View style={s.dailyDivider} />
            <View style={s.dailyHalf}>
              {dailyBudgetLeft > 0 ? (
                <>
                  <Text style={[s.dailyValue, { color: t.income }]}>~{fmt(dailyBudgetLeft)}/day</Text>
                  <Text style={s.dailyLabel}>safe to spend</Text>
                </>
              ) : (
                <>
                  <Text style={[s.dailyValue, { color: t.expense, fontSize: 14 }]}>No daily budget</Text>
                  <Text style={s.dailyLabel}>over limit</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Alert banners */}
        {showOverBudget && (
          <View style={[s.alertBanner, { backgroundColor: t.mode === 'dark' ? '#450a0a' : '#FEF2F2', borderColor: t.mode === 'dark' ? '#7f1d1d' : '#FECACA' }]}>
            <Ionicons name="warning" size={18} color={t.expense} />
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: t.expense }]}>Over Budget</Text>
              <Text style={[s.alertMsg, { color: t.expense }]}>
                You've spent {fmt(totalSpent - income)} over your monthly limit.
              </Text>
            </View>
          </View>
        )}
        {showNearBudget && (
          <View style={[s.alertBanner, { backgroundColor: t.mode === 'dark' ? '#451a03' : '#FFFBEB', borderColor: t.mode === 'dark' ? '#78350f' : '#FDE68A' }]}>
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: '#D97706' }]}>Budget Alert</Text>
              <Text style={[s.alertMsg, { color: '#D97706' }]}>
                {pctNum}% used — {fmt(remaining)} remaining this month.
              </Text>
            </View>
          </View>
        )}

        {/* Category limit warnings */}
        {catWarnings.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Category Limit Alerts</Text>
            {catWarnings.map(w => (
              <View key={w.category} style={s.warnRow}>
                <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[w.category] ?? '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.warnCat}>{w.category}</Text>
                  <Text style={s.warnMeta}>{fmt(w.spent)} / {fmt(w.limit)}</Text>
                </View>
                <Text style={[s.warnBadge, { color: w.spent >= w.limit ? t.expense : '#D97706' }]}>
                  {w.spent >= w.limit ? 'Over limit' : `${Math.round(w.spent / w.limit * 100)}%`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Budget progress */}
        {income > 0 && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>Budget Usage</Text>
              <Text style={[s.cardBadge, {
                color: pct >= 1 ? t.expense : pct >= 0.8 ? '#D97706' : t.income,
              }]}>
                {pct >= 1 ? 'Over budget' : pct >= 0.8 ? 'Near limit' : 'On track'}
              </Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, {
                width: `${pctNum}%` as any,
                backgroundColor: pct >= 1 ? t.expense : pct >= 0.8 ? '#D97706' : t.primary,
              }]} />
            </View>
            <View style={s.progressMeta}>
              <Text style={s.progressText}>{fmt(totalSpent)} used</Text>
              <Text style={[s.progressPct, { color: t.text }]}>{pctNum}%</Text>
              <Text style={s.progressText}>{fmt(income)} total</Text>
            </View>
          </View>
        )}

        {/* Category breakdown */}
        {topCategories.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Spending by Category</Text>
            {topCategories.map(([cat, amt]) => {
              const catPct = totalSpent > 0 ? amt / totalSpent : 0;
              const lim = limits.find(l => l.category === cat)?.limit_amount ?? null;
              const overLimit = lim && amt > lim;
              return (
                <View key={cat} style={s.catRow}>
                  <View style={s.catIconWrap}>
                    <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat] ?? '📦'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.catTopRow}>
                      <Text style={s.catName}>{cat}</Text>
                      <Text style={[s.catAmt, overLimit && { color: t.expense }]}>{fmt(amt)}</Text>
                    </View>
                    <View style={s.catBarBg}>
                      <View style={[s.catBarFill, {
                        width: `${Math.round(catPct * 100)}%` as any,
                        backgroundColor: overLimit ? t.expense : t.primary,
                      }]} />
                    </View>
                    {lim && (
                      <Text style={s.catLimitText}>Limit: {fmt(lim)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent transactions */}
        {expenses.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Recent Transactions</Text>
            {expenses.slice(0, 6).map((exp, i) => (
              <View key={exp.id} style={[s.txRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={s.txIcon}>
                  <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[exp.category] ?? '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txName}>{exp.item_name}</Text>
                  <Text style={s.txMeta}>{exp.category} · {formatDate(exp.date)}</Text>
                </View>
                <Text style={[s.txAmt, { color: t.expense }]}>-{fmt(exp.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Onboarding empty state */}
        {income === 0 && expenses.length === 0 && (
          <View style={s.onboardCard}>
            <Text style={s.onboardTitle}>Welcome! Let's get started 🚀</Text>
            <Text style={s.onboardSub}>Complete these steps to set up your finances</Text>

            {/* Step 1 */}
            <View style={s.stepRow}>
              <View style={[s.stepBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[s.stepNum, { color: '#059669' }]}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepTitle, { color: t.text }]}>Created your account</Text>
                <Text style={s.stepDesc}>You're signed in and ready to go</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>

            <View style={s.stepDivider} />

            {/* Step 2 */}
            <View style={s.stepRow}>
              <View style={[s.stepBadge, { backgroundColor: t.bg2 }]}>
                <Text style={[s.stepNum, { color: t.textMuted }]}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepTitle, { color: t.text }]}>Set your monthly income</Text>
                <Text style={s.stepDesc}>Tell us how much you earn this month</Text>
              </View>
              <TouchableOpacity style={[s.stepBtn, { borderColor: t.primary }]} onPress={() => navigation.navigate('Income')}>
                <Text style={[s.stepBtnText, { color: t.primary }]}>Go to Income</Text>
              </TouchableOpacity>
            </View>

            <View style={s.stepDivider} />

            {/* Step 3 */}
            <View style={s.stepRow}>
              <View style={[s.stepBadge, { backgroundColor: t.bg2 }]}>
                <Text style={[s.stepNum, { color: t.textMuted }]}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepTitle, { color: t.text }]}>Log your first expense</Text>
                <Text style={s.stepDesc}>Track where your money goes</Text>
              </View>
              <TouchableOpacity style={[s.stepBtn, { borderColor: t.primary }]} onPress={() => navigation.navigate('Add')}>
                <Text style={[s.stepBtnText, { color: t.primary }]}>Go to Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: {
      backgroundColor: t.headerBg, paddingHorizontal: 24,
      paddingTop: 52, paddingBottom: 28,
    },
    greeting: { fontSize: 13, color: t.headerSub, fontWeight: '600', marginBottom: 4 },
    headerMonth: { fontSize: 24, fontWeight: '800', color: t.headerText, marginBottom: 3 },
    headerSub: { fontSize: 13, color: t.headerSub },
    body: { padding: 16, marginTop: -1 },

    balanceCard: {
      backgroundColor: t.card, borderRadius: 18, padding: 22, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
      shadowColor: '#000', shadowOpacity: t.mode === 'dark' ? 0.4 : 0.06, shadowRadius: 12, elevation: 3,
    },
    balanceLabel: { fontSize: 11, color: t.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    balanceAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 16 },
    balanceDivider: { height: 1, backgroundColor: t.border, marginBottom: 16 },
    balanceRow: { flexDirection: 'row' },
    balanceHalf: { flex: 1, alignItems: 'center' },
    balanceHalfDivider: { width: 1, backgroundColor: t.border },
    balanceHalfLabel: { fontSize: 11, color: t.textMuted, fontWeight: '600', marginBottom: 4 },
    balanceHalfValue: { fontSize: 17, fontWeight: '800' },

    dailyCard: {
      backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
      marginBottom: 12, borderWidth: 1, borderColor: t.border,
      flexDirection: 'row', alignItems: 'center',
    },
    dailyHalf: { flex: 1, alignItems: 'center' },
    dailyDivider: { width: 1, backgroundColor: t.border, height: 36, marginHorizontal: 8 },
    dailyValue: { fontSize: 18, fontWeight: '900', marginBottom: 3 },
    dailyLabel: { fontSize: 11, color: t.textMuted, fontWeight: '600' },

    alertBanner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
    },
    alertTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    alertMsg: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

    card: {
      backgroundColor: t.card, borderRadius: 18, padding: 18, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
      shadowColor: '#000', shadowOpacity: t.mode === 'dark' ? 0.3 : 0.04, shadowRadius: 8, elevation: 2,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: t.text, marginBottom: 14 },
    cardBadge: { fontSize: 12, fontWeight: '700' },

    warnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.border },
    warnCat: { fontSize: 14, fontWeight: '700', color: t.text },
    warnMeta: { fontSize: 12, color: t.textMuted, marginTop: 1 },
    warnBadge: { fontSize: 12, fontWeight: '800' },

    progressBg: { height: 8, backgroundColor: t.progressBg, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 4 },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    progressText: { fontSize: 12, color: t.textMuted },
    progressPct: { fontSize: 13, fontWeight: '800' },

    catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    catIconWrap: {
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center',
    },
    catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    catName: { fontSize: 13, fontWeight: '600', color: t.text },
    catAmt: { fontSize: 13, fontWeight: '800', color: t.text },
    catBarBg: { height: 4, backgroundColor: t.progressBg, borderRadius: 2, overflow: 'hidden' },
    catBarFill: { height: '100%', borderRadius: 2 },
    catLimitText: { fontSize: 10, color: t.textMuted, marginTop: 3 },

    txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.border },
    txIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center' },
    txName: { fontSize: 14, fontWeight: '600', color: t.text },
    txMeta: { fontSize: 12, color: t.textMuted, marginTop: 1 },
    txAmt: { fontSize: 14, fontWeight: '800' },

    onboardCard: {
      backgroundColor: t.card, borderRadius: 18, padding: 20,
      borderWidth: 1, borderColor: t.border,
    },
    onboardTitle: { fontSize: 17, fontWeight: '800', color: t.text, marginBottom: 4 },
    onboardSub: { fontSize: 13, color: t.textMuted, marginBottom: 20 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBadge: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    stepNum: { fontSize: 13, fontWeight: '900' },
    stepTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    stepDesc: { fontSize: 12, color: t.textMuted },
    stepDivider: { height: 1, backgroundColor: t.border, marginVertical: 14 },
    stepBtn: {
      borderWidth: 1.5, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 6,
    },
    stepBtnText: { fontSize: 12, fontWeight: '700' },
  });
}
