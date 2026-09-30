import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Stack,
    Chip,
    CircularProgress,
    Grid,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect as useReactEffect } from "react";
import axios from "axios";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { useTheme } from "@mui/material/styles";

const getDaysSinceLastLogin = (date) => {
    if (!date) return null;
    const diffMs = new Date() - new Date(date);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const formatLastSeen = (date) => {
    if (!date) return "Never";

    const now = new Date();
    const last = new Date(date);

    const diffMs = now - last;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hrs ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return last.toLocaleDateString();
};

const getAttentionState = (student) => {
    const daysSinceLastLogin = getDaysSinceLastLogin(student.lastLogin);

    if (!student.lastLogin || daysSinceLastLogin > 15) {
        return {
            label: "Needs Follow-up",
            tone: "warning",
        };
    }

    if (daysSinceLastLogin > 7) {
        return {
            label: "Inactive This Week",
            tone: "default",
        };
    }

    return {
        label: "On Track",
        tone: "success",
    };
};

export default function StudentList() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const batchId = state?.batchId;
    const batchName = state?.batchName;
    const [students, setStudents] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [viewFilter, setViewFilter] = useState("all");
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    useReactEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Students", path: "/teacher-dashboard/students" },
            {
                name: batchName || "Batch Students",
                path: "/teacher-dashboard/student-list",
            },
        ]);
    }, [batchName, setBreadcrumbTrail]);

    useEffect(() => {
        if (!batchId) {
            navigate("/teacher-dashboard");
            return;
        }
        fetchBatchDetails();
    }, [batchId]);

    const fetchBatchDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getBatchInfo/${batchId}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setStudents(res.data.batch.students || []);
        } catch (err) {
            console.error("Error fetching batch details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (student, tab = "overview") => {
        navigate("/teacher-dashboard/studentDetails", {
            state: {
                studentId: student.studentId || null,
                studentObjectId: student._id || null,
                tab,
            },
        });
    };

    const summary = useMemo(() => {
        const roster = students || [];
        const activeCount = roster.filter(
            (student) => student.status === "Active",
        ).length;
        const noRecentLoginCount = roster.filter((student) => {
            const days = getDaysSinceLastLogin(student.lastLogin);
            return days === null || days > 15;
        }).length;

        return {
            total: roster.length,
            activeCount,
            noRecentLoginCount,
        };
    }, [students]);

    const filteredStudents = useMemo(() => {
        const roster = students || [];
        return roster.filter((student) => {
            const name = student.name || "";
            const username = student.username || "";
            const grade = student.class || "";
            const section = student.section || "";
            const matchesSearch = [name, username, grade, section]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());

            if (!matchesSearch) return false;

            const daysSinceLastLogin = getDaysSinceLastLogin(student.lastLogin);

            if (viewFilter === "active") {
                return student.status === "Active";
            }

            if (viewFilter === "attention") {
                return daysSinceLastLogin === null || daysSinceLastLogin > 15;
            }

            return true;
        });
    }, [search, students, viewFilter]);

    if (loading || students === null) {
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
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    backgroundColor: theme.palette.background.paper,
                    p: { xs: 2, md: 3 },
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                }}
            >
                <Typography
                    sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 700, color: theme.palette.text.primary }}
                >
                    {batchName}
                </Typography>
                <Typography sx={{ mt: 0.5, color: "#6b7280", fontSize: 15 }}>
                    Review student activity and quickly spot who may need a follow-up.
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{
                            p: 2.25, borderRadius: 3, backgroundColor: isDark
                                ? "rgba(34,197,94,0.12)"
                                : "#f0fdf4", border: "1px solid #dcfce7"
                        }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#166534" }}>
                                Students in Batch
                            </Typography>
                            <Typography sx={{ fontSize: 30, fontWeight: 700, color: theme.palette.text.primary, }}>
                                {summary.total}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{
                            p: 2.25, borderRadius: 3, backgroundColor: isDark
                                ? "rgba(59,130,246,0.12)"
                                : "#eff6ff", border: "1px solid #dbeafe"
                        }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#1d4ed8" }}>
                                Active Students
                            </Typography>
                            <Typography sx={{ fontSize: 30, fontWeight: 700, color: theme.palette.text.primary }}>
                                {summary.activeCount}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{
                            p: 2.25, borderRadius: 3, backgroundColor: isDark
                                ? "rgba(249,115,22,0.12)"
                                : "#fff7ed", border: "1px solid #fed7aa"
                        }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#c2410c" }}>
                                Needs Follow-up
                            </Typography>
                            <Typography sx={{ fontSize: 30, fontWeight: 700, color: theme.palette.text.primary }}>
                                {summary.noRecentLoginCount}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: 2,
                    alignItems: { xs: "stretch", lg: "center" },
                    justifyContent: "space-between",
                }}
            >
                <TextField
                    placeholder="Search by student, username, grade, or section..."
                    fullWidth
                    sx={{
                        maxWidth: { lg: 520 },
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 3,
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "#9ca3af" }} />
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
                            border: "1px solid rgba(15, 23, 42, 0.08) !important",
                            px: 2,
                            textTransform: "none",
                            fontWeight: 600,
                        },
                    }}
                >
                    <ToggleButton value="all">All Students</ToggleButton>
                    <ToggleButton value="active">Active</ToggleButton>
                    <ToggleButton value="attention">Needs Attention</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                    overflow: "hidden",
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow
                            sx={{
                                backgroundColor: theme.palette.mode === "dark"
                                    ? theme.palette.grey[900]
                                    : theme.palette.grey[100]
                            }}
                        >
                            <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Last Activity</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Teacher Signal</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                View
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredStudents.map((student) => {
                            const attention = getAttentionState(student);
                            return (
                                <TableRow
                                    key={student._id}
                                    sx={{
                                        "&:hover": {
                                            backgroundColor:
                                                theme.palette.mode === "dark"
                                                    ? "rgba(255,255,255,0.05)"
                                                    : "#fafaf9",
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar sx={{ bgcolor: "#1976d2" }}>
                                                {student.name?.charAt(0)}
                                            </Avatar>

                                            <Box>
                                                <Typography fontWeight="600">
                                                    {student.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {student.username || "-"}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>{student.class || "-"}</TableCell>
                                    <TableCell>{student.section || "-"}</TableCell>

                                    <TableCell>
                                        <Chip
                                            label={student.status || "Inactive"}
                                            color={student.status === "Active" ? "success" : "default"}
                                            size="small"
                                            sx={{ fontWeight: 600, borderRadius: "8px" }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Typography fontWeight="500">
                                            {formatLastSeen(student.lastLogin)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {student.lastLogin
                                                ? "Recent login tracked"
                                                : "No login recorded yet"}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={attention.label}
                                            color={attention.tone}
                                            size="small"
                                            sx={{ fontWeight: 600, borderRadius: "8px" }}
                                        />
                                    </TableCell>

                                    <TableCell align="right">
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            justifyContent="flex-end"
                                        >
                                            <Tooltip title="Student overview" arrow>
                                                <IconButton
                                                    onClick={() => handleView(student, "overview")}
                                                    size="small"
                                                    aria-label={`View ${student.name || "student"} overview`}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        border: "1px solid rgba(25, 118, 210, 0.24)",
                                                        color: "#1976d2",
                                                        backgroundColor: isDark
                                                            ? "rgba(59,130,246,0.12)"
                                                            : "#eff6ff",
                                                        "&:hover": {
                                                            backgroundColor: "#dbeafe",
                                                        },
                                                    }}
                                                >
                                                    <VisibilityOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Learning progress" arrow>
                                                <IconButton
                                                    onClick={() => handleView(student, "progress")}
                                                    size="small"
                                                    aria-label={`View ${student.name || "student"} progress`}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        border: "1px solid rgba(124, 58, 237, 0.22)",
                                                        color: "#6d28d9",
                                                        backgroundColor: "#f5f3ff",
                                                        "&:hover": {
                                                            backgroundColor: "#ede9fe",
                                                        },
                                                    }}
                                                >
                                                    <MenuBookOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Submissions" arrow>
                                                <IconButton
                                                    onClick={() => handleView(student, "submissions")}
                                                    size="small"
                                                    aria-label={`View ${student.name || "student"} submissions`}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        border: "1px solid rgba(194, 65, 12, 0.22)",
                                                        color: "#c2410c",
                                                        backgroundColor: isDark
                                                            ? "rgba(249,115,22,0.12)"
                                                            : "#fff7ed",
                                                        "&:hover": {
                                                            backgroundColor: "#ffedd5",
                                                        },
                                                    }}
                                                >
                                                    <AssignmentTurnedInOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Follow-up signals" arrow>
                                                <IconButton
                                                    onClick={() => handleView(student, "followup")}
                                                    size="small"
                                                    aria-label={`View ${student.name || "student"} follow-up signals`}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        border: "1px solid rgba(180, 83, 9, 0.24)",
                                                        color: "#b45309",
                                                        backgroundColor: "#fffbeb",
                                                        "&:hover": {
                                                            backgroundColor: "#fef3c7",
                                                        },
                                                    }}
                                                >
                                                    <InsightsOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Open batch" arrow>
                                                <IconButton
                                                    onClick={() =>
                                                        navigate("/teacher-dashboard/batchdetails", {
                                                            state: {
                                                                _id: batchId,
                                                                from: "batchDetails",
                                                            },
                                                        })
                                                    }
                                                    size="small"
                                                    aria-label="Open batch"
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        border: "1px solid rgba(22, 101, 52, 0.22)",
                                                        color: "#166534",
                                                        backgroundColor: "#f0fdf4",
                                                        "&:hover": {
                                                            backgroundColor: "#dcfce7",
                                                        },
                                                    }}
                                                >
                                                    <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {!filteredStudents.length && (
                <Box
                    sx={{
                        mt: 3,
                        p: 4,
                        borderRadius: 3,
                        border: "1px dashed rgba(15, 23, 42, 0.16)",
                        backgroundColor: theme.palette.background.paper,
                        textAlign: "center",
                    }}
                >
                    <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                        No students match this view
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: "#6b7280" }}>
                        Try another filter or search term.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
