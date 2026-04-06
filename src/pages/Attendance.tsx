import Layout from '@/components/Layout';
import { Skeleton } from 'boneyard-js/react';
import { useState } from 'react';
import AttendanceTab from '@/components/dashboard/employee/AttendanceTab';
import AttendanceRequests from '@/components/dashboard/employee/AttendanceRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText } from 'lucide-react';
import { AttendanceTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Attendance = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Layout pageTitle="Attendance">
      <div className="space-y-4 p-4 sm:p-6">
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="attendance">
            <Skeleton name="attendance-tab" loading={!loaded} fallback={<AttendanceTabSkeleton />}>
              <AttendanceTab onLoad={() => setLoaded(true)} />
            </Skeleton>
          </TabsContent>
          <TabsContent value="requests">
            <AttendanceRequests />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Attendance;
