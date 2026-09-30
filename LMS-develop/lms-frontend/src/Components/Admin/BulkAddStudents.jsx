import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Stack
} from "@mui/material";
import { BreadcrumbContext } from "../BreadcrumbContext";

import { styled } from '@mui/material/styles';
import axios from "axios";
import Papa from 'papaparse';
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    textAlign: 'center',
    padding: theme.spacing(1),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const BulkAddStudents = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [student, setStudent] = useState({
        name: "",
        username: "",
        password: "",
        age: "",
        contact: "",
        fatherName: "",
        address: "",
        schoolId: "",
        studentClass: "",
        section: "",
    });

    const [csvFile, setCsvFile] = useState(null);
    const [schools, setSchools] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [csvData, setCsvData] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSchoolId, setSelectedSchoolId] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'Add Students', path: '/admin-dashboard/bulk-add-students' }
        ]);
    }, []);

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        // setIsLoading(true)
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getAllSchools`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSchools(response.data);

        } catch (error) {
            console.error("Error fetching schools:", error);
        } finally {
            // setIsLoading(false)
        }
    };

    const handleFileUpload = (event) => {
        setCsvFile(event.target.files[0]);
    };

    const processCSV = (file) => {
        Papa.parse(file, {
            complete: (results) => {
                const parsedStudents = results.data.slice(1).map(row => ({
                    name: row[0],
                    username: row[1],
                    password: row[2],
                    age: row[3],
                    contact: row[4],
                    fatherName: row[5],
                    address: row[6],
                    schoolId: row[7],
                    studentClass: row[8],
                    section: row[9]
                }));
                setCsvData(parsedStudents);
            },
            header: false,
            skipEmptyLines: true
        });
    };

    const handleCSVSubmit = async () => {
        if (!csvFile) {
            handleSnackbarOpen("Please select a CSV file", "error");
            return;
        }

        processCSV(csvFile);
    };

    const handleChange = (field, value) => {
        setStudent((prev) => ({ ...prev, [field]: value }));
    };

    const handleSnackbarOpen = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            student.schoolId = selectedSchoolId
            const studentsToSubmit = csvData.length > 0 ? csvData : [student];
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/student/create`,
                { students: studentsToSubmit },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            handleSnackbarOpen(response.data.message, "success");
            // Reset form and CSV data
            setStudent({
                name: "",
                username: "",
                password: "",
                age: "",
                contact: "",
                fatherName: "",
                address: "",
                schoolId: "",
                studentClass: "",
                section: "",
            });
            setSelectedSchoolId(null);
            setCsvData([]);
            setCsvFile(null);
        } catch (error) {
            console.error("Error creating students:", error.response?.data || error);
            handleSnackbarOpen("Error creating students: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setIsLoading(false)
        }
    };

    console.log("schoolId", selectedSchoolId);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                    border: "1px solid #dfe7e2",
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", md: "center" },
                        gap: 2,
                        flexDirection: { xs: "column", md: "row" },
                    }}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            Add Students
                        </Typography>
                        <Typography color="text.secondary">
                            Add one student manually or import many students using a CSV file.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label="Single entry" color="success" variant="outlined" />
                        <Chip label="CSV bulk import" variant="outlined" />
                        {csvData.length > 0 && (
                            <Chip label={`${csvData.length} ready`} color="success" />
                        )}
                    </Stack>
                </Box>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #dfe7e2",
                            height: "100%",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
                            Single Student
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Use this for corrections, late additions, or one-off student accounts.
                        </Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={6}>
                                <TextField label="Name" value={student.name} onChange={(e) => handleChange("name", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Username" value={student.username} onChange={(e) => handleChange("username", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Password" type="password" value={student.password} onChange={(e) => handleChange("password", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Age" type="number" value={student.age} onChange={(e) => handleChange("age", Number(e.target.value))} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Contact" value={student.contact} onChange={(e) => handleChange("contact", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Father's Name" value={student.fatherName} onChange={(e) => handleChange("fatherName", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="school-select-label">School</InputLabel>
                                    <Select
                                        labelId="school-select-label"
                                        value={selectedSchoolId}
                                        onChange={(event) => { setSelectedSchoolId(event.target.value) }}
                                        label="School"
                                    >
                                        {schools.map((school) => (
                                            <MenuItem key={school._id} value={school._id}>
                                                {school.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Class" value={student.studentClass} onChange={(e) => handleChange("studentClass", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Section" value={student.section} onChange={(e) => handleChange("section", e.target.value)} fullWidth required size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Address" value={student.address} onChange={(e) => handleChange("address", e.target.value)} fullWidth required size="small" />
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                sx={{ fontWeight: 800 }}
                            >
                                {isLoading ? "Saving..." : "Create Student"}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #dfe7e2",
                            height: "100%",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
                            Bulk Import
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Upload a CSV when onboarding a full class or school list.
                        </Typography>
                        <Stack spacing={1.5}>
                            <input
                                accept=".csv"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="raised-button-file">
                                <Button fullWidth variant="outlined" color="success" component="span" sx={{ fontWeight: 800 }}>
                                    Choose CSV
                                </Button>
                            </label>
                            {csvFile && (
                                <Chip label={csvFile.name} variant="outlined" sx={{ justifyContent: "flex-start" }} />
                            )}
                            <Button fullWidth variant="contained" color="success" onClick={handleCSVSubmit} sx={{ fontWeight: 800 }}>
                                Preview CSV
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={isLoading || csvData.length === 0}
                                sx={{ fontWeight: 800 }}
                            >
                                {isLoading ? "Saving..." : `Create ${csvData.length || ""} Students`}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

                    {csvData.length > 0 && (
                        <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2, border: "1px solid #dfe7e2" }}>
                            <Typography variant="h6" sx={{ fontWeight: 850 }}>CSV Preview</Typography>
                            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>Name</StyledTableCell>
                                            <StyledTableCell>Username</StyledTableCell>
                                            <StyledTableCell>Age</StyledTableCell>
                                            <StyledTableCell>Contact</StyledTableCell>
                                            <StyledTableCell>Father's Name</StyledTableCell>
                                            <StyledTableCell>Address</StyledTableCell>
                                            <StyledTableCell>School ID</StyledTableCell>
                                            <StyledTableCell>Class</StyledTableCell>
                                            <StyledTableCell>Section</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {csvData.map((student, index) => (
                                            <StyledTableRow key={index}>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell>{student.username}</TableCell>
                                                <TableCell>{student.age}</TableCell>
                                                <TableCell>{student.contact}</TableCell>
                                                <TableCell>{student.fatherName}</TableCell>
                                                <TableCell>{student.address}</TableCell>
                                                <TableCell>{student.schoolId}</TableCell>
                                                <TableCell>{student.studentClass}</TableCell>
                                                <TableCell>{student.section}</TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
        </Box>
    );
};

export default BulkAddStudents;
