import React, { useContext, useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    CircularProgress,
} from "@mui/material";
import axios from "axios";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import CreatePracticeProject from "./ViewPracticeProject";
import { Snackbar, Alert } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import Chip from "@mui/material/Chip";

const reviewStatusLabel = (status) => {
    if (status === "reviewed") return "Reviewed";
    if (status === "needs_revision") return "Needs Revision";
    return "";
};

const ListOfPracticeSavedProject = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Projects", path: "/student-dashboard/projects-Practice" },
        ]);
    }, []);

    // Move fetchProjects outside useEffect but keep it in the component
    const fetchProjects = async () => {
        if (!token) {
            setError("No authentication token found");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/project/get-practice-project`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setProjects(response.data);
        } catch (error) {
            console.error("Error details:", error);
            setError(
                error.response?.data?.message || "Failed to fetch projects"
            );
        } finally {
            setLoading(false);
        }
    };

    // Use it in useEffect
    useEffect(() => {
        fetchProjects();
    }, []);

    // Now you can use it in handleBack
    const handleBack = () => {
        setSelectedProject(null); // Hide project view
        fetchProjects(); // Fetch fresh projects
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
    };

    const handledeletePracticePorject = async (project) => {
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL
                }/project/delete-practice-project/${project._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSnackbarMessage("Project deleted successfully!");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            fetchProjects();
        } catch (error) {
            console.error("Error while deleting project:", error);
            setSnackbarMessage(
                error.response?.data?.message || "Failed to delete project"
            );
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="200px"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography
                variant="body1"
                align="center"
                sx={{ p: 4, color: "error.main" }}
            >
                {error}
            </Typography>
        );
    }

    if (!projects?.length) {
        return (
            <Typography
                variant="body1"
                align="center"
                sx={{ p: 4, color: "text.secondary" }}
            >
                No projects found
            </Typography>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {selectedProject ? (
                <CreatePracticeProject
                    project={selectedProject}
                    onBack={handleBack}
                    ShowButtons={false}
                />
            ) : (
                <>
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            fontSize: {
                                xs: "1rem",
                                sm: "1.5rem",
                                md: "2rem",
                            },
                            textAlign: "center",
                            mb: { xs: 2, sm: 3, md: 4 },
                            color: "text.primary",
                            fontWeight: 700,
                        }}
                    >
                        My Projects
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {projects.map((project) => (
                            <Card
                                key={project._id}
                                sx={{
                                    "&:hover": { boxShadow: 6 },
                                    transition: "box-shadow 0.3s",
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: {
                                                xs: "column",
                                                sm: "row",
                                            },
                                            justifyContent: "space-between",
                                            alignItems: {
                                                xs: "flex-start",
                                                sm: "center",
                                            },
                                            gap: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: {
                                                    xs: "flex-start",
                                                    sm: "center",
                                                },
                                                gap: 2,
                                                width: {
                                                    xs: "100%",
                                                    sm: "auto",
                                                },
                                            }}
                                        >
                                            <InsertDriveFileIcon
                                                sx={{
                                                    fontSize: {
                                                        xs: 32,
                                                        sm: 40,
                                                    },
                                                    color: "primary.main",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontSize: {
                                                            xs: "1rem",
                                                            sm: "1.25rem",
                                                        },
                                                        mb: 1,
                                                    }}
                                                >
                                                    {`${project.name}`}
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    color="text.secondary"
                                                    sx={{ mb: 1 }}
                                                >
                                                    {project.description}
                                                </Typography>
                                                {(project?.teacherReview?.status ===
                                                    "reviewed" ||
                                                    project?.teacherReview?.status ===
                                                    "needs_revision") && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            <Chip
                                                                size="small"
                                                                label={reviewStatusLabel(
                                                                    project?.teacherReview
                                                                        ?.status
                                                                )}
                                                                sx={{
                                                                    borderRadius: 999,
                                                                    fontWeight: 700,
                                                                    backgroundColor:
                                                                        project
                                                                            ?.teacherReview
                                                                            ?.status ===
                                                                            "needs_revision"
                                                                            ? "#fef3c7"
                                                                            : "#dbeafe",
                                                                    color:
                                                                        project
                                                                            ?.teacherReview
                                                                            ?.status ===
                                                                            "needs_revision"
                                                                            ? "#b45309"
                                                                            : "#1d4ed8",
                                                                }}
                                                            />
                                                            {project?.teacherReview
                                                                ?.feedback && (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            mt: 1,
                                                                            color: "#475569",
                                                                            lineHeight: 1.6,
                                                                            display: "-webkit-box",
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient:
                                                                                "vertical",
                                                                            overflow:
                                                                                "hidden",
                                                                            maxWidth:
                                                                                "720px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            project
                                                                                .teacherReview
                                                                                .feedback
                                                                        }
                                                                    </Typography>
                                                                )}
                                                        </Box>
                                                    )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
                                            <CardActions
                                                sx={{
                                                    gap: 1,
                                                    p: 0,
                                                    width: {
                                                        xs: "100%",
                                                        sm: "auto",
                                                    },
                                                    justifyContent: {
                                                        xs: "stretch",
                                                        sm: "flex-end",
                                                    },
                                                    flexDirection: {
                                                        xs: "column",
                                                        sm: "row",
                                                    },
                                                    // Add this to remove the default left margin
                                                    "& .MuiButton-root": {
                                                        ml: "0 !important", // Override the default margin-left
                                                    },
                                                }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    endIcon={<ChevronRight />}
                                                    onClick={() =>
                                                        handleProjectClick(
                                                            project
                                                        )
                                                    }
                                                    fullWidth={false}
                                                    sx={{
                                                        width: {
                                                            xs: "80%",
                                                            sm: "auto",
                                                        },
                                                    }}
                                                >
                                                    Open
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    onClick={() =>
                                                        handledeletePracticePorject(
                                                            project
                                                        )
                                                    }
                                                    fullWidth={false}
                                                    sx={{
                                                        width: {
                                                            xs: "80%",
                                                            sm: "auto",
                                                        },
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </CardActions>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "end",
                                                }}
                                            >
                                                {project.status ===
                                                    "submitted" && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 1,
                                                                color: "green",
                                                                mt: 1,
                                                                fontSize: "0.9rem",
                                                            }}
                                                        >
                                                            <TaskAltIcon fontSize="small" />{" "}
                                                            <span> submitted</span>{" "}
                                                        </Box>
                                                    )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </>
            )}

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
        </Box>
    );
};

export default ListOfPracticeSavedProject;
