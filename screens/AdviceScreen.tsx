import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getThisMonthTransactions, getBudget, getApiKey } from '../services/storage';
import { getFinanceAdvice } from '../services/claude';

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

export default function AdviceScreen({ navigation }: any) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, txCount: 0 });

  useFocusEffect(useCallback(() => {
    getApiKey().then(k => setHasKey(!!k));
    getThisMonthTransactions().then(txs => {
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setSummary({ income, expense, txCount: txs.length });
    });
  }, []));

  const handleGetAdvice = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert('No API Key', 'Please add your Gemini API key in Settings first.', [
        { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') },
        { text: 'Cancel' },
      ]);
      return;
    }

    const txs = await getThisMonthTransactions();
    if (txs.length === 0) {
      Alert.alert('No Data', 'Add some transactions first so the AI can analyze your finances.');
      return;
    }

    const budget = await getBudget();
    setLoading(true);
    setAdvice('');
    try {
      const result = await getFinanceAdvice(apiKey, txs, budget);
      setAdvice(result);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Finance Coach</Text>
      <Text style={styles.subtitle}>Get personalized advice based on your spending this month.</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.income }]}>${summary.income.toFixed(0)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.expense }]}>${summary.expense.toFixed(0)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#EDE7F6' }]}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.primary }]}>{summary.txCount}</Text>
        </View>
      </View>

      {!hasKey && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>No API key found. Add it in Settings to enable AI advice.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.warningLink}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.analyzeBtn} onPress={handleGetAdvice} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.analyzeBtnText}>Analyze My Finances</Text>
        }
      </TouchableOpacity>

      {advice !== '' && (
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <Text style={styles.adviceHeaderText}>Your AI Advice</Text>
          </View>
          <Text style={styles.adviceText}>{advice}</Text>
        </View>
      )}

      {advice === '' && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Tap the button above to get your personalized finance analysis.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  subtitle: { fontSize: 14, color: COLORS.sub, marginTop: 4, marginBottom: 20, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.sub, textTransform: 'uppercase' },
  summaryAmount: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  warningCard: {
    backgroundColor: '#FFF9C4', borderRadius: 12, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#FFC107',
  },
  warningText: { fontSize: 13, color: '#795548' },
  warningLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 6 },
  analyzeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 18,
    alignItems: 'center', shadowColor: COLORS.primary,
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 5, marginBottom: 20,
  },
  analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  adviceCard: {
    backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 40,
  },
  adviceHeader: { backgroundColor: COLORS.primary, padding: 14 },
  adviceHeaderText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  adviceText: { padding: 20, fontSize: 15, color: COLORS.text, lineHeight: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 },
  emptyText: { textAlign: 'center', fontSize: 14, color: COLORS.sub, lineHeight: 22 },
});
