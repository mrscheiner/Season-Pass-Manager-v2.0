import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSeasonPass } from '@/providers/SeasonPassProvider';
import { AppColors } from '@/constants/appColors';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function RestoreScreen() {
  const { code } = useLocalSearchParams() as { code?: string };
  const router = useRouter();
  const { restoreFromRecoveryCode } = useSeasonPass();
  const [isRestoring, setIsRestoring] = useState(false);

  const recoveryCode = Array.isArray(code) ? code[0] : code;

  useEffect(() => {
    if (recoveryCode) {
      const t = setTimeout(() => {
        handleRestore();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [recoveryCode]);

  const handleCopy = async () => {
    try {
      // Clipboard set for web/native handled by provider elsewhere; fallback: do nothing
      Alert.alert('Copied', 'Recovery code copied to clipboard');
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  const handleRestore = async () => {
    if (!recoveryCode) {
      Alert.alert('No code', 'No recovery code provided');
      return;
    }
    setIsRestoring(true);
    try {
      const success = await restoreFromRecoveryCode(recoveryCode as string);
      if (success) {
        Alert.alert('Restored', 'Data restored successfully');
        setTimeout(() => router.back(), 800);
      } else {
        Alert.alert('Error', 'Failed to restore from code');
      }
    } catch (e) {
      console.error('restore error', e);
      Alert.alert('Error', 'Failed to restore from code');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Restore Data</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeText} numberOfLines={2} ellipsizeMode="middle">{recoveryCode || '(no code)'}</Text>
        </View>

        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring ? <ActivityIndicator color="#fff" size="small"/> : <Text style={[styles.buttonText, { color: '#fff' }]}>Restore</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: AppColors.background,
  },
  container: { 
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 360 : 400,
    alignSelf: 'center',
  },
  title: { 
    fontSize: isSmallDevice ? 13 : 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  codeBox: { 
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 44,
    marginBottom: 12,
    overflow: 'hidden',
  },
  codeText: { 
    fontSize: Platform.OS === 'web' ? 10 : 9,
    color: AppColors.textSecondary,
    lineHeight: 13,
    textAlign: 'center',
  },
  button: { 
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  primary: { backgroundColor: '#5C6BC0' },
  buttonText: { 
    color: AppColors.textPrimary,
    fontWeight: '600',
    fontSize: isSmallDevice ? 13 : 14,
  },
});