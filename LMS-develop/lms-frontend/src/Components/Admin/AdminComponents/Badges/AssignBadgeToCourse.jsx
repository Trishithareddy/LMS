import React, { useEffect, useState } from "react";
import {
  Box, FormControl, InputLabel, Select, MenuItem, TextField, Button,
  RadioGroup, FormControlLabel, Radio, Typography, Paper
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
      
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function normalizeCourse(item) {
  if (!item || typeof item !== "object") return null;
  const id = item._id || item.id || item.courseId || item.course_id;
  const label = item.title || item.name || item.courseName || item.label || (typeof item === "string" ? item : undefined);
  if (id) return { id, label: label ?? String(id) };
  return null;
}

export default function AssignBadgeToCourse() {
  const [badges, setBadges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rawCoursesResponse, setRawCoursesResponse] = useState(null); // <-- required
  const [form, setForm] = useState({ courseId: "", badgeId: "", assignmentType: "manual", criteria: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // badges
        const resBadges = await axios.get(`${API}/api/badges`, { headers });
        const badgeItems = resBadges.data?.data ?? resBadges.data ?? [];
        setBadges(badgeItems);

        // courses — cache-bust to avoid 304 responses with empty body
        const resCourses = await axios.get(`${API}/courses/getAllCourses`, {
          headers: { ...headers, "Cache-Control": "no-cache", Pragma: "no-cache" },
          params: { _t: Date.now() }
        });

        // save raw response for debug
        setRawCoursesResponse({ status: resCourses.status, headers: resCourses.headers, body: resCourses.data });
        console.log("resCourses.raw:", resCourses.status, resCourses.headers, resCourses.data);

        // extract array from common shapes
        let courseArray = [];
        if (Array.isArray(resCourses.data)) courseArray = resCourses.data;
        else if (Array.isArray(resCourses.data?.data)) courseArray = resCourses.data.data;
        else if (Array.isArray(resCourses.data?.courses)) courseArray = resCourses.data.courses;
        else if (Array.isArray(resCourses.data?.items)) courseArray = resCourses.data.items;
        else if (Array.isArray(resCourses.data?.docs)) courseArray = resCourses.data.docs;
        else {
          const firstArr = Object.values(resCourses.data ?? {}).find((v) => Array.isArray(v));
          if (firstArr) courseArray = firstArr;
        }

        const normalized = (courseArray || [])
          .map(normalizeCourse)
          .filter(Boolean)
          .reduce((acc, cur) => {
            if (!acc.find((x) => String(x.id) === String(cur.id))) acc.push(cur);
            return acc;
          }, []);

        setCourses(normalized);
        if (normalized.length === 0) {
          console.warn("No courses normalized. See rawCoursesResponse in debug panel or Console.");
        }
      } catch (err) {
        console.error("Error loading badges or courses:", err);
        // store error body (if any) for debug panel
        setRawCoursesResponse(err?.response?.data ?? { error: err.message });
        // show an unobtrusive alert
        alert("Error loading badges or courses — check console for details.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    try {
      if (!form.courseId || !form.badgeId) return alert("Select course and badge");
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        courseId: form.courseId,
        badgeId: form.badgeId,
        assignmentType: form.assignmentType,
        criteria: form.assignmentType === "auto" && form.criteria ? JSON.parse(form.criteria) : {}
      };
      await axios.post(`${API}/api/badges/course-badges`, payload, { headers });
      alert("Assigned");
      navigate("/admin-dashboard/badges");
    } catch (err) {
      console.error("Assign error:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      alert("Error: " + (serverMsg || "See console"));
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, p: 3 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Course</InputLabel>
        <Select name="courseId" value={form.courseId} label="Course" onChange={change} disabled={loading || courses.length === 0}>
          {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
        </Select>
        {loading && <Typography variant="caption">Loading courses…</Typography>}
        {!loading && courses.length === 0 && <Typography variant="caption" color="text.secondary">No courses found — see debug below.</Typography>}
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Badge</InputLabel>
        <Select name="badgeId" value={form.badgeId} label="Badge" onChange={change}>
          {badges.map((b) => <MenuItem key={b._id} value={b._id}>{b.title}</MenuItem>)}
        </Select>
      </FormControl>

      <Box sx={{ mb: 2 }}>
        <RadioGroup row name="assignmentType" value={form.assignmentType} onChange={change}>
          <FormControlLabel value="manual" control={<Radio />} label="Manual (admin award)" />
          <FormControlLabel value="auto" control={<Radio />} label="Automatic (criteria based)" />
        </RadioGroup>
      </Box>

      {form.assignmentType === "auto" && (
        <TextField fullWidth name="criteria" label='Criteria JSON (e.g. {"minScore":80})' value={form.criteria} onChange={change} sx={{ mb: 2 }} />
      )}

      <Button variant="contained" onClick={submit} disabled={loading}>Assign Badge</Button>

       {/* <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Debug — courses</Typography>
        <Paper sx={{ p: 2, backgroundColor: "#fafafa" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Normalized courses count: <strong>{courses.length}</strong></Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>First 5 normalized: {JSON.stringify(courses.slice(0, 5), null, 2)}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Raw response (server):<br />
            <pre style={{ maxHeight: 240, overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(rawCoursesResponse, null, 2)}</pre>
          </Typography>
        </Paper>
      </Box>  */}
    </Box>
  );
}
