import Layout from '@/components/Layout';
import { Skeleton } from 'boneyard-js/react';
import { useState } from 'react';
import ProfileTab from '@/components/dashboard/employee/ProfileTab';
import { ProfileTabSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Profile = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Layout pageTitle="Profile">
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton name="profile-tab" loading={!loaded} fallback={<ProfileTabSkeleton />}>
          <ProfileTab onLoad={() => setLoaded(true)} />
        </Skeleton>
      </div>
    </Layout>
  );
};

export default Profile;
