import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://api.opencs.in";

export default function EditBadge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState({
    title: "",
    code: "",
    description: "",
    iconUrl: "",
    audience: "STUDENT",
    criteriaType: "SKILL_TEST",
    courseId: "",
    chapterId: "",
    minPercentage: 80,
    derivedFromBadge: "",
  });

  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [studentBadges, setStudentBadges] = useState([]);
  const [iconFile, setIconFile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD COURSES ---------------- */
  useEffect(() => {
    axios
      .get(`${API}/courses/getAllCourses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) =>
        setCourses(res.data?.data || res.data || [])
      );
  }, []);

  /* ---------------- LOAD STUDENT BADGES ---------------- */
  useEffect(() => {
    axios
      .get(`${API}/api/badges?audience=STUDENT`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) =>
        setStudentBadges(res.data?.data || [])
      );
  }, []);

  /* ---------------- LOAD BADGE ---------------- */
  useEffect(() => {
    const loadBadge = async () => {
      const res = await axios.get(`${API}/api/badges/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const b = res.data;

      setForm({
        title: b.title,
        code: b.code,
        description: b.description,
        iconUrl: b.iconUrl,
        audience: b.audience,
        criteriaType: b.criteria.type,
        courseId: b.criteria.courseId || "",
        chapterId: b.criteria.chapterId || "",
        minPercentage: b.criteria.minPercentage || 80,
        derivedFromBadge: b.criteria.derivedFromBadge || "",
      });

      setLoading(false);
    };

    loadBadge();
  }, [id]);

  useEffect(() => {
    if (form.audience !== "TEACHER" || !form.derivedFromBadge) return;

    const sb = studentBadges.find(
      (b) => b._id === form.derivedFromBadge
    );

    if (sb) {
      setForm((prev) => ({
        ...prev,
        code: sb.code,
        courseId: sb.criteria?.courseId || "",
        chapterId: sb.criteria?.chapterId || "",
      }));
    }
  }, [form.derivedFromBadge, form.audience, studentBadges]);


  /* ---------------- LOAD CHAPTERS ---------------- */
  useEffect(() => {
    if (!form.courseId) return;

    axios
      .get(`${API}/chapters/by-course?courseId=${form.courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setChapters(res.data || []))
      .catch(() => setChapters([]));
  }, [form.courseId]);

  /* ---------------- ICON UPLOAD ---------------- */
  const uploadIcon = async () => {
    if (!iconFile) return alert("Select an image");

    const fd = new FormData();
    fd.append("icon", iconFile);

    const res = await axios.post(
      `${API}/api/badges/upload-icon`,
      fd,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setForm((p) => ({ ...p, iconUrl: res.data.iconUrl }));
  };

  /* ---------------- UPDATE ---------------- */
  const submit = async () => {
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

    await axios.put(
      `${API}/api/badges/${id}`,
      {
        title: form.title,
        code: form.code,
        description: form.description,
        iconUrl: form.iconUrl,
        audience: form.audience,
        criteria,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Badge updated");
    navigate("/admin-dashboard/badges");
  };

  if (loading) return <Box p={3}>Loading...</Box>;

  /* ---------------- UI ---------------- */
  return (
    <Box sx={{ maxWidth: 600, p: 3 }}>
      <Typography variant="h6">Edit Badge</Typography>

      <TextField fullWidth label="Title" sx={{ mb: 2 }}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <TextField
        fullWidth
        label="Code"
        sx={{ mb: 2 }}
        value={form.code}
        disabled={form.audience === "TEACHER"}
        helperText={
          form.audience === "TEACHER"
            ? "Inherited from student badge"
            : "Editable for student badge"
        }
        onChange={(e) =>
          setForm({ ...form, code: e.target.value.toUpperCase() })
        }
      />


      <TextField fullWidth label="Description" sx={{ mb: 2 }}
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <TextField select fullWidth label="Audience" sx={{ mb: 2 }}
        value={form.audience}
        disabled
      >
        <MenuItem value="STUDENT">Student</MenuItem>
        <MenuItem value="TEACHER">Teacher</MenuItem>
      </TextField>

      {/* Course */}
      <TextField
        select
        fullWidth
        label="Course"
        sx={{ mb: 2 }}
        value={form.courseId}
        disabled={form.audience === "TEACHER"}
        onChange={(e) =>
          setForm({ ...form, courseId: e.target.value })
        }
      >

        {courses.map((c) => (
          <MenuItem key={c._id} value={c._id}>
            {c.name || c.courseName}
          </MenuItem>
        ))}
      </TextField>

      {/* Chapter */}
      <TextField
        select
        fullWidth
        label="Chapter"
        sx={{ mb: 2 }}
        value={form.chapterId}
        disabled={form.audience === "TEACHER"}
        onChange={(e) =>
          setForm({ ...form, chapterId: e.target.value })
        }
      >

        {chapters.map((ch) => (
          <MenuItem key={ch._id} value={ch._id}>
            {ch.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Student min % */}
      {form.audience === "STUDENT" && (
        <TextField
          type="number"
          fullWidth
          label="Minimum Percentage"
          sx={{ mb: 2 }}
          value={form.minPercentage}
          onChange={(e) =>
            setForm({ ...form, minPercentage: e.target.value })
          }
        />
      )}

      {/* Teacher derived */}
      {form.audience === "TEACHER" && (
        <TextField
          select
          fullWidth
          label="Derived From Student Badge"
          sx={{ mb: 2 }}
          value={form.derivedFromBadge}
          disabled
          helperText="Cannot be changed"
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

      <Button
        variant="contained"
        color="success"
        sx={{ mt: 3 }}
        onClick={submit}
      >
        Save Changes
      </Button>
    </Box>
  );
}
