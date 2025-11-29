// src/views/UserDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// ---------- Helpers ----------

function computeDaysLeft(expiryDateString) {
  if (!expiryDateString) return NaN;
  const today = new Date();
  const expiry = new Date(expiryDateString);
  const diffMs = expiry.getTime() - today.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusFromDaysLeft(daysLeft) {
  if (Number.isNaN(daysLeft)) return "Unknown";
  if (daysLeft < 0) return "Expired";
  if (daysLeft <= 30) return "Expiring soon";
  return "Active";
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeIcs(str = "") {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

const emptyForm = {
  name: "",
  provider: "",
  category: "",
  issueDate: "",
  expiryDate: "",
  certId: "",
  certUrl: "",
  notes: "",
};

// ---------- Component ----------

export default function UserDashboard() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expiryWindow, setExpiryWindow] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  // ---------- Load from API ----------
  useEffect(() => {
    async function loadCerts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/certifications`);

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("API returned non-array payload");
        }

        const enriched = data.map((c) => {
          const issueDate = c.issue_date || c.issueDate;
          const expiryDate = c.expiry_date || c.expiryDate;

          const daysLeft = computeDaysLeft(expiryDate);
          const status = getStatusFromDaysLeft(daysLeft);

          return {
            ...c,
            issueDate,
            expiryDate,
            daysLeft,
            status,
          };
        });

        setCerts(enriched);
      } catch (err) {
        console.error("Failed to fetch certifications", err);
        setError(
          "Could not load certifications from the server. Make sure the API on port 4000 is running and /api/certifications returns JSON."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCerts();
  }, []);

  // ---------- Form handlers ----------
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return; // tiny UX guard

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
      };

      const res = await fetch(`${API_BASE_URL}/api/certifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`);
      }

      const created = await res.json();

      const issueDate = created.issue_date || created.issueDate;
      const expiryDate = created.expiry_date || created.expiryDate;
      const daysLeft = computeDaysLeft(expiryDate);
      const status = getStatusFromDaysLeft(daysLeft);

      const enrichedCreated = {
        ...created,
        issueDate,
        expiryDate,
        daysLeft,
        status,
      };

      setCerts((prev) => [...prev, enrichedCreated]);
      setForm(emptyForm);
    } catch (err) {
      console.error("Failed to save certification", err);
      setError("Could not save this certification. Check the server logs.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Stats ----------
  const stats = useMemo(() => {
    let active = 0,
      expiring = 0,
      expired = 0;
    for (const c of certs) {
      if (c.status === "Expired") expired++;
      else if (c.status === "Expiring soon") expiring++;
      else active++;
    }
    return { active, expiring, expired };
  }, [certs]);

  // ---------- Filters ----------
  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      if (typeof c.daysLeft === "number") {
        if (expiryWindow === "30" && !(c.daysLeft >= 0 && c.daysLeft <= 30))
          return false;
        if (expiryWindow === "60" && !(c.daysLeft >= 0 && c.daysLeft <= 60))
          return false;
        if (expiryWindow === "90" && !(c.daysLeft >= 0 && c.daysLeft <= 90))
          return false;
      }

      if (statusFilter === "active" && c.status !== "Active") return false;
      if (statusFilter === "expiring" && c.status !== "Expiring soon")
        return false;
      if (statusFilter === "expired" && c.status !== "Expired") return false;

      if (
        categoryFilter !== "all" &&
        c.category?.toLowerCase() !== categoryFilter
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${c.name} ${c.provider} ${c.category} ${
          c.certId || c.cert_id || ""
        }`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [certs, expiryWindow, statusFilter, categoryFilter, search]);

  // ---------- Exports ----------
  function handleExportCsv() {
    if (!filteredCerts.length) return;

    const header = [
      "Name",
      "Provider",
      "Category",
      "Issue date",
      "Expiry date",
      "Status",
      "Days left",
      "Cert ID",
      "URL",
    ];

    const rows = filteredCerts.map((c) => [
      c.name,
      c.provider,
      c.category,
      formatDate(c.issueDate),
      formatDate(c.expiryDate),
      c.status,
      c.daysLeft,
      c.certId || c.cert_id,
      c.certUrl || c.cert_url,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((field) =>
            `"${String(field ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frogtrack-certifications.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportCalendar() {
    if (!filteredCerts.length) return;

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FrogTrack//Renewals//EN",
    ];

    filteredCerts.forEach((c) => {
      const exp = new Date(c.expiryDate);
      if (Number.isNaN(exp.getTime())) return;
      if (c.daysLeft < 0) return;

      const dt = exp.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const uid = `frogtrack-${c.id || c.certId || Math.random()
        .toString(36)
        .slice(2)}@frogtrack`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dt}`,
        `DTSTART:${dt}`,
        `SUMMARY:${escapeIcs(`Renew ${c.name}`)}`,
        `DESCRIPTION:${escapeIcs(
          `Provider: ${c.provider || ""}\\nCategory: ${
            c.category || ""
          }\\nCert ID: ${c.certId || c.cert_id || ""}`
        )}`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frogtrack-renewals.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- UI ----------
  return (
    <div className="ft-dashboard-page">
      <header className="ft-dashboard-header">
        <div className="ft-hero-copy">
          <p className="ft-kicker">CERTIFICATION CONTROL, MINUS THE SPREADSHEETS.</p>
          <h1 className="ft-page-title">User dashboard</h1>
          <p className="ft-page-subtitle">
            Track all your certifications in one place. Filters, CSV, and calendar
            exports always respect your current view.
          </p>
        </div>

        <div className="ft-stat-row" aria-label="Certification summary stats">
          <button
            type="button"
            className={`ft-stat-pill ${
              statusFilter === "all" ? "ft-stat-pill--active" : ""
            }`}
            onClick={() => setStatusFilter("all")}
          >
            <span className="ft-pill-label">Active</span>
            <span className="ft-pill-value">{stats.active}</span>
          </button>

          <button
            type="button"
            className={`ft-stat-pill ${
              statusFilter === "expiring" ? "ft-stat-pill--active" : ""
            }`}
            onClick={() => setStatusFilter("expiring")}
          >
            <span className="ft-pill-label">Expiring ≤ 30 days</span>
            <span className="ft-pill-value">{stats.expiring}</span>
          </button>

          <button
            type="button"
            className={`ft-stat-pill ${
              statusFilter === "expired" ? "ft-stat-pill--active" : ""
            }`}
            onClick={() => setStatusFilter("expired")}
          >
            <span className="ft-pill-label">Expired</span>
            <span className="ft-pill-value">{stats.expired}</span>
          </button>
        </div>
      </header>

      <div className="ft-dashboard-toolbar">
        <div className="ft-pill-group">
          <span className="ft-pill-label-small">Expiry window</span>
          <div className="ft-pill-options">
            {[
              { id: "all", label: "All dates" },
              { id: "30", label: "Next 30 days" },
              { id: "60", label: "Next 60 days" },
              { id: "90", label: "Next 90 days" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`ft-chip ${
                  expiryWindow === opt.id ? "ft-chip--active" : ""
                }`}
                onClick={() => setExpiryWindow(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ft-toolbar-right">
          <button
            type="button"
            className="ft-secondary-button"
            onClick={handleExportCsv}
            disabled={!filteredCerts.length}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="ft-primary-button"
            onClick={handleExportCalendar}
            disabled={!filteredCerts.length}
          >
            Export calendar (.ics)
          </button>
        </div>
      </div>

      {error && <div className="ft-alert">{error}</div>}

      <div className="ft-dashboard-grid">
        {/* LEFT: table */}
        <section className="ft-card">
          <div className="ft-card-header">
            <h2 className="ft-card-title">My certifications</h2>
            <p className="ft-card-subtitle">
              Use filters or search to slice your portfolio. Exports use this
              exact slice.
            </p>
          </div>

          <div className="ft-filter-row">
            <div className="ft-filter">
              <label className="ft-filter-label">Category</label>
              <select
                className="ft-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                <option value="cloud">Cloud</option>
                <option value="devops">DevOps</option>
                <option value="security">Security</option>
                <option value="data">Data</option>
              </select>
            </div>

            <div className="ft-filter">
              <label className="ft-filter-label">Status</label>
              <select
                className="ft-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="ft-filter ft-filter--grow">
              <label className="ft-filter-label">Search</label>
              <input
                type="text"
                className="ft-input"
                placeholder="Name, provider, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ft-table-wrapper">
            <table className="ft-table">
              <thead>
                <tr>
                  <th>Certification</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th>Issue date</th>
                  <th>Expiry date</th>
                  <th>Days left</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="ft-table-empty">
                      Loading certifications…
                    </td>
                  </tr>
                ) : filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ft-table-empty">
                      No certifications match these filters yet.
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="ft-cert-name">{c.name}</div>
                        {(c.certUrl || c.cert_url) && (
                          <div className="ft-cert-subtext">
                            {c.certUrl || c.cert_url}
                          </div>
                        )}
                      </td>
                      <td>{c.provider}</td>
                      <td>{c.category}</td>
                      <td>{formatDate(c.issueDate)}</td>
                      <td>{formatDate(c.expiryDate)}</td>
                      <td className={c.daysLeft < 0 ? "ft-text-danger" : ""}>
                        {Number.isNaN(c.daysLeft) ? "—" : c.daysLeft}
                      </td>
                      <td>
                        <span
                          className={`ft-status-pill ${
                            c.status === "Expired"
                              ? "ft-status-pill--expired"
                              : c.status === "Expiring soon"
                              ? "ft-status-pill--warning"
                              : "ft-status-pill--active"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>{c.certId || c.cert_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="ft-footnote">
            Tip: tweak the filters, then export CSV or calendar for just that
            slice of your portfolio.
          </p>
        </section>

        {/* RIGHT: add form */}
        <section className="ft-card ft-card--side">
          <h2 className="ft-card-title">Add certification</h2>
          <p className="ft-card-subtitle">
            New entries are saved straight into Postgres through the FrogTrack
            API.
          </p>

          <form className="ft-form" onSubmit={handleSubmit}>
            <div className="ft-field">
              <label className="ft-field-label">Certification name</label>
              <input
                name="name"
                type="text"
                className="ft-input"
                placeholder="e.g., AWS Solutions Architect – Associate"
                value={form.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="ft-field">
              <label className="ft-field-label">Issuing organisation</label>
              <input
                name="provider"
                type="text"
                className="ft-input"
                placeholder="e.g., AWS, Microsoft"
                value={form.provider}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="ft-field">
              <label className="ft-field-label">Category</label>
              <input
                name="category"
                type="text"
                className="ft-input"
                placeholder="e.g., Cloud, DevOps, Security"
                value={form.category}
                onChange={handleFormChange}
              />
            </div>

            <div className="ft-field-row">
              <div className="ft-field">
                <label className="ft-field-label">Issue date</label>
                <input
                  name="issueDate"
                  type="date"
                  className="ft-input"
                  value={form.issueDate}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Expiry date</label>
                <input
                  name="expiryDate"
                  type="date"
                  className="ft-input"
                  value={form.expiryDate}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="ft-field-row">
              <div className="ft-field">
                <label className="ft-field-label">Reference / Cert ID</label>
                <input
                  name="certId"
                  type="text"
                  className="ft-input"
                  placeholder="e.g., AWS-123456"
                  value={form.certId}
                  onChange={handleFormChange}
                />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Certificate URL</label>
                <input
                  name="certUrl"
                  type="url"
                  className="ft-input"
                  placeholder="Link to badge or certificate"
                  value={form.certUrl}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="ft-field">
              <label className="ft-field-label">Notes</label>
              <textarea
                name="notes"
                rows={3}
                className="ft-input ft-input--textarea"
                placeholder="Optional: exam attempts, renewal conditions, etc."
                value={form.notes}
                onChange={handleFormChange}
              />
            </div>

            <button
              type="submit"
              className="ft-primary-button ft-primary-button--full"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save certification"}
            </button>

            <p className="ft-footnote">
              Future version: auto-sync from AWS / Azure / Google APIs so this
              page updates itself.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
