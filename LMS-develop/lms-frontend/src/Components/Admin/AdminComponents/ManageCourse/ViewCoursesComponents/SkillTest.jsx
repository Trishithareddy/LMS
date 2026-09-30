import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import SkillTestQuestions from "./SkillTestQuestions";
import { BreadcrumbContext } from "../../../../BreadcrumbContext";
const VITE_API_URL = import.meta.env.VITE_API_URL;


const SkillTest = () => {
  const location = useLocation();
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);

  // ✅ READ DATA FROM ROUTER STATE (NOT PROPS)
  const chapterId = location.state?.chapterId;
  const courseId = location.state?.courseId;
  const courseData = location.state?.courseData;
  const from = location.state?.from;

  const token = localStorage.getItem("token");

  if (!chapterId) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          Chapter information missing. Please navigate from
          <br />
          <b>Update Course → Chapter → Skill Test</b>.
        </Typography>
      </Box>
    );
  }

  const [skillTest, setSkillTest] = useState(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [questions, setQuestions] = useState([]);


  // ✅ SET BREADCRUMB (THIS FIXES YOUR UI ISSUE)
  useEffect(() => {
    if (from === "edit-course") {
      setBreadcrumbTrail([
        { name: "Admin Dashboard", path: "/admin-dashboard" },
        { name: "Update Courses", path: "/admin-dashboard/update-courses" },
        {
          name: "Edit Course",
          path: "/admin-dashboard/edit-course",
          state: { courseData },
        },
        {
          name: "Create Chapter",
          path: "/admin-dashboard/create-chapter",
          state: { courseId, courseData },
        },
        { name: "Add Skill Test", path: "/admin-dashboard/skill-test" },
      ]);
    }
  }, []);

  // 1️⃣ FETCH SKILL TEST FOR CHAPTER
  useEffect(() => {
    if (!chapterId) return;

    axios.get(
      `${VITE_API_URL}/skilltest/admin/chapter/${chapterId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

      .then((res) => {
        if (res.data) {
          setSkillTest(res.data);
          setTitle(res.data.title || "");
          setInstructions(res.data.instructions || "");
          setQuestions(res.data.questions || []);
          setEnabled(true);
        }
      })
      .catch(() => {
        // No skill test exists yet → this is OK
      });
  }, [chapterId]);

  // 2️⃣ CREATE / UPDATE SKILL TEST
  const handleSave = async () => {
    if (!title.trim()) {
      alert("Skill Test title is required");
      return;
    }

    const payload = {
      title,
      instructions,
      chapterId,
      courseId,
    };

    if (skillTest?._id) {
      const res = await axios.put(
        `${VITE_API_URL}/skilltest/${skillTest._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSkillTest(res.data);
      alert("Skill Test updated");
    } else {
      const res = await axios.post(
        `${VITE_API_URL}/skilltest`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSkillTest(res.data);
      alert("Skill Test created");
    }
  };

  // 3️⃣ ASSIGN SKILL TEST TO CHAPTER
  const handleAssign = async () => {
    if (!skillTest?._id) {
      alert("Create Skill Test first");
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/chapters/${chapterId}/assign-skilltest`,
        {
          skillTestId: skillTest._id,
          enabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Skill Test assigned to chapter");
    } catch (err) {
      console.error(err);
      alert("Failed to assign skill test");
    }
  };

  return (
    <Box sx={{ width: "80%", mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Skill Test
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <TextField
        fullWidth
        label="Skill Test Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextField
        fullWidth
        label="Instructions"
        multiline
        rows={4}
        sx={{ mt: 2 }}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <Button
        sx={{ mt: 3 }}
        variant="contained"
        color="success"
        onClick={handleSave}
      >
        {skillTest ? "Update Skill Test" : "Create Skill Test"}
      </Button>

      {skillTest && (
        <>
          <Divider sx={{ my: 3 }} />

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            }
            label="Enable Skill Test for this Chapter"
          />

          <Box>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              onClick={handleAssign}
            >
              Assign to Chapter
            </Button>
          </Box>
        </>
      )}
      {skillTest && (
        <SkillTestQuestions
          skillTestId={skillTest._id}
          chapterId={chapterId}
        />
      )}

    </Box>
  );
};


export default SkillTest;
