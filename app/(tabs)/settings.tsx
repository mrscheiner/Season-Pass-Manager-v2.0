import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Switch, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
<<<<<<< HEAD
import { FileText, Shield, Mail, Folder, Trash2, Plus, Users, RefreshCw, Download, Table, RotateCcw, Upload } from "lucide-react-native";
=======
import { FileText, Shield, Mail, Folder, Trash2, Plus, Users, RefreshCw, Download, Table, RotateCcw, CheckCircle, AlertCircle } from "lucide-react-native";
>>>>>>> 16dba40aa7b887e26e4a9827e6997c52804727ca
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import { APP_VERSION } from "@/constants/appVersion";
import { Image } from 'expo-image';

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    seasonPasses, 
    activeSeasonPass, 
    clearAllData, 
    deleteSeasonPass, 
    activeSeasonPassId, 
    resyncSchedule, 
  debugFetchLogosFromEspnForPass,
    isLoadingSchedule,
    lastScheduleError,
    createRecoveryCode,
    restoreFromRecoveryCode,
  exportAsExcel,
  exportAsCSV,
    emailBackup,
  prepareBackupPackage,
    restoreAllSeasonPassData,
<<<<<<< HEAD
    // force-replace (overwrite) restore
    restoreAllSeasonPassDataReplace,
    importSchedule,
=======
    forceReplacePanthersSales,
    replaceSalesDataFromPastedSeed,
    lastBackupTime,
    lastBackupStatus,
    backupError,
    backupConfirmationMessage,
    retryBackup,
