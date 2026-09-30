import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
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
    Paper,
    Snackbar,
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
} from "@mui/material";
import {
    AssignmentTurnedIn,
    AutoAwesome,
    BarChart,
    Download,
    Groups,
    Person,
    School,
    Search,
} from "@mui/icons-material";
import axios from "axios";

const formatDate = (value) => {
    if (!value) return "Never";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (filename, columns, rows) => {
    const header = columns.map((column) => csvEscape(column.label)).join(",");
    const body = rows
        .map((row) =>
            columns
                .map((column) =>
                    csvEscape(
                        typeof column.value === "function"
                            ? column.value(row)
                            : row[column.value]
                    )
                )
                .join(",")
        )
        .join("\n");
    const blob = new Blob([`${header}\n${body}`], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, helper, icon: Icon, color }) => (
    <Card
        sx={{
            height: "100%",
            borderRadius: 2,
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
        }}
    >
        <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: "#0F172A" }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {helper}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color,
                        bgcolor: `${color}16`,
                    }}
                >
                    <Icon />
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const AnalyticsTable = ({ title, rows, columns, filename, search, setSearch, status, setStatus }) => (
    <Paper sx={{ borderRadius: 2, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <Box
            sx={{
                p: 2,
                display: "flex",
                alignItems: { xs: "stretch", md: "center" },
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {rows.length} records
                </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                {status !== undefined && (
                    <TextField
                        select
                        size="small"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        sx={{ minWidth: 130 }}
                    >
                        <MenuItem value="all">All status</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                    </TextField>
                )}
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadCsv(filename, columns, rows)}
                >
                    Export CSV
                </Button>
            </Box>
        </Box>
        <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.label} sx={{ fontWeight: 800, bgcolor: "#F8FAFC" }}>
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id || row.name} hover>
                            {columns.map((column) => (
                                <TableCell key={column.label}>
                                    {column.render
                                        ? column.render(row)
                                        : typeof column.value === "function"
                                          ? column.value(row)
                                          : row[column.value]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                No matching records
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [aiUsage, setAiUsage] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [response, aiUsageResponse] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/school-admin/analytics`,
                        { headers },
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/ai-usage`,
                        { headers },
                    ),
                ]);
                setAnalytics(response.data.analytics);
                setAiUsage(aiUsageResponse.data);
            } catch (err) {
                console.error("Error fetching school analytics:", err);
                setError("Unable to load school analytics");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const filteredRows = useMemo(() => {
        if (!analytics) return [];
        const source = activeTab === 0 ? analytics.teachers : activeTab === 1 ? analytics.students : analytics.batches;
        const term = search.trim().toLowerCase();
        return source.filter((row) => {
            const matchesStatus = status === "all" || row.status === status || activeTab === 2;
            const matchesSearch =
                !term ||
                Object.values(row)
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [activeTab, analytics, search, status]);

    if (isLoading) {
        return (
            <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!analytics) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Analytics not available"}</Alert>
            </Box>
        );
    }

    const { overview } = analytics;
    const teacherColumns = [
        { label: "Teacher", value: "name" },
        { label: "Username", value: "username" },
        {
            label: "Status",
            value: "status",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status}
                    color={row.status === "Active" ? "success" : "error"}
                    variant="outlined"
                />
            ),
        },
        { label: "Last Login", value: (row) => formatDate(row.lastLogin) },
        { label: "Batches", value: (row) => row.batchNames?.join(", ") || row.batches },
        { label: "Attendance", value: "attendanceSessions" },
        { label: "Assignments", value: "assignmentsCreated" },
        { label: "Quizzes", value: "quizzesCreated" },
        { label: "Announcements", value: "announcementsSent" },
        { label: "Project Reviews", value: "projectReviews" },
    ];

    const studentColumns = [
        { label: "Student", value: "name" },
        { label: "Username", value: "username" },
        { label: "Class", value: (row) => `${row.class || "-"} ${row.section || ""}`.trim() },
        {
            label: "Status",
            value: "status",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status}
                    color={row.status === "Active" ? "success" : "error"}
                    variant="outlined"
                />
            ),
        },
        { label: "Last Login", value: (row) => formatDate(row.lastLogin) },
        { label: "Attendance", value: (row) => `${row.attendancePercent}%` },
        { label: "Assignments", value: "assignmentSubmissions" },
        { label: "Quiz Attempts", value: "quizAttempts" },
        { label: "Projects", value: "projectSubmissions" },
        { label: "Course Progress", value: (row) => `${row.averageProgress}%` },
    ];

    const batchColumns = [
        { label: "Batch", value: "name" },
        { label: "Students", value: "students" },
        { label: "Teachers", value: "teachers" },
        { label: "Courses", value: "courses" },
        { label: "Attendance", value: (row) => `${row.attendancePercent}%` },
        { label: "Assignments", value: "assignments" },
        { label: "Submissions", value: "submissions" },
        { label: "Quizzes", value: "quizzes" },
        { label: "Quiz Attempts", value: "quizAttempts" },
    ];

    const activeColumns = activeTab === 0 ? teacherColumns : activeTab === 1 ? studentColumns : batchColumns;
    const activeTitle = activeTab === 0 ? "Teacher Usage" : activeTab === 1 ? "Student Usage" : "Batch Usage";
    const activeFile = activeTab === 0 ? "teacher-usage.csv" : activeTab === 1 ? "student-usage.csv" : "batch-usage.csv";

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A" }}>
                    School Usage Analytics
                </Typography>
                <Typography color="text.secondary">
                    Usage signals from logins, attendance, assignments, quizzes, projects, announcements, and course progress.
                </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Students"
                        value={overview.students}
                        helper={`${overview.activeStudents} active, ${overview.inactiveStudents} inactive`}
                        icon={School}
                        color="#1976D2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Teachers"
                        value={overview.teachers}
                        helper={`${overview.activeTeachers} active, ${overview.inactiveTeachers} inactive`}
                        icon={Person}
                        color="#2E7D32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Learning Activity"
                        value={overview.quizAttempts + overview.assignmentSubmissions}
                        helper={`${overview.quizAttempts} quiz attempts, ${overview.assignmentSubmissions} submissions`}
                        icon={AssignmentTurnedIn}
                        color="#7B1FA2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Batches"
                        value={overview.batches}
                        helper={`${overview.averageAttendance}% average attendance`}
                        icon={Groups}
                        color="#ED6C02"
                    />
                </Grid>
            </Grid>

            {aiUsage && (
                <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", md: "center" },
                            flexDirection: { xs: "column", md: "row" },
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                AI Message Usage
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ChatPDF messages used by your school during the current month.
                            </Typography>
                        </Box>
                        <Chip
                            icon={<AutoAwesome />}
                            label={`${aiUsage.plan?.usedCalls || 0} messages used`}
                            color={
                                aiUsage.plan?.alertLevel === "critical"
                                    ? "error"
                                    : aiUsage.plan?.alertLevel === "high"
                                      ? "warning"
                                      : "success"
                            }
                        />
                    </Box>
                    {aiUsage.plan?.scope === "platform" && (
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(Number(aiUsage.plan?.usagePercent || 0), 100)}
                            color={
                                aiUsage.plan?.alertLevel === "critical"
                                    ? "error"
                                    : aiUsage.plan?.alertLevel === "high"
                                      ? "warning"
                                      : "success"
                            }
                            sx={{ height: 10, borderRadius: 8, mb: 2 }}
                        />
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <StatCard
                                title="AI Messages Used"
                                value={aiUsage.plan?.usedCalls || 0}
                                helper={`${aiUsage.totals?.successful || 0} successful, ${aiUsage.totals?.failed || 0} failed`}
                                icon={AutoAwesome}
                                color="#7B1FA2"
                            />
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: "grid", gap: 1 }}>
                                {(aiUsage.byFeature || []).slice(0, 5).map((feature) => (
                                    <Box
                                        key={feature._id}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            p: 1.25,
                                            bgcolor: "#F8FAFC",
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {String(feature._id || "Other").replace(/_/g, " ")}
                                        </Typography>
                                        <Typography variant="body2">
                                            {feature.calls} messages
                                        </Typography>
                                    </Box>
                                ))}
                                {!aiUsage.byFeature?.length && (
                                    <Typography variant="body2" color="text.secondary">
                                        AI usage will appear after the next generation request.
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            Academic Signals
                        </Typography>
                        {[
                            { label: "Average attendance", value: overview.averageAttendance, suffix: "%" },
                            { label: "Average course progress", value: overview.averageProgress, suffix: "%" },
                            { label: "Projects waiting review", value: overview.projectsWaitingReview, suffix: "", progress: false },
                        ].map(({ label, value, suffix, progress = true }) => (
                            <Box key={label} sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="body2">{value}{suffix}</Typography>
                                </Box>
                                {progress ? (
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(Number(value) || 0, 100)}
                                        sx={{ height: 8, borderRadius: 8 }}
                                    />
                                ) : (
                                    <Box sx={{ height: 8, borderRadius: 8, bgcolor: "#F1F5F9" }} />
                                )}
                            </Box>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            Content Created
                        </Typography>
                        <Grid container spacing={1.5}>
                            {[
                                ["Assignments", overview.assignments],
                                ["Quizzes", overview.quizzes],
                                ["Projects", overview.projectSubmissions],
                                ["Announcements", overview.announcements],
                            ].map(([label, value]) => (
                                <Grid item xs={6} key={label}>
                                    <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {value}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {label}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ mb: 2, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, nextTab) => {
                        setActiveTab(nextTab);
                        setSearch("");
                        setStatus("all");
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<BarChart />} iconPosition="start" label="Teachers" />
                    <Tab icon={<School />} iconPosition="start" label="Students" />
                    <Tab icon={<Groups />} iconPosition="start" label="Batches" />
                </Tabs>
            </Paper>

            <AnalyticsTable
                title={activeTitle}
                rows={filteredRows}
                columns={activeColumns}
                filename={activeFile}
                search={search}
                setSearch={setSearch}
                status={activeTab === 2 ? undefined : status}
                setStatus={setStatus}
            />

            <Snackbar open={Boolean(error)} autoHideDuration={3000} onClose={() => setError("")}>
                <Alert severity="error" onClose={() => setError("")}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AnalyticsDashboard;
