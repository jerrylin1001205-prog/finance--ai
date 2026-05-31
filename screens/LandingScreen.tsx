import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Modal, FlatList, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES, Currency, saveCurrency, getCurrency } from '../utils/currency';

const PRIMARY = '#2563EB';

const PILLS = [
  { icon: 'bar-chart-outline' as const, label: 'Budget tracking' },
  { icon: 'receipt-outline' as const,   label: 'Expense logging' },
  { icon: 'time-outline' as const,      label: 'Full history' },
];

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingScreen({ onGetStarted, onSignIn }: Props) {
  const { height } = useWindowDimensions();
  const [selected, setSelected] = useState<Currency>(getCurrency());
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectCurrency = async (c: Currency) => {
    await saveCurrency(c);
    setSelected(c);
    setShowPicker(false);
  };

  return (
    <View style={[styles.root, { minHeight: height }]}>

      {/* Top nav */}
      <View style={styles.nav}>
        <View style={styles.navBrand}>
          <View style={styles.navLogo}><Text style={styles.navLogoText}>F</Text></View>
          <Text style={styles.navName}>Finance AI</Text>
        </View>
        <TouchableOpacity style={styles.navSignIn} onPress={onSignIn}>
          <Text style={styles.navSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="flash" size={13} color={PRIMARY} />
          <Text style={styles.badgeText}>Free · No credit card needed</Text>
        </View>

        <Text style={styles.headline}>Track your money,{'\n'}stress-free.</Text>
        <Text style={styles.sub}>
          Set your monthly income, log expenses by category,
          and see your budget update instantly.
        </Text>

        {/* Currency picker */}
        <View style={styles.currencyRow}>
          <Text style={styles.currencyLabel}>Your currency:</Text>
          <TouchableOpacity style={styles.currencyBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.currencyFlag}>{selected.flag}</Text>
            <Text style={styles.currencyCode}>{selected.code} ({selected.symbol})</Text>
            <Ionicons name="chevron-down" size={14} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={onGetStarted}>
            <Text style={styles.btnPrimaryText}>Get Started — It's Free</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Feature pills */}
        <View style={styles.pills}>
          {PILLS.map(p => (
            <View key={p.label} style={styles.pill}>
              <Ionicons name={p.icon} size={14} color={PRIMARY} />
              <Text style={styles.pillText}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Currency picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Currency</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={c => c.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.currencyItem, item.code === selected.code && styles.currencyItemActive]}
                  onPress={() => handleSelectCurrency(item)}
                >
                  <Text style={styles.currencyItemFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currencyItemCode}>{item.code} — {item.label}</Text>
                    <Text style={styles.currencyItemSymbol}>Symbol: {item.symbol}</Text>
                  </View>
                  {item.code === selected.code && (
                    <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo: {
    width: 32, height: 32, borderRadius: 9, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  navName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  navSignIn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  navSignInText: { fontSize: 13, fontWeight: '600', color: '#111827' },

  // Hero
  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingBottom: 48,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 24,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  headline: {
    fontSize: 38, fontWeight: '900', color: '#111827',
    textAlign: 'center', lineHeight: 46, marginBottom: 16,
  },
  sub: {
    fontSize: 15, color: '#6B7280', textAlign: 'center',
    lineHeight: 24, maxWidth: 340, marginBottom: 32,
  },

  // Currency
  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  currencyLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  currencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE',
  },
  currencyFlag: { fontSize: 16 },
  currencyCode: { fontSize: 14, fontWeight: '700', color: PRIMARY },

  // CTA
  ctaRow: { marginBottom: 28 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PRIMARY, paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 14,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 20, maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  currencyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  currencyItemActive: { backgroundColor: '#EFF6FF' },
  currencyItemFlag: { fontSize: 24 },
  currencyItemCode: { fontSize: 14, fontWeight: '700', color: '#111827' },
  currencyItemSymbol: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
