// src/pages/Dashboard.jsx  (or src/Dashboard.jsx)
import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const initialCerts = [
  {
    id: 1,
    name: "AWS Solutions Architect – Associate",
    provider: "AWS",
    category: "Cloud",
    issueDate: "2023-05-11",
    expiryDate: "2026-05-11",
    reference: "AWS-123456",
  },
  {
    id: 2,
    name: "Certified Kubernetes Administrator",
    provider: "CNCF",
    category: "DevOps",
    issueDate: "2023-10-05",
    expiryDate: "2025-10-05",
    reference: "CKA-9012",
  },
  {
    id: 3,
    name: "Google Professional Cloud Architect",
    provider: "Google Cloud",
    category: "Cloud",
    issueDate: "2022-03-21",
    expiryDate: "2025-03-21",
    reference: "GCP-5678",
  },
];

const EXPIRY_WINDOWS = ["All dates", "Next 30 days", "Next 60 days", "Next 90 days"];

function daysBetween(today, dateStr) {
  const d = new Date(dateStr);
  const t = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((target - t) / (1000 * 60 * 60 * 24));
}

function getStatus(daysLeft) {
  if (daysLeft < 0) return "Expired";
  if (daysLeft <= 30) return "Expiring soon";
  return "Active";
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const [certs, setCerts] = useState(() => {
    const stored = localStorage.getItem("frogtrack_certs");
    return stored ? JSON.parse(stored) : initialCerts;
  });

  const [expiryWindow, setExpiryWindow] = useState("All dates");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [search, setSearch] = useState("");

  const [newCert, setNewCert] = useState({
    name: "",
    provider: "",
    category: "Cloud",
    issueDate: "",
    expiryDate: "",
    reference: "",
  });

  useEffect(() => {
    localStorage.setItem("frogtrack_certs", JSON.stringify(certs));
  }, [certs]);

  const today = new Date();

  const decoratedCerts = useMemo(
    () =>
      certs.map((cert) => {
        const daysLeft = cert.expiryDate
          ? daysBetween(today, cert.expiryDate)
          : NaN;
        const status = getStatus(daysLeft);
        return { ...cert, daysLeft, status };
      }),
    [certs, today]
  );

  const stats = useMemo(() => {
    const active = decoratedCerts.filter((c) => c.status === "Active").length;
    const expiringSoon = decoratedCerts.filter(
      (c) => c.status === "Expiring soon"
    ).length;
    const expired = decoratedCerts.filter((c) => c.status === "Expired").length;
    return { active, expiringSoon, expired };
  }, [decoratedCerts]);

  const earliestUpcoming = useMemo(() => {
    const upcoming = decoratedCerts
      .filter((c) => c.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return upcoming[0] || null;
  }, [decoratedCerts]);

  const filteredCerts = useMemo(() => {
    return decoratedCerts.filter((cert) => {
      // expiry window
      if (expiryWindow !== "All dates" && !Number.isNaN(cert.daysLeft)) {
        let max = 30;
        if (expiryWindow === "Next 60 days") max = 60;
        if (expiryWindow === "Next 90 days") max = 90;
        if (cert.daysLeft < 0 || cert.daysLeft > max) return false;
      }

      // category
      if (
        categoryFilter !== "All categories" &&
        cert.category !== categoryFilter
      ) {
        return false;
      }

      // status
      if (statusFilter !== "All statuses" && cert.status !== statusFilter) {
        return false;
      }

      // search
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${cert.name} ${cert.provider} ${cert.reference}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [decoratedCerts, expiryWindow, categoryFilter, statusFilter, search]);

  const categories = useMemo(() => {
    const set = new Set(certs.map((c) => c.category));
    return ["All categories", ...Array.from(set)];
  }, [certs]);

  const statusOptions = ["All statuses", "Active", "Expiring soon", "Expired"];

  function handleNewCertChange(e) {
    const { name, value } = e.target;
    setNewCert((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddCertification(e) {
    e.preventDefault();
    if (!newCert.name || !newCert.provider || !newCert.expiryDate) {
      alert("Please fill at least name, provider, and expiry date.");
      return;
    }
    const newItem = {
      ...newCert,
      id: Date.now(),
    };
    setCerts((prev) => [newItem, ...prev]);
    setNewCert({
      name: "",
      provider: "",
      category: "Cloud",
      issueDate: "",
      expiryDate: "",
      reference: "",
    });
  }

  function handleExportCsv() {
    if (!filteredCerts.length) {
      alert("No certifications in the current view to export.");
      return;
    }
    const header = [
      "Name",
      "Provider",
      "Category",
      "Issue date",
      "Expiry date",
      "Status",
      "Days left",
      "Reference",
    ];
    const rows = filteredCerts.map((c) => [
      `"${c.name}"`,
      `"${c.provider}"`,
      `"${c.category}"`,
      `"${formatDisplayDate(c.issueDate)}"`,
      `"${formatDisplayDate(c.expiryDate)}"`,
      `"${c.status}"`,
      `"${Number.isNaN(c.daysLeft) ? "" : c.daysLeft}"`,
      `"${c.reference || ""}"`,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frogtrack-certifications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCalendar() {
    const eligible = filteredCerts.filter(
      (c) => c.expiryDate && c.daysLeft >= 0
    );
    if (!eligible.length) {
      alert("No upcoming expiries in this view to export.");
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dtStamp = `${now.getUTCFullYear()}${pad(
      now.getUTCMonth() + 1
    )}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(
      now.getUTCMinutes()
    )}${pad(now.getUTCSeconds())}Z`;

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FrogTrack//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    eligible.forEach((cert) => {
      const d = new Date(cert.expiryDate);
      const dt = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
        d.getDate()
      )}`;

      const summary = `Renew ${cert.name}`;
      const description = [
        `Provider: ${cert.provider}`,
        `Category: ${cert.category}`,
        cert.reference ? `Reference: ${cert.reference}` : "",
        "",
        "Generated by FrogTrack",
      ]
        .filter(Boolean)
        .join("\\n");

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${cert.id}@frogtrack`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dt}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");

    const ics = lines.join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frogtrack-renewals.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="ft-dashboard-page">
      {/* HERO */}
      <section className="ft-dashboard-hero">
        <div className="ft-hero-copy">
          <p className="ft-eyebrow">User dashboard</p>
          <h1 className="ft-hero-title">Track every certification in one clean view.</h1>
          <p className="ft-hero-subtitle">
            Filter by category, status, or expiry window, then export the exact slice you
            care about to CSV or a renewal calendar.
          </p>

          <div className="ft-pill-row">
            <button
              className={`ft-pill ${
                statusFilter === "All statuses" ? "ft-pill-active" : ""
              }`}
              onClick={() => setStatusFilter("All statuses")}
            >
              All&nbsp;
              <span className="ft-pill-count">{decoratedCerts.length}</span>
            </button>
            <button
              className={`ft-pill ${statusFilter === "Active" ? "ft-pill-active" : ""}`}
              onClick={() => setStatusFilter("Active")}
            >
              Active&nbsp;<span className="ft-pill-count">{stats.active}</span>
            </button>
            <button
              className={`ft-pill ${
                statusFilter === "Expiring soon" ? "ft-pill-active" : ""
              }`}
              onClick={() => setStatusFilter("Expiring soon")}
            >
              Expiring ≤ 30 days&nbsp;
              <span className="ft-pill-count">{stats.expiringSoon}</span>
            </button>
            <button
              className={`ft-pill ${
                statusFilter === "Expired" ? "ft-pill-active" : ""
              }`}
              onClick={() => setStatusFilter("Expired")}
            >
              Expired&nbsp;<span className="ft-pill-count">{stats.expired}</span>
            </button>
          </div>
        </div>

        <aside className="ft-hero-card">
          <p className="ft-hero-card-label">Today&apos;s snapshot</p>
          <div className="ft-hero-metrics">
            <div className="ft-hero-metric">
              <span className="ft-hero-metric-label">Active</span>
              <span className="ft-hero-metric-value">{stats.active}</span>
            </div>
            <div className="ft-hero-metric">
              <span className="ft-hero-metric-label">Expiring ≤ 30 days</span>
              <span className="ft-hero-metric-value">{stats.expiringSoon}</span>
            </div>
            <div className="ft-hero-metric">
              <span className="ft-hero-metric-label">Expired</span>
              <span className="ft-hero-metric-value">{stats.expired}</span>
            </div>
          </div>
          <p className="ft-hero-footnote">
            {earliestUpcoming ? (
              <>
                Next renewal: <strong>{earliestUpcoming.name}</strong> in{" "}
                <strong>{earliestUpcoming.daysLeft} days</strong>.
              </>
            ) : (
              "No upcoming renewals yet. You’re all clear."
            )}
          </p>
        </aside>
      </section>

      {/* ACTIONS */}
      <section className="ft-dashboard-actions">
        <div>
          <h2 className="ft-section-title">My certifications</h2>
          <p className="ft-section-subtitle">
            Filters, CSV, and calendar exports always respect your current view.
          </p>
        </div>
        <div className="ft-action-buttons">
          <button className="ft-btn ft-btn-ghost" onClick={handleExportCsv}>
            Export CSV
          </button>
          <button className="ft-btn ft-btn-solid" onClick={handleExportCalendar}>
            Export calendar (.ics)
          </button>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="ft-filter-bar">
        <div className="ft-filter-group">
          <span className="ft-filter-label">Expiry window</span>
          <div className="ft-filter-pills">
            {EXPIRY_WINDOWS.map((label) => (
              <button
                key={label}
                className={`ft-mini-pill ${
                  expiryWindow === label ? "ft-mini-pill-active" : ""
                }`}
                onClick={() => setExpiryWindow(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ft-filter-group">
          <label className="ft-filter-label">
            Category
            <select
              className="ft-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="ft-filter-group">
          <label className="ft-filter-label">
            Status
            <select
              className="ft-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((st) => (
                <option key={st}>{st}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="ft-filter-group ft-filter-search">
          <label className="ft-filter-label">
            Search
            <input
              className="ft-input"
              type="text"
              placeholder="Name, provider, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* GRID: TABLE + FORM */}
      <section className="ft-dashboard-grid">
        <div className="ft-table-card">
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
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ft-table-empty">
                    No certifications match this view. Try widening the filters.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id}>
                    <td>{cert.name}</td>
                    <td>{cert.provider}</td>
                    <td>{cert.category}</td>
                    <td>{formatDisplayDate(cert.issueDate)}</td>
                    <td>{formatDisplayDate(cert.expiryDate)}</td>
                    <td>
                      {Number.isNaN(cert.daysLeft)
                        ? "-"
                        : cert.daysLeft === 0
                        ? "Today"
                        : cert.daysLeft}
                    </td>
                    <td>
                      <span
                        className={`ft-status-pill ${
                          cert.status === "Active"
                            ? "ft-status-active"
                            : cert.status === "Expiring soon"
                            ? "ft-status-soon"
                            : "ft-status-expired"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td>{cert.reference || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="ft-tip">
            Tip: slice by expiry window or status, then export CSV or calendar for just
            that segment of your portfolio.
          </p>
        </div>

        <aside className="ft-form-card">
          <h3 className="ft-form-title">Add certification</h3>
          <p className="ft-form-subtitle">
            Quickly drop a new certification into your portfolio. Everything stays in
            your browser for now.
          </p>

          <form className="ft-form" onSubmit={handleAddCertification}>
            <label className="ft-field">
              <span>Certification name</span>
              <input
                type="text"
                name="name"
                value={newCert.name}
                onChange={handleNewCertChange}
                placeholder="e.g., AWS Solutions Architect – Professional"
                className="ft-input"
              />
            </label>

            <label className="ft-field">
              <span>Issuing organisation</span>
              <input
                type="text"
                name="provider"
                value={newCert.provider}
                onChange={handleNewCertChange}
                placeholder="e.g., AWS, Microsoft, Google Cloud"
                className="ft-input"
              />
            </label>

            <label className="ft-field">
              <span>Category</span>
              <select
                name="category"
                value={newCert.category}
                onChange={handleNewCertChange}
                className="ft-select"
              >
                <option>Cloud</option>
                <option>DevOps</option>
                <option>Programming</option>
                <option>Security</option>
                <option>Management</option>
                <option>Data</option>
                <option>Other</option>
              </select>
            </label>

            <div className="ft-field-row">
              <label className="ft-field">
                <span>Issue date</span>
                <input
                  type="date"
                  name="issueDate"
                  value={newCert.issueDate}
                  onChange={handleNewCertChange}
                  className="ft-input"
                />
              </label>
              <label className="ft-field">
                <span>Expiry date</span>
                <input
                  type="date"
                  name="expiryDate"
                  value={newCert.expiryDate}
                  onChange={handleNewCertChange}
                  className="ft-input"
                  required
                />
              </label>
            </div>

            <label className="ft-field">
              <span>Certificate ID / reference</span>
              <input
                type="text"
                name="reference"
                value={newCert.reference}
                onChange={handleNewCertChange}
                placeholder="e.g., 1234-ABCD"
                className="ft-input"
              />
            </label>

            <button type="submit" className="ft-btn ft-btn-solid ft-btn-full">
              Save certification
            </button>
          </form>

          <p className="ft-form-footnote">
            Future version: sync this with a backend (MySQL + API) so you can log in
            from anywhere.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default Dashboard;
