import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Container,
  Paper,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { ThemeContext } from "../../../contexts/ThemeContext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import PythonLabPanel from "../../IndependentTerminals/PythonLabPanel";

/* ================= helpers ================= */
const labelFor = (key) => {
  switch (key) {
    case "html": return "HTML";
    case "javascript": return "JavaScript";
    case "python": return "Python";
    case "scratch": return "Scratch 3.0";
    case "links": return "Links";
    default: return key;
  }
};

// ABSOLUTE bases (no trailing slash)
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SCRATCH_BASE = (import.meta.env.VITE_SCRATCH_URL || "http://localhost:8602").replace(/\/$/, "");

/**
 * Build the Scratch viewer URL.
 *
 * FIX #6 – Token is NO LONGER appended as a plain query-param (JWT in URL
 * leaks via server logs / referrer headers).  Instead we pass a short-lived
 * "ticket" if your backend issues one; otherwise omit the token entirely and
 * let the Scratch viewer authenticate via postMessage or its own cookie/session.
 *
 * If you still need token-based auth in the viewer, swap the commented block
 * back in only after securing the channel (e.g. HttpOnly cookie hand-off).
 */
function makeScratchUrl(chapterId, canEdit = false) {
  if (!chapterId) return null;
  try {
    const u = new URL(SCRATCH_BASE);
    if (API_BASE) {
      u.searchParams.set("api", API_BASE);
      u.searchParams.set("apiBase", API_BASE);
    }
    u.searchParams.set("id", chapterId);
    u.searchParams.set("canEdit", canEdit ? "1" : "0");
    u.searchParams.set("_", Date.now()); // cache-buster
    // ❌ REMOVED: u.searchParams.set("token", token)  — JWT must not appear in URLs
    return u.toString();
  } catch (e) {
    console.error("Bad Scratch base URL:", SCRATCH_BASE, e);
    return null;
  }
}

