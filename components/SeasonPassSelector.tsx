import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown, Plus, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppColors } from '@/constants/appColors';
import { useSeasonPass } from '@/providers/SeasonPassProvider';

export default function SeasonPassSelector() {
  const router = useRouter();
  const { seasonPasses, activeSeasonPass, switchSeasonPass } = useSeasonPass();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback(async (passId: string) => {
    console.log('[Selector] Switching to pass:', passId);
    await switchSeasonPass(passId);
    setIsOpen(false);
  }, [switchSeasonPass]);

  const handleAddNew = useCallback(() => {
    setIsOpen(false);
    router.push('/setup');
  }, [router]);

  if (!activeSeasonPass) return null;

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setIsOpen(true)} activeOpacity={0.8}>
        {activeSeasonPass.teamLogoUrl ? (
          <Image 
            source={{ uri: activeSeasonPass.teamLogoUrl }} 
            style={styles.teamLogo} 
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={activeSeasonPass.teamLogoUrl}
          />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}
        <View style={styles.selectorInfo}>
          <Text style={styles.teamName} numberOfLines={1}>{activeSeasonPass.teamName}</Text>
          <Text style={styles.seasonLabel}>{activeSeasonPass.seasonLabel}</Text>
        </View>
        <ChevronDown size={20} color={AppColors.white} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Season Passes</Text>
            <ScrollView style={styles.passesList} showsVerticalScrollIndicator={false}>
              {seasonPasses.map(pass => (
                <TouchableOpacity
                  key={pass.id}
                  style={[styles.passItem, pass.id === activeSeasonPass.id && styles.passItemActive]}
                  onPress={() => handleSelect(pass.id)}
                  activeOpacity={0.7}
                >
                  {pass.teamLogoUrl ? (
                    <Image 
                      source={{ uri: pass.teamLogoUrl }} 
                      style={styles.passLogo} 
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      recyclingKey={pass.teamLogoUrl}
                    />
                  ) : (
                    <View style={[styles.passLogo, styles.logoPlaceholder]} />
                  )}
                  <View style={styles.passInfo}>
                    <Text style={styles.passTeamName}>{pass.teamName}</Text>
                    <Text style={styles.passSeason}>{pass.seasonLabel}</Text>
                  </View>
                  {pass.id === activeSeasonPass.id && (
                    <View style={styles.checkIcon}>
                      <Check size={18} color={AppColors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Plus size={20} color={AppColors.white} />
              <Text style={styles.addButtonText}>Add Season Pass</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  logoPlaceholder: {
    backgroundColor: AppColors.gray,
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  selectorInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.white,
  },
  seasonLabel: {
    fontSize: 10,
    color: AppColors.gold,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  passesList: {
    maxHeight: 300,
  },
  passItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 10,
    marginBottom: 7,
    backgroundColor: AppColors.gray,
  },
  passItemActive: {
    backgroundColor: AppColors.primary,
  },
  passLogo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  passInfo: {
    flex: 1,
  },
  passTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  passSeason: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 10,
    padding: 11,
    marginTop: 10,
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.white,
  },
});
