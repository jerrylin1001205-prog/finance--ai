import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  section: 'privacy' | 'terms';
  onBack: () => void;
}

const PRIVACY = `Last updated: June 2026

Finance AI ("we", "us") is committed to protecting your privacy.

DATA WE COLLECT
- Email address (for account creation)
- Monthly income amount you enter
- Expense records you create (item name, category, amount, date)

HOW WE USE YOUR DATA
- To provide the Finance AI service
- To sync your data across devices
- We never sell your data to third parties
- We never show you ads

DATA STORAGE
Your data is stored securely on Supabase, which uses AES-256 encryption at rest and TLS in transit.

YOUR RIGHTS
- You can delete your account and all data at any time from Settings
- You can export your data as CSV from the History screen

CONTACT
For privacy questions: support@financeai.app`;

const TERMS = `Last updated: June 2026

By using Finance AI, you agree to these terms.

USE OF SERVICE
- Finance AI is provided free of charge
- You must be 13 or older to use this service
- You are responsible for maintaining the security of your account

DISCLAIMER
Finance AI is a personal budgeting tool. It does not provide financial advice. We are not responsible for financial decisions made based on data in the app.

CHANGES
We may update these terms at any time. Continued use of the app means you accept the new terms.

CONTACT
support@financeai.app`;

export default function LegalScreen({ section, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(section);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab buttons */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.bodyText}>
          {activeTab === 'privacy' ? PRIVACY : TERMS}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  tabRow: {
    flexDirection: 'row', gap: 0,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, marginHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },

  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 28, paddingBottom: 60, maxWidth: 720, alignSelf: 'center', width: '100%' },

  bodyText: {
    fontSize: 14, color: '#334155', lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : undefined,
  },
});
