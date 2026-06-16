"use strict";

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzgfWqJVIjbmd1HSbnwocgVMtYagpHlAPugwzSWxwX4uaLvHVXe7WQrlEYtIX-1lTt6_Q/exec";

function randomToken() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let i = 0; i < 28; i++) t += c[Math.floor(Math.random() * c.length)];
  return t;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Vercel handler ───────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();

  const BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.URL || "https://careersapplication.vercel.app");

  try {
    // ── GET ──
    if (req.method === "GET") {
      const q = req.query || {};

      if (q.action === "get" && q.token) {
        // Blobs not available on Vercel — localStorage is the source of truth
        return res.status(200).json({ success: false, error: "Not found" });
      }

      if (q.action === "list") {
        const secret = process.env.INTAKE_SECRET;
        if (secret && q.secret !== secret) {
          return res.status(401).end("Unauthorized");
        }
        return res.status(200).json({ success: true, count: 0, submissions: [] });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    // ── POST ──
    if (req.method === "POST") {
      const body = req.body || {};

      const token = body.token && body.token.length > 10 ? body.token : randomToken();

      const data = {
        timestamp:        body.timestamp        || new Date().toISOString(),
        updated_at:       new Date().toISOString(),
        full_name:        body.full_name        || "",
        company:          body.company          || "",
        email:            body.email            || "",
        whatsapp:         body.whatsapp         || "",
        role_description: body.role_description || "",
        links:            body.links            || [],
        file_name:        body.file?.name       || null,
        file_size:        body.file?.size       || null,
        file_base64:      body.file?.data       || "",
        file_filename:    body.file?.name       || "",
      };

      const clientQ = data.company ? `&client=${encodeURIComponent(data.company)}` : "";
      const editLink = `${BASE_URL}/intake.html?token=${token}${clientQ}`;

      // Push to Google Sheets (awaited so Vercel doesn't kill it)
      await fetch(SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token, editLink }),
      });

      return res.status(200).json({ success: true, token, editLink });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[intake-submit]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
