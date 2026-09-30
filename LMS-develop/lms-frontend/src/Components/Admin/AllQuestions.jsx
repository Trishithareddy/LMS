import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Paper,
    TablePagination,
    Button,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
    Select,
    Grid,
    Stack,
    MenuItem,
    TextField,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
    Divider,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const AllQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("questionId");
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveFilters, setHasActiveFilters] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const navigate = useNavigate();

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
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

    const checkForActiveFilters = (tags) => {
        return Object.values(tags).some(
            (value) =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                (!Array.isArray(value) || value.length > 0)
        );
    };

    const fetchAllFilteredQuestions = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/filter/questionBases`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: searchTags,
                }
            );
            console.log("response.data ",response.data)
            setQuestions(response.data);
            showSnackbar("Filtered Questions loaded successfully");

        } catch (error) {
            console.error("Error fetching filtered Questions:", error);
            showSnackbar("Error fetching filtered Questions", "error");

        } finally {
            setIsLoading(false);
        }
    };

    const ViewQuestionDetails = (id) => {
        navigate("/admin-dashboard/complete-question", {
            state: {
                questionId: id,
            },
        });
    };

    const EditQuestionDetails = (id) => {
        navigate("/admin-dashboard/edit-question", {
            state: {
                questionId: id,
            },
        });
    };

    const fetchAllQuestions = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/questionBase/get/allQuestions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("res",response.data.questions)
            setQuestions(response.data.questions);
            showSnackbar("Questions loaded successfully");
        } catch (error) {
            console.error("Error fetching Questions:", error);
            showSnackbar("Error fetching questions", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const hasFilters = checkForActiveFilters(searchTags);
        setHasActiveFilters(hasFilters);

        if (hasFilters) {
            fetchAllFilteredQuestions();
        } else {
            fetchAllQuestions();
        }
    }, [searchTags]);

    const handleDeleteClick = (id) => {
       
        setSelectedQuestionId(id);
        setOpenDialog(true); // Open the confirmation dialog
    };

    const handleConfirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/delete/question/${selectedQuestionId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setQuestions(questions.filter((q) => q._id !== selectedQuestionId));
            setOpenDialog(false); // Close the dialog
           
            showSnackbar("Question deleted successfully");
        } catch (error) {
            console.error("Error deleting question:", error);
            showSnackbar("Failed to delete question", "error");
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false); // Close the dialog without deleting
    };

    const chapterGroups = useMemo(() => {
        const groups = new Map();

        questions.forEach((question) => {
            const groupKey = [
                question.courseName || "Unknown course",
                question.chapterName || "Unknown chapter",
                question.gradeName || "No grade",
            ].join("::");

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    key: groupKey,
                    courseName: question.courseName || "Unknown course",
                    chapterName: question.chapterName || "Unknown chapter",
                    gradeName: question.gradeName || "-",
                    questions: [],
                    typeCounts: {},
                });
            }

            const group = groups.get(groupKey);
            group.questions.push(question);
            const type = question.questionType || "Question";
            group.typeCounts[type] = (group.typeCounts[type] || 0) + 1;
        });

        return Array.from(groups.values()).sort((a, b) =>
            `${a.courseName} ${a.chapterName}`.localeCompare(
                `${b.courseName} ${b.chapterName}`
            )
        );
    }, [questions]);

    const paginatedChapterGroups = chapterGroups.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <>
            <Typography variant="h4" gutterBottom align="center">
                Question Base
            </Typography>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
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
                            <MenuItem value="questionId">Question Id</MenuItem>
                            <MenuItem value="questionType">
                                Question Type
                            </MenuItem>
                            <MenuItem value="questionTitle">
                                Question Title
                            </MenuItem>
                            <MenuItem value="gradeName">Grade</MenuItem>
                            <MenuItem value="courseName">
                                Course Name
                            </MenuItem>
                            <MenuItem value="chapterName">
                                Chapter Name
                            </MenuItem>
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
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
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
                                sx={{ mb: 1 }}
                            />
                        ))
                    )}
                </Stack>
            </Box>

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
                <Grid container spacing={2}>
                    {paginatedChapterGroups.map((chapter) => (
                            <Grid item xs={12} md={6} xl={4} key={chapter.key}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        height: "100%",
                                        p: 2,
                                        borderRadius: 2,
                                        borderColor: "#d7eadc",
                                        backgroundColor: "#fbfefc",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.4,
                                        "&:hover": {
                                            borderColor: "#49ad5b",
                                            boxShadow: "0 8px 22px rgba(15, 118, 56, 0.12)",
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        spacing={1.5}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                                                <Chip size="small" label={`${chapter.questions.length} questions`} color="success" />
                                                {chapter.gradeName && <Chip size="small" label={chapter.gradeName} />}
                                            </Stack>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 900,
                                                    lineHeight: 1.25,
                                                    overflow: "hidden",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                {chapter.chapterName}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider />

                                    <Stack spacing={0.75} sx={{ flexGrow: 1 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                                Course
                                            </Typography>
                                            <Typography sx={{ fontWeight: 700 }}>
                                                {chapter.courseName}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                                Question Mix
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                                                {Object.entries(chapter.typeCounts).map(([type, count]) => (
                                                    <Chip
                                                        key={type}
                                                        size="small"
                                                        label={`${type}: ${count}`}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Accordion
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            border: "1px solid #e4ece6",
                                            borderRadius: "8px !important",
                                            overflow: "hidden",
                                            "&::before": { display: "none" },
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography sx={{ fontWeight: 900 }}>
                                                Manage Questions
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails
                                            sx={{
                                                pt: 0,
                                                maxHeight: 360,
                                                overflowY: "auto",
                                            }}
                                        >
                                            <Stack spacing={1}>
                                                {chapter.questions.map((question) => (
                                                    <Paper
                                                        key={question._id || question.questionId}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.25,
                                                            borderRadius: 1.5,
                                                            backgroundColor: "#fff",
                                                        }}
                                                    >
                                                        <Stack spacing={1}>
                                                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                                                <Chip size="small" label={`ID ${question.questionId || "-"}`} variant="outlined" />
                                                                <Chip size="small" label={question.questionType || "Question"} />
                                                            </Stack>
                                                            <Tooltip title={question.questionTitle || ""} placement="top">
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 800,
                                                                        overflow: "hidden",
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: "vertical",
                                                                    }}
                                                                >
                                                                    {question.questionTitle || "Untitled question"}
                                                                </Typography>
                                                            </Tooltip>
                                                            <Stack direction="row" spacing={1}>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    startIcon={<VisibilityIcon />}
                                                                    onClick={() => ViewQuestionDetails(question._id)}
                                                                    sx={{ fontWeight: 900 }}
                                                                >
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<EditIcon />}
                                                                    onClick={() => EditQuestionDetails(question._id)}
                                                                    sx={{ fontWeight: 900 }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    aria-label="Delete question"
                                                                    onClick={() => handleDeleteClick(question._id)}
                                                                    sx={{ minWidth: 40 }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </Button>
                                                            </Stack>
                                                        </Stack>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            </Grid>
                        ))}
                    {!chapterGroups.length && (
                        <Grid item xs={12}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: "center",
                                    borderRadius: 2,
                                    borderColor: "#d7eadc",
                                }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    No questions found
                                </Typography>
                                <Typography color="text.secondary">
                                    Try changing the filter or create a new question.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this question? This
                        action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30, 40]}
                    component="div"
                    count={chapterGroups.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </>
    );
};

export default AllQuestions;
