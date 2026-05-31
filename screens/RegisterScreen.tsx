import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signUp, supabase } from '../services/supabase';

const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  primary: '#1E40AF',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FCA5A5',
};

interface Props { onGoToLogin: () => void; }

function getStrength(pw: string) {
  if (!pw) return null;
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  if (score <= 1) return { label: 'Weak', color: '#EF4444', pct: 25 };
  if (score === 2) return { label: 'Fair', color: '#F59E0B', pct: 60 };
  if (score === 3) return { label: 'Good', color: '#3B82F6', pct: 80 };
  return { label: 'Strong', color: '#10B981', pct: 100 };
}

export default function RegisterScreen({ onGoToLogin }: Props) {
  const { width, height } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const strength = getStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const handleRegister = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onGoToLogin();
      }
    } catch (e: any) {
      setError(e.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, isWide && styles.innerWide]}>

        {/* ── Left panel (wide only) ── */}
        {isWide && (
          <View style={styles.leftPanel}>
            <View style={styles.leftContent}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>F</Text>
              </View>
              <Text style={styles.leftTitle}>Join Finance AI</Text>
              <Text style={styles.leftSub}>
                Create your free account and start tracking your money in minutes. No setup, no fees, no limits.
              </Text>
              <View style={styles.trustList}>
                {['Takes less than 60 seconds', 'No credit card required', 'Free forever', 'Delete anytime'].map(t => (
                  <View key={t} style={styles.trustItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#60A5FA" />
                    <Text style={styles.trustText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Form ── */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[styles.formContent, { minHeight: height }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isWide && (
            <View style={styles.mobileBrand}>
              <View style={styles.mobileLogo}>
                <Text style={styles.mobileLogoText}>F</Text>
              </View>
              <Text style={styles.mobileBrandName}>Finance AI</Text>
            </View>
          )}

          <View style={styles.formBox}>
            <Text style={styles.formTitle}>Create your account</Text>
            <Text style={styles.formSub}>Free forever · No credit card needed</Text>

            {error !== '' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={C.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? C.primary : C.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@email.com"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? C.primary : C.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPw}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>

              {/* Strength bar */}
              {strength && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBarBg}>
                    <View style={[styles.strengthBarFill, {
                      width: `${strength.pct}%` as any,
                      backgroundColor: strength.color,
                    }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <View style={[
                styles.inputWrap,
                focusedField === 'confirm' && styles.inputFocused,
                passwordsMismatch && styles.inputError,
                passwordsMatch && styles.inputSuccess,
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordsMismatch ? C.error : passwordsMatch ? '#10B981' : focusedField === 'confirm' ? C.primary : C.muted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Repeat your password"
                  placeholderTextColor={C.muted}
                  value={confirm}
                  onChangeText={v => { setConfirm(v); setError(''); }}
                  secureTextEntry={!showConfirm}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                />
                {passwordsMatch && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                {passwordsMismatch && <Ionicons name="close-circle" size={18} color={C.error} />}
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
              {passwordsMismatch && (
                <Text style={styles.mismatchText}>Passwords do not match</Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Create Account</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.switchBtn} onPress={onGoToLogin} activeOpacity={0.85}>
              <Text style={styles.switchText}>Sign in to existing account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pageFooter}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.muted} />
            <Text style={styles.pageFooterText}>Your data is encrypted and private</Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1 },
  innerWide: { flexDirection: 'row' },

  leftPanel: { width: 420, backgroundColor: '#0F172A', justifyContent: 'center', padding: 56 },
  leftContent: { maxWidth: 340 },
  logoMark: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoMarkText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  leftTitle: { fontSize: 30, fontWeight: '900', color: '#F1F5F9', marginBottom: 14, lineHeight: 38 },
  leftSub: { fontSize: 15, color: '#94A3B8', lineHeight: 26, marginBottom: 36 },
  trustList: { gap: 12 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustText: { fontSize: 14, color: '#CBD5E1', fontWeight: '500' },

  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 28, marginBottom: 36 },
  mobileLogo: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  mobileLogoText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  mobileBrandName: { fontSize: 20, fontWeight: '900', color: C.text },

  formScroll: { flex: 1, backgroundColor: C.bg },
  formContent: { justifyContent: 'center', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },
  formBox: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
    maxWidth: 480, width: '100%', alignSelf: 'center',
  },
  formTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
  formSub: { fontSize: 14, color: C.sub, marginBottom: 24 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.errorBg, borderRadius: 12, padding: 13,
    marginBottom: 18, borderWidth: 1, borderColor: C.errorBorder,
  },
  errorText: { flex: 1, fontSize: 13, color: C.error, fontWeight: '600', lineHeight: 18 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    backgroundColor: C.bg, paddingHorizontal: 14, paddingVertical: 2,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  inputError: { borderColor: C.error, backgroundColor: '#FEF2F2' },
  inputSuccess: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 13, fontWeight: '500' },
  eyeBtn: { padding: 6, marginLeft: 4 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthBarBg: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '800', minWidth: 42, textAlign: 'right' },

  mismatchText: { fontSize: 12, color: C.error, fontWeight: '600', marginTop: 5, marginLeft: 2 },

  submitBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  switchBtn: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', backgroundColor: C.bg,
  },
  switchText: { fontSize: 15, fontWeight: '700', color: C.text },

  pageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  pageFooterText: { fontSize: 12, color: C.muted, fontWeight: '500' },
});
