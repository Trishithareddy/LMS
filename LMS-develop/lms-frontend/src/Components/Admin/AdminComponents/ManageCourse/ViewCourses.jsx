import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
    CircularProgress,
    TablePagination
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

// Import components from ViewCoursesComponents folder
import Ebook from "./ViewCoursesComponents/Ebook";
import LessonSlides from "./ViewCoursesComponents/LessonsSlides";
import Practice from "./ViewCoursesComponents/Practice";
import Quiz from "./ViewCoursesComponents/Quiz";
import VideoLessons from "./ViewCoursesComponents/VideoLessons";
import WorksheetKeys from "./ViewCoursesComponents/WorksheetKeys";
import Resources from "./Resources";
import SkillTest from "./ViewCoursesComponents/SkillTest";

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

const ViewCourses = () => {
    const [courses, setCourses] = useState([]);
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [ebookUrl, setEbookUrl] = useState("");
    const [worksheetUrl, setWorksheetUrl] = useState("");
    const token = localStorage.getItem("token");
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    const [loading, setLoading] = useState(false);
    //video lesons
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [focusApplied, setFocusApplied] = useState(false);


    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "View Courses", path: "/admin-dashboard/view-courses" },
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

            // console.log("Fetched courses:", response.data);
            setCourses(response.data?.data || []);
            setTotalCount(response.data?.pagination?.totalDocuments || 0);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setErrorMessage("Error fetching courses");
        } finally {
            setLoading(false);
        }
    };

    const loadCourseDetails = async (courseId) => {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const chaptersWithDetails = await Promise.all(
            response.data.chapters.map(async (chapterId) => {
                const chapterResponse = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                return chapterResponse.data;
            })
        );
        return {
            ...response.data,
            chapters: chaptersWithDetails,
        };
    };

    const openCourseDetails = async (courseId) => {
        setLoading(true);
        try {
            const courseDetails = await loadCourseDetails(courseId);
            setSelectedCourse(courseDetails);
            setSelectedChapter(null);
            return courseDetails;
        } catch (error) {
            console.error("Error fetching course details:", error);
            setErrorMessage("Error fetching course details");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleViewCourse = async (course) => {
        if (selectedCourse && selectedCourse._id === course._id) {
            setSelectedCourse(null);
            setSelectedChapter(null);
        } else {
            await openCourseDetails(course._id);
        }
    };

    const handleViewChapter = async (chapterId, defaultTab = 0) => {
        if (!chapterId) {
            console.error("Invalid chapter ID:", chapterId);
            setErrorMessage("Error: Invalid chapter data");
            return;
        }

        if (selectedChapter && selectedChapter._id === chapterId) {
            setSelectedChapter(null);
            setEbookUrl("");
            setWorksheetUrl("");
        } else {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const getQuestionDetails = async () => {
                    if (response.data.lessons.length !== 0) {
                        // Iterate over each lesson in the lessons array
                        await Promise.all(
                            response.data.lessons.map(async (lesson) => {
                                if (lesson.slides.length !== 0) {
                                    // Iterate over each slide in the slides array for each lesson
                                    await Promise.all(
                                        lesson.slides.map(async (slide) => {
                                            if (slide.slideType === "Quiz") {
                                                try {
                                                    const token =
                                                        localStorage.getItem(
                                                            "token"
                                                        );
                                                    const response1 =
                                                        await axios.get(
                                                            `${import.meta.env
                                                                .VITE_API_URL
                                                            }/questionBase/get/questionDetails/${slide.selectedQuestion
                                                            }`,
                                                            {
                                                                headers: {
                                                                    Authorization: `Bearer ${token}`,
                                                                },
                                                            }
                                                        );

                                                    // Format dates
                                                    const dateConvertion = {
                                                        timeZone:
                                                            "Asia/Kolkata",
                                                        hour12: false,
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit",
                                                    };

                                                    const createdDate =
                                                        new Date(
                                                            response1.data.question.createdAt
                                                        );
                                                    const updatedDate =
                                                        new Date(
                                                            response1.data.question.updatedAt
                                                        );

                                                    response1.data.question.createdAt =
                                                        createdDate.toLocaleString(
                                                            "en-IN",
                                                            dateConvertion
                                                        );
                                                    response1.data.question.updatedAt =
                                                        updatedDate.toLocaleString(
                                                            "en-IN",
                                                            dateConvertion
                                                        );

                                                    // Modify the original slide object by adding quizDetails
                                                    slide.selectedQuestion =
                                                        response1.data.question;
                                                } catch (error) {
                                                    console.error(
                                                        `Failed to fetch quiz details for quizId ${slide.quiz}:`,
                                                        error
                                                    );
                                                }
                                            }
                                        })
                                    );
                                }
                            })
                        );
                    }
                };

                // Execute getQuizDetails to fetch details for each slide in all lessons
                await getQuestionDetails();

                setSelectedChapter(response.data);

                setSelectedTab(defaultTab);

                // Set the ebookUrl
                setEbookUrl(response.data.Ebook || "");

                setWorksheetUrl(response.data.worksheet || "");

                if (!response.data.Ebook) {
                    console.warn("No Ebook found in chapter data");
                }
                if (!response.data.worksheet) {
                    console.warn("No Worksheet found in chapter data");
                }
            } catch (error) {
                console.error("Error fetching chapter details:", error);
                setErrorMessage(
                    `Error fetching chapter details: ${error.response?.data?.message || error.message
                    }`
                );
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const focus = location.state;
        if (focusApplied || !focus?.focusChapterId) return;

        const openFocusedChapter = async () => {
            setFocusApplied(true);
            if (focus.focusCourseId) {
                await openCourseDetails(focus.focusCourseId);
            }
            await handleViewChapter(focus.focusChapterId, focus.focusTab === "ebook" ? 3 : 0);
        };

        openFocusedChapter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, focusApplied]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
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
        return (
            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                }}
            >
                <Grid
                    container
                    spacing={1.5}
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{ maxWidth: "720px" }}
                >
                    <Grid item xs={12} sm={3}>
                        <Select
                            value={currentField}
                            onChange={(e) => setCurrentField(e.target.value)}
                            fullWidth
                            size="small"
                        >
                                <MenuItem value="name">Name</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={9}>
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
                <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1.25 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            flexWrap: "wrap",
                            justifyContent: "flex-start",
                            maxWidth: "720px",
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
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
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
                            Course Catalog
                        </Typography>
                        <Typography color="text.secondary">
                            Inspect chapter coverage and open course content in one place.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => navigate("/admin-dashboard/update-Courses")}
                            sx={{ fontWeight: 800, minWidth: 140 }}
                        >
                            Manage Courses
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => navigate("/admin-dashboard/duplicate-course")}
                            sx={{ fontWeight: 800, minWidth: 120 }}
                        >
                            Duplicate
                        </Button>
                    </Stack>
                </Box>
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ mb: 2 }}
                >
                    <Chip label={`${totalCount} courses`} color="success" variant="outlined" size="small" />
                    <Chip
                        label={`${courses.reduce((sum, course) => sum + (course.chapters?.length || 0), 0)} chapters shown`}
                        variant="outlined"
                        size="small"
                    />
                </Stack>

                {renderSearchFields()}
                {location.state?.reason === "aira-indexing" && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        This chapter has an ebook for viewing, but AIRA cannot read it yet. Opened the affected chapter below; re-upload the ebook once from course management to rebuild the AIRA index.
                    </Alert>
                )}
                {selectedCourse && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #b9e2c5",
                            bgcolor: "#f2fbf5",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: { xs: "flex-start", md: "center" },
                                gap: 2,
                                flexDirection: { xs: "column", md: "row" },
                                mb: 1.5,
                            }}
                        >
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                    {selectedCourse.name}
                                </Typography>
                                <Typography color="text.secondary">
                                    Select a chapter to inspect lesson slides, ebook, video, resources, quiz, and skill test.
                                </Typography>
                            </Box>
                            <Chip
                                label={`${selectedCourse.chapters?.length || 0} chapters`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>
                        {selectedCourse.chapters?.length > 0 ? (
                            selectedCourse.chapters.map((chapter) => (
                                <Accordion key={chapter._id} disableGutters sx={{ mb: 1, borderRadius: 1, overflow: "hidden" }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography sx={{ fontWeight: 800 }}>
                                            {chapter.name}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {chapter.description && (
                                            <Typography paragraph color="text.secondary">
                                                {chapter.description}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Chip
                                                size="small"
                                                label={`${chapter.lessons?.length || 0} lessons`}
                                                variant="outlined"
                                            />
                                            <Button
                                                variant={
                                                    selectedChapter?._id === chapter._id
                                                        ? "contained"
                                                        : "outlined"
                                                }
                                                color="success"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleViewChapter(chapter._id)}
                                                sx={{ fontWeight: 800 }}
                                            >
                                                {selectedChapter?._id === chapter._id
                                                    ? "Hide Content"
                                                    : "View Content"}
                                            </Button>
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))
                        ) : (
                            <Typography>No chapters available for this course.</Typography>
                        )}
                    </Paper>
                )}
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
                        {courses.map((course) => {
                            const isSelected = selectedCourse?._id === course._id;
                            const chapterCount = course.chapters?.length || 0;
                            return (
                                <Grid item xs={12} md={6} lg={4} key={course._id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            height: "100%",
                                            p: 2,
                                            borderRadius: 2,
                                            border: isSelected
                                                ? "1px solid #17a34a"
                                                : "1px solid #dfe7e2",
                                            bgcolor: isSelected ? "#f0fbf4" : "#ffffff",
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
                                            <Chip size="small" label="Catalog" variant="outlined" />
                                            <Chip
                                                size="small"
                                                label={chapterCount ? "Ready to inspect" : "No chapters"}
                                                color={chapterCount ? "success" : "warning"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                        <Button
                                            fullWidth
                                            variant={ "contained" }
                                            color="success"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewCourse(course)}
                                            sx={{ mt: "auto", fontWeight: 800 }}
                                        >
                                            {isSelected ? "Hide Details" : "Open Course"}
                                        </Button>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
                {selectedChapter && (
                    <Paper
                        elevation={3}
                        sx={{
                            mt: 4,
                            p: 4,
                            bgcolor: "#f5f5f5",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Chapter: {selectedChapter.name}
                        </Typography>
                        <Box
                            sx={{ borderBottom: 1, borderColor: "divider" }}
                        >
                            <Tabs
                                value={selectedTab}
                                onChange={handleTabChange}
                                aria-label="chapter content tabs"
                                centered
                                indicatorColor="secondary"
                                textColor="secondary"
                            >
                                <Tab label="Lesson Slides" />
                                <Tab label="Video" />
                                <Tab label="Worksheet Keys" />

                                <Tab label="Ebook" />
                                <Tab label="Practice" />
                                <Tab label="Quiz" />
                                <Tab label="skilltest" />
                                <Link
                                    style={{
                                        textDecoration: "none",
                                        color: "black",
                                    }}
                                    to="/admin-dashboard/view-resources"
                                    state={{
                                        chapterId: selectedChapter._id,
                                    }}
                                >
                                    <Tab label="Resources" />
                                </Link>
                            </Tabs>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            {selectedTab === 0 && (
                                <LessonSlides
                                    lessonSlides={
                                        selectedChapter.lessons?.flatMap(
                                            (lesson) => lesson.slides
                                        ) || []
                                    }
                                />
                            )}
                            {selectedTab === 1 && (
                                <VideoLessons
                                    chapterId={selectedChapter._id}
                                />
                            )}
                            {selectedTab === 2 && (
                                <WorksheetKeys worksheet={worksheetUrl} />
                            )}
                            {selectedTab === 3 && (
                                <Ebook ebookUrl={ebookUrl} />
                            )}
                            {selectedTab === 4 && (
                                <Practice
                                    practiceContent={
                                        selectedChapter.practiceContent
                                    }
                                />
                            )}
                            {selectedTab === 5 && (
                                <Quiz chapterId={selectedChapter._id} />
                            )}
                            {selectedTab === 6 && (
                                <SkillTest
                                    chapterId={selectedChapter._id}
                                    courseId={selectedCourse._id}
                                />
                            )}
                        </Box>
                    </Paper>
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

        </Container>
    );
};

export default ViewCourses;
