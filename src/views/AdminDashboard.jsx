import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import AdminStatsRow from "./AdminStatsRow.jsx";
import AdminQualityPanel from "./AdminQualityPanel.jsx";
import AdminInsightsPanel from "./AdminInsightsPanel.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function computeDaysLeft(expiryDateString) {
  if (!expiryDateString) return NaN;
  const today = new Date();
  const expiry = new Date(expiryDateString);
  const diffMs = expiry.getTime() - today.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function enrichCert(row) {
  const issueDate = row.issue_date || row.issueDate || null;
  const expiryDate = row.expiry_date || row.expiryDate || null;

  const issueObj =
    issueDate && !Number.isNaN(new Date(issueDate).getTime())
      ? new Date(issueDate)
      : null;
  const expiryObj =
    expiryDate && !Number.isNaN(new Date(expiryDate).getTime())
      ? new Date(expiryDate)
      : null;

  const daysLeft = computeDaysLeft(expiryDate);

  let status = "Unknown";
  if (!Number.isNaN(daysLeft)) {
    if (daysLeft < 0) status = "Expired";
    else if (daysLeft <= 30) status = "Expiring soon";
    else status = "Active";
  }

  return {
    ...row,
    issueDate,
    expiryDate,
    issueObj,
    expiryObj,
    daysLeft,
    status,
  };
}

function countByKey(items, key) {
  const map = new Map();
  for (const row of items) {
    let raw = row[key];
    if (!raw || typeof raw !== "string") raw = "Unspecified";
    const label = raw.trim() || "Unspecified";
    map.set(label, (map.get(label) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/certifications`);

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("API did not return an array");
        }

        if (!cancelled) {
          setRows(data);
        }
      } catch (err) {
        console.error("Admin load failed", err);
        if (!cancelled) {
          setError(
            "Could not load certifications for admin view. Check the API on port 4000."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const certs = useMemo(() => rows.map(enrichCert), [rows]);

  // -------- Overview stats --------
  const stats = useMemo(() => {
    const total = certs.length;
    let active = 0;
    let expiring30 = 0;
    let expiring90 = 0;
    let expired = 0;

    for (const c of certs) {
      if (Number.isNaN(c.daysLeft)) continue;

      if (c.daysLeft < 0) {
        expired++;
      } else {
        active++;
        if (c.daysLeft <= 30) expiring30++;
        if (c.daysLeft <= 90) expiring90++;
      }
    }

    return { total, active, expiring30, expiring90, expired };
  }, [certs]);

  // -------- Data quality --------
  const quality = useMemo(() => {
    const total = certs.length;
    if (!total) {
      return {
        completenessScore: 100,
        missingExpiry: 0,
        missingIssue: 0,
        missingProvider: 0,
        missingCategory: 0,
        missingUrl: 0,
        missingId: 0,
      };
    }

    let missingExpiry = 0;
    let missingIssue = 0;
    let missingProvider = 0;
    let missingCategory = 0;
    let missingUrl = 0;
    let missingId = 0;

    for (const c of certs) {
      if (!c.expiryDate) missingExpiry++;
      if (!c.issueDate) missingIssue++;
      if (!c.provider) missingProvider++;
      if (!c.category) missingCategory++;
      if (!c.cert_url && !c.certUrl) missingUrl++;
      if (!c.cert_id && !c.certId) missingId++;
    }

    const fieldsPerRow = 6;
    const totalFields = total * fieldsPerRow;
    const totalMissing =
      missingExpiry +
      missingIssue +
      missingProvider +
      missingCategory +
      missingUrl +
      missingId;

    const completenessScore = Math.max(
      0,
      Math.round(100 - (totalMissing / totalFields) * 100)
    );

    return {
      completenessScore,
      missingExpiry,
      missingIssue,
      missingProvider,
      missingCategory,
      missingUrl,
      missingId,
    };
  }, [certs]);

  // -------- Provider / category breakdown --------
  const providerStats = useMemo(() => countByKey(rows, "provider"), [rows]);
  const categoryStats = useMemo(() => countByKey(rows, "category"), [rows]);

  // -------- Recent & anomalies --------
  const recent = useMemo(() => {
    return [...certs]
      .sort((a, b) => {
        const aTime =
          (a.issueObj && a.issueObj.getTime()) ||
          (a.expiryObj && a.expiryObj.getTime()) ||
          0;
        const bTime =
          (b.issueObj && b.issueObj.getTime()) ||
          (b.expiryObj && b.expiryObj.getTime()) ||
          0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [certs]);

  const anomalies = useMemo(() => {
    const items = [];
    for (const c of certs) {
      if (c.issueObj && c.expiryObj && c.expiryObj < c.issueObj) {
        items.push({ type: "Expiry before issue date", cert: c });
      } else if (!c.expiryDate) {
        items.push({ type: "Missing expiry date", cert: c });
      }
      if (items.length >= 6) break;
    }
    return items;
  }, [certs]);

  return (
    <div className="ft-admin-page">
      <header className="ft-admin-header">
        <div>
          <p className="ft-admin-kicker">FrogTrack control room</p>
          <h1 className="ft-admin-title">Admin console</h1>
          <p className="ft-admin-subtitle">
            High-level view of every certification in the system. Monitor risk,
            fix data quality, and spot issues before they break reports.
          </p>
        </div>

        <AdminStatsRow stats={stats} loading={loading} />
      </header>

      {error && <div className="ft-admin-alert">{error}</div>}

      <main className="ft-admin-grid">
        <AdminQualityPanel
          quality={quality}
          total={certs.length}
          loading={loading}
        />

        <AdminInsightsPanel
          providers={providerStats}
          categories={categoryStats}
          recent={recent}
          anomalies={anomalies}
          loading={loading}
        />
      </main>
    </div>
  );
}
