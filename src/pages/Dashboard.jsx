import React from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

const Dashboard = () => {
  return (
    <Layout>
      <div>
        <PageHeader title="Dashboard Overview" subtitle="Key metrics and recent activity across the DID issuance workflow" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded shadow">
            <h3 className="text-lg font-semibold">Total Degrees Issued</h3>
            <p className="text-2xl font-bold text-blue-600">1,245</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded shadow">
            <h3 className="text-lg font-semibold">Pending Verifications</h3>
            <p className="text-2xl font-bold text-yellow-600">23</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded shadow">
            <h3 className="text-lg font-semibold">Templates Downloaded</h3>
            <p className="text-2xl font-bold text-green-600">156</p>
          </div>
        </div>
        <div className="mt-6 md:mt-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Recent Activity</h3>
          <ul className="bg-white p-4 rounded shadow">
            <li className="mb-2">Degree issued for John Doe - 2 hours ago</li>
            <li className="mb-2">Template downloaded by admin - 4 hours ago</li>
            <li>Verification completed for Jane Smith - 1 day ago</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
