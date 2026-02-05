import { Tabs, useRouter } from "expo-router";
import { Home, Calendar, TrendingUp, Ticket, Settings, CheckCircle, AlertCircle } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Platform, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppColors } from "@/constants/appColors";
import { useSeasonPass } from "@/providers/SeasonPassProvider";

export default function TabLayout() {
  const router = useRouter();
  const { isLoading, needsSetup, activeSeasonPass, backupConfirmationMessage, lastBackupStatus, lastBackupTime } = useSeasonPass();
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && needsSetup) {
      console.log('[TabLayout] Redirecting to setup...');
      router.replace('/setup');
    }
  }, [isLoading, needsSetup, router]);

  useEffect(() => {
    if (backupConfirmationMessage) {
      console.log('[TabLayout] Showing backup toast:', backupConfirmationMessage);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [backupConfirmationMessage, toastOpacity]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (needsSetup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const teamPrimaryColor = activeSeasonPass?.teamPrimaryColor || AppColors.primary;

  // Wrap Tabs in a small web-friendly container when opened via the web preview.
  const TabsContent = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: teamPrimaryColor,
        tabBarInactiveTintColor: AppColors.iconGray,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(255,255,255,0.96)', 'rgba(241,245,249,0.92)', 'rgba(255,255,255,0.96)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: 'rgba(229,231,235,0.85)' }]}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Calendar size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <TrendingUp size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => <Ticket size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </Tabs>
  );

  const shouldShowToast = backupConfirmationMessage && lastBackupStatus;
  
  const BackupToast = shouldShowToast ? (
    <Animated.View 
      style={[
        styles.backupToast, 
        { 
          opacity: toastOpacity,
          backgroundColor: lastBackupStatus === 'success' ? '#10B981' : '#EF4444',
        }
      ]} 
      pointerEvents="none"
    >
      {lastBackupStatus === 'success' ? (
        <CheckCircle size={16} color="#FFFFFF" />
      ) : (
        <AlertCircle size={16} color="#FFFFFF" />
      )}
      <Text style={styles.backupToastText}>
        {backupConfirmationMessage 
          ? String(backupConfirmationMessage).replace(/ \d+$/, '') 
          : (lastBackupStatus === 'success' ? 'Backup saved' : 'Backup failed')}
      </Text>
      {lastBackupTime && lastBackupStatus === 'success' ? (
        <Text style={styles.backupToastTime}>{`• ${lastBackupTime}`}</Text>
      ) : null}
    </Animated.View>
  ) : null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        <View style={styles.webBanner}>
          <Text style={styles.webBannerText}>
            Viewing web preview — for native mobile testing scan the QR in the Expo Go app.
          </Text>
        </View>
        {TabsContent}
        {BackupToast}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {TabsContent}
      {BackupToast}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  webWrapper: {
    flex: 1,
    maxWidth: 420,
    marginHorizontal: 'auto',
    backgroundColor: AppColors.background,
  },
  webBanner: {
    backgroundColor: '#FFF4E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  webBannerText: {
    fontSize: 10,
    color: '#664E14',
    textAlign: 'center',
  },
  backupToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  backupToastText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  backupToastTime: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
