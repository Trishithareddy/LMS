import { Box, Button, TextField } from "@mui/material";
import axios from "axios";
import { useState } from "react";

export default function CreateSkillTest({ courseId, chapterId, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    questions: [],
    passingPercentage: 60,
  });

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/skilltest`,
      { ...form, courseId, chapterId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    onCreated(res.data);
  };

  return (
    <Box>
      <TextField
        label="Title"
        fullWidth
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />
      <TextField
        label="Instructions"
        fullWidth
        multiline
        rows={3}
        sx={{ mt: 2 }}
        onChange={(e) =>
          setForm({ ...form, instructions: e.target.value })
        }
      />

      <Button sx={{ mt: 3 }} variant="contained" onClick={handleSubmit}>
        Create Skill Test
      </Button>
    </Box>
  );
}
