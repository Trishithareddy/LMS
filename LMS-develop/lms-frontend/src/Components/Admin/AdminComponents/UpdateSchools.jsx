import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  Alert,
  Autocomplete,
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
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BreadcrumbContext } from "../../BreadcrumbContext";

const emptySchool = {
  name: "",
  address: "",
  city: "",
  state: "",
  phoneNumber: "",
  zipCode: "",
};

const UpdateSchool = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [school, setSchool] = useState(emptySchool);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const token = localStorage.getItem("token");

  const selectedSchool = useMemo(
    () => schools.find((item) => item._id === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  );

  useEffect(() => {
    setBreadcrumbTrail([
      { name: "Admin Dashboard", path: "/admin-dashboard" },
      { name: "Update School", path: "/admin-dashboard/update-school" },
    ]);
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllSchools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSchool = async (id) => {
    setSelectedSchoolId(id || "");
    setFile(null);
    if (!id) {
      setSchool(emptySchool);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getSchoolByid/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchool({
        name: res.data.name || "",
        address: res.data.address || "",
        city: res.data.city || "",
        state: res.data.state || "",
        phoneNumber: res.data.phoneNumber || "",
        zipCode: res.data.zipCode || "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setSchool((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSnackbar = (msg, type) => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(type);
    setOpenSnackbar(true);
  };

  const handleUpdate = async () => {
    if (!selectedSchoolId) {
      handleSnackbar("Please select a school", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(school).forEach(([key, value]) => formData.append(key, value));
      if (file) formData.append("image", file);

      await axios.put(`${import.meta.env.VITE_API_URL}/admin/school/update/${selectedSchoolId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      handleSnackbar("School updated successfully", "success");
      setSelectedSchoolId("");
      setSchool(emptySchool);
      setFile(null);
      fetchSchools();
    } catch (error) {
      console.error(error);
      handleSnackbar("Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert
          severity={snackbarSeverity}
          icon={snackbarSeverity === "success" ? <CheckCircleOutlineIcon fontSize="inherit" /> : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2", mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Update School
            </Typography>
            <Typography color="text.secondary">
              Select a school, update profile details, and optionally replace the school logo.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`${schools.length} schools`} color="success" variant="outlined" />
            {selectedSchool && <Chip label={selectedSchool.name} variant="outlined" />}
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
              Select School
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Search by name and pick the school to edit.
            </Typography>
            <Autocomplete
              options={schools}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={selectedSchool}
              onChange={(event, value) => handleSelectSchool(value?._id || "")}
              renderInput={(params) => <TextField {...params} label="School" size="small" />}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2" }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
              School Profile
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Fields unlock after choosing a school from the selector.
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField name="name" label="School Name" fullWidth value={school.name} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField name="phoneNumber" label="Phone Number" fullWidth value={school.phoneNumber} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="address" label="Address" fullWidth value={school.address} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField name="city" label="City" fullWidth value={school.city} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField name="state" label="State" fullWidth value={school.state} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField name="zipCode" label="Zip Code" fullWidth value={school.zipCode} onChange={handleInputChange} size="small" disabled={!selectedSchoolId} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" color="success" component="label" disabled={!selectedSchoolId}>
                  Choose New Logo
                  <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
                </Button>
                {file && <Chip label={file.name} sx={{ ml: 1 }} />}
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button variant="contained" color="success" onClick={handleUpdate} disabled={loading || !selectedSchoolId} sx={{ px: 4, py: 1.1, fontWeight: 850 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Update School"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UpdateSchool;
