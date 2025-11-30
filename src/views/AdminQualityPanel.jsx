import React from "react";

export default function AdminQualityPanel({ quality, total, loading }) {
  const {
    completenessScore,
    missingExpiry,
    missingIssue,
    missingProvider,
    missingCategory,
    missingUrl,
    missingId,
  } = quality;

  return (
    <section className="ft-admin-card ft-admin-card--quality">
      <header className="ft-admin-card-header">
        <h2 className="ft-admin-card-title">Data quality radar</h2>
        <p className="ft-admin-card-subtitle">
          See how clean your certification dataset is before you trust it in a
          board slide.
        </p>
      </header>

      <div className="ft-admin-quality-layout">
        <div className="ft-admin-quality-score">
          <div className="ft-admin-quality-ring">
            <span className="ft-admin-quality-number">
              {loading ? "…" : completenessScore}
            </span>
            <span className="ft-admin-quality-label">Score / 100</span>
          </div>
          <p className="ft-admin-quality-caption">
            Across {loading ? "…" : total} certifications.
          </p>
        </div>

        <ul className="ft-admin-quality-list">
          <li>
            <span>Missing expiry date</span>
            <span className="ft-admin-quality-count">{missingExpiry}</span>
          </li>
          <li>
            <span>Missing issue date</span>
            <span className="ft-admin-quality-count">{missingIssue}</span>
          </li>
          <li>
            <span>Missing provider</span>
            <span className="ft-admin-quality-count">{missingProvider}</span>
          </li>
          <li>
            <span>Missing category</span>
            <span className="ft-admin-quality-count">{missingCategory}</span>
          </li>
          <li>
            <span>Missing certificate URL</span>
            <span className="ft-admin-quality-count">{missingUrl}</span>
          </li>
          <li>
            <span>Missing reference / ID</span>
            <span className="ft-admin-quality-count">{missingId}</span>
          </li>
        </ul>
      </div>

      <p className="ft-admin-card-footnote">
        Pro-tip: keep expiry and provider fields close to 100% complete before
        wiring this into any compliance-critical reporting.
      </p>
    </section>
  );
}
