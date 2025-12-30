import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
export function NotificationManager() {
  const profile = useGameStore(state => state.profile);
  const checkNotifications = useGameStore(state => state.checkNotifications);
  useEffect(() => {
    if (!profile) return;
    // Initial check
    checkNotifications();
    // Poll every 10 seconds (increased frequency for better responsiveness)
    const intervalId = setInterval(() => {
      checkNotifications();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [profile, checkNotifications]);
  return null; // Headless component
}