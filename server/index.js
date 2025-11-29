// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// --- Middleware ---
// Allow all origins in dev – simple and safe enough for local use
app.use(cors());

app.use(express.json());

// --- DB pool ---
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Helper to map DB row -> API shape (camelCase)
function mapCertRow(row) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    category: row.category,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    certId: row.cert_id,
    certUrl: row.cert_url,
    notes: row.notes,
  };
}

// --- Health check ---
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({
      status: "ok",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// --- GET all certifications ---
app.get("/api/certifications", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, provider, category,
              issue_date, expiry_date, cert_id, cert_url, notes
       FROM certifications
       ORDER BY expiry_date ASC NULLS LAST, name ASC`
    );

    const mapped = result.rows.map(mapCertRow);
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/certifications failed:", err.message);
    res.status(500).json({ message: "Failed to fetch certifications" });
  }
});

// --- POST create a new certification ---
app.post("/api/certifications", async (req, res) => {
  try {
    const {
      name,
      provider,
      category,
      issueDate,
      expiryDate,
      certId,
      certUrl,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const result = await pool.query(
      `INSERT INTO certifications
         (name, provider, category,
          issue_date, expiry_date, cert_id, cert_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, provider, category,
                 issue_date, expiry_date, cert_id, cert_url, notes`,
      [
        name,
        provider || null,
        category || null,
        issueDate || null,
        expiryDate || null,
        certId || null,
        certUrl || null,
        notes || null,
      ]
    );

    const created = mapCertRow(result.rows[0]);
    res.status(201).json(created);
  } catch (err) {
    console.error("POST /api/certifications failed:", err.message);
    res.status(500).json({ message: "Failed to create certification" });
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🐸 FrogTrack API running at http://localhost:${port}`);
});
