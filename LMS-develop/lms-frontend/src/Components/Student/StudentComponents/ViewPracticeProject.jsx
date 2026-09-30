const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LMS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Container,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeMirror from "@uiw/react-codemirror";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import axios from "axios";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Link as RouterLink } from "react-router-dom";
import PythonLabPanel from "../../IndependentTerminals/PythonLabPanel";
import ArduinoBoardConnect
  from "../../IndependentTerminals/ArduinoBoardConnect";

import { flashArduino }
  from "../../../utils/flashArduino";

import { flashESP32 }
  from "../../../utils/esp32Uploader";


const SCRATCH_URL = import.meta.env.VITE_SCRATCH_URL || "http://localhost:8602";

/* -------- helpers -------- */
const normalizeLang = (s) => (s || "").toString().trim().toLowerCase();
const pretty = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const safeName = (name = "scratch-project") =>
  String(name).replace(/[^\w.-]+/g, "_").slice(0, 100);

const downloadSb3 = (projectName, sb3Base64) => {
  if (!sb3Base64) return;
  const byteChars = atob(sb3Base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/zip" }); // .sb3 is a zip
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(projectName)}.sb3`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function buildScratchUrl({ chapterId, projectId, canEdit = false }) {
  const u = new URL(SCRATCH_URL);
  if (chapterId) u.searchParams.set('id', String(chapterId));         // used by instructions.jsx
  if (projectId) u.searchParams.set('projectId', String(projectId));  // used by savetolms.js
  // support either param name (some builds read `api`, others `apiBase`)
  u.searchParams.set('apiBase', LMS_BASE);                             // http://localhost:5000
  u.searchParams.set('api', LMS_BASE);
  const t = localStorage.getItem('token');
  if (t) u.searchParams.set('token', t);                               // auth for /chapters/:id/instructions
  if (canEdit) u.searchParams.set('canEdit', '1');                     // students => false
  return u.toString();
}

function resolveChapterId(project, fallback) {
  return (
    project?.chapterId ||
    project?.chapter ||
    project?.chapter_id ||
    fallback ||
    ''
  );
}

const PracticeProjectView = ({ project, chapterId, onBack, isTeacher = false, ShowButtons }) => {
  const theme = useTheme();

  // Normalize terminal options (avoid CodeMirror crash on "Scratch")
  const termOptions = Array.from(
    new Set((project?.terminalOptions || []).map(normalizeLang))
  );
  const hasScratch = !!project?.codeContent?.scratch?.sb3Base64;

  const [codeContent, setCodeContent] = useState(() => ({
    html: project?.codeContent?.html || "",
    css: project?.codeContent?.css || "",
    js: project?.codeContent?.js || "",
    python: project?.codeContent?.python || "",
    arduino: project?.codeContent?.arduino || "",
    scratch: project?.codeContent?.scratch || { sb3Base64: null, meta: null },
  }));

  // helper to coerce various ObjectId shapes into a string
  const toIdString = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      if (v.$oid) return v.$oid;          // some APIs return { $oid: "..." }
      if (v._id) return toIdString(v._id);// nested shape
      if (v.toString) return v.toString();
    }
    return String(v);
  };

  //const pid = toIdString(project?._id);
  const [pidOverride, setPidOverride] = useState("");
  const pid = pidOverride || toIdString(project?._id);

  // 👇 build the correct URL for the Scratch tab/iframe
  //const chapterIdForScratch = resolveChapterId(project, project?.chapterId);
  const chapterIdForScratch = resolveChapterId(project, chapterId);
  const scratchUrl = buildScratchUrl({
    chapterId: chapterIdForScratch,   // REQUIRED for instructions load/save
    projectId: pid,                   // REQUIRED for Save-to-LMS to target the right .sb3
    canEdit: false                    // students don't need admin edit mode
  });


  // default language: scratch if present, else first option, else html
  const [language, setLanguage] = useState(() => {
    if (project?.selectedLanguage) return project.selectedLanguage;

    const options = project?.terminalOptions || [];

    if (options.includes("python")) return "python";
    if (options.includes("javascript")) return "javascript";
    if (options.includes("html")) return "html";
    if (options.includes("scratch")) return "scratch";
    if (options.includes("arduino")) return "arduino";

    return "html";
  });
  useEffect(() => {
    setCodeContent({
      html: project?.codeContent?.html || "",
      css: project?.codeContent?.css || "",
      js: project?.codeContent?.js || "",
      python: project?.codeContent?.python || "",
      arduino: project?.codeContent?.arduino || "",
      scratch: project?.codeContent?.scratch || { sb3Base64: null, meta: null },
    });

    if (project?.selectedLanguage) {
      setLanguage(project.selectedLanguage);
    }

  }, [project]);
  const [projectDetails, setProjectDetails] = useState({
    name: project?.name || "",
    description: project?.description || "",
  });

  const [preview, setPreview] = useState("");
  const [output, setOutput] = useState("");
  const outputRef = useRef(null);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const needsRevision =
    project?.teacherReview?.status === "needs_revision";

  const token = localStorage.getItem("token");
  // does a .sb3 already exist on the server for this project?
  const [hasRemoteSb3, setHasRemoteSb3] = useState(false);

  useEffect(() => {
    // only check when Scratch is selected and we have an id
    if (language !== "scratch" || !pid) {
      setHasRemoteSb3(false);
      return;
    }
    //const url = `${import.meta.env.VITE_API_URL}/project/${encodeURIComponent(pid)}.sb3`;
    // HEAD is fast and downloads nothing (see server route below)
    const url = `${API_BASE}/project/${encodeURIComponent(pid)}.sb3`;
    fetch(url, { method: "HEAD" })
      .then(r => setHasRemoteSb3(r.ok))
      .catch(() => setHasRemoteSb3(false));
  }, [language, pid]);


  // Update preview for HTML
  useEffect(() => {
    if (language === "html") {
      const combined = (codeContent.html || "").replace(
        "<style></style>",
        `<style>${codeContent.css || ""}</style>`
      );
      setPreview(combined);
    }
  }, [codeContent.css, codeContent.html, language]);

  const handleLanguageChange = (e) => {
    const val = normalizeLang(e.target.value);
    setLanguage(val);



    // remember selected language
    project.selectedLanguage = val;
  };

  const verifyArduino = async () => {
    try {
      const response = await fetch(`${API_BASE}/arduino/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeContent.arduino }),
      });
      const data = await response.json();
      if (data.success) {
        setOutput("✅ Compilation Successful");
      } else {
        setOutput(
          data.errors?.map((e) => `Line ${e.line}: ${e.message}`).join("\n") || data.raw
        );
      }
    } catch (err) {
      setOutput("Arduino verification failed");
    }
  };
  const handleCodeChange = (value, type) =>
    setCodeContent((prev) => ({ ...prev, [type]: value }));

  const handleProjectDetailsChange = (e) =>
    setProjectDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  // Student-only: upload .sb3
  const fileInputRef = useRef(null);
  const onPickSb3 = () => fileInputRef.current?.click();
  const onSb3Change = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      setCodeContent((prev) => ({
        ...prev,
        scratch: { sb3Base64: base64, meta: { name: file.name, size: file.size } },
      }));
      e.target.value = ""; // allow re-selecting same file
    };
    reader.readAsDataURL(file);
  };

  // Execute (non-scratch only)
  const executeCode = async () => {
    try {
      if (language === "javascript") {
        const log = [];
        const original = console.log;
        console.log = (...args) => {
          log.push(args.join(" "));
          original(...args);
        };
        try {
          // eslint-disable-next-line no-new-func
          new Function(`${codeContent.js}\nreturn;`)();
        } catch (err) {
          log.push(`Error: ${err.toString()}`);
        }
        console.log = original;
        setOutput(log.join("\n"));
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (language === "html") {
        const combined = (codeContent.html || "").replace(
          "<style></style>",
          `<style>${codeContent.css || ""}</style>`
        );
        setPreview(combined);
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setOutput(String(err));
    }
  };

  // Save / Update (student only). No iframe export – requires .sb3 uploaded if scratch is active.
  const submitPayload = () => ({
    name: projectDetails.name,
    description: projectDetails.description,
    terminalOptions: termOptions, // already normalized
    selectedLanguage: language,
    codeContent: {
      html: codeContent.html,
      css: codeContent.css,
      js: codeContent.js,
      python: codeContent.python,
      scratch: codeContent.scratch || null,
    },
    status: "draft",
  });
  const nameOk = (projectDetails.name || "").trim().length > 0;

  const handleSaveProject = async () => {
    try {
      if (!nameOk) {
        setSnackbarMessage("Please enter a project name.");
        setSnackbarSeverity("warning");
        setOpenSnackbar(true);
        return;
      }

      const url = `${API_BASE}/project/create-practice-project`;
      console.log('[CREATE] POST', url, submitPayload());

      const { data } = await axios.post(url, submitPayload(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[CREATE] response', data);

      const newId = data?.data?._id || data?.data?.id || data?.project?._id || data?._id;
      if (newId) setPidOverride(String(newId));

      setSaveDialogOpen(false);
      setSnackbarMessage("Project saved! You can now use 'Save to LMS' in Scratch.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error('[CREATE] error', error?.response || error);
      const msg = error?.response?.data?.message || `${error?.response?.status || ''} ${error?.message || 'Failed to save project'}`;
      setSnackbarMessage(msg);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleUpdateProject = async () => {
    try {
      if (language === "scratch" && !codeContent?.scratch?.sb3Base64 && !hasRemoteSb3) {
        setSnackbarMessage("Please upload a .sb3 before updating.");
        setSnackbarSeverity("warning");
        setOpenSnackbar(true);
        return;
      }
      const response = await axios.put(
        `${API_BASE}/project/update-practice-project/${project._id}`,
        submitPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveDialogOpen(false);
      setSnackbarMessage(
        response?.data?.message || "Project updated successfully!"
      );
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Update error:", error);
      setSnackbarMessage(error.response?.data?.message || "Failed to update project");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };
  const handleSubmitProject = async () => {
    // must be an existing project to submit
    if (!project?._id) {
      setSnackbarMessage("Please save the project first, then submit.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    // if Scratch chosen, make sure a .sb3 is there
    if (language === "scratch" && !codeContent?.scratch?.sb3Base64 && !hasRemoteSb3) {
      setSnackbarMessage("Please upload a .sb3 before submitting.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE}/project/submit-practice-project/${project._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbarMessage("Project submitted successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      // optional: take the user back or mark UI as submitted
      // onBack?.();
      // OR update local status if you pass status in `project`
      // project.status = "submitted";
    } catch (err) {
      console.error("Submit error:", err);
      setSnackbarMessage(err.response?.data?.message || "Failed to submit project");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };
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
  return (
    <>
      {onBack && (
        <IconButton onClick={onBack} sx={{ mb: 1 }} aria-label="back to projects">
          <ArrowBackIcon />
        </IconButton>
      )}

      <Container>
        <Box sx={{ p: 2 }}>
          {!isTeacher && needsRevision && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                border: "1px solid rgba(245, 158, 11, 0.22)",
                backgroundColor: "#fffaf0",
              }}
            >
              <Typography
                sx={{ fontSize: 18, fontWeight: 700, color: "#111827", mb: 0.75 }}
              >
                Revision Requested
              </Typography>
              <Typography sx={{ color: "#92400e", fontSize: 14, lineHeight: 1.6 }}>
                Your teacher asked for changes before this project is accepted.
                Update the work, save your revision, and submit again.
              </Typography>
              {project?.teacherReview?.feedback && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>
                    Teacher Feedback
                  </Typography>
                  <Typography sx={{ color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
                    {project.teacherReview.feedback}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {isTeacher && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Submitted:</strong> {new Date().toLocaleDateString()}
            </Typography>
          )}

          {/* Language selector (values are lowercase) */}
          <Select
            value={language}
            onChange={handleLanguageChange}
            sx={{ width: 200, mb: 1, height: 32, mt: 2 }}
          >
            {termOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {pretty(opt)}
              </MenuItem>
            ))}
          </Select>

          {/* Editors / Scratch panel */}
          {language !== "scratch" ? (
            language === "python" ? (
              <PythonLabPanel
                code={codeContent.python || ""}
                onCodeChange={(value) => !isTeacher && handleCodeChange(value, "python")}
                starterCode={codeContent.python || ""}
                title={isTeacher ? "Python Submission" : "Python Practice Lab"}
                showReset={false}
                showDownload={!isTeacher}
                height="360px"
                editable={!isTeacher}
              />
            ) : (
              <>
                <CodeMirror
                  value={
                    language === "javascript" ? codeContent.js
                      : language === "python" ? codeContent.python
                        : language === "arduino" ? codeContent.arduino
                          : codeContent.html
                  }
                  height="300px"
                  theme={sublime}
                  // do NOT pass "scratch" to loadLanguage
                  extensions={(() => {
                    const lang =
                      language === "javascript" ? "javascript"
                        : language === "python" ? "python"
                          : language === "arduino" ? "cpp"
                            : "html";
                    const ext = loadLanguage(lang);
                    return ext ? [ext] : [];
                  })()}
                  onChange={(value) => {
                    if (isTeacher) return;
                    handleCodeChange(
                      value,
                      language === "javascript" ? "js"
                        : language === "python" ? "python"
                          : language === "arduino" ? "arduino"
                            : "html"
                    );
                  }}
                  editable={!isTeacher}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: !isTeacher,
                    highlightActiveLine: !isTeacher,
                    dropCursor: !isTeacher,
                  }}
                />
                {language === "html" && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      CSS
                    </Typography>
                    <CodeMirror
                      value={codeContent.css}
                      height="300px"
                      theme={sublime}
                      extensions={cssExt}
                      onChange={(value) => handleCodeChange(value, "css")}
                      editable={!isTeacher}
                    />
                  </>
                )}
              </>
            )
          ) : (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  // onClick={() =>
                  //   window.open(`${SCRATCH_URL}/?id=${encodeURIComponent(pid)}`, "_blank", "noopener,noreferrer")
                  // }
                  onClick={() => window.open(scratchUrl, "_blank", "noopener,noreferrer")}
                  disabled={!chapterIdForScratch}
                >
                  Open Scratch in new tab
                </Button>





                {/* Student can upload .sb3; teacher is read-only */}
                {!isTeacher && (
                  <>
                    <Button variant="contained" onClick={onPickSb3}>Upload .sb3</Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".sb3,application/zip"
                      style={{ display: "none" }}
                      onChange={onSb3Change}
                    />
                  </>
                )}

                {!!codeContent?.scratch?.sb3Base64 && (
                  <Button
                    variant="outlined"
                    onClick={() => downloadSb3(projectDetails.name, codeContent.scratch.sb3Base64)}
                  >
                    Download .sb3
                  </Button>
                )}

              </Box>

              {/* Optional: simple embed so teacher sees an empty editor; no messaging needed */}
              <Box sx={{ border: "1px solid #ddd", borderRadius: 1, overflow: "hidden", height: "70vh" }}>
                <iframe
                  src={scratchUrl}
                  //src={`${SCRATCH_URL}/?id=${encodeURIComponent(pid)}`}
                  title="Scratch Editor"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </Box>

              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                Tip: Click “Open Scratch in new tab”, then use <em>File → Load from your computer</em> to open the
                downloaded .sb3.
              </Typography>
            </Box>
          )}

          {/* Run & Output (hidden for Scratch) */}
          {language !== "scratch" && language !== "python" && !isTeacher && (
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" onClick={executeCode}>
                Run Code
              </Button>
            </Box>
          )}


          {language !== "scratch" && !isTeacher && (
            <Box sx={{ mt: 2 }}>
              {language === "arduino" ? (
                <Button variant="contained" color="primary" onClick={verifyArduino}>VERIFY CODE</Button>
              ) : (
                <Button variant="contained" color="primary" onClick={executeCode}>RUN CODE</Button>
              )}
            </Box>
          )}

          {language !== "scratch" && language !== "python" && (
            <Box ref={outputRef} sx={{ mt: 2 }}>
              <Typography variant="h6">Output:</Typography>
              <Box sx={{ p: 1, border: "1px solid #ddd", borderRadius: 1, display: "flex" }}>
                {language === "html" ? (
                  <iframe srcDoc={preview} style={{ width: "100%", height: 300, border: "none" }} />
                ) : (
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      width: "100%",
                      color: "#fff",
                      backgroundColor: "black",
                      padding: "10px 15px",
                      minHeight: 200,
                      margin: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Actions (student only) */}
          {!isTeacher && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              {ShowButtons ? (
                <Button variant="contained" color="success" onClick={() => setSaveDialogOpen(true)}>
                  Save Project
                </Button>
              ) : (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button variant="contained" color="success" onClick={() => setSaveDialogOpen(true)}>
                    {needsRevision ? "Save Revision" : "Update Project"}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmitProject}
                    disabled={submitting || (language === "scratch" && !codeContent?.scratch?.sb3Base64 && !hasRemoteSb3)}
                  >
                    {submitting ? "Submitting..." : needsRevision ? "Resubmit Project" : "Submit Project"}
                  </Button>

                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Save / Update dialog (student only) */}
      {!isTeacher && (
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Project Name"
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
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={projectDetails.description}
              onChange={handleProjectDetailsChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={ShowButtons ? handleSaveProject : handleUpdateProject}
              variant="contained"
              disabled={language === "scratch" && !codeContent?.scratch?.sb3Base64 && !hasRemoteSb3}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          icon={snackbarSeverity === "success" ? <CheckCircleOutlineIcon fontSize="inherit" /> : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PracticeProjectView;