>>>>>>> 16dba40aa7b887e26e4a9827e6997c52804727ca
  } = useSeasonPass();
  
  const [isResyncing, setIsResyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestoringPanthers, setIsRestoringPanthers] = useState(false);
  const [isForceRestoring, setIsForceRestoring] = useState(false);
  const [includeLogos, setIncludeLogos] = useState(false);
  const [isRetryingBackup, setIsRetryingBackup] = useState(false);
  const [isForceReplacing, setIsForceReplacing] = useState(false);
  const [showReplaceSalesModal, setShowReplaceSalesModal] = useState(false);
  const [replaceSalesInput, setReplaceSalesInput] = useState('');
  const [isReplacingSales, setIsReplacingSales] = useState(false);

  const handleAddSeasonPass = useCallback(() => {
    router.push('/setup');
  }, [router]);

  const handleResyncSchedule = useCallback(async () => {
    console.log('[Settings] handleResyncSchedule called');
    console.log('[Settings] activeSeasonPassId:', activeSeasonPassId);
    console.log('[Settings] activeSeasonPass:', activeSeasonPass?.teamName, activeSeasonPass?.leagueId);
    console.log('[Settings] isResyncing:', isResyncing, 'isLoadingSchedule:', isLoadingSchedule);
    
    if (!activeSeasonPassId || isResyncing) {
      console.log('[Settings] Resync blocked - missing passId or already resyncing');
      return;
    }

    Alert.alert(
      'Resync Schedule',
      `This will fetch the latest HOME games from ESPN for ${activeSeasonPass?.teamName}. Your sales data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resync',
          onPress: async () => {
            console.log('[Settings] Resync confirmed - starting...');
            console.log('[Settings] Target passId:', activeSeasonPassId);
            setIsResyncing(true);
            
            const timeoutPromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
              setTimeout(() => {
                console.log('[Settings] ⚠️ Resync HARD TIMEOUT after 30s');
                resolve({ success: false, error: 'Request timed out. Please try again.' });
              }, 30000);
            });
            
            try {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch (hapticError) {
                console.log('[Settings] Haptic error (ignored):', hapticError);
              }
              
              const result = await Promise.race([
                resyncSchedule(activeSeasonPassId),
                timeoutPromise,
              ]);
              
              console.log('[Settings] Resync result:', result);
              
              if (result.success) {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch { /* ignore */ }
                Alert.alert('Success', 'Schedule has been updated with the latest HOME games.');
              } else {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                } catch { /* ignore */ }
                Alert.alert(
                  'Schedule Unavailable', 
                  result.error || 'Could not fetch schedule from ESPN. Please try again later.'
                );
              }
            } catch (error) {
              console.error('[Settings] Resync error:', error);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              } catch { /* ignore */ }
              Alert.alert('Error', 'Failed to resync schedule. Please try again.');
            } finally {
              console.log('[Settings] ✅ FINALLY block - setting isResyncing=false (guaranteed)');
              setIsResyncing(false);
            }
          },
        },
      ]
    );
  }, [activeSeasonPassId, activeSeasonPass, resyncSchedule, isResyncing, isLoadingSchedule]);

  const handleFetchEspnLogos = useCallback(async () => {
    if (!activeSeasonPassId) return;
    try {
      const res: any = await debugFetchLogosFromEspnForPass(activeSeasonPassId);
      console.log('[Settings] debugFetchLogosFromEspnForPass result:', res);
      if (res && res.success) {
        const msg = res.changed ? `Updated ${res.details.length} games (logos applied where matched).` : 'No logos resolved automatically.';
        Alert.alert('ESPN Logo Debug', msg);
      } else {
        Alert.alert('ESPN Logo Debug', `Failed: ${res?.error || 'unknown'}`);
      }
    } catch (e) {
      console.error('[Settings] handleFetchEspnLogos error:', e);
      Alert.alert('Error', 'Failed to fetch logos from ESPN. Check logs.');
    }
  }, [activeSeasonPassId, debugFetchLogosFromEspnForPass]);

  const handleDeleteCurrentPass = useCallback(async () => {
    if (!activeSeasonPass || !activeSeasonPassId) return;

    // deleteSeasonPass now shows its own confirmation alert and returns
    // the updated number of passes (or null if the user cancelled).
    try {
      const updatedCount = await deleteSeasonPass(activeSeasonPassId);
      if (updatedCount !== null && updatedCount === 0) {
        router.replace('/setup');
      }
    } catch (err) {
      console.error('[Settings] deleteSeasonPass error:', err);
    }
  }, [activeSeasonPass, activeSeasonPassId, deleteSeasonPass, router]);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL season passes and their data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            router.replace('/setup');
          },
        },
      ]
    );
  }, [clearAllData, router]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const success = await exportAsCSV();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Sales data copied to clipboard as CSV.');
      } else {
        Alert.alert('Error', 'Failed to export CSV. Please try again.');
      }
    } catch (error) {
      console.error('[Settings] Export CSV error:', error);
      Alert.alert('Error', 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  }, [exportAsCSV]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const success = await exportAsExcel();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Excel file exported successfully.');
      } else {
        Alert.alert('Error', 'Failed to export Excel. Please try again.');
      }
    } catch (error) {
      console.error('[Settings] Export Excel error:', error);
      Alert.alert('Error', 'Failed to export Excel.');
    } finally {
      setIsExporting(false);
    }
  }, [exportAsExcel]);

  const handleGenerateRecoveryCode = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const code = await createRecoveryCode(includeLogos);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Recovery Code Generated',
        `Your recovery code has been copied to clipboard.\n\nCode length: ${code.length} characters\n\nSave this code somewhere safe to restore your data later.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[Settings] Generate recovery code error:', error);
      Alert.alert('Error', 'Failed to generate recovery code.');
    } finally {
      setIsExporting(false);
    }
  }, [createRecoveryCode, includeLogos]);

  const handleEmailBackup = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await emailBackup(includeLogos);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('[Settings] Email backup error:', error);
      Alert.alert('Error', 'Failed to prepare email backup.');
    } finally {
      setIsExporting(false);
    }
  }, [emailBackup, includeLogos]);

  const handleRestoreFromCode = useCallback(async () => {
    if (!recoveryCodeInput.trim()) {
      Alert.alert('Error', 'Please paste your recovery code.');
      return;
    }

    setIsRestoring(true);
    try {
      const success = await restoreFromRecoveryCode(recoveryCodeInput.trim());
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your data has been restored successfully.');
        setShowRestoreModal(false);
        setRecoveryCodeInput('');
      } else {
        Alert.alert('Error', 'Invalid recovery code. Please check and try again.');
      }
    } catch (error) {
      console.error('[Settings] Restore error:', error);
      Alert.alert('Error', 'Failed to restore from recovery code.');
    } finally {
      setIsRestoring(false);
    }
  }, [recoveryCodeInput, restoreFromRecoveryCode]);

  const handleRestoreFromFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      setIsRestoring(true);
      try {
        const content = await FileSystem.readAsStringAsync(res.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
        const success = await restoreFromRecoveryCode(content);
        if (success) {
          Alert.alert('Success', 'Backup restored from file successfully.');
        } else {
          Alert.alert('Error', 'Failed to restore from file. File may be invalid.');
        }
      } catch (err) {
        console.error('[Settings] Restore from file error:', err);
        Alert.alert('Error', 'Failed to read or restore the selected file.');
      } finally {
        setIsRestoring(false);
      }
    } catch (err) {
      console.error('[Settings] Document picker error:', err);
      Alert.alert('Error', 'Could not open file picker.');
    }
  }, [restoreFromRecoveryCode]);

  const handleRetryBackup = useCallback(async () => {
    setIsRetryingBackup(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await retryBackup();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Backup Failed', result.error || 'Could not save backup. Please try again.');
      }
    } catch (error) {
      console.error('[Settings] Retry backup error:', error);
      Alert.alert('Error', 'Failed to retry backup.');
    } finally {
      setIsRetryingBackup(false);
    }
  }, [retryBackup]);

  const handleRestoreAllData = useCallback(async () => {
    Alert.alert(
      'Restore All Season Pass Data',
      'This will restore all season passes from the last saved backup, merging any missing sales data. Your current data will be preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsRestoringPanthers(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await restoreAllSeasonPassData();
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'All season pass data has been restored successfully!');
              } else {
                Alert.alert('Error', 'Failed to restore season pass data.');
              }
            } catch (error) {
              console.error('[Settings] Restore all data error:', error);
              Alert.alert('Error', 'Failed to restore season pass data.');
            } finally {
              setIsRestoringPanthers(false);
            }
          },
        },
      ]
    );
  }, [restoreAllSeasonPassData]);

