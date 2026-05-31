import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, useWindowDimensions, Modal, FlatList, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES, Currency, saveCurrency, getCurrency } from '../utils/currency';

const PRIMARY = '#2563EB';
const SLIDES = [
  {
    bg: '#0F172A',
    accent: '#2563EB',
    tag: '💰 Personal Finance',
    headline: 'Take control of\nyour money.',
    sub: 'Finance AI helps you track income, log expenses, and stay on budget — all in one clean app.',
    visual: '📊',
  },
  {
    bg: '#1E3A5F',
    accent: '#38BDF8',
    tag: '📥 Log Expenses',
    headline: 'Every purchase,\ncaptured instantly.',
    sub: 'Add expenses by category — food, transport, rent, shopping, health — in just a few taps.',
    visual: '🧾',
  },
  {
    bg: '#14532D',
    accent: '#4ADE80',
    tag: '📈 Budget Tracking',
    headline: 'See how much\nyou have left.',
    sub: 'Set your monthly income and watch your remaining budget update in real time as you spend.',
    visual: '💹',
  },
  {
    bg: '#3B1F6A',
    accent: '#A78BFA',
    tag: '🌍 Your Currency',
    headline: 'Your money,\nyour currency.',
    sub: 'Choose from 12 currencies worldwide. Finance AI adapts to wherever you are.',
    visual: '🌐',
    isCurrency: true,
  },
  {
    bg: '#1E3A5F',
    accent: '#F59E0B',
    tag: '🚀 Get Started',
    headline: 'Ready to take\ncontrol?',
    sub: 'It\'s free. No credit card needed. Sign up in seconds and start tracking today.',
    visual: '🎯',
    isCTA: true,
  },
];

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingScreen({ onGetStarted, onSignIn }: Props) {
  const { width, height } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selected, setSelected] = useState<Currency>(getCurrency());
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ y: index * height, animated: true });
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / height);
    setCurrentSlide(idx);
  };

  const handleSelectCurrency = async (c: Currency) => {
    await saveCurrency(c);
    setSelected(c);
    setShowPicker(false);
  };

  return (
    <View style={{ flex: 1 }}>

      {/* Fixed nav */}
      <View style={styles.nav}>
        <View style={styles.navBrand}>
          <View style={styles.navLogo}><Text style={styles.navLogoText}>F</Text></View>
          <Text style={styles.navName}>Finance AI</Text>
        </View>
        <TouchableOpacity style={styles.navSignIn} onPress={onSignIn}>
          <Text style={styles.navSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { height, backgroundColor: slide.bg }]}>

            {/* Tag */}
            <View style={[styles.tag, { backgroundColor: slide.accent + '30', borderColor: slide.accent + '60' }]}>
              <Text style={[styles.tagText, { color: slide.accent }]}>{slide.tag}</Text>
            </View>

            {/* Big emoji visual */}
            <Text style={styles.visual}>{slide.visual}</Text>

            {/* Headline */}
            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.sub}>{slide.sub}</Text>

            {/* Currency picker slide */}
            {slide.isCurrency && (
              <TouchableOpacity
                style={[styles.currencyBtn, { borderColor: slide.accent }]}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.currencyFlag}>{selected.flag}</Text>
                <Text style={[styles.currencyCode, { color: slide.accent }]}>
                  {selected.code} — {selected.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color={slide.accent} />
              </TouchableOpacity>
            )}

            {/* CTA slide */}
            {slide.isCTA && (
              <View style={styles.ctaGroup}>
                <TouchableOpacity style={styles.btnPrimary} onPress={onGetStarted}>
                  <Text style={styles.btnPrimaryText}>Create Free Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={onSignIn}>
                  <Text style={styles.btnGhostText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scroll hint */}
            {i < SLIDES.length - 1 && (
              <TouchableOpacity style={styles.scrollHint} onPress={() => goTo(i + 1)}>
                <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              i === currentSlide ? styles.dotActive : styles.dotInactive,
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Currency modal */}
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
  // Nav
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo: {
    width: 32, height: 32, borderRadius: 9, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  navName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  navSignIn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  navSignInText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Slide
  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 80,
  },
  tag: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28,
  },
  tagText: { fontSize: 13, fontWeight: '700' },
  visual: { fontSize: 80, marginBottom: 24 },
  headline: {
    fontSize: 42, fontWeight: '900', color: '#fff',
    textAlign: 'center', lineHeight: 50, marginBottom: 18,
  },
  sub: {
    fontSize: 16, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 26, maxWidth: 360, marginBottom: 32,
  },

  // Currency
  currencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  currencyFlag: { fontSize: 22 },
  currencyCode: { fontSize: 15, fontWeight: '700', flex: 1 },

  // CTA
  ctaGroup: { alignItems: 'center', gap: 16 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: PRIMARY, paddingHorizontal: 36, paddingVertical: 18,
    borderRadius: 16,
    shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnGhost: { paddingVertical: 10 },
  btnGhostText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },

  // Scroll hint
  scrollHint: {
    position: 'absolute', bottom: 32,
    alignSelf: 'center',
  },

  // Dots
  dots: {
    position: 'absolute', right: 16,
    top: '50%' as any, gap: 6,
    transform: [{ translateY: -40 }],
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#fff', height: 18, borderRadius: 3 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
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
