import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMonthExpenses, removeExpense, updateExpense, Expense } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';

const PRIMARY = '#6366F1';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Rent', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', Transport: '#3B82F6', Bills: '#8B5CF6', Shopping: '#EC4899',
  Health: '#10B981', Entertainment: '#06B6D4', Rent: '#F97316', Other: '#6B7280',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = async () => { setExpenses(await getMonthExpenses()); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const csv = 'Date,Item,Category,Amount\n' + expenses.map(e =>
      `${new Date(e.date).toLocaleDateString()},${e.item_name},${e.category},${e.amount}`
    ).join('\n');
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'finance-ai-expenses.csv'; a.click();
      URL.revokeObjectURL(url);
    }
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const openEdit = (item: Expense) => {
    setEditTarget(item); setEditName(item.item_name);
    setEditCategory(item.category); setEditAmount(item.amount.toString()); setEditError('');
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
      setEditTarget(null); load();
    } catch (e: any) { setEditError(e.message ?? 'Failed to save.'); }
    finally { setEditSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeExpense(deleteTarget.id); setDeleteTarget(null); load(); }
    finally { setDeleting(false); }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const renderItem = ({ item, index }: { item: Expense; index: number }) => {
    const color = CATEGORY_COLORS[item.category] ?? '#6B7280';
    return (
      <View style={styles.txCard}>
        <View style={[styles.txIconWrap, { backgroundColor: color + '18' }]}>
          <Text style={styles.txEmoji}>{CATEGORY_ICONS[item.category] ?? '📦'}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txName}>{item.item_name}</Text>
          <Text style={styles.txMeta}>{item.category} · {formatDate(item.date)}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={styles.txAmt}>-{fmt(item.amount)}</Text>
          <View style={styles.txActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil" size={12} color={PRIMARY} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget({ id: item.id, name: item.item_name })}>
              <Ionicons name="trash" size={12} color="#EF4444" />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {expenses.length > 0 && (
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Export success banner */}
        {exportSuccess && (
          <View style={styles.exportSuccessBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.exportSuccessText}>CSV exported successfully!</Text>
          </View>
        )}

        {/* Summary */}
        {expenses.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryValue}>{expenses.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{fmt(totalSpent)}</Text>
            </View>
          </View>
        )}

        {expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Expenses you log this month will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>

      {/* Delete modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Expense</Text>
            <Text style={styles.modalMsg}>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteTarget(null)} disabled={deleting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmDeleteText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editTarget !== null} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.editCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>ITEM NAME</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => {
                  const active = editCategory === cat;
                  const color = CATEGORY_COLORS[cat] ?? '#6B7280';
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, active && { backgroundColor: color, borderColor: color }]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={styles.catEmoji}>{CATEGORY_ICONS[cat]}</Text>
                      <Text style={[styles.catText, active && { color: '#fff' }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>AMOUNT ({getCurrency().code})</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{getCurrency().symbol}</Text>
              <TextInput
                style={styles.amountField}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {editError !== '' && (
              <View style={styles.editErrorCard}>
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={styles.editErrorText}>{editError}</Text>
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)} disabled={editSaving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditSave} disabled={editSaving} style={{ flex: 1 }}>
                <LinearGradient colors={[PRIMARY, '#4F46E5']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {editSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save Changes</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    marginTop: 4,
  },
  exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  exportSuccessBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 12, padding: 12,
    marginBottom: 10,
  },
  exportSuccessText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8, marginTop: -16 },

  summaryCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },

  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, marginBottom: 10, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  txIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  txMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmt: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
  txActions: { flexDirection: 'row', gap: 6 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEF2FF' },
  editText: { fontSize: 11, color: PRIMARY, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEF2F2' },
  deleteText: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 48, alignItems: 'center', marginTop: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  modalMsg: { fontSize: 14, color: '#64748B', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  confirmDeleteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#EF4444' },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  editCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 480 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10 },
  fieldInput: { borderBottomWidth: 2, borderBottomColor: '#E2E8F0', fontSize: 17, color: '#0F172A', paddingBottom: 8, marginBottom: 4, fontWeight: '600' },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0' },
  catEmoji: { fontSize: 14 },
  catText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  currencySymbol: { fontSize: 24, fontWeight: '900', color: '#CBD5E1' },
  amountField: { flex: 1, fontSize: 32, fontWeight: '900', color: '#0F172A', borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  editErrorCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginTop: 8 },
  editErrorText: { fontSize: 13, color: '#EF4444', fontWeight: '600', flex: 1 },
});
