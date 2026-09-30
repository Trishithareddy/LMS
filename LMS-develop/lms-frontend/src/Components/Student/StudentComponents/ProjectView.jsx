import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import {
  Box, Button, Typography, Select, MenuItem, Container,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, Card, CardContent, Stack, Chip, CircularProgress, Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CodeMirror from "@uiw/react-codemirror";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PythonLabPanel from "../../IndependentTerminals/PythonLabPanel";
import { useTheme } from "@mui/material/styles";

const SCRATCH_URL = import.meta.env.VITE_SCRATCH_URL || "http://localhost:8602";

// helpers
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const pretty = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const safeName = (name = "scratch-project") =>
  String(name).replace(/[^\w.-]+/g, "_").slice(0, 100);
const downloadSb3 = (projectName, sb3Base64) => {
  if (!sb3Base64) return;
  const bytes = Uint8Array.from(atob(sb3Base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${safeName(projectName)}.sb3`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

const buildScratchProjectUrl = (projectId) => {
  const token = localStorage.getItem("token");
  const url = new URL(SCRATCH_URL);
  url.searchParams.set("projectId", projectId || "");
  url.searchParams.set("apiBase", import.meta.env.VITE_API_URL);
  url.searchParams.set("token", token || "");
  return url.toString();
};

const reviewStatusLabel = (status) => {
  if (status === "reviewed") return "Reviewed";
  if (status === "needs_revision") return "Needs Revision";
  return "Not Reviewed";
};

const ProjectView = ({ project, onBack, isTeacher = false, ShowButtons }) => {
  const termOptions = Array.from(
    new Set((project?.terminalOptions || []).map(normalize))
  );
  const hasScratch = !!project?.codeContent?.scratch?.sb3Base64;

  const [codeContent, setCodeContent] = useState(() => ({
    html: project?.codeContent?.html || "",
    css: project?.codeContent?.css || "",
    js: project?.codeContent?.js || "",
    python: project?.codeContent?.python || "",
    scratch: project?.codeContent?.scratch || { sb3Base64: null, meta: null },
  }));

  const [language, setLanguage] = useState(() => {
    if (project?.selectedLanguage) return project.selectedLanguage;

    const options = (project?.terminalOptions || []).map(o =>
      o.toLowerCase().trim()
    );

    if (options.includes("python")) return "python";
    if (options.includes("javascript")) return "javascript";
    if (options.includes("html")) return "html";
    if (options.includes("scratch")) return "scratch";

    return "html";








  });
  useEffect(() => {
    setCodeContent({
      html: project?.codeContent?.html || "",
      css: project?.codeContent?.css || "",
      js: project?.codeContent?.js || "",
      python: project?.codeContent?.python || "",
      scratch: project?.codeContent?.scratch || { sb3Base64: null, meta: null },
    });

    if (project?.selectedLanguage) {
      setLanguage(project.selectedLanguage.toLowerCase());
    }
    setAiraEvaluation(project?.airaEvaluation || null);
    setTeacherFeedback(
      project?.teacherReview?.feedback ||
        project?.airaEvaluation?.suggestedTeacherFeedback ||
        ""
    );
    setTeacherReviewStatus(project?.teacherReview?.status || "not_reviewed");
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
  const [airaEvaluation, setAiraEvaluation] = useState(project?.airaEvaluation || null);
  const [airaLoading, setAiraLoading] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState(
    project?.teacherReview?.feedback ||
      project?.airaEvaluation?.suggestedTeacherFeedback ||
      ""
  );
  const [teacherReviewStatus, setTeacherReviewStatus] = useState(
    project?.teacherReview?.status || "not_reviewed"
  );
  const [teacherReviewSaving, setTeacherReviewSaving] = useState(false);

  const token = localStorage.getItem("token");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    if (language === "html") {
      const combined = (codeContent.html || "").replace(
        "<style></style>", `<style>${codeContent.css || ""}</style>`
      );
      setPreview(combined);
    }
  }, [codeContent.css, codeContent.html, language]);

  const handleLanguageChange = (e) => {
    const val = normalize(e.target.value);
    setLanguage(val);
  };

  const handleCodeChange = (value, key) =>
    setCodeContent((prev) => ({ ...prev, [key]: value }));

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  const runAiraReview = async () => {
    if (!project?._id || !isTeacher) return;

    try {
      setAiraLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/project/practice-project/${project._id}/aira-evaluate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAiraEvaluation(response.data?.evaluation || null);
      setTeacherFeedback(
        response.data?.project?.teacherReview?.feedback ||
          response.data?.evaluation?.suggestedTeacherFeedback ||
          ""
      );
      setSnackbarMessage("AIRA review is ready.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("AIRA project review error:", error);
      setSnackbarMessage(
        error?.response?.data?.message || "Failed to run AIRA review."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setAiraLoading(false);
    }
  };

  const saveTeacherReview = async () => {
    if (!project?._id || !isTeacher) return;

    try {
      setTeacherReviewSaving(true);
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/project/practice-project/${project._id}/teacher-review`,
        {
          feedback: teacherFeedback,
          status:
            teacherReviewStatus === "not_reviewed"
              ? "reviewed"
              : teacherReviewStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTeacherReviewStatus(
        response.data?.teacherReview?.status || teacherReviewStatus
      );
      setTeacherFeedback(
        response.data?.teacherReview?.feedback || teacherFeedback
      );
      setSnackbarMessage("Teacher feedback saved.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Teacher review save error:", error);
      setSnackbarMessage(
        error?.response?.data?.message || "Failed to save teacher feedback."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setTeacherReviewSaving(false);
    }
  };

  const executeCode = async () => {
    try {
      if (language === "javascript") {
        const log = [];
        const original = console.log;
        console.log = (...args) => { log.push(args.join(" ")); original(...args); };
        try { new Function(`${codeContent.js}\nreturn;`)(); }
        catch (err) { log.push(`Error: ${err}`); }
        console.log = original;
        setOutput(log.join("\n"));
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (language === "html") {
        const combined = (codeContent.html || "").replace(
          "<style></style>", `<style>${codeContent.css || ""}</style>`
        );
        setPreview(combined);
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setOutput(String(err));
    }
  };

  useEffect(() => {
    if (!isTeacher) return;

    if (language === "javascript") {
      executeCode();
    }
  }, [isTeacher, language, project?._id]);

  return (
    <>
      {onBack && (
        <IconButton onClick={onBack} sx={{ mb: 1 }} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
      )}

      <Container>
        <Box sx={{ p: 2 }}>
          {isTeacher && (
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Submitted:</strong>{" "}
                {new Date(
                  project?.submittedAt || project?.createdAt || Date.now()
                ).toLocaleDateString()}
              </Typography>

              <Card
  sx={{
    borderRadius: 3,
    border: "1px solid",
    borderColor: isDark ? "#355244" : "#dcfce7",
    bgcolor: isDark ? "#1f2d24" : "#f0fdf4",
    boxShadow: isDark
      ? "0 8px 20px rgba(0,0,0,.45)"
      : "0 8px 24px rgba(15,23,42,.05)",
  }}
>
                <CardContent
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    "&:last-child": { pb: { xs: 2, md: 2.5 } },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesomeIcon sx={{ color: "#15803d" }} />
                        <Typography
                          sx={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "text.primary",
                          }}
                        >
                          AIRA Project Review
                        </Typography>
                      </Stack>
                      <Typography
                        sx={{ mt: 0.75, color: "text.secondary", fontSize: 14 }}
                      >
                        Use AIRA to review concept match, completion, strengths,
                        and improvement points before giving teacher feedback.
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={runAiraReview}
                      disabled={airaLoading}
                      startIcon={
                        airaLoading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <AutoAwesomeIcon />
                        )
                      }
                      sx={{
                        borderRadius: 999,
                        px: 2.5,
                        py: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        backgroundColor: "#16a34a",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#15803d",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {airaLoading
                        ? "Reviewing..."
                        : airaEvaluation
                          ? "Run Again"
                          : "Run AIRA Review"}
                    </Button>
                  </Stack>

                  {airaEvaluation && (
                    <Box sx={{ mt: 2.5 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mb: 1.5 }}
                      >
                        {airaEvaluation.conceptMatch ? (
                          <Chip
                            label={airaEvaluation.conceptMatch}
                            sx={{
                              borderRadius: 999,
                              bgcolor:isDark ? "#1f4427" : "#dcfce7",
color:isDark ? "#7ee787" : "#166534",
                              fontWeight: 600,
                            }}
                          />
                        ) : null}
                        {airaEvaluation.completionLevel ? (
                          <Chip
                            label={airaEvaluation.completionLevel}
                            sx={{
                              borderRadius: 999,
                              bgcolor:isDark ? "#1e293b" : "#eff6ff",
color:isDark ? "#93c5fd" : "#1d4ed8",
                              fontWeight: 600,
                            }}
                          />
                        ) : null}
                        {airaEvaluation.evaluatedAt ? (
                          <Chip
                            label={`Reviewed ${new Date(
                              airaEvaluation.evaluatedAt
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`}
                            sx={{
                              borderRadius: 999,
                              bgcolor: isDark ? "#374151" : "#f3f4f6",
                              color: isDark ? "#f3f4f6" : "#374151",
                              fontWeight: 600,
                            }}
                          />
                        ) : null}
                      </Stack>

                      {airaEvaluation.summary ? (
                        <Typography
                          sx={{
                            color: "text.primary",
                            fontWeight: 600,
                            fontSize: 15,
                          }}
                        >
                          {airaEvaluation.summary}
                        </Typography>
                      ) : null}

                      {airaEvaluation.feedback ? (
                        <Typography
                          sx={{
                            mt: 1,
                            color: "text.secondary",
                            fontSize: 14,
                            lineHeight: 1.6,
                          }}
                        >
                          {airaEvaluation.feedback}
                        </Typography>
                      ) : null}

                      <Divider
    sx={{
        my:2,
        borderColor:"divider"
    }}
/>

                      <Stack spacing={2}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "text.primary",
                              mb: 0.75,
                            }}
                          >
                            Strengths
                          </Typography>
                          <Stack spacing={1}>
                            {(airaEvaluation.strengths || []).map(
                              (point, index) => (
                                <Typography
                                  key={`strength-${index}`}
                                  sx={{ color: "text.secondary", fontSize: 14 }}
                                >
                                  {"• "} {point}
                                </Typography>
                              )
                            )}
                          </Stack>
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "text.primary",
                              mb: 0.75,
                            }}
                          >
                            Improvement Points
                          </Typography>
                          <Stack spacing={1}>
                            {(airaEvaluation.improvements || []).map(
                              (point, index) => (
                                <Typography
                                  key={`improvement-${index}`}
                                  sx={{ color: "text.secondary", fontSize: 14 }}
                                >
                                  {"• "} {point}
                                </Typography>
                              )
                            )}
                          </Stack>
                        </Box>

                        {airaEvaluation.suggestedTeacherFeedback ? (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor:"background.paper",
border:"1px solid",
borderColor:"divider",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "text.primary",
                                mb: 0.5,
                              }}
                            >
                              Suggested Teacher Feedback
                            </Typography>
                            <Typography
                              sx={{
                                color: "text.secondary",
                                fontSize: 14,
                                lineHeight: 1.6,
                              }}
                            >
                              {airaEvaluation.suggestedTeacherFeedback}
                            </Typography>
                          </Box>
                        ) : null}

                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor:"background.paper",
                            border:"1px solid",
                            borderColor:"divider",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "text.primary",
                              mb: 1,
                            }}
                          >
                            Teacher Feedback
                          </Typography>

                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.5}
                            sx={{ mb: 1.5 }}
                          >
                            <Select
                              value={teacherReviewStatus}
                              onChange={(e) =>
                                setTeacherReviewStatus(e.target.value)
                              }
                              size="small"
                              sx={{ minWidth: 190 }}
                            >
                              <MenuItem value="not_reviewed">
                                Mark as Reviewed
                              </MenuItem>
                              <MenuItem value="reviewed">Reviewed</MenuItem>
                              <MenuItem value="needs_revision">
                                Needs Revision
                              </MenuItem>
                            </Select>
                            <Button
                              variant="contained"
                              onClick={saveTeacherReview}
                              disabled={teacherReviewSaving}
                              sx={{
                                textTransform: "none",
                                borderRadius: 999,
                                fontWeight: 700,
                                boxShadow: "none",
                                backgroundColor: "#16a34a",
                                "&:hover": {
                                  backgroundColor: "#15803d",
                                  boxShadow: "none",
                                },
                              }}
                            >
                              {teacherReviewSaving
                                ? "Saving..."
                                : "Save Feedback"}
                            </Button>
                          </Stack>

                          <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            value={teacherFeedback}
                            onChange={(e) => setTeacherFeedback(e.target.value)}
                            placeholder="Write teacher feedback for this project..."
                          />
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}

          {!isTeacher &&
            (project?.teacherReview?.feedback ||
              project?.teacherReview?.status === "reviewed" ||
              project?.teacherReview?.status === "needs_revision") && (
              <Card
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(59, 130, 246, 0.16)",
                  boxShadow: "none",
                  bgcolor:isDark ? "#1d2533" : "#f8fbff",
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Typography
                        sx={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "text.primary",
                        }}
                      >
                        Teacher Review
                      </Typography>
                      <Chip
                        label={reviewStatusLabel(project?.teacherReview?.status)}
                        sx={{
                          borderRadius: 999,
                          backgroundColor:
                            project?.teacherReview?.status === "needs_revision"
                              ? "#fef3c7"
                              : "#dbeafe",
                          color:
                            project?.teacherReview?.status === "needs_revision"
                              ? "#b45309"
                              : "#1d4ed8",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>

                    {project?.teacherReview?.reviewedAt ? (
                      <Typography sx={{ color: "#6b7280", fontSize: 13 }}>
                        Reviewed on{" "}
                        {new Date(
                          project.teacherReview.reviewedAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    ) : null}

                    {project?.teacherReview?.feedback ? (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor:"background.paper",
border:"1px solid",
borderColor:"divider",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#374151",
                            fontSize: 14,
                            lineHeight: 1.7,
                          }}
                        >
                          {project.teacherReview.feedback}
                        </Typography>
                      </Box>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            )}

          <Select
            value={language}
            onChange={handleLanguageChange}
            sx={{ width: 200, mb: 1, height: 32, mt: 2 }}
          >
            {termOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>{pretty(opt)}</MenuItem>
            ))}
          </Select>

          {language !== "scratch" ? (
            language === "python" ? (
              <PythonLabPanel
                code={codeContent.python || ""}
                onCodeChange={(value) => !isTeacher && handleCodeChange(value, "python")}
                starterCode={codeContent.python || ""}
                title={isTeacher ? "Python Submission" : "Python Project Lab"}
                showReset={false}
                showDownload={!isTeacher}
                height="360px"
                editable={!isTeacher}
              />
            ) : (
            <>
              <CodeMirror
                value={
                  language === "javascript"
                    ? codeContent.js
                    : language === "python"
                      ? codeContent.python
                      : codeContent.html
                }
                height="300px"
                theme={sublime}
                // do NOT pass "scratch" to loadLanguage
                extensions={
                  (() => {
                    const lang =
                      language === "javascript"
                        ? "javascript"
                        : language === "python"
                          ? "python"
                          : "html";

                    const ext = loadLanguage(lang);
                    return ext ? [ext] : [];
                  })()
                }
                onChange={(value) => {
                  if (isTeacher) return;
                  handleCodeChange(
                    value,
                    language === "javascript" ? "js" :
                      language === "python" ? "python" : "html"
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
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>CSS</Typography>
                  <CodeMirror
                    value={codeContent.css}
                    height="300px"
                    theme={sublime}
                    extensions={
                      (() => {
                        const ext = loadLanguage("css");
                        return ext ? [ext] : [];
                      })()
                    }
                    onChange={(v) => !isTeacher && handleCodeChange(v, "css")}
                    editable={!isTeacher}
                  />
                </>
              )}
            </>
            )
          ) : (
            <Box sx={{ mt: 2 }}>
              {isTeacher && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 1.5 }}
                >
                  <Typography sx={{ fontSize: 14, color: "#4b5563" }}>
                    Scratch submissions are reviewed inside the embedded stage below.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      window.open(
                        buildScratchProjectUrl(project?._id),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    sx={{ textTransform: "none", borderRadius: 999 }}
                  >
                    Open in Scratch
                  </Button>
                </Stack>
              )}
              <iframe
                src={buildScratchProjectUrl(project?._id)}
                style={{
                  width: "100%",
                  height: "80vh",
                  border: "none",
                  borderRadius: "8px"
                }}
                title="Scratch Editor"
              />
            </Box>)}

          {/* Run & Output (not for scratch) */}
          {language !== "scratch" && language !== "python" && !isTeacher && (
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={executeCode}>Run Code</Button>
            </Box>
          )}
          {language !== "scratch" && language !== "python" && (
            <Box ref={outputRef} sx={{ mt: 2 }}>
              <Typography variant="h6">Output:</Typography>
              <Box sx={{ p: 1, border:"1px solid",
borderColor:"divider",
bgcolor:"background.paper", borderRadius: 1, display: "flex" }}>
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
        </Box>
      </Container>

      {/* (Optional) keep your save/update dialog here for student view */}
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

export default ProjectView;
