import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  signIn, signUp, signOut, getUser,
  backupTransactions, restoreTransactions, backupBudget, restoreBudget,
} from '../services/supabase';
import { getTransactions, saveTransaction, getBudget, saveBudget } from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#6C63FF',
  income: '#4CAF50',
  expense: '#F44336',
  bg: '#F0F2FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
};

export default function AccountScreen() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useFocusEffect(useCallback(() => {
    getUser().then(setUser);
  }, []));

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const u = isSignUp ? await signUp(email, password) : await signIn(email, password);
      setUser(u);
      Alert.alert('Success', isSignUp ? 'Account created! You can now back up your data.' : 'Logged in successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut();
          setUser(null);
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
      Alert.alert('Backup Complete', 'Your data has been saved to the cloud.');
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert('Restore Data', 'This will replace your local data with the cloud backup. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore', onPress: async () => {
          setRestoring(true);
          try {
            const [txs, budget] = await Promise.all([restoreTransactions(), restoreBudget()]);
            await AsyncStorage.setItem('transactions', JSON.stringify(txs));
            if (budget) await saveBudget(budget);
            Alert.alert('Restore Complete', 'Your data has been restored from the cloud.');
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
        <Text style={styles.title}>Cloud Backup</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.email?.[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userSub}>Account active</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backup & Restore</Text>
          <Text style={styles.cardDesc}>
            Back up your transactions and budget to the cloud. Restore anytime on any device.
          </Text>

          <TouchableOpacity style={styles.backupBtn} onPress={handleBackup} disabled={backingUp}>
            {backingUp
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.backupBtnText}>Backup to Cloud</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
            {restoring
              ? <ActivityIndicator color={COLORS.primary} />
              : <Text style={styles.restoreBtnText}>Restore from Cloud</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Cloud Backup</Text>
        <Text style={styles.subtitle}>Create an account to back up your data and access it on any device.</Text>

        <View style={styles.card}>
          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.authBtn, !isSignUp && styles.authBtnActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.authBtnText, !isSignUp && styles.authBtnTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtn, isSignUp && styles.authBtnActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.authBtnText, isSignUp && styles.authBtnTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={COLORS.sub}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={COLORS.sub}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  userEmail: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  userSub: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  authToggle: {
    flexDirection: 'row', backgroundColor: '#F0F2FF', borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  authBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  authBtnActive: { backgroundColor: '#6C63FF' },
  authBtnText: { fontWeight: '700', color: '#6B7280' },
  authBtnTextActive: { color: '#fff' },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0EE', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1A1A2E', backgroundColor: '#F0F2FF', marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backupBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 10,
  },
  backupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreBtn: {
    borderWidth: 2, borderColor: '#6C63FF', borderRadius: 12, padding: 16,
    alignItems: 'center',
  },
  restoreBtnText: { color: '#6C63FF', fontSize: 16, fontWeight: '700' },
  signOutBtn: { padding: 16, alignItems: 'center', marginBottom: 40 },
  signOutText: { color: '#F44336', fontSize: 15, fontWeight: '600' },
});
