import React, { useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';

const Verification = () => {
  const [vcHash, setVcHash] = useState('');
  const [result, setResult] = useState('');

  const handleVerify = () => {
    // Mock verification
    setResult(vcHash ? 'Verification Successful: DID is valid.' : 'Invalid hash.');
  };

  return (
    <Layout>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Degree Verification</h2>
        <div className="bg-white p-4 md:p-6 rounded shadow">
          <p className="mb-4">Enter the VC hash or JSON to verify the degree's authenticity.</p>
          <input
            type="text"
            placeholder="VC Hash or JSON"
            value={vcHash}
            onChange={(e) => setVcHash(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <Button onClick={handleVerify}>Verify</Button>
          {result && <p className="mt-4 text-green-600">{result}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default Verification;
