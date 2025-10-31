import React, { useState, useCallback, useEffect } from 'react';

const Dropzone = ({
  onFiles,
  className = '',
  disabled = false,
  files,
  showSelection = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (!files) return;
    if (Array.isArray(files)) {
      setSelectedFiles(files);
    }
  }, [files]);

  const emitFiles = useCallback((nextFiles, options = {}) => {
    setSelectedFiles(nextFiles);
    if (onFiles) onFiles(nextFiles, options);
  }, [onFiles]);

  const mergeFiles = useCallback((incoming = []) => {
    const unique = new Map();
    [...selectedFiles, ...incoming].forEach((file) => {
      if (!file) return;
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (!unique.has(key)) unique.set(key, file);
    });
    const next = Array.from(unique.values());
    emitFiles(next);
  }, [selectedFiles, emitFiles]);

  const handleDragOver = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
  }, [disabled]);

  const handleDrop = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) mergeFiles(files);
  }, [mergeFiles, disabled]);

  const handleChange = (e) => {
    if (disabled) return;
    const files = Array.from(e.target.files || []);
    if (files.length) mergeFiles(files);
  };

  const removeFile = useCallback((index) => {
    emitFiles(selectedFiles.filter((_, idx) => idx !== index), { replace: true });
  }, [selectedFiles, emitFiles]);

  const clearAll = useCallback(() => {
    emitFiles([], { replace: true });
  }, [emitFiles]);

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors
                  ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  ${isDragging ? 'border-[#14B87D] bg-green-50' : 'border-gray-300'} ${className}`}
      >
        <p className="mb-3 text-gray-700">Drag and drop Excel/Certificate files here</p>
        <p className="mb-4 text-sm text-gray-500">or</p>
        <label className="inline-block">
          <span className={`px-4 py-2 bg-[#14B87D] text-white rounded-md ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:brightness-95'}`}>Browse Files</span>
          <input
            disabled={disabled}
            type="file"
            multiple
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf, image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {showSelection && selectedFiles.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Selected Files</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {selectedFiles.map((file, idx) => (
              <li key={`${file.name}_${file.size}_${file.lastModified}`} className="flex items-center justify-between gap-3">
                <span className="truncate" title={file.name}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-base leading-none text-gray-400 hover:text-red-500"
                  aria-label="Remove file"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
