import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { listDegreeBatches, getBatchStatus, getDegrees as apiGetDegrees } from "../utils/api";
import { ChartBarIcon, ClockIcon, FunnelIcon } from "@heroicons/react/24/outline";

const Dashboard = () => {
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchAllDegreesFromBatches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ensure authenticated; degrees are per-user via batches API
        const token = localStorage.getItem('token');
        if (!token) {
          setDegrees([]);
          setError('Sign in to view issued degrees.');
          return;
        }

        // 1) Load batches (page 1), then subsequent pages if present
        const allBatches = [];
        let page = 1;
        let pages = 1;
        const limit = 20;
        do {
          const res = await listDegreeBatches(page, limit);
          const payload = res?.data;
          // Postman shape: { success, data: { batches: [...], pagination } }
          const batches = payload?.data?.batches || [];
          const pg = payload?.data?.pagination || {};
          pages = Number(pg?.pages || 1);
          if (Array.isArray(batches)) allBatches.push(...batches);
          page += 1;
        } while (page <= pages);

        // 2) For each batch, fetch status to get sample_degrees
        const degreeRows = [];
        await Promise.all((allBatches || []).map(async (b) => {
          try {
            const id = b.id || b.batch_id || b.batchId;
            if (!id) return;
            const st = await getBatchStatus(id);
            // Postman shape: { success, data: {...} }
            const data = st?.data?.data || {};
            const sample = Array.isArray(data?.sample_degrees) ? data.sample_degrees : [];
            const createdAt = b.created_at || b.createdAt || data?.created_at || data?.createdAt || null;
            const batchName = b.batch_name || b.batchName || data?.batch_name || data?.batchName || '';
            sample.forEach((d) => {
              degreeRows.push({
                // Keep original fields for downstream mapping
                ...d,
                // Provide normalized fallbacks referenced by table helpers
                student_name: d.student_name,
                email: d.email || '',
                course: d.course || d.program || '',
                registration_number: d.registration_number,
                degree_id: d.degree_id,
                verification_status: d.verification_status,
                issueDate: createdAt,
                batch_name: batchName,
              });
            });
          } catch (e) {
            // ignore individual batch errors but continue others
          }
        }));

        // Fallback: if no rows collected from batches, try legacy getDegrees
        if (degreeRows.length === 0) {
          try {
            const res2 = await apiGetDegrees(1, 200);
            let raw = res2?.data;
            try {
              if (raw instanceof Blob) {
                const text = await raw.text();
                raw = JSON.parse(text);
              } else if (typeof raw === 'string') {
                raw = JSON.parse(raw);
              }
            } catch {}
            const list = Array.isArray(raw)
              ? raw
              : raw?.data?.degrees || raw?.degrees || raw?.result || [];
            const mapped = (list || []).map((d) => ({
              ...d,
              student_name: d.student_name || d.name || d.recipientName || '',
              email: d.email || '',
              course: d.course || d.program || '',
              registration_number: d.registration_number || d.registrationNumber || '',
              degree_id: d.degree_id || d.id,
              verification_status: d.verification_status || d.status,
              issueDate: d.issueDate || d.createdAt || d.updatedAt || d.created_at || d.updated_at || null,
              batch_name: d.batch_name || d.batchName || '',
            }));
            setDegrees(mapped);
          } catch (_) {
            setDegrees([]);
          }
        } else {
          setDegrees(degreeRows);
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch degrees from batches';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDegreesFromBatches();
  }, []);

  // Derive distinct options
  const distinctPrograms = useMemo(() => {
    const s = new Set();
    degrees.forEach((d) => s.add((d && (d.course || d.program || d.courseName)) || ""));
    return ["All", ...Array.from(s).filter(Boolean)];
  }, [degrees]);
  const distinctYears = useMemo(() => {
    const s = new Set();
    degrees.forEach((d) => s.add((d && (d.year || d.batch || d.batchName || d.batch_name)) || ""));
    return ["All", ...Array.from(s).filter(Boolean)];
  }, [degrees]);

  // Normalize helpers
  const getName = (d) => d.student_name || d.studentName || d.recipientName || d.name || "";
  const getEmail = (d) => d.email || d.recipientEmail || d.studentEmail || d.contactEmail || "";
  const getProgram = (d) => d.course || d.program || d.courseName || "";
  const getRegistrationNumber = (d) => {
    // Common explicit aliases
    const val = d.registration_number || d.registrationNumber || d.register_number || d.registerNumber || d.reg_no || d.regNo || d.rollNo || d.roll || d.roll_no || d.degree_id || d.degreeId || "";
    if (val) return val;
    // Fallback: scan keys case-insensitively for likely registration fields
    try {
      const k = Object.keys(d || {}).find((key) => /reg(istration)?[_\s-]*no|reg(istration)?[_\s-]*number|register[_\s-]*number|registration[_\s-]*id|roll[_\s-]*no|roll/i.test(key));
      if (k && d[k]) return d[k];
    } catch {}
    return "";
  };
  const getStatus = (d) => {
    const s = d.status || d.verification_status || d.upload_status || "Issued";
    // Normalize common backend values to UI labels
    if (/completed|issued/i.test(String(s))) return "Issued";
    if (/pending/i.test(String(s))) return "Pending";
    if (/fail/i.test(String(s))) return "Failed";
    return String(s);
  };
  const getDate = (d) => d.issueDate || d.createdAt || d.updatedAt || d.created_at || d.updated_at || null;
  const getYear = (d) => {
    const y = d.year || d.batch || d.batchName || d.batch_name;
    if (y) return y;
    // Try deriving year from date
    const dt = getDate(d);
    if (dt) try { return new Date(dt).getFullYear(); } catch {}
    // Try parsing year-like token from batch_name
    if (typeof d?.batch_name === 'string') {
      const m = d.batch_name.match(/(20\d{2}|19\d{2})/);
      if (m) return m[1];
    }
    return "";
  };
  const getDegreeId = (d) => d.degree_id || d.degreeId || "";

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
      const ka = sortKey === "name" ? getName(a) : sortKey === "status" ? getStatus(a) : sortKey === "program" ? getProgram(a) : sortKey === "year" ? getYear(a) : sortKey === "degreeId" ? getDegreeId(a) : getDate(a);
      const kb = sortKey === "name" ? getName(b) : sortKey === "status" ? getStatus(b) : sortKey === "program" ? getProgram(b) : sortKey === "year" ? getYear(b) : sortKey === "degreeId" ? getDegreeId(b) : getDate(b);
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

          {loading && <div className="rounded-3xl border border-gray-200 bg-white/90 px-6 py-6 text-sm text-gray-600 shadow-sm">Loading degrees…</div>}
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
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> {pendingCount} awaiting verification
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
                <label className="text-xs text-gray-500">Status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-[#14B87D] focus:outline-none"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  {['All', 'Issued', 'Pending', 'Failed', 'Revoked'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
                <label className="text-xs text-gray-500">Batch</label>
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
                    <th className="py-2">Batch</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                    <th className="py-2 cursor-pointer" onClick={() => toggleSort('date')}>Date</th>
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
                        <td className="py-3 text-gray-700">{d.batch_name || d.batchName || '—'}</td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${String(getStatus(d)).toLowerCase() === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : String(getStatus(d)).toLowerCase() === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {getStatus(d)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-700">{getDate(d) ? new Date(getDate(d)).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No records found</td>
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
