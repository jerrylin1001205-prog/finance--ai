import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../services/supabase';
import { supabase } from '../services/supabase';

// Auth screens use a fixed light style — they appear before theme is fully loaded
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

interface Props { onGoToRegister: () => void; }

export default function LoginScreen({ onGoToRegister }: Props) {
  const { width, height } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [focusedForgot, setFocusedForgot] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const msg: string = e.message ?? 'Sign in failed. Check your email and password.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError("Your email needs to be confirmed. Check your inbox or use 'Forgot password?' to resend.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError('');
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: 'https://finance-ai-xi-mocha.vercel.app/',
      });
      if (resetError) throw resetError;
      setForgotSuccess(true);
    } catch (e: any) {
      setForgotError(e.message ?? 'Failed to send reset link. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
    setFocusedForgot(false);
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
              <Text style={styles.leftTitle}>Finance AI</Text>
              <Text style={styles.leftSub}>
                The simplest way to track your income, log expenses, and stay on budget every month.
              </Text>
              <View style={styles.trustList}>
                {['Free forever', 'No credit card needed', '12 currencies supported', 'Private & encrypted'].map(t => (
                  <View key={t} style={styles.trustItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#60A5FA" />
                    <Text style={styles.trustText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Right panel / form ── */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[styles.formContent, { minHeight: height }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top brand (mobile only) */}
          {!isWide && (
            <View style={styles.mobileBrand}>
              <View style={styles.mobileLogo}>
                <Text style={styles.mobileLogoText}>F</Text>
              </View>
              <Text style={styles.mobileBrandName}>Finance AI</Text>
            </View>
          )}

          <View style={styles.formBox}>

            {/* ── FORGOT PASSWORD FORM ── */}
            {showForgot ? (
              <>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.formSub}>Enter your email and we'll send you a reset link.</Text>

                {/* Forgot error */}
                {forgotError !== '' && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={C.error} />
                    <Text style={styles.errorText}>{forgotError}</Text>
                  </View>
                )}

                {/* Forgot success */}
                {forgotSuccess ? (
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.successText}>Check your email for a password reset link.</Text>
                  </View>
                ) : (
                  <>
                    {/* Email field */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Email address</Text>
                      <View style={[styles.inputWrap, focusedForgot && styles.inputFocused]}>
                        <Ionicons name="mail-outline" size={18} color={focusedForgot ? C.primary : C.muted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="you@email.com"
                          placeholderTextColor={C.muted}
                          value={forgotEmail}
                          onChangeText={v => { setForgotEmail(v); setForgotError(''); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          onFocus={() => setFocusedForgot(true)}
                          onBlur={() => setFocusedForgot(false)}
                        />
                      </View>
                    </View>

                    {/* Send reset link button */}
                    <TouchableOpacity
                      style={[styles.submitBtn, forgotLoading && { opacity: 0.7 }]}
                      onPress={handleForgotPassword}
                      disabled={forgotLoading}
                      activeOpacity={0.88}
                    >
                      {forgotLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitText}>Send Reset Link</Text>
                      }
                    </TouchableOpacity>
                  </>
                )}

                {/* Back to sign in */}
                <TouchableOpacity style={styles.backLink} onPress={handleBackToSignIn}>
                  <Ionicons name="arrow-back" size={15} color={C.primary} />
                  <Text style={styles.backLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── MAIN LOGIN FORM ── */}
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSub}>Sign in to your account to continue</Text>

                {/* Error */}
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
                      placeholder="Enter your password"
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
                  {/* Forgot password link */}
                  <TouchableOpacity style={styles.forgotLink} onPress={() => setShowForgot(true)}>
                    <Text style={styles.forgotLinkText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitText}>Sign In</Text>
                  }
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Switch to register */}
                <TouchableOpacity style={styles.switchBtn} onPress={onGoToRegister} activeOpacity={0.85}>
                  <Text style={styles.switchText}>Create a new account</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
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

  // Left panel
  leftPanel: {
    width: 420, backgroundColor: '#0F172A',
    justifyContent: 'center', padding: 56,
  },
  leftContent: { maxWidth: 340 },
  logoMark: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  logoMarkText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  leftTitle: { fontSize: 32, fontWeight: '900', color: '#F1F5F9', marginBottom: 14, lineHeight: 40 },
  leftSub: { fontSize: 15, color: '#94A3B8', lineHeight: 26, marginBottom: 36 },
  trustList: { gap: 12 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustText: { fontSize: 14, color: '#CBD5E1', fontWeight: '500' },

  // Mobile brand
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 28, marginBottom: 36 },
  mobileLogo: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  mobileLogoText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  mobileBrandName: { fontSize: 20, fontWeight: '900', color: C.text },

  // Form
  formScroll: { flex: 1, backgroundColor: C.bg },
  formContent: {
    justifyContent: 'center', paddingHorizontal: 28,
    paddingTop: 20, paddingBottom: 40,
  },
  formBox: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
    maxWidth: 480, width: '100%', alignSelf: 'center',
  },
  formTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 6 },
  formSub: { fontSize: 14, color: C.sub, marginBottom: 24, lineHeight: 22 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.errorBg, borderRadius: 12, padding: 13,
    marginBottom: 20, borderWidth: 1, borderColor: C.errorBorder,
  },
  errorText: { flex: 1, fontSize: 13, color: C.error, fontWeight: '600', lineHeight: 18 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 12, padding: 13,
    marginBottom: 20, borderWidth: 1, borderColor: '#6EE7B7',
  },
  successText: { flex: 1, fontSize: 13, color: '#059669', fontWeight: '600', lineHeight: 18 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    backgroundColor: C.bg, paddingHorizontal: 14, paddingVertical: 2,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 13, fontWeight: '500' },
  eyeBtn: { padding: 6 },

  forgotLink: { alignSelf: 'flex-end', marginTop: 8 },
  forgotLinkText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, alignSelf: 'center' },
  backLinkText: { fontSize: 14, color: C.primary, fontWeight: '700' },

  submitBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  switchBtn: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', backgroundColor: C.bg,
  },
  switchText: { fontSize: 15, fontWeight: '700', color: C.text },

  pageFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24,
  },
  pageFooterText: { fontSize: 12, color: C.muted, fontWeight: '500' },
});
