import React from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

const Degrees = () => {
  const mockDegrees = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Issued', date: '2023-10-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', date: '2023-10-02' },
  ];

  return (
    <Layout>
      <div>
        <PageHeader title="Issued Degrees" subtitle="Search, filter, and manage issued verifiable credentials" />
        <div className="bg-white p-4 md:p-6 rounded shadow overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockDegrees.map((degree) => (
                <tr key={degree.id} className="border-b">
                  <td className="p-2">{degree.name}</td>
                  <td className="p-2">{degree.email}</td>
                  <td className="p-2">{degree.status}</td>
                  <td className="p-2">{degree.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Degrees;
