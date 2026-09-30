import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Container,
    Grid,
    IconButton,
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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Divider,
    TablePagination,

} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axios from "axios";
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

const DuplicateCourses = () => {
    const [courses, setCourses] = useState([]);
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem("token");
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            {
                name: "Duplicate Courses",
                path: "/admin-dashboard/duplicate-courses",
            },
        ]);
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [page, rowsPerPage, searchTags]);

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
        setIsLoading(true);
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
            setIsLoading(false);
        }
    };
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleDuplicateCourse = async () => {
        setIsLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL
                }/courses/duplicateCourse/${selectedCourseId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessMessage("Course duplicated successfully!");
            await fetchCourses(); // Refresh the courses list
            setOpenModal(false);
        } catch (error) {
            console.error("Error duplicating course:", error);
            setErrorMessage(
                "Error duplicating course: " +
                (error.response?.data?.message || error.message)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (courseId) => {
        setSelectedCourseId(courseId);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedCourseId(null);
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


    const renderSearchFields = () => {
        const fields = ["name", "description"];

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
                            {fields.map((field) => (
                                <MenuItem key={field} value={field}>
                                    {field}
                                </MenuItem>
                            ))}
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
                            Duplicate Course Templates
                        </Typography>
                        <Typography color="text.secondary">
                            Clone an existing course with its chapters and learning assets for reuse.
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
                        <Chip label={`${totalCount} source courses`} color="success" variant="outlined" />
                        <Chip label="Creates a separate copy" variant="outlined" />
                    </Stack>
                </Box>

                {renderSearchFields()}
                {isLoading ? (
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
                        {courses.map((course) => {
                            const chapterCount = course.chapters?.length || 0;
                            return (
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
                                                label={`${chapterCount} chapters`}
                                                sx={{ bgcolor: "#eef7f0", fontWeight: 700 }}
                                            />
                                        </Box>
                                        <Divider />
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip size="small" label="Course copy" variant="outlined" />
                                            <Chip
                                                size="small"
                                                label={chapterCount ? "Assets included" : "Empty course"}
                                                color={chapterCount ? "success" : "warning"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            startIcon={<ContentCopyIcon />}
                                            onClick={() => handleOpenModal(course._id)}
                                            sx={{ mt: "auto", fontWeight: 800 }}
                                        >
                                            Duplicate
                                        </Button>
                                    </Paper>
                                </Grid>
                            );
                        })}
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

            {/* Confirmation Modal */}
            <Dialog open={openModal} onClose={handleCloseModal}>
                <DialogTitle>Confirm Duplication</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to duplicate this course?
                    </Typography>
                    {isLoading && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                mt: 2,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={isLoading}>
                        No
                    </Button>
                    <Button
                        onClick={handleDuplicateCourse}
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                        startIcon={
                            isLoading ? <CircularProgress size={20} /> : null
                        }
                    >
                        {isLoading ? "Duplicating..." : "Yes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Snackbar */}
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={() => setErrorMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setErrorMessage("")}
                    severity="error"
                    sx={{ width: "100%" }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DuplicateCourses;
