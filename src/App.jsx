import { useState } from "react";
import "./App.css";
import UserDashboard from "./views/UserDashboard.jsx";

function App() {
  const [activeView, setActiveView] = useState("home");

  const handleOpenDashboard = () => setActiveView("dashboard");
  const handleOpenAdmin = () => setActiveView("admin");

  return (
    <div className="app">
      <header className="top-bar">
        <div className="logo">
          Frog<span>Track</span>
        </div>

        <nav className="nav">
          <button
            className={`nav-link ${
              activeView === "home" ? "nav-link-active" : ""
            }`}
            onClick={() => setActiveView("home")}
          >
            Home
          </button>
          <button
            className={`nav-link ${
              activeView === "dashboard" ? "nav-link-active" : ""
            }`}
            onClick={() => setActiveView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-link pill ${
              activeView === "admin" ? "nav-link-active" : ""
            }`}
            onClick={() => setActiveView("admin")}
          >
            Admin
          </button>
        </nav>
      </header>

      {activeView === "home" && (
        <HomeHero
          onOpenDashboard={handleOpenDashboard}
          onOpenAdmin={handleOpenAdmin}
        />
      )}

      {activeView === "dashboard" && <UserDashboard />}
      {activeView === "admin" && <AdminView />}
    </div>
  );
}

/* HOME HERO */
function HomeHero({ onOpenDashboard, onOpenAdmin }) {
  return (
    <main className="hero">
      <section className="hero-text">
        <p className="eyebrow">CERTIFICATION CONTROL, MINUS THE SPREADSHEETS.</p>

        <h1>
          Never let a <span className="highlight">certificate</span> expire in
          silence.
        </h1>

        <p className="hero-subtitle">
          FrogTrack keeps all your professional certifications, expiry dates,
          and renewal status in one place – so you always know what&apos;s
          active, expiring soon, or already expired.
        </p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={onOpenDashboard}>
            Open user dashboard (mock)
          </button>
          <button className="ghost-btn" onClick={onOpenAdmin}>
            Preview admin view
          </button>
        </div>

        <p className="hint">
          Buttons are placeholder for now. Next steps: wire them to real screens
          and add data.
        </p>
      </section>

      <section className="hero-card">
        <div className="hero-card-header">
          <p className="hero-card-title">Today&apos;s snapshot</p>
          <span className="hero-card-pill">Demo data</span>
        </div>

        <div className="hero-card-metrics">
          <div className="metric">
            <span className="metric-label">Active</span>
            <span className="metric-value">12</span>
          </div>
          <div className="metric">
            <span className="metric-label">Expiring 30 days</span>
            <span className="metric-value warning">3</span>
          </div>
          <div className="metric">
            <span className="metric-label">Expired</span>
            <span className="metric-value danger">1</span>
          </div>
        </div>

        <div className="hero-card-footer">
          <p>Next renewal: AWS Solutions Architect – in 18 days.</p>
          <p className="small">
            Admin can verify, mark renewal in progress, and track completion.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ADMIN VIEW (still simple for now) */
function AdminView() {
  return (
    <main className="view-shell">
      <div className="view-header">
        <h1>Admin control</h1>
        <p>
          Admins will get a cross-user view of all certifications, with options
          to verify entries and mark renewals as in-progress or completed.
        </p>
      </div>

      <div className="view-body">
        <div className="placeholder-card">
          <h2>Admin view coming soon</h2>
          <p>
            Next, we&apos;ll mirror the dashboard table here but with filters by
            user, verification status, and renewal progress.
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;
