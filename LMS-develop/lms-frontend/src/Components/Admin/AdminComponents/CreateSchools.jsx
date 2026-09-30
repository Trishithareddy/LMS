import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { BreadcrumbContext } from "../../BreadcrumbContext";

const emptySchool = {
  name: "",
  address: "",
  city: "",
  state: "",
  phoneNumber: "",
  zipCode: "",
};

const CreateSchools = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [school, setSchool] = useState(emptySchool);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setBreadcrumbTrail([
      { name: "Admin Dashboard", path: "/admin-dashboard" },
      { name: "Create School", path: "/admin-dashboard/create-schools" },
    ]);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSchool((prev) => ({ ...prev, [name]: value }));
  };

  const handleSnackbarOpen = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  const handleSubmit = async () => {
    const requiredFields = ["name", "address", "city", "state", "phoneNumber", "zipCode"];
    if (requiredFields.some((field) => !school[field])) {
      handleSnackbarOpen("Please fill all required fields", "error");
      return;
    }

    const formData = new FormData();
    Object.entries(school).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append("image", file);

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/createSchool`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      handleSnackbarOpen("School created successfully", "success");
      setSchool(emptySchool);
      setFile(null);
    } catch (error) {
      console.error("Error creating school:", error.response?.data || error.message);
      handleSnackbarOpen(
        "Error creating school: " + (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          icon={snackbarSeverity === "success" ? <CheckCircleOutlineIcon fontSize="inherit" /> : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2", mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Create School
            </Typography>
            <Typography color="text.secondary">
              Register school identity, location, contact details, and optional logo in one step.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="School profile" color="success" variant="outlined" />
            <Chip label={file?.name || "Logo optional"} variant="outlined" />
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2" }}>
        <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
          School Details
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Keep these fields accurate because they appear across admin reports and school-wise filters.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField label="School Name" name="name" value={school.name} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Phone Number" name="phoneNumber" value={school.phoneNumber} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address" name="address" value={school.address} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="City" name="city" value={school.city} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="State" name="state" value={school.state} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Zip Code" name="zipCode" value={school.zipCode} onChange={handleInputChange} fullWidth required size="small" />
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" color="success" component="label">
              Choose School Logo
              <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            </Button>
            {file && <Chip label={file.name} sx={{ ml: 1 }} />}
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={loading} sx={{ px: 4, py: 1.1, fontWeight: 850 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create School"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateSchools;
