import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    MenuItem,
    Paper,
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
} from "@mui/material";
import {
    Assessment,
    Download,
    Groups,
    Insights,
    LocalActivity,
    ManageAccounts,
    Print,
    QueryStats,
    School,
} from "@mui/icons-material";
import axios from "axios";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { BreadcrumbContext } from "../BreadcrumbContext";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const todayInput = () => new Date().toISOString().slice(0, 10);

const thirtyDaysAgoInput = () => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date.toISOString().slice(0, 10);
};

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
                .map((column) => csvEscape(typeof column.value === "function" ? column.value(row) : row[column.value]))
                .join(",")
        )
        .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const safeRows = (rows) => (Array.isArray(rows) ? rows : []);

const StatCard = ({ icon: Icon, label, value, helper, color, bg }) => (
    <Paper sx={{ p: 2.25, height: "100%", borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: bg }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: "#fff", display: "grid", placeItems: "center", color }}>
                <Icon />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 34, lineHeight: 1, color: "#0F172A" }}>{value}</Typography>
        </Stack>
        <Typography sx={{ mt: 2, fontWeight: 900, color: "#334155" }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>{helper}</Typography>
    </Paper>
);

const ChartCard = ({ title, subtitle, children }) => (
    <Paper sx={{ p: 2, height: 360, borderRadius: 2, border: "1px solid #E2E8F0" }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{subtitle}</Typography>}
        <Box sx={{ height: 285 }}>{children}</Box>
    </Paper>
);

