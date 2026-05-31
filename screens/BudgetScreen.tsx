import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMonthlyIncome, saveMonthlyIncome, getUser } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';
import { useTheme, Theme } from '../utils/theme';

function monthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function BudgetScreen() {
  const t = useTheme();
  const [current, setCurrent] = useState(0);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useFocusEffect(useCallback(() => {
    getMonthlyIncome().then(inc => { setCurrent(inc); if (inc > 0) setAmount(inc.toString()); });
    getUser().then(u => { if (u?.email) setUserEmail(u.email); });
  }, []));

  const handleSave = async () => {
    setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Please enter a valid amount.'); return; }
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

  const s = makeStyles(t);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <Text style={s.headerTitle}>Monthly Income</Text>
          <Text style={s.headerSub}>{monthLabel()}</Text>
        </View>

        <View style={s.body}>
          {/* Account */}
          {userEmail ? (
            <View style={s.accountCard}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{userEmail[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.accountLabel}>Signed in as</Text>
                <Text style={s.accountEmail} numberOfLines={1}>{userEmail}</Text>
              </View>
              <View style={s.secureBadge}>
                <Ionicons name="shield-checkmark" size={12} color={t.income} />
                <Text style={[s.secureBadgeText, { color: t.income }]}>Secure</Text>
              </View>
            </View>
          ) : null}

          {/* Current income */}
          {current > 0 && (
            <View style={s.currentCard}>
              <Text style={s.currentLabel}>CURRENT INCOME</Text>
              <Text style={s.currentAmount}>{fmt(current)}</Text>
              <Text style={s.currentMonth}>{monthLabel()}</Text>
            </View>
          )}

          {/* Input */}
          <View style={s.card}>
            <Text style={s.label}>SET MONTHLY INCOME ({getCurrency().code})</Text>
            <View style={s.amountRow}>
              <Text style={s.currencySymbol}>{getCurrency().symbol}</Text>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={t.textMuted}
              />
            </View>
            <Text style={s.hint}>Your total take-home income for this month. Update it anytime.</Text>
          </View>

          {error !== '' && (
            <View style={s.errorCard}>
              <Ionicons name="close-circle" size={16} color={t.expense} />
              <Text style={[s.feedbackText, { color: t.expense }]}>{error}</Text>
            </View>
          )}
          {saved && (
            <View style={s.successCard}>
              <Ionicons name="checkmark-circle" size={16} color={t.income} />
              <Text style={[s.feedbackText, { color: t.income }]}>Income saved for {monthLabel()}!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? t.textMuted : t.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="save" size={16} color="#fff" /><Text style={s.saveBtnText}>Save Income</Text></>
            }
          </TouchableOpacity>

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={t.primary} />
            <Text style={[s.infoText, { color: t.textSub }]}>
              Income resets each month. Set it at the start of each month for accurate tracking.
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: { backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 28 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: t.headerText, marginBottom: 4 },
    headerSub: { fontSize: 13, color: t.headerSub },
    body: { padding: 16 },

    accountCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.card, borderRadius: 14, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
    },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    accountLabel: { fontSize: 11, color: t.textMuted, fontWeight: '600' },
    accountEmail: { fontSize: 14, fontWeight: '700', color: t.text },
    secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: t.iconBg },
    secureBadgeText: { fontSize: 11, fontWeight: '700' },

    currentCard: {
      backgroundColor: t.card, borderRadius: 14, padding: 18, marginBottom: 12,
      borderWidth: 1, borderColor: t.border,
      borderLeftWidth: 3, borderLeftColor: t.income,
    },
    currentLabel: { fontSize: 10, fontWeight: '800', color: t.textMuted, letterSpacing: 1, marginBottom: 6 },
    currentAmount: { fontSize: 34, fontWeight: '900', color: t.income, marginBottom: 4 },
    currentMonth: { fontSize: 12, color: t.textMuted },

    card: { backgroundColor: t.card, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    label: { fontSize: 11, fontWeight: '800', color: t.textMuted, letterSpacing: 1.2, marginBottom: 14 },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    currencySymbol: { fontSize: 28, fontWeight: '900', color: t.textMuted },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: t.text },
    hint: { fontSize: 13, color: t.textMuted, lineHeight: 20 },

    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.mode === 'dark' ? '#450a0a' : '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: t.mode === 'dark' ? '#7f1d1d' : '#FECACA' },
    successCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.mode === 'dark' ? '#052e16' : '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: t.mode === 'dark' ? '#166534' : '#BBF7D0' },
    feedbackText: { fontSize: 14, fontWeight: '600', flex: 1 },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, paddingVertical: 16, marginBottom: 14,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: t.bg2, borderRadius: 12, padding: 14, marginBottom: 16,
      borderWidth: 1, borderColor: t.border,
    },
    infoText: { flex: 1, fontSize: 13, lineHeight: 20 },

  });
}
