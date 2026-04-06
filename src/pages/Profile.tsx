import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import ProfileTab from '@/components/dashboard/employee/ProfileTab';
import { ProfileTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Profile = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout pageTitle="Profile">
      <div className="space-y-4 p-4 sm:p-6">
        {!loaded ? <ProfileTabSkeleton /> : <ProfileTab />}
      </div>
    </Layout>
  );
};

export default Profile;
