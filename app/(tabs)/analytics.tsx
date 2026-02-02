import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DollarSign, Calendar, Percent, TrendingUp, Clock } from "lucide-react-native";
import { useMemo } from "react";

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import AppFooter from "@/components/AppFooter";

export default function AnalyticsScreen() {
  const { activeSeasonPass, calculateStats } = useSeasonPass();

  const monthlyRevenue = useMemo(() => {
    const monthOrder = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const monthMap: Record<string, number> = {};
    monthOrder.forEach(m => { monthMap[m] = 0; });

    if (!activeSeasonPass) {
      return monthOrder.map(month => ({ month, revenue: 0 }));
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    Object.values(activeSeasonPass.salesData).forEach(gameSales => {
      Object.values(gameSales).forEach(sale => {
        if (sale.soldDate && typeof sale.price === 'number') {
          const soldDate = new Date(sale.soldDate);
          const monthKey = monthNames[soldDate.getMonth()];
          if (monthMap[monthKey] !== undefined) {
            monthMap[monthKey] += sale.price;
          }
        }
      });
    });

    return monthOrder.map(month => ({ month, revenue: monthMap[month] }));
  }, [activeSeasonPass]);

  const seatPairPerformance = useMemo(() => {
    if (!activeSeasonPass) return [];

    return activeSeasonPass.seatPairs.map(pair => {
      let revenue = 0;
      let soldCount = 0; // games sold
      let soldSeats = 0; // seats sold across games

      Object.values(activeSeasonPass.salesData).forEach(gameSales => {
        const sale = gameSales[pair.id];
        if (sale && typeof sale.price === 'number') {
          revenue += sale.price;
          soldCount += 1;
          const sc = typeof sale.seatCount === 'number' ? sale.seatCount : (sale?.seats ? parseInt(String(sale.seats).split(/[^0-9]+/).filter(Boolean)[0] || '1', 10) : 1);
          soldSeats += sc || 0;
        }
      });

      const balance = revenue - pair.seasonCost;

      return {
        id: pair.id,
        section: pair.section,
        row: pair.row,
        seats: pair.seats,
        seasonCost: pair.seasonCost,
        revenue,
        soldCount,
        soldSeats,
        balance,
      };
    });
  }, [activeSeasonPass]);

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
  const teamPrimaryColor = activeSeasonPass?.teamPrimaryColor || AppColors.primary;

  return (
    <View style={[styles.wrapper, { backgroundColor: teamPrimaryColor }]}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Season Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <DollarSign size={20} color={AppColors.accent} />
              <Text style={styles.overviewValue}>${calculateStats.totalRevenue.toFixed(2)}</Text>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
            </View>
            <View style={styles.overviewStat}>
              <Calendar size={20} color={teamPrimaryColor} />
              <Text style={styles.overviewValue}>{calculateStats.ticketsSold}</Text>
              <Text style={styles.overviewLabel}>Seats Sold</Text>
            </View>
            <View style={styles.overviewStat}>
              <Percent size={20} color={AppColors.gold} />
              <Text style={styles.overviewValue}>{calculateStats.soldRate.toFixed(0)}%</Text>
              <Text style={styles.overviewLabel}>Sold Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <View style={styles.chart}>
            <View style={styles.chartBars}>
              {monthlyRevenue.map((item, index) => {
                const height = item.revenue > 0 ? (item.revenue / maxRevenue) * 200 : 4;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      {item.revenue > 0 && (
                        <Text
                          style={[styles.barValue, { bottom: height + 6 }]}
                          numberOfLines={1}
                          ellipsizeMode="clip"
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          ${item.revenue.toFixed(0)}
                        </Text>
                      )}
                      <View 
                        style={[
                          styles.bar, 
                          { height, backgroundColor: item.revenue > 0 ? teamPrimaryColor : AppColors.border },
                        ]} 
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {seatPairPerformance.length > 0 && (
          <View style={styles.trackingCard}>
            <Text style={styles.sectionTitle}>Seat Pair Performance</Text>
            {seatPairPerformance.map(pair => (
              <View key={pair.id} style={styles.seatPairSection}>
                <Text style={[styles.seatInfo, { color: teamPrimaryColor }]}>
                  Section {pair.section}, Row {pair.row}, Seats {pair.seats}
                </Text>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Season Cost:</Text>
                  <Text style={styles.trackingValue}>${pair.seasonCost.toLocaleString()}</Text>
                </View>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Revenue:</Text>
                  <Text style={styles.trackingValue}>${pair.revenue.toFixed(2)}</Text>
                </View>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Games Sold:</Text>
                  <Text style={styles.trackingValue}>{pair.soldCount} sold</Text>
                </View>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Seats Sold:</Text>
                  <Text style={styles.trackingValue}>{pair.soldSeats}</Text>
                </View>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Balance:</Text>
                  <Text style={[
                    styles.trackingValue, 
                    { color: pair.balance >= 0 ? AppColors.success : AppColors.accent }
                  ]}>
                    ${pair.balance.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Total Season Cost:</Text>
              <Text style={styles.trackingValue}>${calculateStats.totalSeasonCost.toLocaleString()}</Text>
            </View>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Seat Sales to Date:</Text>
              <Text style={styles.trackingValue}>${calculateStats.totalRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Net Profit/Loss:</Text>
              <Text style={[
                styles.trackingValue, 
                { color: calculateStats.totalRevenue - calculateStats.totalSeasonCost >= 0 ? AppColors.success : AppColors.accent }
              ]}>
                ${(calculateStats.totalRevenue - calculateStats.totalSeasonCost).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <TrendingUp size={20} color={teamPrimaryColor} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average Price Per Seat</Text>
              <Text style={styles.insightValue}>${calculateStats.avgPrice.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Clock size={20} color={AppColors.accent} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Pending Payments</Text>
              <Text style={styles.insightValue}>
                {calculateStats.pendingPayments} {calculateStats.pendingPayments === 1 ? 'payment' : 'payments'} awaiting
              </Text>
            </View>
          </View>
        </View>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  overviewCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
    marginBottom: 10,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
    gap: 8,
  },
  overviewValue: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  overviewLabel: {
    fontSize: 8,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
  chartCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 280,
    paddingTop: 18,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barValue: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  barWrapper: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 200,
    overflow: 'visible',
  },
  bar: {
    width: 30,
    backgroundColor: AppColors.accent,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 8,
    fontWeight: '500' as const,
  },
  trackingCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seatPairSection: {
    marginBottom: 12,
  },
  seatInfo: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.primary,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 12,
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackingLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
  trackingValue: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  insightsCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 3,
  },
  insightValue: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
});
