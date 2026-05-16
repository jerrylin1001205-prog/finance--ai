import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetWorthItem {
  id: string;
  name: string;
  amount: number;
  type: 'asset' | 'liability';
}

const COLORS = {
  primary: '#6C63FF',
  income: '#4CAF50',
  expense: '#F44336',
  bg: '#F0F2FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
};

const KEY = 'networth_items';

const load = async (): Promise<NetWorthItem[]> => {
  const d = await AsyncStorage.getItem(KEY);
  return d ? JSON.parse(d) : [];
};

const save = async (items: NetWorthItem[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
};

export default function NetWorthScreen() {
  const [items, setItems] = useState<NetWorthItem[]>([]);
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<'asset' | 'liability'>('asset');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useFocusEffect(useCallback(() => { load().then(setItems); }, []));

  const assets = items.filter(i => i.type === 'asset');
  const liabilities = items.filter(i => i.type === 'liability');
  const totalAssets = assets.reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + i.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a name'); return; }
    if (!amount || isNaN(parseFloat(amount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    const updated = [...items, { id: Date.now().toString(), name: name.trim(), amount: parseFloat(amount), type }];
    await save(updated);
    setItems(updated);
    setModal(false);
    setName('');
    setAmount('');
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = items.filter(i => i.id !== id);
          await save(updated);
          setItems(updated);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Net Worth</Text>

      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Total Net Worth</Text>
        <Text style={[styles.netWorthAmount, { color: netWorth >= 0 ? '#fff' : '#FFCDD2' }]}>
          ${netWorth.toFixed(2)}
        </Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.miniLabel}>Assets</Text>
            <Text style={styles.miniAmount}>${totalAssets.toFixed(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.half}>
            <Text style={styles.miniLabel}>Liabilities</Text>
            <Text style={[styles.miniAmount, { color: '#FFCDD2' }]}>${totalLiabilities.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>+ Add Item</Text>
      </TouchableOpacity>

      {assets.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assets</Text>
          {assets.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemAmount, { color: COLORS.income }]}>${item.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {liabilities.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Liabilities</Text>
          {liabilities.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemAmount, { color: COLORS.expense }]}>${item.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Add assets (savings, property, investments) and liabilities (loans, credit cards) to track your net worth.</Text>
        </View>
      )}

      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'asset' && { backgroundColor: COLORS.income }]}
                onPress={() => setType('asset')}
              >
                <Text style={[styles.typeBtnText, type === 'asset' && { color: '#fff' }]}>Asset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'liability' && { backgroundColor: COLORS.expense }]}
                onPress={() => setType('liability')}
              >
                <Text style={[styles.typeBtnText, type === 'liability' && { color: '#fff' }]}>Liability</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Name (e.g. Savings Account)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Amount ($)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginTop: 16, marginBottom: 16 },
  netWorthCard: {
    backgroundColor: '#6C63FF', borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  netWorthLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  netWorthAmount: { fontSize: 40, fontWeight: '800', marginVertical: 6 },
  row: { flexDirection: 'row', marginTop: 12 },
  half: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  miniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  miniAmount: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  addBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemName: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '600' },
  itemAmount: { fontSize: 14, fontWeight: '700', marginRight: 12 },
  deleteText: { fontSize: 12, color: '#F44336', fontWeight: '600' },
  empty: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#6B7280', fontSize: 14, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F0F2FF' },
  typeBtnText: { fontWeight: '700', color: '#6B7280' },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0EE', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1A1A2E', marginBottom: 12, backgroundColor: '#F0F2FF',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F2FF' },
  cancelBtnText: { fontWeight: '700', color: '#6B7280' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#6C63FF' },
  saveBtnText: { fontWeight: '700', color: '#fff' },
});
