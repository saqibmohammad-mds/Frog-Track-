import { useState, useRef, useEffect } from "react";
import "./App.css";
import UserDashboard from "./views/UserDashboard.jsx";
import AdminDashboard from "./views/AdminDashboard.jsx";

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
      {activeView === "admin" && <AdminDashboard />}
    </div>
  );
}

/* HOME HERO */
function HomeHero({ onOpenDashboard, onOpenAdmin }) {
  const heroRef = useRef(null);

  return (
    <main ref={heroRef} className="hero">
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

      {/* Little frog buddy that runs away & hops randomly */}
      <FrogBuddy containerRef={heroRef} />
    </main>
  );
}

/* FROG BUDDY – avoids cursor + random hops */
function FrogBuddy({ containerRef }) {
  const [position, setPosition] = useState({ x: 70, y: 35 }); // % inside hero
  const [isJumping, setIsJumping] = useState(false);

  // helper: jump to a random spot
  function jumpRandom() {
    const newX = 18 + Math.random() * 64; // 18–82% width
    const newY = 18 + Math.random() * 50; // 18–68% height

    setIsJumping(true);
    setPosition({ x: newX, y: newY });

    setTimeout(() => {
      setIsJumping(false);
    }, 420);
  }

  // 1) Run away from cursor when too close
  useEffect(() => {
    function handleMove(e) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const frogX = rect.left + (position.x / 100) * rect.width;
      const frogY = rect.top + (position.y / 100) * rect.height;

      const dx = e.clientX - frogX;
      const dy = e.clientY - frogY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 130 && !isJumping) {
        jumpRandom();
      }
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [containerRef, position, isJumping]);

  // 2) Random hop every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isJumping) {
        jumpRandom();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isJumping]);

  return (
    <div
      className={`frogbuddy ${isJumping ? "frogbuddy--jumping" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    >
      <span className="frogbuddy-face">🐸</span>
    </div>
  );
}

export default App;
