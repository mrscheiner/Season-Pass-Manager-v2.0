import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pencil, Plus, Trash2 } from "lucide-react-native";
import { useMemo, useCallback, useState } from "react";

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import AppFooter from "@/components/AppFooter";

export default function EventsScreen() {
  const { miscEvents, addMiscEvent, updateMiscEvent, removeMiscEvent } = useSeasonPass();

  const events = useMemo(() => miscEvents || [], [miscEvents]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [paidText, setPaidText] = useState('');
  const [soldText, setSoldText] = useState('');
  const [isSold, setIsSold] = useState(false);

  const summary = useMemo(() => {
    let totalPaid = 0;
    let totalSold = 0;

    events.forEach(event => {
      totalPaid += event.paid;
      if (event.sold != null) {
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
            await removeMiscEvent(eventId);
          },
        },
      ]
    );
  }, [removeMiscEvent]);

  const resetAddForm = useCallback(() => {
    setEditingEventId(null);
    setEventName('');
    setEventDate('');
    setPaidText('');
    setSoldText('');
    setIsSold(false);
  }, []);

  const handleOpenAdd = useCallback(() => {
    resetAddForm();
    setIsAddModalOpen(true);
  }, [resetAddForm]);

  const handleOpenEdit = useCallback((eventId: string) => {
    const existing = events.find((ev) => ev.id === eventId);
    if (!existing) return;
    setEditingEventId(existing.id);
    setEventName(existing.name ?? '');
    setEventDate(existing.date ?? '');
    setPaidText(String(existing.paid ?? 0));
    const hasSold = existing.sold != null;
    setIsSold(hasSold);
    setSoldText(hasSold ? String(existing.sold ?? 0) : '');
    setIsAddModalOpen(true);
  }, [events]);

  const handleCreateOrUpdate = useCallback(async () => {
    const name = eventName.trim();
    const date = eventDate.trim();
    const paid = Number.parseFloat(paidText.trim() || '0');
    const sold = isSold ? Number.parseFloat(soldText.trim() || '0') : null;

    if (!name) {
      Alert.alert('Missing name', 'Please enter an event name.');
      return;
    }
    if (!date) {
      Alert.alert('Missing date', 'Please enter an event date.');
      return;
    }
    if (!Number.isFinite(paid) || paid < 0) {
      Alert.alert('Invalid paid amount', 'Paid must be a valid number (0 or higher).');
      return;
    }
    if (isSold && (!Number.isFinite(sold as number) || (sold as number) < 0)) {
      Alert.alert('Invalid sold amount', 'Sold must be a valid number (0 or higher).');
      return;
    }

    if (editingEventId) {
      await updateMiscEvent(editingEventId, {
        name,
        date,
        paid,
        sold,
        status: sold != null ? 'Sold' : 'Pending',
      });
    } else {
      await addMiscEvent({
        id: `misc_evt_${Date.now()}`,
        name,
        date,
        paid,
        sold,
        status: sold != null ? 'Sold' : 'Pending',
      });
    }

    setIsAddModalOpen(false);
    resetAddForm();
  }, [addMiscEvent, updateMiscEvent, editingEventId, eventName, eventDate, paidText, soldText, isSold, resetAddForm]);
  const teamPrimaryColor = AppColors.primary;

  return (
    <View style={[styles.wrapper, { backgroundColor: teamPrimaryColor }]}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: teamPrimaryColor }]}>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>Track your event tickets</Text>
            <Text style={styles.headerNote}>Separate from Season Pass Analytics</Text>
          </View>

          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Cost</Text>
              <Text style={[styles.summaryValue, { color: AppColors.accent }]}>${summary.totalPaid.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={[styles.summaryValue, { color: AppColors.success }]}>${summary.totalSold.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryValue, { color: summary.profitLoss >= 0 ? AppColors.success : AppColors.accent }]}>
                ${summary.profitLoss.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={styles.eventsTitle}>All Events ({events.length})</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: teamPrimaryColor }]}
                onPress={handleOpenAdd}
              >
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
                    <View style={styles.eventActions}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handleOpenEdit(event.id)}
                      >
                        <Pencil size={18} color={AppColors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handleDeleteEvent(event.id, event.name)}
                      >
                        <Trash2 size={20} color={AppColors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Cost:</Text>
                      <Text style={styles.eventDetailValue}>${event.paid.toFixed(2)}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Revenue:</Text>
                      <Text style={styles.eventDetailValue}>{event.sold != null ? `$${event.sold.toFixed(2)}` : 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: event.status === 'Sold' ? AppColors.success : AppColors.accent }]}>
                    <Text style={styles.statusText}>{event.status}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Modal
            visible={isAddModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsAddModalOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalWrapper}
              >
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>{editingEventId ? 'Edit Event' : 'Add Event'}</Text>

                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="Concert / Single Game / etc"
                    placeholderTextColor={AppColors.textLight}
                  />

                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={eventDate}
                    onChangeText={setEventDate}
                    placeholder="YYYY-MM-DD or any note"
                    placeholderTextColor={AppColors.textLight}
                  />

                  <Text style={styles.inputLabel}>Paid</Text>
                  <TextInput
                    style={styles.input}
                    value={paidText}
                    onChangeText={setPaidText}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={AppColors.textLight}
                  />

                  <View style={styles.soldRow}>
                    <Text style={styles.inputLabel}>Sold?</Text>
                    <TouchableOpacity
                      onPress={() => setIsSold((v) => !v)}
                      style={[styles.togglePill, { backgroundColor: isSold ? AppColors.success : AppColors.gray }]}
                    >
                      <Text style={[styles.togglePillText, { color: isSold ? AppColors.white : AppColors.textSecondary }]}>
                        {isSold ? 'Yes' : 'No'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isSold ? (
                    <>
                      <Text style={styles.inputLabel}>Sold Amount</Text>
                      <TextInput
                        style={styles.input}
                        value={soldText}
                        onChangeText={setSoldText}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={AppColors.textLight}
                      />
                    </>
                  ) : null}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={() => {
                        setIsAddModalOpen(false);
                        resetAddForm();
                      }}
                    >
                      <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: teamPrimaryColor }]}
                        onPress={handleCreateOrUpdate}
                    >
                        <Text style={styles.modalButtonPrimaryText}>{editingEventId ? 'Save' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>

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
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: AppColors.gold,
  },
  headerNote: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.white,
    opacity: 0.9,
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
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.white,
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 9,
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
    fontSize: 10,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
  },
  deleteButton: {
    padding: 4,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconButton: {
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
    fontSize: 9,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 14,
  },
  modalTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.gray,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 10,
    color: AppColors.textPrimary,
    marginBottom: 10,
  },
  soldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  togglePillText: {
    fontSize: 9,
    fontWeight: '800' as const,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: AppColors.gray,
  },
  modalButtonSecondaryText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: AppColors.textPrimary,
  },
  modalButtonPrimaryText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: AppColors.white,
  },
});
