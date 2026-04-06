/**
 * Firebase Cloud Functions - Backup System
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a GCS backup bucket: gsutil mb gs://pq-hub-906ed-backups
 * 2. Install dependencies: cd cloud-functions && npm install
 * 3. Deploy: firebase deploy --only functions
 * 4. Set up Cloud Scheduler for weekly backup:
 *    gcloud scheduler jobs create http weekly-backup \
 *      --schedule="0 2 * * 0" \
 *      --time-zone="Asia/Kolkata" \
 *      --uri="https://<region>-pq-hub-906ed.cloudfunctions.net/scheduledBackup" \
 *      --http-method=POST \
 *      --oidc-service-account-email="<service-account>@pq-hub-906ed.iam.gserviceaccount.com"
 * 
 * REQUIRED IAM PERMISSIONS:
 * - roles/datastore.importExportAdmin (for Firestore export)
 * - roles/storage.admin (for backup bucket)
 * - Service account needs access to both source and backup buckets
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v1 as firestoreAdmin } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

admin.initializeApp();

const PROJECT_ID = 'pq-hub-906ed';
const BACKUP_BUCKET = `${PROJECT_ID}-backups`;
const SOURCE_BUCKET = `${PROJECT_ID}.appspot.com`;
const db = admin.firestore();
const storage = new Storage();
const firestoreClient = new firestoreAdmin.FirestoreAdminClient();

// Collections to backup
const COLLECTIONS = [
  'employees', 'attendance', 'leaves', 'salary_slips', 'departments',
  'organizations', 'user_roles', 'holidays', 'shifts', 'notifications',
  'helpdesk_tickets', 'exit_requests', 'reimbursements', 'tax_declarations',
  'investment_proofs', 'loan_applications', 'policy_documents',
  'organization_settings', 'system_settings', 'backups', 'org_usage',
  'leave_balances', 'device_sessions', 'chat_conversations', 'chat_messages'
];

/**
 * Verify the caller is a super-admin
 */
async function verifySuperAdmin(uid: string): Promise<boolean> {
  const roleDoc = await db.collection('user_roles').doc(uid).get();
  if (!roleDoc.exists) return false;
  return roleDoc.data()?.role === 'super-admin';
}

/**
 * Export Firestore to GCS bucket
 */
async function exportFirestore(backupPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const databaseName = firestoreClient.databasePath(PROJECT_ID, '(default)');
    const outputUri = `gs://${BACKUP_BUCKET}/${backupPath}/firestore`;

    const [response] = await firestoreClient.exportDocuments({
      name: databaseName,
      outputUriPrefix: outputUri,
      collectionIds: COLLECTIONS,
    });

    // Wait for the export to complete
    const [result] = await response.promise();
    console.log('Firestore export completed:', result);
    return { success: true };
  } catch (error: any) {
    console.error('Firestore export failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Copy Firebase Storage files to backup bucket
 */
async function backupStorage(backupPath: string): Promise<{ success: boolean; fileCount: number; totalSize: number; error?: string }> {
  try {
    const sourceBucket = storage.bucket(SOURCE_BUCKET);
    const backupBucket = storage.bucket(BACKUP_BUCKET);
    
    const [files] = await sourceBucket.getFiles();
    let fileCount = 0;
    let totalSize = 0;

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (file) => {
          try {
            const [metadata] = await file.getMetadata();
            totalSize += parseInt(metadata.size as string, 10) || 0;
            
            await file.copy(backupBucket.file(`${backupPath}/storage/${file.name}`));
            fileCount++;
          } catch (err) {
            console.warn(`Failed to copy file ${file.name}:`, err);
          }
        })
      );
    }

    return { success: true, fileCount, totalSize };
  } catch (error: any) {
    console.error('Storage backup failed:', error);
    return { success: false, fileCount: 0, totalSize: 0, error: error.message };
  }
}

/**
 * Calculate organization-wise data usage
 */
