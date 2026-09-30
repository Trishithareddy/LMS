const SCRATCH_URL = import.meta.env.VITE_SCRATCH_URL || "http://localhost:8602";

import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Button,
    Box,
    Typography,
    Stack,
    Snackbar,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    TextField,
    InputAdornment,
    MenuItem,
} from "@mui/material";
import handleDownload from "../../DownloadProject";
import ProjectView from "../../Student/StudentComponents/ProjectView";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { useTheme } from "@mui/material/styles";

const normalize = (value) => String(value || "").trim().toLowerCase();

const getProjectToolLabel = (project) => {
    const selected = normalize(project.selectedLanguage);
    if (selected) return selected;

    const options = Array.isArray(project.terminalOptions)
        ? project.terminalOptions.map(normalize)
        : [];

    return options[0] || "project";
};

const prettyTool = (tool) =>
    tool === "js"
        ? "JavaScript"
        : tool === "html"
            ? "HTML"
            : tool === "css"
                ? "CSS"
                : tool === "python"
                    ? "Python"
                    : tool === "scratch"
                        ? "Scratch"
                        : tool
                            .split(/[\s-_]+/)
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(" ");

const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const TeacherProjects = () => {
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [page, setPage] = useState(0);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [projectsData, setProjectsData] = useState([]);
    const [teacherBatches, setTeacherBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [projectSearch, setProjectSearch] = useState("");
    const [studentFilter, setStudentFilter] = useState("all");
    const [toolFilter, setToolFilter] = useState("all");
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const handleSnackbarOpen = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = (_, reason) => {
        if (reason !== "clickaway") setOpenSnackbar(false);
    };

    const fetchTeacherBatches = async (token) => {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/teacher/get/allBatches`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data?.teacher?.batches || [];
    };

    const fetchAllProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const [projectsRes, batches] = await Promise.all([
                axios.get(
                    `${import.meta.env.VITE_API_URL}/project/get-submitted-practice-project`,
                    { headers: { Authorization: `Bearer ${token}` } },
                ),
                fetchTeacherBatches(token),
            ]);

            const projects = Array.isArray(projectsRes.data)
                ? projectsRes.data
                : projectsRes.data.projects || [];

            setProjectsData(projects);
            setTeacherBatches(batches);
            setPage(0);
        } catch (error) {
            console.error("Error fetching teacher projects:", error);
            handleSnackbarOpen("Error fetching submitted projects", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Projects", path: "/teacher-dashboard/projects" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        fetchAllProjects();
    }, []);

    const projectsWithBatch = useMemo(() => {
        const studentToBatch = new Map();

        teacherBatches.forEach((batch) => {
            (batch.students || []).forEach((student) => {
                const key = String(student._id || student.studentId || "");
                if (key && !studentToBatch.has(key)) {
                    studentToBatch.set(key, {
                        batchId: batch._id,
                        batchName: batch.batchName,
                        batchImageUrl: batch.batchImageUrl || batch.imageUrl || "",
                    });
                }
            });
        });

        return projectsData.map((project) => {
            const creatorId = String(project.createdBy?._id || "");
            const batchMatch = studentToBatch.get(creatorId);
            return {
                ...project,
                batchId: batchMatch?.batchId || "unassigned",
                batchName: batchMatch?.batchName || "Unmapped Batch",
                batchImageUrl: batchMatch?.batchImageUrl || "",
                toolLabel: prettyTool(getProjectToolLabel(project)),
            };
        });
    }, [projectsData, teacherBatches]);

    const batchCards = useMemo(() => {
        const grouped = new Map();

        projectsWithBatch.forEach((project) => {
            if (!grouped.has(project.batchId)) {
                grouped.set(project.batchId, {
                    batchId: project.batchId,
                    batchName: project.batchName,
                    batchImageUrl: project.batchImageUrl,
                    submissionCount: 0,
                    latestSubmission: null,
                    uniqueStudents: new Set(),
                });
            }

            const bucket = grouped.get(project.batchId);
            bucket.submissionCount += 1;
            bucket.uniqueStudents.add(String(project.createdBy?._id || ""));

            if (
                !bucket.latestSubmission ||
                new Date(project.submittedAt || project.createdAt) >
                new Date(bucket.latestSubmission)
            ) {
                bucket.latestSubmission = project.submittedAt || project.createdAt;
            }
        });

        return Array.from(grouped.values())
            .map((bucket) => ({
                ...bucket,
                studentCount: bucket.uniqueStudents.size,
            }))
            .sort((a, b) => a.batchName.localeCompare(b.batchName));
    }, [projectsWithBatch]);

    const selectedBatch = useMemo(
        () => batchCards.find((batch) => batch.batchId === selectedBatchId) || null,
        [batchCards, selectedBatchId],
    );

    const batchProjects = useMemo(() => {
        if (!selectedBatchId) return [];

        return projectsWithBatch.filter((project) => {
            if (project.batchId !== selectedBatchId) return false;

            const studentName = project.createdBy?.name || "";
            const projectName = project.name || "";
            const description = project.description || "";
            const matchesSearch = [studentName, projectName, description]
                .join(" ")
                .toLowerCase()
                .includes(projectSearch.toLowerCase());

            if (!matchesSearch) return false;

            if (studentFilter !== "all") {
                const studentId = String(project.createdBy?._id || "");
                if (studentId !== studentFilter) return false;
            }

            if (toolFilter !== "all" && normalize(project.toolLabel) !== toolFilter) {
                return false;
            }

            return true;
        });
    }, [projectSearch, projectsWithBatch, selectedBatchId, studentFilter, toolFilter]);

    const currentProjects = batchProjects.slice(
        page * rowsPerPage,
        (page + 1) * rowsPerPage + rowsPerPage,
    );

    const projectSummary = useMemo(() => {
        const uniqueStudents = new Set(
            projectsWithBatch.map((project) => String(project.createdBy?._id || "")),
        ).size;
        const uniqueTools = new Set(
            projectsWithBatch.map((project) => normalize(project.toolLabel)),
        ).size;

        return {
            totalSubmissions: projectsWithBatch.length,
            batchesCovered: batchCards.length,
            uniqueStudents,
            uniqueTools,
        };
    }, [batchCards.length, projectsWithBatch]);

    const batchStudentOptions = useMemo(() => {
        const seen = new Map();
        batchProjects.forEach((project) => {
            const id = String(project.createdBy?._id || "");
            if (id && !seen.has(id)) {
                seen.set(id, project.createdBy?.name || "Student");
            }
        });
        return Array.from(seen.entries()).map(([value, label]) => ({
            value,
            label,
        }));
    }, [batchProjects]);

    const batchToolOptions = useMemo(() => {
        return Array.from(
            new Set(batchProjects.map((project) => normalize(project.toolLabel))),
        )
            .filter(Boolean)
            .map((tool) => ({
                value: tool,
                label: prettyTool(tool),
            }));
    }, [batchProjects]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleBack = () => {
        setSelectedProject(null);
        fetchAllProjects();
    };

    const handleProjectClick = (project) => setSelectedProject(project);

    const handleOpenBatch = (batchId) => {
        setSelectedBatchId(batchId);
        setProjectSearch("");
        setStudentFilter("all");
        setToolFilter("all");
        setPage(0);
    };

    const handleBackToBatches = () => {
        setSelectedBatchId(null);
        setProjectSearch("");
        setStudentFilter("all");
        setToolFilter("all");
        setPage(0);
    };

    return (
        <Box
            sx={{
                backgroundColor: "background.paper",
                color: "text.primary",
                m: { xs: 1, sm: 2, md: 3 },
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            {selectedProject ? (
                <ProjectView
                    project={selectedProject}
                    onBack={handleBack}
                    isTeacher={true}
                />
            ) : (
                <>
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={6000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    >
                        <Alert
                            onClose={handleSnackbarClose}
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

                    <Box
                        sx={{
                            mb: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            p: { xs: 2, md: 3 },
                            boxShadow: isDark
                                ? "0 8px 24px rgba(0,0,0,.45)"
                                : "0 8px 24px rgba(15,23,42,.05)",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: { xs: 28, md: 36 },
                                fontWeight: 700,
                                color: "text.primary",
                            }}
                        >
                            Projects
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 15 }}>
                            Review submitted practice projects batch-wise instead of scanning one mixed student list.
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    borderRadius: 3, boxShadow: "none", border: "1px solid",
                                    borderColor: isDark ? "#355244" : "#dcfce7", backgroundColor: isDark ? "#1f2d24" : "#f0fdf4"
                                }}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#166534" }}>
                                            Total Submissions
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 30,
                                                fontWeight: 700,
                                                color: "text.primary",
                                            }}
                                        >
                                            {projectSummary.totalSubmissions}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    borderRadius: 3, boxShadow: "none", border: "1px solid",
                                    borderColor: isDark ? "#31486d" : "#dbeafe", backgroundColor: isDark ? "#1e293b" : "#eff6ff"
                                }}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#1d4ed8" }}>
                                            Batches Covered
                                        </Typography>
                                        <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                            {projectSummary.batchesCovered}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    borderRadius: 3, boxShadow: "none", border: "1px solid",
                                    borderColor: isDark ? "#6a4b14" : "#fde68a", backgroundColor: isDark ? "#2d1b00" : "#fffbeb"
                                }}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#b45309" }}>
                                            Students Submitted
                                        </Typography>
                                        <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
                                            {projectSummary.uniqueStudents}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    borderRadius: 3, boxShadow: "none", border: "1px solid",
                                    borderColor: isDark ? "#5b3b70" : "#e9d5ff", backgroundColor: isDark ? "#2d2238" : "#faf5ff"
                                }}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#7e22ce" }}>
                                            Tools Used
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 30,
                                                fontWeight: 700,
                                                color: "text.primary"
                                            }}
                                        >
                                            {projectSummary.uniqueTools}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>

                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="240px">
                            <CircularProgress />
                        </Box>
                    ) : !selectedBatchId ? (
                        <>
                            {batchCards.length === 0 ? (
                                <Typography
                                    variant="h6"
                                    align="center"
                                    sx={{ mt: 6, color: "#6b7280" }}
                                >
                                    No submitted projects available.
                                </Typography>
                            ) : (
                                <Grid container spacing={3}>
                                    {batchCards.map((batch) => (
                                        <Grid item xs={12} md={6} xl={4} key={batch.batchId}>
                                            <Card
                                                sx={{
                                                    borderRadius: 4,
                                                    backgroundColor: "background.paper",
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    boxShadow: isDark
                                                        ? "0 8px 24px rgba(0,0,0,.45)"
                                                        : "0 8px 24px rgba(0,0,0,.08)",
                                                    transition: "0.25s",
                                                    "&:hover": {
                                                        transform: "translateY(-3px)",
                                                        boxShadow: isDark
                                                            ? "0 12px 28px rgba(0,0,0,.55)"
                                                            : "0 14px 32px rgba(0,0,0,.12)"
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            src={batch.batchImageUrl || undefined}
                                                            sx={{ width: 56, height: 56, bgcolor: "success.main" }}
                                                        >
                                                            <FolderOpenOutlinedIcon />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "text.primary" }}>
                                                                {batch.batchName}
                                                            </Typography>
                                                            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 14 }}>
                                                                {batch.submissionCount} submission
                                                                {batch.submissionCount !== 1 ? "s" : ""} from{" "}
                                                                {batch.studentCount} student
                                                                {batch.studentCount !== 1 ? "s" : ""}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{ mt: 2, flexWrap: "wrap" }}
                                                    >
                                                        <Chip
                                                            label={`Latest: ${formatDate(batch.latestSubmission)}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isDark ? "#2b2b2b" : "#f3f4f6",
                                                                color: "text.primary",
                                                                border: "1px solid",
                                                                borderColor: "divider",
                                                            }}
                                                        />
                                                        <Chip
                                                            label="Batch Review"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isDark ? "#1f4427" : "#dcfce7",
                                                                color: isDark ? "#7ee787" : "#166534",

                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </Stack>

                                                    <Button
                                                        variant="contained"
                                                        sx={{
                                                            mt: 2.5,
                                                            borderRadius: 999,
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            px: 3,
                                                        }}
                                                        onClick={() => handleOpenBatch(batch.batchId)}
                                                    >
                                                        Open Batch Projects
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    ) : (
                        <>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                                spacing={2}
                                sx={{ mb: 3 }}
                            >
                                <Box>
                                    <Button
                                        startIcon={<ArrowBackIcon />}
                                        onClick={handleBackToBatches}
                                        sx={{ mb: 1, textTransform: "none" }}
                                    >
                                        Back to Batches
                                    </Button>
                                    <Typography sx={{ fontSize: 28, fontWeight: 700, color: "text.primary" }}>
                                        {selectedBatch?.batchName}
                                    </Typography>
                                    <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                                        Review submitted projects from this batch.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    mb: 3,
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    placeholder="Search by student, project name, or description..."
                                    value={projectSearch}
                                    onChange={(e) => {
                                        setProjectSearch(e.target.value);
                                        setPage(0);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: "#9ca3af" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        backgroundColor: "background.paper",
                                        borderRadius: 3,
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: "background.paper"
                                        }
                                    }}
                                />

                                <TextField
                                    select
                                    value={studentFilter}
                                    onChange={(e) => {
                                        setStudentFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{
                                        backgroundColor: "background.paper",
                                        borderRadius: 3,
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: "background.paper"
                                        }
                                    }}
                                >
                                    <MenuItem value="all">All students</MenuItem>
                                    {batchStudentOptions.map((student) => (
                                        <MenuItem key={student.value} value={student.value}>
                                            {student.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    value={toolFilter}
                                    onChange={(e) => {
                                        setToolFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{
                                        backgroundColor: "background.paper",
                                        borderRadius: 3,
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: "background.paper"
                                        }
                                    }}
                                >
                                    <MenuItem value="all">All tools</MenuItem>
                                    {batchToolOptions.map((tool) => (
                                        <MenuItem key={tool.value} value={tool.value}>
                                            {tool.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            {batchProjects.length === 0 ? (
                                <Typography
                                    variant="h6"
                                    align="center"
                                    sx={{ mt: 6, color: "text.secondary" }}
                                >
                                    No project submissions match these filters.
                                </Typography>
                            ) : (
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        bgcolor: "background.paper",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 3,
                                        boxShadow: isDark
                                            ? "0 8px 20px rgba(0,0,0,.45)"
                                            : "0 8px 24px rgba(0,0,0,.08)"
                                    }}
                                >
                                    <Table sx={{ minWidth: 750 }} aria-label="projects table">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "success.main" }}>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Student
                                                </TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Project
                                                </TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Tool
                                                </TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Description
                                                </TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Submitted
                                                </TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {currentProjects.map((project, idx) => {
                                                const studentName =
                                                    project.createdBy?.name ||
                                                    project.student?.name ||
                                                    project.studentName ||
                                                    "N/A";

                                                return (
                                                    <TableRow
                                                        key={project._id || idx}
                                                        sx={{
                                                            "&:nth-of-type(odd)": {
                                                                bgcolor: isDark ? "#202020" : "#ffffff",
                                                            },
                                                            "&:nth-of-type(even)": {
                                                                bgcolor: isDark ? "#262626" : "#fafafa",
                                                            },
                                                            "&:hover": {
                                                                bgcolor: isDark ? "#303030" : "#f5f5f5",
                                                            },
                                                        }}
                                                    >
                                                        <TableCell align="center">
                                                            <Typography fontWeight="600">
                                                                {studentName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {project.createdBy?.class || "-"} {project.createdBy?.section || ""}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {project.name}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={project.toolLabel}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: isDark
                                                                        ? "#1f2d24"
                                                                        : "#f0fdf4",
                                                                    color: "success.main",
                                                                    fontWeight: 700,
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                maxWidth: { xs: 120, sm: 200, md: 280 },
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {project.description || "No description"}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {formatDate(project.submittedAt || project.createdAt)}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Stack
                                                                direction={{ xs: "column", sm: "row" }}
                                                                spacing={{ xs: 1, sm: 1.5 }}
                                                                justifyContent="center"
                                                            >
                                                                <Button
                                                                    variant="outlined"
                                                                    sx={{
                                                                        borderColor: "divider",
                                                                        color: "text.primary",
                                                                        "&:hover": {
                                                                            borderColor: "success.main",
                                                                            color: "success.main",
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                    onClick={() => handleDownload(project)}
                                                                >
                                                                    Download
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    sx={{
                                                                        bgcolor: "success.main",
                                                                        "&:hover": {
                                                                            bgcolor: "success.dark",
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                    onClick={() => handleProjectClick(project)}
                                                                >
                                                                    Open
                                                                </Button>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={batchProjects.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </TableContainer>
                            )}
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

export default TeacherProjects;
