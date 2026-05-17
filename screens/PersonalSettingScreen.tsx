import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { signOut, getUser } from '../services/supabase';
import { useLanguage } from '../services/languageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#2563EB';
const COLORS = {
  bg: '#F7F8FA', card: '#FFFFFF', text: '#111827',
  sub: '#6B7280', expense: '#DC2626', border: '#F3F4F6',
};

const CLEAR_KEY = 'transactions';

export default function PersonalSettingScreen({ navigation }: any) {
  const { tr } = useLanguage();
  const [email, setEmail] = useState('');
  const [mindfulEnabled, setMindfulEnabled] = useState(true);

  useFocusEffect(useCallback(() => {
    getUser().then(u => { if (u?.email) setEmail(u.email); });
    AsyncStorage.getItem('mindful_enabled').then(v => {
      setMindfulEnabled(v !== 'false');
    });
  }, []));

  const toggleMindful = async (val: boolean) => {
    setMindfulEnabled(val);
    await AsyncStorage.setItem('mindful_enabled', val ? 'true' : 'false');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your transactions from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive', onPress: async () => {
            await AsyncStorage.removeItem(CLEAR_KEY);
            Alert.alert('Done', 'All transactions have been cleared.');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut();
          // App.tsx auth listener redirects to login automatically
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Personal Settings</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{email ? email[0].toUpperCase() : '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileLabel}>Signed in as</Text>
          <Text style={styles.profileEmail}>{email || 'Loading...'}</Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={20} color={PRIMARY} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Mindful Spending Reminder</Text>
            <Switch
              value={mindfulEnabled}
              onValueChange={toggleMindful}
              trackColor={{ false: '#E5E7EB', true: PRIMARY }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="wallet-outline" size={20} color={PRIMARY} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Budget & Savings Goal</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.sub} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Account')}>
            <Ionicons name="cloud-upload-outline" size={20} color={PRIMARY} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Cloud Backup</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.sub} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color={COLORS.expense} style={styles.rowIcon} />
            <Text style={[styles.rowLabel, { color: COLORS.expense }]}>Clear All Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.expense} style={styles.rowIcon} />
            <Text style={[styles.rowLabel, { color: COLORS.expense }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>Finance AI v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 16, marginBottom: 20 },
  profileCard: {
    backgroundColor: PRIMARY, borderRadius: 18, padding: 20, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  profileEmail: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 48 },
  version: { textAlign: 'center', color: COLORS.sub, fontSize: 12, marginBottom: 40, marginTop: 8 },
});
