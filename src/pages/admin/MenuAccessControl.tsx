import { useState, useEffect } from 'react';
import { MenuAccessSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Shield, Save, Users, Building2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Organization {
  id: string;
  name: string;
}

type RoleType = 'staff' | 'hr' | 'hod';

const MENU_ITEMS = [
  { key: 'overview', label: 'Overview', roles: ['staff', 'hr', 'hod'] },
  { key: 'profile', label: 'Profile', roles: ['staff'] },
  { key: 'attendance', label: 'Attendance', roles: ['staff', 'hr', 'hod'] },
  { key: 'report', label: 'Report', roles: ['staff'] },
  { key: 'attendanceReport', label: 'Attendance Report', roles: ['staff', 'hr', 'hod'] },
  { key: 'employeeDirectory', label: 'Employee Directory', roles: ['staff', 'hr', 'hod'] },
  { key: 'leave', label: 'Leave', roles: ['staff', 'hr', 'hod'] },
  { key: 'salary', label: 'Salary', roles: ['staff'] },
  { key: 'chat', label: 'Chat', roles: ['staff', 'hr', 'hod'] },
  { key: 'exit', label: 'Exit / Resignation', roles: ['staff', 'hr', 'hod'] },
  { key: 'helpdesk', label: 'Helpdesk', roles: ['staff', 'hr', 'hod'] },
  { key: 'selfService', label: 'Self Service', roles: ['staff', 'hr', 'hod'] },
  { key: 'employees', label: 'Employees', roles: ['hr'] },
  { key: 'departments', label: 'Departments', roles: ['hr'] },
  { key: 'leaveApprovals', label: 'Leave Approvals', roles: ['hr', 'hod'] },
  { key: 'leaveManagement', label: 'Leave Management', roles: ['hr'] },
  { key: 'attendanceManagement', label: 'Attendance Management', roles: ['hr', 'hod'] },
  { key: 'holidays', label: 'Holidays', roles: ['hr'] },
  { key: 'salarySlips', label: 'Salary Slips', roles: ['hr'] },
  { key: 'exitManagement', label: 'Exit Management', roles: ['hr', 'hod'] },
  { key: 'notifications', label: 'Notifications', roles: ['hr'] },
  { key: 'selfServiceManagement', label: 'Self Service Management', roles: ['hr'] },
  { key: 'hrAnalytics', label: 'HR Analytics', roles: ['hr'] },
  { key: 'deviceAccess', label: 'Device Access', roles: ['hr'] },
  { key: 'shiftManagement', label: 'Shift Management', roles: ['hr', 'hod'] },
  { key: 'faceEnrollment', label: 'Face Enrollment', roles: ['hr'] },
  { key: 'faceEnrollmentManagement', label: 'Face Data Management', roles: ['hr'] },
  { key: 'faceAttendance', label: 'Face Attendance', roles: ['hr', 'hod'] },
];

const ALL_KEYS = MENU_ITEMS.map(m => m.key);

const getDefaultAccess = (): Record<RoleType, Record<string, boolean>> => ({
  staff: Object.fromEntries(ALL_KEYS.map(k => [k, true])),
  hr: Object.fromEntries(ALL_KEYS.map(k => [k, true])),
  hod: Object.fromEntries(ALL_KEYS.map(k => [k, true])),
});

const MenuAccessControl = () => {
  const { userRole } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('global');
  const [access, setAccess] = useState(getDefaultAccess());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    loadAccess();
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const snap = await getDocs(collection(db, 'organizations'));
      const orgs = snap.docs.map(d => ({ id: d.id, name: d.data().name || 'Unnamed' }));
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const loadAccess = async () => {
    setLoading(true);
    try {
      const docId = selectedOrgId === 'global' ? 'global_menu_access' : `${selectedOrgId}_menu_access`;
      const snap = await getDoc(doc(db, 'system_settings', docId));
      if (snap.exists()) {
        const data = snap.data();
        setAccess({
          staff: { ...getDefaultAccess().staff, ...data.staff },
          hr: { ...getDefaultAccess().hr, ...data.hr },
          hod: { ...getDefaultAccess().hod, ...data.hod },
        });
      } else {
        setAccess(getDefaultAccess());
      }
    } catch (error) {
      console.error('Error loading menu access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docId = selectedOrgId === 'global' ? 'global_menu_access' : `${selectedOrgId}_menu_access`;
      await setDoc(doc(db, 'system_settings', docId), {
        ...access,
        updatedAt: new Date().toISOString(),
        scope: selectedOrgId,
      });
      toast.success('Menu access settings saved');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAccess(getDefaultAccess());
    toast.success('Reset to defaults');
  };

  const toggleAccess = (role: RoleType, key: string) => {
    setAccess(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }));
  };

  const roleLabels: Record<RoleType, string> = {
    staff: 'Employee / Intern',
    hr: 'HR Admin',
    hod: 'HOD',
  };

  const roleIcons: Record<RoleType, typeof Users> = {
    staff: Users,
    hr: Shield,
    hod: Building2,
  };

  if (userRole !== 'super-admin') {
    return (
      <Layout pageTitle="Access Denied">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Only Super Admin can access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Menu Access Control">
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Menu Access Control
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure sidebar menu visibility per role. Global settings apply to all organizations unless overridden.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Scope selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-sm font-medium whitespace-nowrap">Apply settings to:</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">🌐 Global (All Organizations)</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>🏢 {org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="w-fit">
                {selectedOrgId === 'global' ? 'Global' : organizations.find(o => o.id === selectedOrgId)?.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <MenuAccessSkeleton />
          </div>
        ) : (
          <Tabs defaultValue="staff">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="staff">Employee</TabsTrigger>
              <TabsTrigger value="hr">HR Admin</TabsTrigger>
              <TabsTrigger value="hod">HOD</TabsTrigger>
            </TabsList>

            {(['staff', 'hr', 'hod'] as RoleType[]).map(role => {
              const Icon = roleIcons[role];
              const applicableItems = MENU_ITEMS.filter(m => m.roles.includes(role));

              return (
                <TabsContent key={role} value={role}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {roleLabels[role]} Menu Access
                      </CardTitle>
                      <CardDescription>
                        Toggle which sidebar links are visible for {roleLabels[role]} users
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {applicableItems.map((item, idx) => (
                        <div key={item.key}>
                          <div className="flex items-center justify-between py-3">
                            <Label className="text-sm cursor-pointer">{item.label}</Label>
                            <Switch
                              checked={access[role][item.key] ?? true}
                              onCheckedChange={() => toggleAccess(role, item.key)}
                            />
                          </div>
                          {idx < applicableItems.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default MenuAccessControl;
