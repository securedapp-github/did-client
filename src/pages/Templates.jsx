import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Dropzone from '../components/Dropzone';
import ProgressBar from '../components/ProgressBar';
import { uploadDegreeBatch, getDegreeTemplate, listUploads, listDegreeBatches, getBatchStatus, getBatchDegrees } from '../utils/api';
import { useAuthContext } from '../context/AuthContext';

const Templates = () => {
  const { user } = useAuthContext();
  const currentEmail = String(user?.email ?? '').trim().toLowerCase();
  const LS_KEY = currentEmail ? `x_did_uploaded_files:${currentEmail}` : 'x_did_uploaded_files:__anon__';
  const DOWNLOAD_KEY = currentEmail ? `x_did_template_downloads:${currentEmail}` : 'x_did_template_downloads:__anon__';
  const UPLOAD_SESSION_KEY = currentEmail ? `x_did_upload_session:${currentEmail}` : 'x_did_upload_session:__anon__';
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(null); // null | uploading | processing | completed
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); // persisted list of uploaded files
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState(null);
  const MAX_HISTORY = 50;
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [downloadHistoryLoaded, setDownloadHistoryLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // Degree Batches state (from server)
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState('');

  // Restore upload session on mount
  useEffect(() => {
    const restoreUploadSession = () => {
      try {
        const savedSession = localStorage.getItem(UPLOAD_SESSION_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session && session.status) {
            uploadSessionRef.current = session;
            syncHistoryFromSession(session);
            setUploadPhase(session.status);
            setUploadProgress(session.progress || 0);
            
            if (session.status === 'processing' || session.status === 'uploading') {
              setUploading(true);
              
              // If we have a batch ID, resume polling
              if (session.batchId) {
                activeBatchIdRef.current = session.batchId;
                scheduleStatusPolling(session.batchId);
              } else if (session.startedAt) {
                // Otherwise try to discover the batch
                startDiscoveryPolling(session.startedAt);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error restoring upload session:', err);
      }
    };

    restoreUploadSession();

    // Cleanup on unmount
    return () => {
      stopBatchPolling();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchDegrees, setBatchDegrees] = useState([]);
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);
  const pollTimerRef = useRef(null);
  const discoveryTimerRef = useRef(null);
  const activeBatchIdRef = useRef(null);
  const fallbackStatsRef = useRef(null);
  const processingStatsRef = useRef(null);
  const uploadStartRef = useRef(null);
  const uploadSessionRef = useRef(null);
  const toastTimerRef = useRef(null);
  const [processingStats, setProcessingStats] = useState(null);

  const updateProcessingStats = (next) => {
    const resolved = typeof next === 'function' ? next(processingStatsRef.current) : next;
    processingStatsRef.current = resolved;
    setProcessingStats(resolved);
    
    // Update progress based on processing stats if we have valid data
    if (resolved && typeof resolved.processed === 'number' && typeof resolved.total === 'number' && resolved.total > 0) {
      const progress = Math.min(100, Math.round((resolved.processed / resolved.total) * 100));
      setUploadProgress(progress);
      
      // If we've processed all items, mark as completed
      if (progress >= 100) {
        setUploadPhase('completed');
      }
    }
  };

  const previewDegrees = Array.isArray(batchDegrees) ? batchDegrees.slice(0, 6) : [];
  const hasMoreDegrees = Array.isArray(batchDegrees) && batchDegrees.length > previewDegrees.length;

  const stopStatusPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const stopDiscoveryPolling = () => {
    if (discoveryTimerRef.current) {
      clearTimeout(discoveryTimerRef.current);
      discoveryTimerRef.current = null;
    }
  };

  const stopBatchPolling = () => {
    stopStatusPolling();
    stopDiscoveryPolling();
    activeBatchIdRef.current = null;
  };

  const mergeHistoryItems = (existing = {}, incoming = {}) => {
    const next = { ...existing };

    Object.entries(incoming).forEach(([key, value]) => {
      if (value === undefined) return;

      if (key === 'summary' || key === 'certificates') {
        const prevSection = existing[key] || {};
        next[key] = value === null ? null : { ...prevSection, ...value };
      } else if (key === 'result' || key === 'errors') {
        next[key] = Array.isArray(value) ? value : [];
      } else if (key === 'at') {
        next[key] = value || existing[key] || Date.now();
      } else {
        next[key] = value;
      }
    });

    return next;
  };

  const upsertHistoryEntry = (entry) => {
    if (!entry) return;
    const normalized = {
      ...entry,
      at: entry.at || Date.now(),
    };

    setUploadedFiles((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const index = list.findIndex((item) => (
        (normalized.batchId && item.batchId === normalized.batchId) ||
        (normalized.sessionId && item.sessionId === normalized.sessionId)
      ));

      if (index >= 0) {
        const merged = mergeHistoryItems(list[index], normalized);
        if (!merged.sessionId && normalized.sessionId) merged.sessionId = normalized.sessionId;
        if (!merged.batchId && normalized.batchId) merged.batchId = normalized.batchId;
        list[index] = merged;
      } else {
        list.unshift(normalized);
      }

      list.sort((a, b) => (b.at || 0) - (a.at || 0));
      return list.slice(0, MAX_HISTORY);
    });
  };

  const syncHistoryFromSession = (session) => {
    if (!session) return;
    const historyEntry = {
      sessionId: session.sessionId || session.startedAt || session.lastUpdated,
      batchId: session.batchId || null,
      name: session.fileName,
      size: session.fileSize,
      at: session.startedAt || session.lastUpdated || Date.now(),
      status: session.status,
      progress: typeof session.progress === 'number' ? session.progress : undefined,
      fileCount: session.fileCount,
      lastUpdated: session.lastUpdated,
    };

    if (session.stats) {
      historyEntry.summary = {
        total: session.stats.total,
        success: session.stats.successful ?? session.stats.success,
        failed: session.stats.failed,
        skipped: session.stats.skipped,
        processed: session.stats.processed,
      };
    }

    upsertHistoryEntry(historyEntry);
  };

  const saveUploadSession = (updates, { replace = false } = {}) => {
    if (!updates) {
      const existingSession = uploadSessionRef.current;
      uploadSessionRef.current = null;
      try {
        localStorage.removeItem(UPLOAD_SESSION_KEY);
      } catch {}
      return existingSession;
    }

    const base = replace ? {} : (uploadSessionRef.current || {});
    const nextSession = {
      ...base,
      ...updates,
    };

    if (!nextSession.sessionId) {
      nextSession.sessionId = nextSession.startedAt || Date.now();
    }

    uploadSessionRef.current = nextSession;
    try {
      localStorage.setItem(UPLOAD_SESSION_KEY, JSON.stringify(nextSession));
    } catch {}
    syncHistoryFromSession(nextSession);
    return nextSession;
  };

  const resetUploadIndicators = () => {
    stopBatchPolling();
    setUploading(false);
    setUploadPhase(null);
    setUploadProgress(0);
    updateProcessingStats(null);
  };

  const finalizeUpload = ({ toastMessage, toastType = 'success' } = {}) => {
    // Don't reset indicators immediately, let the effect handle it after showing the toast
    const message = toastMessage || (toastType === 'success' 
      ? 'Degrees processed successfully.' 
      : 'Degree upload update.');
    
    setToast({ type: toastType, message });
    
    // Set a timer to reset indicators after toast is shown
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    toastTimerRef.current = setTimeout(() => {
      resetUploadIndicators();
      saveUploadSession(null);
      toastTimerRef.current = null;
    }, 5000); // Match this with your toast auto-hide duration
  };

  const scheduleStatusPolling = (batchId) => {
    if (!batchId) return;
    if (activeBatchIdRef.current === batchId && pollTimerRef.current) return;
    activeBatchIdRef.current = batchId;
    stopStatusPolling();

    const pollStatus = async () => {
      try {
        const fallback = fallbackStatsRef.current || {};
        const statusRes = await getBatchStatus(batchId);
        const statusData = statusRes?.data?.data || statusRes?.data || {};
        
        // Get the current time for the session update
        const now = Date.now();
        
        // Get total records from response or fallback
        const total = Number(statusData?.total_records) || fallback.total || processingStatsRef.current?.total || 0;
        
        // Get processed records count
        const processedValue = Number(statusData?.processed_records) || 0;
        const successfulValue = Number(statusData?.successful_records) || 0;
        const failedValue = Number(statusData?.failed_records) || 0;
        const skippedValue = Number(statusData?.skipped_records) || 0;

        // Calculate progress percentage
        let progress = 0;
        if (total > 0) {
          progress = Math.min(100, Math.round((processedValue / total) * 100));
        } else if (processedValue > 0) {
          // If we don't have a total but have processed some, show at least 1% progress
          progress = Math.min(99, Math.max(1, Math.round(processedValue / 10)));
        }

        // Update UI with new progress
        setUploadProgress(progress);
        setUploadPhase('processing');

        // Update processing stats
        const nextStats = {
          total,
          processed: processedValue,
          successful: successfulValue,
          failed: failedValue,
          skipped: skippedValue,
        };

        // Update the session in localStorage
        saveUploadSession({
          status: 'processing',
          progress,
          lastUpdated: now,
          stats: nextStats,
        });

        updateProcessingStats(nextStats);
        fallbackStatsRef.current = nextStats;

        // Check if processing is complete
        if (progress >= 100 || (total > 0 && processedValue >= total)) {
          setUploadPhase('completed');
          finalizeUpload({
            toastMessage: 'Degree processing completed successfully!',
            toastType: 'success'
          });
          return;
        }
      } catch (err) {
        console.warn('Failed to poll batch status:', err?.message || err);
        // If we encounter an error, we'll still continue polling in case it's temporary
      }

      // Continue polling if we still have the same batch ID
      if (activeBatchIdRef.current === batchId) {
        pollTimerRef.current = setTimeout(pollStatus, 2000);
      }
    };

    // Start polling
    pollStatus();
  };

  const startDiscoveryPolling = (startedAt) => {
    stopDiscoveryPolling();
    const lookback = startedAt ? startedAt - 5000 : Date.now() - 5000;

    const discover = async () => {
      try {
        const res = await listDegreeBatches(1, 10);
        const payload = res?.data?.data || res?.data || {};
        const batchesList = Array.isArray(payload?.batches) ? payload.batches : [];
        const found = batchesList.find((batch) => {
          const created = new Date(batch?.created_at || batch?.createdAt || batch?.updated_at || 0).getTime();
          return created && created >= lookback;
        });

        if (found) {
          stopDiscoveryPolling();
          const stats = {
            total: Number(found?.total_records) || fallbackStatsRef.current?.total || 0,
            processed: Number(found?.processed_records) || fallbackStatsRef.current?.processed || 0,
            successful: Number(found?.successful_records) || fallbackStatsRef.current?.successful || 0,
            failed: Number(found?.failed_records) || fallbackStatsRef.current?.failed || 0,
            skipped: Number(found?.skipped_records) || fallbackStatsRef.current?.skipped || 0,
          };

          fallbackStatsRef.current = { ...fallbackStatsRef.current, ...stats };
          if (stats.total > 0) {
            updateProcessingStats((prev) => ({ ...stats, ...prev }));
            const percent = stats.total > 0 ? Math.round((Math.min(stats.processed, stats.total) / stats.total) * 100) : 0;
            setUploadProgress((prev) => Math.max(prev, Math.min(100, Math.max(0, percent))));
            setUploadPhase((prev) => (percent >= 100 ? 'completed' : 'processing'));
            uploadSessionRef.current = {
              status: percent >= 100 ? 'completed' : 'processing',
              progress: percent,
              total: stats.total,
              processed: stats.processed,
            };
            try {
              localStorage.setItem(UPLOAD_SESSION_KEY, JSON.stringify(uploadSessionRef.current));
            } catch {}
          }

          const batchId = found?.id || found?.batch_id || found?.batchId;
          scheduleStatusPolling(batchId);
          return;
        }
      } catch (err) {
        console.warn('Failed to discover new batch:', err?.message || err);
      }

      if (uploading) {
        discoveryTimerRef.current = setTimeout(discover, 1500);
      }
    };

    discover();
  };

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
    const processed = pickNum(base, ['processed','processed_records','processedCount','processed_total'])
      ?? pickNum(summary, ['processed','processed_records']);
    const skipped = pickNum(base, ['skipped','skipped_records'])
      ?? pickNum(summary, ['skipped','skipped_records']);
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
    const skippedRecords = Array.isArray(base?.skipped_records)
      ? base.skipped_records
      : Array.isArray(summary?.skipped_records)
        ? summary.skipped_records
        : [];
    const validationErrors = Array.isArray(base?.validation_errors)
      ? base.validation_errors
      : Array.isArray(summary?.validation_errors)
        ? summary.validation_errors
        : [];
    const code = base?.error || base?.code || raw?.error || raw?.code || null;
    const status = raw?.status || base?.status || null;
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

    return {
      total,
      success,
      failed,
      processed,
      skipped,
      result,
      errors,
      message,
      certificateSummary,
      skippedRecords,
      validationErrors,
      code,
      status,
    };
  };

  const normalizeUploadError = (error) => {
    const response = error?.response;
    const status = response?.status ?? null;
    const data = response?.data ?? {};
    const message = data?.message || error?.message || 'Upload failed';
    const code = data?.error || data?.code || error?.code || null;
    const validationErrors = Array.isArray(data?.validation_errors)
      ? data.validation_errors
      : [];
    const rowErrors = Array.isArray(data?.errors)
      ? data.errors
      : [];
    const skippedRecords = Array.isArray(data?.skipped_records)
      ? data.skipped_records
      : [];
    const certificateSummary = data?.certificate_summary || null;

    const details = [];
    if (code === 'NO_FILES') {
      details.push('No files were detected. Please select an Excel file and/or certificate files before uploading.');
    } else if (code === 'UNAUTHORIZED' || status === 401 || error?.isAuthError) {
      details.push('Your session may have expired. Please sign in again to continue.');
    } else if (code === 'FILE_TOO_LARGE') {
      details.push('One or more files exceed the 10MB limit. Remove large files and try again.');
    } else if (code === 'TOO_MANY_FILES') {
      details.push('A maximum of 100 files can be uploaded at once. Reduce the number of files and retry.');
    } else if (code === 'EMPTY_EXCEL_FILE') {
      details.push('The uploaded Excel file has no worksheets. Ensure the template contains at least one sheet with data.');
    } else if (code === 'NO_DATA_IN_EXCEL') {
      details.push('No data rows were found in the Excel sheet. Populate the template before uploading.');
    } else if (code === 'INVALID_REQUEST') {
      details.push('The upload request is invalid. Double-check the file selection and try again.');
    } else if (code === 'UPLOAD_ERROR' && status === 400) {
      details.push('The server rejected the upload. Confirm that the file format is supported and not corrupted.');
    } else if (code === 'IPFS_UPLOAD_FAILED' || /ipfs/i.test(message)) {
      details.push('Uploading to storage failed. Please retry after some time.');
    }

    if (!response && error?.message && !details.length) {
      details.push('Unable to reach the server. Check your internet connection and try again.');
    }

    if (validationErrors.length > 0 && !details.length) {
      details.push('Some rows failed validation. Review the row-level errors below.');
    }

    return {
      status,
      code,
      message,
      details,
      validationErrors,
      errors: rowErrors,
      skippedRecords,
      certificateSummary,
      raw: data,
    };
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

    setUploadError(null);
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
    let succeeded = false;
    
    // Clear any existing toast
    setToast(null);
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadPhase('uploading');
      setUploadError(null);
      setUploadResult(null);
      updateProcessingStats(null);
      fallbackStatsRef.current = null;
      stopBatchPolling();
      activeBatchIdRef.current = null;
      const uploadStart = Date.now();
      uploadStartRef.current = uploadStart;
      // Initialize upload session
      const initialSession = saveUploadSession({
        status: 'uploading',
        startedAt: uploadStart,
        progress: 0,
        total: 0,
        batchId: null,
        fileCount: filesToUpload.length,
        fileName: displayName,
        fileSize: totalSize,
        lastUpdated: Date.now()
      }, { replace: true });
      const res = await uploadDegreeBatch(filesToUpload, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          const safePct = Math.min(100, Math.max(0, pct));
          setUploadProgress(safePct);
          setUploadPhase(safePct >= 100 ? 'processing' : 'uploading');
          
          // Update upload session with progress
          saveUploadSession({
            status: safePct >= 100 ? 'processing' : 'uploading',
            progress: safePct,
            lastUpdated: Date.now(),
          });
        }
      });
      const raw = res?.data || { success: true };
      const norm = normalizeUpload(raw);
      const batchId = raw.batchId || raw.batch_id || norm.batchId || norm.batch_id;
      const totalFromSummary = Number(norm.total) || 0;
      const processedFromSummary = Number(norm.processed) || 0;
      const failedFromSummary = Number(norm.failed) || 0;
      const successFromSummary = Number(norm.success) || 0;
      const skippedFromSummary = Number(norm.skipped) || 0;
      
      const initialStats = {
        total: totalFromSummary,
        processed: totalFromSummary > 0 ? Math.min(processedFromSummary, totalFromSummary) : 0,
        successful: totalFromSummary > 0 ? Math.min(successFromSummary, totalFromSummary) : 0,
        failed: totalFromSummary > 0 ? Math.min(failedFromSummary, totalFromSummary) : 0,
        skipped: Math.max(0, skippedFromSummary),
      };
      
      updateProcessingStats(initialStats);
      fallbackStatsRef.current = { ...initialStats };
      
      // Update session with batch ID and processing state
      saveUploadSession({
        status: 'processing',
        batchId: batchId || null,
        progress: initialStats.total > 0 ? Math.round((initialStats.processed / initialStats.total) * 100) : 0,
        total: totalFromSummary,
        processed: processedFromSummary,
        stats: initialStats,
        lastUpdated: Date.now(),
      });

      // Start polling for status updates if we have a batch ID
      if (batchId) {
        activeBatchIdRef.current = batchId;
        scheduleStatusPolling(batchId);
      } else if (totalFromSummary > 0) {
        // If no batch ID but we have a total, use the initial stats for progress
        const percent = Math.min(100, Math.max(0, Math.round((processedFromSummary / totalFromSummary) * 100)));
        setUploadProgress(percent);
        const isComplete = percent >= 100;
        setUploadPhase(isComplete ? 'completed' : 'processing');
        
        if (isComplete) {
          finalizeUpload();
        }
      } else {
        // Fallback to showing upload complete if we can't track progress
        setUploadProgress(100);
        setUploadPhase('completed');
        finalizeUpload();
      }

      upsertHistoryEntry({
        sessionId: initialSession?.sessionId,
        batchId: batchId || null,
        name: filesToUpload.map(file => file.name).join(', '),
        size: totalSize,
        at: initialSession?.startedAt || Date.now(),
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
        result: norm.result,
        errors: norm.errors,
        lastUpdated: Date.now(),
      });
      
      // Clear selected files after successful upload
      setSelectedFiles([]);

      const uploadedBatchId = raw?.data?.summary?.batch_id
        || raw?.summary?.batch_id
        || raw?.data?.batch_id
        || raw?.batch_id
        || null;

      if (uploadedBatchId) {
        scheduleStatusPolling(uploadedBatchId);
      } else {
        startDiscoveryPolling(uploadStart);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const normalized = normalizeUploadError(err);
      setUploadError(normalized);
      setUploadResult(null);
    } finally {
      if (!succeeded) {
        stopBatchPolling();
        setUploading(false);
        setUploadProgress(0);
        setUploadPhase(null);
        updateProcessingStats(null);
        uploadSessionRef.current = null;
        try { localStorage.removeItem(UPLOAD_SESSION_KEY); } catch {}
      }
      if (succeeded) {
        setTimeout(() => {
          stopBatchPolling();
          setUploading(false);
          setUploadPhase(null);
          setUploadProgress(0);
          updateProcessingStats(null);
          uploadSessionRef.current = null;
          try { localStorage.removeItem(UPLOAD_SESSION_KEY); } catch {}
        }, 1200);
      }
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
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/70 px-6 backdrop-blur-sm">
                  <div className="w-full max-w-xs">
                    <ProgressBar
                      value={uploadProgress}
                      label={
                        uploadPhase === 'processing'
                          ? (() => {
                              const total = processingStats?.total;
                              const processed = processingStats?.processed;
                              if (total && processed >= 0) {
                                const pct = Math.min(100, Math.max(0, Math.round((Math.min(processed, total) / total) * 100)));
                                return `Processing ${processed}/${total} records (${pct}%)…`;
                              }
                              return 'Processing uploaded records…';
                            })()
                          : uploadPhase === 'completed'
                            ? 'Finalizing upload'
                            : 'Uploading files…'
                      }
                    />
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
                  <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                    <div className="font-medium">
                      {uploadError.message}
                      {(uploadError.code || uploadError.status) && (
                        <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                          {uploadError.code || ''}
                          {uploadError.code && uploadError.status ? ' · ' : ''}
                          {uploadError.status || ''}
                        </span>
                      )}
                    </div>
                    {Array.isArray(uploadError.details) && uploadError.details.length > 0 && (
                      <ul className="space-y-1 text-xs text-red-600">
                        {uploadError.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 flex-none rounded-full bg-red-400" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(uploadError.validationErrors) && uploadError.validationErrors.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-red-200 bg-white/70 px-3 py-2 text-xs text-red-600">
                        <div className="font-semibold text-red-700">Validation issues</div>
                        <ul className="space-y-1">
                          {uploadError.validationErrors.map((errItem, idx) => (
                            <li key={idx}>
                              {errItem?.field ? <span className="font-medium">{errItem.field}:</span> : null} {errItem?.message || String(errItem)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(uploadError.errors) && uploadError.errors.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-red-200 bg-white/70 px-3 py-2 text-xs text-red-600">
                        <div className="font-semibold text-red-700">Row errors</div>
                        <ul className="divide-y divide-red-100">
                          {uploadError.errors.map((errItem, idx) => (
                            <li key={idx} className="py-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium">{errItem?.error || 'Validation error'}</div>
                                  {errItem?.registration_number && (
                                    <div className="text-[11px] text-red-500">Reg #: {errItem.registration_number}</div>
                                  )}
                                  {errItem?.student_name && (
                                    <div className="text-[11px] text-red-500">Name: {errItem.student_name}</div>
                                  )}
                                  {errItem?.filename && (
                                    <div className="text-[11px] text-red-500">File: {errItem.filename}</div>
                                  )}
                                  {errItem?.suggestion && (
                                    <div className="text-[11px] text-red-500">Suggestion: {errItem.suggestion}</div>
                                  )}
                                </div>
                                <span className="text-[11px] text-red-500">Row {errItem?.row ?? idx + 1}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(uploadError.skippedRecords) && uploadError.skippedRecords.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {uploadError.skippedRecords.length} certificate(s) could not be matched to Excel rows.
                      </div>
                    )}
                  </div>
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
                  <li>📞 Hotline: <a href="tel:+919606015868" className="text-[#14B87D] hover:underline">+91 96060 15868</a></li>
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
                          const currentId = selectedBatch?.id ?? selectedBatch?.batch_id;
                          const nextId = b.id ?? b.batch_id;

                          if (currentId && currentId === nextId) {
                            setSelectedBatch(null);
                            setBatchStatus(null);
                            setBatchDegrees([]);
                            setBatchStatusLoading(false);
                            return;
                          }

                          setSelectedBatch(b);
                          setBatchStatus(null);
                          setBatchDegrees([]);
                          setBatchStatusLoading(true);
                          try {
                            const batchIdentifier = b.id || b.batch_id || b.batchId;
                            const statusPromise = getBatchStatus(batchIdentifier);
                            const degreesPromise = (async () => {
                              try {
                                const all = [];
                                let pageCursor = 1;
                                let totalPages = 1;

                                do {
                                  const response = await getBatchDegrees(batchIdentifier, pageCursor, 100);
                                  const envelope = response?.data?.data || response?.data || {};
                                  const list = Array.isArray(envelope?.degrees) ? envelope.degrees : [];
                                  if (list.length) all.push(...list);

                                  const pagination = envelope?.pagination || {};
                                  const pageValue = Number(pagination?.total_pages ?? pagination?.totalPages ?? pagination?.pages);
                                  if (Number.isFinite(pageValue) && pageValue > 0) {
                                    totalPages = pageValue;
                                  } else if (Number.isFinite(pagination?.total)) {
                                    const computed = Math.ceil(Number(pagination.total) / 100);
                                    if (Number.isFinite(computed) && computed > 0) {
                                      totalPages = computed;
                                    }
                                  }

                                  pageCursor += 1;
                                } while (pageCursor <= totalPages);

                                setBatchDegrees(all);
                              } catch (err) {
                                console.error('Failed to fetch batch degrees:', err);
                                setBatchDegrees([]);
                              }
                            })();

                            const statusRes = await statusPromise;
                            setBatchStatus(statusRes?.data?.data || statusRes?.data || null);
                            await degreesPromise;
                          } catch (e) {
                            setBatchStatus({ error: e?.response?.data?.message || e?.message || 'Failed to load status' });
                            setBatchDegrees([]);
                          } finally {
                            setBatchStatusLoading(false);
                          }
                        }}
                      >
                        {selectedBatch && (selectedBatch.id ?? selectedBatch.batch_id) === (b.id ?? b.batch_id)
                          ? 'Hide status'
                          : 'View status'}
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
                            {previewDegrees.length > 0 && (
                              <div>
                                <div className="text-gray-700">Degrees</div>
                                <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                  {previewDegrees.map((d, i) => (
                                    <li key={d?.id || d?.degree_id || i} className="rounded-2xl border border-white/60 bg-white px-3 py-2">
                                      <p className="font-medium text-[#14B87D]">{d?.student_name || 'N/A'}</p>
                                      <p className="text-xs text-gray-600">{d?.degree_id || d?.id || '—'}</p>
                                      <p className='text-xs text-gray-500'>{d?.course || 'N/A'}</p>
                                      <p className='text-xs text-gray-500'>{d?.year || 'N/A'}</p>
                                    </li>
                                  ))}
                                </ul>
                                {hasMoreDegrees && (
                                  <div className="mt-3">
                                    <Link
                                      to="/degrees"
                                      className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/60 bg-white px-4 py-1.5 text-sm font-medium text-[#14B87D] transition hover:bg-[#ecfdf5]"
                                    >
                                      See more degrees
                                      <span aria-hidden="true">→</span>
                                    </Link>
                                  </div>
                                )}
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
