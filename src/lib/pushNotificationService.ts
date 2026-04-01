import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PUSH_PREF_COLLECTION = 'push_preferences';
const PUSH_TOKENS_COLLECTION = 'push_tokens';

export const isPushSupported = (): boolean => {
  return 'Notification' in window;
};

export const getPushPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return 'denied';
  return await Notification.requestPermission();
};

export const savePushPreference = async (userId: string, enabled: boolean): Promise<void> => {
  await setDoc(doc(db, PUSH_PREF_COLLECTION, userId), {
    userId,
    enabled,
    updatedAt: new Date().toISOString(),
  });
};

export const getPushPreference = async (userId: string): Promise<boolean> => {
  try {
    const prefDoc = await getDoc(doc(db, PUSH_PREF_COLLECTION, userId));
    if (prefDoc.exists()) {
      return prefDoc.data().enabled ?? false;
    }
    return false;
  } catch {
    return false;
  }
};

export const showBrowserNotification = (title: string, options?: NotificationOptions): void => {
  if (!isPushSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

export const showAttendanceReminder = (type: 'punch-in' | 'punch-out'): void => {
  const title = type === 'punch-in' ? '⏰ Time to Punch In!' : '⏰ Time to Punch Out!';
  const body = type === 'punch-in'
    ? 'Good morning! Don\'t forget to mark your attendance.'
    : 'It\'s time to punch out. Have a great evening!';

  showBrowserNotification(title, { body, tag: `attendance-${type}` });
};

export const showLeaveNotification = (status: 'approved' | 'rejected', leaveType: string): void => {
  const title = status === 'approved' ? '✅ Leave Approved' : '❌ Leave Rejected';
  const body = `Your ${leaveType} leave request has been ${status}.`;
  showBrowserNotification(title, { body, tag: `leave-${Date.now()}` });
};

export const showBirthdayNotification = (employeeName: string): void => {
  showBrowserNotification('🎂 Birthday Wishes!', {
    body: `Happy Birthday, ${employeeName}! Wishing you a wonderful day!`,
    tag: `birthday-${employeeName}`,
  });
};

export const showAdminAnnouncementNotification = (title: string, message: string): void => {
  showBrowserNotification(`📢 ${title}`, {
    body: message,
    tag: `announcement-${Date.now()}`,
  });
};