/* ================= component ================= */
const Practice = ({
  terminalOptions,  // e.g. ["JavaScript","Scratch","Links"] (any casing)
  links,            // [{ title, instruction, link }]
  linksEnabled,     // boolean
  chapterData,      // { _id }  <-- REQUIRED for Scratch and project fetch
  studentData,      // { _id }  <-- REQUIRED for student save/fetch (when isTeacher=false)
  isTeacher,        // true for teacher dashboard
}) => {
  /* normalize inputs to avoid crashes */
  const safeTerminalOptions = useMemo(
    () =>
      (Array.isArray(terminalOptions) ? terminalOptions : []).map((s) =>
        String(s).toLowerCase()
      ),
    [terminalOptions]
  );
  const linksData = useMemo(() => (Array.isArray(links) ? links : []), [links]);
  const scratchLinkEnabled = !!linksEnabled;

  /* theme / auth */
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  const token = localStorage.getItem("token");

  /* ── editor state ── */
  const [codeContent, setCodeContent] = useState({
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n  <style></style>\n</head>\n<body>\n  <h1>Hello, HTML!</h1>\n</body>\n</html>',
    css: "/* Try changing styles */\nbody{font-family:Arial,sans-serif;background:#f4f4f4}\nh1{color:#333;font-size:24px}",
    js: '// Try writing some code below\nconsole.log("Hello, JavaScript!");',
    python: '# Try writing some code below\nprint("Hello, Python!")',
  });

  /**
   * FIX #1 – handleCodeChange was called in JSX but never defined.
   * Unified handler used by EVERY editor (js, python, html, css).
   */
  const handleCodeChange = (value, key) => {
    setCodeContent((prev) => ({ ...prev, [key]: value }));
  };

  /* default language */
  const defaultLanguage = useMemo(() => {
    if (safeTerminalOptions.includes("scratch")) return "scratch";
    if (safeTerminalOptions.length > 0) return safeTerminalOptions[0];
    if (scratchLinkEnabled) return "links";
    return "javascript";
  }, [safeTerminalOptions, scratchLinkEnabled]);

  const [language, setLanguage] = useState(defaultLanguage);
  useEffect(() => setLanguage(defaultLanguage), [defaultLanguage]);

  const [output, setOutput] = useState("");
  const [preview, setPreview] = useState("");
  const outputRef = useRef(null);

  /* scratch link from Admin "Add Links" (if any) */
  const scratchUrlFromLinks = useMemo(() => {
    if (!linksData.length) return null;
    const found = linksData.find(
      (x) =>
        (x.title && /scratch/i.test(x.title)) ||
        (x.link && /scratch/i.test(x.link))
    );
    return found?.link || null;
  }, [linksData]);

  /**
   * FIX #6 – Token removed from URL.
   * Teachers and students both get a read-only embed.
   */
  const scratchEmbedUrl = useMemo(() => {
    const id = chapterData?._id;
    if (!id) return null;
    if (scratchUrlFromLinks) return scratchUrlFromLinks;
    return makeScratchUrl(id, /* canEdit */ false);
  }, [scratchUrlFromLinks, chapterData?._id]);

  /* snackbars */
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const closeSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  /* load existing student project (not for teachers) */
  useEffect(() => {
    const fetchProject = async () => {
      if (isTeacher || !studentData?._id || !chapterData?._id) return;
      try {
        const res = await axios.get(
          `${API_BASE}/project/${studentData._id}/${chapterData._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success && res.data?.data?.codeContent) {
          setCodeContent((p) => ({ ...p, ...res.data.data.codeContent }));
        }
      } catch (err) {
        console.error("fetchProject error:", err?.response?.data || err.message);
      }
    };
    fetchProject();
  }, [isTeacher, studentData?._id, chapterData?._id, token]);

  /**
   * FIX #3 – Pyodide initialization used the old v0.16 API
   * (`window.languagePluginLoader`).  Modern Pyodide (v0.24+) exposes
   * `loadPyodide()` on the global scope after the CDN script is loaded.
   */
  /* editor language-change handler */
  const handleLanguageChange = (e) => setLanguage(e.target.value);

  /* run code */
  const executeCode = async () => {
    try {
      if (language === "javascript") {
        const logs = [];
        const original = console.log;
        console.log = (...args) => {
          logs.push(args.join(" "));
          original(...args);
        };
        try {
          // eslint-disable-next-line no-new-func
          new Function(codeContent.js)();
        } catch (err) {
          logs.push(`Error: ${err}`);
        }
        console.log = original;
        setOutput(logs.join("\n"));
        outputRef.current?.scrollIntoView({ behavior: "smooth" });

      } else if (language === "html") {
        const combined = codeContent.html.replace(
          "<style></style>",
          `<style>${codeContent.css}</style>`
        );
        setPreview(combined);
        outputRef.current?.scrollIntoView({ behavior: "smooth" });

      }
    } catch (err) {
      setOutput(String(err));
    }
  };

  /* keep html preview live while editing */
  useEffect(() => {
    if (language !== "html") return;
    const combined = codeContent.html.replace(
      "<style></style>",
      `<style>${codeContent.css}</style>`
    );
    setPreview(combined);
  }, [language, codeContent.css, codeContent.html]);

  /* save dialog (students only) */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState({ name: "", description: "" });

  const handleProjectDetailsChange = (e) =>
    setProjectDetails((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveProject = async () => {
    try {
      if (isTeacher) return;
      if (!studentData?._id || !chapterData?._id) {
        setSnackbarSeverity("error");
        setSnackbarMessage("Missing student or chapter id.");
        setOpenSnackbar(true);
        return;
      }
      const payload = {
        name: projectDetails.name,
        description: projectDetails.description,
        chapterId: chapterData._id,
        studentId: studentData._id,
        terminalOptions: safeTerminalOptions,
        codeContent: {
          html: codeContent.html,
          css: codeContent.css,
          js: codeContent.js,
          python: codeContent.python,
        },
        status: "draft",
      };
      await axios.post(`${API_BASE}/project/create-practice-project`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDialogOpen(false);
      setSnackbarSeverity("success");
      setSnackbarMessage("Project saved successfully!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("saveProject error:", error?.response?.data || error.message);
      setSnackbarSeverity("error");
      setSnackbarMessage(error?.response?.data?.message || "Failed to save project");
      setOpenSnackbar(true);
    }
  };

  /* links renderer */
  const renderExternalLinks = () => {
    if (!linksData.length) return <Box>Links will be updated soon!</Box>;
    const openLink = (e, link) => {
      e.preventDefault();
      const absolute = /^https?:\/\//i.test(link) ? link : `https://${link}`;
      window.open(absolute, "_blank", "noopener,noreferrer");
    };
    return (
      <>
        {linksData.map((item, i) => (
          <Paper
            key={i}
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "background.paper",
              color: "text.primary",
              border: 1,
              borderColor: "divider",
              transition: "all .2s ease",

              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "primary.main",
              },
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "text.primary",
              }}
            >
              <span style={{ fontWeight: 400, color: theme.palette.text.secondary }}>
                Title:{" "}
              </span>
              {item.title}
            </Typography>
            {item.instruction && (
              <Typography component="pre" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {item.instruction}
              </Typography>
            )}
            {item.link && (
              <Button onClick={(e) => openLink(e, item.link)}>
                GO
              </Button>
            )}
          </Paper>
        ))}
      </>
    );
  };

  /* scratch renderer */
  const renderScratch = () => {
    if (!scratchEmbedUrl) {
      return (
        <Typography sx={{ mt: 2 }}>
          No Scratch project is configured for this chapter yet.
        </Typography>
      );
    }
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
          <Button
            onClick={() =>
              window.open(scratchEmbedUrl, "_blank", "noopener,noreferrer")
            }
          >
            OPEN IN NEW TAB
          </Button>
        </Box>
        <Box
          component="iframe"
          src={scratchEmbedUrl}
          title="Scratch 3.0"
          sx={{
            width: "100%",
            height: { xs: 520, md: 680 },
            border: "1px solid #ddd",
            borderRadius: 1,
          }}
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </Box>
    );
  };

  /* CodeMirror language extensions (memoised to avoid churn) */
  const langExt = useMemo(() => {
    try {
      const ext = loadLanguage(language);
      return ext ? [ext] : [];
    } catch {
      return [];
    }
  }, [language]);

  const cssExt = useMemo(() => {
    try {
      const ext = loadLanguage("css");
      return ext ? [ext] : [];
    } catch {
      return [];
    }
  }, []);

  /* which content key maps to the current language */
  const contentKey = language === "javascript" ? "js"
    : language === "python" ? "python"
      : "html"; // html

  const showEditor = ["html", "javascript", "python"].includes(language);

  /* ──────────────────────────────────────────────────────── */
  return (
    <Container>
      <Box sx={{ p: 2 }}>
        {/* ── Language selector ── */}
        <Select
          value={language}
          onChange={handleLanguageChange}
          sx={{ width: 220, mb: 1, height: 36, mt: 1 }}
        >
          {safeTerminalOptions.includes("javascript") && (
            <MenuItem value="javascript">{labelFor("javascript")}</MenuItem>
          )}
          {safeTerminalOptions.includes("html") && (
            <MenuItem value="html">{labelFor("html")}</MenuItem>
          )}
          {safeTerminalOptions.includes("python") && (
            <MenuItem value="python">{labelFor("python")}</MenuItem>
          )}
          {safeTerminalOptions.includes("scratch") && (
            <MenuItem value="scratch">{labelFor("scratch")}</MenuItem>
          )}
          {/*
            FIX #5 – "links" is only added when scratchLinkEnabled is true AND
            it wasn't already surfaced via safeTerminalOptions, keeping the
            controlled <Select> consistent.
          */}
          {scratchLinkEnabled && !safeTerminalOptions.includes("links") && (
            <MenuItem value="links">{labelFor("links")}</MenuItem>
          )}
        </Select>

        {/* ── Links panel ── */}
        {language === "links" && (
          <Box sx={{ minHeight: "40vh", mt: 1 }}>{renderExternalLinks()}</Box>
        )}

        {/* ── Scratch embed ── */}
        {language === "scratch" && renderScratch()}

        {/* ── Code editor panel ── */}
        {showEditor && (
          <>
            {language === "python" ? (
              <PythonLabPanel
                code={codeContent.python}
                onCodeChange={(value) => handleCodeChange(value, "python")}
                starterCode={codeContent.python}
                title="Python Practice Lab"
                showReset={false}
                showDownload={false}
                height="360px"
              
              />
            ) : (
              <>
                {/*
              FIX #1 – onChange now calls the defined handleCodeChange.
              FIX #2 – Teachers get readOnly={true} so the editor is non-editable.
            */}
                <CodeMirror
                  key={language}
                  value={codeContent[contentKey]}
                  height="300px"
                  theme={sublime}
                  extensions={langExt}
                  onChange={(value) => handleCodeChange(value, contentKey)}
                />

                {/* CSS editor (HTML mode only) */}
                {language === "html" && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      CSS
                    </Typography>
                    {/*
                  FIX #4 – Unified to use handleCodeChange for consistency.
                  FIX #2 – readOnly for teachers.
                */}
                    <CodeMirror
                      value={codeContent.css}
                      height="300px"
                      theme={sublime}
                      extensions={cssExt}
                      onChange={(value) => handleCodeChange(value, "css")}
                    />
                  </>
                )}

                {/* Run button */}
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={executeCode}>
                    Run Code
                  </Button>
                </Box>

                {/* Output */}
                <Box ref={outputRef} sx={{ mt: 2 }}>
                  <Typography variant="h6">Output:</Typography>
                  <Box
                    sx={{
                      p: 1,
                      border: "1px solid #ddd",
                      borderRadius: 1,
                      display: "flex",
                    }}
                  >
                    {language === "html" ? (
                      <iframe
                        srcDoc={preview}
                        style={{ width: "100%", height: 320, border: "none" }}
                        title="HTML Preview"
                      />
                    ) : (
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          width: "100%",
                          border: "none",
                          color: "#fff",
                          backgroundColor: "#000",
                          padding: "10px 15px",
                          minHeight: 200,
                        }}
                        dangerouslySetInnerHTML={{ __html: output }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* Save button (students only) */}
            {!isTeacher && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setDialogOpen(true)}
                >
                  Save Project
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Save dialog (students) ── */}
      <Dialog
        open={!isTeacher && dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Save Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={projectDetails.name}
            onChange={handleProjectDetailsChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Project Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={projectDetails.description}
            onChange={handleProjectDetailsChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProject} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          icon={
            snackbarSeverity === "success" ? (
              <CheckCircleOutlineIcon fontSize="inherit" />
            ) : undefined
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Practice;
