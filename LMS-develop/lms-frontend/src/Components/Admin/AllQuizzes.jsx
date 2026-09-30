import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Search, Filter, BookOpen } from "lucide-react";
import QuizCard from "./QuizCard";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";

const AllQuestions = ({ experience = "formal" }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");
    const [batches, setBatches] = useState([]);
    const [batchFilter, setBatchFilter] = useState("all");

    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    const handleSnackbarClose = () => setOpenSnackbar(false);

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const fetchAllQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quiz/get-all-quizzes`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        status: statusFilter !== "all" ? statusFilter : undefined,
                        search: appliedSearch || undefined,
                        quizMode:
                            experience === "formal"
                                ? undefined
                                : "fun,revision",
                        assignedTo:
                            batchFilter !== "all" ? batchFilter : undefined,
                    },
                }
            );
            // console.log("Fetch Quizzes Response:", response.data);
            setQuizzes(response.data?.data?.quizzes || []);
            setTotalItems(response.data?.data?.pagination?.totalItems || 0);

            // showSnackbar("Quizzes fetched successfully");
        } catch (error) {
            console.error("Error fetching Questions:", error);
            showSnackbar("Error while fetching quizzes", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllQuizzes();
    }, [page, rowsPerPage, appliedSearch, statusFilter, batchFilter]);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/quiz/get-batch-for-quiz`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                setBatches(response.data?.teacherBatches || []);
            } catch (error) {
                console.error("Error fetching quiz batches:", error);
            }
        };

        fetchBatches();
    }, []);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            setAppliedSearch(searchTerm.trim());
            setPage(0);
        }
    };

    const handleSearchClick = () => {
        setAppliedSearch(searchTerm.trim());
        setPage(0);
    };

    const statusCounts = useMemo(
        () =>
            quizzes.reduce(
                (accumulator, quiz) => {
                    const key = quiz.status || "unknown";
                    accumulator[key] = (accumulator[key] || 0) + 1;
                    return accumulator;
                },
                {
                    active: 0,
                    inactive: 0,
                    draft: 0,
                    scheduled: 0,
                    closed: 0,
                    archived: 0,
                },
            ),
        [quizzes],
    );

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px",
                    height: "90vh",
                    alignItems: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Typography variant="h4" gutterBottom align="center">
                {experience === "formal"
                    ? "Filter Quizzes"
                    : "Filter Practice Quizzes"}
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    flexWrap: {
                        xs: "wrap",
                        md: "nowrap",
                    },
                }}
            >
                {/* Search */}
                <TextField
                    sx={{
                        flex: 1,
                        minWidth: 350,
                    }}
                    placeholder="Search quizzes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="contained"
                    color="success"
                    sx={{
                        width: 140,
                        height: 56,
                        flexShrink: 0,
                    }}
                >
                    Search
                </Button>

                {/* Status */}
                <FormControl
                    sx={{
                        width: 220,
                        flexShrink: 0,
                    }}
                >
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="all">All ({quizzes.length})</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>

                {/* Batch */}
                <FormControl
                    sx={{
                        width: 220,
                        flexShrink: 0,
                    }}
                >
                    <Select
                        value={batchFilter}
                        onChange={(e) => {
                            setBatchFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <MenuItem value="all">All batches</MenuItem>

                        {batches.map((batch) => (
                            <MenuItem key={batch._id} value={batch._id}>
                                {batch.batchName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>


            <div>
                {quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-6">
                        {quizzes.map((quiz) => (
                            <QuizCard key={quiz._id} quiz={quiz} fetchAllQuiz={fetchAllQuizzes} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BookOpen
                            className="mx-auto mb-4"
                            style={{
                                color: "var(--mui-palette-text-secondary)",
                            }}
                        />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No quizzes found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30, 40]}
                    component="div"
                    count={totalItems}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
        </>
    );
};

export default AllQuestions;
