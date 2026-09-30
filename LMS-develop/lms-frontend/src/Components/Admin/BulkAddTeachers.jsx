import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import Papa from "papaparse";
import React, { useContext, useEffect, useState } from "react";
import { BreadcrumbContext } from "../BreadcrumbContext";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  textAlign: "center",
  padding: theme.spacing(1),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const BulkAddTeachers = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [teacher, setTeacher] = useState({
    name: "",
    username: "",
    password: "",
  });
  const [csvFile, setCsvFile] = useState(null);
  const [schools, setSchools] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [csvData, setCsvData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setBreadcrumbTrail([
      { name: "Admin Dashboard", path: "/admin-dashboard" },
      { name: "Add Teachers", path: "/admin-dashboard/bulk-add-teachers" },
    ]);
  }, []);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/getAllSchools`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchools(response.data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setCsvFile(file || null);
    setCsvData([]);
  };

  const processCSV = (file) => {
    Papa.parse(file, {
      complete: (results) => {
        const parsedTeachers = results.data.slice(1).map((row) => ({
          name: row[0],
          username: row[1],
          password: row[2],
          schoolId: row[3],
        }));
        setCsvData(parsedTeachers);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const handleCSVSubmit = async () => {
    if (!csvFile) {
      handleSnackbarOpen("Please select a CSV file", "error");
      return;
    }
    processCSV(csvFile);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTeacher((prev) => ({ ...prev, [name]: value }));
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
    const teachersToSubmit =
      csvData.length > 0
        ? csvData
        : [{ ...teacher, schoolId: selectedSchool?._id || "" }];

    if (!csvData.length && !selectedSchool) {
      handleSnackbarOpen("Please select a school for the teacher", "error");
      return;
    }

    if (teachersToSubmit.some((item) => Object.values(item).some((value) => !value))) {
      handleSnackbarOpen("All fields are required for each teacher", "error");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/teacher/create`,
        { teachers: teachersToSubmit },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      handleSnackbarOpen("Teachers created successfully", "success");
      setTeacher({ name: "", username: "", password: "" });
      setSelectedSchool(null);
      setCsvData([]);
      setCsvFile(null);
    } catch (error) {
      console.error("Error creating teachers:", error);
      handleSnackbarOpen(
        "Error creating teachers: " + (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2", mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Add Teachers
            </Typography>
            <Typography color="text.secondary">
              Add one teacher manually or import many teachers using a CSV file.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="Single entry" color="success" variant="outlined" />
            <Chip label="CSV bulk import" variant="outlined" />
            {csvData.length > 0 && <Chip label={`${csvData.length} ready`} color="success" />}
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
              Single Teacher
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Use this for quick one-off teacher account creation.
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <TextField label="Name" name="name" value={teacher.name} onChange={handleInputChange} fullWidth required size="small" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Username" name="username" value={teacher.username} onChange={handleInputChange} fullWidth required size="small" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Password" name="password" type="password" value={teacher.password} onChange={handleInputChange} fullWidth required size="small" />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={schools}
                  getOptionLabel={(school) => school.name || ""}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  value={selectedSchool}
                  onChange={(event, value) => setSelectedSchool(value)}
                  renderInput={(params) => <TextField {...params} label="School" size="small" required />}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
              Bulk Import
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              CSV columns: name, username, password, schoolId.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <input accept=".csv" style={{ display: "none" }} id="teacher-csv-upload" type="file" onChange={handleFileUpload} />
              <label htmlFor="teacher-csv-upload">
                <Button variant="contained" component="span" color="success">
                  Upload CSV
                </Button>
              </label>
              <Button variant="contained" color="success" onClick={handleCSVSubmit}>
                Process CSV
              </Button>
            </Stack>
            {csvFile && (
              <Chip label={csvFile.name} sx={{ mt: 2, maxWidth: "100%" }} />
            )}
          </Paper>
        </Grid>
      </Grid>

      {csvData.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>
                CSV Preview
              </Typography>
              <Typography color="text.secondary">
                Review imported teacher rows before creating accounts.
              </Typography>
            </Box>
            <Chip label={`${csvData.length} teachers`} color="success" />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #edf1ee" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Username</StyledTableCell>
                  <StyledTableCell>School ID</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.slice(0, 30).map((item, index) => (
                  <StyledTableRow key={`${item.username}-${index}`}>
                    <TableCell align="center">{item.name}</TableCell>
                    <TableCell align="center">{item.username}</TableCell>
                    <TableCell align="center">{item.schoolId}</TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ px: 4, py: 1.1, fontWeight: 850 }}
        >
          {isLoading ? "Creating..." : csvData.length ? "Create Imported Teachers" : "Create Teacher"}
        </Button>
      </Box>
    </Box>
  );
};

export default BulkAddTeachers;
