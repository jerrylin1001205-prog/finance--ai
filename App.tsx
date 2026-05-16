import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import AdviceScreen from './screens/AdviceScreen';
import HistoryScreen from './screens/HistoryScreen';
import BudgetScreen from './screens/BudgetScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import NetWorthScreen from './screens/NetWorthScreen';
import AccountScreen from './screens/AccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PRIMARY = '#2563EB';

function MainTabs() {
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
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Add" component={AddTransactionScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Advice" component={AdviceScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="NetWorth" component={NetWorthScreen} />
      <Stack.Screen name="Settings" component={BudgetScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
}

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MoreScreen({ navigation }: any) {
  const items = [
    { label: 'Transaction History', icon: 'list', screen: 'History' },
    { label: 'Net Worth Tracker', icon: 'trending-up', screen: 'NetWorth' },
    { label: 'Cloud Backup', icon: 'cloud-upload', screen: 'Account' },
    { label: 'Settings & Budget', icon: 'settings', screen: 'Settings' },
  ];
  return (
    <SafeAreaView style={moreStyles.container}>
      <Text style={moreStyles.title}>More</Text>
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
  container: { flex: 1, backgroundColor: '#F0F2FF', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginBottom: 20, marginTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 18, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
});

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainTabs />
    </NavigationContainer>
  );
}
