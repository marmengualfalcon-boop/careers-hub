"use strict";

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzgfWqJVIjbmd1HSbnwocgVMtYagpHlAPugwzSWxwX4uaLvHVXe7WQrlEYtIX-1lTt6_Q/exec";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  if (!body.full_name?.trim()) {
    return res.status(422).json({ error: "full_name is required" });
  }

  try {
    await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheetName:        "Pipeline Candidatos",
        full_name:        body.full_name        || "",
        email:            body.email            || "",
        phone:            body.phone            || "",
        location:         body.location         || "",
        current_title:    body.current_title    || "",
        current_company:  body.current_company  || "",
        linkedin_url:     body.linkedin_url     || "",
        skills:           body.skills           || "",
        education_degree: body.education_degree || "",
        cv_base64:        body.cv_base64        || "",
        cv_filename:      body.cv_filename      || "",
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[submit] FAILED:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
