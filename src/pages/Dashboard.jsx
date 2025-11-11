/* Path: src/pages/Dashboard.jsx */

import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { ChartBarIcon, DocumentArrowDownIcon, ShieldCheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  getDegrees,
  getDashboardStats,
  listDegreeBatches,
  getBatchStatus,
} from "../utils/api"; // ✅ using centralized API helper
import { useAuthContext } from "../context/AuthContext";

const formatNumber = (value) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
};

const Dashboard = () => {
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [stats, setStats] = useState({
    totalDegrees: 0,
    templatesDownloaded: 0,
    pendingVerifications: 0,
    totalVerifications: 0,
  });
  const { user } = useAuthContext();
  const currentEmail = String(user?.email ?? "").trim().toLowerCase();
  const DOWNLOAD_KEY = currentEmail
    ? `x_did_template_downloads:${currentEmail}`
    : "x_did_template_downloads:__anon__";
  const [downloadCount, setDownloadCount] = useState(0);

  const loadDownloadCount = useCallback(() => {
    try {
      const raw = localStorage.getItem(DOWNLOAD_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(parsed) ? parsed.length : 0;
      setDownloadCount(count);
      return count;
    } catch {
      setDownloadCount(0);
      return 0;
    }
  }, [DOWNLOAD_KEY]);

  useEffect(() => {
    loadDownloadCount();
    const handleStorage = (event) => {
      if (event.key === DOWNLOAD_KEY) {
        loadDownloadCount();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [DOWNLOAD_KEY, loadDownloadCount]);

  const calculatePending = (list) => {
    if (!Array.isArray(list)) return 0;
    return list.filter((item) => {
      const raw = item?.verification_status || item?.status || item?.upload_status || "";
      return /pending/i.test(String(raw));
    }).length;
  };

  const parseResponseData = async (raw) => {
    let data = raw;
    try {
      if (data instanceof Blob) {
        const text = await data.text();
        data = JSON.parse(text);
      } else if (typeof data === "string") {
        data = JSON.parse(data);
      }
    } catch {
      // keep raw data if parsing fails
    }
    return data;
  };

  const normalizeDegreeRow = (d) => ({
    ...d,
    student_name: d?.student_name || d?.name || d?.recipientName || "",
    course: d?.course || d?.program || d?.program_major || "",
    registration_number:
      d?.registration_number ||
      d?.registrationNumber ||
      d?.register_number ||
      d?.registerNumber ||
      d?.reg_no ||
      d?.rollNo ||
      "",
    degree_id: d?.degree_id || d?.degreeId || d?.id,
    verification_status: d?.verification_status || d?.status || d?.upload_status || "issued",
  });

  const collectDegreesFromBatches = useCallback(async () => {
    const results = [];
    let page = 1;
    let totalPages = 1;
    const limit = 20;

    do {
      const res = await listDegreeBatches(page, limit);
      const payload = res?.data?.data || res?.data || {};
      const batches = Array.isArray(payload?.batches) ? payload.batches : [];
      const pagination = payload?.pagination || {};
      const pagesVal = Number(pagination?.pages || pagination?.total_pages || 1);
      totalPages = Number.isFinite(pagesVal) && pagesVal > 0 ? pagesVal : 1;

      await Promise.all(
        batches.map(async (batch) => {
          const id = batch?.id || batch?.batch_id || batch?.batchId;
          if (!id) return;
          try {
            const statusRes = await getBatchStatus(id);
            const statusPayload = statusRes?.data?.data || statusRes?.data || {};
            const sample = Array.isArray(statusPayload?.sample_degrees) ? statusPayload.sample_degrees : [];
            const createdAt =
              batch?.created_at ||
              batch?.createdAt ||
              statusPayload?.created_at ||
              statusPayload?.createdAt ||
              null;
            const batchName =
              batch?.batch_name ||
              batch?.batchName ||
              statusPayload?.batch_name ||
              statusPayload?.batchName ||
              "";

            sample.forEach((deg) => {
              results.push(
                normalizeDegreeRow({
                  ...deg,
                  batch_name: batchName,
                  issueDate:
                    deg?.issueDate ||
                    deg?.created_at ||
                    deg?.createdAt ||
                    createdAt,
                })
              );
            });
          } catch (err) {
            console.warn('Failed to load batch status', id, err);
          }
        })
      );

      page += 1;
    } while (page <= totalPages);

    return results;
  }, []);

  const fetchAllDegrees = useCallback(async () => {
    const aggregated = [];
    const limit = 100;
    let pageCursor = 1;
    let totalPages = 1;

    do {
      const res = await getDegrees(pageCursor, limit);
      const parsed = await parseResponseData(res?.data);
      const envelope = parsed?.data || parsed || {};
      const list = Array.isArray(envelope?.degrees)
        ? envelope.degrees
        : Array.isArray(envelope?.data?.degrees)
          ? envelope.data.degrees
          : Array.isArray(parsed)
            ? parsed
            : Array.isArray(envelope?.result)
              ? envelope.result
              : [];
      if (Array.isArray(list)) {
        aggregated.push(...list.map(normalizeDegreeRow));
      }
      const pg = envelope?.pagination || envelope?.data?.pagination || {};
      const pages = Number(pg?.total_pages || pg?.pages || 1);
      totalPages = Number.isFinite(pages) && pages > 0 ? pages : 1;
      pageCursor += 1;
    } while (pageCursor <= totalPages);

    return aggregated;
  }, []);

  const fetchDegrees = useCallback(async () => {
      setLoading(true);
      try {
        console.log('Fetching dashboard data...');
        const statsPromise = getDashboardStats();
        let degreesData = await collectDegreesFromBatches();
        if (!Array.isArray(degreesData) || degreesData.length === 0) {
          degreesData = await fetchAllDegrees();
        }
        const dashboardRes = await statsPromise;

        console.log('Processed degrees data:', degreesData);
        console.log('Derived pending from degreesData:', calculatePending(degreesData));
        setDegrees(degreesData);

        // Normalize dashboard stats response
        let dashboardPayload = dashboardRes?.data;
        dashboardPayload = await parseResponseData(dashboardPayload);

        const statsData = dashboardPayload?.data?.stats || dashboardPayload?.stats || {};
        const backendTemplates = statsData.templatesDownloaded ?? statsData.totalFiles ?? 0;
        const localTemplates = loadDownloadCount();
        const backendPending = statsData.pendingVerifications ?? 0;
        const realTimePending = calculatePending(degreesData);
        console.log('Pending counts -> backend:', backendPending, 'derived:', realTimePending);
        setStats({
          totalDegrees: statsData.totalDegrees ?? degreesData.length ?? 0,
          templatesDownloaded: Math.max(backendTemplates, localTemplates),
          pendingVerifications: Math.max(backendPending, realTimePending),
          totalVerifications: statsData.totalVerifications ?? 0,
        });
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           "Failed to fetch degrees. Please check your connection and try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
  }, [collectDegreesFromBatches, fetchAllDegrees, loadDownloadCount]);

  useEffect(() => {
    fetchDegrees();
  }, [fetchDegrees]);

  const metricCards = [
    // {
    //   label: "Total degrees issued",
    //   value: stats?.totalDegrees ?? degrees?.length ?? 0,
    //   helper: `${formatNumber(degrees?.length ?? 0)} records synced`,
    //   icon: ChartBarIcon,
    //   accent: "bg-[#14B87D]/15 text-[#0b1d19]",
    // },
    // {
    //   label: "Templates downloaded",
    //   value: Math.max(stats?.templatesDownloaded ?? 0, downloadCount),
    //   helper: "Includes dashboard & local template pulls",
    //   icon: DocumentArrowDownIcon,
    //   accent: "bg-[#14B87D]/10 text-[#14B87D]",
    // },
    // // {
    // //   label: "Pending verifications",
    // //   value: stats?.pendingVerifications ?? 0,
    // //   helper: `${formatNumber(stats?.totalVerifications ?? 0)} completed overall`,
    // //   icon: ShieldCheckIcon,
    // //   accent: "bg-amber-100 text-amber-600",
    // // },
  ];

  const pendingCount = stats?.pendingVerifications ?? 0;
  const recentDegrees = Array.isArray(degrees) ? degrees.slice(0, 5) : [];

  const summaryChips = [
    `Latest sync: ${new Date().toLocaleDateString()}`,
    `${formatNumber(downloadCount)} template downloads`,
  ];

  return (
    <Layout>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-16 h-72 w-72 rounded-full bg-[#14B87D]/15 blur-3xl" />
          <div className="absolute bottom-[-180px] left-10 h-[420px] w-[420px] rounded-full bg-[#14B87D]/10 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6 p-4 md:p-6">
          <PageHeader
            title="Dashboard Overview"
            subtitle="Key metrics and recent activity across the DID issuance workflow"
            actions={
              <button
                type="button"
                onClick={fetchDegrees}
                className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/40 bg-white px-4 py-2 text-sm font-medium text-[#14B87D] shadow-sm transition hover:bg-[#ecfdf5]"
              >
                <ArrowPathIcon className="h-4 w-4" /> Refresh data
              </button>
            }
          />

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#14B87D] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 shadow-sm">
              <div className="font-semibold">Unable to load dashboard data</div>
              <div className="mt-1">{error}</div>
              <button
                type="button"
                onClick={fetchDegrees}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                <ArrowPathIcon className="h-4 w-4" /> Retry now
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-[#14B87D]/20 bg-gradient-to-br from-white via-white to-[#ecfdf5] px-6 py-6 shadow-[0_24px_70px_-40px_rgba(20,184,125,0.55)]">
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Issuance snapshot</h3>
                    <p className="text-sm text-gray-700">
                      From secure ingestion to DID-based verification, track how your institution is progressing across the credential lifecycle.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                      {summaryChips.map((chip) => (
                        <span key={chip} className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/30 bg-white px-3 py-1">
                          <span className="h-2 w-2 rounded-full bg-[#14B87D]" /> {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Degrees issued to date</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(stats?.totalDegrees ?? degrees?.length ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Templates Downloaded</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber( Math.max(stats?.templatesDownloaded ?? 0, downloadCount))}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metricCards.map(({ label, value, helper, icon: Icon, accent }) => (
                  <div key={label} className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-500">{label}</p>
                        <p className="mt-3 text-3xl font-semibold text-gray-900">{formatNumber(value)}</p>
                      </div>
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-base ${accent}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-gray-600">{helper}</p>
                  </div>
                ))}
              </div>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent credential activity</h3>
                      <p className="text-sm text-gray-600">Latest degree issuance events synced from your batches.</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchDegrees}
                      className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/30 px-3 py-1.5 text-xs font-medium text-[#14B87D] transition hover:bg-[#ecfdf5]"
                    >
                      <ArrowPathIcon className="h-4 w-4" /> Sync again
                    </button>
                  </div>

                  <ul className="mt-5 divide-y divide-gray-100">
                    {recentDegrees.length > 0 ? (
                      recentDegrees.map((degree, index) => {
                        const name = degree.student_name || degree.recipientName || degree.studentName || "Recipient";
                        const course = degree.course || degree.courseName || "";
                        const registration =
                          degree.registration_number ||
                          degree.registrationNumber ||
                          degree.register_number ||
                          degree.registerNumber ||
                          degree.rollNo ||
                          degree.roll ||
                          "";
                        const issuedOn = degree.issueDate || degree.created_at || degree.createdAt || null;

                        return (
                          <li key={degree._id || degree.degree_id || `degree-${index}`} className="py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#14B87D]" />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900">{name}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                  {course && <span className="inline-flex items-center gap-1">📘 {course}</span>}
                                  {registration && <span className="inline-flex items-center gap-1">🆔 {registration}</span>}
                                  {issuedOn && (
                                    <span className="inline-flex items-center gap-1">🗓️ {new Date(issuedOn).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li className="py-6 text-center text-sm text-gray-500">No degree records found yet.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-3xl border border-[#14B87D]/20 bg-[#ecfdf5]/70 p-6 shadow-sm backdrop-blur">
                  <h3 className="text-lg font-semibold text-gray-900">Operational checklist</h3>
                  <p className="mt-2 text-sm text-gray-700">Quick reminders to keep issuance moving smoothly.</p>
                  <ul className="mt-4 space-y-3 text-sm text-gray-700">
                    <li className="rounded-2xl border border-[#14B87D]/20 bg-white px-4 py-3">Validate new batch uploads in the <strong>Templates</strong> tab soon after import.</li>
                    <li className="rounded-2xl border border-[#14B87D]/20 bg-white px-4 py-3">Share verification URLs with registrars once credentials change to <strong>Issued</strong>.</li>
                    <li className="rounded-2xl border border-[#14B87D]/20 bg-white px-4 py-3">Schedule weekly audits from the <strong>Account</strong> area for compliance logs.</li>
                  </ul>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
