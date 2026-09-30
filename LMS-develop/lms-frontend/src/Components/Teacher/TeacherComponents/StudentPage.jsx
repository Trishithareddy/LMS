import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Avatar,
    Stack,
    CircularProgress,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { useTheme } from "@mui/material/styles";

const summaryCardStyles = {
    p: 2.25,
    borderRadius: 3,
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: 2,
};

export default function StudentPage() {
    const [batches, setBatches] = useState([]);
    const [search, setSearch] = useState("");
    const [viewFilter, setViewFilter] = useState("all");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const theme = useTheme();

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Students", path: "/teacher-dashboard/students" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/allBatches`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            setBatches(res.data?.teacher?.batches || []);
        } catch (error) {
            console.error("Error fetching batches:", error);
        } finally {
            setLoading(false);
        }
    };

    const summary = useMemo(() => {
        const totalStudents = batches.reduce(
            (count, batch) => count + (batch.students?.length || 0),
            0,
        );
        const totalCourses = batches.reduce(
            (count, batch) => count + (batch.courses?.length || 0),
            0,
        );
        const emptyBatches = batches.filter(
            (batch) => (batch.students?.length || 0) === 0,
        ).length;

        return {
            totalBatches: batches.length,
            totalStudents,
            totalCourses,
            emptyBatches,
        };
    }, [batches]);

    const filtered = useMemo(() => {
        return batches.filter((batch) => {
            const studentCount = batch.students?.length || 0;
            const matchesSearch = batch.batchName
                .toLowerCase()
                .includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (viewFilter === "empty") {
                return studentCount === 0;
            }

            if (viewFilter === "active") {
                return studentCount > 0;
            }

            return true;
        });
    }, [batches, search, viewFilter]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <CircularProgress />
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
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    p: { xs: 2, md: 3 },
                }}
            >
                <Typography
                    sx={{
                        fontSize: { xs: 28, md: 36 },
                        fontWeight: 700,
                        color: "text.primary",
                    }}
                >
                    Students
                </Typography>
                <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 15 }}>
                    Track batches, spot empty groups quickly, and open student rosters without bouncing across modules.
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={3}>
                        <Box sx={summaryCardStyles}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: "#dcfce7", color: "#166534" }}>
                                    <GroupsIcon />
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.6 }}>
                                        Total Batches
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                        {summary.totalBatches}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={summaryCardStyles}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: "#dbeafe", color: "#1d4ed8" }}>
                                    <PersonOutlineIcon />
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: 12, color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.6 }}>
                                        Total Students
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                        {summary.totalStudents}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={summaryCardStyles}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: "#fef3c7", color: "#b45309" }}>
                                    <SchoolIcon />
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: 12, color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.6 }}>
                                        Linked Courses
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                        {summary.totalCourses}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={summaryCardStyles}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: "#fee2e2", color: "#b91c1c" }}>
                                    <QuizIcon />
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: 12, color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.6 }}>
                                        Empty Batches
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                        {summary.emptyBatches}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                }}
            >
                <TextField
                    placeholder="Search batch by name..."
                    fullWidth
                    sx={{
                        maxWidth: { md: 500 },
                        bgcolor: "background.paper",
                        borderRadius: 3,
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <ToggleButtonGroup
                    value={viewFilter}
                    exclusive
                    onChange={(_, nextValue) => {
                        if (nextValue) setViewFilter(nextValue);
                    }}
                    size="small"
                    sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        "& .MuiToggleButton-root": {
                            borderRadius: "999px !important",
                            borderColor: "divider !important",
                            bgcolor: "background.paper",
                            color: "text.primary",

                            "&.Mui-selected": {
                                bgcolor: "primary.main",
                                color: "#fff",
                            },

                            "&:hover": {
                                bgcolor: "action.hover",
                            },
                            px: 2,
                            textTransform: "none",
                            fontWeight: 600,
                        },
                    }}
                >
                    <ToggleButton value="all">All Batches</ToggleButton>
                    <ToggleButton value="active">With Students</ToggleButton>
                    <ToggleButton value="empty">Needs Setup</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={3}>
                {filtered.map((batch) => {
                    const studentCount = batch.students?.length || 0;
                    const courseCount = batch.courses?.length || 0;
                    const teacherCount = batch.teachers?.length || 0;

                    return (
                        <Grid item xs={12} sm={6} xl={4} key={batch._id}>
                            <Card
                                onClick={() =>
                                    navigate("/teacher-dashboard/student-list", {
                                        state: {
                                            batchId: batch._id,
                                            batchName: batch.batchName,
                                        },
                                    })
                                }
                                sx={{
                                    cursor: "pointer",
                                    borderRadius: 4,
                                    border: 1,
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                    boxShadow: 2,
                                    transition: "all 0.25s ease",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        spacing={2}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    width: 52,
                                                    height: 52,
                                                }}
                                            >
                                                <GroupsIcon />
                                            </Avatar>

                                            <Box>
                                                <Typography fontWeight="700" sx={{ fontSize: 17 }}>
                                                    {batch.batchName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {studentCount} student
                                                    {studentCount !== 1 ? "s" : ""}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Chip
                                            label={studentCount > 0 ? "Active Batch" : "Needs Setup"}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                color: studentCount > 0 ? "success.dark" : "warning.dark",
                                                bgcolor: studentCount > 0 ? "success.light" : "warning.light",
                                            }}
                                        />
                                    </Stack>

                                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                                        <Grid item xs={4}>
                                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "action.hover", }}>
                                                <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                                                    Students
                                                </Typography>
                                                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                                                    {studentCount}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "action.hover", }}>
                                                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                                    Courses
                                                </Typography>
                                                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                                                    {courseCount}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "action.hover", }}>
                                                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                                    Teachers
                                                </Typography>
                                                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                                                    {teacherCount}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Typography sx={{ mt: 2, fontSize: 13, color: "text.secondary" }}>
                                        Open this batch to monitor students, review activity, and jump into individual profiles.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {!filtered.length && (
                <Box
                    sx={{
                        mt: 4,
                        p: 4,
                        borderRadius: 3,
                        border: 1,
                        borderStyle: "dashed",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        textAlign: "center",
                    }}
                >
                    <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                        No batches match this view
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                        Try another filter or search term.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
