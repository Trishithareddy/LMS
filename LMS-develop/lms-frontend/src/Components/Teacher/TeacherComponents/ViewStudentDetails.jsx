import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { useTheme } from "@mui/material/styles";



const formatDateTime = (value) => {
    if (!value) return "Not available";
    try {
        return new Date(value).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return String(value);
    }
};

const formatMinutes = (value) => {
    const minutes = Math.round(Number(value || 0) / 60);
    if (!minutes) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const EmptyState = ({ title, subtitle }) => (
    <Box
        sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            border: 1,
            borderStyle: "dashed",
            borderColor: "divider",
        }}
    >
        <Typography sx={{ fontWeight: 800, color: "text.primary" }}>{title}</Typography>
        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 14 }}>{subtitle}</Typography>
    </Box>
);

const SectionCard = ({ title, subtitle, children, action }) => (
    <Card
        sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            height: "100%",
        }}
    >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: "text.primary" }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 14 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {action}
            </Stack>
            {children}
        </CardContent>
    </Card>
);

const InsightItem = ({ icon, title, meta, chip, children }) => (
    <Box
        sx={{
            p: 1.75,
            borderRadius: 2.5,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
        }}
    >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ mt: 0.2, color: "#2563eb" }}>{icon}</Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, color: "text.primary" }}>{title}</Typography>
                    {meta ? (
                        <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 13 }}>
                            {meta}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
            {chip}
        </Stack>
        {children ? <Box sx={{ mt: 1.25 }}>{children}</Box> : null}
    </Box>
);

const InfoRow = ({ icon, label, value }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ color: "text.secondary", mt: 0.2 }}>{icon}</Box>
        <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 15, color: "text.primary", fontWeight: 600 }}>
                {value || "Not available"}
            </Typography>
        </Box>
    </Stack>
);

const StatTile = ({ label, value, tint }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor:
                    theme.palette.mode === "dark"
                        ? theme.palette.background.paper
                        : tint,
                border: 1,
                borderColor: "divider",
                height: "100%",
            }}
        >
            <Typography
                sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    mt: 0.5,
                    fontSize: 30,
                    fontWeight: 800,
                    color: "text.primary",
                }}
            >
                {value}
            </Typography>
        </Box>
    );
};

