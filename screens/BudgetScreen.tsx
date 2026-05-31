import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthlyIncome, saveMonthlyIncome, signOut } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';

const PRIMARY = '#2563EB';
const C = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  income: '#16A34A',
};

function monthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}


export default function BudgetScreen() {
  const [current, setCurrent] = useState(0);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    getMonthlyIncome().then(inc => {
      setCurrent(inc);
      if (inc > 0) setAmount(inc.toString());
    });
  }, []));

  const handleSave = async () => {
    setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Please enter a valid income amount.'); return; }
    setSaving(true);
    try {
      await saveMonthlyIncome(val);
      setCurrent(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Monthly Income</Text>
        <Text style={styles.subtitle}>{monthLabel()}</Text>

        {current > 0 && (
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current income set</Text>
            <Text style={styles.currentAmount}>{fmt(current)}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>SET YOUR MONTHLY INCOME ({getCurrency().code})</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={C.sub}
          />
          <Text style={styles.hint}>
            Enter your total income for this month. You can update it anytime.
          </Text>
        </View>

        {error !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {saved && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>Income saved for {monthLabel()}!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Income</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.sub, marginBottom: 20 },
  currentCard: {
    borderRadius: 16, backgroundColor: '#F0FDF4', padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  currentLabel: { fontSize: 12, color: C.income, fontWeight: '600', marginBottom: 4 },
  currentAmount: { fontSize: 32, fontWeight: '800', color: C.income },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: { fontSize: 11, fontWeight: '700', color: C.sub, marginBottom: 12, letterSpacing: 0.8 },
  amountInput: {
    fontSize: 38, fontWeight: '800', color: C.text,
    borderBottomWidth: 2, borderBottomColor: PRIMARY, paddingBottom: 8, marginBottom: 12,
  },
  hint: { fontSize: 13, color: C.sub, lineHeight: 20 },
  errorCard: {
    borderRadius: 14, backgroundColor: '#FEF2F2', padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  successCard: {
    borderRadius: 14, backgroundColor: '#F0FDF4', padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 14, color: C.income, fontWeight: '600' },
  saveBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, padding: 17,
    alignItems: 'center', marginBottom: 14,
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signOutBtn: {
    borderRadius: 14, padding: 17, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 40,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: C.sub },
});
