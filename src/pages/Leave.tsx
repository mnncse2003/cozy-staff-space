import Layout from '@/components/Layout';
import { Skeleton } from 'boneyard-js/react';
import { useState } from 'react';
import LeaveTab from '@/components/dashboard/employee/LeaveTab';
import { LeaveTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Leave = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Layout pageTitle="Leave">
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton name="leave-tab" loading={!loaded} fallback={<LeaveTabSkeleton />}>
          <LeaveTab onLoad={() => setLoaded(true)} />
        </Skeleton>
      </div>
    </Layout>
  );
};

export default Leave;
