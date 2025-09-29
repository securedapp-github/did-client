import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Dropzone from '../components/Dropzone';

const Templates = () => {
  const handleFiles = (files) => {
    // TODO: parse and preview
    console.log('Uploaded files:', files);
  };
  return (
    <Layout>
      <div>
        <PageHeader
          title="Degree Templates"
          subtitle="Download the standardized CSV and upload filled files for preview."
          actions={<Button className="sm:w-auto">Download Template</Button>}
        />
        <div className="bg-white p-4 md:p-6 rounded shadow">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Upload Filled Template</h3>
          <Dropzone onFiles={handleFiles} />
          <div className="mt-4 flex gap-3">
            <Button className="sm:w-auto">Upload & Preview</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Templates;
