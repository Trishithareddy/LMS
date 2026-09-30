import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const DeleteSchools = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");

  const token = localStorage.getItem("token");

  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllSchools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data || []);
    } catch (err) {
      console.error("Error fetching schools");
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleDelete = async () => {
    if (!selectedSchool) return;

    if (!window.confirm(`Delete ${selectedSchool.name}? This removes linked students, teachers, and school admins.`)) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/school/delete/${selectedSchool._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("School deleted successfully");
      setSeverity("success");
      setSelectedSchool(null);
      fetchSchools();
    } catch (err) {
      setMessage("Error deleting school");
      setSeverity("error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2", mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Delete School
            </Typography>
            <Typography color="text.secondary">
              Search a school, review its linked users, then delete only when the impact is clear.
            </Typography>
          </Box>
          <Chip label={`${schools.length} schools`} color="success" variant="outlined" />
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
              Select School
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Use search to avoid scrolling through the full school list.
            </Typography>
            <Autocomplete
              options={schools}
              getOptionLabel={(school) => school.name || ""}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={selectedSchool}
              onChange={(event, value) => setSelectedSchool(value)}
              renderOption={(props, option) => (
                <li {...props} key={option._id}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => <TextField {...params} label="Search School by Name" size="small" />}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", minHeight: 230 }}>
            {selectedSchool ? (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {selectedSchool.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {[selectedSchool.city, selectedSchool.state].filter(Boolean).join(", ")} · {selectedSchool.zipCode || "No ZIP"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`${selectedSchool.students?.length || 0} students`} />
                    <Chip label={`${selectedSchool.teachers?.length || 0} teachers`} />
                  </Stack>
                </Box>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Address" value={selectedSchool.address || ""} fullWidth disabled size="small" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Phone" value={selectedSchool.phoneNumber || ""} fullWidth disabled size="small" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="State" value={selectedSchool.state || ""} fullWidth disabled size="small" />
                  </Grid>
                </Grid>
                <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 850 }}>
                  Delete School
                </Button>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
                <Typography color="text.secondary">
                  Select a school to review delete impact.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={severity}>{message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DeleteSchools;
