import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Grid,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    TablePagination,
    TextField,
    Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BreadcrumbContext } from "../BreadcrumbContext";

const CreateSchoolAdmin = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [schoolAdmin, setSchoolAdmin] = useState({
        name: "",
        username: "",
        password: "",
        schoolId: "",
    });
    const [schools, setSchools] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(12);
    const [page, setPage] = useState(0);
    const [batches, setBatches] = useState([]);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [totalBatch, setTotalBatch] = useState(0);
    const [currentBatchField, setCurrentBatchField] = useState("batchName");
    const [currentBatchInput, setCurrentBatchInput] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Add School Admin", path: "/admin-dashboard/create-school-admin" },
        ]);
    }, []);

    useEffect(() => {
        fetchSchools();
    }, []);

    useEffect(() => {
        fetchAllBatches();
    }, [page, rowsPerPage, currentBatchInput]);
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

    const fetchAllBatches = async () => {
        try {
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

        } catch (error) {
            console.error(error);
        }
    };

    const selectedSchool = useMemo(
        () => schools.find((school) => school._id === schoolAdmin.schoolId) || null,
        [schools, schoolAdmin.schoolId]
    );

    const filteredBatches = useMemo(() => {
        const query = currentBatchInput.trim().toLowerCase();
        if (!query) return batches;
        return batches.filter((batch) =>
            String(batch[currentBatchField] || "").toLowerCase().includes(query)
        );
    }, [batches, currentBatchField, currentBatchInput]);

    const handleSubmit = async () => {
        if (!schoolAdmin.name || !schoolAdmin.username || !schoolAdmin.password || !schoolAdmin.schoolId) {
            setSnackbarMessage("Name, username, password, and school are required");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/school-admin/create-school-admin`,
                {
                    ...schoolAdmin,
                    batchIds: selectedBatches.map((batch) => batch._id),
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSnackbarMessage("School admin created successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            setSchoolAdmin({ name: "", username: "", password: "", schoolId: "" });
            setSelectedBatches([]);
        } catch (error) {
            console.error("Error creating school admin:", error);
            setSnackbarMessage(error.response?.data?.message || "Failed to create school admin");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSchoolAdmin((prev) => ({ ...prev, [name]: value }));
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCheckboxChange = (batch) => {
        setSelectedBatches((prev) =>
            prev.some((item) => item._id === batch._id)
                ? prev.filter((item) => item._id !== batch._id)
                : [...prev, batch]
        );
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f7faf8", p: { xs: 2, md: 3 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2", mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            Add School Admin
                        </Typography>
                        <Typography color="text.secondary">
                            Create the admin account, assign a school, and attach batches from one clean workspace.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={selectedSchool?.name || "No school selected"} color={selectedSchool ? "success" : "default"} variant="outlined" />
                        <Chip label={`${selectedBatches.length} batches selected`} variant="outlined" />
                    </Stack>
                </Box>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={4}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
                        <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>
                            Admin Details
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            This login will manage the selected school and assigned batches.
                        </Typography>
                        <Stack spacing={1.5}>
                            <TextField label="Name" name="name" value={schoolAdmin.name} onChange={handleInputChange} fullWidth required size="small" />
                            <TextField label="Username" name="username" value={schoolAdmin.username} onChange={handleInputChange} fullWidth required size="small" />
                            <TextField label="Password" name="password" type="password" value={schoolAdmin.password} onChange={handleInputChange} fullWidth required size="small" />
                            <Autocomplete
                                fullWidth
                                options={schools}
                                getOptionLabel={(option) => option.name || ""}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={selectedSchool}
                                onChange={(event, newValue) => {
                                    setSchoolAdmin((prev) => ({
                                        ...prev,
                                        schoolId: newValue ? newValue._id : "",
                                    }));
                                }}
                                renderInput={(params) => <TextField {...params} label="School" required size="small" />}
                            />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dfe7e2", height: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 1, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 850 }}>
                                    Assign Batches
                                </Typography>
                                <Typography color="text.secondary">
                                    Search and select the batches this admin should operate.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Select value={currentBatchField} onChange={(e) => setCurrentBatchField(e.target.value)} size="small" sx={{ minWidth: 130 }}>
                                    <MenuItem value="batchName">Batch Name</MenuItem>
                                    <MenuItem value="batchId">Batch ID</MenuItem>
                                </Select>
                                <TextField
                                    label={`Search by ${currentBatchField === "batchName" ? "batch name" : "batch ID"}`}
                                    value={currentBatchInput}
                                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                                    size="small"
                                />
                            </Stack>
                        </Box>

                        {selectedBatches.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                {selectedBatches.slice(0, 8).map((batch) => (
                                    <Chip
                                        key={batch._id}
                                        label={batch.batchName}
                                        color="success"
                                        variant="outlined"
                                        onDelete={() => handleCheckboxChange(batch)}
                                        size="small"
                                    />
                                ))}
                                {selectedBatches.length > 8 && <Chip label={`+${selectedBatches.length - 8} more`} size="small" />}
                            </Stack>
                        )}

                        <Grid container spacing={1.25}>
                            {filteredBatches.map((batch) => {
                                const selected = selectedBatches.some((item) => item._id === batch._id);
                                return (
                                    <Grid item xs={12} md={6} key={batch._id}>
                                        <Card variant="outlined" sx={{ borderColor: selected ? "success.main" : "divider", bgcolor: selected ? "#f0fbf3" : "#fff" }}>
                                            <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: 1.25, "&:last-child": { pb: 1.25 } }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 850 }}>{batch.batchName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Batch ID: {batch.batchId || "-"}
                                                    </Typography>
                                                </Box>
                                                <Checkbox checked={selected} onChange={() => handleCheckboxChange(batch)} />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {!filteredBatches.length && (
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                No batches match this search.
                            </Typography>
                        )}

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                            <TablePagination
                                rowsPerPageOptions={[12, 24, 48]}
                                component="div"
                                count={totalBatch}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    sx={{ px: 4, py: 1.1, fontWeight: 850 }}
                >
                    {isLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={18} color="inherit" />
                            <span>Creating...</span>
                        </Stack>
                    ) : (
                        "Create School Admin"
                    )}
                </Button>
            </Box>

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
        </Box>
    );
};

export default CreateSchoolAdmin;
