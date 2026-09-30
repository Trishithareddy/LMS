import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { CheckCircle2, Clock3, UserX, CalendarDays } from "lucide-react";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { useTheme, alpha } from "@mui/material/styles";

const statusConfig = {
    present: { label: "Present", color: "success" },
    absent: { label: "Absent", color: "error" },
    late: { label: "Late", color: "warning" },
};

const SummaryCard = ({ icon, value, label }) => (
    <Card
        sx={{
            borderRadius: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            height: "100%",
        }}
    >
        <CardContent>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                <Typography
                    variant="h3"
                    fontWeight={900}
                    color="text.primary"
                >
                    {value}
                </Typography>

                <Box sx={{ color: "primary.main" }}>
                    {icon}
                </Box>
            </Box>

            <Typography
                color="text.secondary"
                fontWeight={700}
            >
                {label}
            </Typography>
        </CardContent>
    </Card>
);

function StudentAttendance() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attendanceData, setAttendanceData] = useState(null);
    const theme = useTheme();
    const dark = theme.palette.mode === "dark";

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Attendance", path: "/student-dashboard/attendance" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        const fetchAttendanceSummary = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/attendance/summary`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setAttendanceData(response.data);
                setError("");
            } catch (err) {
                console.error(err);
                setError(
                    err.response?.data?.message ||
                    "Could not load attendance details right now."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceSummary();
    }, []);

    const summary = attendanceData?.summary || {};
    const todayStatus = attendanceData?.todayStatus || null;
    const batchSummary = attendanceData?.batchSummary || [];
    const history = attendanceData?.history || [];

    const attendanceTone = useMemo(() => {
        const value = summary.attendancePercentage || 0;
        if (value >= 90) return "#ecfdf3";
        if (value >= 75) return "#eff6ff";
        return "#fff7ed";
    }, [summary.attendancePercentage]);

    if (loading) {
        return (
            <Container
                sx={{
                    minHeight: "50vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
            <Box
                sx={{
                    borderRadius: 4,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                    p: { xs: 2.5, md: 3.5 },
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Attendance Overview
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                    Track your marked classes, today's status, and recent attendance history.
                </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        value={`${summary.attendancePercentage || 0}%`}
                        label="Attendance Percentage"
                        tone={attendanceTone}
                        icon={<CheckCircle2 size={22} color="#15803d" />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        value={summary.attended || 0}
                        label="Classes Attended"
                        tone="#ecfeff"
                        icon={<CalendarDays size={22} color="#0f766e" />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        value={summary.late || 0}
                        label="Late Marks"
                        tone="#fff7ed"
                        icon={<Clock3 size={22} color="#c2410c" />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        value={summary.absent || 0}
                        label="Absences"
                        tone="#fef2f2"
                        icon={<UserX size={22} color="#b91c1c" />}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={4}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid rgba(17, 24, 39, 0.06)",
                            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
                            height: "100%",
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                                Today's Attendance
                            </Typography>
                            {todayStatus ? (
                                <Stack spacing={1.5}>
                                    <Chip
                                        label={statusConfig[todayStatus.status]?.label || todayStatus.status}
                                        color={statusConfig[todayStatus.status]?.color || "default"}
                                        sx={{ alignSelf: "flex-start" }}
                                    />
                                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                                        {todayStatus.batchName || "Current Batch"}
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                        {todayStatus.className}
                                        {todayStatus.className && todayStatus.section ? " - " : ""}
                                        {todayStatus.section}
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                                        Marked by {todayStatus.markedBy === "system" ? "auto attendance" : "teacher"}
                                    </Typography>
                                </Stack>
                            ) : (
                                <Typography sx={{ color: "text.secondary" }}>
                                    No attendance has been marked for you today yet.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid rgba(17, 24, 39, 0.06)",
                            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
                            height: "100%",
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Batch-wise Attendance
                            </Typography>
                            {!batchSummary.length ? (
                                <Typography sx={{ color: "text.secondary" }}>
                                    Your attendance batches will appear here once records are marked.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {batchSummary.map((batch) => (
                                        <Grid item xs={12} sm={6} key={`${batch.batchId}-${batch.batchName}`}>
                                            <Box
                                                sx={{
                                                    borderRadius: 3,
                                                    bgcolor: "background.default",
                                                    border: 1,
                                                    borderColor: "divider",
                                                    p: 2,
                                                }}
                                            >
                                                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                                                    {batch.batchName}
                                                </Typography>
                                                <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.5 }}>
                                                    {batch.percentage}% attendance across {batch.total} classes
                                                </Typography>
                                                <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                    <Chip size="small" label={`Present ${batch.present}`} color="success" variant="outlined" />
                                                    <Chip size="small" label={`Late ${batch.late}`} color="warning" variant="outlined" />
                                                    <Chip size="small" label={`Absent ${batch.absent}`} color="error" variant="outlined" />
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card
                sx={{
                    mt: 3,
                    borderRadius: 4,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
                }}
            >
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Recent Attendance History
                    </Typography>
                    {!history.length ? (
                        <Typography sx={{ color: "text.secondary" }}>
                            No attendance history is available yet.
                        </Typography>
                    ) : (
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                bgcolor: "background.paper",
                                border: 1,
                                borderColor: "divider",
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow
                                        sx={{
                                            bgcolor: "background.default",

                                            "& th": {
                                                color: "text.primary",
                                                fontWeight: 700,
                                            }
                                        }}
                                    >
                                        <TableCell>Date</TableCell>
                                        <TableCell>Batch</TableCell>
                                        <TableCell>Class</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Marked By</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>{item.batchName}</TableCell>
                                            <TableCell>
                                                {item.className}
                                                {item.className && item.section ? " - " : ""}
                                                {item.section}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={statusConfig[item.status]?.label || item.status}
                                                    color={statusConfig[item.status]?.color || "default"}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {item.markedBy === "system"
                                                    ? "Auto attendance"
                                                    : "Teacher"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}

export default StudentAttendance;
