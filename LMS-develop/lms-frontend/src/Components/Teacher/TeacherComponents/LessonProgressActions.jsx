import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
    Alert,
    Box,
    Chip,
    IconButton,
    Snackbar,
    Tooltip,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";

const STATUS_LABELS = {
    "not-started": "Not Started",
    "in-progress": "In Progress",
    completed: "Completed",
};

const STATUS_COLORS = {
    "not-started": "default",
    "in-progress": "warning",
    completed: "success",
};

const LessonProgressActions = ({
    lessonId,
    chapterId,
    courseId,
    batchId,
    initialStatus = "not-started",
    onStatusChange,
}) => {
    const [status, setStatus] = useState(initialStatus);
    const [saving, setSaving] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        setStatus(initialStatus || "not-started");
    }, [initialStatus]);

    const updateStatus = async (nextStatus) => {
        if (!lessonId || !chapterId || !courseId || !batchId) {
            setSnackbar({
                open: true,
                message: "Missing batch, course, chapter or lesson id",
                severity: "error",
            });
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/teacher-progress/lesson`,
                {
                    lessonId,
                    chapterId,
                    courseId,
                    batchId,
                    status: nextStatus,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const updatedStatus =
                response.data?.progress?.status || nextStatus;

            setStatus(updatedStatus);

            onStatusChange?.(lessonId, updatedStatus);

            setSnackbar({
                open: true,
                message: "Lesson status updated",
                severity: "success",
            });
        } catch (error) {
            console.error("Failed to update lesson progress:", error);

            setSnackbar({
                open: true,
                message:
                    error.response?.data?.message ||
                    "Failed to update lesson status",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.5,
                    mt: 0.5,
                    mb: 0.5,
                    width: "100%",
                }}
            >
                <Chip
                    size="small"
                    label={STATUS_LABELS[status] || "Not Started"}
                    color={STATUS_COLORS[status] || "default"}
                    sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        maxWidth: 105,
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                    }}
                >
                    <Tooltip title="Mark in progress">
                        <span>
                            <IconButton
                                size="small"
                                disabled={saving || status === "in-progress"}
                                onClick={() => updateStatus("in-progress")}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    color: "warning.main",
                                }}
                            >
                                <PendingActionsIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Mark completed">
                        <span>
                            <IconButton
                                size="small"
                                disabled={saving || status === "completed"}
                                onClick={() => updateStatus("completed")}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    color: "success.main",
                                }}
                            >
                                <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    {status !== "not-started" && (
                        <Tooltip title="Reset status">
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={saving}
                                    onClick={() =>
                                        updateStatus("not-started")
                                    }
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        color: "text.secondary",
                                    }}
                                >
                                    <RestartAltIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() =>
                    setSnackbar((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() =>
                        setSnackbar((prev) => ({
                            ...prev,
                            open: false,
                        }))
                    }
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default LessonProgressActions;