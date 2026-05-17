import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBudget, saveBudget, getApiKey, saveApiKey } from '../services/storage';
import { useLanguage } from '../services/languageContext';
import { LANGUAGES } from '../services/i18n';

const COLORS = {
  primary: '#2563EB',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
};

export default function BudgetScreen() {
  const { tr, lang, setLang } = useLanguage();
  const [monthly, setMonthly] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [apiKey, setApiKey] = useState('');

  useFocusEffect(useCallback(() => {
    getBudget().then(b => {
      setMonthly(b.totalMonthly > 0 ? b.totalMonthly.toString() : '');
      setSavingsGoal(b.savingsGoal > 0 ? b.savingsGoal.toString() : '');
    });
    getApiKey().then(k => setApiKey(k));
  }, []));

  const handleSave = async () => {
    await saveBudget({
      totalMonthly: parseFloat(monthly) || 0,
      savingsGoal: parseFloat(savingsGoal) || 0,
      categories: {},
    });
    if (apiKey.trim()) await saveApiKey(apiKey.trim());
    Alert.alert('Saved!', 'Your settings have been saved.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{tr.settings_title}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tr.monthly_budget_section}</Text>
          <Text style={styles.desc}>{tr.budget_desc}</Text>
          <Text style={styles.label}>{tr.budget_limit} ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2000"
            keyboardType="decimal-pad"
            value={monthly}
            onChangeText={setMonthly}
            placeholderTextColor={COLORS.sub}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tr.savings_section}</Text>
          <Text style={styles.desc}>{tr.savings_desc}</Text>
          <Text style={styles.label}>{tr.savings_goal_label} ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            keyboardType="decimal-pad"
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            placeholderTextColor={COLORS.sub}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tr.api_section}</Text>
          <Text style={styles.desc}>Required for AI advice. Don't know how? Watch the tutorial below.</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{tr.age_warning}</Text>
          </View>
          <TouchableOpacity
            style={styles.videoBtn}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=eVX-La42ff0')}
          >
            <Text style={styles.videoBtnText}>{tr.watch_tutorial}</Text>
          </TouchableOpacity>
          <Text style={styles.label}>{tr.api_key_label}</Text>
          <TextInput
            style={styles.input}
            placeholder="AIza..."
            value={apiKey}
            onChangeText={setApiKey}
            placeholderTextColor={COLORS.sub}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tr.select_language}</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langChip, lang === l.code && styles.langChipActive]}
                onPress={() => setLang(l.code)}
              >
                <Text style={[styles.langChipText, lang === l.code && styles.langChipTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{tr.save_settings}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginVertical: 16 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  desc: { fontSize: 13, color: COLORS.sub, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0EE', borderRadius: 10,
    padding: 12, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.bg,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 18,
    alignItems: 'center', marginBottom: 40, shadowColor: COLORS.primary,
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  warningBox: {
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF9800',
  },
  warningText: { fontSize: 13, color: '#E65100', fontWeight: '600' },
  videoBtn: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary,
  },
  videoBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  langChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langChipText: { fontSize: 12, fontWeight: '600', color: COLORS.sub },
  langChipTextActive: { color: '#fff' },
});
