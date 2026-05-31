import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMonthlyIncome, saveMonthlyIncome, signOut, getUser } from '../services/supabase';
import { fmt, getCurrency } from '../utils/currency';

const PRIMARY = '#6366F1';

function monthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function BudgetScreen() {
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
          <Text style={styles.headerTitle}>Monthly Income</Text>
          <Text style={styles.headerSub}>{monthLabel()}</Text>
        </LinearGradient>

        <View style={styles.body}>

          {/* Account card */}
          {userEmail ? (
            <View style={styles.accountCard}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>{userEmail[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountLabel}>Signed in as</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>{userEmail}</Text>
              </View>
              <View style={styles.accountBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.accountBadgeText}>Secure</Text>
              </View>
            </View>
          ) : null}

          {/* Current income */}
          {current > 0 && (
            <View style={styles.currentCard}>
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.currentGradient}>
                <View style={styles.currentTop}>
                  <Text style={styles.currentLabel}>Current monthly income</Text>
                  <View style={styles.currentBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.currentBadgeText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.currentAmount}>{fmt(current)}</Text>
                <Text style={styles.currentMonth}>{monthLabel()}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Set income */}
          <View style={styles.card}>
            <Text style={styles.label}>SET MONTHLY INCOME ({getCurrency().code})</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{getCurrency().symbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <Text style={styles.hint}>
              This is your total take-home income for the month. All expenses will be tracked against this amount.
            </Text>
          </View>

          {error !== '' && (
            <View style={styles.errorCard}>
              <Ionicons name="close-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {saved && (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successText}>Income saved for {monthLabel()}!</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginTop: 4 }}>
            <LinearGradient
              colors={saving ? ['#94A3B8', '#94A3B8'] : [PRIMARY, '#4F46E5']}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="save" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Income</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#6366F1" />
            <Text style={styles.infoText}>
              You can update your income anytime. It resets each month — so set it at the start of every month for accurate tracking.
            </Text>
          </View>

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  body: { padding: 16, marginTop: -16 },

  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  accountAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  accountAvatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  accountLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  accountEmail: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  accountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  accountBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '700' },

  currentCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#10B981', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  currentGradient: { padding: 22 },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  currentLabel: { fontSize: 12, color: '#16A34A', fontWeight: '700', letterSpacing: 0.3 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  currentAmount: { fontSize: 38, fontWeight: '900', color: '#14532D', marginBottom: 4 },
  currentMonth: { fontSize: 13, color: '#16A34A', fontWeight: '500' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  currencySymbol: { fontSize: 32, fontWeight: '900', color: '#CBD5E1' },
  amountInput: { flex: 1, fontSize: 42, fontWeight: '900', color: '#0F172A', paddingBottom: 4 },
  hint: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '600', flex: 1 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  successText: { fontSize: 14, color: '#10B981', fontWeight: '600', flex: 1 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 18, marginBottom: 16,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 20 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
