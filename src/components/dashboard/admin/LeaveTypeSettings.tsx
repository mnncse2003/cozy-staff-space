import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Settings, Save, RotateCcw } from 'lucide-react';

const SYSTEM_DEFAULTS: Record<string, number> = {
  PL: 30,
  CL: 12,
  SL: 12,
  WFH: 15,
  MATERNITY: 182,
  PATERNITY: 15,
  ADOPTION: 84,
  SABBATICAL: 0,
  BEREAVEMENT: 5,
  PARENTAL: 0,
  COMP_OFF: 0,
};

const LEAVE_TYPE_INFO: Record<string, { label: string; description: string }> = {
  PL: { label: 'Privilege Leave (PL)', description: 'Earned/annual leave' },
  CL: { label: 'Casual Leave (CL)', description: 'Short-term personal leave' },
  SL: { label: 'Sick Leave (SL)', description: 'Medical leave' },
  WFH: { label: 'Work From Home (WFH)', description: 'Remote working days' },
  MATERNITY: { label: 'Maternity Leave', description: 'Female employees only' },
  PATERNITY: { label: 'Paternity Leave', description: 'Male employees only' },
  ADOPTION: { label: 'Adoption Leave', description: 'Female employees only' },
  SABBATICAL: { label: 'Sabbatical', description: 'Long-term leave' },
  BEREAVEMENT: { label: 'Bereavement Leave', description: 'Immediate family loss' },
  PARENTAL: { label: 'Parental Leave', description: 'Unpaid child care leave' },
  COMP_OFF: { label: 'Compensatory Off', description: 'Extra work compensation' },
};

const LeaveTypeSettings = () => {
  const { organizationId } = useAuth();
  const [defaults, setDefaults] = useState<Record<string, number>>({ ...SYSTEM_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDefaults();
  }, [organizationId]);

  const loadDefaults = async () => {
    if (!organizationId) return;
    try {
      const docRef = doc(db, 'organization_settings', `${organizationId}_leave_defaults`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setDefaults({ ...SYSTEM_DEFAULTS, ...snap.data().defaults });
      }
    } catch (error) {
      console.error('Error loading leave defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'organization_settings', `${organizationId}_leave_defaults`), {
        organizationId,
        defaults,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Leave type defaults saved successfully');
    } catch (error) {
      console.error('Error saving defaults:', error);
      toast.error('Failed to save leave type defaults');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDefaults({ ...SYSTEM_DEFAULTS });
    toast.success('Reset to system defaults');
  };

  const handleChange = (type: string, value: string) => {
    const num = parseFloat(value);
    setDefaults(prev => ({ ...prev, [type]: Number.isNaN(num) ? 0 : num }));
  };

  if (loading) {
    return <LeaveTypeSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Leave Type Default Days
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure default leave days for each type. New employees will receive these balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(LEAVE_TYPE_INFO).map(([type, info]) => (
          <Card key={type} className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div>
                  <Label className="font-medium text-sm">{info.label}</Label>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaults[type]}
                    onChange={(e) => handleChange(type, e.target.value)}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
                </div>
                {defaults[type] !== SYSTEM_DEFAULTS[type] && (
                  <p className="text-xs text-primary">
                    Default: {SYSTEM_DEFAULTS[type]} days
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LeaveTypeSettings;
