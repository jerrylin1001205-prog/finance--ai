import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, deleteTransaction, Transaction } from '../services/storage';

const COLORS = {
  primary: '#6C63FF',
  income: '#4CAF50',
  expense: '#F44336',
  bg: '#F0F2FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
};

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = async () => {
    const all = await getTransactions();
    setTransactions(all.reverse());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTransaction(id);
          load();
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? COLORS.income : COLORS.expense }]} />
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.txNote}>{item.note}</Text> : null}
        <Text style={styles.txDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: item.type === 'income' ? COLORS.income : COLORS.expense }]}>
          {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Transactions</Text>
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 16, marginBottom: 16 },
  txCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  typeIndicator: { width: 5 },
  txInfo: { flex: 1, padding: 14 },
  txCategory: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  txNote: { fontSize: 13, color: COLORS.sub, marginTop: 2 },
  txDate: { fontSize: 12, color: COLORS.sub, marginTop: 4 },
  txRight: { padding: 14, alignItems: 'flex-end', justifyContent: 'space-between' },
  txAmount: { fontSize: 16, fontWeight: '800' },
  deleteBtn: { marginTop: 6 },
  deleteText: { fontSize: 12, color: COLORS.expense, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.sub },
});
