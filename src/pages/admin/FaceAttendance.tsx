import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { collection, getDocs, query, where, addDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadFaceModels,
  detectAllFaces,
  arrayToDescriptor,
  matchFace,
} from '@/lib/faceRecognitionService';
import { formatLocalDate } from '@/lib/dateUtils';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ScanFace,
  Clock,
  LogIn,
  LogOut,
  UserX,
} from 'lucide-react';

interface KnownFace {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  descriptors: Float32Array[];
}

interface AttendanceLog {
  id: string;
  employeeName: string;
  employeeCode: string;
  type: 'in' | 'out';
  time: string;
}

// Cooldown in ms – prevents duplicate punches within 60 seconds
const PUNCH_COOLDOWN = 60_000;

const FaceAttendance = () => {
  const { organizationId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  // Track recent punches to prevent duplicates
  const recentPunchesRef = useRef<Map<string, number>>(new Map());

  // Load models
  useEffect(() => {
    const init = async () => {
      try {
        await loadFaceModels();
        setModelsReady(true);
      } catch (e) {
        console.error('Error loading models:', e);
        toast.error('Failed to load face recognition models.');
      } finally {
        setLoadingModels(false);
      }
    };
    init();
  }, []);

  // Load known face data
  useEffect(() => {
    const loadFaces = async () => {
      if (!organizationId) return;
      try {
        const q = query(collection(db, 'face_data'), where('organizationId', '==', organizationId));
        const snapshot = await getDocs(q);
        const faces: KnownFace[] = snapshot.docs
          .filter((d) => d.data().descriptors?.length > 0)
          .map((d) => ({
            employeeId: d.data().employeeId,
            employeeName: d.data().employeeName,
            employeeCode: d.data().employeeCode,
            descriptors: d.data().descriptors.map((arr: number[]) => arrayToDescriptor(arr)),
          }));
        setKnownFaces(faces);
      } catch (e) {
        console.error('Error loading face data:', e);
      }
    };
    loadFaces();
  }, [organizationId]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setStatusMessage('Camera started. Scanning for faces...');
        setStatusType('info');
      }
    } catch {
      toast.error('Could not access camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
    setStatusMessage('');
  }, []);

  // Determine punch type
  const getPunchType = async (employeeId: string): Promise<'in' | 'out'> => {
    const today = formatLocalDate(new Date());
    try {
      const q = query(
        collection(db, 'face_attendance'),
        where('employeeId', '==', employeeId),
        where('date', '==', today),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return 'in';
      const lastType = snap.docs[0].data().type;
      return lastType === 'in' ? 'out' : 'in';
    } catch {
      return 'in';
    }
  };

  const markAttendance = async (employeeId: string, employeeName: string, employeeCode: string) => {
    const now = Date.now();
    const lastPunch = recentPunchesRef.current.get(employeeId);
    if (lastPunch && now - lastPunch < PUNCH_COOLDOWN) return; // cooldown active

    recentPunchesRef.current.set(employeeId, now);

    const punchType = await getPunchType(employeeId);
    const today = formatLocalDate(new Date());
    const timeStr = new Date().toLocaleTimeString();

    try {
      await addDoc(collection(db, 'face_attendance'), {
        employeeId,
        employeeName,
        employeeCode,
        organizationId,
        date: today,
        time: timeStr,
        timestamp: Timestamp.now(),
        type: punchType,
      });

      const logEntry: AttendanceLog = {
        id: `${employeeId}-${now}`,
        employeeName,
        employeeCode,
        type: punchType,
        time: timeStr,
      };

      setAttendanceLogs((prev) => [logEntry, ...prev].slice(0, 50));
      setStatusMessage(`✅ ${employeeName} — Punch ${punchType.toUpperCase()} at ${timeStr}`);
      setStatusType('success');
      toast.success(`${employeeName} punched ${punchType} successfully`);
    } catch (e) {
      console.error('Error marking attendance:', e);
      toast.error('Failed to mark attendance.');
    }
  };

  // Continuous face scanning
  useEffect(() => {
    if (!cameraActive || !modelsReady || knownFaces.length === 0) return;

    setScanning(true);

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      try {
        const detections = await detectAllFaces(videoRef.current);

        // Draw detection overlay
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const det of detections) {
              const { x, y, width, height } = det.detection.box;

              const matchResult = matchFace(
                det.descriptor,
                knownFaces.map((kf) => ({ label: kf.employeeId, descriptors: kf.descriptors }))
              );

              if (matchResult) {
                const known = knownFaces.find((kf) => kf.employeeId === matchResult.label);
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = '#22c55e';
                ctx.font = '14px sans-serif';
                ctx.fillRect(x, y - 24, width, 24);
                ctx.fillStyle = '#fff';
                ctx.fillText(known?.employeeName || 'Known', x + 4, y - 6);

                if (known) {
                  markAttendance(known.employeeId, known.employeeName, known.employeeCode);
                }
              } else {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = '#ef4444';
                ctx.font = '14px sans-serif';
                ctx.fillRect(x, y - 24, width, 24);
                ctx.fillStyle = '#fff';
                ctx.fillText('Unknown', x + 4, y - 6);
              }
            }
          }
        }

        if (detections.length === 0) {
          setStatusMessage('Scanning... No face detected.');
          setStatusType('info');
        }
      } catch (e) {
        console.error('Scan error:', e);
      }
    }, 1500);

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraActive, modelsReady, knownFaces, organizationId]);

  // Cleanup
  useEffect(() => () => stopCamera(), [stopCamera]);

  const statusColors: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
    success: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
    error: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300',
  };

  return (
    <Layout pageTitle="Face Attendance">
      <div className="space-y-6 p-4 sm:p-6">
        {/* Models Status */}
        {loadingModels && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Loading face recognition models...
              </span>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanFace className="h-5 w-5" />
                  Real-Time Face Attendance
                </CardTitle>
                <CardDescription>
                  The camera continuously scans and identifies employees to automatically mark attendance.
                  {knownFaces.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {knownFaces.length} faces enrolled
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {knownFaces.length === 0 && !loadingModels && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    No enrolled faces found. Please enroll employees first via Face Enrollment.
                  </div>
                )}

                {/* Camera View */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: 'scaleX(-1)' }}
                  />

                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={startCamera}
                        size="lg"
                        className="gap-2"
                        disabled={!modelsReady || knownFaces.length === 0}
                      >
                        <Camera className="h-5 w-5" />
                        Start Attendance Scanner
                      </Button>
                    </div>
                  )}

                  {cameraActive && scanning && (
                    <div className="absolute top-3 left-3">
                      <Badge className="gap-1 bg-green-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Scanning...
                      </Badge>
                    </div>
                  )}
                </div>

                {cameraActive && (
                  <Button variant="destructive" onClick={stopCamera} className="w-full">
                    Stop Scanner
                  </Button>
                )}

                {/* Status Message */}
                {statusMessage && (
                  <div className={`p-3 rounded-lg text-sm ${statusColors[statusType]}`}>
                    {statusMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance Log */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Today's Log
                </CardTitle>
                <CardDescription>Real-time attendance entries</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No entries yet. Start scanning to mark attendance.
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {attendanceLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 text-sm">
                          {log.type === 'in' ? (
                            <LogIn className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <LogOut className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{log.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.employeeCode} • {log.time}
                            </p>
                          </div>
                          <Badge variant={log.type === 'in' ? 'default' : 'secondary'} className="text-xs">
                            {log.type === 'in' ? 'IN' : 'OUT'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FaceAttendance;
