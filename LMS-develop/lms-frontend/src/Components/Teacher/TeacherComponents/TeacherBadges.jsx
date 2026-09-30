import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";

import TeacherMyBadges from "./TeacherMyBadges";
import StudentsWithBadges from "./StudentsWithBadges";

const API =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

export default function TeacherBadges() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Badges
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="My Badges" />
        <Tab label="Archived" />
        <Tab label="Students With Badges" />
      </Tabs>

      {tab === 0 && <TeacherMyBadges mode="active" />}
      {tab === 1 && <TeacherMyBadges mode="archived" />}
      {tab === 2 && <StudentsWithBadges />}
    </Box>
  );
}
