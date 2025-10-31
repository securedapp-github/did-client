import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Dropzone from '../components/Dropzone';
import { uploadDegreeBatch, getDegreeTemplate, listUploads, listDegreeBatches, getBatchStatus } from '../utils/api';
import { useAuthContext } from '../context/AuthContext';

const Templates = () => {
  const { user } = useAuthContext();
  const currentEmail = String(user?.email ?? '').trim().toLowerCase();
  const LS_KEY = currentEmail ? `x_did_uploaded_files:${currentEmail}` : 'x_did_uploaded_files:__anon__';
  const DOWNLOAD_KEY = currentEmail ? `x_did_template_downloads:${currentEmail}` : 'x_did_template_downloads:__anon__';
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); // persisted list of uploaded files
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [expanded, setExpanded] = useState({});
  const MAX_HISTORY = 50;
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [downloadHistoryLoaded, setDownloadHistoryLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // Degree Batches state (from server)
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);

  const pickNum = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  };

  const normalizeUpload = (raw) => {
    const base = raw?.data || raw || {};
    const summary = base?.summary || {};
    const total = pickNum(base, ['total','processed','total_records','totalProcessed','count'])
      ?? pickNum(summary, ['total']);
    const success = pickNum(base, ['success','success_count','succeeded','passed','ok','stored'])
      ?? pickNum(summary, ['stored']);
    const failed = pickNum(base, ['failed','failed_count','failure_count','errorsCount'])
      ?? pickNum(summary, ['failed']);
    const result = Array.isArray(base?.result)
      ? base.result
      : Array.isArray(base?.results)
        ? base.results
        : Array.isArray(base?.success_rows)
          ? base.success_rows
          : [];
    const errors = Array.isArray(base?.errors)
      ? base.errors
      : Array.isArray(base?.failed_rows)
        ? base.failed_rows
        : [];
    const message = raw?.message || base?.message || '';
    const providedCertificateSummary = base?.certificate_summary
      || summary?.certificate_summary
      || base?.data?.certificate_summary;

    let certificateSummary = providedCertificateSummary || {
      total_certificates: 0,
      matched: 0,
      unmatched: [],
      records_without_certificates: [],
    };

    if (!providedCertificateSummary) {
      const totalCertificates = pickNum(base, ['total_certificates', 'certificate_total'])
        ?? pickNum(summary, ['total_certificates', 'total', 'total_records']);
      const matchedCertificates = pickNum(base, ['stored', 'matched', 'success', 'success_count'])
        ?? pickNum(summary, ['stored', 'matched', 'success', 'success_count'])
        ?? (Array.isArray(result) ? result.length : null);
      const failedCertificates = pickNum(base, ['failed', 'failed_count'])
        ?? pickNum(summary, ['failed', 'failed_count'])
        ?? (Array.isArray(errors) ? errors.length : null);

      const computedTotal = totalCertificates
        ?? (Number.isFinite(matchedCertificates) || Number.isFinite(failedCertificates)
          ? (Number(matchedCertificates ?? 0) + Number(failedCertificates ?? 0))
          : 0);
      const computedMatched = Number.isFinite(matchedCertificates) ? matchedCertificates : 0;

      certificateSummary = {
        total_certificates: Math.max(0, computedTotal),
        matched: Math.max(0, computedMatched),
        unmatched: [],
        records_without_certificates: [],
      };
    }

    return { total, success, failed, result, errors, message, certificateSummary };
  };

  // Load from localStorage when email (key) changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUploadedFiles(parsed);
        else setUploadedFiles([]);
      } else {
        setUploadedFiles([]);
      }
      setHistoryLoaded(true);
    } catch {
      setUploadedFiles([]);
      setHistoryLoaded(true);
    }
    // Reset expansion state on email switch
    setExpanded({});
  }, [LS_KEY]);

  // Persist to localStorage whenever list changes (for this email only)
  useEffect(() => {
    if (!historyLoaded) return; // avoid overwriting before initial load
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(uploadedFiles));
    } catch {}
  }, [uploadedFiles, historyLoaded, LS_KEY]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DOWNLOAD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setDownloadHistory(parsed);
        else setDownloadHistory([]);
      } else {
        setDownloadHistory([]);
      }
      setDownloadHistoryLoaded(true);
    } catch {
      setDownloadHistory([]);
      setDownloadHistoryLoaded(true);
    }
  }, [DOWNLOAD_KEY]);

  useEffect(() => {
    if (!downloadHistoryLoaded) return;
    try {
      localStorage.setItem(DOWNLOAD_KEY, JSON.stringify(downloadHistory));
    } catch {}
  }, [downloadHistory, downloadHistoryLoaded, DOWNLOAD_KEY]);

  // Fetch uploads history from backend
  const fetchUploads = async () => {
    try {
      setSyncing(true);
      const res = await listUploads();
      const raw = res?.data;
      let items = [];
      if (Array.isArray(raw)) items = raw;
      else if (Array.isArray(raw?.data)) items = raw.data;
      else if (Array.isArray(raw?.uploads)) items = raw.uploads;
      else if (Array.isArray(raw?.data?.uploads)) items = raw.data.uploads;

      const mapped = (items || []).map((u) => ({
        name: u.fileName || u.originalName || u.name || 'uploaded-file',
        size: u.size || 0,
        at: new Date(u.uploadedAt || u.createdAt || u.updatedAt || Date.now()).getTime(),
        summary: {
          total: u.total ?? u.summary?.total ?? null,
          success: u.success ?? u.summary?.success ?? null,
          failed: u.failed ?? u.summary?.failed ?? null,
        },
        result: Array.isArray(u.result) ? u.result : Array.isArray(u.summary?.result) ? u.summary.result : [],
        errors: Array.isArray(u.errors) ? u.errors : Array.isArray(u.summary?.errors) ? u.summary.errors : [],
      }));

      if (mapped.length) {
        setUploadedFiles(mapped.slice(0, MAX_HISTORY));
      }
    } catch (e) {
      // Keep local list if server route doesn't exist
      console.warn('Failed to fetch uploads history from server; using local history.', e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch degree batches list
  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      setBatchesError('');
      const res = await listDegreeBatches(1, 50);
      const raw = res?.data;
      // Postman shape: { success: true, data: { batches: [...], pagination: {...} } }
      // Also accept a few tolerant shapes used by some backends
      const arr = raw?.data?.batches || raw?.batches || raw?.data || [];
      const list = Array.isArray(arr) ? arr.slice() : [];
      list.sort((a,b)=> new Date(b.created_at || b.createdAt || b.updated_at || 0) - new Date(a.created_at || a.createdAt || a.updated_at || 0));
      setBatches(list);
      return list;
    } catch (e) {
      const status = e?.response?.status;
      const msg = status === 401
        ? 'Sign in to view your degree batches.'
        : (e?.response?.data?.message || e?.message || 'Failed to load batches');
      setBatchesError(msg);
      return [];
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    // Reset selection when user switches
    setSelectedBatch(null);
    setBatchStatus(null);
    fetchBatches();
    // re-fetch if user context changes
  }, [currentEmail]);

  const handleFiles = (files, options = {}) => {
    const newFiles = Array.isArray(files) ? files : Array.from(files || []);

    setSelectedFiles((prevFiles) => {
      if (options.replace) {
        return newFiles;
      }

      const existingFiles = new Map(prevFiles.map((file) => [`${file.name}-${file.size}`, file]));
      newFiles.forEach((file) => {
        existingFiles.set(`${file.name}-${file.size}`, file);
      });
      return Array.from(existingFiles.values());
    });

    setUploadError('');
    setUploadResult(null);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    const filesToUpload = selectedFiles.slice();
    const displayName = filesToUpload.length === 1
      ? filesToUpload[0].name
      : `${filesToUpload[0].name} (+${filesToUpload.length - 1} more)`;
    const totalSize = filesToUpload.reduce((sum, file) => sum + (file?.size || 0), 0);
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError('');
      setUploadResult(null);
      const uploadStart = Date.now();
      const res = await uploadDegreeBatch(filesToUpload, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      });
      const raw = res?.data || { success: true };
      const norm = normalizeUpload(raw);
      setUploadResult({ data: norm, message: norm.message });
      // Save to session list
      setUploadedFiles((prev) => [
        {
          name: displayName,
          size: totalSize,
          at: Date.now(),
          summary: {
            total: norm.total,
            success: norm.success,
            failed: norm.failed,
          },
          certificates: {
            uploaded: norm.certificateSummary?.matched ?? 0,
            total: norm.certificateSummary?.total_certificates ?? 0,
            unmatched: norm.certificateSummary?.unmatched ?? [],
          },
          // store structured rows
          result: norm.result,
          errors: norm.errors,
        },
        ...prev,
      ].slice(0, MAX_HISTORY));
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      
      // Refresh batches shortly after upload and poll a few times until the new batch appears
      const tryPoll = async (attempt = 1) => {
        const fresh = await fetchBatches();
        // If batches already present and latest created_at is after uploadStart, stop polling
        const latestVal = Array.isArray(fresh) && fresh.length > 0 ? (fresh[0]?.created_at || fresh[0]?.createdAt) : null;
        const latestTs = latestVal ? new Date(latestVal).getTime() : 0;
        if (latestTs && latestTs >= uploadStart) return;
        if (attempt < 5) {
          setTimeout(() => tryPoll(attempt + 1), 1000 * attempt);
        }
      };
      setTimeout(() => void tryPoll(1), 800);
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const recordTemplateDownload = (filename, source) => {
    setDownloadHistory((prev) => [
      {
        name: filename,
        source,
        at: Date.now(),
      },
      ...prev,
    ].slice(0, MAX_HISTORY));
  };

  // Download template from backend; fallback to local CSV if server unavailable
  const downloadTemplate = async () => {
    try {
      const res = await getDegreeTemplate();
      const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'degree_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      recordTemplateDownload('degree_template.xlsx', 'server');
    } catch (e) {
      const headers = ['student_name','email','registration_number','year','course','status'];
      const csv = headers.join(',') + '\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'degree_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      recordTemplateDownload('degree_template.csv', 'fallback');
    }
  };

  const latestUpload = uploadedFiles?.[0];
  const lastUploadLabel = latestUpload ? new Date(latestUpload.at).toLocaleString() : 'No uploads yet';
  const lastDownload = downloadHistory?.[0];
  const lastDownloadLabel = lastDownload ? new Date(lastDownload.at).toLocaleString() : 'No template download yet';
  const recentDownloads = downloadHistory.slice(0, 3);

  return (
    <Layout>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-16 h-72 w-72 rounded-full bg-[#14B87D]/15 blur-3xl" />
          <div className="absolute bottom-[-200px] right-12 h-[420px] w-[420px] rounded-full bg-[#14B87D]/10 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6 p-4 md:p-6">
          <PageHeader
            title="Degree Templates"
            subtitle="Download the standardized CSV and upload filled files for preview."
            actions={
              <Button
                className="inline-flex items-center gap-2 rounded-full bg-[#14B87D] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95"
                onClick={downloadTemplate}
              >
                Download template
              </Button>
            }
          />

          <div className="overflow-hidden rounded-3xl border border-[#14B87D]/20 bg-gradient-to-br from-white via-white to-[#ecfdf5] px-6 py-6 shadow-[0_24px_70px_-40px_rgba(20,184,125,0.55)]">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Template workspace overview</h3>
                <p className="text-sm text-gray-700">
                  Use the latest CSV/XLSX definitions, upload filled rows, and track batch status without leaving the dashboard.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Last upload', value: lastUploadLabel },
                    { label: 'Last download', value: lastDownloadLabel },
                    { label: 'Files uploaded', value: uploadedFiles.length.toString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-[#14B87D]/20 bg-white/80 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 truncate" title={value}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900">Quick tips</h4>
                <ul className="mt-3 space-y-2 text-xs text-gray-700">
                  <li>✔️ Keep column headers unchanged to pass validation.</li>
                  <li>✔️ Attach certificates with matching filenames for automatic pairing.</li>
                  <li>✔️ Refresh the batches panel after each successful upload.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
              {uploading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
                  <div className="w-64 max-w-full">
                    <div className="h-2 rounded bg-gray-200">
                      <div className="h-2 rounded bg-[#14B87D]" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <div className="mt-2 text-center text-xs text-gray-700">Uploading… {uploadProgress}%</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload filled template</h3>
                  <p className="text-sm text-gray-600">Drag and drop CSV/XLSX files (and optional certificates) to validate and preview before issuance.</p>
                </div>
                <Dropzone onFiles={handleFiles} disabled={uploading} files={selectedFiles} />
                {uploadError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{uploadError}</div>
                )}

                {uploadResult && (
                  <div className="space-y-4 rounded-2xl border border-[#14B87D]/25 bg-[#ecfdf5]/60 px-4 py-4">
                    <div className="text-sm font-medium text-[#0b1d19]">Upload successful.</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-white/70 bg-white px-3 py-3 text-center shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Processed</p>
                        <p className="mt-2 text-xl font-semibold text-gray-900">{uploadResult?.data?.total ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white px-3 py-3 text-center shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Success</p>
                        <p className="mt-2 text-xl font-semibold text-[#14B87D]">{uploadResult?.data?.success ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white px-3 py-3 text-center shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Failed</p>
                        <p className="mt-2 text-xl font-semibold text-red-500">{uploadResult?.data?.failed ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white px-3 py-3 text-center shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Certificates</p>
                        <p className="mt-2 text-xl font-semibold text-blue-600">
                          {uploadResult?.data?.certificateSummary?.matched ?? 0}
                          <span className="ml-1 text-xs text-gray-500">
                            /{uploadResult?.data?.certificateSummary?.total_certificates ?? 0}
                          </span>
                        </p>
                      </div>
                    </div>

                    {uploadResult?.message && (
                      <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-gray-700">
                        {uploadResult.message}
                      </div>
                    )}

                    {Array.isArray(uploadResult?.data?.certificateSummary?.unmatched) && uploadResult.data.certificateSummary.unmatched.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {uploadResult.data.certificateSummary.unmatched.length} certificate(s) could not be matched to Excel rows.
                      </div>
                    )}

                    {Array.isArray(uploadResult?.data?.result) && uploadResult.data.result.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-white/60 bg-white px-3 py-3">
                        <h4 className="text-sm font-semibold text-gray-900">Successful Records</h4>
                        <ul className="divide-y divide-gray-100 text-sm text-gray-700">
                          {uploadResult.data.result.map((row, idx) => (
                            <li key={idx} className="py-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-[#14B87D]">{row?.student_name || 'N/A'}</p>
                                  <div className="text-xs text-gray-600">
                                    {row?.course ? `${row.course}` : ''} {row?.year ? `(${row.year})` : ''}
                                  </div>
                                  {row?.email && <div className="text-xs text-gray-600">Email: {row.email}</div>}
                                  {(row?.registration_number || row?.registrationNumber || row?.register_number || row?.registerNumber || row?.rollNo || row?.roll) && (
                                    <div className="text-xs text-gray-600">
                                      Reg #: {row.registration_number || row.registrationNumber || row.register_number || row.registerNumber || row.rollNo || row.roll}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">Row {row?.row ?? idx + 1}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(uploadResult?.data?.errors) && uploadResult.data.errors.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-white/60 bg-white px-3 py-3">
                        <h4 className="text-sm font-semibold text-gray-900">Errors</h4>
                        <ul className="divide-y divide-gray-100 text-sm text-gray-700">
                          {uploadResult.data.errors.map((err, idx) => (
                            <li key={idx} className="py-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-red-600">{err?.error || 'Validation error'}</p>
                                  {err?.data && (
                                    <div className="mt-1 text-xs text-gray-600">
                                      {Object.entries(err.data).map(([k, v]) => (
                                        <span key={k} className="mr-2">
                                          <span className="text-gray-500">{k}:</span> {String(v)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">Row {err?.row ?? idx + 1}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold"
                    disabled={!selectedFiles.length || uploading}
                    onClick={handleUpload}
                  >
                    {uploading ? 'Uploading…' : 'Upload & Preview'}
                  </Button>
                  <button
                    type="button"
                    className="text-sm font-medium text-[#14B87D] hover:underline"
                    onClick={() => handleFiles([], { replace: true })}
                    disabled={uploading || selectedFiles.length === 0}
                  >
                    Clear selected files
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-[#14B87D]/20 bg-white/95 p-6 shadow-sm backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900">Template download activity</h3>
                <p className="text-sm text-gray-600">Latest requests powering new data uploads.</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {recentDownloads.length > 0 ? (
                    recentDownloads.map((item, idx) => (
                      <li key={idx} className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-gray-900 truncate" title={item.name}>{item.name || 'degree_template'}</span>
                          <span className="text-xs text-gray-500">{item.source || 'server'}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">{new Date(item.at).toLocaleString()}</div>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-[#14B87D]/30 bg-white px-4 py-3 text-sm text-gray-600">
                      No template downloads recorded yet.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-3xl border border-[#14B87D]/20 bg-[#ecfdf5]/70 p-6 shadow-sm backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900">Need assistance?</h3>
                <p className="mt-2 text-sm text-gray-700">Schedule a working session with SecureDApp specialists.</p>
                <ul className="mt-3 space-y-2 text-xs text-gray-700">
                  <li>📞 Hotline: <a href="tel:+918800112233" className="text-[#14B87D] hover:underline">+91 8800 112 233</a></li>
                  <li>✉️ Email: <a href="mailto:hello@securedapp.io" className="text-[#14B87D] hover:underline">hello@securedapp.io</a></li>
                  <li>🗓️ Book: Use the dashboard calendar quick action.</li>
                </ul>
              </div>
            </aside>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Uploaded files history</h3>
                  <p className="text-sm text-gray-600">Persisted for this account and synced with the backend when available.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-3 py-1 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Clear uploaded files history for this account?')) {
                        setUploadedFiles([]);
                        try { localStorage.setItem(LS_KEY, JSON.stringify([])); } catch {}
                      }
                    }}
                  >
                    Clear history
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#14B87D]/30 px-3 py-1 text-[#14B87D] hover:bg-[#ecfdf5]"
                    onClick={fetchUploads}
                    disabled={syncing}
                  >
                    {syncing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {uploadedFiles.map((f, idx) => (
                  <li key={idx} className="rounded-2xl border border-gray-200 bg-white/95 shadow-sm">
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate" title={f.name}>{f.name}</p>
                        <p className="text-xs text-gray-500">{Math.ceil(f.size / 1024)} KB • {new Date(f.at).toLocaleString()}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold text-gray-900">{f.summary.total ?? '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2">
                          <p className="text-gray-500">Success</p>
                          <p className="font-semibold text-green-700">{f.summary.success ?? '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-gray-500">Failed</p>
                          <p className="font-semibold text-red-600">{f.summary.failed ?? '-'}</p>
                        </div>
                      </div>
                    </div>

                    {(Array.isArray(f.result) && f.result.length > 0) || (Array.isArray(f.errors) && f.errors.length > 0) ? (
                      <div className="px-4 pb-4">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <button
                            type="button"
                            className="text-[#14B87D] hover:underline"
                            onClick={() => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          >
                            {expanded[idx] ? 'Hide details' : 'View details'}
                          </button>
                          <button
                            type="button"
                            className="text-gray-500 hover:underline"
                            onClick={() => {
                              setUploadedFiles((prev) => {
                                const next = prev.filter((_, i) => i !== idx);
                                try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        {expanded[idx] && (
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {Array.isArray(f.result) && f.result.length > 0 && (
                              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                                <h4 className="text-sm font-semibold text-gray-900">Successful records</h4>
                                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                                  {f.result.slice(0, 5).map((row, rIdx) => (
                                    <li key={rIdx}>
                                      <p className="font-medium text-[#14B87D]">{row?.student_name || 'N/A'}</p>
                                      <p className="text-xs text-gray-600">
                                        {row?.course ? `${row.course}` : ''} {row?.year ? `(${row.year})` : ''}
                                      </p>
                                      {row?.email && <p className="text-xs text-gray-600">Email: {row.email}</p>}
                                    </li>
                                  ))}
                                  {f.result.length > 5 && (
                                    <li className="text-xs text-gray-500">+{f.result.length - 5} more…</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {Array.isArray(f.errors) && f.errors.length > 0 && (
                              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                                <h4 className="text-sm font-semibold text-gray-900">Errors</h4>
                                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                                  {f.errors.slice(0, 5).map((err, eIdx) => (
                                    <li key={eIdx}>
                                      <p className="font-medium text-red-600">{err?.error || 'Validation error'}</p>
                                      {err?.data && (
                                        <div className="text-xs text-gray-600">
                                          {Object.entries(err.data).map(([k, v]) => (
                                            <span key={k} className="mr-2">
                                              <span className="text-gray-500">{k}:</span> {String(v)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                  {f.errors.length > 5 && (
                                    <li className="text-xs text-gray-500">+{f.errors.length - 5} more…</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Degree batches</h3>
                <p className="text-sm text-gray-600">Fetched from the server to show the latest issuance progress.</p>
              </div>
              <Button className="rounded-full px-5 py-2 text-sm font-semibold" onClick={fetchBatches} disabled={batchesLoading}>
                {batchesLoading ? 'Loading…' : 'Refresh list'}
              </Button>
            </div>

            {batchesError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{batchesError}</div>
            )}

            {Array.isArray(batches) && batches.length > 0 ? (
              <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white/90">
                {batches.map((b, idx) => (
                  <li key={b.id ?? idx} className="p-4 text-sm text-gray-700">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate" title={b.batch_name || b.name || `Batch #${b.id}`}>{b.batch_name || b.name || `Batch #${b.id}`}</p>
                        <p className="text-xs text-gray-500">
                          Status: {b.upload_status || b.status || '-'} • Records: {b.total_records ?? '-'} • Created: {new Date(b.created_at || b.createdAt || b.updated_at || Date.now()).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-[#14B87D]/30 px-3 py-1 text-xs font-medium text-[#14B87D] hover:bg-[#ecfdf5]"
                        onClick={async () => {
                          setSelectedBatch(b);
                          setBatchStatus(null);
                          setBatchStatusLoading(true);
                          try {
                            const res = await getBatchStatus(b.id || b.batch_id || b.batchId);
                            setBatchStatus(res?.data?.data || res?.data || null);
                          } catch (e) {
                            setBatchStatus({ error: e?.response?.data?.message || e?.message || 'Failed to load status' });
                          } finally {
                            setBatchStatusLoading(false);
                          }
                        }}
                      >
                        View status
                      </button>
                    </div>

                    {selectedBatch && (selectedBatch.id ?? selectedBatch.batch_id) === (b.id ?? b.batch_id) && (
                      <div className="mt-3 rounded-2xl border border-[#14B87D]/20 bg-[#ecfdf5]/60 px-4 py-3 text-xs text-gray-800">
                        {batchStatusLoading ? (
                          <div className="text-gray-600">Loading status…</div>
                        ) : batchStatus?.error ? (
                          <div className="text-red-600">{batchStatus.error}</div>
                        ) : (
                          <div className="space-y-2">
                            <div><span className="text-gray-500">Upload status:</span> {batchStatus?.upload_status || '-'}</div>
                            <div><span className="text-gray-500">Total records:</span> {batchStatus?.total_records ?? '-'}</div>
                            {Array.isArray(batchStatus?.sample_degrees) && batchStatus.sample_degrees.length > 0 && (
                              <div>
                                <div className="text-gray-700">Sample degrees</div>
                                <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                  {batchStatus.sample_degrees.slice(0, 6).map((d, i) => (
                                    <li key={i} className="rounded-2xl border border-white/60 bg-white px-3 py-2">
                                      <p className="font-medium text-[#14B87D]">{d?.student_name || 'N/A'}</p>
                                      <p className="text-xs text-gray-600">{d?.degree_id || d?.id}</p>
                                      <p className="text-xs text-gray-500">Verification: {d?.verification_status || '-'}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#14B87D]/30 bg-white/80 px-4 py-4 text-sm text-gray-600">
                No batches found. Upload a template to generate your first batch.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Templates;
