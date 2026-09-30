import React, { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";

const groupAdminsBySchool = (admins) =>
    admins.reduce((acc, admin) => {
        const schoolName = admin.school?.name || "No school assigned";
        if (!acc[schoolName]) acc[schoolName] = [];
        acc[schoolName].push(admin);
        return acc;
    }, {});

const ViewSchoolAdmin = () => {
    const [schoolAdmins, setSchoolAdmins] = useState([]);
    const [schools, setSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem("token");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [schoolFilter, setSchoolFilter] = useState("");
    const [searchField, setSearchField] = useState("name");
    const [searchText, setSearchText] = useState("");

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    useEffect(() => {
        fetchSchoolAdmins();
        fetchSchools();
    }, []);

    const fetchSchoolAdmins = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/school-admin/getall-school-admin`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSchoolAdmins(response.data.schoolAdmins || []);
        } catch (error) {
            console.error("Error fetching school admins:", error);
            setSnackbarMessage("Error fetching school admins");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

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

    const filteredAdmins = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return schoolAdmins.filter((admin) => {
            const matchesSchool = !schoolFilter || admin.school?.name === schoolFilter;
            const fieldValue = searchField === "school" ? admin.school?.name : admin[searchField];
            const matchesSearch = !query || String(fieldValue || "").toLowerCase().includes(query);
            return matchesSchool && matchesSearch;
        });
    }, [schoolAdmins, schoolFilter, searchField, searchText]);

    const groupedAdmins = useMemo(() => groupAdminsBySchool(filteredAdmins), [filteredAdmins]);

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ my: 3 }}>
            {selectedAdmin ? (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #dfe7e2", borderRadius: 2 }}>
                    <Button startIcon={<ArrowBackIcon />} color="success" onClick={() => setSelectedAdmin(null)} sx={{ mb: 2 }}>
                        Back to Admin Records
                    </Button>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {selectedAdmin.name}
                            </Typography>
                            <Typography color="text.secondary">
                                {selectedAdmin.username} · {selectedAdmin.school?.name || "No school assigned"}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Chip color="success" variant="outlined" label={`${selectedAdmin.batches?.length || 0} batches`} />
                        </Stack>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #edf1ee" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "success.main" }}>
                                    <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Batch</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Assigned Course</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Students</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Teachers</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(selectedAdmin.batches || []).map((batch) => (
                                    <TableRow key={batch._id}>
                                        <TableCell align="center">{batch.batchName}</TableCell>
                                        <TableCell align="center">
                                            {(batch?.courses || []).map((course) => (
                                                <Box key={course._id}>{course.name}</Box>
                                            ))}
                                        </TableCell>
                                        <TableCell align="center">{batch.students?.length || 0}</TableCell>
                                        <TableCell align="center">{batch.teachers?.length || 0}</TableCell>
                                    </TableRow>
                                ))}
                                {!selectedAdmin.batches?.length && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">No batches assigned yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #dfe7e2", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                Admin Records
                            </Typography>
                            <Typography color="text.secondary">
                                Browse school admins school-wise and open ownership details only when needed.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip label={`${schoolAdmins.length} admins`} color="success" variant="outlined" />
                            <Chip label={`${Object.keys(groupedAdmins).length} schools shown`} variant="outlined" />
                        </Stack>
                    </Box>

                    <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="school-admin-school-filter">School</InputLabel>
                                <Select
                                    labelId="school-admin-school-filter"
                                    label="School"
                                    value={schoolFilter}
                                    onChange={(e) => setSchoolFilter(e.target.value)}
                                >
                                    <MenuItem value="">All schools</MenuItem>
                                    {schools.map((school) => (
                                        <MenuItem key={school._id} value={school.name}>
                                            {school.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Select value={searchField} onChange={(e) => setSearchField(e.target.value)} size="small" sx={{ minWidth: 140 }}>
                                    <MenuItem value="name">Name</MenuItem>
                                    <MenuItem value="username">Username</MenuItem>
                                    <MenuItem value="school">School</MenuItem>
                                </Select>
                                <TextField
                                    label={`Search by ${searchField}`}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Box>
                        </Grid>
                        {(schoolFilter || searchText) && (
                            <Grid item xs={12} md="auto">
                                <Button color="success" onClick={() => { setSchoolFilter(""); setSearchText(""); }}>
                                    Clear filters
                                </Button>
                            </Grid>
                        )}
                    </Grid>

                    {Object.entries(groupedAdmins).map(([schoolName, admins]) => {
                        const batchCount = admins.reduce((sum, admin) => sum + (admin.batches?.length || 0), 0);
                        return (
                            <Accordion key={schoolName} disableGutters sx={{ mb: 1, border: "1px solid #dfe7e2", borderRadius: 1, overflow: "hidden" }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1, flexWrap: "wrap" }}>
                                        <Typography sx={{ fontWeight: 850 }}>{schoolName}</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Chip size="small" color="success" label={`${admins.length} admins`} />
                                            <Chip size="small" label={`${batchCount} batch links`} />
                                        </Stack>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={1.5}>
                                        {admins.map((admin) => (
                                            <Grid item xs={12} md={6} lg={4} key={admin._id}>
                                                <Card variant="outlined" sx={{ height: "100%" }}>
                                                    <CardContent>
                                                        <Typography variant="h6" sx={{ fontWeight: 850 }}>
                                                            {admin.name}
                                                        </Typography>
                                                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                                                            {admin.username}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                            <Chip size="small" label={`${admin.batches?.length || 0} batches`} />
                                                        </Stack>
                                                        <Button variant="contained" color="success" fullWidth onClick={() => setSelectedAdmin(admin)}>
                                                            View Details
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}

                    {!Object.keys(groupedAdmins).length && (
                        <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                            No school admins match the selected filters.
                        </Typography>
                    )}
                </Paper>
            )}

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
        </Container>
    );
};

export default ViewSchoolAdmin;