const ViewStudentDetails = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const studentCode = location.state?.studentId || null;
    const studentObjectId = location.state?.studentObjectId || null;

    const [data, setData] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Students", path: "/teacher-dashboard/students" },
            {
                name: "Student Overview",
                path: "/teacher-dashboard/studentDetails",
            },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        if (!studentCode && !studentObjectId) {
            navigate("/teacher-dashboard/students");
            return;
        }

        const fetchStudentDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const selectedStudentId = studentCode || studentObjectId;
                const [detailsResponse, insightsResponse] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/teacher/viewStudent/${selectedStudentId}`,
                        { headers }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/teacher/studentInsights/${selectedStudentId}`,
                        { headers }
                    ),
                ]);
                setData(detailsResponse.data || null);
                setInsights(insightsResponse.data || null);
            } catch (error) {
                console.error("Error fetching student details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [studentCode, studentObjectId, navigate]);

    const initials = useMemo(() => {
        const name = String(data?.name || "").trim();
        if (!name) return "S";
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }, [data?.name]);

    const goToBatch = async (batchId) => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getBatchId/${batchId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            navigate("/teacher-dashboard/batchdetails", {
                state: {
                    _id: response.data._id,
                    from: "studentDetails",
                },
            });
        } catch (err) {
            console.error("Error fetching batch details:", err);
        }
    };

    const goToCourse = (courseId) => {
        const courseToNavigate = data?.courses?.find(
            (course) => String(course.courseId) === String(courseId)
        );

        if (courseToNavigate?._id) {
            navigate("/my-learning1", {
                state: {
                    courseIdSent: courseToNavigate._id,
                    from: "directCourse",
                },
            });
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "text.primary" }}>
                    Student details could not be loaded.
                </Typography>
            </Box>
        );
    }

    return (
        <Box p={{ xs: 2, md: 3 }}>
            <Box
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: 1,
                    borderColor: "divider",
                    background:
                        theme.palette.mode === "dark"
                            ? theme.palette.background.paper
                            : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                    p: { xs: 2.25, md: 3 },
                    boxShadow:
                        theme.palette.mode === "dark"
                            ? "none"
                            : "0 12px 32px rgba(15, 23, 42, 0.05)",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                backgroundColor: "#2563eb",
                                color: "#fff",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 26,
                                fontWeight: 800,
                            }}
                        >
                            {initials}
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: { xs: 30, md: 38 }, fontWeight: 800, color: "text.primary" }}>
                                {data.name || "Student"}
                            </Typography>
                            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 16 }}>
                                {data.username || "No username"} / {data.class || "-"} - {data.section || "-"}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                                <Chip label={`Student ID: ${data.studentId || "N/A"}`} size="small" />
                                <Chip label={data.school || "No school mapped"} size="small" color="info" variant="outlined" />
                            </Stack>
                        </Box>
                    </Stack>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                    >
                        Back
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile label="Batches" value={data?.batches?.length || 0} tint="#ecfdf3" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile label="Courses" value={data?.courses?.length || 0} tint="#eff6ff" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile label="Age" value={data.age || "-"} tint="#fff7ed" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatTile label="Contact" value={data.contact || "-"} tint="#faf5ff" />
                </Grid>
            </Grid>

            <Box
                sx={{
                    mb: 2.5,
                    borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, nextTab) => setActiveTab(nextTab)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        "& .MuiTab-root": {
                            textTransform: "none",
                            fontWeight: 800,
                            minHeight: 44,
                        },
                    }}
                >
                    <Tab value="overview" label="Overview" />
                    <Tab value="progress" label="Progress" />
                    <Tab value="submissions" label="Submissions" />
                    <Tab value="attendance" label="Attendance" />
                    <Tab value="followup" label="Follow-up" />
                </Tabs>
            </Box>

            {activeTab === "overview" && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} lg={5}>
                        <SectionCard
                            title="Student Information"
                            subtitle="A compact view of the learner's profile details."
                        >
                            <Stack spacing={2}>
                                <InfoRow icon={<BadgeOutlinedIcon fontSize="small" />} label="Student ID" value={data.studentId} />
                                <InfoRow icon={<PersonOutlineOutlinedIcon fontSize="small" />} label="Father's Name" value={data.fatherName} />
                                <InfoRow icon={<SchoolOutlinedIcon fontSize="small" />} label="School" value={data.school} />
                                <InfoRow icon={<CallOutlinedIcon fontSize="small" />} label="Contact" value={data.contact} />
                                <InfoRow icon={<LocationOnOutlinedIcon fontSize="small" />} label="Address" value={data.address} />
                                <InfoRow icon={<AccessTimeOutlinedIcon fontSize="small" />} label="Created At" value={formatDateTime(data.createdAt)} />
                                <InfoRow icon={<CalendarMonthOutlinedIcon fontSize="small" />} label="Updated At" value={formatDateTime(data.updatedAt)} />
                            </Stack>
                        </SectionCard>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <SectionCard
                            title="Academic Mapping"
                            subtitle="These are the active batches and courses connected to this student."
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: "text.primary", mb: 1.25 }}>
                                        Linked Batches
                                    </Typography>
                                    <Stack spacing={1}>
                                        {data?.batches?.length ? (
                                            data.batches.map((batch) => (
                                                <Box
                                                    key={batch.batchId}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        bgcolor: "background.paper",
                                                        border: 1,
                                                        borderStyle: "dashed",
                                                        borderColor: "divider",
                                                    }}
                                                >
                                                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                                                        {batch.batchName || batch.batchId}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        endIcon={<OpenInNewIcon />}
                                                        sx={{ mt: 0.5, px: 0, textTransform: "none", fontWeight: 700 }}
                                                        onClick={() => goToBatch(batch.batchId)}
                                                    >
                                                        Open batch
                                                    </Button>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography sx={{ color: "text.secondary" }}>No batches linked.</Typography>
                                        )}
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: "text.primary", mb: 1.25 }}>
                                        Linked Courses
                                    </Typography>
                                    <Stack spacing={1}>
                                        {data?.courses?.length ? (
                                            data.courses.map((course) => (
                                                <Box
                                                    key={course.courseId}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        bgcolor: "background.paper",
                                                        border: 1,
                                                        borderStyle: "dashed",
                                                        borderColor: "divider",
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <MenuBookOutlinedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                                                        <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                                                            {course.name || course.courseId}
                                                        </Typography>
                                                    </Stack>
                                                    <Button
                                                        size="small"
                                                        endIcon={<OpenInNewIcon />}
                                                        sx={{ mt: 0.5, px: 0, textTransform: "none", fontWeight: 700 }}
                                                        onClick={() => goToCourse(course.courseId)}
                                                    >
                                                        Open course
                                                    </Button>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography sx={{ color: "text.secondary" }}>No courses linked.</Typography>
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {activeTab === "progress" && (
                <SectionCard
                    title="Learning Progress"
                    subtitle="Read-only course and chapter progress based on tracked learning time."
                >
                    <Stack spacing={1.5}>
                        {insights?.courses?.length ? (
                            insights.courses.map((course) => (
                                <InsightItem
                                    key={course._id}
                                    icon={<MenuBookOutlinedIcon fontSize="small" />}
                                    title={course.name || `Course ${course.courseId}`}
                                    meta={`${formatMinutes(course.spentTime)} tracked of ${formatMinutes(course.expectedTime)} expected`}
                                    chip={<Chip label={`${course.percent}%`} size="small" color={course.percent >= 70 ? "success" : course.percent >= 30 ? "warning" : "default"} />}
                                >
                                    <LinearProgress
                                        variant="determinate"
                                        value={course.percent}
                                        sx={{ height: 8, borderRadius: 8, mb: 1.25 }}
                                    />
                                    <Grid container spacing={1}>
                                        {(course.chapters || []).slice(0, 4).map((chapter) => (
                                            <Grid item xs={12} md={6} key={chapter._id}>
                                                <Box
                                                    sx={{
                                                        p: 1.25,
                                                        borderRadius: 2,
                                                        bgcolor: "background.paper",
                                                        border: 1,
                                                        borderColor: "divider",
                                                    }}
                                                >
                                                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                                                        {chapter.name}
                                                    </Typography>
                                                    <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                                                        {chapter.percent}% - {formatMinutes(chapter.spentTime)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </InsightItem>
                            ))
                        ) : (
                            <EmptyState title="No progress yet" subtitle="Progress will appear once the student starts learning content." />
                        )}
                    </Stack>
                </SectionCard>
            )}

            {activeTab === "submissions" && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} lg={6}>
                        <SectionCard title="Assignments" subtitle="Latest assignment submissions and review status.">
                            <Stack spacing={1.25}>
                                {insights?.assignments?.length ? (
                                    insights.assignments.map((assignment) => (
                                        <InsightItem
                                            key={assignment._id}
                                            icon={<AssignmentTurnedInOutlinedIcon fontSize="small" />}
                                            title={assignment.title}
                                            meta={`${assignment.type || "Assignment"} - ${formatDateTime(assignment.submittedAt)}`}
                                            chip={<Chip label={assignment.status || "submitted"} size="small" />}
                                        >
                                            <Typography sx={{ color: "text.primary", fontSize: 13 }}>
                                                Marks: {assignment.finalMarks ?? assignment.suggestedMarks ?? "Not reviewed"}
                                            </Typography>
                                            {assignment.feedback ? (
                                                <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                                                    {assignment.feedback}
                                                </Typography>
                                            ) : null}
                                        </InsightItem>
                                    ))
                                ) : (
                                    <EmptyState title="No assignment submissions" subtitle="Submitted assignments will appear here." />
                                )}
                            </Stack>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <SectionCard title="Projects" subtitle="Practice projects and teacher review status.">
                            <Stack spacing={1.25}>
                                {insights?.projects?.length ? (
                                    insights.projects.map((project) => (
                                        <InsightItem
                                            key={project._id}
                                            icon={<FactCheckOutlinedIcon fontSize="small" />}
                                            title={project.name}
                                            meta={`${project.language || "Project"} - ${formatDateTime(project.updatedAt)}`}
                                            chip={<Chip label={project.reviewStatus || project.status} size="small" color={project.reviewStatus === "needs_revision" ? "warning" : "default"} />}
                                        >
                                            {project.feedback ? (
                                                <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                                                    {project.feedback}
                                                </Typography>
                                            ) : null}
                                        </InsightItem>
                                    ))
                                ) : (
                                    <EmptyState title="No projects yet" subtitle="Practice projects will appear when the student saves or submits them." />
                                )}
                            </Stack>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12}>
                        <SectionCard title="Quizzes" subtitle="Recent quiz attempts and scores.">
                            <Stack spacing={1.25}>
                                {insights?.quizzes?.length ? (
                                    insights.quizzes.map((quiz) => (
                                        <InsightItem
                                            key={`${quiz.type}-${quiz._id}`}
                                            icon={<QuizOutlinedIcon fontSize="small" />}
                                            title={quiz.title}
                                            meta={`${quiz.type} - ${formatDateTime(quiz.submittedAt)}`}
                                            chip={<Chip label={`${quiz.percentage || 0}%`} size="small" color={quiz.isPassed ? "success" : "warning"} />}
                                        >
                                            <Typography sx={{ color: "#4b5563", fontSize: 13 }}>
                                                Score: {quiz.score ?? 0}
                                            </Typography>
                                        </InsightItem>
                                    ))
                                ) : (
                                    <EmptyState title="No quiz attempts" subtitle="Quiz attempts will appear here after the student submits them." />
                                )}
                            </Stack>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {activeTab === "attendance" && (
                <SectionCard
                    title="Attendance"
                    subtitle="Recent attendance records for this student."
                    action={<Chip label={`${insights?.attendance?.summary?.percentage || 0}% attendance`} color={(insights?.attendance?.summary?.percentage || 0) >= 75 ? "success" : "warning"} />}
                >
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} md={3}>
                            <StatTile label="Total Days" value={insights?.attendance?.summary?.total || 0} tint="#eff6ff" />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatTile label="Present" value={insights?.attendance?.summary?.present || 0} tint="#ecfdf3" />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatTile label="Late" value={insights?.attendance?.summary?.late || 0} tint="#fff7ed" />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <StatTile label="Absent" value={insights?.attendance?.summary?.absent || 0} tint="#fef2f2" />
                        </Grid>
                    </Grid>
                    <Stack spacing={1.25}>
                        {insights?.attendance?.recent?.length ? (
                            insights.attendance.recent.map((record) => (
                                <InsightItem
                                    key={`${record.date}-${record.batchName}`}
                                    icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                                    title={record.date}
                                    meta={`${record.batchName || "Batch"} - ${record.className || data.class || "-"} ${record.section || data.section || ""}`}
                                    chip={<Chip label={record.status} size="small" color={record.status === "present" ? "success" : record.status === "late" ? "warning" : "default"} />}
                                />
                            ))
                        ) : (
                            <EmptyState title="No attendance records" subtitle="Attendance history will appear once attendance is captured." />
                        )}
                    </Stack>
                </SectionCard>
            )}

            {activeTab === "followup" && (
                <SectionCard
                    title="Teacher Follow-up Signals"
                    subtitle="Automatically suggested points to help teachers decide who needs attention."
                >
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatTile label="Avg Progress" value={`${insights?.summary?.averageCourseProgress || 0}%`} tint="#eff6ff" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatTile label="Attendance" value={`${insights?.summary?.attendancePercentage || 0}%`} tint="#ecfdf3" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatTile label="Submissions" value={insights?.summary?.assignmentSubmissions || 0} tint="#fff7ed" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatTile label="Projects" value={insights?.summary?.projectCount || 0} tint="#faf5ff" />
                        </Grid>
                    </Grid>
                    <Stack spacing={1.25}>
                        {insights?.summary?.followUps?.length ? (
                            insights.summary.followUps.map((item) => (
                                <InsightItem
                                    key={item}
                                    icon={<InsightsOutlinedIcon fontSize="small" />}
                                    title={item}
                                    meta="Teacher can review this signal and follow up outside student record editing."
                                    chip={<Chip label="Needs attention" size="small" color="warning" />}
                                />
                            ))
                        ) : (
                            <EmptyState title="No follow-up signals" subtitle="Nothing urgent is flagged from current activity data." />
                        )}
                    </Stack>
                </SectionCard>
            )}
        </Box>
    );
};

export default ViewStudentDetails;
