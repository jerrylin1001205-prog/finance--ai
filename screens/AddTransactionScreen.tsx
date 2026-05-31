import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addExpense, getMonthlyIncome, getMonthExpenses } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';

const PRIMARY = '#6366F1';

const CATEGORIES = [
  { name: 'Food',          icon: '🍔', color: '#F59E0B' },
  { name: 'Transport',     icon: '🚗', color: '#3B82F6' },
  { name: 'Bills',         icon: '💡', color: '#8B5CF6' },
  { name: 'Shopping',      icon: '🛍️', color: '#EC4899' },
  { name: 'Health',        icon: '💊', color: '#10B981' },
  { name: 'Entertainment', icon: '🎬', color: '#06B6D4' },
  { name: 'Rent',          icon: '🏠', color: '#F97316' },
  { name: 'Other',         icon: '📦', color: '#6B7280' },
];

export default function AddTransactionScreen() {
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

  const selectedCat = CATEGORIES.find(c => c.name === category);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <Text style={styles.headerSub}>
            {income > 0
              ? `${fmt(income - totalSpent)} remaining this month`
              : 'Set your income first to track budget'}
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Success */}
          {saved && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.successText}>Expense saved successfully!</Text>
            </View>
          )}

          {/* Item name */}
          <View style={styles.card}>
            <Text style={styles.label}>WHAT DID YOU SPEND ON?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Lunch, Uber, Netflix..."
              value={itemName}
              onChangeText={setItemName}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Category */}
          <View style={styles.card}>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => {
                const active = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[styles.catChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={styles.catEmoji}>{cat.icon}</Text>
                    <Text style={[styles.catText, active && { color: '#fff' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.card}>
            <Text style={styles.label}>AMOUNT ({getCurrency().code})</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{getCurrency().symbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#CBD5E1"
              />
            </View>
            {income > 0 && parsedAmount > 0 && (
              <Text style={styles.amountHint}>
                Remaining after: <Text style={{ fontWeight: '800', color: remainingAfter < 0 ? '#EF4444' : '#10B981' }}>{fmt(Math.abs(remainingAfter))}{remainingAfter < 0 ? ' over budget' : ' left'}</Text>
              </Text>
            )}
          </View>

          {/* Warning */}
          {isOverBudget && (
            <View style={[styles.alertCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="warning" size={18} color="#EF4444" />
              <Text style={[styles.alertText, { color: '#EF4444' }]}>
                This puts you {fmt(Math.abs(remainingAfter))} over your monthly budget!
              </Text>
            </View>
          )}
          {isNearLimit && (
            <View style={[styles.alertCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <Text style={[styles.alertText, { color: '#D97706' }]}>
                You'll only have {fmt(remainingAfter)} left this month.
              </Text>
            </View>
          )}

          {/* Error */}
          {error !== '' && (
            <View style={[styles.alertCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="close-circle" size={18} color="#EF4444" />
              <Text style={[styles.alertText, { color: '#EF4444' }]}>{error}</Text>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={saving ? ['#94A3B8', '#94A3B8'] : [PRIMARY, '#4F46E5']}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Expense</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  body: { padding: 16, marginTop: -16 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 14, fontWeight: '700', color: '#10B981' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 14 },
  textInput: { fontSize: 17, color: '#0F172A', fontWeight: '600', borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingBottom: 10 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  catEmoji: { fontSize: 15 },
  catText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySymbol: { fontSize: 32, fontWeight: '900', color: '#CBD5E1' },
  amountInput: { flex: 1, fontSize: 42, fontWeight: '900', color: '#0F172A', paddingBottom: 4 },
  amountHint: { fontSize: 13, color: '#94A3B8', marginTop: 10, fontWeight: '500' },

  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1,
  },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 18,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
