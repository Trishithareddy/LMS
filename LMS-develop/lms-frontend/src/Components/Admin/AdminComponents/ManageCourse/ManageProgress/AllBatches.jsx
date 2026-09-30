import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
    Box,
    Button,
    Chip,
    Container,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    textAlign: "center",
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
}));

const CompactTableCell = styled(TableCell)({
    padding: "8px",
    textAlign: "center",
});

const AllBatches = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("batchName");
    const [currentInput, setCurrentInput] = useState("");
    const [page, setPage] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [timeInterval, setTimeInterval] = useState(5);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const batchesPerPage = 10;

    useEffect(() => {
        fetchBatches();
        fetchTimeInterval();
    }, []);

    const fetchTimeInterval = async () => {
    
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getTimeInterval`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setTimeInterval(response.data.data.timeInterval);
            }
        } catch (error) {
            console.error("Error fetching time interval:", error);
        } 
    };

    const handleUpdateTimeInterval = async () => {
        if (timeInterval < 5) {
            alert("Time interval must be at least 5 seconds");
            return;
        }

        setIsUpdating(true);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/updateTimeInterval`,
                { timeInterval },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert("Time interval updated successfully");
            }
        } catch (error) {
            console.error("Error updating time interval:", error);
            alert("Error updating time interval");
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getAllBatches`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBatches(response.data);
        } catch (error) {
            console.error("Error fetching batches:", error);
            setErrorMessage("Error fetching batches from the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if ((page + 1) * batchesPerPage < filteredBatches.length) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            setPage((prevPage) => prevPage - 1);
        }
    };

    const handleAddTag = (event) => {
        if (event.key === "Enter" && currentInput.trim() !== "") {
            setSearchTags((prev) => ({
                ...prev,
                [currentField]: [
                    ...(prev[currentField] || []),
                    currentInput.trim(),
                ],
            }));
            setCurrentInput("");
            setPage(0);
        }
    };

    const handleDeleteTag = (field, tagToDelete) => {
        setSearchTags((prev) => ({
            ...prev,
            [field]: prev[field].filter((tag) => tag !== tagToDelete),
        }));
        setPage(0);
    };

    const filteredBatches = useMemo(() => {
        return batches.filter((batch) => {
            return Object.entries(searchTags).every(([field, tags]) => {
                if (tags.length === 0) return true;
                const batchValue = batch[field] || "";
                return tags.some((tag) =>
                    batchValue
                        .toString()
                        .toLowerCase()
                        .includes(tag.toLowerCase())
                );
            });
        });
    }, [batches, searchTags]);

    const paginatedBatches = useMemo(() => {
        const startIndex = page * batchesPerPage;
        return filteredBatches.slice(startIndex, startIndex + batchesPerPage);
    }, [filteredBatches, page]);

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>

                <Paper
                    elevation={3}
                    sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            mb: 3,
                        }}
                    >
                        {/* Center-aligned title */}
                        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
                            All Batches
                        </Typography>

                        {/* Absolute positioned time interval controls */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <TextField
                                label="Time Interval (seconds)"
                                type="number"
                                value={timeInterval}
                                onChange={(e) =>
                                    setTimeInterval(Number(e.target.value))
                                }
                                size="small"
                                InputProps={{ inputProps: { min: 5 } }}
                                sx={{ width: "150px" }}
                            />
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleUpdateTimeInterval}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Updating..." : "Update"}
                            </Button>
                        </Box>
                    </Box>

                    {/* Search Bar */}
                    <Box
                        sx={{
                            mb: 2,
                            display: "flex",
                            justifyContent: "center",
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
                                    value={currentField}
                                    onChange={(e) =>
                                        setCurrentField(e.target.value)
                                    }
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="batchName">Name</MenuItem>
                                    <MenuItem value="batchId">ID</MenuItem>
                                </Select>
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    label={`Search by ${currentField}`}
                                    variant="outlined"
                                    value={currentInput}
                                    onChange={(e) =>
                                        setCurrentInput(e.target.value)
                                    }
                                    onKeyPress={handleAddTag}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Search Tags */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 2,
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                flexWrap: "wrap",
                                justifyContent: "center",
                                maxWidth: "600px",
                            }}
                        >
                            {Object.entries(searchTags).map(([field, tags]) =>
                                tags.map((tag) => (
                                    <Chip
                                        key={`${field}-${tag}`}
                                        label={`${field}: ${tag}`}
                                        onDelete={() =>
                                            handleDeleteTag(field, tag)
                                        }
                                        sx={{ mb: 1 }}
                                    />
                                ))
                            )}
                        </Stack>
                    </Box>
                    {loading ? (
                   <Box
                       sx={{
                           display: "flex",
                           justifyContent: "center",
                           padding: "20px",
                       }}
                   >
                       <CircularProgress />
                   </Box>
            ) : (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>
                                        Batch Name
                                    </StyledTableCell>
                                    <StyledTableCell>Batch ID</StyledTableCell>
                                    <StyledTableCell>Actions</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedBatches.map((batch) => (
                                    <StyledTableRow key={batch.batchId}>
                                        <CompactTableCell>
                                            {batch.batchName}
                                        </CompactTableCell>
                                        <CompactTableCell>
                                            {batch.batchId}
                                        </CompactTableCell>
                                        <CompactTableCell>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => {
                                                    navigate(
                                                        `/admin-dashboard/coursesWithinBatch/${batch._id}`,
                                                        {
                                                            state: {
                                                                batchName:
                                                                    batch.batchName,
                                                            },
                                                        }
                                                    );
                                                }}
                                            >
                                                Go
                                            </Button>
                                        </CompactTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
)}
                    {/* Pagination Controls */}
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        mt={3}
                    >
                        <IconButton
                            onClick={handlePreviousPage}
                            disabled={page === 0}
                        >
                            <ArrowBackIosNewIcon />
                        </IconButton>
                        <Typography variant="body1" sx={{ mx: 2 }}>
                            Page {page + 1} of{" "}
                            {Math.ceil(filteredBatches.length / batchesPerPage)}
                        </Typography>
                        <IconButton
                            onClick={handleNextPage}
                            disabled={
                                (page + 1) * batchesPerPage >=
                                filteredBatches.length
                            }
                        >
                            <ArrowForwardIosIcon />
                        </IconButton>
                    </Box>
                </Paper>
           
        </Container>
    );
};

export default AllBatches;