<<<<<<< HEAD
  const handleForceReplaceAllData = useCallback(async () => {
    Alert.alert(
      'Force Replace All Season Pass Data',
      'This will OVERWRITE existing season pass data with the saved backup. Existing sales data will be replaced by the backup (no merging). This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            setIsForceRestoring(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await restoreAllSeasonPassDataReplace();
              if (success) {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
                Alert.alert('Success', 'All season pass data has been force-replaced from backup.');
              } else {
                Alert.alert('Error', 'Failed to force replace season pass data.');
              }
            } catch (error) {
              console.error('[Settings] Force replace error:', error);
              Alert.alert('Error', 'Failed to force replace season pass data.');
            } finally {
              setIsForceRestoring(false);
=======
  const handleForceReplacePanthersSales = useCallback(async () => {
    Alert.alert(
      'Force Replace Panthers Sales Data',
      'This will COMPLETELY WIPE the current Florida Panthers sales data and replace it with the canonical 90-record dataset. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace All',
          style: 'destructive',
          onPress: async () => {
            setIsForceReplacing(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const result = await forceReplacePanthersSales();
              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', `Panthers sales data has been replaced with ${result.salesCount} canonical records.`);
              } else {
                Alert.alert('Error', 'Failed to replace Panthers sales data. Panthers 2025-2026 pass may not exist.');
              }
            } catch (error) {
              console.error('[Settings] Force replace Panthers sales error:', error);
              Alert.alert('Error', 'Failed to replace Panthers sales data.');
            } finally {
              setIsForceReplacing(false);
>>>>>>> 16dba40aa7b887e26e4a9827e6997c52804727ca
            }
          },
        },
      ]
    );
<<<<<<< HEAD
  }, [restoreAllSeasonPassDataReplace]);

  const handleImportSchedule = useCallback(async () => {
    if (!activeSeasonPass) {
      Alert.alert('Error', 'No active season pass selected');
      return;
    }

    setIsImporting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await importSchedule();
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.error && result.error !== 'Cancelled by user' && result.error !== 'No file selected') {
        Alert.alert('Import Error', result.error);
      }
    } catch (error: any) {
      console.error('[Settings] Import schedule error:', error);
      Alert.alert('Import Error', error.message || 'Failed to import schedule');
    } finally {
      setIsImporting(false);
    }
  }, [importSchedule, activeSeasonPass]);

  const teamPrimaryColor = activeSeasonPass?.teamPrimaryColor || AppColors.primary;

  return (
    <View style={[styles.wrapper, { backgroundColor: teamPrimaryColor }]}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
=======
  }, [forceReplacePanthersSales]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backup Status Indicator */}
        {lastBackupStatus && (
          <View style={[
            styles.backupStatusCard,
            lastBackupStatus === 'success' ? styles.backupStatusSuccess : styles.backupStatusFailed
          ]}>
            <View style={styles.backupStatusContent}>
              {lastBackupStatus === 'success' ? (
                <CheckCircle size={20} color="#2E7D32" />
              ) : (
                <AlertCircle size={20} color="#C62828" />
              )}
              <View style={styles.backupStatusText}>
                <Text style={[
                  styles.backupStatusTitle,
                  lastBackupStatus === 'success' ? styles.backupStatusTitleSuccess : styles.backupStatusTitleFailed
                ]}>
                  {lastBackupStatus === 'success' ? 'Backup saved' : 'Backup failed'}
                </Text>
                {lastBackupTime && lastBackupStatus === 'success' && (
                  <Text style={styles.backupStatusTime}>{lastBackupTime}</Text>
                )}
                {backupError && lastBackupStatus === 'failed' && (
                  <Text style={styles.backupStatusError}>{backupError}</Text>
                )}
              </View>
            </View>
            {lastBackupStatus === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryBackup}
                disabled={isRetryingBackup}
              >
                {isRetryingBackup ? (
                  <ActivityIndicator size="small" color="#C62828" />
                ) : (
                  <Text style={styles.retryButtonText}>Retry</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

>>>>>>> 16dba40aa7b887e26e4a9827e6997c52804727ca
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SEASON PASSES</Text>
          <TouchableOpacity style={styles.settingCard} onPress={handleAddSeasonPass}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Plus size={24} color="#4CAF50" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Add Season Pass</Text>
              <Text style={styles.settingDescription}>Create a new season pass for another team</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.settingCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Shield size={24} color="#7B1FA2" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Include Team Logos</Text>
              <Text style={styles.settingDescription}>Embed team & opponent logos into the backup (larger file)</Text>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Switch value={includeLogos} onValueChange={setIncludeLogos} />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Users size={24} color="#2196F3" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Active Passes: {seasonPasses.length}</Text>
              <Text style={styles.settingDescription}>
                {seasonPasses.map(p => p.teamName).join(', ') || 'None'}
              </Text>
            </View>
          </View>

          {activeSeasonPass && (
            <>
              <TouchableOpacity 
                style={[styles.settingCard, (isResyncing || isLoadingSchedule) && styles.settingCardDisabled]} 
                onPress={handleResyncSchedule}
                disabled={isResyncing || isLoadingSchedule}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                  {isResyncing || isLoadingSchedule ? (
                    <ActivityIndicator size="small" color="#FF9800" />
                  ) : (
                    <RefreshCw size={24} color="#FF9800" />
                  )}
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Resync {activeSeasonPass.teamName} Schedule</Text>
                  <Text style={styles.settingDescription}>
                    {isResyncing ? `Fetching latest ${activeSeasonPass.teamName} games...` : `Update HOME games from ESPN/Ticketmaster`}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.settingCard]} 
                onPress={handleFetchEspnLogos}
                disabled={!activeSeasonPassId}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}> 
                  <Table size={24} color="#0288D1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Attempt ESPN Logos</Text>
                  <Text style={styles.settingDescription}>Try to resolve missing opponent logos using ESPN team data</Text>
                </View>
              </TouchableOpacity>
              
              {lastScheduleError && !isResyncing && !isLoadingSchedule && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{lastScheduleError}</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
          
          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={handleExportCSV}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <FileText size={24} color="#4CAF50" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export as Excel</Text>
              <Text style={styles.settingDescription}>Download sales data as .xlsx workbook</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={handleExportExcel}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Table size={24} color="#4CAF50" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export as CSV</Text>
              <Text style={styles.settingDescription}>Copy sales data as CSV to clipboard (TSV also copied for Excel paste)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isImporting && styles.settingCardDisabled]} 
            onPress={handleImportSchedule}
            disabled={isImporting || !activeSeasonPass}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              {isImporting ? (
                <ActivityIndicator size="small" color="#FF9800" />
              ) : (
                <Upload size={24} color="#FF9800" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Import Schedule</Text>
              <Text style={styles.settingDescription}>Replace schedule with CSV/Excel file (sales data preserved)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={handleGenerateRecoveryCode}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#EF5350" />
              ) : (
                <Shield size={24} color="#EF5350" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Generate Recovery Code</Text>
              <Text style={styles.settingDescription}>Create a backup code to restore your app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard} 
            onPress={() => setShowRestoreModal(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8EAF6' }]}>
              <Download size={24} color="#5C6BC0" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Restore from Code</Text>
              <Text style={styles.settingDescription}>Restore your data using a recovery code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={handleRestoreFromFile}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8EAF6' }]}>
              <Folder size={24} color="#5C6BC0" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Restore from File</Text>
              <Text style={styles.settingDescription}>Import a full backup JSON file to restore the app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isRestoringPanthers && styles.settingCardDisabled]} 
            onPress={handleRestoreAllData}
            disabled={isRestoringPanthers}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}>
              {isRestoringPanthers ? (
                <ActivityIndicator size="small" color="#C2185B" />
              ) : (
                <RotateCcw size={24} color="#C2185B" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Restore All Season Pass Data</Text>
              <Text style={styles.settingDescription}>Recover all season passes from last backup</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
<<<<<<< HEAD
            style={[styles.settingCard, isForceRestoring && styles.settingCardDisabled]} 
            onPress={handleForceReplaceAllData}
            disabled={isForceRestoring}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}> 
              {isForceRestoring ? (
                <ActivityIndicator size="small" color="#D32F2F" />
              ) : (
                <Trash2 size={24} color="#D32F2F" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Force Replace All Season Pass Data</Text>
              <Text style={styles.settingDescription}>Overwrite local data with the last backup (destructive)</Text>
=======
            style={[styles.settingCard, isReplacingSales && styles.settingCardDisabled]} 
            onPress={() => setShowReplaceSalesModal(true)}
            disabled={isReplacingSales}
            testID="settings.replaceSales.open"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF8E1' }]}>
              {isReplacingSales ? (
                <ActivityIndicator size="small" color="#F57C00" />
              ) : (
                <Table size={24} color="#F57C00" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Replace Sales Data</Text>
              <Text style={styles.settingDescription}>Paste sales seed text (total_price, event_name, event_start_time, tickets JSON)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isForceReplacing && styles.settingCardDisabled]} 
            onPress={handleForceReplacePanthersSales}
            disabled={isForceReplacing}
            testID="settings.forceReplacePanthersSales"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF8E1' }]}>
              {isForceReplacing ? (
                <ActivityIndicator size="small" color="#F57C00" />
              ) : (
                <RefreshCw size={24} color="#F57C00" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Force Replace Panthers Sales</Text>
              <Text style={styles.settingDescription}>Wipe & replace with canonical 90-record dataset (includes $1 sale)</Text>
>>>>>>> 16dba40aa7b887e26e4a9827e6997c52804727ca
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={handleEmailBackup}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#FF9800" />
              ) : (
                <Mail size={24} color="#FF9800" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email Backup</Text>
              <Text style={styles.settingDescription}>Send complete backup with all data and code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={() => {
              // Ask where to send when exporting master files
              Alert.alert(
                'Export Master Files',
                'Choose how you want to send the master clone files',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Email', onPress: async () => { setIsExporting(true); try { await emailBackup(includeLogos); } finally { setIsExporting(false); } } },
                  { text: 'Messages', onPress: async () => { setIsExporting(true); try { const pkg = await prepareBackupPackage(includeLogos); if (pkg.success) { if (pkg.fileUri) { const messageText = `Here's the Rork Master Clone backup (${new Date().toISOString().split('T')[0]}). Import into the app: Settings → Restore from File.`; try { await Share.share({ message: messageText, url: pkg.fileUri, title: 'Season Pass Backup' } as any); } catch (shareErr) { console.warn('[Settings] Share.share failed, falling back to expo-sharing:', shareErr); try { await Sharing.shareAsync(pkg.fileUri); } catch (se) { console.error('[Settings] Fallback share failed:', se); Alert.alert('Error', 'Failed to share backup via Messages.'); } } } else if (pkg.isWeb) { Alert.alert('Downloaded', 'Files downloaded to your browser.'); } else { Alert.alert('Saved', `Backup saved to: ${pkg.folderUri || 'Documents'}`); } } else { Alert.alert('Error', 'Failed to prepare package.'); } } finally { setIsExporting(false); } } },
                  { text: 'Save to Files', onPress: async () => { setIsExporting(true); try { const pkg = await prepareBackupPackage(includeLogos); if (pkg.success) { Alert.alert('Saved', `Backup saved to: ${pkg.folderUri || 'Downloads'}`); } else { Alert.alert('Error', 'Failed to save backup.'); } } finally { setIsExporting(false); } } },
                ],
              );
            }}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <Folder size={24} color="#2196F3" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export Backup to Folder</Text>
              <Text style={styles.settingDescription}>Save backup files to any folder you choose</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>DANGER ZONE</Text>
          
          {activeSeasonPass && (
            <TouchableOpacity style={styles.dangerCard} onPress={handleDeleteCurrentPass}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Trash2 size={24} color="#D32F2F" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: AppColors.accent }]}>Delete Current Season Pass</Text>
                <Text style={styles.settingDescription}>
                  Remove {activeSeasonPass.teamName} {activeSeasonPass.seasonLabel}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.dangerCard} onPress={handleClearAllData}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Trash2 size={24} color="#D32F2F" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: AppColors.accent }]}>Clear All Data</Text>
              <Text style={styles.settingDescription}>Permanently delete all season passes and data</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Backup Confirmation Toast */}
      {backupConfirmationMessage && (
        <View style={styles.backupToast}>
          <Text style={styles.backupToastText}>{backupConfirmationMessage}</Text>
        </View>
      )}

      <View style={styles.versionContainer}>
        <Image 
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7mf3piipeptxq49889fh3' }} 
          style={styles.footerLogo} 
          contentFit="contain" 
        />
        <Text style={styles.versionLabel}>Season Pass Manager • {APP_VERSION}</Text>
      </View>

      <Modal
        visible={showReplaceSalesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReplaceSalesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Replace Sales Data</Text>
            <Text style={styles.modalDescription}>
              Paste your sales seed text below. This will REPLACE all sales records for the currently active season pass.
            </Text>
            <TextInput
              style={styles.recoveryInput}
              placeholder="Paste sales rows here..."
              placeholderTextColor="#999"
              value={replaceSalesInput}
              onChangeText={setReplaceSalesInput}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              testID="settings.replaceSales.input"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowReplaceSalesModal(false);
                  setReplaceSalesInput('');
                }}
                testID="settings.replaceSales.cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalRestoreButton, isReplacingSales && styles.buttonDisabled]}
                onPress={async () => {
                  if (isReplacingSales) return;
                  setIsReplacingSales(true);
                  try {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch { /* ignore */ }
                    const result = await replaceSalesDataFromPastedSeed(replaceSalesInput, activeSeasonPassId);
                    if (result.success) {
                      try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch { /* ignore */ }
                      Alert.alert('Success', `Replaced sales data. Inserted ${result.salesCount} sale records.`);
                      setShowReplaceSalesModal(false);
                      setReplaceSalesInput('');
                    } else {
                      try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      } catch { /* ignore */ }
                      Alert.alert('Error', result.message || 'Failed to replace sales data.');
                    }
                  } catch (e) {
                    console.error('[Settings] replaceSalesDataFromPastedSeed error:', e);
                    Alert.alert('Error', 'Replace sales failed.');
                  } finally {
                    setIsReplacingSales(false);
                  }
                }}
                disabled={isReplacingSales}
                testID="settings.replaceSales.submit"
              >
                {isReplacingSales ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalRestoreText}>Replace</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRestoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRestoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restore from Recovery Code</Text>
            <Text style={styles.modalDescription}>
              Paste your recovery code below to restore all your data. This will replace your current data.
            </Text>
            <TextInput
              style={styles.recoveryInput}
              placeholder="Paste your recovery code here..."
              placeholderTextColor="#999"
              value={recoveryCodeInput}
              onChangeText={setRecoveryCodeInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRestoreModal(false);
                  setRecoveryCodeInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalRestoreButton, isRestoring && styles.buttonDisabled]}
                onPress={handleRestoreFromCode}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalRestoreText}>Restore</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: AppColors.textLight,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  settingCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 9,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
  dangerZone: {
    marginTop: 7,
    marginBottom: 32,
  },
  dangerZoneTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: AppColors.textLight,
    marginBottom: 10,
    paddingHorizontal: 3,
  },
  dangerCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  settingCardDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    width: '94%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: AppColors.textPrimary,
    marginBottom: 7,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 16,
  },
  recoveryInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 13,
    fontSize: 9,
    color: AppColors.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  modalRestoreButton: {
    flex: 1,
    backgroundColor: '#5C6BC0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalRestoreText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  errorBannerText: {
    fontSize: 9,
    color: '#E65100',
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  versionLabel: {
    fontSize: 9,
    color: AppColors.textLight,
    textAlign: 'center',
    marginBottom: 10,
  },
  footerLogo: {
    width: 120,
    height: 72,
    marginBottom: 8,
  },
  backupStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  backupStatusSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  backupStatusFailed: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  backupStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backupStatusText: {
    flex: 1,
  },
  backupStatusTitle: {
    fontSize: 9,
    fontWeight: '600' as const,
  },
  backupStatusTitleSuccess: {
    color: '#2E7D32',
  },
  backupStatusTitleFailed: {
    color: '#C62828',
  },
  backupStatusTime: {
    fontSize: 9,
    color: '#558B2F',
    marginTop: 2,
  },
  backupStatusError: {
    fontSize: 9,
    color: '#C62828',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#FFCDD2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#C62828',
    fontSize: 9,
    fontWeight: '600' as const,
  },
  backupToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backupToastText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600' as const,
  },
});
