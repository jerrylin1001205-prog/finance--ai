import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, ScrollView, Platform, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMonthExpenses, removeExpense, updateExpense, Expense } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Rent', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Rent: '🏠', Other: '📦',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryScreen() {
  const t = useTheme();
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
    } else {
      Alert.alert('Export Data', 'Copy the text below:\n\n' + csv);
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
    if (!editName.trim()) { setEditError('Item name required.'); return; }
    if (!editCategory) { setEditError('Select a category.'); return; }
    if (!amt || amt <= 0) { setEditError('Enter a valid amount.'); return; }
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
  const s = makeStyles(t);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={s.txCard}>
      <View style={s.txIcon}>
        <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[item.category] ?? '📦'}</Text>
      </View>
      <View style={s.txInfo}>
        <Text style={s.txName}>{item.item_name}</Text>
        <Text style={s.txMeta}>{item.category} · {formatDate(item.date)}</Text>
      </View>
      <View style={s.txRight}>
        <Text style={[s.txAmt, { color: t.expense }]}>-{fmt(item.amount)}</Text>
        <View style={s.txActions}>
          <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil" size={11} color={t.primary} />
            <Text style={[s.actionText, { color: t.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => setDeleteTarget({ id: item.id, name: item.item_name })}>
            <Ionicons name="trash" size={11} color={t.expense} />
            <Text style={[s.actionText, { color: t.expense }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>History</Text>
            <Text style={s.headerSub}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          </View>
          {expenses.length > 0 && (
            <TouchableOpacity style={s.exportBtn} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={15} color="#fff" />
              <Text style={s.exportText}>Export CSV</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.body}>
        {exportSuccess && (
          <View style={s.exportBanner}>
            <Ionicons name="checkmark-circle" size={15} color={t.income} />
            <Text style={[s.exportBannerText, { color: t.income }]}>Exported successfully!</Text>
          </View>
        )}

        {expenses.length > 0 && (
          <View style={s.summaryCard}>
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>TRANSACTIONS</Text>
              <Text style={[s.summaryValue, { color: t.text }]}>{expenses.length}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>TOTAL SPENT</Text>
              <Text style={[s.summaryValue, { color: t.expense }]}>{fmt(totalSpent)}</Text>
            </View>
          </View>
        )}

        {expenses.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 44, marginBottom: 14 }}>🧾</Text>
            <Text style={s.emptyTitle}>No expenses yet</Text>
            <Text style={s.emptySub}>Expenses you log this month will appear here.</Text>
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
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Delete Expense</Text>
            <Text style={s.modalMsg}>Delete "{deleteTarget?.name}"? This cannot be undone.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteTarget(null)} disabled={deleting}>
                <Text style={[s.cancelText, { color: t.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confirmBtn, { backgroundColor: t.expense }]} onPress={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editTarget !== null} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.editCard}>
            <View style={s.modalTopRow}>
              <Text style={s.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Ionicons name="close-circle" size={22} color={t.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>ITEM NAME</Text>
            <TextInput style={s.fieldInput} value={editName} onChangeText={setEditName} placeholderTextColor={t.textMuted} />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catChip, editCategory === cat && { backgroundColor: t.primary, borderColor: t.primary }]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text style={{ fontSize: 13 }}>{CATEGORY_ICONS[cat]}</Text>
                    <Text style={[s.catChipText, editCategory === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.fieldLabel}>AMOUNT ({getCurrency().code})</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={[s.currencySymbol, { color: t.textMuted }]}>{getCurrency().symbol}</Text>
              <TextInput
                style={[s.fieldInput, { flex: 1, fontSize: 28, fontWeight: '800' }]}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={t.textMuted}
              />
            </View>

            {editError !== '' && (
              <View style={s.editErrorCard}>
                <Ionicons name="close-circle" size={13} color={t.expense} />
                <Text style={[s.editErrorText, { color: t.expense }]}>{editError}</Text>
              </View>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditTarget(null)} disabled={editSaving}>
                <Text style={[s.cancelText, { color: t.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confirmBtn, { backgroundColor: t.primary }]} onPress={handleEditSave} disabled={editSaving}>
                {editSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: { backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: t.headerText, marginBottom: 3 },
    headerSub: { fontSize: 13, color: t.headerSub },
    exportBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    exportText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    body: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },

    exportBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.mode === 'dark' ? '#052e16' : '#F0FDF4',
      borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1,
      borderColor: t.mode === 'dark' ? '#166534' : '#BBF7D0',
    },
    exportBannerText: { fontSize: 13, fontWeight: '700' },

    summaryCard: {
      flexDirection: 'row', backgroundColor: t.card, borderRadius: 14, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 10, color: t.textMuted, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: '900' },
    summaryDivider: { width: 1, backgroundColor: t.border, marginHorizontal: 8 },

    txCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.card,
      borderRadius: 14, marginBottom: 8, padding: 14,
      borderWidth: 1, borderColor: t.border,
    },
    txIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txInfo: { flex: 1 },
    txName: { fontSize: 14, fontWeight: '700', color: t.text },
    txMeta: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    txRight: { alignItems: 'flex-end', gap: 6 },
    txAmt: { fontSize: 15, fontWeight: '900' },
    txActions: { flexDirection: 'row', gap: 6 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: t.bg2 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: t.bg2 },
    actionText: { fontSize: 11, fontWeight: '700' },

    emptyCard: { backgroundColor: t.card, borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: t.border },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: t.text, marginBottom: 6 },
    emptySub: { fontSize: 13, color: t.textMuted, textAlign: 'center', lineHeight: 20 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: t.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
    editCard: { backgroundColor: t.card, borderRadius: 20, padding: 22, width: '100%', maxWidth: 480 },
    modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: t.text, marginBottom: 8 },
    modalMsg: { fontSize: 14, color: t.textSub, lineHeight: 22, marginBottom: 22 },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    cancelText: { fontSize: 14, fontWeight: '600' },
    confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    fieldLabel: { fontSize: 11, fontWeight: '800', color: t.textMuted, letterSpacing: 1.2, marginBottom: 8 },
    fieldInput: { borderBottomWidth: 1, borderBottomColor: t.inputBorder, fontSize: 16, color: t.text, paddingBottom: 8, marginBottom: 4, fontWeight: '600' },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: t.bg2, borderWidth: 1.5, borderColor: t.border },
    catChipText: { fontSize: 12, fontWeight: '700', color: t.textSub },
    currencySymbol: { fontSize: 22, fontWeight: '900' },
    editErrorCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.mode === 'dark' ? '#450a0a' : '#FEF2F2', borderRadius: 8, padding: 10, marginTop: 6 },
    editErrorText: { fontSize: 12, fontWeight: '600', flex: 1 },
  });
}
