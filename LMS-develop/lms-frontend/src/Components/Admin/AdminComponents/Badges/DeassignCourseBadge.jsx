// DeassignCourseBadge.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

// base API - prefer VITE_API_URL
const API = import.meta.env.VITE_API_URL || "https://api.opencs.in";

/**
 * DeassignCourseBadge
 * Shows course-badge mappings and lets admin delete mappings (deassign).
 */
export default function DeassignCourseBadge() {
  const [mappings, setMappings] = useState([]); // course-badge mappings
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [coursesList, setCoursesList] = useState([]); // optional course list for filter
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCourse]);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // fetch mappings: optionally filter by courseId
      const q = {};
      if (selectedCourse) q.courseId = selectedCourse;
      // server returns array
      const res = await axios.get(`${API}/api/badges/course-badges`, {
        headers,
        params: { ...q, page, limit },
      });

      // res.data should be array; if server returns wrapped object, adjust:
      const data = Array.isArray(res.data) ? res.data : (res.data.items ?? res.data.data ?? res.data);
      setMappings(Array.isArray(data) ? data : []);

      // fetch courses for filter dropdown (best-effort)
      try {
        const rc = await axios.get(`${API}/courses/getAllCourses`, { headers, params: { _t: Date.now() } });
        let courseArray = rc.data?.data ?? rc.data ?? rc.data?.courses ?? [];
        if (!Array.isArray(courseArray)) {
          const firstArr = Object.values(rc.data ?? {}).find((v) => Array.isArray(v));
          courseArray = firstArr || [];
        }
        // normalize to { id, label }
        const normalized = (courseArray || []).map((c) => ({
          id: c._id || c.id || c.courseId,
          label: c.title || c.name || c.courseName || c.label || String(c._id || c.id),
        })).filter(Boolean);
        setCoursesList(normalized);
      } catch (err) {
        // ignore course list errors but log
        console.warn("Could not load courses for filter:", err);
      }
    } catch (err) {
      console.error("Error loading course-badge mappings:", err);
      alert("Failed to load mappings — check console for details.");
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }

  function openConfirm(mapping) {
    setToDelete(mapping);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setToDelete(null);
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API}/api/badges/course-badges/${toDelete._id}`, { headers });
      alert("Deassigned (deleted) mapping");
      closeConfirm();
      // refresh list
      loadData();
    } catch (err) {
      console.error("Error deleting mapping:", err);
      alert("Failed to delete mapping — see console for details.");
    }
  }

  // client-side filter by search text (badge title / course label etc.)
  const visible = mappings.filter((m) => {
    if (!m) return false;
    const badgeTitle = (m.badgeId && (m.badgeId.title || m.badgeId.name || m.badgeId.code)) || (m.badgeName ?? "");
    const courseLabel = m.courseName || m.courseTitle || (typeof m.courseId === "object" ? (m.courseId.title || m.courseId.name) : m.courseId) || "";
    const s = (search || "").toLowerCase();
    if (!s) return true;
    return (String(badgeTitle).toLowerCase().includes(s) || String(courseLabel).toLowerCase().includes(s) || String(m._id).toLowerCase().includes(s));
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Deassign Badges (Course → Badge mappings)
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Search (badge / course / id)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
          />

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Filter by Course</InputLabel>
            <Select
              value={selectedCourse}
              label="Filter by Course"
              onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
              size="small"
            >
              <MenuItem value="">All courses</MenuItem>
              {coursesList.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="contained" onClick={() => { setSearch(""); setSelectedCourse(""); loadData(); }}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : visible.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography>No course-badge mappings found.</Typography>
          </Box>
        ) : (
          <List>
            {visible.map((m) => {
              const badge = m.badgeId && (typeof m.badgeId === "object" ? (m.badgeId.title || m.badgeId.code) : m.badgeId) || m.badgeTitle || "";
              // courseName may come populated or only id available
              const course = m.courseName || m.courseTitle || (m.courseId && (m.courseId.title || m.courseId.name)) || m.courseId || "";
              return (
                <ListItem key={m._id} divider>
                  <ListItemText
                    primary={<>
                      <strong>{badge || "(badge)"}</strong> &nbsp; <span style={{ color: "#666" }}>{course ? `— ${course}` : ""}</span>
                    </>}
                    secondary={m.assignmentType ? `Type: ${m.assignmentType}` : `Mapping id: ${m._id}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => openConfirm(m)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* pagination controls (simple) */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Typography variant="body2">Showing {visible.length} mappings</Typography>
        <Box>
          <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Button sx={{ ml: 1 }} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </Box>
      </Box>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>Confirm Deassign</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this badge assignment from the course?</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2"><strong>Mapping id:</strong> {toDelete?._id}</Typography>
            <Typography variant="body2"><strong>Badge:</strong> {toDelete?.badgeId?.title || toDelete?.badgeTitle}</Typography>
            <Typography variant="body2"><strong>Course:</strong> {toDelete?.courseName || toDelete?.courseTitle || toDelete?.courseId}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
