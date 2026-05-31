import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Platform, Alert, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getUser, signOut,
  getCategoryLimits, saveCategoryLimit, deleteCategoryLimit,
  CategoryLimit, getMonthExpenses, Expense, removeExpense,
} from '../services/supabase';
import { getCurrency, CURRENCIES, saveCurrency, Currency, fmt } from '../utils/currency';
import { useTheme, setTheme } from '../utils/theme';

const PRIMARY = '#6366F1';
const BG = '#F0F4F8';

const CATEGORIES: { name: string; emoji: string }[] = [
  { name: 'Food', emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Bills', emoji: '💡' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Health', emoji: '💊' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Rent', emoji: '🏠' },
  { name: 'Other', emoji: '📦' },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const t = useTheme();
  const [userEmail, setUserEmail] = useState('');
  const [currency, setCurrency] = useState(getCurrency());
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const isDark = t.mode === 'dark';

  const handleToggleTheme = async () => {
    await setTheme(isDark ? 'light' : 'dark');
  };

  // Currency picker modal
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Category limit modal
  const [limitModal, setLimitModal] = useState<{ category: string; emoji: string } | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [limitSaving, setLimitSaving] = useState(false);
  const [limitError, setLimitError] = useState('');

  // Sign out confirm
  const [showSignOut, setShowSignOut] = useState(false);

  const load = async () => {
    const [user, lims, exps] = await Promise.all([
      getUser(),
      getCategoryLimits(),
      getMonthExpenses(),
    ]);
    if (user?.email) setUserEmail(user.email);
    setLimits(lims);
    setExpenses(exps);
    setCurrency(getCurrency());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const getLimit = (cat: string) => limits.find(l => l.category === cat)?.limit_amount ?? null;

  const openLimitModal = (cat: string, emoji: string) => {
    const existing = getLimit(cat);
    setLimitInput(existing != null ? String(existing) : '');
    setLimitError('');
    setLimitModal({ category: cat, emoji });
  };

  const handleSaveLimit = async () => {
    if (!limitModal) return;
    const val = parseFloat(limitInput);
    if (!limitInput.trim() || isNaN(val) || val <= 0) {
      setLimitError('Please enter a valid positive amount.');
      return;
    }
    setLimitSaving(true);
    try {
      await saveCategoryLimit(limitModal.category, val);
      await load();
      setLimitModal(null);
    } catch (e: any) {
      setLimitError(e.message ?? 'Failed to save.');
    } finally {
      setLimitSaving(false);
    }
  };

  const handleDeleteLimit = async () => {
    if (!limitModal) return;
    setLimitSaving(true);
    try {
      await deleteCategoryLimit(limitModal.category);
      await load();
      setLimitModal(null);
    } finally {
      setLimitSaving(false);
    }
  };

  const handleChangeCurrency = async (cur: Currency) => {
    await saveCurrency(cur);
    setCurrency(cur);
    setShowCurrencyModal(false);
  };

  const handleSignOut = async () => {
    setShowSignOut(false);
    await signOut();
  };

  const handleClearMonthData = () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'There are no expenses to clear this month.');
      return;
    }
    Alert.alert(
      'Clear This Month\'s Expenses',
      `This will permanently delete all ${expenses.length} expense(s) for this month. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All', style: 'destructive', onPress: async () => {
            for (const exp of expenses) {
              await removeExpense(exp.id);
            }
            await load();
          },
        },
      ]
    );
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      setExportSuccess(false);
      return;
    }
    const csv = 'Date,Item,Category,Amount\n' + expenses.map(e =>
      `${new Date(e.date).toLocaleDateString()},${e.item_name},${e.category},${e.amount}`
    ).join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finance-ai-expenses.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Mobile: show the CSV as text in an alert so users can copy it
      Alert.alert('Export Data', 'Copy the text below to save your expenses:\n\n' + csv);
    }
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : 'U';

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Manage your account & preferences</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* ── Account section ── */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          {/* User avatar row */}
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userEmailText}>{userEmail}</Text>
              <Text style={styles.userSub}>Signed in</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Dark Mode toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingValue}>{isDark ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#E2E8F0', true: PRIMARY }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Change Currency */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowCurrencyModal(true)}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="cash-outline" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingValue}>{currency.flag} {currency.code} — {currency.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Sign Out */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowSignOut(true)}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.settingLabel, { color: '#EF4444', flex: 1 }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Category Budget Limits ── */}
        <SectionHeader title="CATEGORY SPENDING LIMITS" />
        <Text style={styles.sectionDesc}>
          Set a maximum amount per category per month. You'll see a warning when you're close.
        </Text>
        <View style={styles.card}>
          {CATEGORIES.map((cat, i) => {
            const lim = getLimit(cat.name);
            const hasLimit = lim !== null;
            return (
              <React.Fragment key={cat.name}>
                {i > 0 && <View style={styles.divider} />}
                <TouchableOpacity style={styles.settingRow} onPress={() => openLimitModal(cat.name, cat.emoji)}>
                  <View style={styles.catEmojiWrap}>
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{cat.name}</Text>
                    <Text style={styles.settingValue}>
                      {hasLimit ? fmt(lim!) + ' / month' : 'No limit set'}
                    </Text>
                  </View>
                  <View style={[styles.badge, hasLimit ? styles.badgeGreen : styles.badgeGray]}>
                    <Text style={[styles.badgeText, hasLimit ? styles.badgeTextGreen : styles.badgeTextGray]}>
                      {hasLimit ? 'Set' : 'None'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Data & Export ── */}
        <SectionHeader title="DATA & EXPORT" />
        <View style={styles.card}>
          {exportSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>CSV exported successfully!</Text>
            </View>
          )}
          <TouchableOpacity style={styles.settingRow} onPress={handleExportCSV}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="download-outline" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Export to CSV</Text>
              <Text style={styles.settingValue}>Download this month's expenses</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleClearMonthData}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Clear This Month's Expenses</Text>
              <Text style={styles.settingValue}>Permanently deletes all expenses for this month</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── About ── */}
        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              if (Platform.OS === 'web') {
                (window as any).open('mailto:support@financeai.app');
              }
            }}
          >
            <View style={styles.settingIconWrap}>
              <Ionicons name="mail-outline" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Contact Support</Text>
              <Text style={styles.settingValue}>support@financeai.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <LinearGradient colors={[PRIMARY, '#4F46E5']} style={styles.aboutIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.aboutIconText}>F</Text>
          </LinearGradient>
          <Text style={styles.aboutAppName}>Finance AI</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutTagline}>Built with security and privacy in mind</Text>
          <Text style={styles.aboutMeta}>256-bit encryption · No ads · Your data stays yours</Text>
          <View style={styles.supabaseBadge}>
            <Text style={styles.supabaseBadgeText}>⚡ Powered by Supabase</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Currency picker modal ── */}
      <Modal visible={showCurrencyModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {CURRENCIES.map(cur => {
                const isActive = cur.code === currency.code;
                return (
                  <TouchableOpacity
                    key={cur.code}
                    style={[styles.currencyRow, isActive && styles.currencyRowActive]}
                    onPress={() => handleChangeCurrency(cur)}
                  >
                    <Text style={styles.currencyFlag}>{cur.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.currencyCode}>{cur.code}</Text>
                      <Text style={styles.currencyLabel}>{cur.label}</Text>
                    </View>
                    <Text style={styles.currencySymbol}>{cur.symbol}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={18} color={PRIMARY} style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Category limit modal ── */}
      <Modal visible={limitModal !== null} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>
                {limitModal?.emoji} {limitModal?.category} Limit
              </Text>
              <TouchableOpacity onPress={() => setLimitModal(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>MONTHLY LIMIT ({currency.code})</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.amountSymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={limitInput}
                onChangeText={t => { setLimitInput(t); setLimitError(''); }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                autoFocus
              />
            </View>
            {limitError !== '' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{limitError}</Text>
              </View>
            )}
            <View style={styles.modalBtns}>
              {getLimit(limitModal?.category ?? '') !== null && (
                <TouchableOpacity style={styles.deleteLimitBtn} onPress={handleDeleteLimit} disabled={limitSaving}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteLimitText}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveLimitBtn, { flex: 1 }, limitSaving && { opacity: 0.7 }]}
                onPress={handleSaveLimit}
                disabled={limitSaving}
              >
                <LinearGradient colors={[PRIMARY, '#4F46E5']} style={styles.saveLimitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {limitSaving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveLimitText}>Save Limit</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Sign out confirm modal ── */}
      <Modal visible={showSignOut} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <View style={styles.signOutIcon}>
              <Ionicons name="log-out-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalMsg}>You'll need to sign in again to access your data.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSignOut(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutConfirmBtn} onPress={handleSignOut}>
                <Text style={styles.signOutConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },

  body: { flex: 1, paddingHorizontal: 16, marginTop: -16 },

  sectionHeader: {
    fontSize: 12, fontWeight: '800', color: '#64748B',
    letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4,
  },
  sectionDesc: {
    fontSize: 13, color: '#94A3B8', lineHeight: 20,
    marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    marginBottom: 8, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 16 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '900' },
  userEmailText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  userSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  catEmojiWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  settingValue: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeGray: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextGreen: { color: '#059669' },
  badgeTextGray: { color: '#94A3B8' },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12,
    margin: 16, marginBottom: 0,
  },
  successText: { fontSize: 13, fontWeight: '700', color: '#059669' },

  aboutIcon: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  aboutIconText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  aboutAppName: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  aboutVersion: { fontSize: 13, color: '#94A3B8', marginBottom: 16 },
  aboutDivider: { width: 40, height: 2, backgroundColor: '#E2E8F0', borderRadius: 1, marginBottom: 16 },
  aboutTagline: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  aboutMeta: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  supabaseBadge: {
    marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  supabaseBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 420 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: '#0F172A' },
  modalMsg: { fontSize: 14, color: '#64748B', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  currencyRowActive: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 8 },
  currencyFlag: { fontSize: 22 },
  currencyCode: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  currencyLabel: { fontSize: 12, color: '#94A3B8' },
  currencySymbol: { fontSize: 15, fontWeight: '700', color: '#64748B', minWidth: 32, textAlign: 'right' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  amountSymbol: { fontSize: 28, fontWeight: '900', color: '#CBD5E1' },
  amountInput: {
    flex: 1, fontSize: 32, fontWeight: '900', color: '#0F172A',
    borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingBottom: 4,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10,
  },
  errorText: { fontSize: 13, color: '#EF4444', fontWeight: '600', flex: 1 },

  deleteLimitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#FCA5A5',
  },
  deleteLimitText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  saveLimitBtn: { borderRadius: 12, overflow: 'hidden' },
  saveLimitGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  saveLimitText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  signOutIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  signOutConfirmBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#EF4444',
  },
  signOutConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
