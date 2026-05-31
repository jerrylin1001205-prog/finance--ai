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
    title: 'Monthly Income Setup',
    desc: 'Tell Finance AI how much you earn each month. It instantly calculates your available budget and keeps it updated as you spend.',
  },
  {
    icon: 'receipt' as const,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.12)',
    title: 'Instant Expense Logging',
    desc: 'Add any expense in under 5 seconds. Choose from 8 categories — Food, Transport, Bills, Shopping, Health, Entertainment, Rent, or Other.',
  },
  {
    icon: 'bar-chart' as const,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Live Budget Dashboard',
    desc: 'A clean visual dashboard shows your total income, total spent, and remaining budget — refreshed every time you open the app.',
  },
  {
    icon: 'pie-chart' as const,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Category Breakdown',
    desc: 'See exactly where your money is going. Finance AI groups your expenses by category so you can spot spending habits fast.',
  },
  {
    icon: 'time' as const,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.12)',
    title: 'Full Transaction History',
    desc: 'Every expense you\'ve ever logged is stored and searchable. Edit or delete any entry at any time — full control, always.',
  },
  {
    icon: 'globe' as const,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Multi-Currency Support',
    desc: 'Finance AI works with 12 world currencies — USD, EUR, GBP, JPY, TWD, KRW, and more. Switch anytime from settings.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: 'person-add' as const,
    color: '#6366F1',
    title: 'Create your free account',
    desc: 'Sign up with just your email and password. No credit card, no subscription — completely free to use.',
  },
  {
    num: '02',
    icon: 'wallet' as const,
    color: '#06B6D4',
    title: 'Set your monthly income',
    desc: 'Enter how much you earn this month. Finance AI uses this as your budget ceiling and tracks everything against it.',
  },
  {
    num: '03',
    icon: 'add-circle' as const,
    color: '#10B981',
    title: 'Log expenses as you go',
    desc: 'Every time you spend money, open the app and log it. Takes less than 10 seconds. Choose a category, enter the amount, done.',
  },
  {
    num: '04',
    icon: 'bar-chart' as const,
    color: '#F59E0B',
    title: 'Check your dashboard anytime',
    desc: 'See how much you\'ve spent vs. your income at a glance. Finance AI warns you when you\'re getting close to your limit.',
  },
];

const REVIEWS = [
  { name: 'Sarah M.', role: 'Freelance Designer', text: 'I finally know where my money goes each month. The dashboard is so clean — I check it every day.', stars: 5 },
  { name: 'James K.', role: 'College Student', text: 'Super simple to use. I log every coffee and meal and it keeps me from going broke before month end.', stars: 5 },
  { name: 'Lin W.', role: 'Software Engineer', text: 'Love the multi-currency support. I travel a lot and it just works wherever I am.', stars: 5 },
];

