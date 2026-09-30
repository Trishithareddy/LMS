import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import QuizIcon from "@mui/icons-material/Quiz";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const getMonthStartDate = () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
};

const TeacherPerformanceOverview = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

    const [fromDate, setFromDate] = useState(getMonthStartDate());
    const [toDate, setToDate] = useState(getTodayDate());

    const [dashboardData, setDashboardData] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const selectedBatch = useMemo(() => {
        return batches.find((batch) => batch._id === selectedBatchId) || null;
    }, [batches, selectedBatchId]);

    const clickableCardSx = {
        height: "100%",
        cursor: "pointer",
        transition: "0.2s ease",
        "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: 4,
        },
    };

    const fetchTeacherBatches = async () => {
        try {
            setLoadingBatches(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getLoggedinTeacher`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const teacherBatches = response.data?.teacher?.batches || [];
            const finalBatches = Array.isArray(teacherBatches)
                ? teacherBatches
                : [];

            setBatches(finalBatches);

            if (finalBatches.length > 0 && !selectedBatchId) {
                setSelectedBatchId(finalBatches[0]._id);
            }
        } catch (error) {
            console.error("Error fetching teacher batches:", error);
            showSnackbar("Failed to fetch teacher batches", "error");
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {
        if (!batchId) {
            setSelectedBatchDetails(null);
            return [];
        }

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getBatchInfo/${batchId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const batchData =
                response.data?.batch ||
                response.data?.data ||
                response.data ||
                null;

            setSelectedBatchDetails(batchData);

            return Array.isArray(batchData?.students)
                ? batchData.students
                : [];
        } catch (error) {
            console.error("Error fetching batch details:", error);
            setSelectedBatchDetails(null);
            showSnackbar("Failed to fetch batch details", "error");
            return [];
        }
    };

    const loadPerformanceDashboard = async () => {
        if (!selectedBatchId) {
            showSnackbar("Please select a batch", "error");
            return;
        }

        if (!fromDate || !toDate) {
            showSnackbar("Please select date range", "error");
            return;
        }

        try {
            setLoadingDashboard(true);

            const students = await fetchBatchDetails(selectedBatchId);

            const normalizedStudents = students
                .map((student) => ({
                    studentId: student._id || student.id || student.studentId,
                    studentName:
                        student.name ||
                        student.studentName ||
                        student.fullName ||
                        "Student",
                    className: student.class || student.grade || "",
                    section: student.section || "",
                }))
                .filter((student) => student.studentId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/performance/batch-dashboard`,
                {
                    batchId: selectedBatchId,
                    from: fromDate,
                    to: toDate,
                    students: normalizedStudents,
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            setDashboardData(response.data);
        } catch (error) {
            console.error("Error loading performance dashboard:", error);
            showSnackbar(
                error.response?.data?.message ||
                    "Failed to load performance dashboard",
                "error"
            );
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        fetchTeacherBatches();
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            loadPerformanceDashboard();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBatchId]);

    const getStatusColor = (status) => {
        if (status === "Excellent") return "success";
        if (status === "Good") return "info";
        if (status === "Needs Attention") return "warning";
        if (status === "Critical") return "error";
        return "default";
    };

    const formatDuration = (secondsOrMinutes) => {
        const value = Number(secondsOrMinutes || 0);

        if (!value) return "-";

        const minutes = Math.round(value / 60);

        if (minutes <= 0) return `${value}s`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) return `${hours}h ${mins}m`;

        return `${minutes}m`;
    };

    const exportStudentPerformanceCSV = () => {
        const students = dashboardData?.studentPerformance || [];

        if (!students.length) {
            showSnackbar("No performance data available to export", "error");
            return;
        }

        const rows = [
            [
                "Student Name",
                "Attendance %",
                "Present",
                "Absent",
                "Late",
                "Assignments Given",
                "Assignments Submitted",
                "Assignments Pending",
                "Reviewed",
                "Needs Correction",
                "Late Submissions",
                "Assignment Avg %",
                "Quiz Attempts",
                "Quiz Avg %",
                "Quiz Passed",
                "Quiz Failed",
                "Status",
            ],
        ];

        students.forEach((student) => {
            rows.push([
                student.studentName || "",
                student.attendance?.percentage || 0,
                student.attendance?.present || 0,
                student.attendance?.absent || 0,
                student.attendance?.late || 0,
                student.assignments?.total || 0,
                student.assignments?.submitted || 0,
                student.assignments?.pending || 0,
                student.assignments?.reviewed || 0,
                student.assignments?.needsCorrection || 0,
                student.assignments?.late || 0,
                student.assignments?.averageMarksPercentage || 0,
                student.quizzes?.attempts || 0,
                student.quizzes?.averagePercentage || 0,
                student.quizzes?.passed || 0,
                student.quizzes?.failed || 0,
                student.status || "",
            ]);
        });

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const safeBatchName = String(selectedBatch?.batchName || "performance")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        link.href = url;
        link.download = `${safeBatchName}_performance_${fromDate}_to_${toDate}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const overview = dashboardData?.overview || {};
    const studentPerformance = dashboardData?.studentPerformance || [];
    const attendanceAnalytics = dashboardData?.attendanceAnalytics || [];
    const assignmentAnalytics = dashboardData?.assignmentAnalytics || [];
    const quizAnalytics = dashboardData?.quizAnalytics || {};

    return (
        <Box sx={{ mt: 3 }}>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Student Performance Overview
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Combined analytics from attendance, assignments, and quizzes.
                </Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Select Batch</InputLabel>
                                <Select
                                    label="Select Batch"
                                    value={selectedBatchId}
                                    onChange={(e) =>
                                        setSelectedBatchId(e.target.value)
                                    }
                                    disabled={loadingBatches}
                                >
                                    {batches.map((batch) => (
                                        <MenuItem
                                            key={batch._id}
                                            value={batch._id}
                                        >
                                            {batch.batchName || "Unnamed Batch"}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                type="date"
                                label="From Date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                type="date"
                                label="To Date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<RefreshIcon />}
                                onClick={loadPerformanceDashboard}
                                disabled={loadingDashboard || !selectedBatchId}
                            >
                                {loadingDashboard ? "Loading..." : "Load"}
                            </Button>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={exportStudentPerformanceCSV}
                                disabled={!studentPerformance.length}
                            >
                                Export CSV
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {loadingDashboard ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 5,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(0)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <GroupsIcon color="primary" />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Total Students
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.totalStudents || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(1)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <FactCheckIcon color="success" />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Average Attendance
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        color="success.main"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.averageAttendance || 0}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(2)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <AssignmentTurnedInIcon color="info" />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Assignments Given
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.assignmentsGiven || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(3)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <QuizIcon color="secondary" />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Quiz Attempts
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.quizAttempts || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(2)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Submissions Received
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.totalSubmissions || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(2)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Pending Reviews
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        color="warning.main"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.pendingReviews || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(2)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Average Assignment Marks
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        color="info.main"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.averageAssignmentMarks || 0}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Card
                                onClick={() => setActiveTab(0)}
                                sx={clickableCardSx}
                            >
                                <CardContent>
                                    <WarningAmberIcon color="warning" />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Needs Attention
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        color="warning.main"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {overview.needsAttentionStudents || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Paper variant="outlined" sx={{ mb: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={(event, newValue) =>
                                setActiveTab(newValue)
                            }
                            indicatorColor="success"
                            textColor="success"
                            variant="fullWidth"
                        >
                            <Tab label="Student-wise Performance" />
                            <Tab label="Attendance Analytics" />
                            <Tab label="Assignment Analytics" />
                            <Tab label="Quiz Analytics" />
                        </Tabs>
                    </Paper>

                    {activeTab === 0 && (
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                >
                                    Student-wise Performance
                                </Typography>

                                {!studentPerformance.length ? (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        <Typography color="text.secondary">
                                            No student performance data
                                            available.
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <TableContainer
                                        component={Paper}
                                        variant="outlined"
                                    >
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        Student
                                                    </TableCell>
                                                    <TableCell>
                                                        Attendance
                                                    </TableCell>
                                                    <TableCell>
                                                        Present
                                                    </TableCell>
                                                    <TableCell>
                                                        Absent
                                                    </TableCell>
                                                    <TableCell>Late</TableCell>
                                                    <TableCell>
                                                        Assignments
                                                    </TableCell>
                                                    <TableCell>
                                                        Pending
                                                    </TableCell>
                                                    <TableCell>
                                                        Assignment Avg
                                                    </TableCell>
                                                    <TableCell>
                                                        Quiz Avg
                                                    </TableCell>
                                                    <TableCell>
                                                        Status
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {studentPerformance.map(
                                                    (student) => (
                                                        <TableRow
                                                            key={
                                                                student.studentId
                                                            }
                                                        >
                                                            <TableCell>
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {
                                                                        student.studentName
                                                                    }
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .attendance
                                                                    ?.percentage ||
                                                                    0}
                                                                %
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .attendance
                                                                    ?.present ||
                                                                    0}
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .attendance
                                                                    ?.absent ||
                                                                    0}
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .attendance
                                                                    ?.late || 0}
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .assignments
                                                                    ?.submitted ||
                                                                    0}
                                                                /
                                                                {student
                                                                    .assignments
                                                                    ?.total || 0}
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .assignments
                                                                    ?.pending ||
                                                                    0}
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .assignments
                                                                    ?.averageMarksPercentage ||
                                                                    0}
                                                                %
                                                            </TableCell>

                                                            <TableCell>
                                                                {student
                                                                    .quizzes
                                                                    ?.averagePercentage ||
                                                                    0}
                                                                %
                                                            </TableCell>

                                                            <TableCell>
                                                                <Chip
                                                                    label={
                                                                        student.status
                                                                    }
                                                                    color={getStatusColor(
                                                                        student.status
                                                                    )}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 1 && (
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                >
                                    Attendance Analytics
                                </Typography>

                                {!attendanceAnalytics.length ? (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        <Typography color="text.secondary">
                                            No attendance records available.
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <TableContainer
                                        component={Paper}
                                        variant="outlined"
                                    >
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Total</TableCell>
                                                    <TableCell>
                                                        Present
                                                    </TableCell>
                                                    <TableCell>
                                                        Absent
                                                    </TableCell>
                                                    <TableCell>Late</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {attendanceAnalytics.map(
                                                    (record) => (
                                                        <TableRow
                                                            key={record.date}
                                                        >
                                                            <TableCell>
                                                                {record.date}
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.total}
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.present}
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.absent}
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.late}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 2 && (
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                >
                                    Assignment Analytics
                                </Typography>

                                {!assignmentAnalytics.length ? (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        <Typography color="text.secondary">
                                            No assignment records available.
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <TableContainer
                                        component={Paper}
                                        variant="outlined"
                                    >
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        Assignment
                                                    </TableCell>
                                                    <TableCell>Tool</TableCell>
                                                    <TableCell>
                                                        Submitted
                                                    </TableCell>
                                                    <TableCell>
                                                        Pending
                                                    </TableCell>
                                                    <TableCell>
                                                        Reviewed
                                                    </TableCell>
                                                    <TableCell>
                                                        Needs Correction
                                                    </TableCell>
                                                    <TableCell>Late</TableCell>
                                                    <TableCell>
                                                        Avg Marks
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {assignmentAnalytics.map(
                                                    (record) => (
                                                        <TableRow
                                                            key={
                                                                record.assignmentId
                                                            }
                                                        >
                                                            <TableCell>
                                                                {record.title}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    record.softwareTool
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    record.submitted
                                                                }
                                                                /
                                                                {
                                                                    record.totalStudents
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.pending}
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.reviewed}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    record.needsCorrection
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {record.late}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    record.averageMarks
                                                                }
                                                                /
                                                                {record.maxMarks}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 3 && (
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                >
                                    Quiz Analytics
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Total Attempts
                                                </Typography>
                                                <Typography
                                                    variant="h5"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {quizAnalytics.totalAttempts ||
                                                        0}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Passed
                                                </Typography>
                                                <Typography
                                                    variant="h5"
                                                    color="success.main"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {quizAnalytics.passed || 0}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Failed
                                                </Typography>
                                                <Typography
                                                    variant="h5"
                                                    color="error.main"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {quizAnalytics.failed || 0}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Average Quiz %
                                                </Typography>
                                                <Typography
                                                    variant="h5"
                                                    color="info.main"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {quizAnalytics.averagePercentage ||
                                                        0}
                                                    %
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                backgroundColor: "#fafafa",
                                            }}
                                        >
                                            <Typography variant="body2">
                                                Average Duration:{" "}
                                                <b>
                                                    {formatDuration(
                                                        quizAnalytics.averageDuration
                                                    )}
                                                </b>
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </Box>
    );
};

export default TeacherPerformanceOverview;