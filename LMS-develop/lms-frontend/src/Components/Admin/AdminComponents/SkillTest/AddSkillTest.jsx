import { Box, Button, TextField } from "@mui/material";
import axios from "axios";
import { useState } from "react";

const AddSkillTest = ({ chapterId, courseId, existing, onSaved }) => {
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState(existing?.title || "");
  const [instructions, setInstructions] = useState(existing?.instructions || "");

  const handleSubmit = async () => {
    try {
      const payload = {
        title,
        instructions,
        chapterId,
        courseId,
      };

      const res = existing?._id
        ? await axios.put(
            `${import.meta.env.VITE_API_URL}/skilltest/${existing._id}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        : await axios.post(
            `${import.meta.env.VITE_API_URL}/skilltest`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );

      onSaved(res.data);
      alert("Skill Test saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save Skill Test");
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Skill Test Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        sx={{ mt: 2 }}
        label="Instructions"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        onClick={handleSubmit}
      >
        {existing ? "Update Skill Test" : "Create Skill Test"}
      </Button>
    </Box>
  );
};

export default AddSkillTest;
