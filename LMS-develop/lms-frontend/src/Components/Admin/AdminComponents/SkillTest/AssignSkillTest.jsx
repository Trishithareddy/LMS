import {
  Box,
  Button,
  Select,
  MenuItem,
  Switch,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AssignSkillTest({ chapterId }) {
  const [skillTests, setSkillTests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [selectedSkillTest, setSelectedSkillTest] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [enabled, setEnabled] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("/badges").then((r) => setBadges(r.data));
  }, []);

  const handleAssign = async () => {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/chapters/${chapterId}/assign-skilltest`,
      {
        skillTestId: selectedSkillTest,
        badgeId: selectedBadge,
        enabled,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Skill Test Assigned");
  };

  return (
    <Box>
      <Typography variant="h6">Assign Skill Test</Typography>

      <Select
        fullWidth
        value={selectedSkillTest}
        onChange={(e) => setSelectedSkillTest(e.target.value)}
      >
        {skillTests.map((st) => (
          <MenuItem key={st._id} value={st._id}>
            {st.title}
          </MenuItem>
        ))}
      </Select>

      <Select
        fullWidth
        sx={{ mt: 2 }}
        value={selectedBadge}
        onChange={(e) => setSelectedBadge(e.target.value)}
      >
        {badges.map((b) => (
          <MenuItem key={b._id} value={b._id}>
            {b.title}
          </MenuItem>
        ))}
      </Select>

      <Box sx={{ mt: 2 }}>
        <Typography>Enable Skill Test</Typography>
        <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      </Box>

      <Button sx={{ mt: 2 }} variant="contained" onClick={handleAssign}>
        Save
      </Button>
    </Box>
  );
}
