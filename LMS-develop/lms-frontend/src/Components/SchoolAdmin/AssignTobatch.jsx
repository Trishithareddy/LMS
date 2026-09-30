import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
    Alert,
    Box,
    Button,
    Container,
    FormControl,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    TablePagination,
    Chip,
    Grid,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AssignToBatch = () => {
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [page, setPage] = useState(0);
    const [searchTags, setSearchTags] = useState({});
    const [getAllBatches, setGetAllBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [getAllSchoolAdmin, setGetAllSchoolAdmin] = useState([]);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [currentField, setCurrentField] = useState("BatchName");
    const [currentInput, setCurrentInput] = useState("");
    const [totalBatch, setTotalBatch] = useState(0);
    const [selectedSchoolAdmin, setSelectedSchoolAdmin] = useState(null);

    const [batchSearchTags, setBatchSearchTags] = useState({});
    const [currentBatchField, setCurrentBatchField] = useState("batchName");
    const [currentBatchInput, setCurrentBatchInput] = useState("");

    const handleAddBatchTag = (event) => {
        if (event.key === "Enter" && event.target.value.trim() !== "") {
            setBatchSearchTags((prev) => ({
                ...prev,
                [currentBatchField]: [
                    ...(prev[currentBatchField] || []),
                    event.target.value.trim(),
                ],
            }));
            setCurrentBatchInput("");
        }
    };

    const handleDeleteBatchTag = (field, tagToDelete) => {
        setBatchSearchTags((prev) => ({
            ...prev,
            [field]: prev[field].filter((tag) => tag !== tagToDelete),
        }));
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const navigate = useNavigate();

    const ViewBatchDetails = (id) => {
        navigate("/teacher-dashboard/complete-batch", {
            state: {
                batchId: id,
            },
        });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage + 1);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCheckboxChange = (batch) => {
        if (selectedBatches.includes(batch)) {
            setSelectedBatches(
                selectedBatches.filter((every) => every._id !== batch._id)
            );
        } else {
            setSelectedBatches([...selectedBatches, batch]);
        }
    };

    useEffect(() => {
        fetchAllSchoolAdmin();
    }, []);
    
    // Fetch all batches
    useEffect(() => {
        const fetchAllBatches = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/school-admin/get-All-Batches?page=${page + 1}`,
                    {
                        params: {
                            ...batchSearchTags,
                            limit: rowsPerPage,
                        },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                
                setTotalBatch(response.data.totalBatches);
                setGetAllBatches(response.data.data);
            } catch (error) {
                console.error("Error fetching batches:", error);
            }
        };

        fetchAllBatches();
    }, [page, rowsPerPage, batchSearchTags]);

    // fetch all school admin
    const fetchAllSchoolAdmin = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/school-admin/getall-school-admin`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            setGetAllSchoolAdmin(response.data.schoolAdmins);
            setSnackbarMessage("School admin fetched successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
        } catch (error) {
            console.error("Error fetching school admin:", error);
            setSnackbarMessage(
                error.response?.data?.message || "Failed to fetch school admin"
            );
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };

    const handleSchoolAdminChange = async (event) => {
        setSelectedSchoolAdmin(event.target.value);
    };

   

    const handleSave = async () => {
        if (!selectedSchoolAdmin || selectedBatches.length === 0) {
            showSnackbar("Please select a School-Admin and at least one batch", "error");
            return; 
        }
        let batchData = {
            schoolAdminId: selectedSchoolAdmin?._id,
            batchIds: selectedBatches.map((batch) => batch._id),
        };

        
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/school-admin/add-batch-to-school-admin`,
                batchData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSnackbarMessage("Batch assigned successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
        } catch (error) {
            console.error("Error assigning batch:", error);

            setSnackbarMessage("Error occurred while assigning batch");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
        setSelectedBatches([]);
        setSelectedSchoolAdmin(null);
    };

    const renderBatchSearchFields = () => {
        const fields = ["batchName", "batchId"];

        return (
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ maxWidth: "600px" }}
                >
                    <Grid item xs={12} sm={4}>
                        <Select
                            value={currentBatchField}
                            onChange={(e) =>
                                setCurrentBatchField(e.target.value)
                            }
                            fullWidth
                            size="small"
                        >
                            {fields.map((field) => (
                                <MenuItem key={field} value={field}>
                                    {field}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            label={`Search by ${currentBatchField}`}
                            variant="outlined"
                            value={currentBatchInput}
                            onChange={(e) =>
                                setCurrentBatchInput(e.target.value)
                            }
                            onKeyPress={handleAddBatchTag}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            flexWrap: "wrap",
                            justifyContent: "center",
                            maxWidth: "600px",
                        }}
                    >
                        {Object.entries(batchSearchTags).map(([field, tags]) =>
                            tags.map((tag) => (
                                <Chip
                                    key={`${field}-${tag}`}
                                    label={`${field}: ${tag}`}
                                    onDelete={() =>
                                        handleDeleteBatchTag(field, tag)
                                    }
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                            ))
                        )}
                    </Stack>
                </Box>
            </Box>
        );
    };

    const filterBatches = (batches) => {
        return batches.filter((batch) => {
            return Object.entries(batchSearchTags).every(([field, tags]) => {
                if (tags.length === 0) return true;
                let batchValue = batch[field];
                batchValue = batchValue || "";
                return tags.some((tag) =>
                    batchValue
                        .toString()
                        .toLowerCase()
                        .includes(tag.toLowerCase())
                );
            });
        });
    };

    const filteredBatches = filterBatches(getAllBatches);
    return (
        <>
            <Container>
                <Container maxWidth="md">
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={6000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "center",
                        }}
                    >
                        <Alert
                            onClose={handleSnackbarClose}
                            severity={snackbarSeverity}
                            sx={{ width: "100%" }}
                            icon={
                                snackbarSeverity === "success" ? (
                                    <CheckCircleOutlineIcon fontSize="inherit" />
                                ) : undefined
                            }
                        >
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>

                    <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        textAlign="center"
                    >
                        Assign School-Admin To Batch
                    </Typography>
                    <Box display="flex" alignItems="center" mb={2}>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            required
                        >
                            <Autocomplete
                                options={getAllSchoolAdmin}
                                getOptionLabel={(option) => option.name}
                                value={selectedSchoolAdmin}
                                onChange={(event, newValue) =>
                                    setSelectedSchoolAdmin(newValue)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select School-Admin"
                                        required
                                    />
                                )}
                                isOptionEqualToValue={(option, value) =>
                                    option._id === value?._id
                                }
                            />
                        </FormControl>
                    </Box>
                </Container>
            </Container>

            <Typography variant="h4" gutterBottom align="center">
                Filter Batches
            </Typography>

            {renderBatchSearchFields()}

            <TableContainer component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "green" }}>
                            <TableCell sx={{ color: "white" }} align="center">
                                Select Batch
                            </TableCell>

                            <TableCell sx={{ color: "white" }} align="center">
                                Batch Name
                            </TableCell>

                            {/* <TableCell sx={{ color: "white" }} align="center">
                                View Batch
                            </TableCell> */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBatches.map((batch) => (
                            <TableRow key={batch._id}>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={selectedBatches.some(
                                            (b) => b._id === batch._id
                                        )}
                                        onChange={() =>
                                            handleCheckboxChange(batch)
                                        }
                                    />
                                </TableCell>

                                <TableCell align="center">
                                    {batch.batchName}
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[20,50]}
                    component="div"
                    count={totalBatch}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isLoading}
                    sx={{
                        backgroundColor: "green",
                        "&:hover": { backgroundColor: "darkgreen" },
                        padding: "6px 16px",
                        fontSize: "0.875rem",
                        cursor: isLoading ? "wait" : "pointer",
                    }}
                >
                    {isLoading ? "Wait..." : "Assign To Batch"}
                </Button>
            </Box>
        </>
    );
};

export default AssignToBatch;
