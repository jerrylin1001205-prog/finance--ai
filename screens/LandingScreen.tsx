import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2563EB';
const COLORS = {
  bg: '#F7F8FA', card: '#FFFFFF', text: '#111827', sub: '#6B7280',
  border: '#E5E7EB', accent: '#EFF6FF',
};

const FEATURES = [
  {
    icon: 'wallet-outline' as const,
    title: 'Track Monthly Income',
    desc: 'Set your USD income each month and see exactly how much you have left to spend.',
  },
  {
    icon: 'receipt-outline' as const,
    title: 'Log Expenses Instantly',
    desc: 'Add purchases by category — food, transport, shopping, and more — in seconds.',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Budget at a Glance',
    desc: 'See your spending vs. income with a clear progress bar and category breakdown.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Full History',
    desc: 'Browse and search every transaction you\'ve recorded, with edit and delete support.',
  },
];

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingScreen({ onGetStarted, onSignIn }: Props) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 640;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>F</Text>
          </View>
        </View>
        <Text style={styles.appName}>Finance AI</Text>
        <Text style={styles.tagline}>Your simple USD monthly finance tracker</Text>
        <Text style={styles.subtitle}>
          Take control of your money. Set your income, log every expense, and
          watch your budget update in real time — all in one clean app.
        </Text>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={onGetStarted}>
            <Text style={styles.btnPrimaryText}>Get Started — It's Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onSignIn}>
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features */}
      <View style={[styles.featuresGrid, isWide && styles.featuresGridWide]}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureCard, isWide && styles.featureCardWide]}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={f.icon} size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        {[
          { value: 'USD', label: 'Currency' },
          { value: '100%', label: 'Private' },
          { value: 'Free', label: 'Always' },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Footer CTA */}
      <View style={styles.footerCta}>
        <Text style={styles.footerCtaTitle}>Ready to take control?</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={onGetStarted}>
          <Text style={styles.btnPrimaryText}>Create Free Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingBottom: 48 },

  // Hero
  hero: {
    alignItems: 'center', paddingHorizontal: 24,
    paddingTop: 56, paddingBottom: 40,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoWrap: { marginBottom: 16 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '900' },
  appName: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  tagline: { fontSize: 15, fontWeight: '600', color: PRIMARY, marginBottom: 14 },
  subtitle: {
    fontSize: 15, color: COLORS.sub, textAlign: 'center',
    lineHeight: 23, maxWidth: 440, marginBottom: 32,
  },
  ctaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: {
    backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 12,
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  btnSecondaryText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },

  // Features
  featuresGrid: {
    paddingHorizontal: 16, paddingTop: 32, gap: 12,
  },
  featuresGridWide: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 12,
  },
  featureCardWide: {
    flex: 1, minWidth: 240, margin: 6,
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  featureDesc: { fontSize: 13, color: COLORS.sub, lineHeight: 20 },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: PRIMARY, marginHorizontal: 16, marginTop: 28,
    borderRadius: 16, paddingVertical: 24,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Footer CTA
  footerCta: {
    alignItems: 'center', paddingTop: 40, paddingHorizontal: 24, gap: 16,
  },
  footerCtaTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
});
