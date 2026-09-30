import React, { Component } from "react";
import Instructions from "../components/instructions/instructions.jsx";

/**
 * Determine the backend base URL for *chapter/project* routes.
 * We pass ?apiBase= from the LMS (e.g. http://localhost:5000).
 * Do NOT append /api here — only /auth lives behind /api.
 */
// const pickApiBase = () => {
//   try {
//     const fromWindow =
//       (typeof window !== "undefined" && (window.__API_BASE__ || window.API_BASE)) || "";
//     const fromQuery = new URL(window.location.href).searchParams.get("apiBase") || "";
//     const base = (fromQuery || fromWindow || "/api").replace(/\/+$/, "");
//     return base || "/api";
//   } catch {
//     return "/api";
//   }
// };

// const BASE = pickApiBase();         // e.g. http://localhost:5000
// const AUTH_BASE = `${BASE}/api`;    // only auth/me is under /api

// Normalize to a root that DEFINITELY points at `/api`
 const pickApiRoot = () => {
   try {
     const url = new URL(window.location.href);
     const qApiBase = url.searchParams.get("apiBase") || ""; // our LMS passes this
     const qApi     = url.searchParams.get("api") || "";     // some builds pass this
     const fromWindow =
       (typeof window !== "undefined" && (window.__API_BASE__ || window.API_BASE)) || "";
     // prefer query params, then window, finally "/api"
     const root = (qApi || qApiBase || fromWindow || "/api").replace(/\/+$/, "");
     // Ensure it ends with /api exactly once
     return root.endsWith("/api") ? root : `${root}/api`;
   } catch {
     return "/api";
   }
 };

 const API_ROOT = pickApiRoot();     // e.g. http://localhost:5000/api
// Read token & edit flag from URL that the LMS added
const qs = new URL(window.location.href).searchParams;
const TOKEN = qs.get("token") || "";
const AUTH  = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
const CAN_EDIT_FLAG = qs.get("canEdit") === "1";

class InstructionsContainer extends Component {
  state = {
    loading: true,
    text: "",
    canEdit: false,
    error: ""
  };

  componentDidMount() {
    this.load().catch((e) => {
      console.error("Instructions initial load failed:", e);
      this.setState({ loading: false, error: e?.message || "Load failed" });
    });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.projectId !== this.props.projectId ||
      prevProps.chapterId !== this.props.chapterId
    ) {
      this.load().catch((e) => {
        console.error("Instructions reload failed:", e);
        this.setState({ loading: false, error: e?.message || "Load failed" });
      });
    }
  }

  // Prefer props; fallback to URL params. In our LMS, ?id= is the CHAPTER id.
  ids() {
    let projectId = this.props.projectId || "";
    let chapterId = this.props.chapterId || "";
    try {
      const url = new URL(window.location.href);
      chapterId = chapterId || url.searchParams.get("chapterId") || url.searchParams.get("id");
      projectId = projectId || url.searchParams.get("projectId");
    } catch {}
    return { projectId, chapterId };
  }

  async load() {
    const { projectId, chapterId } = this.ids();
    this.setState({ loading: true, error: "" });

    // 1) Who can edit? (URL flag wins; else check role via /api/auth/me if we have a token)
    let canEdit = CAN_EDIT_FLAG;
    if (!canEdit && TOKEN) {
      try {
        //const meRes = await fetch(`${AUTH_BASE}/auth/me`, { headers: AUTH });
        const meRes = await fetch(`${API_ROOT}/auth/me`, { headers: AUTH });
        if (meRes.ok) {
          const me = await meRes.json().catch(() => ({}));
          const role = me?.user?.role || me?.role;
          if (role === "admin" || role === "superadmin") canEdit = true;
        }
      } catch {
        /* read-only if auth check fails */
      }
    }
    // console.log("[Instructions] canEdit =", canEdit);

    // 2) Build the read URL (chapters/projects/default live at BASE, not BASE + /api)
    let readUrl;
    if (chapterId) {
     // readUrl = `${BASE}/chapters/${encodeURIComponent(chapterId)}/instructions`;
     readUrl = `${API_ROOT}/chapters/${encodeURIComponent(chapterId)}/instructions`;
    } else if (projectId) {
      //readUrl = `${BASE}/projects/${encodeURIComponent(projectId)}/instructions`;
       readUrl = `${API_ROOT}/projects/${encodeURIComponent(projectId)}/instructions`;
    } else {
      //readUrl = `${BASE}/instructions/default`;
      readUrl = `${API_ROOT}/instructions/default`;
    }

    // 3) Fetch instructions (send token if present)
    try {
      const res = await fetch(readUrl, { headers: AUTH });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = (await res.json().catch(() => ({}))) || {};
      this.setState({ text: data.text || "", canEdit, loading: false, error: "" });
    } catch (e) {
      console.error("Instructions fetch error:", e);
      this.setState({ text: "", canEdit, loading: false, error: "" });
    }
  }

  onSave = async (newText) => {
    const { projectId, chapterId } = this.ids();
    let url;
    // if (chapterId) url = `${BASE}/chapters/${encodeURIComponent(chapterId)}/instructions`;
    // else if (projectId) url = `${BASE}/projects/${encodeURIComponent(projectId)}/instructions`;
    // else url = `${BASE}/instructions/default`;
    if (chapterId) url = `${API_ROOT}/chapters/${encodeURIComponent(chapterId)}/instructions`;
 else if (projectId) url = `${API_ROOT}/projects/${encodeURIComponent(projectId)}/instructions`;
 else url = `${API_ROOT}/instructions/default`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH },
      body: JSON.stringify({ text: String(newText || "") })
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `Save failed (${res.status})`);
    }
    this.setState({ text: newText });
  };

  render() {
    const { loading, text, canEdit, error } = this.state;
    const style = { display: "flex", alignItems: "center" };
    if (loading) return <div style={style}>Loading instructions…</div>;
    return (
      <div style={style}>
        {error ? <span style={{ color: "#b00", marginRight: 8 }}>⚠ {error}</span> : null}
        <Instructions text={text} canEdit={canEdit} onSave={this.onSave} label="Instructions" />
      </div>
    );
  }
}

export default InstructionsContainer;