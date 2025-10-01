import React from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Register from './Register';

const AccountCreate = () => {
  return (
    <Layout>
      <div>
        <PageHeader title="Account Creation" subtitle="Create a new institution account" />
        {/* Render the existing Register page content inside the dashboard layout */}
        <div className="mt-4">
          <Register />
        </div>
      </div>
    </Layout>
  );
};

export default AccountCreate;
