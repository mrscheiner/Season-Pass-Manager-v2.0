import { useMemo, useState, useCallback } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Keyboard, InputAccessoryView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Pencil, Plus, Trash2, Save, X } from "lucide-react-native";

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import { parseSeatsCount } from "@/lib/seats";
import type { SeatPair } from "@/constants/types";

type EditMode =
  | { kind: "none" }
  | { kind: "edit"; pair: SeatPair }
  | { kind: "add" };

export default function EditPassScreen() {
  const router = useRouter();

  const {
    activeSeasonPass,
    activeSeasonPassId,
    addSeatPair,
    removeSeatPair,
    updateSeatPair,
  } = useSeasonPass();

  const [editMode, setEditMode] = useState<EditMode>({ kind: "none" });
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seats, setSeats] = useState("");
  const [seasonCost, setSeasonCost] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const costAccessoryId = Platform.OS === "ios" ? "editPass.costAccessory" : undefined;

  const handleSeasonCostChange = useCallback((text: string) => {
    let cleaned = text.replace(/,/g, ".").replace(/[^0-9.]/g, "");

    // Collapse exact repeated input (e.g. "5000" -> "50005000"), including decimals.
    if (cleaned.length >= 6 && cleaned.length % 2 === 0) {
      const half = cleaned.length / 2;
      if (cleaned.slice(0, half) === cleaned.slice(half)) {
        cleaned = cleaned.slice(0, half);
      }
    }

    const firstDot = cleaned.indexOf(".");
    const normalized = firstDot >= 0
      ? cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "")
      : cleaned;

    setSeasonCost(prev => {
      const seatCount = parseSeatsCount(seats);
      if (seatCount === 2 && prev && normalized) {
        const prevNum = Number(prev);
        const nextNum = Number(normalized);
        if (Number.isFinite(prevNum) && Number.isFinite(nextNum) && Math.abs(prevNum - nextNum * 2) < 0.005) {
          return prev;
        }
      }

      if (prev === normalized) return prev;
      return normalized;
    });
  }, [seats]);

  const sortedPairs = useMemo(() => {
    const pairs = activeSeasonPass?.seatPairs || [];
    return [...pairs].sort((a, b) => {
      const aKey = `${a.section}`.localeCompare(`${b.section}`);
      if (aKey !== 0) return aKey;
      const rKey = `${a.row}`.localeCompare(`${b.row}`);
      if (rKey !== 0) return rKey;
      return `${a.seats}`.localeCompare(`${b.seats}`);
    });
  }, [activeSeasonPass?.seatPairs]);

  const openEdit = useCallback((pair: SeatPair) => {
    setSection(pair.section ?? "");
    setRow(pair.row ?? "");
    setSeats(pair.seats ?? "");
    setSeasonCost(Number.isFinite(pair.seasonCost) ? String(pair.seasonCost) : "");
    setEditMode({ kind: "edit", pair });
  }, []);

  const openAdd = useCallback(() => {
    setSection("");
    setRow("");
    setSeats("");
    setSeasonCost("");
    setEditMode({ kind: "add" });
  }, []);

  const closeModal = useCallback(() => {
    if (isSaving) return;
    setEditMode({ kind: "none" });
  }, [isSaving]);

  const handleSave = useCallback(async () => {
    if (!activeSeasonPassId) {
      Alert.alert("No active pass", "Select a season pass first.");
      return;
    }

    const nextSection = section.trim();
    const nextRow = row.trim();
    const nextSeats = seats.trim();

    if (!nextSection || !nextRow || !nextSeats) {
      Alert.alert("Missing info", "Section, row, and seats are required.");
      return;
    }

    const parsedCost = seasonCost.trim() ? Number(seasonCost) : 0;
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      Alert.alert("Invalid cost", "Price paid must be a non-negative number.");
      return;
    }

    const seatCount = parseSeatsCount(nextSeats);
    if (seatCount <= 0) {
      Alert.alert(
        "Seat format looks off",
        "Could not parse seat count from your entry. Example formats: \"24-25\", \"24\", \"24,25\"."
      );
      return;
    }

    setIsSaving(true);
    try {
      if (editMode.kind === "add") {
        const newPair: SeatPair = {
          id: `seat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          section: nextSection,
          row: nextRow,
          seats: nextSeats,
          seasonCost: parsedCost,
        };
        await addSeatPair(activeSeasonPassId, newPair);
      } else if (editMode.kind === "edit") {
        const res = await updateSeatPair(activeSeasonPassId, editMode.pair.id, {
          section: nextSection,
          row: nextRow,
          seats: nextSeats,
          seasonCost: parsedCost,
        });
        if (!res.success) {
          Alert.alert("Save failed", res.error || "Could not update seat entry.");
          return;
        }
      }

      setEditMode({ kind: "none" });
    } catch (e) {
      console.error("[EditPass] Save failed", e);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }, [activeSeasonPassId, addSeatPair, editMode, row, seats, section, seasonCost, updateSeatPair]);

  const handleDelete = useCallback(
    (pair: SeatPair) => {
      if (!activeSeasonPassId) return;
      Alert.alert(
        "Remove seat entry",
        `Remove Sec ${pair.section} • Row ${pair.row} • Seats ${pair.seats}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeSeatPair(activeSeasonPassId, pair.id);
              } catch (e) {
                console.error("[EditPass] removeSeatPair failed", e);
                Alert.alert("Error", "Failed to remove seat entry.");
              }
            },
          },
        ]
      );
    },
    [activeSeasonPassId, removeSeatPair]
  );

  if (!activeSeasonPass) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={AppColors.white} />
            <Text style={styles.headerBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Season Pass</Text>
          <View style={{ width: 64 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.emptyTitle}>No active season pass</Text>
          <Text style={styles.emptyDesc}>Go to Settings and select/create a pass first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={AppColors.white} />
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Season Pass</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.passTitle}>{activeSeasonPass.teamName}</Text>
          <Text style={styles.passSubtitle}>{activeSeasonPass.seasonLabel}</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Seats</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openAdd}>
            <Plus size={18} color={AppColors.white} />
            <Text style={styles.primaryBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {sortedPairs.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>No seats configured</Text>
            <Text style={styles.emptyDesc}>Add your seats so sales and totals calculate correctly.</Text>
          </View>
        ) : (
          sortedPairs.map(pair => {
            const count = parseSeatsCount(pair.seats);
            return (
              <View key={pair.id} style={styles.seatCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.seatLine}>
                    Sec {pair.section} • Row {pair.row} • Seats {pair.seats}
                  </Text>
                  <Text style={styles.seatMeta}>
                    {count} seat{count === 1 ? "" : "s"} • Price paid: ${Number(pair.seasonCost || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.seatActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(pair)}>
                    <Pencil size={18} color={AppColors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(pair)}>
                    <Trash2 size={18} color={AppColors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={editMode.kind !== "none"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            style={{ width: "100%" }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editMode.kind === "add" ? "Add Seats" : "Edit Seats"}</Text>
                <TouchableOpacity onPress={closeModal} disabled={isSaving}>
                  <X size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              >
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Section</Text>
                    <TextInput
                      style={styles.input}
                      value={section}
                      onChangeText={setSection}
                      placeholder="308"
                      placeholderTextColor={AppColors.textLight}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Row</Text>
                    <TextInput
                      style={styles.input}
                      value={row}
                      onChangeText={setRow}
                      placeholder="8"
                      placeholderTextColor={AppColors.textLight}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Seats</Text>
                    <TextInput
                      style={styles.input}
                      value={seats}
                      onChangeText={setSeats}
                      placeholder="24-25"
                      placeholderTextColor={AppColors.textLight}
                    />
                    {!!seats.trim() && (
                      <Text style={styles.hintText}>
                        Parsed: {parseSeatsCount(seats.trim())} seat{parseSeatsCount(seats.trim()) === 1 ? "" : "s"}
                      </Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price Paid</Text>
                    <TextInput
                      style={styles.input}
                      value={seasonCost}
                      onChangeText={handleSeasonCostChange}
                      placeholder="5000"
                      placeholderTextColor={AppColors.textLight}
                      keyboardType="decimal-pad"
                      autoCorrect={false}
                      spellCheck={false}
                      inputAccessoryViewID={costAccessoryId}
                    />
                    <Text style={styles.hintText}>Total season cost for this seat entry</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={closeModal} disabled={isSaving}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Save size={18} color={AppColors.white} />
                  <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {Platform.OS === "ios" && costAccessoryId && (
              <InputAccessoryView nativeID={costAccessoryId}>
                <View style={styles.inputAccessory}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtnText: { color: AppColors.white, fontSize: 16, fontWeight: "600" },
  headerTitle: { color: AppColors.white, fontSize: 18, fontWeight: "700" },

  inputAccessory: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
  },
  doneButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  passTitle: { fontSize: 18, fontWeight: "800", color: AppColors.textPrimary },
  passSubtitle: { marginTop: 4, fontSize: 14, color: AppColors.textSecondary },

  sectionRow: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: AppColors.textPrimary },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: AppColors.white, fontWeight: "700" },

  seatCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  seatLine: { fontSize: 15, fontWeight: "700", color: AppColors.textPrimary },
  seatMeta: { marginTop: 4, fontSize: 13, color: AppColors.textSecondary },
  seatActions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: { fontSize: 16, fontWeight: "800", color: AppColors.textPrimary },
  emptyDesc: { marginTop: 6, fontSize: 13, color: AppColors.textSecondary, lineHeight: 18 },
  content: { flex: 1, padding: 16 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: AppColors.white,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: AppColors.textPrimary },

  inputRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E6E9F0",
    backgroundColor: "#FAFBFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  hintText: { marginTop: 6, fontSize: 12, color: AppColors.textLight },

  modalFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#EEF1F7" },
  secondaryBtnText: { color: AppColors.textSecondary, fontWeight: "800" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: AppColors.white, fontWeight: "900" },
});
