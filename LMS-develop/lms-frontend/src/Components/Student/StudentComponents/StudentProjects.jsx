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
import handleDownload from "../../DownloadProject";
import ProjectView from "./ProjectView";


const StudentProjects = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                `${import.meta.env.VITE_API_URL}/project/student`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProjects(response.data.data);
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
                <ProjectView project={selectedProject} onBack={handleBack} />
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
                                                    {`${project.projectId}. ${project.name}`}
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    color="text.secondary"
                                                    sx={{ mb: 1 }}
                                                >
                                                    {project.description}
                                                </Typography>
                                                {project.chapter && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Chapter:{" "}
                                                        {project.chapter.name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

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
                                                variant="outlined"
                                                onClick={() =>
                                                    handleDownload(project)
                                                }
                                                fullWidth={false}
                                                sx={{
                                                    width: {
                                                        xs: "80%",
                                                        sm: "auto",
                                                    },
                                                }}
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                variant="contained"
                                                endIcon={<ChevronRight />}
                                                onClick={() =>
                                                    handleProjectClick(project)
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
                                        </CardActions>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default StudentProjects;
