import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  useWindowDimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { supabase, getUser } from './services/supabase';
import { loadCurrency } from './utils/currency';
import { loadTheme } from './utils/theme';
import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import HistoryScreen from './screens/HistoryScreen';
import BudgetScreen from './screens/BudgetScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import LandingScreen from './screens/LandingScreen';
import LegalScreen from './screens/LegalScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const PRIMARY = '#2563EB';
const DESKTOP_BREAKPOINT = 768;

// ── Mobile bottom tabs ────────────────────────────────────────────────────────

function MobileTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Add: focused ? 'add-circle' : 'add-circle-outline',
            History: focused ? 'list' : 'list-outline',
            Income: focused ? 'wallet' : 'wallet-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Add" component={AddTransactionScreen} options={{ tabBarLabel: 'Add Expense' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Income" component={BudgetScreen} options={{ tabBarLabel: 'Income' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

// ── Desktop sidebar layout ────────────────────────────────────────────────────

const NAV_ITEMS = [
  { screen: 'Home', label: 'Dashboard', icon: 'home-outline' as const },
  { screen: 'Add', label: 'Add Expense', icon: 'add-circle-outline' as const },
  { screen: 'History', label: 'History', icon: 'list-outline' as const },
  { screen: 'Income', label: 'Monthly Income', icon: 'wallet-outline' as const },
  { screen: 'Settings', label: 'Settings', icon: 'settings-outline' as const },
];

const DesktopStack = createNativeStackNavigator();

function DesktopLayout() {
  const [active, setActive] = useState('Home');
  const [userEmail, setUserEmail] = useState('');
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    getUser().then(u => { if (u?.email) setUserEmail(u.email); });
  }, []);

  const navigateTo = (screen: string) => {
    navRef.reset({ index: 0, routes: [{ name: screen as never }] });
    setActive(screen);
  };

  return (
    <View style={deskStyles.bg}>
      <View style={deskStyles.frame}>

        {/* Sidebar */}
        <View style={deskStyles.sidebar}>
          <View style={deskStyles.brand}>
            <View style={deskStyles.brandIcon}>
              <Text style={deskStyles.brandIconText}>F</Text>
            </View>
            <Text style={deskStyles.brandName}>Finance AI</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.map(item => {
              const isActive = active === item.screen;
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={[deskStyles.navItem, isActive && deskStyles.navItemActive]}
                  onPress={() => navigateTo(item.screen)}
                >
                  <Ionicons name={item.icon} size={18} color={isActive ? PRIMARY : '#6B7280'} />
                  <Text style={[deskStyles.navLabel, isActive && deskStyles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {userEmail ? (
            <View style={deskStyles.userRow}>
              <View style={deskStyles.userAvatar}>
                <Text style={deskStyles.userAvatarText}>{userEmail[0].toUpperCase()}</Text>
              </View>
              <Text style={deskStyles.userEmail} numberOfLines={1}>{userEmail}</Text>
            </View>
          ) : null}
        </View>

        {/* Content */}
        <View style={deskStyles.content}>
          <NavigationContainer ref={navRef} independent={true}>
            <DesktopStack.Navigator screenOptions={{ headerShown: false }}>
              <DesktopStack.Screen name="Home" component={DashboardScreen} />
              <DesktopStack.Screen name="Add" component={AddTransactionScreen} />
              <DesktopStack.Screen name="History" component={HistoryScreen} />
              <DesktopStack.Screen name="Income" component={BudgetScreen} />
              <DesktopStack.Screen name="Settings" component={SettingsScreen} />
            </DesktopStack.Navigator>
          </NavigationContainer>
        </View>

      </View>
    </View>
  );
}

// ── Auth wrapper (web centering) ──────────────────────────────────────────────

function AuthWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={authStyles.bg}>
      <View style={authStyles.card}>{children}</View>
    </View>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

function AppContent() {
  const { width } = useWindowDimensions();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  useEffect(() => {
    loadCurrency();
    loadTheme();
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!session) {
    if (legalView !== null) {
      return <LegalScreen section={legalView} onBack={() => setLegalView(null)} />;
    }
    if (authView === 'landing') {
      return (
        <View style={{ flex: 1 }}>
          <LandingScreen
            onGetStarted={() => setAuthView('register')}
            onSignIn={() => setAuthView('login')}
            onPrivacy={() => setLegalView('privacy')}
            onTerms={() => setLegalView('terms')}
          />
        </View>
      );
    }
    // Login & Register manage their own full-screen layout — no AuthWrapper needed
    return authView === 'register'
      ? <RegisterScreen onGoToLogin={() => setAuthView('login')} />
      : <LoginScreen onGoToRegister={() => setAuthView('register')} />;
  }

  if (isDesktop) return <DesktopLayout />;

  return (
    <NavigationContainer>
      <MobileTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppContent />
    </SafeAreaProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const deskStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#E8ECF0', alignItems: 'center' },
  frame: {
    flex: 1, flexDirection: 'row', width: '100%', maxWidth: 1200,
    backgroundColor: '#F7F8FA',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, elevation: 8,
  },
  sidebar: {
    width: 240, backgroundColor: '#fff',
    borderRightWidth: 1, borderRightColor: '#E5E7EB',
    paddingTop: 28, paddingHorizontal: 14, paddingBottom: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, paddingHorizontal: 4 },
  brandIcon: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  brandName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 2,
  },
  navItemActive: { backgroundColor: '#EFF6FF' },
  navLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  navLabelActive: { color: PRIMARY, fontWeight: '700' },
  content: { flex: 1, overflow: 'hidden' as any },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingTop: 16, paddingHorizontal: 4,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userEmail: { flex: 1, fontSize: 12, color: '#6B7280' },
});

const authStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#E8ECF0', alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 480, flex: 1 },
});
