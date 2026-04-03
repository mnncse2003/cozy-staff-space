import Layout from '@/components/Layout';
import LeaveManagementComponent from '@/components/dashboard/admin/LeaveManagement';
import LeaveTypeSettings from '@/components/dashboard/admin/LeaveTypeSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LeaveManagement = () => {
  return (
    <Layout pageTitle="Leave Management">
      <div className="space-y-4 p-4 sm:p-6">
        <Tabs defaultValue="balances">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="balances">Employee Balances</TabsTrigger>
            <TabsTrigger value="defaults">Leave Type Defaults</TabsTrigger>
          </TabsList>
          <TabsContent value="balances">
            <LeaveManagementComponent />
          </TabsContent>
          <TabsContent value="defaults">
            <LeaveTypeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LeaveManagement;
