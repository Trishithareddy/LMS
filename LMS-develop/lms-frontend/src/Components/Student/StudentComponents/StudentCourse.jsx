import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";

export async function fetchStudentProfile() {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/student/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return data?.student;
}

export async function calcCourseProgress(studentId, courseId, batchId = "") {
    const token = localStorage.getItem("token");

    try {
        if (batchId) {
            const releasedResp = await axios.get(
                `${import.meta.env.VITE_API_URL}/progress/student-courses/${studentId}/${courseId}/released`,
                {
                    params: { batchId },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            return releasedResp?.data?.progress ?? 0;
        }

        const utsResp = await axios.get(
            `${import.meta.env.VITE_API_URL}/progress/student-courses/${studentId}/${courseId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const courseUTS = utsResp?.data?.courseUTS ?? 0;

        const courseResp = await axios.get(
            `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const expected = courseResp?.data?.courseExpectedtime;

        if (expected === 0 || expected == null) return 0;

        return Math.min(Math.round((courseUTS / expected) * 100), 100);
    } catch (err) {
        if (err?.response?.status !== 404) {
            console.error("Progress calc error", err);
        }
        return 0;
    }
}

const getCourseStatus = (progress) => {
    if (progress >= 100) return "completed";
    if (progress > 0) return "progress";
    return "not-started";
};

const getActionLabel = (progress) => {
    if (progress >= 100) return "Review";
    if (progress > 0) return "Continue";
    return "Start Course";
};

const StatCard = ({ label, value, icon }) => (
    <Box
        sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            minHeight: 96,
        }}
    >
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
        >
            <Box sx={{ color: "success.main" }}>
                {icon}
            </Box>

            <Typography
                variant="h3"
                fontWeight={900}
                color="text.primary"
            >
                {value}
            </Typography>
        </Stack>

        <Typography
            sx={{
                mt: 1,
                color: "text.secondary",
                fontWeight: 700,
            }}
        >
            {label}
        </Typography>
    </Box>
);

function StudentCourse() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [data, setData] = useState(null);
    const [loadingPage, setLoadingPage] = useState(true);
    const [courseProgress, setCourseProgress] = useState({});
    const [accessSummary, setAccessSummary] = useState({});
    const [courseAccessLoadingId, setCourseAccessLoadingId] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("az");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const theme = useTheme();
    const dark = theme.palette.mode === "dark";

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Courses", path: "/student-dashboard/courses" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingPage(true);
                const studentData = await fetchStudentProfile();
                setData(studentData);

                if (studentData?._id && studentData?.batches) {
                    await Promise.all([
                        calculateAllCoursesProgress(studentData, studentData._id),
                        calculateCourseAccess(studentData),
                    ]);
                }
            } catch (err) {
                console.error("Error fetching student courses:", err);
            } finally {
                setLoadingPage(false);
            }
        };

        fetchData();
    }, []);

    const calculateAllCoursesProgress = async (studentData, studentId) => {
        const progressPromises = [];

        (studentData.batches || []).forEach((batch) => {
            (batch.courses || []).forEach((course) => {
                progressPromises.push(
                    calcCourseProgress(studentId, course._id, batch._id).then((progress) => ({
                        courseId: `${batch._id}-${course._id}`,
                        progress,
                    }))
                );
            });
        });

        try {
            const progressResults = await Promise.all(progressPromises);
            const nextProgress = {};
            progressResults.forEach(({ courseId, progress }) => {
                nextProgress[courseId] = progress;
            });
            setCourseProgress(nextProgress);
        } catch (error) {
            console.error("Error calculating course progress:", error);
        }
    };

    const calculateCourseAccess = async (studentData) => {
        const accessRequests = [];

        (studentData.batches || []).forEach((batch) => {
            (batch.courses || []).forEach((course) => {
                accessRequests.push(
                    axios
                        .get(`${import.meta.env.VITE_API_URL}/chapters/batch-access-map`, {
                            params: {
                                batchId: batch._id,
                                courseId: course._id,
                            },
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                        .then((response) => {
                            const accessMap = response.data?.accessMap || {};
                            const chapterIds = (course.chapters || []).map((chapter) =>
                                String(chapter?._id || chapter)
                            );
                            const hasExplicitAccess = Object.keys(accessMap).length > 0;
                            const availableCount = hasExplicitAccess
                                ? chapterIds.filter((id) => accessMap[id]?.chapterEnabled).length
                                : chapterIds.length;

                            return {
                                key: `${batch._id}-${course._id}`,
                                totalChapters: chapterIds.length,
                                availableChapters: availableCount,
                                hasExplicitAccess,
                            };
                        })
                        .catch(() => ({
                            key: `${batch._id}-${course._id}`,
                            totalChapters: (course.chapters || []).length,
                            availableChapters: (course.chapters || []).length,
                            hasExplicitAccess: false,
                        }))
                );
            });
        });

        const results = await Promise.all(accessRequests);
        const nextSummary = {};
        results.forEach((item) => {
            nextSummary[item.key] = item;
        });
        setAccessSummary(nextSummary);
    };

    const courseCards = useMemo(() => {
        const cards = [];

        (data?.batches || []).forEach((batch) => {
            (batch.courses || []).forEach((course) => {
                const key = `${batch._id}-${course._id}`;
                const progress = Number(courseProgress[key] || 0);
                const access = accessSummary[key] || {
                    totalChapters: (course.chapters || []).length,
                    availableChapters: (course.chapters || []).length,
                };

                cards.push({
                    key,
                    batchId: batch._id,
                    batchName: batch.batchName || "Batch",
                    course,
                    progress,
                    status: getCourseStatus(progress),
                    access,
                });
            });
        });

        return cards;
    }, [accessSummary, courseProgress, data?.batches]);

    const stats = useMemo(() => {
        const total = courseCards.length;
        const completed = courseCards.filter((item) => item.status === "completed").length;
        const inProgress = courseCards.filter((item) => item.status === "progress").length;
        const notStarted = courseCards.filter((item) => item.status === "not-started").length;

        return {
            total,
            completed,
            inProgress,
            notStarted,
        };
    }, [courseCards]);

    const filteredCourses = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = courseCards.filter((item) => {
            const searchable = `${item.course.name || ""} ${item.batchName}`.toLowerCase();
            const matchesSearch = !query || searchable.includes(query);
            const matchesFilter = filter === "all" || item.status === filter;

            return matchesSearch && matchesFilter;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === "progress-high") return b.progress - a.progress;
            if (sortBy === "progress-low") return a.progress - b.progress;
            if (sortBy === "batch") return a.batchName.localeCompare(b.batchName);
            return String(a.course.name || "").localeCompare(String(b.course.name || ""));
        });
    }, [courseCards, filter, search, sortBy]);

    const handleViewChapter = async (courseId, courseName, batchId, batchName) => {
        setCourseAccessLoadingId(courseId);

        try {
            const courseResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const chapterIds = courseResponse.data?.chapters || [];

            if (!chapterIds.length) return;

            const chapterRequests = chapterIds.map((id) =>
                axios.get(`${import.meta.env.VITE_API_URL}/chapters/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            );
            const chapterResponses = await Promise.all(chapterRequests);

            const chapters = {};
            chapterResponses.forEach((response) => {
                const chapter = response.data;
                chapters[chapter._id] = chapter;
            });

            const accessResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/chapters/batch-access-map`,
                {
                    params: {
                        batchId,
                        courseId,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const chapterAccessMap = accessResponse.data?.accessMap || {};
            const hasExplicitAccess = Object.keys(chapterAccessMap).length > 0;
            const firstEnabledChapterId = hasExplicitAccess
                ? chapterIds.find((id) => chapterAccessMap[String(id)]?.chapterEnabled)
                : chapterIds[0];

            if (!firstEnabledChapterId) return;

            navigate("/my-learning", {
                state: {
                    chapterDetails: chapters,
                    chapterAccessMap,
                    studentNameSent: data?.name,
                    chapterIdSent: firstEnabledChapterId,
                    batchName,
                    batchId,
                    courseId,
                    courseName,
                    from: "course",
                },
            });
        } catch (error) {
            console.error("Error fetching course or chapter details:", error);
        } finally {
            setCourseAccessLoadingId("");
        }
    };

    if (loadingPage) {
        return (
            <Box
                sx={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box
                sx={{
                    mb: 3,
                    p: { xs: 2.25, md: 3 },
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: 2,
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography sx={{ color: "#15803d", fontWeight: 900, fontSize: 13 }}>
                            Student Courses
                        </Typography>
                        <Typography sx={{ mt: 0.75, fontSize: { xs: 30, md: 38 }, fontWeight: 900, color: "text.primary" }}>
                            My Courses
                        </Typography>
                        <Typography sx={{ mt: 0.75, color: "text.secondary", maxWidth: 620, lineHeight: 1.6 }}>
                            Continue learning from your assigned batches, track progress, and see what your teacher has opened.
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => navigate("/student-dashboard")}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                        Dashboard
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        icon={<AutoStoriesOutlinedIcon />}
                        label="Total Courses"
                        value={stats.total}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        icon={<PlayCircleOutlineOutlinedIcon />}
                        label="In Progress"
                        value={stats.inProgress}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        icon={<CheckCircleOutlineOutlinedIcon />}
                        label="Completed"
                        value={stats.completed}
                    />

                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        icon={<AccessTimeOutlinedIcon />}
                        label="Not Started"
                        value={stats.notStarted}
                    />
                </Grid>
            </Grid>

            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    gap: 2,
                    alignItems: { xs: "stretch", lg: "center" },
                    justifyContent: "space-between",
                    flexDirection: { xs: "column", lg: "row" },
                }}
            >
                <TextField
                    placeholder="Search by course or batch..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    sx={{
                        maxWidth: { lg: 520 }, bgcolor: "background.paper",

                        "& .MuiOutlinedInput-root": {
                            bgcolor: "background.paper"
                        }
                    }}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "#9ca3af" }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <ToggleButtonGroup
                        value={filter}
                        exclusive
                        onChange={(_, nextFilter) => {
                            if (nextFilter) setFilter(nextFilter);
                        }}
                        size="small"
                        sx={{
                            flexWrap: "wrap",
                            gap: 1,
                            "& .MuiToggleButton-root": {
                                borderRadius: "999px !important",
                                border: "1px solid rgba(15, 23, 42, 0.10) !important",
                                px: 2,
                                textTransform: "none",
                                fontWeight: 700,
                                bgcolor: "background.paper",
                                color: "text.primary",

                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText"
                                }
                            },
                        }}
                    >
                        <ToggleButton value="all">All</ToggleButton>
                        <ToggleButton value="progress">In Progress</ToggleButton>
                        <ToggleButton value="completed">Completed</ToggleButton>
                        <ToggleButton value="not-started">Not Started</ToggleButton>
                    </ToggleButtonGroup>

                    <Select
                        size="small"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        startAdornment={<SortOutlinedIcon sx={{ color: "#6b7280", mr: 1 }} />}
                        sx={{
                            minWidth: 190, bgcolor: "background.paper",
                            color: "text.primary"
                        }}
                    >
                        <MenuItem value="az">A-Z</MenuItem>
                        <MenuItem value="batch">Batch</MenuItem>
                        <MenuItem value="progress-high">Progress: High to Low</MenuItem>
                        <MenuItem value="progress-low">Progress: Low to High</MenuItem>
                    </Select>
                </Stack>
            </Box>

            {filteredCourses.length ? (
                <Grid container spacing={2.5}>
                    {filteredCourses.map(({ key, batchId, batchName, course, progress, access }) => {
                        const waitingForTeacher = access.totalChapters > 0 && access.availableChapters === 0;
                        const noChapters = access.totalChapters === 0;
                        const disabled = waitingForTeacher || noChapters || courseAccessLoadingId === course._id;

                        return (
                            <Grid item xs={12} md={6} xl={4} key={key}>
                                <Card
                                    sx={{
                                        height: "100%",
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: "divider",
                                        bgcolor: "background.paper",
                                        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: 150,
                                            backgroundImage: `url(${course.imageUrl || "/CourseImage.png"})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }}
                                    />
                                    <CardContent sx={{ p: 2.25 }}>
                                        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                                            <Chip size="small" label={batchName} color="success" variant="outlined" />
                                            <Chip
                                                size="small"
                                                label={
                                                    noChapters
                                                        ? "No chapters"
                                                        : waitingForTeacher
                                                            ? "Waiting for teacher"
                                                            : `${access.availableChapters}/${access.totalChapters} chapters open`
                                                }
                                                color={waitingForTeacher ? "warning" : "default"}
                                                icon={waitingForTeacher ? <LockOutlinedIcon /> : undefined}
                                            />
                                        </Stack>

                                        <Typography sx={{ fontSize: 20, fontWeight: 900, color: "text.primary", minHeight: 54 }}>
                                            {course.name || "Course"}
                                        </Typography>

                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5, mb: 1 }}>
                                            <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>
                                                Progress
                                            </Typography>
                                            <Typography sx={{ color: "text.primary", fontWeight: 900 }}>
                                                {progress}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                height: 9,
                                                borderRadius: 8,
                                                backgroundColor: dark
                                                    ? theme.palette.grey[800]
                                                    : theme.palette.grey[300],
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 8,
                                                    backgroundColor: progress >= 100 ? "#16a34a" : "#2563eb",
                                                },
                                            }}
                                        />
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            disabled={disabled}
                                            onClick={() =>
                                                handleViewChapter(
                                                    course._id,
                                                    course.name,
                                                    batchId,
                                                    batchName
                                                )
                                            }
                                            sx={{ mt: 2, py: 1, textTransform: "none", fontWeight: 900 }}
                                        >
                                            {courseAccessLoadingId === course._id
                                                ? "Opening..."
                                                : waitingForTeacher
                                                    ? "Waiting for Teacher"
                                                    : noChapters
                                                        ? "No Chapters"
                                                        : getActionLabel(progress)}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box
                    sx={{
                        p: 4,
                        borderRadius: 1,
                        border: "1px dashed rgba(15, 23, 42, 0.18)",
                        bgcolor: "background.paper",
                        textAlign: "center",
                    }}
                >
                    <AutoStoriesOutlinedIcon sx={{ fontSize: 42, color: "text.secondary", mb: 1 }} />
                    <Typography sx={{ fontSize: 22, fontWeight: 900, color: "text.primary" }}>
                        No courses found
                    </Typography>
                    <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                        Try another search or filter. If no courses are assigned, ask your teacher or school admin to add you to a batch.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default StudentCourse;
