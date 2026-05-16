import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getTransactions, getBudget } from '../services/storage';
import {
  getSpendingByDay, getCategoryBreakdown, getMonthComparison,
  detectAnomalies, getSavingsForecast,
} from '../services/analytics';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const COLORS = {
  primary: '#6C63FF',
  income: '#4CAF50',
  expense: '#F44336',
  bg: '#F0F2FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6B7280',
};

const PIE_COLORS = ['#6C63FF', '#FF6584', '#43BCCD', '#F9C74F', '#90BE6D', '#F8961E', '#277DA1'];

const RANGE_OPTIONS = [7, 30, 90];

export default function AnalyticsScreen() {
  const [range, setRange] = useState(30);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [categories, setCategories] = useState<[string, number][]>([]);
  const [comparison, setComparison] = useState<Record<string, { this: number; last: number; diff: number }>>({});
  const [anomalies, setAnomalies] = useState<{ category: string; amount: number; avg: number; multiplier: number }[]>([]);
  const [forecast, setForecast] = useState<{ avgMonthlySavings: number; currentSavings: number; monthsNeeded: number } | null>(null);

  const load = async (r: number) => {
    const [txs, budget] = await Promise.all([getTransactions(), getBudget()]);
    setChartData(getSpendingByDay(txs, r));
    setCategories(getCategoryBreakdown(txs));
    setComparison(getMonthComparison(txs));
    setAnomalies(detectAnomalies(txs));
    setForecast(getSavingsForecast(txs, budget.savingsGoal));
  };

  useFocusEffect(useCallback(() => { load(range); }, [range]));

  const totalByCategory = categories.reduce((s, [, v]) => s + v, 0);

  const hasChartData = chartData.data.some(v => v > 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics</Text>

      {anomalies.length > 0 && (
        <View style={styles.anomalyCard}>
          <Text style={styles.anomalyTitle}>Spending Alerts</Text>
          {anomalies.map(a => (
            <Text key={a.category} style={styles.anomalyText}>
              {a.category} spending is {a.multiplier}x your usual — ${a.amount.toFixed(0)} vs avg ${a.avg.toFixed(0)}. Everything okay?
            </Text>
          ))}
        </View>
      )}

      {forecast && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Forecast</Text>
          <Text style={styles.forecastMain}>
            {forecast.monthsNeeded === 0
              ? "You've already hit your savings goal this month!"
              : `At your current rate, you'll hit your savings goal in ~${forecast.monthsNeeded} month${forecast.monthsNeeded > 1 ? 's' : ''}.`}
          </Text>
          <Text style={styles.forecastSub}>
            Avg monthly savings: ${forecast.avgMonthlySavings.toFixed(0)} | This month: ${forecast.currentSavings.toFixed(0)}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending Trend</Text>
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}d</Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasChartData ? (
          <LineChart
            data={{
              labels: chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 6) === 0),
              datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={false}
          />
        ) : (
          <Text style={styles.noData}>No expense data for this period.</Text>
        )}
      </View>

      {categories.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category Breakdown</Text>
          {categories.map(([cat, amt], i) => {
            const pct = totalByCategory > 0 ? (amt / totalByCategory) * 100 : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                <Text style={styles.catName}>{cat}</Text>
                <View style={styles.catBarWrap}>
                  <View style={[styles.catBar, { width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                </View>
                <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                <Text style={styles.catAmt}>${amt.toFixed(0)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {Object.keys(comparison).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>vs Last Month</Text>
          {Object.entries(comparison).map(([cat, data]) => (
            <View key={cat} style={styles.compRow}>
              <Text style={styles.compCat}>{cat}</Text>
              <Text style={styles.compThis}>${data.this.toFixed(0)}</Text>
              {data.last > 0 && (
                <View style={[styles.compBadge, { backgroundColor: data.diff > 0 ? '#FFEBEE' : '#E8F5E9' }]}>
                  <Text style={[styles.compDiff, { color: data.diff > 0 ? COLORS.expense : COLORS.income }]}>
                    {data.diff > 0 ? '+' : ''}{data.diff.toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
  labelColor: () => '#6B7280',
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#6C63FF' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginTop: 16, marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  anomalyCard: {
    backgroundColor: '#FFF3E0', borderRadius: 16, padding: 20, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#FF9800',
  },
  anomalyTitle: { fontSize: 15, fontWeight: '700', color: '#E65100', marginBottom: 8 },
  anomalyText: { fontSize: 13, color: '#BF360C', lineHeight: 20, marginBottom: 4 },
  forecastMain: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', lineHeight: 22 },
  forecastSub: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  rangeRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  rangeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F2FF' },
  rangeBtnActive: { backgroundColor: '#6C63FF' },
  rangeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  rangeBtnTextActive: { color: '#fff' },
  chart: { borderRadius: 12, marginLeft: -16 },
  noData: { textAlign: 'center', color: '#6B7280', paddingVertical: 30 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { width: 90, fontSize: 13, color: '#1A1A2E', fontWeight: '600' },
  catBarWrap: { flex: 1, height: 8, backgroundColor: '#F0F2FF', borderRadius: 4, overflow: 'hidden' },
  catBar: { height: '100%', borderRadius: 4 },
  catPct: { width: 34, fontSize: 12, color: '#6B7280', textAlign: 'right' },
  catAmt: { width: 50, fontSize: 12, fontWeight: '700', color: '#1A1A2E', textAlign: 'right' },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  compCat: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '600' },
  compThis: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginRight: 8 },
  compBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  compDiff: { fontSize: 12, fontWeight: '700' },
});
