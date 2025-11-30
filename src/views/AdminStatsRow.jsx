import React from "react";

export default function AdminStatsRow({ stats, loading }) {
  const { total, active, expiring30, expiring90, expired } = stats;

  const cards = [
    {
      id: "total",
      label: "Total certifications",
      value: loading ? "…" : total,
      tone: "primary",
    },
    {
      id: "active",
      label: "Currently active",
      value: loading ? "…" : active,
      tone: "good",
    },
    {
      id: "expiring30",
      label: "Expiring ≤ 30 days",
      value: loading ? "…" : expiring30,
      tone: "warning",
    },
    {
      id: "expired",
      label: "Expired",
      value: loading ? "…" : expired,
      tone: "danger",
    },
  ];

  return (
    <div className="ft-admin-stat-row">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`ft-admin-stat-card ft-admin-stat-card--${card.tone}`}
        >
          <div className="ft-admin-stat-label">{card.label}</div>
          <div className="ft-admin-stat-value">{card.value}</div>
        </article>
      ))}
    </div>
  );
}
