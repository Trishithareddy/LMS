import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import axios from "axios";
import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";
import { useAuth } from "../../../../contexts/AuthContext";

const SCRATCH_URL = import.meta.env.VITE_SCRATCH_URL;
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

function Terminal() {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const { user } = useAuth() ?? {};

  // terminal option toggles
  const [html, setHtml] = useState(false);
  const [python, setPython] = useState(false);
  const [javascript, setJavascript] = useState(false);
  const [scratch, setScratch] = useState(false);
  const [noTerminal, setNoTerminal] = useState(false);
  const [linksCheckbox, setLinksCheckbox] = useState(false);

  // external links
  const [externalLinks, setExternalLinks] = useState([]);
  const [showExternalLinkForm, setShowExternalLinkForm] = useState(false);
  const [showExternalLinksDetails, setShowExternalLinksDetails] = useState(true);
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [link, setLink] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // scratch projects (admin table)
  const [scratchProjects, setScratchProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [chapterId, setChapterId] = useState("");
  const location = useLocation();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const [hasRemoteSb3, setHasRemoteSb3] = useState(false);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  // --- Role handling: use auth context only
  const normalizedRole = useMemo(
    () => String(user?.role || "").toLowerCase().trim(),
    [user?.role]
  );

  // --- Role handling: robust (context -> jwt -> /auth/me)
const [role, setRole] = React.useState("");

function safeDecodeJwtRole(token) {
  try {
    if (!token) return "";
    const p = token.split(".")[1];
    if (!p) return "";
    const json = atob(p.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - p.length % 4) % 4));
    return String(JSON.parse(json)?.role || "").toLowerCase().trim();
  } catch { return ""; }
}

useEffect(() => {
  const resolveRole = async () => {
    let resolved = "";                           // winner role

    // 1) Try role from JWT (if your JWT had it; safe to try)
    const t = localStorage.getItem("token");
    const fromJwt = safeDecodeJwtRole(t);
    if (fromJwt) resolved = fromJwt;

    // 2) Ask the backend (authoritative)
    if (t) {
      try {
        const r = await fetch(
          `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api/auth/me`,

          { headers: { Authorization: `Bearer ${t}` } }
        );
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          const fromMe = String(j?.user?.role || "").toLowerCase().trim();
          if (fromMe) resolved = fromMe;
        }
      } catch {}
    }

    // 3) Fall back to AuthContext (only if nothing else resolved)
    if (!resolved) {
      resolved = String(user?.role || "").toLowerCase().trim();
    }

    if (resolved) setRole(resolved);
  };

  resolveRole();
}, [user?.role]);



  const isEditor = React.useMemo(
  () => ["admin", "superadmin"].includes(role),
  [role]
);
const isAdmin = React.useMemo(() => role === "admin", [role]);

// scratchSrc depends on chapterId + isEditor
const scratchSrc = React.useMemo(() => {
  if (!chapterId) return "";
  const u = new URL(SCRATCH_URL);
  u.searchParams.set("id", String(chapterId));

  // tell the 8602 tab where your backend lives
  //u.searchParams.set("apiBase", `${API_BASE}/api`);
  u.searchParams.set(
  "apiBase",
  import.meta.env.VITE_API_URL.replace(/\/$/, "")
);


  // only add edit flag if the user is admin/superadmin
  if (isEditor) u.searchParams.set("canEdit", "1");

  // pass JWT so 8602 can call protected routes
  const t = localStorage.getItem("token");
  if (t) u.searchParams.set("token", t);

  return u.toString();
}, [chapterId, isEditor]);

