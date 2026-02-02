import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Trash2 } from "lucide-react-native";
import { useMemo, useCallback } from "react";

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import AppFooter from "@/components/AppFooter";

export default function EventsScreen() {
  const { activeSeasonPass, activeSeasonPassId, removeEvent } = useSeasonPass();

  const events = useMemo(() => activeSeasonPass?.events || [], [activeSeasonPass?.events]);

  const summary = useMemo(() => {
    let totalPaid = 0;
    let totalSold = 0;

    events.forEach(event => {
      totalPaid += event.paid;
      if (event.sold) {
        totalSold += event.sold;
      }
    });

    return {
      totalPaid,
      totalSold,
      profitLoss: totalSold - totalPaid,
    };
  }, [events]);

  const handleDeleteEvent = useCallback((eventId: string, eventName: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (activeSeasonPassId) {
              await removeEvent(activeSeasonPassId, eventId);
            }
          },
        },
      ]
    );
  }, [activeSeasonPassId, removeEvent]);

  const teamPrimaryColor = activeSeasonPass?.teamPrimaryColor || AppColors.primary;

  return (
    <View style={[styles.wrapper, { backgroundColor: teamPrimaryColor }]}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: teamPrimaryColor }]}>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>Track your event tickets</Text>
          </View>

          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: AppColors.accent }]}>${summary.totalPaid.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Sold</Text>
              <Text style={[styles.summaryValue, { color: AppColors.success }]}>${summary.totalSold.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Profit/Loss</Text>
              <Text style={[styles.summaryValue, { color: summary.profitLoss >= 0 ? AppColors.success : AppColors.accent }]}>
                ${summary.profitLoss.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={styles.eventsTitle}>All Events ({events.length})</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: teamPrimaryColor }]}>
                <Plus size={20} color={AppColors.white} />
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No events yet</Text>
                <Text style={styles.emptySubtext}>Add events like concerts, shows, or other tickets</Text>
              </View>
            ) : (
              events.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvent(event.id, event.name)}
                    >
                      <Trash2 size={20} color={AppColors.accent} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Paid:</Text>
                      <Text style={styles.eventDetailValue}>${event.paid.toFixed(2)}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Sold:</Text>
                      <Text style={styles.eventDetailValue}>{event.sold ? `$${event.sold.toFixed(2)}` : 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: event.status === 'Sold' ? AppColors.success : AppColors.accent }]}>
                    <Text style={styles.statusText}>{event.status}</Text>
                  </View>
                </View>
              ))
            )}
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
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: AppColors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: AppColors.gold,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: -16,
    gap: 7,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 8,
    color: AppColors.textSecondary,
    marginBottom: 3,
    fontWeight: '600' as const,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  eventsSection: {
    padding: 12,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  addButton: {
    backgroundColor: AppColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: AppColors.white,
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  deleteButton: {
    padding: 4,
  },
  eventDate: {
    fontSize: 10,
    color: AppColors.textLight,
    marginBottom: 10,
    fontWeight: '500' as const,
  },
  eventDetails: {
    gap: 7,
    marginBottom: 10,
  },
  eventDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventDetailLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
  eventDetailValue: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  statusBadge: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: AppColors.white,
  },
});
