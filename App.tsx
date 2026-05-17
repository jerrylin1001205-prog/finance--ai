import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Platform,
  useWindowDimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { LanguageProvider, useLanguage } from './services/languageContext';
import { supabase, getUser } from './services/supabase';
import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import AdviceScreen from './screens/AdviceScreen';
import HistoryScreen from './screens/HistoryScreen';
import BudgetScreen from './screens/BudgetScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import NetWorthScreen from './screens/NetWorthScreen';
import AccountScreen from './screens/AccountScreen';
import PersonalSettingScreen from './screens/PersonalSettingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const PRIMARY = '#2563EB';
const DESKTOP_BREAKPOINT = 768;

const SCREENS: Record<string, React.ComponentType<any>> = {
  Home: DashboardScreen,
  Add: AddTransactionScreen,
  Analytics: AnalyticsScreen,
  Advice: AdviceScreen,
  History: HistoryScreen,
  NetWorth: NetWorthScreen,
  Settings: BudgetScreen,
  Account: AccountScreen,
  PersonalSetting: PersonalSettingScreen,
};

// ─── Mindful Modal ────────────────────────────────────────────────────────────

function MindfulModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tr } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>{tr.mindful_title}</Text>
          <Text style={modalStyles.message}>{tr.mindful_message}</Text>
          <TouchableOpacity style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>{tr.mindful_continue}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  message: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 24 },
  btn: { backgroundColor: PRIMARY, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── Mobile: More Stack & Tabs ────────────────────────────────────────────────

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="NetWorth" component={NetWorthScreen} />
      <Stack.Screen name="Settings" component={BudgetScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="PersonalSetting" component={PersonalSettingScreen} />
    </Stack.Navigator>
  );
}

function MoreScreen({ navigation }: any) {
  const { tr } = useLanguage();
  const items = [
    { label: tr.history, icon: 'list', screen: 'History' },
    { label: tr.net_worth, icon: 'trending-up', screen: 'NetWorth' },
    { label: tr.cloud_backup, icon: 'cloud-upload', screen: 'Account' },
    { label: tr.settings_budget, icon: 'settings', screen: 'Settings' },
    { label: 'Personal Settings', icon: 'person-circle', screen: 'PersonalSetting' },
  ];
  return (
    <SafeAreaView style={moreStyles.container}>
      <Text style={moreStyles.title}>{tr.more_title}</Text>
      {items.map(item => (
        <TouchableOpacity key={item.screen} style={moreStyles.row} onPress={() => navigation.navigate(item.screen)}>
          <Ionicons name={item.icon as any} size={22} color={PRIMARY} style={{ marginRight: 14 }} />
          <Text style={moreStyles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 20, marginTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 18, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
});

function MobileTabs() {
  const { tr } = useLanguage();
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
            Analytics: focused ? 'bar-chart' : 'bar-chart-outline',
            Advice: focused ? 'sparkles' : 'sparkles-outline',
            More: focused ? 'grid' : 'grid-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: tr.home_tab }} />
      <Tab.Screen name="Add" component={AddTransactionScreen} options={{ tabBarLabel: tr.add_tab }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: tr.analytics_tab }} />
      <Tab.Screen name="Advice" component={AdviceScreen} options={{ tabBarLabel: tr.advice_tab }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarLabel: tr.more_tab }} />
    </Tab.Navigator>
  );
}

// ─── Desktop: Sidebar Layout ──────────────────────────────────────────────────

interface NavItem {
  screen: string;
  labelKey: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  staticLabel?: string;
}
interface NavGroup { title: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { screen: 'Home', labelKey: 'home_tab', icon: 'home-outline' },
      { screen: 'Add', labelKey: 'add_tab', icon: 'add-circle-outline' },
      { screen: 'Analytics', labelKey: 'analytics_tab', icon: 'bar-chart-outline' },
      { screen: 'Advice', labelKey: 'advice_tab', icon: 'sparkles-outline' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { screen: 'History', labelKey: 'history', icon: 'list-outline' },
      { screen: 'NetWorth', labelKey: 'net_worth', icon: 'trending-up-outline' },
    ],
  },
  {
    title: 'Account',
    items: [
      { screen: 'Account', labelKey: 'cloud_backup', icon: 'cloud-upload-outline' },
      { screen: 'Settings', labelKey: 'settings_budget', icon: 'settings-outline' },
      { screen: 'PersonalSetting', labelKey: 'more_tab', icon: 'person-circle-outline', staticLabel: 'Personal Settings' },
    ],
  },
];

