import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import LeaveTab from '@/components/dashboard/employee/LeaveTab';
import { LeaveTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Leave = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout pageTitle="Leave">
      <div className="space-y-4 p-4 sm:p-6">
        {!loaded ? <LeaveTabSkeleton /> : <LeaveTab />}
      </div>
    </Layout>
  );
};

export default Leave;
