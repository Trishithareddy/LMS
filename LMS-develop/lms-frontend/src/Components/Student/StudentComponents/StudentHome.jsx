import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import TaskRoundedIcon from "@mui/icons-material/TaskRounded";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import StudentAssessmentCharts from "./StudentAssessmentCharts";
import StudentLearningPulse from "./StudentLearningPulse";
import { fetchStudentProfile, calcCourseProgress } from "./StudentCourse";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const plain = (html) => {
    if (!html) return "";
    try {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return (doc.body.textContent || "").trim();
    } catch {
        return html.replace(/<[^>]+>/g, "").trim();
    }
};

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
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            bgcolor: "background.paper",
            height: "100%",
        }}
    >
        <CardContent sx={{ p: 2.25 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                }}
            >
                {icon}
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                    {value}
                </Typography>
            </Box>
            <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
        </CardContent>
    </Card>
);

const ActionCard = ({ title, helper, icon, onClick }) => (
    <Card
        onClick={onClick}
        sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
            cursor: "pointer",
            transition: "0.2s ease",
            bgcolor: "background.paper",
            "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 18px 30px rgba(15, 23, 42, 0.10)",
            },
        }}
    >
        <CardContent sx={{ p: 2 }}>
            <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
            >
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
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
        </CardContent>
    </Card>
);