const DesktopStack = createNativeStackNavigator();

function DesktopLayout() {
  const { tr } = useLanguage();
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

        {/* ── Sidebar ── */}
        <View style={deskStyles.sidebar}>
          {/* Brand */}
          <View style={deskStyles.brand}>
            <View style={deskStyles.brandIcon}>
              <Text style={deskStyles.brandIconText}>F</Text>
            </View>
            <Text style={deskStyles.brandName}>Finance AI</Text>
          </View>

          {/* Nav groups */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {NAV_GROUPS.map(group => (
              <View key={group.title} style={deskStyles.navGroup}>
                <Text style={deskStyles.navGroupTitle}>{group.title}</Text>
                {group.items.map(item => {
                  const label = item.staticLabel ?? (tr as any)[item.labelKey!] ?? item.screen;
                  const isActive = active === item.screen;
                  return (
                    <TouchableOpacity
                      key={item.screen}
                      style={[deskStyles.navItem, isActive && deskStyles.navItemActive]}
                      onPress={() => navigateTo(item.screen)}
                    >
                      <Ionicons name={item.icon} size={18} color={isActive ? PRIMARY : '#6B7280'} />
                      <Text style={[deskStyles.navLabel, isActive && deskStyles.navLabelActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* User footer */}
          {userEmail ? (
            <View style={deskStyles.userRow}>
              <View style={deskStyles.userAvatar}>
                <Text style={deskStyles.userAvatarText}>{userEmail[0].toUpperCase()}</Text>
              </View>
              <Text style={deskStyles.userEmail} numberOfLines={1}>{userEmail}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Content ── */}
        <View style={deskStyles.content}>
          <NavigationContainer ref={navRef} independent={true}>
            <DesktopStack.Navigator screenOptions={{ headerShown: false }}>
              <DesktopStack.Screen name="Home" component={DashboardScreen} />
              <DesktopStack.Screen name="Add" component={AddTransactionScreen} />
              <DesktopStack.Screen name="Analytics" component={AnalyticsScreen} />
              <DesktopStack.Screen name="Advice" component={AdviceScreen} />
              <DesktopStack.Screen name="History" component={HistoryScreen} />
              <DesktopStack.Screen name="NetWorth" component={NetWorthScreen} />
              <DesktopStack.Screen name="Settings" component={BudgetScreen} />
              <DesktopStack.Screen name="Account" component={AccountScreen} />
              <DesktopStack.Screen name="PersonalSetting" component={PersonalSettingScreen} />
            </DesktopStack.Navigator>
          </NavigationContainer>
        </View>

      </View>
    </View>
  );
}

const deskStyles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#E8ECF0',
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1200,
    backgroundColor: '#F7F8FA',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingTop: 28,
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  brandIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  brandName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  navGroup: { marginBottom: 20 },
  navGroupTitle: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 4, paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
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
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userEmail: { flex: 1, fontSize: 12, color: '#6B7280' },
});

// ─── App Content (auth gate + layout switch) ──────────────────────────────────

function AuthWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={authWrapStyles.bg}>
      <View style={authWrapStyles.card}>{children}</View>
    </View>
  );
}

const authWrapStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#E8ECF0', alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 480, flex: 1 },
});

function AppContent() {
  const { width } = useWindowDimensions();
  const { lang } = useLanguage();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [mindfulVisible, setMindfulVisible] = useState(false);
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) setMindfulVisible(true);
      })
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      if (session) setMindfulVisible(true);
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
    return (
      <AuthWrapper>
        {authView === 'register'
          ? <RegisterScreen onGoToLogin={() => setAuthView('login')} />
          : <LoginScreen onGoToRegister={() => setAuthView('register')} />
        }
      </AuthWrapper>
    );
  }

  return (
    <>
      <MindfulModal visible={mindfulVisible} onClose={() => setMindfulVisible(false)} />
      {isDesktop ? (
        <DesktopLayout key={lang} />
      ) : (
        <NavigationContainer key={lang}>
          <MobileTabs />
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="dark" />
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
