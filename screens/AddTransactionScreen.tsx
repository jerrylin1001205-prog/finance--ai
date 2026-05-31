import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { addExpense, getMonthlyIncome, getMonthExpenses } from '../services/supabase';

const PRIMARY = '#2563EB';
const C = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  expense: '#DC2626',
  warn: '#D97706',
};

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Rent', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function AddTransactionScreen({ navigation }: any) {
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
  const showWarning = income > 0 && parsedAmount > 0 && remainingAfter < income * 0.2;

  const handleSave = async () => {
    setError('');
    if (!itemName.trim()) { setError('Please enter an item name.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!parsedAmount || parsedAmount <= 0) { setError('Please enter a valid amount.'); return; }

    setSaving(true);
    try {
      await addExpense(itemName.trim(), category, parsedAmount);
      setSaved(true);
      setItemName('');
      setCategory('');
      setAmount('');
      setTotalSpent(prev => prev + parsedAmount);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Expense</Text>

        {/* Item name */}
        <View style={styles.card}>
          <Text style={styles.label}>ITEM NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Lunch at restaurant"
            value={itemName}
            onChangeText={setItemName}
            placeholderTextColor={C.sub}
          />
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.catIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.label}>AMOUNT (USD)</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={C.sub}
          />
        </View>

        {/* 20% warning */}
        {showWarning && (
          <View style={[styles.warnCard, remainingAfter < 0 && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.warnText, remainingAfter < 0 && { color: C.expense }]}>
              {remainingAfter < 0
                ? `⚠️ This expense puts you ${fmt(Math.abs(remainingAfter))} over budget!`
                : `⚠️ You'll only have ${fmt(remainingAfter)} left this month!`}
            </Text>
          </View>
        )}

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success */}
        {saved && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>Expense saved!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Expense</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 16 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: {
    fontSize: 11, fontWeight: '700', color: C.sub,
    marginBottom: 12, letterSpacing: 0.8,
  },
  textInput: {
    fontSize: 16, color: C.text, borderBottomWidth: 2,
    borderBottomColor: PRIMARY, paddingBottom: 8,
  },
  amountInput: {
    fontSize: 38, fontWeight: '800', color: C.text,
    borderBottomWidth: 2, borderBottomColor: PRIMARY, paddingBottom: 8,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  catChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catIcon: { fontSize: 14 },
  catText: { fontSize: 13, fontWeight: '600', color: C.text },
  catTextActive: { color: '#fff' },
  warnCard: {
    borderRadius: 14, backgroundColor: '#FFFBEB', padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A',
  },
  warnText: { fontSize: 14, fontWeight: '700', color: C.warn, lineHeight: 22 },
  errorCard: {
    borderRadius: 14, backgroundColor: '#FEF2F2', padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: C.expense, fontWeight: '600' },
  successCard: {
    borderRadius: 14, backgroundColor: '#F0FDF4', padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  saveBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, padding: 17,
    alignItems: 'center', marginBottom: 40,
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
