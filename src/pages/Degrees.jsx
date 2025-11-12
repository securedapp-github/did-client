import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { getDegrees as apiGetDegrees } from "../utils/api";
import { ChartBarIcon, ClockIcon, FunnelIcon } from "@heroicons/react/24/outline";

const Dashboard = () => {
  const [degrees, setDegrees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchProgress, setFetchProgress] = useState(null);
  const [error, setError] = useState(null);

  // Filters and table state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [program, setProgram] = useState("All");
  const [year, setYear] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupByYear, setGroupByYear] = useState(false);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getName = (d) =>
    d?.student_name ||
    d?.studentName ||
    d?.name ||
    d?.recipient_name ||
    d?.recipientName ||
    d?.full_name ||
    d?.fullName ||
    "";

  const getEmail = (d) =>
    d?.email ||
    d?.student_email ||
    d?.studentEmail ||
    d?.recipient_email ||
    d?.recipientEmail ||
    "";

  const getRegistrationNumber = (d) =>
    d?.registration_number ||
    d?.registrationNumber ||
    d?.register_number ||
    d?.registerNumber ||
    d?.reg_no ||
    d?.regNo ||
    d?.rollNo ||
    d?.roll_no ||
    d?.roll ||
    "";

  const getStatus = (d) =>
    d?.verification_status ||
    d?.status ||
    d?.upload_status ||
    d?.state ||
    "";

  const getProgram = (d) =>
    d?.course ||
    d?.course_name ||
    d?.courseName ||
    d?.program ||
    d?.programName ||
    d?.program_name ||
    d?.program_major ||
    "";

  const getYear = (d) =>
    d?.year ||
    d?.graduation_year ||
    d?.graduationYear ||
    d?.passing_year ||
    d?.passingYear ||
    d?.batch_year ||
    d?.batchYear ||
    d?.batch ||
    d?.batch_name ||
    d?.batchName ||
    "";

  const getDate = (d) =>
    d?.issueDate ||
    d?.issuedOn ||
    d?.issued_at ||
    d?.issuedAt ||
    d?.createdAt ||
    d?.updatedAt ||
    d?.created_at ||
    d?.updated_at ||
    d?.date ||
    null;

  const getDegreeId = (d) => d?.degree_id || d?.degreeId || d?.id || d?._id || "";

  const getInstitution = (d) =>
    d?.institution_name ||
    d?.institutionName ||
    d?.institution ||
    d?.organization ||
    d?.college ||
    d?.university ||
    "";

  const getCertificateUrl = (d) =>
    d?.certificate_url || d?.certificateUrl || d?.ipfs_url || d?.ipfsUrl || d?.url || "";

  const handleViewCertificate = useCallback((url) => {
    if (!url) return;
    if (typeof window !== "undefined") {
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    }
  }, []);

  const distinctPrograms = useMemo(() => {
    const unique = new Map();
    degrees.forEach((d) => {
      const raw = getProgram(d);
      if (!raw) return;
      const value = String(raw).trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, value);
      }
    });
    return [
      "All",
      ...Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })),
    ];
  }, [degrees]);

  const distinctYears = useMemo(() => {
    const unique = new Map();
    degrees.forEach((d) => {
      const raw = getYear(d);
      if (!raw) return;
      const value = String(raw).trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, value);
      }
    });
    return [
      "All",
      ...Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })),
    ];
  }, [degrees]);

  const fetchDegrees = useCallback(async () => {
    const aggregated = [];
    const limit = 100;
    let pageCursor = 1;
    let totalPages = 1;

    setLoading(true);
    setFetchProgress({ current: 0, total: null, currentPage: 0, totalPages: 0 });
    setError(null);

    const resolveNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) && num >= 0 ? num : null;
    };

    try {
      do {
        const res = await apiGetDegrees(pageCursor, limit);
        let payload = res?.data;

        if (payload instanceof Blob) {
          const text = await payload.text();
          try {
            payload = JSON.parse(text);
          } catch {
            payload = {};
          }
        } else if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = {};
          }
        }

        const envelope = payload?.data || payload || {};
        const list = Array.isArray(envelope?.degrees)
          ? envelope.degrees
          : Array.isArray(envelope?.data?.degrees)
            ? envelope.data.degrees
            : Array.isArray(envelope?.result)
              ? envelope.result
              : Array.isArray(payload)
                ? payload
                : [];

        if (Array.isArray(list)) {
          aggregated.push(...list);
        }

        const pagination = envelope?.pagination || envelope?.data?.pagination || {};
        const resolvedTotal =
          resolveNumber(pagination?.total) ??
          resolveNumber(pagination?.totalItems) ??
          resolveNumber(pagination?.total_records) ??
          resolveNumber(pagination?.totalRecords) ??
          resolveNumber(pagination?.count) ??
          null;

        const resolvedPageCount =
          resolveNumber(pagination?.total_pages) ??
          resolveNumber(pagination?.totalPages) ??
          resolveNumber(pagination?.pages) ??
          resolveNumber(pagination?.pageCount) ??
          null;

        if (resolvedPageCount && resolvedPageCount > 0) {
          totalPages = resolvedPageCount;
        } else if (!Array.isArray(list) || list.length < limit) {
          totalPages = pageCursor;
        }

        setFetchProgress({
          current: aggregated.length,
          total: resolvedTotal && resolvedTotal >= aggregated.length ? resolvedTotal : null,
          currentPage: pageCursor,
          totalPages,
        });

        pageCursor += 1;
      } while (pageCursor <= totalPages);

      setDegrees(aggregated);
    } catch (err) {
      console.error("Failed to load degrees", err);
      const message = err?.response?.data?.message || err?.message || "Unable to fetch degrees. Please try again.";
      setError(message);
      setDegrees([]);
    } finally {
      setLoading(false);
      setFetchProgress(null);
    }
  }, [apiGetDegrees]);

  useEffect(() => {
    fetchDegrees();
  }, [fetchDegrees]);

  // Filtered + sorted list
  const processed = useMemo(() => {
    let rows = degrees.slice();
    // Search
    const qv = q.trim().toLowerCase();
    if (qv) {
      rows = rows.filter((d) =>
        [getName(d), getEmail(d), getRegistrationNumber(d)].some((v) => String(v || "").toLowerCase().includes(qv))
      );
    }
    // Status
    if (status !== "All") rows = rows.filter((d) => String(getStatus(d)).toLowerCase() === status.toLowerCase());
    // Program
    if (program !== "All") rows = rows.filter((d) => String(getProgram(d)) === program);
    // Year
    if (year !== "All") rows = rows.filter((d) => String(getYear(d)) === year);
    // Date range
    if (from) rows = rows.filter((d) => getDate(d) && new Date(getDate(d)) >= new Date(from));
    if (to) rows = rows.filter((d) => getDate(d) && new Date(getDate(d)) <= new Date(to));
    // Sort
    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const ka =
        sortKey === "name"
          ? getName(a)
          : sortKey === "program"
            ? getProgram(a)
            : sortKey === "year"
              ? getYear(a)
              : sortKey === "degreeId"
                ? getDegreeId(a)
                : sortKey === "institution"
                  ? getInstitution(a)
                  : getDate(a);
      const kb =
        sortKey === "name"
          ? getName(b)
          : sortKey === "program"
            ? getProgram(b)
            : sortKey === "year"
              ? getYear(b)
              : sortKey === "degreeId"
                ? getDegreeId(b)
                : sortKey === "institution"
                  ? getInstitution(b)
                  : getDate(b);
      return String(ka || "").localeCompare(String(kb || ""), undefined, { numeric: true }) * dir;
    });
    return rows;
  }, [degrees, q, status, program, year, from, to, sortKey, sortDir]);

  // Pagination
  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const totalRecords = degrees.length;
  const pendingCount = useMemo(
    () => degrees.filter((d) => String(getStatus(d)).toLowerCase() === "pending").length,
    [degrees]
  );
  const issuedCount = useMemo(
    () => degrees.filter((d) => String(getStatus(d)).toLowerCase() === "issued").length,
    [degrees]
  );

  const loadingPercent = fetchProgress
    ? (() => {
        if (Number.isFinite(fetchProgress?.total) && fetchProgress.total > 0) {
          return Math.min(
            100,
            Math.round((fetchProgress.current / fetchProgress.total) * 100),
          );
        }
        if (
          Number.isFinite(fetchProgress?.totalPages) &&
          fetchProgress.totalPages > 0 &&
          Number.isFinite(fetchProgress?.currentPage)
        ) {
          return Math.min(
            100,
            Math.round((fetchProgress.currentPage / fetchProgress.totalPages) * 100),
          );
        }
        return null;
      })()
    : null;

  return (
    <Layout>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-16 h-72 w-72 rounded-full bg-[#14B87D]/15 blur-3xl" />
          <div className="absolute bottom-[-220px] left-12 h-[420px] w-[420px] rounded-full bg-[#14B87D]/10 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6 p-4 md:p-6">
          <PageHeader
            title="Issued Degrees"
            subtitle="Search, filter, and manage verifiable credentials for your recipients"
            actions={
              <button
                type="button"
                onClick={() => setPage(1)}
                className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/40 bg-white px-4 py-2 text-sm font-medium text-[#14B87D] shadow-sm transition hover:bg-[#ecfdf5]"
              >
                <FunnelIcon className="h-4 w-4" /> Reset filters
              </button>
            }
          />

          {loading && (
            <div className="rounded-3xl border border-gray-200 bg-white/90 px-6 py-6 text-sm text-gray-700 shadow-sm">
              <div className="font-medium text-gray-900">Loading degrees…</div>
              {fetchProgress && (
                <div className="mt-3 space-y-2">
                  {Number.isFinite(fetchProgress.total) ? (
                    <div>
                      Retrieved <strong>{fetchProgress.current}</strong> of {fetchProgress.total} records
                    </div>
                  ) : (
                    <div>
                      Retrieved <strong>{fetchProgress.current}</strong> records so far
                      {Number.isFinite(fetchProgress.totalPages) && fetchProgress.totalPages > 0
                        ? ` (page ${Math.min(fetchProgress.currentPage, fetchProgress.totalPages)} of ${fetchProgress.totalPages})`
                        : ''}
                    </div>
                  )}
                  {Number.isFinite(loadingPercent) && (
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-[#14B87D] transition-all"
                          style={{ width: `${Math.max(0, loadingPercent)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{loadingPercent}% complete</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-[#14B87D]/20 bg-gradient-to-br from-white via-white to-[#ecfdf5] px-6 py-6 shadow-[0_24px_70px_-40px_rgba(20,184,125,0.55)]">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Credential issuance snapshot</h3>
                <p className="text-sm text-gray-700">
                  Monitor how many degrees have been issued, what remains pending, and segment by program or batch using the filters below.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/30 bg-white px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-[#14B87D]" /> {totalRecords} total records synced
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/30 bg-white px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> {issuedCount} issued credentials
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14B87D]/15 text-[#0b1d19]"><ChartBarIcon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Programs tracked</p>
                    <p className="text-lg font-semibold text-gray-900">{distinctPrograms.length - 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14B87D]/15 text-[#0b1d19]"><ClockIcon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Filtered results</p>
                    <p className="text-lg font-semibold text-gray-900">{processed.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FunnelIcon className="h-5 w-5 text-[#14B87D]" /> Filter credentials
              </div>
              <div className="text-sm text-gray-600">{total} records match current filters</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500">Search</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                  placeholder="Name, email, or registration number"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Course</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                  value={program}
                  onChange={(e) => {
                    setProgram(e.target.value);
                    setPage(1);
                  }}
                >
                  {distinctPrograms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Year</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setPage(1);
                  }}
                >
                  {distinctYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#14B87D] focus:ring-[#14B87D]"
                  checked={groupByYear}
                  onChange={(e) => setGroupByYear(e.target.checked)}
                />
                Group by year in exports
              </label>
              <span>{processed.length} records in view</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('name')}>Name</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('program')}>Course</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('degreeId')}>Degree ID</th>
                    <th className="py-2">Registration Number</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('year')}>Year</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('institution')}>Institution</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('date')}>Date</th>
                    <th className="py-2">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.length > 0 ? (
                    paged.map((d, i) => (
                      <tr key={d._id || d.id || d.degree_id || i} className="transition hover:bg-[#ecfdf5]/40">
                        <td className="py-3 font-medium text-gray-900">{getName(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getProgram(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getDegreeId(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getRegistrationNumber(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getYear(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getInstitution(d) || '—'}</td>
                        <td className="py-3 text-gray-700">{getDate(d) ? new Date(getDate(d)).toLocaleDateString() : '—'}</td>
                        <td className="py-3">
                          {getCertificateUrl(d) ? (
                            <button
                              onClick={() => handleViewCertificate(getCertificateUrl(d))}
                              className="text-sm font-medium text-[#14B87D] hover:text-[#0d8a5a]"
                            >
                              View Certificate
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  className="rounded-full border border-gray-200 px-2 py-1"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}

export default Dashboard;
