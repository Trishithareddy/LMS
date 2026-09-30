// src/containers/SaveToLmsButton.jsx
import React, { useState } from "react";
import { connect } from "react-redux";

/** Read token from ?token=... if you open iframe like /scratch?token=... */
const getToken = () => new URLSearchParams(window.location.search).get("token");

/** Your LMS API base (same-origin if you serve Scratch at /scratch). */
const API_BASE = window.location.origin;

function SaveToLmsButton({ vm }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg("Exporting project…");

      // 1) Export sb3 from Scratch VM
      const blob = await vm.saveProjectSb3();

      // 2) Build FormData
      const fd = new FormData();
      const name = document.title || "scratch-project";
      fd.append("file", blob, `${name}.sb3`);
      fd.append("name", name);

      // 3) Upload to LMS API
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/scratch/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      });

      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      const data = await res.json(); // {fileUrl, id, ...}
      setMsg(`Saved! URL: ${data.fileUrl}`);
      // You can also store data.fileUrl in localStorage if you want
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ultra-simple UI; style it how you like
  return (
    <div style={{
      position: "fixed", right: 12, top: 12, zIndex: 9999,
      background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 8
    }}>
      <button onClick={handleSave} disabled={saving} style={{ padding: "6px 10px" }}>
        {saving ? "Saving…" : "Save to LMS"}
      </button>
      {msg && <div style={{ marginTop: 6, fontSize: 12 }}>{msg}</div>}
    </div>
  );
}

export default connect(state => ({ vm: state.scratchGui.vm }))(SaveToLmsButton);
