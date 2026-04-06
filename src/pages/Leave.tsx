import Layout from '@/components/Layout';
import { Skeleton } from 'boneyard-js/react';
import { useState, useEffect } from 'react';
import LeaveTab from '@/components/dashboard/employee/LeaveTab';
import { LeaveTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Leave = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Allow child component to mount and render
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout pageTitle="Leave">
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton name="leave-tab" loading={!loaded} fallback={<LeaveTabSkeleton />}>
          <LeaveTab />
        </Skeleton>
      </div>
    </Layout>
  );
};

export default Leave;