// guard the button until role resolved (prevents opening without canEdit)
const roleResolved = role.length > 0;



  // breadcrumbs
  useEffect(() => {
    setBreadcrumbTrail([
      { name: "Admin Dashboard", path: "/admin-dashboard" },
      { name: "Update Courses", path: "/admin-dashboard/update-courses" },
      {
        name: "Edit Course",
        path: "/admin-dashboard/edit-course",
        state: { courseData: location.state?.courseData }
      },
      {
        name: "Create Chapter",
        path: "/admin-dashboard/create-chapter",
        state: {
          chapterId: location.state?.chapterId,
          courseData: location.state?.courseData,
          courseId: location.state?.courseId,
          courseName: location.state?.courseName,
          from1: location.state?.from
        }
      },
      { name: "Terminal", path: "/admin-dashboard/terminal" }
    ]);
  }, [location, setBreadcrumbTrail]);

  // chapter id from route state
  useEffect(() => {
    if (location.state) setChapterId(location.state.chapterId);
  }, [location]);

  // load terminal options for chapter
  useEffect(() => {
    const getTerminalOptions = async () => {
      if (!chapterId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const terminalEnabledExtracted = response.data.terminalEnabled;
        if (terminalEnabledExtracted === false) setNoTerminal(true);

        const terminalOptionsExtracted = response.data.terminalOptions;
        if (terminalOptionsExtracted) {
          setHtml(terminalOptionsExtracted.includes("html"));
          setPython(terminalOptionsExtracted.includes("python"));
          setJavascript(terminalOptionsExtracted.includes("javascript"));
          setScratch(terminalOptionsExtracted.includes("scratch"));
        }

        if (response.data.linksEnabled) setLinksCheckbox(true);
        setExternalLinks(response.data.links);
      } catch (error) {
        setMessage("Error fetching terminal options.");
        setAlertType("error");
        setOpenSnackbar(true);
      }
    };
    getTerminalOptions();
  }, [chapterId]);

  // check if chapter has remote sb3
  useEffect(() => {
    if (!chapterId || !scratch) {
      setHasRemoteSb3(false);
      return;
    }
    const url = `${import.meta.env.VITE_API_URL}/project/${encodeURIComponent(
      chapterId
    )}.sb3`;
    fetch(url, { method: "HEAD" })
      .then((r) => setHasRemoteSb3(r.ok))
      .catch(() => setHasRemoteSb3(false));
  }, [chapterId, scratch]);

  // Save terminal options
  const AddTerminal = async () => {
    if (!chapterId) {
      console.error("Error: Chapter ID is not available.");
      return;
    }

    if (!html && !python && !javascript && !scratch && !noTerminal && !linksCheckbox) {
      console.error("Error: No terminal option selected.");
      setMessage("Select at least one option.");
      setAlertType("error");
      setOpenSnackbar(true);
      return;
    }

    let data = {};
    const terminalOptionsPrepared = prepareTerminalOptions();

    if (noTerminal === true) {
      data = {
        terminalEnabled: false,
        terminalOptions: null,
        chapterId,
        linksEnabled: false
      };
    } else {
      data = {
        terminalEnabled: true,
        terminalOptions: terminalOptionsPrepared,
        chapterId,
        links: externalLinks,
        linksEnabled: !!linksCheckbox
      };
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${import.meta.env.VITE_API_URL}/chapters/addTerminal`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      setJavascript(false);
      setPython(false);
      setNoTerminal(false);
      setHtml(false);

      setMessage("Terminal configured successfully.");
      setAlertType("success");
      setOpenSnackbar(true);

      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error("Error updating terminal:", error);
    }
  };

  const handleHtmlChange = () => !noTerminal && setHtml((v) => !v);
  const handlePythonChange = () => !noTerminal && setPython((v) => !v);
  const handleJavaScriptChange = () => !noTerminal && setJavascript((v) => !v);
  const handleScratchChange = () => !noTerminal && setScratch((v) => !v);
  const handleLinksCheckboxChange = () => !noTerminal && setLinksCheckbox((v) => !v);

  const handleNoTerminalChange = () => {
    setNoTerminal((v) => !v);
    if (!noTerminal) {
      setHtml(false);
      setPython(false);
      setJavascript(false);
      setScratch(false);
      setLinksCheckbox(false);
    }
  };

  const prepareTerminalOptions = () => {
    const options = [];
    if (html) options.push("html");
    if (python) options.push("python");
    if (javascript) options.push("javascript");
    if (scratch) options.push("scratch");
    return options.map((s) => s.toLowerCase());
  };

  // External link handlers
  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleInstructionChange = (e) => setInstruction(e.target.value);
  const handleLinkChange = (e) => setLink(e.target.value);

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!title || !instruction || !link) {
      setMessage("All fields are required.");
      setAlertType("error");
      setOpenSnackbar(true);
      return;
    }

    if (isEditing) {
      const updated = { title, instruction, link };
      setExternalLinks((prev) =>
        prev.map((l, i) => (i === editIndex ? updated : l))
      );
      setShowExternalLinkForm(false);
      setShowExternalLinksDetails(true);
      setIsEditing(false);
      return;
    }

    const prepared = { title, instruction, link };
    setExternalLinks((prev) => [...prev, prepared]);

    setTitle("");
    setInstruction("");
    setLink("");
    setShowExternalLinkForm(false);
    setShowExternalLinksDetails(true);
  };

  const handleEditLinkDetails = (t, instr, lnk, idx) => {
    setIsEditing(true);
    setEditIndex(idx);
    setTitle(t);
    setInstruction(instr);
    setLink(lnk);
    setShowExternalLinksDetails(false);
    setShowExternalLinkForm(true);
  };

  const renderExternalLinks = () => {
    const handleDeleteLink = (title) => {
      setExternalLinks((prev) => prev.filter((e) => e.title !== title));
    };

    const handleExternalLinkClick = (e, link) => {
      e.preventDefault();
      const absoluteUrl = link.startsWith("http") ? link : `https://${link}`;
      window.open(absoluteUrl, "_blank", "noopener,noreferrer");
    };

    return (
      <Box>
        <Paper
          sx={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            marginTop: 2
          }}
        >
          <Typography variant="h5" gutterBottom>
            Configured External links
          </Typography>

          <Box>
            {externalLinks.map((externalLink, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "16px",
                  marginBottom: "16px",
                  backgroundColor: "#fff",
                  transition: "background-color 0.3s ease",
                  "&:hover": { backgroundColor: "#F9F8F6" }
                }}
              >
                <Box sx={{ marginBottom: "12px" }}>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    <span style={{ fontWeight: "normal", color: "rgba(0,0,0,0.6)" }}>
                      Title:{" "}
                    </span>
                    {externalLink.title}
                  </Typography>
                </Box>

                <Box sx={{ marginBottom: "12px" }}>
                  <Typography
                    variant="body1"
                    sx={{ marginBottom: "4px", color: " rgba(0, 0, 0, 0.6)" }}
                  >
                    Instruction :
                  </Typography>
                  <Typography
                    variant="body1"
                    component="pre"
                    sx={{ whiteSpace: "pre-wrap", margin: 0, padding: "0 0 0 16px" }}
                  >
                    {externalLink.instruction}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body1" sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                    <span>Link : </span>
                    <Typography
                      component="a"
                      href={externalLink.link}
                      onClick={(e) => handleExternalLinkClick(e, externalLink.link)}
                      sx={{
                        color: "#4CAF50",
                        textDecoration: "underline",
                        cursor: "pointer",
                        transition: "color 0.3s ease, text-decoration 0.3s ease",
                        "&:hover": { color: "darkgreen", textDecoration: "none" }
                      }}
                    >
                      {externalLink.link}
                    </Typography>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleDeleteLink(externalLink.title)}
                  >
                    Delete Link
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleEditLinkDetails(
                        externalLink.title,
                        externalLink.instruction,
                        externalLink.link,
                        index
                      )
                    }
                  >
                    Edit
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  };

  const handleOpenExternalLinkForm = () => {
    setShowExternalLinkForm(true);
    setShowExternalLinksDetails(false);
  };

  // Admin-only: fetch scratch projects
  const fetchScratchProjects = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/scratch/get-scratch`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScratchProjects(response.data.data || []);
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error("Error fetching scratch projects:", error);
        setMessage("Error fetching scratch projects");
        setAlertType("error");
        setOpenSnackbar(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScratchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

//   const handleAddScratchProject = async (project) => {
//     const newLink = {
//       title: project.ScratchTitle,
//       instruction: project.ScratchInstruction || project.ScratchDescription,
//       link: `${SCRATCH_URL}/?id=${encodeURIComponent(project._id)}${
//         isAdmin ? "&canEdit=1" : ""
//       }`
//     };
//     setExternalLinks((prev) => [...prev, newLink]);
//     setMessage("Project added successfully");
//     setAlertType("success");
//     setOpenSnackbar(true);
//   };
const handleAddScratchProject = (project) => {
  const u = new URL(SCRATCH_URL);
  u.searchParams.set("id", project._id);
  if (isEditor) u.searchParams.set("canEdit", "1");
  const newLink = {
    title: project.ScratchTitle,
    instruction: project.ScratchInstruction || project.ScratchDescription,
    link: u.toString()
  };
  setExternalLinks(prev => [...prev, newLink]);
  setMessage("Project added successfully");
  setAlertType("success");
  setOpenSnackbar(true);
};

  const ScratchProjectsTable = () => {
    const filteredProjects = scratchProjects.filter((project) =>
      project.ScratchTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Paper sx={{ width: "100%", mb: 2, mt: 2 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Available Scratch Projects
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
        </Box>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#2e7d32" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Project Name
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Description
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project._id}>
                <TableCell>{project.ScratchTitle}</TableCell>
                <TableCell>{project.ScratchDescription}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleAddScratchProject(project)}
                    size="small"
                  >
                    Add Project
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  // Scratch helpers
  const onPickSb3 = () => fileInputRef.current?.click();

  const onSb3Change = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chapterId) return;
    try {
      const ab = await file.arrayBuffer();
      await fetch(
        `${import.meta.env.VITE_API_URL}/project/${encodeURIComponent(
          chapterId
        )}.sb3`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
            Authorization: `Bearer ${token}`
          },
          body: ab
        }
      );
      setHasRemoteSb3(true);
      setMessage("Scratch .sb3 uploaded for this chapter.");
      setAlertType("success");
      setOpenSnackbar(true);
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload .sb3");
      setAlertType("error");
      setOpenSnackbar(true);
    } finally {
      e.target.value = "";
    }
  };

  const downloadChapterSb3 = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/project/${encodeURIComponent(
          chapterId
        )}.sb3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chapterId}.sb3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage("Could not download .sb3");
      setAlertType("error");
      setOpenSnackbar(true);
    }
  };

  // External link form
  const addExternalLink = () => (
    <Box>
      <Paper sx={{ padding: 3, margin: 2 }}>
        <Typography variant="h5" gutterBottom>
          Add External Link
        </Typography>
        <Box component="form" onSubmit={handleAddLink}>
          <TextField
            label="Title"
            name="title"
            value={title}
            onChange={handleTitleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Instruction"
            name="instruction"
            value={instruction}
            onChange={handleInstructionChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Link"
            name="link"
            value={link}
            onChange={handleLinkChange}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            Add Link
          </Button>
        </Box>
      </Paper>
    </Box>
  );

  // UI
  return (
    <Box sx={{ width: "100%", margin: "0 auto", padding: "20px", boxSizing: "border-box" }}>
      <Box>
        <Paper
          sx={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9"
          }}
        >
          <Typography variant="h5" gutterBottom>
            Configure Terminal Options
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={html} onChange={handleHtmlChange} disabled={noTerminal} />}
              label="Html"
            />
            <FormControlLabel
              control={<Checkbox checked={python} onChange={handlePythonChange} disabled={noTerminal} />}
              label="Python"
            />
            <FormControlLabel
              control={
                <Checkbox checked={javascript} onChange={handleJavaScriptChange} disabled={noTerminal} />
              }
              label="JavaScript"
            />
            <FormControlLabel
              control={<Checkbox checked={scratch} onChange={handleScratchChange} disabled={noTerminal} />}
              label="Scratch"
            />
            <FormControlLabel
              control={
                <Checkbox checked={linksCheckbox} onChange={handleLinksCheckboxChange} disabled={noTerminal} />
              }
              label="Links"
            />
            <FormControlLabel
              control={<Checkbox checked={noTerminal} onChange={handleNoTerminalChange} />}
              label="No Terminal"
            />
          </FormGroup>

          <Box sx={{ marginTop: "20px" }}>
            <Button color="secondary" variant="contained" onClick={AddTerminal}>
              Add Terminal
            </Button>
            <Button
              color="secondary"
              variant="contained"
              disabled={isEditing}
              onClick={handleOpenExternalLinkForm}
              sx={{ marginLeft: "10px" }}
            >
              Add Links
            </Button>
          </Box>
        </Paper>

        {scratch && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scratch Terminal (Preview for this Chapter)
            </Typography>

            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mb: 1, flexWrap: "wrap" }}>
              <Button
  variant="outlined"
  disabled={!roleResolved || !chapterId}
  onClick={() => window.open(scratchSrc, "_blank", "noopener,noreferrer")}
>
  Open Scratch in new tab
</Button>

              <Button variant="contained" onClick={onPickSb3} disabled={!chapterId}>
                Upload .sb3
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sb3,application/zip"
                style={{ display: "none" }}
                onChange={onSb3Change}
              />

              <Button variant="outlined" onClick={downloadChapterSb3} disabled={!hasRemoteSb3}>
                Download current .sb3
              </Button>
            </Box>

            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, overflow: "hidden", height: "70vh" }}>
              <iframe
                key={scratchSrc}
                src={scratchSrc}
                title="Scratch Editor"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </Box>

            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
              Tip: In the editor use <em>File → Save to your computer</em> or open in a new tab to work full-screen.
            </Typography>
          </Paper>
        )}

        {isAdmin && !loading && scratchProjects.length > 0 && <ScratchProjectsTable />}

        {externalLinks.length !== 0 && showExternalLinksDetails && renderExternalLinks()}
        {showExternalLinkForm && addExternalLink()}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={alertType} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Terminal;
