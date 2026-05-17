import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { signUp } from '../services/supabase';

const PRIMARY = '#2563EB';
const COLORS = {
  bg: '#F7F8FA', card: '#FFFFFF', text: '#111827', sub: '#6B7280',
  income: '#16A34A', border: '#E5E7EB',
};

interface Props {
  onGoToLogin: () => void;
}

export default function RegisterScreen({ onGoToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setDone(true);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.root}>
        <View style={styles.successBox}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successMsg}>
            We sent a confirmation link to{'\n'}
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{email}</Text>
            {'\n\n'}Click the link to activate your account, then sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onGoToLogin}>
            <Text style={styles.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.brand}>Finance AI</Text>
          <Text style={styles.tagline}>Start your financial journey.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>It's free. No credit card needed.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={COLORS.sub}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat your password"
            placeholderTextColor={COLORS.sub}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onGoToLogin}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  brand: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  tagline: { fontSize: 14, color: COLORS.sub },
  card: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.sub, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.bg, marginBottom: 16,
  },
  btn: {
    backgroundColor: PRIMARY, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.sub },
  footerLink: { fontSize: 14, color: PRIMARY, fontWeight: '700' },
  successBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.income,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  checkText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  successMsg: { fontSize: 15, color: COLORS.sub, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
});
