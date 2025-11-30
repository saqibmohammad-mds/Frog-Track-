import React from "react";

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

export default function AdminInsightsPanel({
  providers,
  categories,
  recent,
  anomalies,
  loading,
}) {
  return (
    <section className="ft-admin-card ft-admin-card--insights">
      <header className="ft-admin-card-header">
        <h2 className="ft-admin-card-title">System insights</h2>
        <p className="ft-admin-card-subtitle">
          Who is issuing most of your certs, what domains they sit in, and
          where things look off.
        </p>
      </header>

      <div className="ft-admin-insights-grid">
        <div>
          <h3 className="ft-admin-section-heading">Top providers</h3>
          <ul className="ft-admin-mini-list">
            {(loading ? [] : providers.slice(0, 6)).map((p) => (
              <li key={p.label}>
                <span className="ft-admin-mini-label">{p.label}</span>
                <span className="ft-admin-mini-value">{p.count}</span>
              </li>
            ))}
            {!loading && providers.length === 0 && (
              <li className="ft-admin-empty">No providers yet.</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="ft-admin-section-heading">Top categories</h3>
          <ul className="ft-admin-mini-list">
            {(loading ? [] : categories.slice(0, 6)).map((c) => (
              <li key={c.label}>
                <span className="ft-admin-mini-label">{c.label}</span>
                <span className="ft-admin-mini-value">{c.count}</span>
              </li>
            ))}
            {!loading && categories.length === 0 && (
              <li className="ft-admin-empty">No categories yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="ft-admin-activity-grid">
        <div>
          <h3 className="ft-admin-section-heading">Recent additions</h3>
          <ul className="ft-admin-activity-list">
            {(loading ? [] : recent).map((c) => (
              <li key={c.id || c.name + c.certId}>
                <div className="ft-admin-activity-main">
                  <span className="ft-admin-activity-name">{c.name}</span>
                  <span className="ft-admin-activity-meta">
                    {c.provider || "Unspecified"} ·{" "}
                    {formatDate(c.issueDate || c.expiryDate)}
                  </span>
                </div>
                <span className="ft-admin-activity-status">{c.status}</span>
              </li>
            ))}
            {!loading && recent.length === 0 && (
              <li className="ft-admin-empty">No certifications recorded yet.</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="ft-admin-section-heading">Data issues to review</h3>
          <ul className="ft-admin-activity-list">
            {(loading ? [] : anomalies).map((item, idx) => (
              <li key={idx}>
                <div className="ft-admin-activity-main">
                  <span className="ft-admin-activity-name">
                    {item.cert.name}
                  </span>
                  <span className="ft-admin-activity-meta">
                    {item.type} · {item.cert.provider || "Unspecified"}
                  </span>
                </div>
                <span className="ft-admin-activity-issue">Needs fix</span>
              </li>
            ))}
            {!loading && anomalies.length === 0 && (
              <li className="ft-admin-empty">
                No obvious issues detected. Nice work.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
