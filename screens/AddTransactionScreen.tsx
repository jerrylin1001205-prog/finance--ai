import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { saveTransaction } from '../services/storage';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Rent', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
  Salary: '💼', Freelance: '💻', Business: '📊', Investment: '📈',
};

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

export default function AddTransactionScreen({ navigation }: any) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    await saveTransaction({
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      note,
      date: new Date().toISOString(),
    });

    Alert.alert('Saved!', 'Transaction added successfully', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Add Transaction 💰</Text>

        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && { backgroundColor: COLORS.expense }]}
            onPress={() => { setType('expense'); setCategory(''); }}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && { color: '#fff' }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && { backgroundColor: COLORS.income }]}
            onPress={() => { setType('income'); setCategory(''); }}
          >
            <Text style={[styles.typeBtnText, type === 'income' && { color: '#fff' }]}>Income</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={COLORS.sub}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.catGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.catEmoji}>{CATEGORY_EMOJI[cat] || '📦'}</Text>
                <Text style={[styles.catChipText, category === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note..."
            value={note}
            onChangeText={setNote}
            placeholderTextColor={COLORS.sub}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginVertical: 16 },
  typeToggle: {
    flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12,
    padding: 4, marginBottom: 16,
  },
  typeBtn: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.sub },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.sub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  amountInput: { fontSize: 38, fontWeight: '800', color: COLORS.text, borderBottomWidth: 2, borderBottomColor: COLORS.primary, paddingBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  catEmoji: { fontSize: 15 },
  catChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  noteInput: { fontSize: 15, color: COLORS.text, minHeight: 60 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 17,
    alignItems: 'center', marginBottom: 40, shadowColor: COLORS.primary,
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
