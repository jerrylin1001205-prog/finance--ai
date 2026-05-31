import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { addExpense, getMonthlyIncome, getMonthExpenses } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';

const CATEGORIES = [
  { name: 'Food', icon: '🍔' }, { name: 'Transport', icon: '🚗' },
  { name: 'Bills', icon: '💡' }, { name: 'Shopping', icon: '🛍️' },
  { name: 'Health', icon: '💊' }, { name: 'Entertainment', icon: '🎬' },
  { name: 'Rent', icon: '🏠' }, { name: 'Other', icon: '📦' },
];

export default function AddTransactionScreen() {
  const t = useTheme();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [income, setIncome] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      const [inc, exps] = await Promise.all([getMonthlyIncome(), getMonthExpenses()]);
      setIncome(inc);
      setTotalSpent(exps.reduce((s, e) => s + e.amount, 0));
    })();
  }, []));

  const parsedAmount = parseFloat(amount) || 0;
  const remainingAfter = income - totalSpent - parsedAmount;
  const isOverBudget = income > 0 && parsedAmount > 0 && remainingAfter < 0;
  const isNearLimit = income > 0 && parsedAmount > 0 && remainingAfter >= 0 && remainingAfter < income * 0.2;

  const handleSave = async () => {
    setError('');
    if (!itemName.trim()) { setError('Please enter an item name.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!parsedAmount || parsedAmount <= 0) { setError('Please enter a valid amount.'); return; }
    setSaving(true);
    try {
      await addExpense(itemName.trim(), category, parsedAmount);
      setSaved(true);
      setItemName(''); setCategory(''); setAmount('');
      setTotalSpent(prev => prev + parsedAmount);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(t);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Add Expense</Text>
          <Text style={s.headerSub}>
            {income > 0 ? `${fmt(income - totalSpent)} remaining this month` : 'Set your income to track budget'}
          </Text>
        </View>

        <View style={s.body}>
          {saved && (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={t.income} />
              <Text style={[s.bannerText, { color: t.income }]}>Expense saved!</Text>
            </View>
          )}

          {/* Name */}
          <View style={s.card}>
            <Text style={s.label}>WHAT DID YOU SPEND ON?</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Lunch, Uber, Netflix..."
              placeholderTextColor={t.textMuted}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          {/* Category */}
          <View style={s.card}>
            <Text style={s.label}>CATEGORY</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => {
                const active = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[s.catChip, active && { backgroundColor: t.primary, borderColor: t.primary }]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={s.catEmoji}>{cat.icon}</Text>
                    <Text style={[s.catText, active && { color: '#fff' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount */}
          <View style={s.card}>
            <Text style={s.label}>AMOUNT ({getCurrency().code})</Text>
            <View style={s.amountRow}>
              <Text style={s.currencySymbol}>{getCurrency().symbol}</Text>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={t.textMuted}
              />
            </View>
            {income > 0 && parsedAmount > 0 && (
              <Text style={[s.amountHint, { color: remainingAfter < 0 ? t.expense : t.textMuted }]}>
                Remaining after: {fmt(Math.abs(remainingAfter))}{remainingAfter < 0 ? ' over budget' : ' left'}
              </Text>
            )}
          </View>

          {isOverBudget && (
            <View style={[s.alertCard, { borderColor: t.mode === 'dark' ? '#7f1d1d' : '#FECACA', backgroundColor: t.mode === 'dark' ? '#450a0a' : '#FEF2F2' }]}>
              <Ionicons name="warning" size={16} color={t.expense} />
              <Text style={[s.alertText, { color: t.expense }]}>This puts you {fmt(Math.abs(remainingAfter))} over budget!</Text>
            </View>
          )}
          {isNearLimit && (
            <View style={[s.alertCard, { borderColor: '#FDE68A', backgroundColor: t.mode === 'dark' ? '#451a03' : '#FFFBEB' }]}>
              <Ionicons name="alert-circle" size={16} color="#D97706" />
              <Text style={[s.alertText, { color: '#D97706' }]}>Only {fmt(remainingAfter)} left this month.</Text>
            </View>
          )}
          {error !== '' && (
            <View style={[s.alertCard, { borderColor: t.mode === 'dark' ? '#7f1d1d' : '#FECACA', backgroundColor: t.mode === 'dark' ? '#450a0a' : '#FEF2F2' }]}>
              <Ionicons name="close-circle" size={16} color={t.expense} />
              <Text style={[s.alertText, { color: t.expense }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? t.textMuted : t.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="add-circle" size={18} color="#fff" /><Text style={s.saveBtnText}>Save Expense</Text></>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: { backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 28 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: t.headerText, marginBottom: 4 },
    headerSub: { fontSize: 13, color: t.headerSub },
    body: { padding: 16 },

    successBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.mode === 'dark' ? '#052e16' : '#F0FDF4',
      borderRadius: 12, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: t.mode === 'dark' ? '#166534' : '#BBF7D0',
    },
    bannerText: { fontSize: 14, fontWeight: '700' },

    card: {
      backgroundColor: t.card, borderRadius: 16, padding: 18, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
    },
    label: { fontSize: 11, fontWeight: '800', color: t.textMuted, letterSpacing: 1.2, marginBottom: 14 },
    textInput: { fontSize: 16, color: t.text, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: t.inputBorder, paddingBottom: 8 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
      backgroundColor: t.bg2, borderWidth: 1.5, borderColor: t.border,
    },
    catEmoji: { fontSize: 14 },
    catText: { fontSize: 13, fontWeight: '600', color: t.textSub },

    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    currencySymbol: { fontSize: 28, fontWeight: '900', color: t.textMuted },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: t.text, paddingBottom: 4 },
    amountHint: { fontSize: 12, marginTop: 8, fontWeight: '500' },

    alertCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1,
    },
    alertText: { flex: 1, fontSize: 13, fontWeight: '600' },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, paddingVertical: 17, marginTop: 4,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  });
}
