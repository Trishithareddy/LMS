import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
    Alert,
    Button,
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    TablePagination,
    Select,
    MenuItem,
    TextField,
    Grid,
    Stack,
    Chip,
    Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

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

const CompactTableCell = styled(TableCell)({
    padding: "8px",
    textAlign: "center",
});

const UpdateCourses = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [courses, setCourses] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    useEffect(() => {
        fetchCourses();
    }, [page, rowsPerPage, searchTags]);
    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Update Courses", path: "/admin-dashboard/update-courses" },
        ]);
    }, []);

    const buildQueryString = (params) => {
        const searchParams = new URLSearchParams();
        for (const key in params) {
            if (params[key].length > 0) {
                searchParams.set(key, params[key].join(","));
            }
        }
        return searchParams.toString();
    };
    const fetchCourses = async () => {
        setLoading(true);
        const query = buildQueryString(searchTags);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/getAllCourses?page=${page + 1
                }&limit=${rowsPerPage}&${query}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("Fetched courses:", response.data);
            setCourses(response.data?.data || []);
            setTotalCount(response.data?.pagination?.totalDocuments || 0);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setErrorMessage("Error fetching courses");
        } finally {
            setLoading(false);
        }
    };
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    const handleEdit = async (courseId) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate("/admin-dashboard/edit-course", {
                state: { courseId: courseId, courseData: response.data },
            });
        } catch (error) {
            console.error("Error fetching course details:", error);
            setErrorMessage("Error fetching course details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrompt = (course) => {
        setCourseToDelete(course);
        setOpenDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (courseToDelete) {
            setLoading(true);
            try {
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/courses/deleteCourse/${courseToDelete._id
                    }`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccessMessage(
                    `Course "${courseToDelete.name}" deleted successfully`
                );
                fetchCourses(); // Refresh the course list
            } catch (error) {
                console.error("Error deleting course:", error);
                setErrorMessage(
                    `Error deleting course: ${error.response?.data?.message || error.message
                    }`
                );
            } finally {
                setLoading(false);
            }
        }
        setOpenDialog(false);
        setCourseToDelete(null);
    };

    const handleDeleteCancel = () => {
        setOpenDialog(false);
        setCourseToDelete(null);
    };

    const renderSearchFields = () => {
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
                            value={currentField}
                            onChange={(e) => setCurrentField(e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="name">Name</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            label={`Search by ${currentField}`}
                            variant="outlined"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={handleAddTag}
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
                        {Object.entries(searchTags).map(([field, tags]) =>
                            tags.map((tag) => (
                                <Chip
                                    key={`${field}-${tag}`}
                                    label={`${field}: ${tag}`}
                                    onDelete={() => handleDeleteTag(field, tag)}
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
        }
    };

    const handleDeleteTag = (field, tagToDelete) => {
        setSearchTags((prev) => ({
            ...prev,
            [field]: prev[field].filter((tag) => tag !== tagToDelete),
        }));
    };
    return (
        <Container maxWidth="xl" sx={{ my: 3 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 3 },
                    bgcolor: "#ffffff",
                    borderRadius: 2,
                    border: "1px solid #dfe7e2",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        flexDirection: { xs: "column", md: "row" },
                        mb: 2,
                    }}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            Manage Courses
                        </Typography>
                        <Typography color="text.secondary">
                            Edit structure, update content, or remove courses from the catalog.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate("/admin-dashboard/view-Courses")}
                            sx={{ fontWeight: 800 }}
                        >
                            Back to Courses
                        </Button>
                        <Chip label={`${totalCount} courses`} color="success" variant="outlined" />
                        <Chip label="Edit and delete access" variant="outlined" />
                    </Stack>
                </Box>
                {renderSearchFields()}
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
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {courses.map((course) => (
                            <Grid item xs={12} md={6} lg={4} key={course._id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        p: 2,
                                        borderRadius: 2,
                                        border: "1px solid #dfe7e2",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.5,
                                    }}
                                >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                                        <Typography sx={{ fontWeight: 850, lineHeight: 1.25 }}>
                                            {course.name}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={`${course.chapters?.length || 0} chapters`}
                                            sx={{ bgcolor: "#eef7f0", fontWeight: 700 }}
                                        />
                                    </Box>
                                    <Divider />
                                    <Typography variant="body2" color="text.secondary">
                                        Open the course builder to manage chapters, lesson plans, ebooks, videos, resources, and activities.
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(course._id)}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeletePrompt(course)}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Delete
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[25, 50, 100]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>

            <Dialog
                open={openDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the course "
                        {courseToDelete?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDeleteCancel}
                        color="primary"
                        startIcon={<CancelIcon />}
                    >
                        No
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        autoFocus
                        startIcon={<CheckCircleIcon />}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!errorMessage || !!successMessage}
                autoHideDuration={6000}
                onClose={() => {
                    setErrorMessage("");
                    setSuccessMessage("");
                }}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => {
                        setErrorMessage("");
                        setSuccessMessage("");
                    }}
                    severity={errorMessage ? "error" : "success"}
                    sx={{ width: "100%" }}
                >
                    {errorMessage || successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default UpdateCourses;
