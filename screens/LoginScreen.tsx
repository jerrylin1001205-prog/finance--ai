import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../services/supabase';
import { useTheme } from '../utils/theme';

interface Props {
  onGoToRegister: () => void;
}

export default function LoginScreen({ onGoToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Dark indigo header */}
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>F</Text>
          </View>
          <Text style={styles.brand}>Finance AI</Text>
          <Text style={styles.tagline}>Take control of your money.</Text>
        </LinearGradient>

        {/* White card body */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Inline error */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor="#CBD5E1"
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={styles.pwInput}
              placeholder="••••••••"
              placeholderTextColor="#CBD5E1"
              value={password}
              onChangeText={t => { setPassword(t); setError(''); }}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[PRIMARY, '#4F46E5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onGoToRegister}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1 },

  header: {
    paddingTop: 60, paddingBottom: 44, paddingHorizontal: 28,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '900' },
  brand: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  card: {
    marginHorizontal: 16, marginTop: -20, borderRadius: 24,
    backgroundColor: '#fff', padding: 28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '600' },

  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    letterSpacing: 1.2, marginBottom: 8,
  },
  input: {
    borderBottomWidth: 2, borderBottomColor: '#E2E8F0',
    fontSize: 16, color: '#0F172A', paddingBottom: 10,
    fontWeight: '600',
  },

  pwRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#E2E8F0',
  },
  pwInput: {
    flex: 1, fontSize: 16, color: '#0F172A',
    paddingBottom: 10, fontWeight: '600',
  },
  eyeBtn: { padding: 4 },

  btn: { marginTop: 28, borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 32 },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { fontSize: 14, color: PRIMARY, fontWeight: '800' },
});
