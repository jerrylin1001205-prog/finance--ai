import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthExpenses, removeExpense, updateExpense, Expense } from '../services/supabase';

const PRIMARY = '#2563EB';
const C = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  expense: '#DC2626',
  income: '#16A34A',
};

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Rent', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};

function fmt(n: number) {
  return 'NT$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = async () => {
    const data = await getMonthExpenses();
    setExpenses(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const openEdit = (item: Expense) => {
    setEditTarget(item);
    setEditName(item.item_name);
    setEditCategory(item.category);
    setEditAmount(item.amount.toString());
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditError('');
    const amt = parseFloat(editAmount);
    if (!editName.trim()) { setEditError('Item name is required.'); return; }
    if (!editCategory) { setEditError('Please select a category.'); return; }
    if (!amt || amt <= 0) { setEditError('Please enter a valid amount.'); return; }
    setEditSaving(true);
    try {
      await updateExpense(editTarget.id, editName.trim(), editCategory, amt);
      setEditTarget(null);
      load();
    } catch (e: any) {
      setEditError(e.message ?? 'Failed to save.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeExpense(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.txCard}>
      <View style={styles.txIconWrap}>
        <Text style={styles.txIcon}>{CATEGORY_ICONS[item.category] ?? '📦'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{item.item_name}</Text>
        <Text style={styles.txMeta}>{item.category} · {formatDate(item.date)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmt}>{fmt(item.amount)}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteTarget({ id: item.id, name: item.item_name })} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>{monthLabel()}</Text>

      {expenses.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total spent this month</Text>
          <Text style={styles.totalAmt}>{fmt(totalSpent)}</Text>
        </View>
      )}

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No expenses recorded this month</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Expense</Text>
            <Text style={styles.modalMsg}>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalDeleteText}>Delete</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal visible={editTarget !== null} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.editCard}>
            <Text style={styles.modalTitle}>Edit Expense</Text>

            <Text style={styles.fieldLabel}>ITEM NAME</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={C.sub}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, editCategory === cat && styles.catChipActive]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text style={styles.catChipIcon}>{CATEGORY_ICONS[cat]}</Text>
                    <Text style={[styles.catChipText, editCategory === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>AMOUNT (NT$)</Text>
            <TextInput
              style={[styles.fieldInput, styles.amountField]}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={C.sub}
            />

            {editError !== '' && (
              <Text style={styles.editError}>{editError}</Text>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditTarget(null)}
                disabled={editSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleEditSave}
                disabled={editSaving}
              >
                {editSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: C.text, marginTop: 16, marginBottom: 2 },
  subtitle: { fontSize: 13, color: C.sub, marginBottom: 16 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: C.sub },
  totalAmt: { fontSize: 18, fontWeight: '800', color: C.expense },
  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 14, marginBottom: 10, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  txIconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '700', color: C.text },
  txMeta: { fontSize: 12, color: C.sub, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmt: { fontSize: 16, fontWeight: '800', color: C.expense },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  editBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EFF6FF' },
  editText: { fontSize: 12, color: PRIMARY, fontWeight: '700' },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FEF2F2' },
  deleteText: { fontSize: 12, color: C.expense, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: C.sub },

  // Modals
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400,
  },
  editCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 440,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 10 },
  modalMsg: { fontSize: 14, color: C.sub, lineHeight: 22, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: C.sub },
  modalDeleteBtn: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    backgroundColor: C.expense,
  },
  modalDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalSaveBtn: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    backgroundColor: PRIMARY,
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Edit form
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.8, marginBottom: 8,
  },
  fieldInput: {
    borderBottomWidth: 2, borderBottomColor: PRIMARY,
    fontSize: 16, color: C.text, paddingBottom: 6, marginBottom: 4,
  },
  amountField: { fontSize: 28, fontWeight: '800' },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  catChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catChipIcon: { fontSize: 13 },
  catChipText: { fontSize: 13, fontWeight: '600', color: C.text },
  catChipTextActive: { color: '#fff' },
  editError: { fontSize: 13, color: C.expense, marginTop: 8, fontWeight: '600' },
});
