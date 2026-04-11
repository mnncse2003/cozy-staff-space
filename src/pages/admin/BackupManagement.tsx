import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Database, HardDrive, Download, RefreshCw, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, Building2, BarChart3, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  triggerManualBackup,
  triggerUsageCalculation,
  fetchBackupHistory,
  fetchOrgUsage,
  formatBytes,
  type BackupRecord,
  type OrgUsage,
} from '@/lib/backupService';
import { useAuth } from '@/contexts/AuthContext';

const BackupManagement = () => {
  const { userRole } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [orgUsage, setOrgUsage] = useState<OrgUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [calculatingUsage, setCalculatingUsage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupData, usageData] = await Promise.all([
        fetchBackupHistory(),
        fetchOrgUsage(),
      ]);
      setBackups(backupData);
      setOrgUsage(usageData);
    } catch (error) {
      console.error('Failed to load backup data:', error);
      toast.error('Failed to load backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    toast.info('Backup started... This may take several minutes.');
    try {
      const result = await triggerManualBackup();
      if (result.success) {
        toast.success('Backup completed successfully!');
        loadData();
      } else {
        toast.error(`Backup failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Backup error: ${error.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRefreshUsage = async () => {
    setCalculatingUsage(true);
    toast.info('Calculating organization usage...');
    try {
      const result = await triggerUsageCalculation();
      if (result.success) {
        toast.success('Usage data updated!');
        loadData();
      } else {
        toast.error(`Usage calculation failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setCalculatingUsage(false);
    }
  };

  if (userRole !== 'super-admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only Super Admins can access the backup management system.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const totalStorage = orgUsage.reduce((sum, org) => sum + org.totalSize, 0);
  const totalDocs = orgUsage.reduce((sum, org) => sum + org.firestoreDocCount, 0);
  const totalFiles = orgUsage.reduce((sum, org) => sum + org.storageFileCount, 0);
  const lastBackup = backups[0];
  const highUsageOrgs = orgUsage.filter(org => org.totalSize > 100 * 1024 * 1024); // > 100MB

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  return (
    <Layout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Backup & Storage Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor system backups, storage usage, and organization data
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBackupNow}
              disabled={backingUp}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {backingUp ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Backing Up...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Backup Now</>
              )}
            </Button>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatBytes(totalStorage)}</div>
              <p className="text-xs text-blue-600 mt-1">Across {orgUsage.length} organizations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Total Documents</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{totalDocs.toLocaleString()}</div>
              <p className="text-xs text-purple-600 mt-1">Firestore documents</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Storage Files</CardTitle>
              <HardDrive className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{totalFiles.toLocaleString()}</div>
              <p className="text-xs text-emerald-600 mt-1">Files in Firebase Storage</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-amber-900">
                {lastBackup ? formatTimestamp(lastBackup.timestamp) : 'No backups yet'}
              </div>
              {lastBackup && (
                <div className="mt-1">{getStatusBadge(lastBackup.status)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* High Usage Alerts */}
        {highUsageOrgs.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                High Usage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {highUsageOrgs.map(org => (
                  <div key={org.organizationId} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                    <span className="font-medium text-amber-900">{org.organizationName}</span>
                    <Badge className="bg-amber-100 text-amber-800">{formatBytes(org.totalSize)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Progress Indicator */}
        {backingUp && (
          <Card className="border-blue-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium">Backup in progress...</span>
              </div>
              <Progress value={undefined} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Exporting Firestore data and copying Storage files. This may take several minutes for large datasets.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Backup History
              </CardTitle>
              <CardDescription>Recent backup operations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 py-4">{[...Array(3)].map((_, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><Skeleton className="h-10 w-10 rounded-lg" /><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-16 rounded-full" /></div>))}</div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No backups yet. Click "Backup Now" to create your first backup.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map(backup => (
                        <TableRow key={backup.id}>
                          <TableCell className="text-xs">{formatTimestamp(backup.timestamp)}</TableCell>
                          <TableCell>
                            <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                              {backup.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell className="text-sm">{formatBytes(backup.size)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Organization Usage
                  </CardTitle>
                  <CardDescription>Data usage per organization</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshUsage} disabled={calculatingUsage}>
                  {calculatingUsage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orgUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No usage data. Click refresh to calculate.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-auto">
                  {orgUsage.sort((a, b) => b.totalSize - a.totalSize).map(org => {
                    const maxSize = Math.max(...orgUsage.map(o => o.totalSize), 1);
                    const percentage = (org.totalSize / maxSize) * 100;
                    return (
                      <div key={org.organizationId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{org.organizationName}</p>
                            <p className="text-xs text-muted-foreground">
                              {org.firestoreDocCount} docs · {org.storageFileCount} files
                            </p>
                          </div>
                          <span className="font-semibold text-sm">{formatBytes(org.totalSize)}</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div
                            className="bg-blue-500 rounded-l"
                            style={{ width: `${(org.firestoreSize / (org.totalSize || 1)) * percentage}%` }}
                            title={`Firestore: ${formatBytes(org.firestoreSize)}`}
                          />
                          <div
                            className="bg-emerald-500 rounded-r"
                            style={{ width: `${(org.storageSize / (org.totalSize || 1)) * percentage}%` }}
                            title={`Storage: ${formatBytes(org.storageSize)}`}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Firestore: {formatBytes(org.firestoreSize)}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Storage: {formatBytes(org.storageSize)}
                          </span>
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cost Optimization Tips */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Shield className="h-5 w-5 text-blue-600" />
              Backup System Info & Cost Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900">⏰ Automated Backups</h4>
                <p className="text-xs text-blue-700 mt-1">Weekly backups run every Sunday at 2:00 AM IST via Cloud Scheduler.</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm text-green-900">💰 Cost Tips</h4>
                <p className="text-xs text-green-700 mt-1">Use Nearline/Coldline storage for old backups. Set lifecycle rules to auto-delete backups older than 90 days.</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-sm text-purple-900">📦 Backup Location</h4>
                <p className="text-xs text-purple-700 mt-1">gs://pq-hub-906ed-backups/backups/&#123;timestamp&#125;/</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-sm text-amber-900">🔒 Security</h4>
                <p className="text-xs text-amber-700 mt-1">Only Super Admins can trigger backups. All operations verified via Firebase Auth + role check.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BackupManagement;
