import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const PROJECT_ID = 'pq-hub-906ed';

// In production, replace with your deployed Cloud Function URLs
const FUNCTIONS_BASE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

export interface BackupRecord {
  id: string;
  timestamp: any;
  type: 'manual' | 'scheduled';
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  triggeredBy?: string;
  backupPath: string;
  size: number;
  completedAt?: any;
  errors?: string[];
  firestoreExport?: { success: boolean; error?: string };
  storageBackup?: { fileCount: number; totalSize: number };
}

export interface OrgUsage {
  organizationId: string;
  organizationName: string;
  firestoreSize: number;
  firestoreDocCount: number;
  storageSize: number;
  storageFileCount: number;
  totalSize: number;
  lastUpdated: any;
}

/**
 * Trigger a manual backup via Cloud Function
 */
export async function triggerManualBackup(): Promise<{ success: boolean; backupId?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/manualBackup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Backup failed' };
    }

    return { success: true, backupId: data.backupId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Trigger usage calculation via Cloud Function
 */
export async function triggerUsageCalculation(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/calculateUsage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch backup history from Firestore
 */
export async function fetchBackupHistory(limitCount = 20): Promise<BackupRecord[]> {
  const q = query(
    collection(db, 'backups'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupRecord));
}

/**
 * Fetch organization usage data
 */
export async function fetchOrgUsage(): Promise<OrgUsage[]> {
  const snapshot = await getDocs(collection(db, 'org_usage'));
  return snapshot.docs.map(doc => doc.data() as OrgUsage);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
