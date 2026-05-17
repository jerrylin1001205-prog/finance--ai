import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, getBudget, saveBudget } from '../services/storage';
import {
  signIn, signUp, signOut, getUser,
  backupTransactions, restoreTransactions, backupBudget, restoreBudget,
} from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../services/languageContext';

const COLORS = {
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

export default function AccountScreen() {
  const { tr } = useLanguage();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadUser = async () => {
    const u = await getUser();
    if (u) setUser({ id: u.id, email: u.email ?? '' });
    else setUser(null);
  };

  useFocusEffect(useCallback(() => { loadUser(); }, []));

  const handleAuth = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Enter your email'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        Alert.alert('Account Created', 'Check your email to confirm your account, then sign in.');
        setIsSignUp(false);
      } else {
        await signIn(email.trim(), password);
        await loadUser();
      }
      setPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(tr.sign_out, 'Are you sure?', [
      { text: tr.cancel, style: 'cancel' },
      {
        text: tr.sign_out, style: 'destructive', onPress: async () => {
          await signOut();
          // App.tsx auth listener handles redirect to login
        },
      },
    ]);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const [txs, budget] = await Promise.all([getTransactions(), getBudget()]);
      await backupTransactions(txs);
      await backupBudget(budget);
      Alert.alert(tr.backup_restore, 'Your data has been saved to the cloud.');
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(tr.restore_btn, 'This will replace your local data with the cloud backup. Continue?', [
      { text: tr.cancel, style: 'cancel' },
      {
        text: 'Restore', onPress: async () => {
          setRestoring(true);
          try {
            const [txs, budget] = await Promise.all([restoreTransactions(), restoreBudget()]);
            await AsyncStorage.setItem('transactions', JSON.stringify(txs));
            if (budget) await saveBudget(budget);
            Alert.alert(tr.backup_restore, 'Your data has been restored from the cloud.');
          } catch (e: any) {
            Alert.alert('Restore Failed', e.message);
          } finally {
            setRestoring(false);
          }
        },
      },
    ]);
  };

  if (user) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{tr.cloud_backup}</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tr.signed_in_google}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.backup_restore}</Text>
          <Text style={styles.cardDesc}>{tr.backup_desc}</Text>
          <TouchableOpacity style={styles.backupBtn} onPress={handleBackup} disabled={backingUp}>
            {backingUp ? <ActivityIndicator color="#fff" /> : <Text style={styles.backupBtnText}>{tr.backup_btn}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
            {restoring ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.restoreBtnText}>{tr.restore_btn}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{tr.sign_out}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{tr.cloud_backup}</Text>
        <Text style={styles.subtitle}>{tr.backup_subtitle}</Text>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isSignUp && styles.toggleBtnActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isSignUp && styles.toggleBtnActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.sub}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.authBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            }
          </TouchableOpacity>

          {isSignUp && (
            <Text style={styles.note}>
              After signing up, check your email to confirm your account before signing in.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 16 },
  subtitle: { fontSize: 14, color: COLORS.sub, marginTop: 4, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: COLORS.sub, lineHeight: 20, marginBottom: 20 },
  userCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  userEmail: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  badge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  backupBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 10,
  },
  backupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreBtn: {
    borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center',
  },
  restoreBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  signOutBtn: { padding: 16, alignItems: 'center', marginBottom: 40 },
  signOutText: { color: COLORS.expense, fontSize: 15, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, fontWeight: '700', color: COLORS.sub },
  toggleTextActive: { color: '#fff' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 12, backgroundColor: COLORS.bg,
  },
  authBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  authBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: COLORS.sub, marginTop: 12, textAlign: 'center', lineHeight: 18 },
});
