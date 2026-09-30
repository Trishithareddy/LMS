import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import TeacherCharts from "./TeacherCharts";

const API = () => (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const plain = (html) => {
    if (!html) return "";
    try {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return (doc.body.textContent || "").trim();
    } catch {
        return html.replace(/<[^>]+>/g, "").trim();
    }
};

const fmt = (date) =>
    new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const friendlyFirstName = (name, fallback) => {
    const cleaned = String(name || "").trim();
    if (!cleaned) return fallback;

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const honorifics = new Set([
        "mr",
        "mrs",
        "ms",
        "miss",
        "dr",
        "sir",
        "madam",
        "prof",
        "professor",
    ]);

    const firstMeaningful =
        parts.find((part) => !honorifics.has(part.replace(/\./g, "").toLowerCase())) ||
        parts[0];

    return firstMeaningful || fallback;
};

const SummaryCard = ({ icon, value, label, tint }) => (
    <Card
        sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            bgcolor: "background.paper",
            height: "100%",
        }}
    >
        <CardContent sx={{ p: 2, minHeight: 108 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                }}
            >
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: tint,
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "text.primary" }}>
                    {value ?? "-"}
                </Typography>
            </Box>
            <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>{label}</Typography>
        </CardContent>
    </Card>
);

const ActionCard = ({ title, helper, icon, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            cursor: "pointer",
            transition: "0.2s ease",
            bgcolor: "background.paper",
            "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 18px 30px rgba(15, 23, 42, 0.10)",
            },
        }}
    >
        <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "flex-start", justifyContent: "space-between", p: 2 }}
        >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "action.hover",
                        color: "primary.main",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, color: "text.primary", mb: helper ? 0.5 : 0 }}>
                        {title}
                    </Typography>
                    {helper ? (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {helper}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
            <ArrowOutwardRoundedIcon sx={{ color: "primary.main", mt: 0.2 }} />
        </Stack>
    </Box>
);

const SectionCard = ({ title, helper, action, children, minHeight, compact = false }) => (
    <Card
        sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            height: "100%",
            minHeight,
        }}
    >
        <CardContent sx={{ p: compact ? { xs: 2, md: 2.25 } : { xs: 2.25, md: 2.75 } }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 1.5,
                    mb: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                        {title}
                    </Typography>
                    {helper ? (
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                            {helper}
                        </Typography>
                    ) : null}
                </Box>
                {action}
            </Box>
            {children}
        </CardContent>
    </Card>
);

const BatchCard = ({ batch, onOpen }) => (
    <Box
        sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            height: "100%",
            p: 1.5,
            bgcolor: "background.paper",
        }}
    >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <Avatar
                src={batch.img || ""}
                alt={batch.name?.[0] || "B"}
                variant="rounded"
                sx={{ width: 48, height: 48, borderRadius: 1 }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontWeight: 800, color: "text.primary" }}>
                    {batch.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                    <Chip size="small" label={`${batch.students} students`} />
                    <Chip size="small" variant="outlined" label="Batch" />
                </Stack>
            </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" fullWidth onClick={onOpen}>
                Open
            </Button>
            <Button size="small" variant="outlined" fullWidth onClick={onOpen}>
                Details
            </Button>
        </Stack>
    </Box>
);

const FocusTile = ({ title, value, icon, tone, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            borderRadius: 1,
            border: `1px solid ${tone.border}`,
            bgcolor: "background.paper",
            p: 1.5,
            minHeight: 116,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "0.2s ease",
            "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 14px 24px rgba(15, 23, 42, 0.08)",
            },
        }}
    >
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box
                sx={{
                    color: "text.secondary",
                    display: "grid",
                    placeItems: "center",
                    mt: 0.25,
                }}
            >
                {icon}
            </Box>
            <Chip
                size="small"
                color={tone.chip}
                label={value}
                sx={{
                    minWidth: 32,
                    height: 30,
                    flexShrink: 0,
                    "& .MuiChip-label": {
                        px: 0,
                        minWidth: 20,
                        textAlign: "center",
                        fontWeight: 900,
                    },
                }}
            />
        </Stack>
        <Box>
            <Typography
                sx={{
                    fontWeight: 900,
                    color: "text.primary",
                    fontSize: 15,
                    lineHeight: 1.2,
                    mb: 0.75,
                }}
            >
                {title}
            </Typography>
            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 900 }}>
                Open
            </Typography>
        </Box>
    </Box>
);

