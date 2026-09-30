import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import {
    Add,
    AssignmentInd,
    CheckCircle,
    Groups,
    ManageAccounts,
    School,
    SettingsSuggest,
    WarningAmber,
} from "@mui/icons-material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";

const IssueRow = ({ title, count, action, severity = "warning" }) => {
    const color = severity === "error" ? "#D32F2F" : "#ED6C02";

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                py: 1.5,
                borderBottom: "1px solid #EEF2F7",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: `${color}16`, color }}>
                    <WarningAmber fontSize="small" />
                </Avatar>
                <Box>
                    <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {count} item{count === 1 ? "" : "s"} need admin attention
                    </Typography>
                </Box>
            </Box>
            <Button size="small" variant="outlined" onClick={action}>
                Resolve
            </Button>
        </Box>
    );
};

const MetricCard = ({ label, value, helper, icon: Icon, color }) => (
    <Card sx={{ height: "100%", borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                        {label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: "#0F172A" }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {helper}
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}16`, color, width: 46, height: 46 }}>
                    <Icon />
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

const BatchOpsCard = ({ batch }) => {
    const setupScore =
        [batch.students > 0, batch.teachers > 0, batch.courses > 0].filter(Boolean).length *
        33.33;

    return (
        <Paper
            sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                height: "100%",
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Box>
                    <Typography sx={{ fontWeight: 900 }}>{batch.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {batch.students} students · {batch.teachers} teachers · {batch.courses} courses
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={setupScore >= 99 ? "Ready" : "Setup needed"}
                    color={setupScore >= 99 ? "success" : "warning"}
                    variant="outlined"
                />
            </Box>
            <LinearProgress
                variant="determinate"
                value={Math.min(setupScore, 100)}
                sx={{ mt: 2, height: 8, borderRadius: 8 }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                <Chip size="small" label={batch.teachers ? "Teacher assigned" : "No teacher"} />
                <Chip size="small" label={batch.students ? "Students assigned" : "No students"} />
                <Chip size="small" label={batch.courses ? "Course assigned" : "No course"} />
            </Stack>
        </Paper>
    );
};

const DashboardOverview = ({ onViewChange }) => {
    const [schoolAdminData, setSchoolAdminData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            try {
                const [adminResponse, analyticsResponse] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/school-admin/get-logged-school-admin`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.get(`${import.meta.env.VITE_API_URL}/school-admin/analytics`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                setSchoolAdminData(adminResponse.data.schoolAdmin);
                setAnalytics(analyticsResponse.data.analytics);
            } catch (error) {
                console.error("Error fetching school control center:", error);
                setSnackbarMessage("Something went wrong. Please try again later");
                setSnackbarSeverity("error");
                setOpenSnackbar(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const issues = analytics?.setupIssues;
    const overview = analytics?.overview;

    const actionItems = useMemo(() => {
        if (!issues) return [];
        return [
            {
                title: "Students without batch",
                count: issues.unassignedStudents?.length || 0,
                action: () => onViewChange?.("students"),
            },
            {
                title: "Teachers without batch",
                count: issues.unassignedTeachers?.length || 0,
                action: () => onViewChange?.("teachers"),
            },
            {
                title: "Batches without teacher",
                count: issues.batchesWithoutTeachers?.length || 0,
                action: () => onViewChange?.("batches"),
            },
            {
                title: "Batches without course",
                count: issues.batchesWithoutCourses?.length || 0,
                action: () => onViewChange?.("batches"),
            },
        ].filter((item) => item.count > 0);
    }, [issues, onViewChange]);

    if (isLoading) {
        return (
            <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    border: "1px solid #D8F3DF",
                    bgcolor: "#F4FFF7",
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Typography variant="overline" sx={{ color: "#0B7A33", fontWeight: 900 }}>
                            School Control Center
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", mb: 1 }}>
                            {schoolAdminData?.school?.name || analytics?.school?.name || "School Admin"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                            Keep the school setup clean: students in batches, teachers assigned, batches connected to courses,
                            and inactive accounts visible.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                            <Button variant="contained" startIcon={<Add />} onClick={() => onViewChange?.("students")}>
                                Add Student
                            </Button>
                            <Button variant="outlined" startIcon={<ManageAccounts />} onClick={() => onViewChange?.("teachers")}>
                                Manage Teachers
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <MetricCard
                        label="Setup Issues"
                        value={overview?.setupIssues ?? 0}
                        helper="batch and assignment gaps"
                        icon={SettingsSuggest}
                        color="#D32F2F"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MetricCard
                        label="Students"
                        value={overview?.students ?? 0}
                        helper={`${overview?.activeStudents ?? 0} active`}
                        icon={School}
                        color="#1976D2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MetricCard
                        label="Teachers"
                        value={overview?.teachers ?? 0}
                        helper={`${overview?.activeTeachers ?? 0} active`}
                        icon={AssignmentInd}
                        color="#2E7D32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MetricCard
                        label="Batches"
                        value={overview?.batches ?? 0}
                        helper={`${overview?.averageAttendance ?? 0}% avg attendance`}
                        icon={Groups}
                        color="#ED6C02"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={5}>
                    <Card sx={{ height: "100%", borderRadius: 2, border: "1px solid #E5E7EB" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                    Action Required
                                </Typography>
                                <Chip
                                    size="small"
                                    label={actionItems.length ? `${actionItems.length} sections` : "All clear"}
                                    color={actionItems.length ? "warning" : "success"}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                These are operational gaps a school admin can actually fix.
                            </Typography>
                            <Divider />
                            {actionItems.length ? (
                                actionItems.map((item) => (
                                    <IssueRow
                                        key={item.title}
                                        title={item.title}
                                        count={item.count}
                                        action={item.action}
                                    />
                                ))
                            ) : (
                                <Box sx={{ py: 4, textAlign: "center" }}>
                                    <CheckCircle sx={{ color: "#2E7D32", fontSize: 44, mb: 1 }} />
                                    <Typography sx={{ fontWeight: 900 }}>School setup looks clean</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        No missing batch, teacher, or course assignments found.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={7}>
                    <Card sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                        Batch Readiness
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Quick scan of whether each batch has students, teachers, and courses.
                                    </Typography>
                                </Box>
                                <Button size="small" onClick={() => onViewChange?.("batches")}>
                                    View Batches
                                </Button>
                            </Box>
                            <Grid container spacing={2}>
                                {(analytics?.batches || []).slice(0, 4).map((batch) => (
                                    <Grid item xs={12} md={6} key={batch.id}>
                                        <BatchOpsCard batch={batch} />
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ mt: 3, p: 2.5, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                    Quick Operations
                </Typography>
                <Grid container spacing={1.5}>
                    {[
                        ["Manage Students", "students"],
                        ["Manage Teachers", "teachers"],
                        ["Open Batches", "batches"],
                        ["Usage Reports", "analytics"],
                    ].map(([label, view]) => (
                        <Grid item xs={12} sm={6} md={3} key={label}>
                            <Button fullWidth variant="outlined" onClick={() => onViewChange?.(view)}>
                                {label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
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
        </Box>
    );
};

export default DashboardOverview;
