import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, useWindowDimensions, Modal, FlatList,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CURRENCIES, Currency, saveCurrency, getCurrency } from '../utils/currency';

const PRIMARY = '#6366F1';
const PRIMARY_DARK = '#4F46E5';
const ACCENT = '#06B6D4';

const FEATURES = [
  {
    icon: 'wallet' as const,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Income Tracking',
    desc: 'Set your monthly income and get a real-time view of what you have left to spend.',
  },
  {
    icon: 'receipt' as const,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.12)',
    title: 'Expense Logging',
    desc: 'Log any purchase in seconds. Categorize by food, rent, transport, health, and more.',
  },
  {
    icon: 'bar-chart' as const,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Budget Overview',
    desc: 'Visual progress bar shows how close you are to your limit — updated instantly.',
  },
  {
    icon: 'time' as const,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Full History',
    desc: 'Browse, search, edit or delete any past transaction at any time.',
  },
  {
    icon: 'globe' as const,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.12)',
    title: 'Multi-Currency',
    desc: 'Pick from 12 world currencies. The app adapts to wherever you live.',
  },
  {
    icon: 'shield-checkmark' as const,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Private & Secure',
    desc: 'Your data is encrypted and stored securely. No ads, no sharing, ever.',
  },
];

const STEPS = [
  { num: '01', title: 'Create your account', desc: 'Sign up free in under 30 seconds. No credit card required.' },
  { num: '02', title: 'Set your income', desc: 'Enter your monthly income to define your budget for the month.' },
  { num: '03', title: 'Log your expenses', desc: 'Add purchases as you go. Pick a category and enter the amount.' },
  { num: '04', title: 'Stay on track', desc: 'Watch your budget update live and get notified when spending too much.' },
];

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingScreen({ onGetStarted, onSignIn }: Props) {
  const { width, height } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;
  const [selected, setSelected] = useState<Currency>(getCurrency());
  const [showPicker, setShowPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelectCurrency = async (c: Currency) => {
    await saveCurrency(c);
    setSelected(c);
    setShowPicker(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070B14' }}>
      {/* Fixed Nav */}
      <View style={[styles.nav, { paddingHorizontal: isWide ? 60 : 24 }]}>
        <View style={styles.navBrand}>
          <LinearGradient colors={[PRIMARY, ACCENT]} style={styles.navLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.navLogoText}>F</Text>
          </LinearGradient>
          <Text style={styles.navName}>Finance AI</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={onSignIn}>
            <Text style={styles.navLink}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCta} onPress={onGetStarted}>
            <Text style={styles.navCtaText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <LinearGradient
          colors={['#070B14', '#0D1529', '#070B14']}
          style={[styles.hero, { minHeight: height, paddingHorizontal: isWide ? 60 : 28 }]}
        >
          {/* Glow blob */}
          <View style={styles.glowBlob} />
          <View style={styles.glowBlob2} />

          <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Badge */}
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>Free · No credit card needed</Text>
            </View>

            {/* Headline */}
            <Text style={[styles.heroH1, { fontSize: isWide ? 64 : 42 }]}>
              Manage your{'\n'}
              <Text style={styles.heroH1Gradient}>money smarter.</Text>
            </Text>

            <Text style={[styles.heroSub, { maxWidth: isWide ? 500 : 320 }]}>
              Track income, log expenses, and stay on budget — all in one beautifully simple app. Built for real life.
            </Text>

            {/* CTA buttons */}
            <View style={[styles.heroCtas, { flexDirection: isWide ? 'row' : 'column' }]}>
              <TouchableOpacity onPress={onGetStarted}>
                <LinearGradient colors={[PRIMARY, PRIMARY_DARK]} style={styles.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnPrimaryText}>Start for Free</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={onSignIn}>
                <Text style={styles.btnOutlineText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={styles.heroStats}>
              {[
                { value: '100%', label: 'Free forever' },
                { value: '12', label: 'Currencies' },
                { value: '∞', label: 'Transactions' },
              ].map((s, i) => (
                <View key={i} style={[styles.heroStat, i < 2 && styles.heroStatBorder]}>
                  <Text style={styles.heroStatValue}>{s.value}</Text>
                  <Text style={styles.heroStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── FEATURES ── */}
        <View style={[styles.section, { paddingHorizontal: isWide ? 60 : 24 }]}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>FEATURES</Text>
          </View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 42 : 30 }]}>
            Everything you need,{'\n'}nothing you don't.
          </Text>
          <Text style={styles.sectionSub}>
            Finance AI keeps things simple. No complicated charts or overwhelming dashboards.
          </Text>

          <View style={[styles.featGrid, isWide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featCard, isWide && { width: '30%', margin: '1.5%' as any }]}>
                <View style={[styles.featIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <Text style={styles.featTitle}>{f.title}</Text>
                <Text style={styles.featDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ── */}
        <View style={[styles.sectionDark, { paddingHorizontal: isWide ? 60 : 24 }]}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>HOW IT WORKS</Text>
          </View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 42 : 30 }]}>
            Up and running{'\n'}in 4 steps.
          </Text>
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>{s.num}</Text>
                  {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── CURRENCY ── */}
        <View style={[styles.section, { paddingHorizontal: isWide ? 60 : 24 }]}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>MULTI-CURRENCY</Text>
          </View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 42 : 30 }]}>
            Your currency,{'\n'}your way.
          </Text>
          <Text style={styles.sectionSub}>
            Choose from 12 currencies before you sign up. You can change it anytime.
          </Text>
          <TouchableOpacity style={styles.currencyPicker} onPress={() => setShowPicker(true)}>
            <Text style={styles.currencyPickerFlag}>{selected.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.currencyPickerCode}>{selected.code} — {selected.label}</Text>
              <Text style={styles.currencyPickerSub}>Tap to change currency</Text>
            </View>
            <View style={styles.currencyPickerArrow}>
              <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
            </View>
          </TouchableOpacity>

          <View style={styles.currencyFlags}>
            {CURRENCIES.slice(0, 8).map(c => (
              <TouchableOpacity key={c.code} style={[
                styles.currencyChip,
                c.code === selected.code && styles.currencyChipActive,
              ]} onPress={() => handleSelectCurrency(c)}>
                <Text style={styles.currencyChipFlag}>{c.flag}</Text>
                <Text style={[styles.currencyChipCode, c.code === selected.code && { color: PRIMARY }]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── FINAL CTA ── */}
        <LinearGradient
          colors={[PRIMARY_DARK, '#1E1B4B']}
          style={[styles.ctaSection, { paddingHorizontal: isWide ? 60 : 28 }]}
        >
          <Text style={[styles.ctaTitle, { fontSize: isWide ? 48 : 34 }]}>
            Start tracking{'\n'}today. It's free.
          </Text>
          <Text style={styles.ctaSub}>
            Join thousands of people who use Finance AI to stay on top of their money.
          </Text>
          <TouchableOpacity onPress={onGetStarted}>
            <LinearGradient colors={['#fff', '#E0E7FF']} style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaBtnText}>Create Free Account</Text>
              <Ionicons name="arrow-forward" size={18} color={PRIMARY_DARK} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} style={{ marginTop: 16 }}>
            <Text style={styles.ctaSignIn}>Already have an account? Sign In →</Text>
          </TouchableOpacity>
        </LinearGradient>

      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Currency</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
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
                    <Text style={styles.currencyItemSub}>Symbol: {item.symbol}</Text>
                  </View>
                  {item.code === selected.code && <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />}
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
  // Nav
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 18, paddingBottom: 14,
    backgroundColor: 'rgba(7,11,20,0.8)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  navName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navLink: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
  navCta: {
    backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  navCtaText: { color: '#A5B4FC', fontSize: 13, fontWeight: '700' },

  // Hero
  hero: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingBottom: 80, overflow: 'hidden' },
  glowBlob: {
    position: 'absolute', width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(99,102,241,0.12)',
    top: -100, left: -100,
  },
  glowBlob2: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(6,182,212,0.08)',
    bottom: 0, right: -80,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginBottom: 32,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6EE7B7' },
  heroBadgeText: { fontSize: 13, color: '#A5B4FC', fontWeight: '600' },
  heroH1: {
    fontWeight: '900', color: '#F1F5F9', textAlign: 'center',
    lineHeight: 70, marginBottom: 22, letterSpacing: -1,
  },
  heroH1Gradient: { color: '#818CF8' },
  heroSub: {
    fontSize: 17, color: '#94A3B8', textAlign: 'center',
    lineHeight: 28, marginBottom: 40,
  },
  heroCtas: { gap: 14, alignItems: 'center', marginBottom: 56 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 32, paddingVertical: 18, borderRadius: 14,
    shadowColor: '#6366F1', shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnOutline: {
    paddingHorizontal: 32, paddingVertical: 18, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnOutlineText: { color: '#CBD5E1', fontSize: 16, fontWeight: '600' },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, overflow: 'hidden',
  },
  heroStat: { paddingHorizontal: 28, paddingVertical: 18, alignItems: 'center' },
  heroStatBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  heroStatValue: { fontSize: 24, fontWeight: '900', color: '#F1F5F9', marginBottom: 2 },
  heroStatLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Section
  section: { backgroundColor: '#070B14', paddingTop: 80, paddingBottom: 80 },
  sectionDark: { backgroundColor: '#0A0F1E', paddingTop: 80, paddingBottom: 80 },
  sectionTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, marginBottom: 20,
  },
  sectionTagText: { fontSize: 11, fontWeight: '800', color: '#818CF8', letterSpacing: 1.5 },
  sectionTitle: {
    fontWeight: '900', color: '#F1F5F9', lineHeight: 50,
    marginBottom: 16, letterSpacing: -0.5,
  },
  sectionSub: { fontSize: 16, color: '#64748B', lineHeight: 26, marginBottom: 48, maxWidth: 480 },

  // Features
  featGrid: { gap: 16 },
  featCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 24, marginBottom: 16,
  },
  featIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 8 },
  featDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  // Steps
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  stepNumWrap: { alignItems: 'center', width: 48 },
  stepNum: { fontSize: 13, fontWeight: '900', color: PRIMARY, backgroundColor: 'rgba(99,102,241,0.15)', width: 44, height: 44, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', lineHeight: 44 },
  stepLine: { width: 2, flex: 1, backgroundColor: 'rgba(99,102,241,0.15)', marginVertical: 6, minHeight: 32 },
  stepContent: { flex: 1, paddingTop: 10, paddingBottom: 28 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#F1F5F9', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  // Currency
  currencyPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 16, padding: 20, marginBottom: 24,
  },
  currencyPickerFlag: { fontSize: 32 },
  currencyPickerCode: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 2 },
  currencyPickerSub: { fontSize: 12, color: '#64748B' },
  currencyPickerArrow: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  currencyFlags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  currencyChipActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)' },
  currencyChipFlag: { fontSize: 16 },
  currencyChipCode: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },

  // Final CTA
  ctaSection: { alignItems: 'center', paddingTop: 96, paddingBottom: 96 },
  ctaTitle: { fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 54, marginBottom: 20, letterSpacing: -1 },
  ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 380, lineHeight: 26, marginBottom: 40 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 40, paddingVertical: 20, borderRadius: 16,
    shadowColor: '#fff', shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '900', color: PRIMARY_DARK },
  ctaSignIn: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#374151', alignSelf: 'center', marginBottom: 16 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  currencyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937',
  },
  currencyItemActive: { backgroundColor: 'rgba(99,102,241,0.1)' },
  currencyItemFlag: { fontSize: 26 },
  currencyItemCode: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 2 },
  currencyItemSub: { fontSize: 12, color: '#6B7280' },
});