const activityMeta = {
    announcement: {
        label: "Notice",
        color: "#16a34a",
        bg: "#ecfdf3",
        icon: <CampaignOutlinedIcon fontSize="small" />,
    },
    project: {
        label: "Project",
        color: "#f97316",
        bg: "#fff7ed",
        icon: <RateReviewOutlinedIcon fontSize="small" />,
    },
    quiz: {
        label: "Quiz",
        color: "#2563eb",
        bg: "#eff6ff",
        icon: <QuizOutlinedIcon fontSize="small" />,
    },
};

const ActivityFeedItem = ({ item, isLast }) => {
    const meta = activityMeta[item.type] || activityMeta.announcement;

    return (
        <Box sx={{ position: "relative", pl: 4.25, pb: isLast ? 0 : 1.15 }}>
            {!isLast ? (
                <Box
                    sx={{
                        position: "absolute",
                        left: 14,
                        top: 28,
                        bottom: -2,
                        width: 2,
                        bgcolor: "background.paper",
                    }}
                />
            ) : null}
            <Box
                sx={{
                    position: "absolute",
                    left: 0,
                    top: 3,
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: meta.bg,
                    color: meta.color,
                    display: "grid",
                    placeItems: "center",
                    border: 1,
                    borderColor: "divider",
                }}
            >
                {meta.icon}
            </Box>
            <Box
                sx={{
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    px: 1.25,
                    py: 1,
                }}
            >
                <Stack
                    direction="row"
                    sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 0.35,
                    }}
                >
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                        <Chip
                            size="small"
                            label={meta.label}
                            sx={{
                                height: 20,
                                backgroundColor: meta.bg,
                                color: meta.color,
                                fontWeight: 900,
                                "& .MuiChip-label": { px: 0.8 },
                            }}
                        />
                        <Typography
                            noWrap
                            sx={{
                                fontWeight: 900,
                                color: "text.primary",
                                lineHeight: 1.2,
                                fontSize: 14,
                                minWidth: 0,
                            }}
                        >
                            {item.title}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                        {fmt(item.when)}
                    </Typography>
                </Stack>
                {item.helper ? (
                    <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontSize: 13 }}>
                        {item.helper}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export default function TeacherHome() {
    const navigate = useNavigate();
    const [teacherName, setTeacherName] = useState("");
    const [overviewCounts, setOverviewCounts] = useState({
        batches: null,
        students: null,
        quizAttempts: null,
        projectSubmissions: null,
        projectsToReview: null,
        needsRevision: null,
        announcements: null,
    });
    const [updates, setUpdates] = useState([]);
    const [myBatches, setMyBatches] = useState([]);
    const [pendingWork, setPendingWork] = useState({
        projectReviews: 0,
        revisions: 0,
        assignmentReviews: 0,
        corrections: 0,
        assignmentReviewed: 0,
        lateAssignments: 0,
    });
    const [toolUsage, setToolUsage] = useState({
        assignments: 0,
        quizzes: 0,
        questionPapers: 0,
        notices: 0,
    });
    const [dashboardLoading, setDashboardLoading] = useState(true);

    const firstName = useMemo(
        () => friendlyFirstName(teacherName, "Teacher"),
        [teacherName]
    );

    useEffect(() => {
        let alive = true;
        const base = API();
        const headers = authHeaders();

        const loadDashboard = async () => {
            try {
                setDashboardLoading(true);
                const [teacherRes, overviewRes, batchesRes, announcementsRes, projectsRes] =
                    await Promise.all([
                        axios.get(`${base}/teacher/getLoggedinTeacher`, { headers }),
                        axios.get(`${base}/teacher/overview`, { headers }),
                        axios.get(`${base}/teacher/get/allBatches`, { headers }),
                        axios.get(`${base}/teacher/all/announcements`, { headers }),
                        axios.get(`${base}/project/get-submitted-practice-project`, {
                            headers,
                        }),
                    ]);

                const teacher = teacherRes.data?.teacher || {};
                const overview = overviewRes.data || {};
                const detailedBatches =
                    batchesRes.data?.teacher?.batches ||
                    batchesRes.data?.batches ||
                    [];
                const teacherBatches = Array.isArray(teacher?.batches)
                    ? teacher.batches
                    : [];
                const batches =
                    detailedBatches.length >= teacherBatches.length
                        ? detailedBatches
                        : teacherBatches;
                const resolvedBatchCount = Math.max(
                    detailedBatches.length,
                    teacherBatches.length,
                    batches.length
                );
                const announcements = announcementsRes.data?.announcements || [];
                const submittedProjects = Array.isArray(projectsRes.data)
                    ? projectsRes.data
                    : projectsRes.data?.projects || [];
                const [
                    assignmentsResult,
                    assignmentReportResult,
                    quizzesResult,
                    questionPapersResult,
                ] = await Promise.allSettled([
                    axios.get(`${base}/assignments/teacher`, { headers }),
                    axios.get(`${base}/assignments/report/summary`, { headers }),
                    axios.get(`${base}/quiz/get-all-quizzes?limit=1`, { headers }),
                    axios.get(`${base}/question-papers/my-papers?limit=1`, { headers }),
                ]);

                if (!alive) return;
                setTeacherName(teacher.name || "");

                const uniqueStudents = new Set();
                const batchCards = batches.map((batch) => {
                    const students = batch.students || [];
                    students.forEach((student) => {
                        const id = student?._id || student?.id || student;
                        if (id) uniqueStudents.add(String(id));
                    });
                    return {
                        id: batch._id,
                        name: batch.batchName || batch.name || "Batch",
                        img: batch.batchImageUrl || batch.imageUrl || "",
                        students: students.length,
                    };
                });

                if (!batchCards.length && teacherBatches.length) {
                    teacherBatches.forEach((batch) => {
                        batchCards.push({
                            id: batch._id,
                            name: batch.batchName || batch.name || "Batch",
                            img: batch.batchImageUrl || batch.imageUrl || "",
                            students: 0,
                        });
                    });
                }

                const latestAnnouncements = announcements
                    .map((item) => ({
                        type: "announcement",
                        title: item.title || plain(item.announcementContent || ""),
                        when: item.createdAt || item.updatedAt || Date.now(),
                        helper: "Class notice sent",
                    }))
                    .filter((item) => item.title);

                const latestOverviewUpdates = Array.isArray(overview.updates)
                    ? overview.updates
                    : [];

                const latestProjects = latestOverviewUpdates
                    .filter((item) => item.type === "project")
                    .map((item) => ({
                        type: "project",
                        title: `${item.studentName || "Student"} submitted ${item.projectTitle || "a project"
                            }`,
                        when: item.when || item.createdAt || item.submittedAt || Date.now(),
                        helper: item.batchName || "Project review",
                    }));

                const latestQuizzes = latestOverviewUpdates
                    .filter((item) => item.type === "quiz")
                    .map((item) => ({
                        type: "quiz",
                        title: `${item.studentName || "Student"} attempted ${item.quizTitle || "a quiz"
                            }`,
                        when: item.when || item.createdAt || Date.now(),
                        helper: item.batchName || "Quiz activity",
                    }));

                const mergedUpdates = [
                    ...latestProjects,
                    ...latestQuizzes,
                    ...latestAnnouncements,
                ]
                    .sort((a, b) => new Date(b.when) - new Date(a.when))
                    .slice(0, 8);

                const reviewableProjects = submittedProjects.filter(
                    (project) =>
                        project?.teacherReview?.status === "not_reviewed" ||
                        !project?.teacherReview?.status
                );
                const revisionProjects = submittedProjects.filter(
                    (project) => project?.teacherReview?.status === "needs_revision"
                );
                const assignments =
                    assignmentsResult.status === "fulfilled"
                        ? assignmentsResult.value.data?.assignments || []
                        : [];
                const assignmentReport =
                    assignmentReportResult.status === "fulfilled"
                        ? assignmentReportResult.value.data?.report || []
                        : [];
                const quizTotal =
                    quizzesResult.status === "fulfilled"
                        ? quizzesResult.value.data?.data?.pagination?.totalItems ||
                        quizzesResult.value.data?.data?.quizzes?.length ||
                        0
                        : 0;
                const questionPaperTotal =
                    questionPapersResult.status === "fulfilled"
                        ? questionPapersResult.value.data?.pagination?.total ||
                        questionPapersResult.value.data?.papers?.length ||
                        0
                        : 0;
                const assignmentPending = assignmentReport.reduce(
                    (total, item) => total + (Number(item.pendingReview) || 0),
                    0
                );
                const assignmentCorrections = assignmentReport.reduce(
                    (total, item) => total + (Number(item.needsCorrection) || 0),
                    0
                );
                const assignmentReviewed = assignmentReport.reduce(
                    (total, item) => total + (Number(item.reviewed) || 0),
                    0
                );
                const lateAssignments = assignmentReport.reduce(
                    (total, item) => total + (Number(item.late) || 0),
                    0
                );

                if (!alive) return;

                setMyBatches((prev) => (batchCards.length ? batchCards : prev));
                setUpdates(mergedUpdates);
                setPendingWork({
                    projectReviews: reviewableProjects.length,
                    revisions: revisionProjects.length,
                    assignmentReviews: assignmentPending,
                    corrections: assignmentCorrections,
                    assignmentReviewed,
                    lateAssignments,
                });
                setToolUsage({
                    assignments: assignments.length,
                    quizzes: quizTotal,
                    questionPapers: questionPaperTotal,
                    notices: announcements.length,
                });
                setOverviewCounts((prev) => ({
                    batches:
                        resolvedBatchCount > 0
                            ? resolvedBatchCount
                            : prev.batches,
                    students:
                        uniqueStudents.size > 0 ? uniqueStudents.size : prev.students,
                    quizAttempts: overview?.counts?.quizAttempts || 0,
                    projectSubmissions: overview?.counts?.projectSubmissions || 0,
                    projectsToReview: reviewableProjects.length,
                    needsRevision: revisionProjects.length,
                    announcements: announcements.length,
                }));
            } catch (error) {
                console.error("Error loading teacher dashboard:", error);
            } finally {
                if (alive) {
                    setDashboardLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            alive = false;
        };
    }, []);

    const quickActions = [
        {
            title: "Start Attendance",
            helper: "",
            icon: <PlayCircleOutlineRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/attendance"),
        },
        {
            title: "Create Assignment",
            helper: "",
            icon: <PostAddRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/assignments"),
        },
        {
            title: "Create Assessment",
            helper: "",
            icon: <EditNoteRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/assessment-center"),
        },
        {
            title: "Post Announcement",
            helper: "",
            icon: <NotificationsActiveRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/announcements"),
        },
    ];

    const focusItems = [
        {
            title: "Project Reviews",
            value: overviewCounts.projectsToReview,
            tone: "warning",
            icon: <RateReviewOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/projects"),
        },
        {
            title: "Revisions",
            value: overviewCounts.needsRevision,
            tone: "info",
            icon: <AutorenewRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/projects"),
        },
        {
            title: "Quiz Attempts",
            value: overviewCounts.quizAttempts,
            tone: "success",
            icon: <InsightsRoundedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/assessment-center"),
        },
        {
            title: "Notices Sent",
            value: overviewCounts.announcements,
            tone: "default",
            icon: <CampaignOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/teacher-dashboard/announcements"),
        },
    ];

    const toneStyles = {
        warning: { border: "#fdba74", chip: "warning" },
        info: { border: "#93c5fd", chip: "info" },
        success: { border: "#86efac", chip: "success" },
        default: { border: "#cbd5e1", chip: "default" },
    };

    return (
        <Box
            sx={{
                p: 3,
                bgcolor: "background.default",
                color: "text.primary",
                minHeight: "100vh",
            }}
        >
            <Grid container spacing={3}>
                <Grid item xs={12} lg={4} sx={{ order: 1 }}>
                    <Card
                        sx={{
                            borderRadius: 1,
                            border: 1,
                            borderColor: "divider",
                            boxShadow: 2,
                            bgcolor: "background.paper",
                            position: "relative",
                            overflow: "hidden",
                            "&:before": {
                                content: '""',
                                position: "absolute",
                                inset: "0 auto 0 0",
                                width: 6,
                                backgroundColor: "primary.main",
                            },
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, md: 2.5 }, pl: { xs: 3, md: 3.5 } }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: "success.main", fontWeight: 800, mb: 1 }}
                            >
                                Today
                            </Typography>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 900,
                                    color: "text.primary",
                                    mb: 1.5,
                                    maxWidth: 720,
                                    fontSize: { xs: 28, md: 30 },
                                    lineHeight: 1.12,
                                }}
                            >
                                Welcome back, {firstName}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                                <Chip size="small" color="success" label={`${overviewCounts.batches ?? 0} batches`} />
                                <Chip size="small" variant="outlined" label={`${overviewCounts.projectsToReview ?? 0} reviews`} />
                                <Chip size="small" variant="outlined" label={`${overviewCounts.announcements ?? 0} notices`} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sx={{ order: 2 }}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<SchoolOutlinedIcon sx={{ color: "success.main" }} />}
                                value={dashboardLoading ? "..." : overviewCounts.batches}
                                label="Batches Assigned"
                                tint="#ecfdf3"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<Groups2OutlinedIcon sx={{ color: "primary.main" }} />}
                                value={dashboardLoading ? "..." : overviewCounts.students}
                                label="Students Reached"
                                tint="#eff6ff"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<QuizOutlinedIcon sx={{ color: "secondary.main" }} />}
                                value={dashboardLoading ? "..." : overviewCounts.quizAttempts}
                                label="Quiz Attempts"
                                tint="#faf5ff"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<AssignmentTurnedInOutlinedIcon sx={{ color: "warning.main" }} />}
                                value={dashboardLoading ? "..." : overviewCounts.projectsToReview}
                                label="Projects to Review"
                                tint="#fff7ed"
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ order: 3 }}>
                    <SectionCard
                        title="Teaching Pulse"
                        helper=""
                    >
                        <Grid container spacing={2.25}>
                            <Grid item xs={12}>
                                <TeacherCharts
                                    counts={overviewCounts}
                                    updates={updates}
                                    pendingWork={pendingWork}
                                    toolUsage={toolUsage}
                                />
                            </Grid>
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={8} sx={{ order: 1 }}>
                    <SectionCard
                        title="Today's Focus"
                        helper=""
                        compact
                    >
                        <Grid container spacing={1.25} alignItems="stretch">
                            {focusItems.map((item) => {
                                const tone = toneStyles[item.tone] || toneStyles.default;
                                return (
                                    <Grid item xs={12} sm={6} lg={3} key={item.title}>
                                        <FocusTile {...item} tone={tone} />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} sx={{ order: 4 }}>
                    <SectionCard title="Quick Actions" helper="" compact>
                        <Grid container spacing={2}>
                            {quickActions.map((item) => (
                                <Grid item xs={12} sm={6} md={3} key={item.title}>
                                    <ActionCard {...item} />
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={7} sx={{ order: 5 }}>
                    <SectionCard
                        title="My Batches"
                        helper=""
                        action={
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate("/teacher-dashboard/batches")}
                            >
                                View All
                            </Button>
                        }
                    >
                        {myBatches.length === 0 ? (
                            <Typography sx={{ color: "text.secondary" }}>
                                No batches are assigned yet.
                            </Typography>
                        ) : (
                            <Grid container spacing={2}>
                                {myBatches.slice(0, 4).map((batch) => (
                                    <Grid item xs={12} sm={6} key={batch.id}>
                                        <BatchCard
                                            batch={batch}
                                            onOpen={() =>
                                                navigate("/teacher-dashboard/batchdetails", {
                                                    state: { _id: batch.id, from: "teacherDashboard" },
                                                })
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={5} sx={{ order: 5 }}>
                    <SectionCard
                        title="Recent Activity"
                        helper=""
                    >
                        {!updates.length ? (
                            <Box
                                sx={{
                                    borderRadius: 1,
                                    border: "1px dashed rgba(148, 163, 184, 0.65)",
                                    bgcolor: "background.paper",
                                    p: 3,
                                    textAlign: "center",
                                }}
                            >
                                <FiberManualRecordRoundedIcon sx={{ color: "text.secondary", mb: 0.75 }} />
                                <Typography sx={{ color: "text.primary", fontWeight: 900 }}>
                                    No recent activity yet
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0}>
                                {updates.slice(0, 5).map((item, index, arr) => (
                                    <ActivityFeedItem
                                        key={`${item.type}-${index}`}
                                        item={item}
                                        isLast={index === arr.length - 1}
                                    />
                                ))}
                            </Stack>
                        )}
                    </SectionCard>
                </Grid>
            </Grid>
        </Box>
    );
}