async function calculateOrgUsage(): Promise<void> {
  try {
    const orgsSnapshot = await db.collection('organizations').get();
    const orgIds = orgsSnapshot.docs.map(d => d.id);

    for (const orgId of orgIds) {
      let firestoreSize = 0;
      let firestoreDocCount = 0;

      // Calculate Firestore usage per org
      for (const collectionName of COLLECTIONS) {
        try {
          const snapshot = await db.collection(collectionName)
            .where('organizationId', '==', orgId)
            .get();
          
          snapshot.docs.forEach(doc => {
            const jsonSize = Buffer.byteLength(JSON.stringify(doc.data()), 'utf8');
            firestoreSize += jsonSize;
            firestoreDocCount++;
          });
        } catch {
          // Collection may not have organizationId field, skip
        }
      }

      // Calculate Storage usage per org
      let storageSize = 0;
      let storageFileCount = 0;
      try {
        const sourceBucket = storage.bucket(SOURCE_BUCKET);
        const [files] = await sourceBucket.getFiles({ prefix: `orgs/${orgId}/` });
        for (const file of files) {
          const [metadata] = await file.getMetadata();
          storageSize += parseInt(metadata.size as string, 10) || 0;
          storageFileCount++;
        }
      } catch {
        // No org-specific storage folder
      }

      // Store usage data
      await db.collection('org_usage').doc(orgId).set({
        organizationId: orgId,
        organizationName: orgsSnapshot.docs.find(d => d.id === orgId)?.data()?.name || 'Unknown',
        firestoreSize,
        firestoreDocCount,
        storageSize,
        storageFileCount,
        totalSize: firestoreSize + storageSize,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    console.log(`Usage calculated for ${orgIds.length} organizations`);
  } catch (error) {
    console.error('Usage calculation failed:', error);
  }
}

/**
 * Manual Backup - HTTP Trigger
 * POST /manualBackup
 * Requires Authorization header with Firebase ID token of a super-admin
 */
export const manualBackup = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    // Verify auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      
      const isSuperAdmin = await verifySuperAdmin(decoded.uid);
      if (!isSuperAdmin) {
        res.status(403).json({ error: 'Forbidden: Super Admin access required' }); return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `backups/${timestamp}`;

      // Create backup record
      const backupRef = db.collection('backups').doc();
      await backupRef.set({
        id: backupRef.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'manual',
        status: 'in_progress',
        triggeredBy: decoded.uid,
        backupPath,
        size: 0,
      });

      // Run Firestore export and Storage backup in parallel
      const [firestoreResult, storageResult] = await Promise.all([
        exportFirestore(backupPath),
        backupStorage(backupPath),
      ]);

      const success = firestoreResult.success && storageResult.success;
      const totalSize = storageResult.totalSize;

      // Update backup record
      await backupRef.update({
        status: success ? 'completed' : 'partial',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        size: totalSize,
        firestoreExport: firestoreResult,
        storageBackup: { fileCount: storageResult.fileCount, totalSize: storageResult.totalSize },
        errors: [
          ...(firestoreResult.error ? [`Firestore: ${firestoreResult.error}`] : []),
          ...(storageResult.error ? [`Storage: ${storageResult.error}`] : []),
        ],
      });

      // Calculate org usage in background
      calculateOrgUsage().catch(console.error);

      res.status(200).json({
        success,
        backupId: backupRef.id,
        backupPath,
        firestoreExport: firestoreResult.success,
        storageBackup: storageResult.success,
        filesCopied: storageResult.fileCount,
        totalSize,
      });
    } catch (error: any) {
      console.error('Manual backup failed:', error);
      res.status(500).json({ error: 'Backup failed', details: error.message });
    }
  });

/**
 * Scheduled Backup - Runs every Sunday at 2 AM IST
 */
export const scheduledBackup = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('0 2 * * 0')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `backups/${timestamp}`;

    const backupRef = db.collection('backups').doc();
    await backupRef.set({
      id: backupRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'scheduled',
      status: 'in_progress',
      backupPath,
      size: 0,
    });

    try {
      const [firestoreResult, storageResult] = await Promise.all([
        exportFirestore(backupPath),
        backupStorage(backupPath),
      ]);

      const success = firestoreResult.success && storageResult.success;

      await backupRef.update({
        status: success ? 'completed' : 'partial',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        size: storageResult.totalSize,
        firestoreExport: firestoreResult,
        storageBackup: { fileCount: storageResult.fileCount, totalSize: storageResult.totalSize },
        errors: [
          ...(firestoreResult.error ? [`Firestore: ${firestoreResult.error}`] : []),
          ...(storageResult.error ? [`Storage: ${storageResult.error}`] : []),
        ],
      });

      // Calculate org usage
      await calculateOrgUsage();

      console.log(`Scheduled backup ${success ? 'completed' : 'partially completed'}: ${backupRef.id}`);
    } catch (error: any) {
      await backupRef.update({
        status: 'failed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        errors: [error.message],
      });
      console.error('Scheduled backup failed:', error);
    }
  });

/**
 * Calculate usage on demand
 */
export const calculateUsage = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      if (!await verifySuperAdmin(decoded.uid)) {
        res.status(403).json({ error: 'Forbidden' }); return;
      }

      await calculateOrgUsage();
      res.status(200).json({ success: true, message: 'Usage calculation completed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