const ReportTable = ({ title, rows, columns, filename }) => (
    <Paper sx={{ borderRadius: 2, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ p: 2 }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">{rows.length} records</Typography>
            </Box>
            <Button variant="outlined" startIcon={<Download />} onClick={() => downloadCsv(filename, columns, rows)}>
                Export CSV
            </Button>
        </Stack>
        <TableContainer sx={{ maxHeight: 480 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.label} sx={{ bgcolor: "#F8FAFC", fontWeight: 900 }}>{column.label}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id || row.name} hover>
                            {columns.map((column) => (
                                <TableCell key={column.label}>
                                    {column.render ? column.render(row) : typeof column.value === "function" ? column.value(row) : row[column.value]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {!rows.length && (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>No records for this report.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);

const COLORS = ["#16A34A", "#2563EB", "#F97316", "#9333EA", "#DC2626", "#0F766E"];

const SchoolUsageReports = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [schools, setSchools] = useState([]);
    const [schoolId, setSchoolId] = useState("");
    const [startDate, setStartDate] = useState(thirtyDaysAgoInput());
    const [endDate, setEndDate] = useState(todayInput());
    const [report, setReport] = useState(null);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState("");
    const [tab, setTab] = useState(0);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "School Reports", path: "/admin-dashboard/school-usage-reports" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        const fetchSchools = async () => {
            setLoadingSchools(true);
            setError("");
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllSchools`, { headers: authHeader() });
                const list = safeRows(response.data);
                setSchools(list);
                if (list[0]?._id) setSchoolId(list[0]._id);
            } catch (err) {
                console.error("Error loading schools:", err);
                setError("Unable to load schools for reports.");
            } finally {
                setLoadingSchools(false);
            }
        };
        fetchSchools();
    }, []);

    const fetchReport = async () => {
        if (!schoolId) return;
        setLoadingReport(true);
        setError("");
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/school-usage-report`, {
                headers: authHeader(),
                params: { schoolId, startDate, endDate },
            });
            setReport(response.data.report);
        } catch (err) {
            console.error("Error loading school usage report:", err);
            setError(err.response?.data?.message || "Unable to load this school report.");
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (schoolId) fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schoolId]);

    const overview = report?.overview || {};
    const charts = report?.charts || {};
    const students = safeRows(report?.students);
    const teachers = safeRows(report?.teachers);
    const batches = safeRows(report?.batches);
    const insights = safeRows(report?.insights);
    const notes = safeRows(report?.notes);
    const aiRows = safeRows(charts.aiByFeature);

    const activityTrend = useMemo(() => safeRows(charts.activityTrend).map((item) => ({
        ...item,
        dateLabel: new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    })), [charts.activityTrend]);

    const classUsage = useMemo(() => safeRows(charts.classUsage).slice(0, 12), [charts.classUsage]);
    const teacherWorkload = useMemo(() => safeRows(charts.teacherWorkload).slice(0, 12), [charts.teacherWorkload]);
    const batchEngagement = useMemo(() => safeRows(charts.batchEngagement).slice(0, 12), [charts.batchEngagement]);

    const tableConfig = [
        {
            label: "Teachers",
            rows: teachers,
            filename: "teacher-usage-report.csv",
            columns: [
                { label: "Name", value: "name" },
                { label: "Username", value: "username" },
                { label: "Status", value: "status" },
                { label: "Last Login", value: (row) => formatDate(row.lastLogin) },
                { label: "Batches", value: "batches" },
                { label: "Attendance Sessions", value: "attendanceSessions" },
                { label: "Assignments", value: "assignmentsCreated" },
                { label: "Quizzes", value: "quizzesCreated" },
                { label: "Announcements", value: "announcementsSent" },
                { label: "Project Reviews", value: "projectReviews" },
            ],
        },
        {
            label: "Students",
            rows: students,
            filename: "student-usage-report.csv",
            columns: [
                { label: "Name", value: "name" },
                { label: "Username", value: "username" },
                { label: "Class", value: "class" },
                { label: "Section", value: "section" },
                { label: "Status", value: "status" },
                { label: "Last Login", value: (row) => formatDate(row.lastLogin) },
                { label: "Activity Events", value: "activityEvents" },
                { label: "Attendance %", value: "attendancePercent" },
                { label: "Quiz Attempts", value: "quizAttempts" },
                { label: "Assignment Submissions", value: "assignmentSubmissions" },
                { label: "Projects", value: "projectSubmissions" },
                { label: "Avg Progress", value: "averageProgress" },
            ],
        },
        {
            label: "Batches",
            rows: batches,
            filename: "batch-usage-report.csv",
            columns: [
                { label: "Batch", value: "name" },
                { label: "Students", value: "students" },
                { label: "Teachers", value: "teachers" },
                { label: "Courses", value: "courses" },
                { label: "Attendance %", value: "attendancePercent" },
                { label: "Assignments", value: "assignments" },
                { label: "Submissions", value: "submissions" },
                { label: "Quizzes", value: "quizzes" },
                { label: "Quiz Attempts", value: "quizAttempts" },
            ],
        },
    ];

    const activeTable = tableConfig[tab];

    if (loadingSchools) {
        return (
            <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, md: 2.5 }, "@media print": { p: 0 } }}>
            <style>{`
                @media print {
                    .report-controls, .MuiTabs-root, .MuiButton-root { display: none !important; }
                    body { background: white !important; }
                    .report-page { box-shadow: none !important; border: none !important; }
                }
            `}</style>

            <Paper className="report-page" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #DCE7DE" }}>
                <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: "#15803D", fontWeight: 900 }}>Super Admin Analytics</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: 0 }}>School Usage Reports</Typography>
                        <Typography color="text.secondary">Select a school and date range to generate a printable report with usage, activity, and operational insights.</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Chip label={`${schools.length} schools`} variant="outlined" color="success" />
                        {report?.school?.name && <Chip label={report.school.name} sx={{ fontWeight: 800 }} />}
                    </Stack>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper className="report-controls" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField select fullWidth label="School" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
                                {schools.map((school) => (
                                    <MenuItem key={school._id} value={school._id}>{school.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField fullWidth label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField fullWidth label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                                <Button variant="contained" startIcon={<QueryStats />} onClick={fetchReport} disabled={loadingReport || !schoolId}>
                                    Generate
                                </Button>
                                <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={!report}>
                                    Print / Save PDF
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {loadingReport ? (
                    <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : report ? (
                    <>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6} lg={3}>
                                <StatCard icon={School} label="Students Active" value={`${overview.activeStudents || 0}/${overview.students || 0}`} helper="Logged in or active during range" color="#2563EB" bg="#EFF6FF" />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <StatCard icon={ManageAccounts} label="Teachers Active" value={`${overview.activeTeachers || 0}/${overview.teachers || 0}`} helper={`${overview.trackedTeacherEvents || 0} teacher activity events`} color="#7C3AED" bg="#F5F3FF" />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <StatCard icon={Assessment} label="Learning Actions" value={(overview.quizAttempts || 0) + (overview.submissions || 0)} helper={`${overview.quizAttempts || 0} quizzes, ${overview.submissions || 0} submissions`} color="#EA580C" bg="#FFF7ED" />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <StatCard icon={LocalActivity} label="AI Usage" value={overview.aiMessages || 0} helper="Tracked AIRA/API messages" color="#15803D" bg="#ECFDF3" />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} lg={8}>
                                <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                        <Insights sx={{ color: "#15803D" }} />
                                        <Box>
                                            <Typography variant="h5" sx={{ fontWeight: 900 }}>Useful Insights</Typography>
                                            <Typography variant="body2" color="text.secondary">Signals operations can share with the school.</Typography>
                                        </Box>
                                    </Stack>
                                    <Grid container spacing={1.5}>
                                        {(insights.length ? insights : ["No major risk signals found for this date range."]).map((item) => (
                                            <Grid item xs={12} md={6} key={item}>
                                                <Alert severity={insights.length ? "warning" : "success"} sx={{ borderRadius: 2 }}>{item}</Alert>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {notes.length > 0 && (
                                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                                            {notes.join(" ")}
                                        </Alert>
                                    )}
                                </Paper>
                            </Grid>
                            <Grid item xs={12} lg={4}>
                                <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Report Summary</Typography>
                                    <Stack spacing={1} sx={{ mt: 1 }}>
                                        <Chip label={`${overview.batches || 0} batches`} />
                                        <Chip label={`${overview.coursesAssigned || 0} course assignments`} />
                                        <Chip label={`${overview.averageAttendance || 0}% attendance signal`} />
                                        <Chip label={`${overview.averageProgress || 0}% avg course progress`} />
                                        <Chip label={`${overview.trackedQuizMinutes || 0} tracked quiz minutes`} />
                                        <Chip label={`${overview.attendanceLoginCaptures || 0} attendance login captures`} />
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} lg={6}>
                                <ChartCard title="Daily Activity" subtitle="Student and teacher events in the selected range.">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={activityTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="dateLabel" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="students" stroke="#2563EB" strokeWidth={3} name="Students" />
                                            <Line type="monotone" dataKey="teachers" stroke="#16A34A" strokeWidth={3} name="Teachers" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </Grid>
                            <Grid item xs={12} lg={6}>
                                <ChartCard title="Class Usage" subtitle="Top classes by students, active users, and progress.">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={classUsage}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="students" fill="#CBD5E1" name="Students" />
                                            <Bar dataKey="active" fill="#2563EB" name="Active" />
                                            <Bar dataKey="averageProgress" fill="#16A34A" name="Avg progress" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </Grid>
                            <Grid item xs={12} lg={6}>
                                <ChartCard title="Teacher Workload" subtitle="Created work, reviews, and attendance sessions.">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={teacherWorkload} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" width={110} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="work" fill="#2563EB" name="Created work" />
                                            <Bar dataKey="reviews" fill="#F97316" name="Reviews" />
                                            <Bar dataKey="attendance" fill="#16A34A" name="Attendance" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </Grid>
                            <Grid item xs={12} lg={6}>
                                <ChartCard title="Batch Engagement" subtitle="Assignments, submissions, quizzes, and attempts by batch.">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={batchEngagement}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="assignments" stackId="a" fill="#9333EA" name="Assignments" />
                                            <Bar dataKey="submissions" stackId="a" fill="#16A34A" name="Submissions" />
                                            <Bar dataKey="quizzes" stackId="b" fill="#2563EB" name="Quizzes" />
                                            <Bar dataKey="quizAttempts" stackId="b" fill="#F97316" name="Attempts" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </Grid>
                            <Grid item xs={12} lg={4}>
                                <ChartCard title="AI Usage Mix" subtitle="AIRA/API messages by feature.">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={aiRows} dataKey="messages" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={3}>
                                                {aiRows.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </Grid>
                        </Grid>

                        <Paper sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
                            <Tabs value={tab} onChange={(event, value) => setTab(value)} sx={{ px: 2, borderBottom: "1px solid #E2E8F0" }}>
                                {tableConfig.map((item) => <Tab key={item.label} label={item.label} />)}
                            </Tabs>
                            <Box sx={{ p: 2 }}>
                                <ReportTable title={activeTable.label} rows={activeTable.rows} columns={activeTable.columns} filename={activeTable.filename} />
                            </Box>
                        </Paper>
                    </>
                ) : (
                    <Alert severity="info">Select a school and generate a report.</Alert>
                )}
            </Paper>
        </Box>
    );
};

export default SchoolUsageReports;
