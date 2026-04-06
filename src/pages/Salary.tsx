import Layout from '@/components/Layout';
import { Skeleton } from 'boneyard-js/react';
import { useState, useEffect } from 'react';
import SalaryTab from '@/components/dashboard/employee/SalaryTab';
import { SalaryTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Salary = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout pageTitle="Salary">
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton name="salary-tab" loading={!loaded} fallback={<SalaryTabSkeleton />}>
          <SalaryTab />
        </Skeleton>
      </div>
    </Layout>
  );
};

export default Salary;