// ── Mock App Preview ───────────────────────────────────────────────────────────
function AppPreview({ currency }: { currency: Currency }) {
  const expenses = [
    { icon: '🍔', cat: 'Food', name: 'Lunch', amt: 14 },
    { icon: '🚗', cat: 'Transport', name: 'Uber', amt: 22 },
    { icon: '🛍️', cat: 'Shopping', name: 'Amazon', amt: 59 },
  ];
  const income = 3000;
  const spent = 812;
  const pct = spent / income;

  return (
    <View style={preview.card}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#0F172A']} style={preview.header}>
        <Text style={preview.headerSub}>May 2026</Text>
        <Text style={preview.headerTitle}>Budget Overview</Text>
        <View style={preview.headerRow}>
          <View>
            <Text style={preview.headerLabel}>Income</Text>
            <Text style={preview.headerIncome}>{currency.symbol}{income.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={preview.headerLabel}>Remaining</Text>
            <Text style={preview.headerRemaining}>{currency.symbol}{(income - spent).toLocaleString()}</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={preview.barBg}>
          <LinearGradient colors={['#6366F1', '#06B6D4']} style={[preview.barFill, { width: `${Math.round(pct * 100)}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
        <Text style={preview.barLabel}>{currency.symbol}{spent} spent of {currency.symbol}{income} — {Math.round(pct * 100)}%</Text>
      </LinearGradient>
      {/* Expenses */}
      <View style={preview.list}>
        <Text style={preview.listTitle}>Recent Expenses</Text>
        {expenses.map((e, i) => (
          <View key={i} style={preview.expRow}>
            <Text style={preview.expIcon}>{e.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={preview.expName}>{e.name}</Text>
              <Text style={preview.expCat}>{e.cat}</Text>
            </View>
            <Text style={preview.expAmt}>-{currency.symbol}{e.amt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
}

export default function LandingScreen({ onGetStarted, onSignIn, onPrivacy, onTerms }: Props) {
  const { width, height } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;
  const [selected, setSelected] = useState<Currency>(getCurrency());
  const [showPicker, setShowPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelectCurrency = async (c: Currency) => {
    await saveCurrency(c);
    setSelected(c);
    setShowPicker(false);
  };

  const px = isWide ? 80 : 24;

  return (
    <View style={{ flex: 1, backgroundColor: '#070B14' }}>

      {/* ── Fixed Nav ── */}
      <View style={[styles.nav, { paddingHorizontal: px }]}>
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
            <Text style={styles.navCtaText}>Get Started Free</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <LinearGradient colors={['#0A0E1A', '#0D1529', '#080C18']} style={[styles.hero, { paddingHorizontal: px, paddingTop: 120, paddingBottom: 80 }]}>
          <View style={styles.glow1} />
          <View style={styles.glow2} />

          <Animated.View style={[
            isWide ? styles.heroInnerWide : styles.heroInner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
            {/* Left: text */}
            <View style={isWide ? { flex: 1, paddingRight: 48 } : { alignItems: 'center' }}>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>Free · No credit card · No limits</Text>
              </View>

              <Text style={[styles.heroH1, { fontSize: isWide ? 58 : 40, textAlign: isWide ? 'left' : 'center' }]}>
                The smartest way to{' '}
                <Text style={styles.heroAccent}>track your money.</Text>
              </Text>

              <Text style={[styles.heroSub, { textAlign: isWide ? 'left' : 'center' }]}>
                Finance AI is a personal budget tracker that helps you understand your spending, stay within your income, and build better money habits — one expense at a time.
              </Text>

              <View style={[styles.heroCtas, isWide && { flexDirection: 'row' }]}>
                <TouchableOpacity onPress={onGetStarted}>
                  <LinearGradient colors={[PRIMARY, PRIMARY_DARK]} style={styles.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.btnPrimaryText}>Start Tracking for Free</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnOutline} onPress={onSignIn}>
                  <Text style={styles.btnOutlineText}>Already have an account</Text>
                </TouchableOpacity>
              </View>

              {/* Trust badges */}
              <View style={[styles.trustRow, isWide && { justifyContent: 'flex-start' }]}>
                {['✓ Free forever', '✓ No credit card', '✓ 12 currencies'].map(t => (
                  <View key={t} style={styles.trustBadge}>
                    <Text style={styles.trustText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: app preview */}
            {isWide && (
              <View style={{ flex: 1 }}>
                <AppPreview currency={selected} />
              </View>
            )}
          </Animated.View>

          {/* Stats */}
          <View style={[styles.statsRow, { marginTop: isWide ? 60 : 40 }]}>
            {[
              { value: '100%', label: 'Free, always', icon: 'gift-outline' as const },
              { value: '12', label: 'World currencies', icon: 'globe-outline' as const },
              { value: '8', label: 'Expense categories', icon: 'list-outline' as const },
              { value: '< 5s', label: 'To log an expense', icon: 'flash-outline' as const },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 3 && styles.statBorder]}>
                <Ionicons name={s.icon} size={18} color={PRIMARY} style={{ marginBottom: 6 }} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── WHAT IS IT ── */}
        <View style={[styles.section, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>WHAT IS FINANCE AI?</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            Your personal finance{'\n'}co-pilot.
          </Text>
          <Text style={styles.sectionBody}>
            Most people don't know exactly where their money goes each month. Finance AI fixes that. It's a lightweight, no-fuss expense tracker designed for everyday people — not accountants.
          </Text>
          <Text style={styles.sectionBody}>
            You set your income once. Then every time you spend money — on food, transport, bills, or anything else — you log it in seconds. Finance AI adds it up and shows you your remaining budget in real time.
          </Text>
          <Text style={styles.sectionBody}>
            No complex setup. No subscription. No ads. Just a clean, fast app that helps you stay in control of your money.
          </Text>

          {/* Inline preview for mobile */}
          {!isWide && (
            <View style={{ marginTop: 32 }}>
              <AppPreview currency={selected} />
            </View>
          )}
        </View>

        {/* ── FEATURES ── */}
        <View style={[styles.sectionAlt, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>FEATURES</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            Everything you need.{'\n'}Nothing you don't.
          </Text>
          <Text style={styles.sectionSub}>
            Finance AI is intentionally simple. Every feature exists for one reason: to help you spend less and save more.
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
        <View style={[styles.section, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>HOW IT WORKS</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            From zero to tracking{'\n'}in 4 simple steps.
          </Text>
          <Text style={styles.sectionSub}>
            No tutorial needed. Finance AI is intuitive by design. Here's exactly what happens when you sign up.
          </Text>

          <View style={isWide ? styles.stepsGrid : styles.stepsList}>
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepCard, isWide && { flex: 1 }]}>
                <LinearGradient colors={[s.color + '22', s.color + '08']} style={styles.stepIconWrap}>
                  <Ionicons name={s.icon} size={24} color={s.color} />
                </LinearGradient>
                <Text style={[styles.stepNum, { color: s.color }]}>{s.num}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CURRENCY ── */}
        <View style={[styles.sectionAlt, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>MULTI-CURRENCY</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            Works wherever{'\n'}you are.
          </Text>
          <Text style={styles.sectionBody}>
            Finance AI supports 12 currencies from around the world. Whether you earn in US dollars, Euros, Japanese Yen, or Korean Won — just pick your currency and the app formats everything for you.
          </Text>
          <Text style={[styles.sectionBody, { marginBottom: 32 }]}>
            You can select your preferred currency right now, before you even sign up.
          </Text>

          <TouchableOpacity style={styles.currencyPicker} onPress={() => setShowPicker(true)}>
            <Text style={styles.currencyPickerFlag}>{selected.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.currencyPickerCode}>{selected.code} — {selected.label}</Text>
              <Text style={styles.currencyPickerSub}>Tap to change your currency</Text>
            </View>
            <View style={styles.currencyArrow}>
              <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
            </View>
          </TouchableOpacity>

          <View style={styles.currencyChips}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.chip, c.code === selected.code && styles.chipActive]}
                onPress={() => handleSelectCurrency(c)}
              >
                <Text style={styles.chipFlag}>{c.flag}</Text>
                <Text style={[styles.chipCode, c.code === selected.code && { color: PRIMARY }]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── REVIEWS ── */}
        <View style={[styles.section, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>WHAT PEOPLE SAY</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            People love{'\n'}Finance AI.
          </Text>
          <View style={[styles.reviewGrid, isWide && { flexDirection: 'row' }]}>
            {REVIEWS.map((r, i) => (
              <View key={i} style={[styles.reviewCard, isWide && { flex: 1 }]}>
                <View style={styles.reviewStars}>
                  {[...Array(r.stars)].map((_, j) => (
                    <Ionicons key={j} name="star" size={14} color="#F59E0B" />
                  ))}
                </View>
                <Text style={styles.reviewText}>"{r.text}"</Text>
                <View style={styles.reviewAuthor}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{r.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewName}>{r.name}</Text>
                    <Text style={styles.reviewRole}>{r.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── TRUST SECTION ── */}
        <View style={[styles.section, { paddingHorizontal: px }]}>
          <View style={styles.sectionTag}><Text style={styles.sectionTagText}>TRUST & SECURITY</Text></View>
          <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 28 }]}>
            Your data is safe{'\n'}with us.
          </Text>
          <Text style={styles.sectionBody}>
            We take your privacy seriously. Finance AI is built on Supabase — an enterprise-grade, open-source backend with bank-level encryption. Your data is never sold, never shared, and never used for ads.
          </Text>
          <View style={[styles.trustGrid, isWide && { flexDirection: 'row' }]}>
            {[
              { icon: 'lock-closed' as const, color: '#6366F1', title: '256-bit Encryption', desc: 'All your data is encrypted at rest and in transit using AES-256, the same standard used by banks.' },
              { icon: 'eye-off' as const, color: '#10B981', title: 'No Ads, Ever', desc: 'We never show ads, never sell your data to third parties, and never track you across other websites.' },
              { icon: 'server' as const, color: '#F59E0B', title: 'Powered by Supabase', desc: 'Your data is stored securely on Supabase — trusted by thousands of companies worldwide.' },
              { icon: 'person' as const, color: '#EC4899', title: 'You Own Your Data', desc: 'Your financial data belongs to you. You can delete your account and all data at any time.' },
            ].map((t) => (
              <View key={t.title} style={[styles.trustCard, isWide && { flex: 1 }]}>
                <View style={[styles.trustIcon, { backgroundColor: t.color + '15' }]}>
                  <Ionicons name={t.icon} size={20} color={t.color} />
                </View>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustDesc}>{t.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FINAL CTA ── */}
        <LinearGradient colors={['#1E1B4B', '#0F0D2E', '#1E1B4B']} style={[styles.ctaSection, { paddingHorizontal: px }]}>
          <View style={styles.ctaGlow} />
          <Text style={[styles.ctaTitle, { fontSize: isWide ? 52 : 36 }]}>
            Stop guessing.{'\n'}
            <Text style={styles.heroAccent}>Start knowing.</Text>
          </Text>
          <Text style={styles.ctaSub}>
            Finance AI gives you a clear, honest picture of your money every single day. Free to use, forever. Start in 30 seconds.
          </Text>
          <TouchableOpacity onPress={onGetStarted}>
            <LinearGradient colors={['#ffffff', '#E0E7FF']} style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaBtnText}>Create Your Free Account</Text>
              <Ionicons name="arrow-forward" size={18} color={PRIMARY_DARK} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} style={{ marginTop: 20 }}>
            <Text style={styles.ctaSignIn}>Already have an account? Sign In →</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Finance AI · Free · Private · No Ads</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={onPrivacy}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity onPress={onTerms}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Currency</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close-circle" size={26} color="#374151" />
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 18, paddingBottom: 14,
    backgroundColor: 'rgba(7,11,20,0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLogoText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  navName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navLink: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  navCta: {
    backgroundColor: 'rgba(99,102,241,0.18)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  navCtaText: { color: '#A5B4FC', fontSize: 13, fontWeight: '700' },

  // Hero
  hero: { overflow: 'hidden' },
  glow1: { position: 'absolute', width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(99,102,241,0.1)', top: -200, left: -150 },
  glow2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(6,182,212,0.07)', bottom: 0, right: -100 },
  heroInner: { alignItems: 'center' },
  heroInnerWide: { flexDirection: 'row', alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginBottom: 28, alignSelf: 'flex-start',
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  heroBadgeText: { fontSize: 13, color: '#A5B4FC', fontWeight: '600' },
  heroH1: { fontWeight: '900', color: '#F1F5F9', lineHeight: 66, marginBottom: 20, letterSpacing: -1 },
  heroAccent: { color: '#818CF8' },
  heroSub: { fontSize: 17, color: '#94A3B8', lineHeight: 28, marginBottom: 36 },
  heroCtas: { gap: 14, alignItems: 'flex-start', marginBottom: 32 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 28, paddingVertical: 17, borderRadius: 14,
    shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnOutline: {
    paddingHorizontal: 28, paddingVertical: 17, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnOutlineText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trustBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  trustText: { fontSize: 12, color: '#4ADE80', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#F1F5F9', marginBottom: 3 },
  statLabel: { fontSize: 11, color: '#475569', fontWeight: '500', textAlign: 'center' },

  // Sections
  section: { backgroundColor: '#070B14', paddingTop: 80, paddingBottom: 80 },
  sectionAlt: { backgroundColor: '#0A0F1E', paddingTop: 80, paddingBottom: 80 },
  sectionTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, marginBottom: 20,
  },
  sectionTagText: { fontSize: 11, fontWeight: '800', color: '#818CF8', letterSpacing: 1.5 },
  sectionTitle: { fontWeight: '900', color: '#F1F5F9', lineHeight: 50, marginBottom: 16, letterSpacing: -0.5 },
  sectionSub: { fontSize: 16, color: '#64748B', lineHeight: 26, marginBottom: 48, maxWidth: 560 },
  sectionBody: { fontSize: 16, color: '#64748B', lineHeight: 28, marginBottom: 20, maxWidth: 680 },

  // Features
  featGrid: { gap: 0 },
  featCard: {
    backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 24, marginBottom: 14,
  },
  featIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 8 },
  featDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  // Steps
  stepsGrid: { flexDirection: 'row', gap: 16 },
  stepsList: { gap: 16 },
  stepCard: {
    backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 24,
  },
  stepIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stepNum: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 10 },
  stepDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  // Currency
  currencyPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 16, padding: 20, marginBottom: 24,
  },
  currencyPickerFlag: { fontSize: 32 },
  currencyPickerCode: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 3 },
  currencyPickerSub: { fontSize: 12, color: '#64748B' },
  currencyArrow: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  currencyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)' },
  chipFlag: { fontSize: 16 },
  chipCode: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },

  // Reviews
  reviewGrid: { gap: 16 },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 24, marginBottom: 0,
  },
  reviewStars: { flexDirection: 'row', gap: 3, marginBottom: 14 },
  reviewText: { fontSize: 15, color: '#CBD5E1', lineHeight: 24, marginBottom: 20, fontStyle: 'italic' },
  reviewAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  reviewRole: { fontSize: 12, color: '#64748B' },

  // CTA
  ctaSection: { alignItems: 'center', paddingTop: 100, paddingBottom: 60, overflow: 'hidden' },
  ctaGlow: { position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(99,102,241,0.12)', top: -150 },
  ctaTitle: { fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 60, marginBottom: 20, letterSpacing: -1 },
  ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 420, lineHeight: 26, marginBottom: 40 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 36, paddingVertical: 20, borderRadius: 16,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '900', color: PRIMARY_DARK },
  ctaSignIn: { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  footer: { marginTop: 60, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', alignSelf: 'stretch', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#334155' },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  footerLink: { fontSize: 12, color: '#64748B', fontWeight: '600', textDecorationLine: 'underline' },
  footerDot: { fontSize: 12, color: '#334155' },

  // Trust
  trustGrid: { gap: 14 },
  trustCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 22, marginBottom: 0 },
  trustIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  trustTitle: { fontSize: 15, fontWeight: '800', color: '#F1F5F9', marginBottom: 8 },
  trustDesc: { fontSize: 13, color: '#64748B', lineHeight: 21 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
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

// ── Preview styles ─────────────────────────────────────────────────────────────
const preview = StyleSheet.create({
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 30, elevation: 12,
  },
  header: { padding: 24 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  headerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 4 },
  headerIncome: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerRemaining: { fontSize: 22, fontWeight: '900', color: '#4ADE80' },
  barBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, width: '27%' },
  barLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  list: { backgroundColor: '#0F172A', padding: 20 },
  listTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 14, letterSpacing: 0.5 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  expIcon: { fontSize: 22 },
  expName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  expCat: { fontSize: 12, color: '#475569' },
  expAmt: { fontSize: 14, fontWeight: '800', color: '#F87171' },
});
