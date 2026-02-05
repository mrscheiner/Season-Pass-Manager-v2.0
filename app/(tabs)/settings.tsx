import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Switch, Platform, NativeModules } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Shield, Mail, Folder, Trash2, Plus, Users, RefreshCw, Download, Table, RotateCcw, CheckCircle, AlertCircle, Upload, Pencil, ChevronDown, ChevronUp } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as Clipboard from 'expo-clipboard';

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";
import { APP_VERSION } from "@/constants/appVersion";
import { USER_BOOKLET_MARKDOWN } from "@/constants/userBooklet";
import { Image } from 'expo-image';
import { resolveApiBaseUrl } from "@/lib/apiBaseUrl";

function markdownToPlainText(markdown: string): string {
  // Keep this simple and robust: the PDF generator prints text.
  // We strip the most common Markdown markers to keep output readable.
  return markdown
    .replace(/\r\n/g, '\n')
    // Remove pagebreak markers
    .replace(/<!--\s*pagebreak\s*-->/g, '')
    // Convert links: [text](url) -> text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italics markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Convert headings: ### Title -> Title
    .replace(/^\s*#{1,6}\s+/gm, '')
    // Collapse extra horizontal rules
    .replace(/^\s*---\s*$/gm, '')
    // Trim trailing spaces on lines
    .replace(/[ \t]+$/gm, '')
    // Avoid massive blank gaps
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    seasonPasses, 
    activeSeasonPass, 
    clearAllData, 
    deleteSeasonPass, 
    activeSeasonPassId, 
    resyncSchedule, 
    resyncAllSchedules,
  debugFetchLogosFromEspnForPass,
    isLoadingSchedule,
    lastScheduleError,
    restoreFromRecoveryCode,
  exportAsExcel,
  exportAsCSV,
    importSchedule,
    emailBackup,
    emailCloneKit,
  // prepareBackupPackage,
    restoreAllSeasonPassData,
    forceReplacePanthersSales,
    replaceSalesDataFromPastedSeed,
    lastBackupTime,
    lastBackupStatus,
    backupError,
    backupConfirmationMessage,
    retryBackup,

    lastUserBackupAtISO,

    cloudSyncEnabled,
    cloudSyncKey,
    cloudSyncStatus,
    cloudSyncError,
    lastCloudSyncTime,
    setCloudSyncEnabled,
    setCloudSyncKey,
    generateCloudSyncKey,
    pushCloudSyncNow,
    pullCloudSyncNow,

    cloudSyncAutoUploadEnabled,
    cloudSyncAutoDownloadEnabled,
    setCloudSyncAutoUploadEnabled,
    setCloudSyncAutoDownloadEnabled,
  } = useSeasonPass();
  
  const [isResyncing, setIsResyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestoringPanthers, setIsRestoringPanthers] = useState(false);
  // const [isForceRestoring, setIsForceRestoring] = useState(false);
  const [includeLogos, setIncludeLogos] = useState(false);
  const [isRetryingBackup, setIsRetryingBackup] = useState(false);
  const [isForceReplacing, setIsForceReplacing] = useState(false);
  const [showReplaceSalesModal, setShowReplaceSalesModal] = useState(false);
  const [replaceSalesInput, setReplaceSalesInput] = useState('');
  const [isReplacingSales, setIsReplacingSales] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInternalTools, setShowInternalTools] = useState(false);

  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showBackupHelpModal, setShowBackupHelpModal] = useState(false);

  const resolvedApiBase = resolveApiBaseUrl();
  const [isSyncWorking, setIsSyncWorking] = useState(false);

  const daysSinceUserBackup = useMemo(() => {
    if (!seasonPasses || seasonPasses.length === 0) return null;
    if (!lastUserBackupAtISO) return null;
    const d = new Date(lastUserBackupAtISO);
    if (Number.isNaN(d.getTime())) return null;
    const diffMs = Date.now() - d.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [lastUserBackupAtISO, seasonPasses]);

  const shouldShowBackupReminder = useMemo(() => {
    if (!seasonPasses || seasonPasses.length === 0) return false;
    // Never backed up OR backed up 7+ days ago
    if (!lastUserBackupAtISO) return true;
    if (daysSinceUserBackup === null) return true;
    return daysSinceUserBackup >= 7;
  }, [daysSinceUserBackup, lastUserBackupAtISO, seasonPasses]);

  useEffect(() => {
    if (!shouldShowBackupReminder) {
      setShowBackupReminder(false);
      return;
    }

    setShowBackupReminder(true);
    const id = setTimeout(() => setShowBackupReminder(false), 7000);
    return () => clearTimeout(id);
  }, [shouldShowBackupReminder, lastUserBackupAtISO]);

  const backupReminderMessage = useMemo(() => {
    if (!seasonPasses || seasonPasses.length === 0) return null;
    if (!lastUserBackupAtISO) return 'You have not created a backup yet.';
    if (daysSinceUserBackup === null) return 'Your last backup date could not be read.';
    if (daysSinceUserBackup === 0) return 'Your last backup was today.';
    return `It has been ${daysSinceUserBackup} day${daysSinceUserBackup === 1 ? '' : 's'} since your last backup.`;
  }, [daysSinceUserBackup, lastUserBackupAtISO, seasonPasses]);

  // Defensive: if a device momentarily loads a stale bundle where these
  // fields aren't present yet, Switch can receive undefined and cause
  // native crashes/reload loops.
  const safeCloudSyncAutoUploadEnabled = Boolean(cloudSyncAutoUploadEnabled);
  const safeCloudSyncAutoDownloadEnabled = Boolean(cloudSyncAutoDownloadEnabled);

  const handleToggleCloudSyncAutoUpload = useCallback((enabled: boolean) => {
    try {
      if (typeof (setCloudSyncAutoUploadEnabled as any) === 'function') {
        (setCloudSyncAutoUploadEnabled as any)(enabled);
      }
    } catch (e) {
      console.warn('[Settings] toggle auto-upload failed:', e);
    }
  }, [setCloudSyncAutoUploadEnabled]);

  const handleToggleCloudSyncAutoDownload = useCallback((enabled: boolean) => {
    try {
      if (typeof (setCloudSyncAutoDownloadEnabled as any) === 'function') {
        (setCloudSyncAutoDownloadEnabled as any)(enabled);
      }
    } catch (e) {
      console.warn('[Settings] toggle auto-download failed:', e);
    }
  }, [setCloudSyncAutoDownloadEnabled]);

  const devConnectionInfo = (() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return null;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      return {
        scriptURL: null,
        hostUri: window.location.host,
        metroPort: port,
      };
    }

    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;

    const parsePort = (value?: string): string | null => {
      if (!value) return null;
      try {
        const asUrl = value.includes('://') ? new URL(value) : null;
        if (asUrl?.port) return asUrl.port;
      } catch {
        // ignore
      }
      const m = String(value).match(/:(\d{2,5})\b/);
      return m?.[1] ?? null;
    };

    const metroPort = parsePort(scriptURL) || parsePort(hostUri);

    return {
      scriptURL: scriptURL || null,
      hostUri: hostUri || null,
      metroPort: metroPort || null,
    };
  })();

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

  const handleResyncAllSchedules = useCallback(async () => {
    if (isResyncing || isLoadingSchedule) return;
    if (!seasonPasses || seasonPasses.length === 0) return;

    Alert.alert(
      'Resync All Schedules',
      `This will resync HOME games for all ${seasonPasses.length} season passes. Your sales data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resync All',
          style: 'destructive',
          onPress: async () => {
            setIsResyncing(true);

            const timeoutPromise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({ success: false, error: 'Request timed out. Please try again.' }), 120000);
            });

            try {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch { /* ignore */ }

              const result = await Promise.race([
                resyncAllSchedules(),
                timeoutPromise,
              ]);

              if (result?.success) {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch { /* ignore */ }
                Alert.alert('Resync Complete', `Updated schedules for ${result.updatedCount} pass(es).`);
              } else {
                const failedCount = Number(result?.failedCount || 0);
                const updatedCount = Number(result?.updatedCount || 0);
                const error = result?.error || 'Some schedules could not be updated.';

                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                } catch { /* ignore */ }

                if (failedCount > 0 && Array.isArray(result?.failures) && result.failures.length > 0) {
                  const lines = result.failures
                    .slice(0, 4)
                    .map((f: any) => `• ${String(f.teamName || f.passId)}: ${String(f.error || 'failed')}`)
                    .join('\n');
                  Alert.alert('Partial Resync', `Updated ${updatedCount} pass(es). Failed ${failedCount}.\n\n${lines}`);
                } else {
                  Alert.alert('Schedule Unavailable', error);
                }
              }
            } catch (e) {
              console.error('[Settings] Resync all schedules error:', e);
              Alert.alert('Error', 'Failed to resync schedules. Please try again.');
            } finally {
              setIsResyncing(false);
            }
          },
        },
      ]
    );
  }, [isResyncing, isLoadingSchedule, seasonPasses, resyncAllSchedules]);

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

  const handleGenerateSyncKey = useCallback(async () => {
    try {
      setIsSyncWorking(true);
      const key = await generateCloudSyncKey();
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { /* ignore */ }
      Alert.alert('Sync Key Generated', 'Copy this key to your other device to link them.', [{ text: 'OK' }]);
      return key;
    } catch (e) {
      console.error('[Settings] generateCloudSyncKey failed:', e);
      Alert.alert('Error', 'Failed to generate sync key.');
      return null;
    } finally {
      setIsSyncWorking(false);
    }
  }, [generateCloudSyncKey]);

  const handleCopySyncKey = useCallback(async () => {
    if (!cloudSyncKey) {
      Alert.alert('No key', 'Generate or paste a sync key first.');
      return;
    }
    try {
      await Clipboard.setStringAsync(cloudSyncKey);
      Alert.alert('Copied', 'Sync key copied to clipboard.');
    } catch (e) {
      console.error('[Settings] Copy sync key failed:', e);
      Alert.alert('Error', 'Failed to copy sync key.');
    }
  }, [cloudSyncKey]);

  const handlePushSyncNow = useCallback(async () => {
    try {
      setIsSyncWorking(true);
      const res = await pushCloudSyncNow();
      if (res.success) {
        Alert.alert('Synced', 'Uploaded latest backup to sync server.');
      } else {
        Alert.alert('Sync Failed', res.error || 'Upload failed.');
      }
    } finally {
      setIsSyncWorking(false);
    }
  }, [pushCloudSyncNow]);

  const handlePullSyncNow = useCallback(async () => {
    try {
      setIsSyncWorking(true);
      const res = await pullCloudSyncNow();
      if (res.success && res.updated) {
        Alert.alert('Updated', 'Downloaded newer backup from sync server.');
      } else if (res.success && !res.exists) {
        Alert.alert('No backup', 'No backup found on the sync server for this key. Upload from the source device first.');
      } else if (res.success) {
        Alert.alert('Up to date', 'No newer backup found.');
      } else {
        Alert.alert('Sync Failed', res.error || 'Download failed.');
      }
    } finally {
      setIsSyncWorking(false);
    }
  }, [pullCloudSyncNow]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const success = await exportAsCSV();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success',
          'Exported a CSV file (download/share).\n\nAlso copied detailed rows to your clipboard for easy Excel paste.'
        );
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

  const handleDownloadUserBookletPdf = useCallback(async () => {
    const fileBaseName = 'Season Pass Manager - User Booklet';
    const fileName = `${fileBaseName}.pdf`;
    const bookletText = markdownToPlainText(USER_BOOKLET_MARKDOWN);

    setIsExporting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { /* ignore */ }

      if (Platform.OS === 'web') {
        const { jsPDF } = await import('jspdf');

        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const marginLeft = 44;
        const marginRight = 44;
        const marginTop = 54;
        const marginBottom = 54;
        const maxWidth = pageWidth - marginLeft - marginRight;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const lines = doc.splitTextToSize(bookletText, maxWidth);
        const lineHeight = 14;
        let y = marginTop;

        for (const line of lines) {
          if (y > pageHeight - marginBottom) {
            doc.addPage();
            y = marginTop;
          }
          doc.text(String(line), marginLeft, y);
          y += lineHeight;
        }

        doc.save(fileName);
        return;
      }

      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fileBaseName)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 24px; }
      pre { white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.35; }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(bookletText)}</pre>
  </body>
</html>`;

      const pdf = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileBaseName,
          UTI: 'com.adobe.pdf',
        } as any);
      } else {
        Alert.alert('Saved', `PDF created at:\n\n${pdf.uri}`);
      }
    } catch (error) {
      console.error('[Settings] Download booklet PDF error:', error);
      Alert.alert('Error', 'Failed to create booklet PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [setIsExporting]);

  const handleImportSchedule = useCallback(async () => {
    if (isImporting) return;
    if (!activeSeasonPass) {
      Alert.alert('No active season pass', 'Select a season pass first.');
      return;
    }

    setIsImporting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch { /* ignore */ }

      const result = await importSchedule();

      if (!result.success) {
        const msg = result.error || 'Import failed.';
        // Silence normal user-cancel flows
        if (msg === 'No file selected' || msg === 'Cancelled by user') return;
        Alert.alert('Import Failed', msg);
      }
    } catch (error) {
      console.error('[Settings] Import schedule error:', error);
      Alert.alert('Error', 'Failed to import schedule.');
    } finally {
      setIsImporting(false);
    }
  }, [activeSeasonPass, importSchedule, isImporting]);

  const handleGenerateRecoveryCode = useCallback(async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await emailCloneKit(includeLogos);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Clone Kit Ready',
          result.isWeb
            ? 'Opened share options when available (Mail, Messages, etc). If your browser does not support sharing attachments, the recovery code/text is shareable and the full kit is copied to your clipboard.'
            : 'Opened the share sheet — choose Mail to send the clone kit as an attachment.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Settings] Generate recovery code error:', error);
      Alert.alert('Error', 'Failed to prepare clone kit for email/sharing.');
    } finally {
      setIsExporting(false);
    }
  }, [emailCloneKit, includeLogos]);

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
            }
          },
        },
      ]
    );
  }, [forceReplacePanthersSales]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backup Reminder (only when user hasn't generated a restoreable backup in 7+ days) */}
        {showBackupReminder && backupReminderMessage ? (
          <TouchableOpacity
            style={styles.backupReminderCard}
            onPress={() => {
              setShowBackupReminder(false);
              setShowBackupHelpModal(true);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.backupReminderContent}>
              <AlertCircle size={20} color="#B45309" />
              <View style={styles.backupReminderText}>
                <Text style={styles.backupReminderTitle}>Backup recommended</Text>
                <Text style={styles.backupReminderDescription}>{backupReminderMessage} Tap for info.</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

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
              <Text style={styles.settingTitle}>Embed Logos in Backup (Offline Restore)</Text>
              <Text style={styles.settingDescription}>
                ON: embeds team & opponent logos inside the backup. OFF: saves logo links; logos re-download when online.
              </Text>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Switch value={includeLogos} onValueChange={setIncludeLogos} />
            </View>
          </View>

          {activeSeasonPass && (
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => router.push('/edit-pass')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Pencil size={24} color="#2E7D32" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit Active Season Pass</Text>
                <Text style={styles.settingDescription}>Update seats, section, row, or price paid</Text>
              </View>
            </TouchableOpacity>
          )}

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
                style={[styles.settingCard, (isResyncing || isLoadingSchedule) && styles.settingCardDisabled]}
                onPress={handleResyncAllSchedules}
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
                  <Text style={styles.settingTitle}>Resync ALL Season Pass Schedules</Text>
                  <Text style={styles.settingDescription}>
                    {isResyncing ? 'Resyncing schedules…' : `Update HOME games for all ${seasonPasses.length} pass(es)`}
                  </Text>
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

          <View style={styles.settingCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Upload size={24} color="#1565C0" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Cloud Sync (Last backup wins)</Text>
              <Text style={styles.settingDescription}>
                Keep Mac and iPhone matched using a shared Sync Key. The most recently uploaded backup becomes the source of truth.
              </Text>
              {lastCloudSyncTime ? (
                <Text style={styles.settingDescription}>Last sync: {lastCloudSyncTime}</Text>
              ) : null}
              {cloudSyncError ? (
                <Text style={[styles.settingDescription, { color: '#C62828' }]}>Sync error: {cloudSyncError}</Text>
              ) : null}
              {cloudSyncStatus !== 'idle' ? (
                <Text style={styles.settingDescription}>Status: {cloudSyncStatus}</Text>
              ) : null}
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Switch value={cloudSyncEnabled} onValueChange={setCloudSyncEnabled} />
            </View>
          </View>

          {cloudSyncEnabled && (
            <View style={styles.settingCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Shield size={24} color="#7B1FA2" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Sync Key</Text>
                <Text style={styles.settingDescription}>Use the same key on both devices.</Text>

                <TextInput
                  style={styles.syncKeyInput}
                  placeholder="Paste sync key (from other device)"
                  placeholderTextColor="#999"
                  value={cloudSyncKey}
                  onChangeText={setCloudSyncKey}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <View style={styles.syncRow}>
                  <TouchableOpacity
                    style={[styles.syncButton, (isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling') && styles.settingCardDisabled]}
                    onPress={handleGenerateSyncKey}
                    disabled={isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling'}
                  >
                    <Text style={styles.syncButtonText}>Generate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.syncButton, !cloudSyncKey && styles.settingCardDisabled]}
                    onPress={handleCopySyncKey}
                    disabled={!cloudSyncKey}
                  >
                    <Text style={styles.syncButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.syncRow}>
                  <TouchableOpacity
                    style={[styles.syncButtonPrimary, (isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling' || !cloudSyncKey) && styles.buttonDisabled]}
                    onPress={handlePushSyncNow}
                    disabled={isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling' || !cloudSyncKey}
                  >
                    <Text style={styles.syncButtonPrimaryText}>Upload Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.syncButtonPrimary, (isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling' || !cloudSyncKey) && styles.buttonDisabled]}
                    onPress={handlePullSyncNow}
                    disabled={isSyncWorking || cloudSyncStatus === 'pushing' || cloudSyncStatus === 'pulling' || !cloudSyncKey}
                  >
                    <Text style={styles.syncButtonPrimaryText}>Download Now</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.syncToggleRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingTitle}>Auto-upload after changes</Text>
                    <Text style={styles.settingDescription}>
                      Automatically uploads after edits (debounced). Keeps devices aligned with fewer taps.
                    </Text>
                  </View>
                  <Switch
                    value={safeCloudSyncAutoUploadEnabled}
                    onValueChange={handleToggleCloudSyncAutoUpload}
                    disabled={!cloudSyncKey}
                  />
                </View>

                <View style={[styles.syncToggleRow, { marginTop: 8 }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingTitle}>Auto-download when safe</Text>
                    <Text style={styles.settingDescription}>
                      Downloads periodically only when there are no unsynced local edits (prevents overwriting).
                    </Text>
                  </View>
                  <Switch
                    value={safeCloudSyncAutoDownloadEnabled}
                    onValueChange={handleToggleCloudSyncAutoDownload}
                    disabled={!cloudSyncKey}
                  />
                </View>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]} 
            onPress={handleExportExcel}
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
            onPress={handleExportCSV}
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
              <Text style={styles.settingDescription}>Download/share a CSV file (also copies detailed rows to clipboard for Excel)</Text>
            </View>
          </TouchableOpacity>

          {__DEV__ ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>INTERNAL TOOLS</Text>

              <TouchableOpacity
                style={styles.settingCard}
                onPress={() => setShowInternalTools(v => !v)}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#E0F2F1' }]}>
                  {showInternalTools ? (
                    <ChevronUp size={24} color="#00695C" />
                  ) : (
                    <ChevronDown size={24} color="#00695C" />
                  )}
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{showInternalTools ? 'Hide Internal Tools' : 'Show Internal Tools'}</Text>
                  <Text style={styles.settingDescription}>
                    Dev-only diagnostics and backend connection info.
                  </Text>
                </View>
              </TouchableOpacity>

              {showInternalTools ? (
                <>
                  <View style={styles.settingCard}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                      <Shield size={24} color="#FF9800" />
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Connection Diagnostics</Text>
                      <Text style={styles.settingDescription}>
                        API base: {resolvedApiBase.baseUrl || 'NOT SET'} ({resolvedApiBase.source})
                      </Text>
                      <Text style={styles.settingDescription}>
                        Metro port: {devConnectionInfo?.metroPort || 'unknown'}
                      </Text>
                      {devConnectionInfo?.hostUri ? (
                        <Text style={styles.settingDescription}>
                          hostUri: {devConnectionInfo.hostUri}
                        </Text>
                      ) : null}
                      {devConnectionInfo?.scriptURL ? (
                        <Text style={styles.settingDescription}>
                          scriptURL: {devConnectionInfo.scriptURL}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.syncButton}
                      onPress={async () => {
                        try {
                          const lines = [
                            `API base: ${resolvedApiBase.baseUrl || 'NOT SET'} (${resolvedApiBase.source})`,
                            `Metro port: ${devConnectionInfo?.metroPort || 'unknown'}`,
                            devConnectionInfo?.hostUri ? `hostUri: ${devConnectionInfo.hostUri}` : null,
                            devConnectionInfo?.scriptURL ? `scriptURL: ${devConnectionInfo.scriptURL}` : null,
                          ].filter(Boolean);
                          await Clipboard.setStringAsync(String(lines.join('\n')));
                          Alert.alert('Copied', 'Diagnostics copied to clipboard.');
                        } catch (e) {
                          console.warn('[Settings] Failed to copy diagnostics', e);
                        }
                      }}
                    >
                      <Text style={styles.syncButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.settingCard}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => setShowAdvanced(v => !v)}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: '#EEF1F7' }]}>
                        {showAdvanced ? (
                          <ChevronUp size={24} color={AppColors.textSecondary} />
                        ) : (
                          <ChevronDown size={24} color={AppColors.textSecondary} />
                        )}
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>{showAdvanced ? 'Hide Advanced Tools' : 'Show Advanced Tools'}</Text>
                        <Text style={styles.settingDescription}>Rarely used tools and risky/repetitive actions</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {showAdvanced ? (
                    <>
                      {activeSeasonPass ? (
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
                      ) : null}

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

                      {activeSeasonPass ? (
                        <>
                          <TouchableOpacity
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
                            <View style={[styles.iconContainer, { backgroundColor: '#FFF8E1' }]}
                            >
                              {isForceReplacing ? (
                                <ActivityIndicator size="small" color="#F57C00" />
                              ) : (
                                <RefreshCw size={24} color="#F57C00" />
                              )}
                            </View>
                            <View style={styles.settingContent}>
                              <Text style={styles.settingTitle}>Force Replace Panthers Sales</Text>
                              <Text style={styles.settingDescription}>Wipe & replace with canonical 90-record dataset (includes $1 sale)</Text>
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : null}

                      <TouchableOpacity
                        style={[styles.settingCard, isExporting && styles.settingCardDisabled]}
                        onPress={handleEmailBackup}
                        disabled={isExporting}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}
                        >
                          {isExporting ? (
                            <ActivityIndicator size="small" color="#FF9800" />
                          ) : (
                            <Mail size={24} color="#FF9800" />
                          )}
                        </View>
                        <View style={styles.settingContent}>
                          <Text style={styles.settingTitle}>Email Backup</Text>
                          <Text style={styles.settingDescription}>Share a raw data backup file (data only, not app code)</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.settingCard, isExporting && styles.settingCardDisabled]}
            onPress={handleDownloadUserBookletPdf}
            disabled={isExporting}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <FileText size={24} color="#7C3AED" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>User Booklet PDF</Text>
              <Text style={styles.settingDescription}>
                {Platform.OS === 'web'
                  ? 'Downloads a PDF to your computer'
                  : 'Creates a PDF and opens the share sheet (Save to Files, Mail, etc.)'}
              </Text>
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
                <Mail size={24} color="#EF5350" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Generate & Email Clone Kit</Text>
              <Text style={styles.settingDescription}>Creates the clone kit and opens email/share (one action)</Text>
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
        </View>

        {/* Advanced/Troubleshooting moved under DEV-only Internal Tools */}

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

      <Modal
        visible={showBackupHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBackupHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backups & Data Safety</Text>
            <Text style={styles.modalDescription}>
              {[
                'Recommended: create a Clone Kit at least once a week.',
                '',
                '1) Settings → Generate & Email Clone Kit',
                '   - This creates a restoreable backup and opens the share sheet (Mail / Save to Files / etc).',
                '2) Save the file somewhere safe (Files/iCloud Drive/Google Drive).',
                '',
                'Also: on iPhone/iPad, make sure iCloud device backup is enabled. iCloud backups include app data automatically.',
                '',
                'If you ever need to recover: Settings → Restore from Code or Restore from File.',
              ].join('\n')}
            </Text>

            <View style={styles.backupHelpButtonsRow}>
              <TouchableOpacity
                style={[styles.backupHelpPrimaryButton, { flex: 1 }, isExporting && styles.buttonDisabled]}
                onPress={async () => {
                  setShowBackupHelpModal(false);
                  await handleGenerateRecoveryCode();
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.backupHelpPrimaryText}>Create Clone Kit Now</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backupHelpSecondaryButton, { marginLeft: 10 }]}
                onPress={() => setShowBackupHelpModal(false)}
              >
                <Text style={styles.backupHelpSecondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        {__DEV__ ? (
          <Text style={styles.versionSubLabel}>
            DEV bundle • {String(Constants.appOwnership ?? 'unknown')}
          </Text>
        ) : null}
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

  syncKeyInput: {
    marginTop: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },

  syncRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  syncToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  syncButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#333',
    fontWeight: '600',
  },

  syncButtonPrimary: {
    flex: 1,
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  syncButtonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
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
  versionSubLabel: {
    fontSize: 8,
    color: AppColors.textLight,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
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
  backupReminderCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  backupReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backupReminderText: {
    flex: 1,
  },
  backupReminderTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 2,
  },
  backupReminderDescription: {
    fontSize: 9,
    color: '#B45309',
    fontWeight: '500' as const,
    lineHeight: 14,
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
  backupHelpButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backupHelpPrimaryButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupHelpPrimaryText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#fff',
  },
  backupHelpSecondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupHelpSecondaryText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
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
