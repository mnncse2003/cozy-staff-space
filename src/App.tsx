import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Suspense, lazy } from "react";

// Lazy load page components
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const SuperAdminSetup = lazy(() => import("./pages/SuperAdminSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Leave = lazy(() => import("./pages/Leave"));
const Salary = lazy(() => import("./pages/Salary"));
const Report = lazy(() => import("./pages/Report"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/admin/Employees"));
const EmployeeDetails = lazy(() => import("./pages/admin/EmployeeDetails"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const LeaveApprovals = lazy(() => import("./pages/admin/LeaveApprovals"));
const LeaveManagement = lazy(() => import("./pages/admin/LeaveManagement"));
const AttendanceManagement = lazy(() => import("./pages/admin/AttendanceManagement"));
const AttendanceReportAdmin = lazy(() => import("./pages/admin/AttendanceReport"));
const EmployeeDirectory = lazy(() => import("./pages/EmployeeDirectory"));
const Holidays = lazy(() => import("./pages/admin/Holidays"));
const SalarySlips = lazy(() => import("./pages/admin/SalarySlips"));
const ExitManagement = lazy(() => import("./pages/admin/ExitManagement"));
const Exit = lazy(() => import("./pages/Exit"));
const Helpdesk = lazy(() => import("./pages/Helpdesk"));
const SelfService = lazy(() => import("./pages/SelfService"));
const SelfServiceManagement = lazy(() => import("./pages/admin/SelfServiceManagement"));
const HRAnalytics = lazy(() => import("./pages/admin/HRAnalytics"));
const OrganizationManagement = lazy(() => import("./pages/admin/OrganizationManagement"));
const DeviceAccess = lazy(() => import("./pages/admin/DeviceAccess"));
const Notifications = lazy(() => import("./pages/admin/Notifications"));
const Chat = lazy(() => import("./pages/Chat"));
const ShiftManagement = lazy(() => import("./pages/admin/ShiftManagement"));
const FaceEnrollment = lazy(() => import("./pages/admin/FaceEnrollment"));
const FaceAttendance = lazy(() => import("./pages/admin/FaceAttendance"));
const FaceEnrollmentManagement = lazy(() => import("./pages/admin/FaceEnrollmentManagement"));
const InstallApp = lazy(() => import("./components/InstallApp"));
const Account = lazy(() => import("./pages/Account"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const SubscriptionManagement = lazy(() => import("./pages/admin/SubscriptionManagement"));
const Pricing = lazy(() => import("./pages/Pricing"));
const MenuAccessControl = lazy(() => import("./pages/admin/MenuAccessControl"));
const BackupManagement = lazy(() => import("./pages/admin/BackupManagement"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route wrapper with lazy loading support
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Route wrapper with Suspense
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster position="top-right" />

        <HashRouter>
          <Routes>
            <Route path="/login" element={
              <LazyRoute>
                <Login />
              </LazyRoute>
            } />
            <Route path="/reset-password" element={
              <LazyRoute>
                <ResetPassword />
              </LazyRoute>
            } />
            <Route path="/admin-setup" element={
              <LazyRoute>
                <AdminSetup />
              </LazyRoute>
            } />
            <Route path="/super-admin-setup" element={
              <LazyRoute>
                <SuperAdminSetup />
              </LazyRoute>
            } />
            <Route path="/pricing" element={
              <LazyRoute>
                <Pricing />
              </LazyRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Dashboard />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Profile />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Attendance />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/leave" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Leave />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/salary" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Salary />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Report />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Settings />
                </LazyRoute>
              </ProtectedRoute>
            } />

            <Route path="/employees" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Employees />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={
              <ProtectedRoute>
                <LazyRoute>
                  <EmployeeDetails />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/departments" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Departments />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/leave-approvals" element={
              <ProtectedRoute>
                <LazyRoute>
                  <LeaveApprovals />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/leave-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <LeaveManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/attendance-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <AttendanceManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/attendance-report" element={
              <ProtectedRoute>
                <LazyRoute>
                  <AttendanceReportAdmin />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/employee-directory" element={
              <ProtectedRoute>
                <LazyRoute>
                  <EmployeeDirectory />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/holidays" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Holidays />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/salary-slips" element={
              <ProtectedRoute>
                <LazyRoute>
                  <SalarySlips />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/exit-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <ExitManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/exit" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Exit />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/helpdesk" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Helpdesk />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/self-service" element={
              <ProtectedRoute>
                <LazyRoute>
                  <SelfService />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/self-service-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <SelfServiceManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/hr-analytics" element={
              <ProtectedRoute>
                <LazyRoute>
                  <HRAnalytics />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/organizations" element={
              <ProtectedRoute>
                <LazyRoute>
                  <OrganizationManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/device-access" element={
              <ProtectedRoute>
                <LazyRoute>
                  <DeviceAccess />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Notifications />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Chat />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/shift-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <ShiftManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/face-enrollment" element={
              <ProtectedRoute>
                <LazyRoute>
                  <FaceEnrollment />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/face-attendance" element={
              <ProtectedRoute>
                <LazyRoute>
                  <FaceAttendance />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/face-enrollment-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <FaceEnrollmentManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <LazyRoute>
                  <Account />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/purchase-success" element={
              <LazyRoute>
                <PurchaseSuccess />
              </LazyRoute>
            } />
            <Route path="/subscription-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <SubscriptionManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />

            <Route path="/menu-access-control" element={
              <ProtectedRoute>
                <LazyRoute>
                  <MenuAccessControl />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/backup-management" element={
              <ProtectedRoute>
                <LazyRoute>
                  <BackupManagement />
                </LazyRoute>
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={
              <LazyRoute>
                <NotFound />
              </LazyRoute>
            } />
          </Routes>
        </HashRouter>
        
        <Suspense fallback={null}>
          <InstallApp />
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
