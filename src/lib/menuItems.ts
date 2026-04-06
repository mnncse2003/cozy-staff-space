import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  Settings,
  Building2,
  UserCog,
  CalendarCheck,
  MessageSquare,
  FileBarChart,
  BarChart3,
  Building,
  Shield,
  Bell,
  Timer,
  ScanFace,
  UserCheck,
  CreditCard,
  Menu,
  HardDrive,
  LucideIcon,
} from 'lucide-react';

export type RoleType = 'staff' | 'hr' | 'hod' | 'intern' | 'super-admin';

export interface MenuItem {
  id: string;
  key: string;
  label: string;
  icon: LucideIcon;
  roles: RoleType[];
  group: 'super-admin' | 'personal' | 'admin' | 'account';
}

// Single source of truth for all menu items
export const ALL_MENU_ITEMS: MenuItem[] = [
  // Super admin items
  { id: '/dashboard', key: 'overview', label: 'Dashboard', icon: LayoutDashboard, roles: ['super-admin'], group: 'super-admin' },
  { id: '/admin/organizations', key: 'organizations', label: 'Organizations', icon: Building, roles: ['super-admin'], group: 'super-admin' },
  { id: '/subscription-management', key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['super-admin'], group: 'super-admin' },
  { id: '/menu-access-control', key: 'menuAccess', label: 'Menu Access', icon: Menu, roles: ['super-admin'], group: 'super-admin' },
  { id: '/backup-management', key: 'backupManagement', label: 'Backup & Storage', icon: HardDrive, roles: ['super-admin'], group: 'super-admin' },
  { id: '/settings', key: 'systemSettings', label: 'System Settings', icon: Settings, roles: ['super-admin'], group: 'super-admin' },

  // Personal items (staff, hr, hod, intern)
  { id: '/dashboard', key: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/profile', key: 'profile', label: 'Profile', icon: UserCog, roles: ['staff', 'intern'], group: 'personal' },
  { id: '/attendance', key: 'attendance', label: 'Attendance', icon: Clock, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/report', key: 'report', label: 'Report', icon: FileText, roles: ['staff', 'intern'], group: 'personal' },
  { id: '/attendance-report', key: 'attendanceReport', label: 'Attendance Report', icon: FileBarChart, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/employee-directory', key: 'employeeDirectory', label: 'Employee Directory', icon: Users, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/leave', key: 'leave', label: 'Leave', icon: Calendar, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/salary', key: 'salary', label: 'Salary', icon: DollarSign, roles: ['staff', 'intern'], group: 'personal' },
  { id: '/chat', key: 'chat', label: 'Chat', icon: MessageSquare, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/exit', key: 'exit', label: 'Exit / Resignation', icon: UserCog, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/helpdesk', key: 'helpdesk', label: 'Helpdesk', icon: MessageSquare, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },
  { id: '/self-service', key: 'selfService', label: 'Self Service', icon: FileText, roles: ['staff', 'hr', 'hod', 'intern'], group: 'personal' },

  // Admin tools (hr, hod only)
  { id: '/employees', key: 'employees', label: 'Employees', icon: Users, roles: ['hr'], group: 'admin' },
  { id: '/departments', key: 'departments', label: 'Departments', icon: Building2, roles: ['hr'], group: 'admin' },
  { id: '/leave-approvals', key: 'leaveApprovals', label: 'Leave Approvals', icon: CalendarCheck, roles: ['hr', 'hod'], group: 'admin' },
  { id: '/leave-management', key: 'leaveManagement', label: 'Leave Management', icon: Calendar, roles: ['hr'], group: 'admin' },
  { id: '/attendance-management', key: 'attendanceManagement', label: 'Attendance Mgmt', icon: Clock, roles: ['hr', 'hod'], group: 'admin' },
  { id: '/shift-management', key: 'shiftManagement', label: 'Shift Management', icon: Timer, roles: ['hr', 'hod'], group: 'admin' },
  { id: '/holidays', key: 'holidays', label: 'Holidays', icon: Calendar, roles: ['hr'], group: 'admin' },
  { id: '/salary-slips', key: 'salarySlips', label: 'Salary Slips', icon: DollarSign, roles: ['hr'], group: 'admin' },
  { id: '/exit-management', key: 'exitManagement', label: 'Exit Management', icon: UserCog, roles: ['hr', 'hod'], group: 'admin' },
  { id: '/notifications', key: 'notifications', label: 'Notifications', icon: Bell, roles: ['hr'], group: 'admin' },
  { id: '/self-service-management', key: 'selfServiceManagement', label: 'Self Service Mgmt', icon: Settings, roles: ['hr'], group: 'admin' },
  { id: '/hr-analytics', key: 'hrAnalytics', label: 'HR Analytics', icon: BarChart3, roles: ['hr'], group: 'admin' },
  { id: '/device-access', key: 'deviceAccess', label: 'Device Access', icon: Shield, roles: ['hr'], group: 'admin' },
  { id: '/face-enrollment', key: 'faceEnrollment', label: 'Face Enrollment', icon: ScanFace, roles: ['hr'], group: 'admin' },
  { id: '/face-enrollment-management', key: 'faceEnrollmentManagement', label: 'Face Data Mgmt', icon: UserCheck, roles: ['hr'], group: 'admin' },
  { id: '/face-attendance', key: 'faceAttendance', label: 'Face Attendance', icon: ScanFace, roles: ['hr', 'hod'], group: 'admin' },

  // Account (hr only)
  { id: '/account', key: 'account', label: 'Account', icon: CreditCard, roles: ['hr'], group: 'account' },
];

/**
 * Get visible menu items for a given role, filtered by user preferences and admin access control.
 */
export function getVisibleMenuItems(
  role: string,
  menuPreferences: Record<string, boolean>,
  adminAccessControl: Record<string, boolean> | null
): MenuItem[] {
  const normalizedRole = role === 'intern' ? 'staff' : role;

  return ALL_MENU_ITEMS.filter(item => {
    // Role check
    if (!item.roles.includes(normalizedRole as RoleType)) return false;

    // Super admin items are always visible
    if (item.group === 'super-admin') return true;

    // Account items always visible (no access control)
    if (item.group === 'account') return true;

    // User preference check
    if (menuPreferences[item.key] === false) return false;

    // Admin access control check
    if (adminAccessControl && adminAccessControl[item.key] === false) return false;

    return true;
  });
}

/**
 * Get all configurable menu keys (non-super-admin, non-account) for the MenuAccessControl page.
 */
export function getConfigurableMenuItems(): Pick<MenuItem, 'key' | 'label' | 'roles'>[] {
  return ALL_MENU_ITEMS
    .filter(item => item.group !== 'super-admin' && item.group !== 'account')
    .reduce((acc, item) => {
      // Deduplicate by key (overview appears in both personal for multiple roles)
      if (!acc.find(a => a.key === item.key)) {
        acc.push({ key: item.key, label: item.label, roles: item.roles.filter(r => r !== 'intern') as RoleType[] });
      } else {
        // Merge roles
        const existing = acc.find(a => a.key === item.key)!;
        item.roles.forEach(r => {
          if (r !== 'intern' && !existing.roles.includes(r as any)) {
            (existing.roles as string[]).push(r);
          }
        });
      }
      return acc;
    }, [] as { key: string; label: string; roles: RoleType[] }[]);
}