const SectionCard = ({ title, helper, action, children, compact = false }) => (
    <Card
        sx={{
            borderRadius: 4,
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            height: "100%",
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

export default function StudentHome() {
    const navigate = useNavigate();
    const outlet = useOutletContext?.() || {};
    const nameFromOutlet =
        outlet?.studentName || outlet?.data?.name || outlet?.data?.student?.name || "";

    const [studentName, setStudentName] = useState(nameFromOutlet);
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [projectSummary, setProjectSummary] = useState({
        reviewed: 0,
        needsRevision: 0,
        projects: [],
    });
    const [overviewCounts, setOverviewCounts] = useState({
        pendingAssessments: 0,
        dueSoon: 0,
        attendancePercentage: 0,
        reviewedProjects: 0,
        needsRevision: 0,
        announcements: 0,
        coursesInProgress: 0,
    });
    const [recentUpdates, setRecentUpdates] = useState([]);

    const firstName = useMemo(
        () => friendlyFirstName(studentName, "Student"),
        [studentName]
    );

    useEffect(() => {
        let alive = true;

        const headers = {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        };

        const loadDashboard = async () => {
            try {
                const student = await fetchStudentProfile();
                if (!alive || !student) return;

                if (student?.name) {
                    setStudentName(student.name);
                }

                const flatCourses = [];
                (student?.batches || []).forEach((batch) => {
                    (batch?.courses || []).forEach((course) => {
                        flatCourses.push({
                            _id: course._id,
                            name: course.name || "Course",
                            batchId: batch._id,
                        });
                    });
                });

                const withProgress = await Promise.all(
                    flatCourses.map(async (course) => ({
                        ...course,
                        progress: await calcCourseProgress(student._id, course._id, course.batchId),
                    }))
                );

                const [
                    quizzesRes,
                    announcementsRes,
                    projectsRes,
                    attendanceRes,
                ] = await Promise.all([
                    axios.get(`${API}/quiz/get-quizzes`, { headers }),
                    axios.get(`${API}/student/all/announcements`, { headers }),
                    axios.get(`${API}/project/get-practice-project`, { headers }),
                    axios.get(`${API}/student/attendance/summary`, { headers }),
                ]);

                const quizzes = quizzesRes.data?.data?.quizzes || [];
                const announcements =
                    announcementsRes.data?.announcements ||
                    announcementsRes.data?.data?.announcements ||
                    [];
                const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
                const attendance = attendanceRes.data || {};

                const pendingAssessments = quizzes.filter((quiz) => !quiz.attempted);
                const completedAssessments = quizzes.filter((quiz) => quiz.attempted);
                const dueSoon = pendingAssessments.filter((quiz) => {
                    if (!quiz.deadline) return false;
                    const due = new Date(quiz.deadline);
                    const now = new Date();
                    const inSevenDays = new Date();
                    inSevenDays.setDate(now.getDate() + 7);
                    return due >= now && due <= inSevenDays;
                });

                const reviewedProjects = projects.filter(
                    (project) => project?.teacherReview?.status === "reviewed"
                );
                const revisionProjects = projects.filter(
                    (project) => project?.teacherReview?.status === "needs_revision"
                );

                const courseProgressAverage = withProgress.length
                    ? Math.round(
                        withProgress.reduce(
                            (sum, course) => sum + (Number(course.progress) || 0),
                            0
                        ) / withProgress.length
                    )
                    : 0;
                const coursesInProgress = withProgress.filter(
                    (course) => Number(course.progress) > 0 && Number(course.progress) < 100
                ).length;

                const mappedAssessments = quizzes.map((quiz) => ({
                    start: quiz.createdAt || new Date(),
                    end: quiz.deadline || quiz.createdAt || new Date(),
                    status: quiz.attempted ? "Completed" : "Pending",
                }));

                const projectUpdates = projects
                    .filter(
                        (project) =>
                            project?.teacherReview?.status === "reviewed" ||
                            project?.teacherReview?.status === "needs_revision"
                    )
                    .map((project) => ({
                        type: "project",
                        title:
                            project?.teacherReview?.status === "needs_revision"
                                ? `Revision requested for ${project.name}`
                                : `Project reviewed: ${project.name}`,
                        when:
                            project?.teacherReview?.reviewedAt ||
                            project?.updatedAt ||
                            project?.createdAt,
                        sub:
                            project?.teacherReview?.feedback ||
                            (project?.teacherReview?.status === "needs_revision"
                                ? "Teacher asked for another round of work."
                                : "Teacher feedback is available."),
                        path: "/student-dashboard/projects-Practice",
                    }));

                const assessmentUpdates = quizzes
                    .slice(0, 4)
                    .map((quiz) => ({
                        type: "assessment",
                        title: `Assessment: ${quiz.title || "Assessment"}`,
                        when: quiz.createdAt,
                        sub: quiz.attempted ? "Completed" : "Pending",
                        path: "/student-dashboard/assessments",
                    }));

                const announcementUpdates = announcements
                    .slice(0, 4)
                    .map((announcement) => ({
                        type: "announcement",
                        title: announcement?.title || plain(announcement?.announcementContent || ""),
                        when: announcement.createdAt || announcement.updatedAt,
                        sub: "Announcement",
                        path: "/student-dashboard/announcements",
                    }))
                    .filter((item) => item.title);

                const mergedUpdates = [
                    ...projectUpdates,
                    ...assessmentUpdates,
                    ...announcementUpdates,
                ]
                    .sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0))
                    .slice(0, 8);

                if (!alive) return;

                setCourses(withProgress);
                setAssessments(mappedAssessments);
                setAttendanceSummary(attendance);
                setProjectSummary({
                    reviewed: reviewedProjects.length,
                    needsRevision: revisionProjects.length,
                    projects,
                });
                setOverviewCounts({
                    pendingAssessments: pendingAssessments.length,
                    dueSoon: dueSoon.length,
                    attendancePercentage:
                        attendance?.summary?.attendancePercentage || 0,
                    reviewedProjects: reviewedProjects.length,
                    needsRevision: revisionProjects.length,
                    announcements: announcements.length,
                    coursesInProgress,
                    courseProgressAverage,
                });
                setRecentUpdates(mergedUpdates);
            } catch (error) {
                console.error("Error loading student dashboard:", error);
            }
        };

        loadDashboard();

        return () => {
            alive = false;
        };
    }, []);

    const nextStepCards = [
        {
            title: "Open Courses",
            helper: "",
            icon: <MenuBookRoundedIcon fontSize="small" />,
            onClick: () => navigate("/student-dashboard/courses"),
        },
        {
            title: "Take Assessments",
            helper: "",
            icon: <AssignmentRoundedIcon fontSize="small" />,
            onClick: () => navigate("/student-dashboard/assessments"),
        },
        {
            title: "Check Attendance",
            helper: "",
            icon: <CalendarMonthOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/student-dashboard/attendance"),
        },
        {
            title: "Open Projects",
            helper: "",
            icon: <TaskRoundedIcon fontSize="small" />,
            onClick: () => navigate("/student-dashboard/projects-Practice"),
        },
    ];

    const nextSteps = [
        {
            title: "Pending Assessments",
            value: overviewCounts.pendingAssessments,
            helper:
                overviewCounts.pendingAssessments > 0
                    ? "Assessments are waiting for you."
                    : "You are clear on pending assessments right now.",
            chipColor: "warning",
        },
        {
            title: "Due Soon",
            value: overviewCounts.dueSoon,
            helper:
                overviewCounts.dueSoon > 0
                    ? "Some assessments are approaching deadline."
                    : "Nothing urgent is due in the next few days.",
            chipColor: "info",
        },
        {
            title: "Needs Revision",
            value: overviewCounts.needsRevision,
            helper:
                overviewCounts.needsRevision > 0
                    ? "Teacher feedback is waiting on project improvements."
                    : "No project revisions are currently waiting.",
            chipColor: "error",
        },
    ];

    const todayStatus = attendanceSummary?.todayStatus || null;
    const latestFeedback = projectSummary.projects
        .filter(
            (project) =>
                project?.teacherReview?.status === "reviewed" ||
                project?.teacherReview?.status === "needs_revision"
        )
        .sort(
            (a, b) =>
                new Date(b?.teacherReview?.reviewedAt || b?.updatedAt || 0) -
                new Date(a?.teacherReview?.reviewedAt || a?.updatedAt || 0)
        )
        .slice(0, 3);

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
                                sx={{ color: "primary.main", fontWeight: 800, mb: 1 }}
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
                                <Chip size="small" color="primary" label={`${courses.length} courses`} />
                                <Chip size="small" variant="outlined" label={`${overviewCounts.pendingAssessments} tests`} />
                                <Chip size="small" variant="outlined" label={`${overviewCounts.needsRevision} revisions`} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={8} sx={{ order: 1 }}>
                    <SectionCard title="Today's Focus" helper="" compact>
                        <Grid container spacing={1.25} alignItems="stretch">
                            {nextSteps.map((item) => (
                                <Grid item xs={12} sm={4} key={item.title}>
                                    <Box
                                        sx={{
                                            borderRadius: 1,
                                            border: 1,
                                            borderColor: "divider",
                                            bgcolor: "background.paper",
                                            p: 1.5,
                                            minHeight: 110,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography sx={{ fontWeight: 900, color: "text.primary" }}>
                                                {item.title}
                                            </Typography>
                                            <Chip size="small" color={item.chipColor} label={item.value} />
                                        </Stack>
                                        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.35 }}>
                                            {item.helper}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} sx={{ order: 2 }}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={
                                    <PendingActionsOutlinedIcon sx={{ color: "warning.main" }} />
                                }
                                value={overviewCounts.pendingAssessments}
                                label="Pending Assessments"
                                tint="#fff7ed"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<SchoolOutlinedIcon sx={{ color: "success.main" }} />}
                                value={`${overviewCounts.attendancePercentage}%`}
                                label="Attendance"
                                tint="#eff6ff"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={<RateReviewOutlinedIcon sx={{ color: "success.main" }} />}
                                value={overviewCounts.reviewedProjects}
                                label="Reviewed Projects"
                                tint="#ecfdf3"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <SummaryCard
                                icon={
                                    <NotificationsActiveOutlinedIcon sx={{ color: "secondary.main" }} />
                                }
                                value={overviewCounts.announcements}
                                label="Announcements"
                                tint="#faf5ff"
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ order: 3 }}>
                    <SectionCard
                        title="Quick Actions"
                        helper=""
                        compact
                    >
                        <Grid container spacing={2}>
                            {nextStepCards.map((item) => (
                                <Grid item xs={12} sm={6} md={3} key={item.title}>
                                    <ActionCard {...item} />
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} sx={{ order: 4 }}>
                    <SectionCard title="Learning Pulse" helper="">
                        <StudentLearningPulse
                            courses={courses}
                            assessments={assessments}
                            overviewCounts={overviewCounts}
                            projectSummary={projectSummary}
                            recentUpdates={recentUpdates}
                        />
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={7} sx={{ display: "none" }}>
                    <SectionCard
                        title="My Next Steps"
                        helper="This keeps the most useful student actions in one place."
                    >
                        <Stack spacing={1.5}>
                            {nextSteps.map((item) => (
                                <Box
                                    key={item.title}
                                    sx={{
                                        borderRadius: 3,
                                        border: 1,
                                        borderColor: "divider",
                                        bgcolor: "background.paper",
                                        px: 2,
                                        py: 1.75,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        sx={{
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            mb: 0.75,
                                        }}
                                    >
                                        <Typography
                                            sx={{ fontWeight: 700, color: "text.primary" }}
                                        >
                                            {item.title}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            color={item.chipColor}
                                            label={item.value}
                                        />
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {item.helper}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={5} sx={{ display: "none" }}>
                    <SectionCard
                        title="Learning Snapshot"
                        helper="A quick look at how your work is shaping up today."
                    >
                        <Stack spacing={1.5}>
                            <Box
                                sx={{
                                    borderRadius: 3,
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    backgroundColor: "action.hover",
                                    px: 2,
                                    py: 1.75,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    sx={{ justifyContent: "space-between", mb: 0.75 }}
                                >
                                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                                        Today's Attendance
                                    </Typography>
                                    <Chip
                                        size="small"
                                        color={
                                            todayStatus?.status === "present"
                                                ? "success"
                                                : todayStatus?.status === "late"
                                                    ? "warning"
                                                    : todayStatus?.status === "absent"
                                                        ? "error"
                                                        : "default"
                                        }
                                        label={
                                            todayStatus?.status
                                                ? todayStatus.status.charAt(0).toUpperCase() +
                                                todayStatus.status.slice(1)
                                                : "Pending"
                                        }
                                    />
                                </Stack>
                                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                                    {todayStatus
                                        ? `${todayStatus.batchName || "Current batch"} • Marked by ${todayStatus.markedBy === "system"
                                            ? "auto attendance"
                                            : "teacher"
                                        }`
                                        : "No attendance status has been marked yet today."}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    borderRadius: 3,
                                    border: 1,
                                    borderColor: "divider",
                                    backgroundColor: "background.paper",
                                    px: 2,
                                    py: 1.75,
                                }}
                            >
                                <Typography
                                    sx={{ fontWeight: 700, color: "text.primary", mb: 0.75 }}
                                >
                                    Course Progress
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {overviewCounts.coursesInProgress} course
                                    {overviewCounts.coursesInProgress === 1 ? "" : "s"} in
                                    progress with an average completion of{" "}
                                    {overviewCounts.courseProgressAverage || 0}%.
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid rgba(17, 24, 39, 0.06)",
                                    backgroundColor: "#f8fafc",
                                    px: 2,
                                    py: 1.75,
                                }}
                            >
                                <Typography
                                    sx={{ fontWeight: 700, color: "#111827", mb: 0.75 }}
                                >
                                    Teacher Feedback
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                                    {overviewCounts.reviewedProjects} project review
                                    {overviewCounts.reviewedProjects === 1 ? "" : "s"} shared,
                                    {` ${overviewCounts.needsRevision}`} needing another round.
                                </Typography>
                            </Box>
                        </Stack>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={7} sx={{ display: "none" }}>
                    <SectionCard
                        title="Assessment Activity"
                        helper="A compact look at completed and pending assessment work."
                    >
                        <StudentAssessmentCharts assessments={assessments} />
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={5} sx={{ order: 5 }}>
                    <SectionCard
                        title="Latest Teacher Feedback"
                        helper="Your most recent project review notes and revision signals."
                        action={
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate("/student-dashboard/projects-Practice")}
                            >
                                Open Projects
                            </Button>
                        }
                    >
                        {!latestFeedback.length ? (
                            <Typography sx={{ color: "#6b7280" }}>
                                No reviewed projects yet.
                            </Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {latestFeedback.map((project) => (
                                    <Box
                                        key={project._id}
                                        sx={{
                                            borderRadius: 3,
                                            border: "1px solid rgba(17, 24, 39, 0.06)",
                                            backgroundColor: "#f8fafc",
                                            px: 2,
                                            py: 1.75,
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            sx={{
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                mb: 0.75,
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 700, color: "#111827" }}
                                            >
                                                {project.name}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                color={
                                                    project?.teacherReview?.status ===
                                                        "needs_revision"
                                                        ? "error"
                                                        : "success"
                                                }
                                                label={
                                                    project?.teacherReview?.status ===
                                                        "needs_revision"
                                                        ? "Needs Revision"
                                                        : "Reviewed"
                                                }
                                            />
                                        </Stack>
                                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                                            {project?.teacherReview?.feedback ||
                                                "Teacher feedback has been added to this project."}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </SectionCard>
                </Grid>

                <Grid item xs={12} sx={{ order: 6 }}>
                    <SectionCard
                        title="Recent Updates"
                        helper="A blended feed of assessment movement, announcements, and project review updates."
                    >
                        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap" }}>
                            <Chip
                                color="info"
                                variant="outlined"
                                icon={<AssignmentTurnedInOutlinedIcon />}
                                label={`${overviewCounts.pendingAssessments} pending assessments`}
                                onClick={() => navigate("/student-dashboard/assessments")}
                                clickable
                            />
                            <Chip
                                color="success"
                                variant="outlined"
                                icon={<RateReviewOutlinedIcon />}
                                label={`${overviewCounts.reviewedProjects} reviewed projects`}
                                onClick={() => navigate("/student-dashboard/projects-Practice")}
                                clickable
                            />
                            <Chip
                                color="secondary"
                                variant="outlined"
                                icon={<CampaignOutlinedIcon />}
                                label={`${overviewCounts.announcements} announcements`}
                                onClick={() => navigate("/student-dashboard/announcements")}
                                clickable
                            />
                            <Chip
                                color="warning"
                                variant="outlined"
                                icon={<CalendarMonthOutlinedIcon />}
                                label={`${overviewCounts.dueSoon} due soon`}
                                onClick={() => navigate("/student-dashboard/assessments")}
                                clickable
                            />
                        </Stack>

                        {!recentUpdates.length ? (
                            <Typography sx={{ color: "text.secondary" }}>
                                No updates yet.
                            </Typography>
                        ) : (
                            <List disablePadding>
                                {recentUpdates.map((item, index) => (
                                    <ListItem
                                        key={`${item.type}-${index}`}
                                        disableGutters
                                        button
                                        onClick={() => navigate(item.path || "/student-dashboard")}
                                        sx={{
                                            py: 1.25,
                                            px: 2,
                                            borderRadius: 2,
                                            cursor: "pointer",
                                            bgcolor: "background.paper",
                                            color: "text.primary",
                                            border: "1px solid",
                                            borderColor: "divider",
                                            mb: 1,

                                            "&:hover": {
                                                bgcolor: "action.hover",
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    sx={{ fontWeight: 700, color: "text.primary" }}
                                                >
                                                    {plain(item.title)}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                                >
                                                    {item.sub ? `${plain(item.sub)} • ` : ""}
                                                    {item.when
                                                        ? new Date(item.when).toLocaleString()
                                                        : ""}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </SectionCard>
                </Grid>
            </Grid>
        </Box>
    );
}
