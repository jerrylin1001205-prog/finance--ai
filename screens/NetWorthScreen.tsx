import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../services/languageContext';

interface NetWorthItem {
  id: string;
  name: string;
  amount: number;
  type: 'asset' | 'liability';
}

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
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
  const { tr } = useLanguage();
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
    Alert.alert(tr.delete_label, 'Remove this item?', [
      { text: tr.cancel, style: 'cancel' },
      {
        text: tr.delete_label, style: 'destructive', onPress: async () => {
          const updated = items.filter(i => i.id !== id);
          await save(updated);
          setItems(updated);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{tr.net_worth}</Text>

      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>{tr.total_net_worth}</Text>
        <Text style={[styles.netWorthAmount, { color: netWorth >= 0 ? '#fff' : '#FCA5A5' }]}>
          ${netWorth.toFixed(2)}
        </Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.miniLabel}>{tr.assets}</Text>
            <Text style={styles.miniAmount}>${totalAssets.toFixed(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.half}>
            <Text style={styles.miniLabel}>{tr.liabilities}</Text>
            <Text style={[styles.miniAmount, { color: '#FCA5A5' }]}>${totalLiabilities.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>{tr.add_item}</Text>
      </TouchableOpacity>

      {assets.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.assets}</Text>
          {assets.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemAmount, { color: COLORS.income }]}>${item.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>{tr.remove}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {liabilities.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.liabilities}</Text>
          {liabilities.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemAmount, { color: COLORS.expense }]}>${item.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>{tr.remove}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{tr.net_worth_empty}</Text>
        </View>
      )}

      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{tr.add_item}</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'asset' && { backgroundColor: COLORS.income }]}
                onPress={() => setType('asset')}
              >
                <Text style={[styles.typeBtnText, type === 'asset' && { color: '#fff' }]}>{tr.asset_label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'liability' && { backgroundColor: COLORS.expense }]}
                onPress={() => setType('liability')}
              >
                <Text style={[styles.typeBtnText, type === 'liability' && { color: '#fff' }]}>{tr.liability_label}</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Name (e.g. Savings Account)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Amount ($)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>{tr.cancel}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 16, marginBottom: 16 },
  netWorthCard: {
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, marginBottom: 16,
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
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  itemAmount: { fontSize: 14, fontWeight: '700', marginRight: 12 },
  deleteText: { fontSize: 12, color: COLORS.expense, fontWeight: '600' },
  empty: { padding: 20 },
  emptyText: { textAlign: 'center', color: COLORS.sub, fontSize: 14, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' },
  typeBtnText: { fontWeight: '700', color: COLORS.sub },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 12, backgroundColor: COLORS.bg,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelBtnText: { fontWeight: '700', color: COLORS.sub },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { fontWeight: '700', color: '#fff' },
});
