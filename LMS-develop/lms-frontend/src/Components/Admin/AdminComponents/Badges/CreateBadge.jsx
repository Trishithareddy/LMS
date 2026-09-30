import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreateBadge() {
  const navigate = useNavigate();

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState({
    title: "",
    code: "",
    description: "",
    iconUrl: "",
    audience: "STUDENT",            // STUDENT | TEACHER
    criteriaType: "SKILL_TEST",     // SKILL_TEST | DERIVED
    courseId: "",
    chapterId: "",
    minPercentage: 80,
    derivedFromBadge: "",           // TEACHER only
  });

  /* ---------------- DATA ---------------- */
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [studentBadges, setStudentBadges] = useState([]);
  const [iconFile, setIconFile] = useState(null);

  /* ---------------- LOAD COURSES ---------------- */
  useEffect(() => {
    const loadCourses = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/courses/getAllCourses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data?.data || res.data || []);
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (form.audience !== "TEACHER" || !form.derivedFromBadge) return;

    const badge = studentBadges.find(
      (b) => b._id === form.derivedFromBadge
    );

    if (badge) {
      setForm((prev) => ({
        ...prev,
        code: badge.code,        // 🔥 SAME CODE
        courseId: badge.criteria?.courseId || "",
        chapterId: badge.criteria?.chapterId || "",
      }));
    }
  }, [form.derivedFromBadge, form.audience]);


  /* ---------------- LOAD STUDENT BADGES ---------------- */
  useEffect(() => {
    const loadStudentBadges = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/badges?audience=STUDENT`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentBadges(res.data?.data || []);
    };
    loadStudentBadges();
  }, []);

  /* ---------------- LOAD CHAPTERS ---------------- */
  useEffect(() => {
    if (!form.courseId) return;

    const loadChapters = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API}/chapters/by-course?courseId=${form.courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChapters(res.data || []);
    };

    loadChapters();
  }, [form.courseId]);

  /* ---------------- ICON UPLOAD ---------------- */
  const uploadIcon = async () => {
    if (!iconFile) return alert("Please select an image");

    const formData = new FormData();
    formData.append("icon", iconFile);

    const res = await axios.post(
      `${API}/api/badges/upload-icon`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setForm((prev) => ({ ...prev, iconUrl: res.data.iconUrl }));
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    try {
      if (!form.title) return alert("Title required");
      if (!form.code) return alert("Code required");
      if (!form.courseId) return alert("Course required");
      if (!form.chapterId) return alert("Chapter required");

      if (form.audience === "STUDENT" && !form.minPercentage) {
        return alert("Minimum percentage required");
      }

      if (form.audience === "TEACHER" && !form.derivedFromBadge) {
        return alert("Select related student badge");
      }

      const criteria = {
        type: form.criteriaType,
        courseId: form.courseId,
        chapterId: form.chapterId,
      };

      if (form.audience === "STUDENT") {
        criteria.minPercentage = Number(form.minPercentage);
      }

      if (form.audience === "TEACHER") {
        criteria.derivedFromBadge = form.derivedFromBadge;
      }

      await axios.post(`${API}/api/badges`, {
        title: form.title,
        code: form.code,
        description: form.description,
        iconUrl: form.iconUrl,
        audience: form.audience,
        criteria,
      });

      alert("Badge created successfully");
      navigate("/admin-dashboard/badges");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create badge");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Box sx={{ maxWidth: 600, p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create Badge
      </Typography>

      <TextField fullWidth label="Title" sx={{ mb: 2 }}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <TextField
        fullWidth
        label="Code"
        sx={{ mb: 2 }}
        value={form.code}
        disabled={form.audience === "TEACHER"}   // 🔥 IMPORTANT
        helperText={
          form.audience === "TEACHER"
            ? "Inherited from student badge"
            : "Enter scope code (e.g. HAPPY_3_1)"
        }
        onChange={(e) =>
          setForm({ ...form, code: e.target.value.toUpperCase() })
        }
      />


      <TextField fullWidth label="Description" sx={{ mb: 2 }}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      {/* Audience */}
      <TextField select fullWidth label="Audience" sx={{ mb: 2 }}
        value={form.audience}
        onChange={(e) =>
          setForm({
            ...form,
            audience: e.target.value,
            criteriaType: e.target.value === "TEACHER" ? "MANUAL" : "SKILL_TEST",
            derivedFromBadge: "",
          })
        }
      >
        <MenuItem value="STUDENT">Student</MenuItem>
        <MenuItem value="TEACHER">Teacher</MenuItem>
      </TextField>

      {/* Course */}
      <TextField select fullWidth label="Course" sx={{ mb: 2 }}
        value={form.courseId}
        onChange={(e) =>
          setForm({ ...form, courseId: e.target.value, chapterId: "" })
        }
      >
        {courses.map((c) => (
          <MenuItem key={c._id} value={c._id}>
            {c.name || c.courseName}
          </MenuItem>
        ))}
      </TextField>

      {/* Chapter */}
      {form.courseId && (
        <TextField select fullWidth label="Chapter" sx={{ mb: 2 }}
          value={form.chapterId}
          onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
        >
          {chapters.map((ch) => (
            <MenuItem key={ch._id} value={ch._id}>
              {ch.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      {/* Student min % */}
      {form.audience === "STUDENT" && (
        <TextField
          fullWidth
          type="number"
          label="Minimum Percentage"
          sx={{ mb: 2 }}
          value={form.minPercentage}
          onChange={(e) =>
            setForm({ ...form, minPercentage: e.target.value })
          }
        />
      )}

      {/* Teacher derived badge */}
      {form.audience === "TEACHER" && (
        <TextField
          select
          fullWidth
          label="Derived From Student Badge"
          sx={{ mb: 2 }}
          value={form.derivedFromBadge}
          onChange={(e) =>
            setForm({ ...form, derivedFromBadge: e.target.value })
          }
        >
          {studentBadges.map((b) => (
            <MenuItem key={b._id} value={b._id}>
              {b.title}
            </MenuItem>
          ))}
        </TextField>
      )}
      {/* Icon URL from Cloudinary */}
      <Box sx={{ mt: 3 }}>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Badge Icon
        </Typography>

        {/* Paste Image URL */}
        <TextField
          fullWidth
          label="Paste Image URL (Cloudinary)"
          placeholder="https://..."
          value={form.iconUrl}
          onChange={(e) =>
            setForm({ ...form, iconUrl: e.target.value })
          }
        />

        <Typography align="center" sx={{ my: 2 }}>
          OR
        </Typography>

        {/* Upload from computer */}
        <Button
          variant="outlined"
          component="label"
          fullWidth
          disabled={form.iconUrl !== ""}
        >
          Choose Image File
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => setIconFile(e.target.files[0])}
          />
        </Button>

        {iconFile && (
          <Button
            sx={{ mt: 1 }}
            fullWidth
            variant="contained"
            onClick={uploadIcon}
          >
            Upload Image
          </Button>
        )}

        {/* Preview */}
        {/* Preview */}
        {(form.iconUrl || iconFile) && (
          <Box
            sx={{
              mt: 2,
              textAlign: "center",
              border: "1px dashed #ccc",
              p: 2,
              borderRadius: 2
            }}
          >
            <Typography variant="body2">Preview</Typography>

            <img
              src={
                iconFile
                  ? URL.createObjectURL(iconFile)
                  : form.iconUrl
              }
              alt="badge preview"
              width={120}
              style={{ marginTop: 10 }}
            />
          </Box>
        )}

      </Box>


      <Button sx={{ mt: 3 }} variant="contained" color="success" onClick={submit}>
        Create Badge
      </Button>
    </Box>
  );
}

