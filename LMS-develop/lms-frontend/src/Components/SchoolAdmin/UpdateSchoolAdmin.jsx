import React, { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
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
    TablePagination,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";

const groupAdminsBySchool = (admins) =>
    admins.reduce((acc, admin) => {
        const schoolName = admin.school?.name || "No school assigned";
        if (!acc[schoolName]) acc[schoolName] = [];
        acc[schoolName].push(admin);
        return acc;
    }, {});

const UpdateSchoolAdmin = () => {
    const [schoolAdmins, setSchoolAdmins] = useState([]);
    const [schools, setSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem("token");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [removeBatches, setRemoveBatches] = useState([]);
    const [addBatches, setAddBatches] = useState([]);
    const [schoolFilter, setSchoolFilter] = useState("");
    const [searchField, setSearchField] = useState("name");
    const [searchText, setSearchText] = useState("");

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    const [currentBatchField, setCurrentBatchField] = useState("batchName");
    const [currentBatchInput, setCurrentBatchInput] = useState("");

    const [batches, setBatches] = useState([]);
    const [totalBatch, setTotalBatch] = useState(0);


    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    useEffect(() => {
        fetchSchools();
        fetchSchoolAdmins();
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

    const fetchAllBatches = async () => {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/admin/get-All-Batches`,
            {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                    q: currentBatchInput
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setTotalBatch(response.data.pagination.totalBatches);
        setBatches(response.data.data);
    };

    useEffect(() => {
        if (selectedAdmin) {
            fetchAllBatches();
        }
    }, [page, rowsPerPage, currentBatchInput, selectedAdmin]);


    const availableBatches = useMemo(() => {
        if (!selectedAdmin) return [];

        const assignedIds = (selectedAdmin.batches || []).map(
            (batch) => batch._id
        );

        return batches.filter(
            (batch) => !assignedIds.includes(batch._id)
        );
    }, [batches, selectedAdmin]);

    const handleEditClick = (admin) => {

        setRemoveBatches([]);
        setAddBatches([]);

        setSelectedAdmin({
            ...admin,
            schoolId: admin.school?._id || ""
        });


    };

    const handleDeleteAdmin = async (admin) => {
        try {
            setIsLoading(true);
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/school-admin/delete-school-admin/${admin._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbarMessage("School admin deleted successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            await fetchSchoolAdmins();
        } catch (error) {
            console.error("Error deleting school admin:", error);
            setSnackbarMessage(error.response?.data?.message || "Failed to delete school admin");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSelectedAdmin((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (batch) => {
        setRemoveBatches((prev) =>
            prev.some((item) => item._id === batch._id)
                ? prev.filter((item) => item._id !== batch._id)
                : [...prev, batch]
        );
    };

    const handleAddBatchChange = (batch) => {
        setAddBatches((prev) =>
            prev.some((item) => item._id === batch._id)
                ? prev.filter((item) => item._id !== batch._id)
                : [...prev, batch]
        );
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const schoolAdminToSubmit = {
                name: selectedAdmin.name,
                username: selectedAdmin.username,
                schoolId: selectedAdmin.schoolId,

                removeBatchIds: removeBatches.map(
                    batch => batch._id
                ),

                addBatchIds: addBatches.map(
                    batch => batch._id
                )
            };

            await axios.put(
                `${import.meta.env.VITE_API_URL}/school-admin/update-school-admin/${selectedAdmin._id}`,
                schoolAdminToSubmit,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSnackbarMessage("School admin updated successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            setSelectedAdmin(null);
            setRemoveBatches([]);
            setAddBatches([]);
            await fetchSchoolAdmins();
        } catch (error) {
            console.error("Error updating school admin:", error);
            setSnackbarMessage(error.response?.data?.message || "Failed to update school admin");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !selectedAdmin) {
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
                        Back to Manage Admins
                    </Button>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                Manage Admin
                            </Typography>
                            <Typography color="text.secondary">
                                Edit school ownership and remove assigned batches from this admin.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Chip label={`${selectedAdmin.batches?.length || 0} batches`} color="success" variant="outlined" />
                            <Chip
                                label={`${removeBatches.length} marked to remove`}
                                variant="outlined"
                            />

                            <Chip
                                color="primary"
                                label={`${addBatches.length} selected to add`}
                                variant="outlined"
                            />
                        </Stack>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2, border: "1px solid #edf1ee", height: "100%" }}>
                                <Typography variant="h6" sx={{ fontWeight: 850, mb: 2 }}>
                                    Admin Details
                                </Typography>
                                <TextField
                                    label="Name"
                                    name="name"
                                    value={selectedAdmin.name || ""}
                                    onChange={handleInputChange}
                                    sx={{ mb: 2 }}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Username"
                                    name="username"
                                    value={selectedAdmin.username || ""}
                                    onChange={handleInputChange}
                                    sx={{ mb: 2 }}
                                    fullWidth
                                />
                                <Autocomplete
                                    fullWidth
                                    options={schools}
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => option._id === value._id}
                                    value={selectedAdmin.school || null}
                                    onChange={(event, newValue) => {
                                        setSelectedAdmin((prev) => ({
                                            ...prev,
                                            school: newValue,
                                            schoolId: newValue ? newValue._id : "",
                                        }));
                                    }}
                                    renderInput={(params) => <TextField {...params} label="School" required />}
                                />
                                <Button
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    sx={{ mt: 2 }}
                                >
                                    {isLoading ? "Updating..." : "Update Admin"}
                                </Button>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2, border: "1px solid #edf1ee" }}>
                                <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
                                    Assigned Batches
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Select batches only if they should be removed from this school admin.
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "success.main" }}>
                                                <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Remove</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Batch</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Courses</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Students</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 800 }} align="center">Teachers</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(selectedAdmin.batches || []).map((batch) => (
                                                <TableRow key={batch._id}>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={removeBatches.some((item) => item._id === batch._id)}
                                                            onChange={() => handleCheckboxChange(batch)}
                                                        />
                                                    </TableCell>
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
                                                    <TableCell colSpan={5} align="center">No batches assigned yet.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mt: 3,
                                    border: "1px solid #edf1ee"
                                }}
                            >

                                {/* Header */}

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2
                                    }}
                                >
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 850 }}>
                                            Add New Batches
                                        </Typography>

                                        <Typography color="text.secondary">
                                            Search and assign additional batches.
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>

                                        <Select
                                            value={currentBatchField}
                                            onChange={(e) => setCurrentBatchField(e.target.value)}
                                            size="small"
                                            sx={{ minWidth: 150 }}
                                        >
                                            <MenuItem value="batchName">
                                                Batch Name
                                            </MenuItem>

                                            <MenuItem value="batchId">
                                                Batch ID
                                            </MenuItem>

                                        </Select>

                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={`Search by ${currentBatchField === "batchName"
                                                    ? "Batch Name"
                                                    : "Batch ID"
                                                }`}
                                            value={currentBatchInput}
                                            onChange={(e) =>
                                                setCurrentBatchInput(e.target.value)
                                            }
                                        />

                                    </Stack>

                                </Box>

                                <Grid container spacing={2}>

                                    {availableBatches.map((batch) => {

                                        const selected = addBatches.some(
                                            item => item._id === batch._id
                                        );

                                        return (

                                            <Grid
                                                item
                                                xs={12}
                                                md={6}
                                                key={batch._id}
                                            >

                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: selected
                                                            ? "success.main"
                                                            : "divider",
                                                        bgcolor: selected
                                                            ? "#f0fbf3"
                                                            : "#fff"
                                                    }}
                                                >

                                                    <CardContent
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}
                                                    >

                                                        <Box>

                                                            <Typography
                                                                fontWeight={700}
                                                            >
                                                                {batch.batchName}
                                                            </Typography>

                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
                                                                Batch ID : {batch.batchId}
                                                            </Typography>

                                                        </Box>

                                                        <Checkbox
                                                            checked={selected}
                                                            onChange={() =>
                                                                handleAddBatchChange(batch)
                                                            }
                                                        />

                                                    </CardContent>

                                                </Card>

                                            </Grid>

                                        );

                                    })}

                                </Grid>

                                <TablePagination
                                    rowsPerPageOptions={[12, 24, 48]}
                                    component="div"
                                    count={totalBatch}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(e, newPage) =>
                                        setPage(newPage)
                                    }
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(
                                            parseInt(e.target.value, 10)
                                        );
                                        setPage(0);
                                    }}
                                />

                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #dfe7e2", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                Manage Admins
                            </Typography>
                            <Typography color="text.secondary">
                                Edit or delete school admins from a school-wise operational view.
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
                                <InputLabel id="manage-admin-school-filter">School</InputLabel>
                                <Select
                                    labelId="manage-admin-school-filter"
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
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<EditIcon />}
                                                                fullWidth
                                                                onClick={() => handleEditClick(admin)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                startIcon={<DeleteIcon />}
                                                                fullWidth
                                                                onClick={() => handleDeleteAdmin(admin)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </Stack>
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

export default UpdateSchoolAdmin;
