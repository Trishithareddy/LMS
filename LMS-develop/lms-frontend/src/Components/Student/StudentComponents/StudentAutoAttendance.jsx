import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    Snackbar,
    Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CloseIcon from "@mui/icons-material/Close";

const getTodayDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatTime = (value) => {
    if (!value) return "";

    try {
        return new Date(value).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
};

const normalizeBatchIds = (student) => {
    const batchIds = [];

    if (Array.isArray(student?.batches)) {
        student.batches.forEach((batch) => {
            const id = batch?._id || batch?.id || batch?.batchId || batch;

            if (id) batchIds.push(id);
        });
    }

    if (student?.batchId) batchIds.push(student.batchId);
    if (student?.batch?._id) batchIds.push(student.batch._id);
    if (student?.batch) batchIds.push(student.batch);

    return [...new Set(batchIds.map((id) => String(id)))];
};

const findBatchName = (student, markedBatchId) => {
    if (!student) return "Current Batch";

    if (Array.isArray(student.batches)) {
        const matchedBatch = student.batches.find((batch) => {
            const id = batch?._id || batch?.id || batch?.batchId || batch;
            return String(id) === String(markedBatchId);
        });

        if (matchedBatch) {
            return (
                matchedBatch.batchName ||
                matchedBatch.name ||
                matchedBatch.courseName ||
                "Current Batch"
            );
        }
    }

    return (
        student.batchName ||
        student.batch?.batchName ||
        student.batch?.name ||
        "Current Batch"
    );
};

const sortStatusList = (statusList = []) => {
    const getPriority = (item) => {
        if (!item) return 0;
        if (item.autoMarked) return 5;
        if (item.markedBy === "system") return 4;
        if (item.status === "present") return 3;
        if (item.status === "late") return 2;
        if (item.loginTime) return 1;
        return 0;
    };

    return [...statusList].sort((a, b) => getPriority(b) - getPriority(a));
};

const isOnlyPlaceholderAbsent = (status) => {
    if (!status) return false;

    return (
        status.status === "absent" &&
        !status.autoMarked &&
        !status.loginTime &&
        String(status.markedBy || "teacher").toLowerCase() === "teacher"
    );
};

const StudentAutoAttendance = ({ student }) => {
    const hasCheckedRef = useRef(false);

    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [showAttendanceCard, setShowAttendanceCard] = useState(false);

    useEffect(() => {
        if (!showAttendanceCard) return undefined;

        const timeoutId = window.setTimeout(() => {
            setShowAttendanceCard(false);
        }, 7000);

        return () => window.clearTimeout(timeoutId);
    }, [showAttendanceCard]);

    useEffect(() => {
        let intervalId;

        const resolveTodayStatus = async (studentContext) => {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/attendance/today/status`,
                {
                    headers: getAuthHeaders(),
                }
                );

                const statusList = sortStatusList(
                    response.data?.statusList || []
                );

                if (!statusList.length) {
                    return null;
                }

            const firstStatus = statusList[0];

            return {
                status: firstStatus.status || "present",
                loginTime: firstStatus.loginTime,
                batchName: findBatchName(studentContext, firstStatus.batchId),
                className:
                    firstStatus.className ||
                    studentContext?.class ||
                    studentContext?.grade ||
                    studentContext?.className ||
                    "",
                section: firstStatus.section || studentContext?.section || "",
                markedBy: firstStatus.markedBy || "teacher",
                autoMarked: Boolean(firstStatus.autoMarked),
            };
        };

        const autoMarkAttendance = async () => {
            try {
                if (hasCheckedRef.current) return;
                if (!student?._id) return;

                const batchIds = normalizeBatchIds(student);

                if (!batchIds.length) {
                    console.warn(
                        "Auto attendance skipped: no batchIds found",
                        student
                    );
                    return;
                }

                const today = getTodayDate();

                const className =
                    student.class || student.grade || student.className || "";

                const section = student.section || "";

                if (!className || !section) {
                    console.warn(
                        "Auto attendance skipped: class/section missing",
                        student
                    );
                    return;
                }

                const storageKey = `attendance_marked_${student._id}_${today}_${className}_${section}`;

                const existingStatus = await resolveTodayStatus(student);

                if (existingStatus && !isOnlyPlaceholderAbsent(existingStatus)) {
                    setAttendanceStatus(existingStatus);
                    window.dispatchEvent(
                        new CustomEvent("attendanceUpdated", {
                            detail: existingStatus,
                        })
                    );
                    sessionStorage.setItem(storageKey, "done");
                    return;
                }

                if (sessionStorage.getItem(storageKey) === "done") {
                    return;
                }

                hasCheckedRef.current = true;

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/attendance/auto-mark`,
                    {
                        batchIds,
                        studentName:
                            student.name ||
                            student.studentName ||
                            student.fullName ||
                            "Student",
                        className,
                        section,
                        date: today,
                    },
                    {
                        headers: getAuthHeaders(),
                    }
                );

                const marked = response.data?.marked || [];

                if (marked.length > 0) {
                    const refreshedStatus =
                        (await resolveTodayStatus(student)) || null;
                    const firstMarked = marked[0];

                    const finalStatus = {
                        status:
                            refreshedStatus?.status ||
                            firstMarked.status ||
                            "present",
                        loginTime:
                            refreshedStatus?.loginTime ||
                            firstMarked.loginTime,
                        batchName:
                            refreshedStatus?.batchName ||
                            findBatchName(student, firstMarked.batchId),
                        className:
                            refreshedStatus?.className ||
                            firstMarked.className ||
                            className,
                        section:
                            refreshedStatus?.section ||
                            firstMarked.section ||
                            section,
                        markedBy: refreshedStatus?.markedBy || "system",
                        autoMarked:
                            refreshedStatus?.autoMarked !== undefined
                                ? refreshedStatus.autoMarked
                                : true,
                    };

                    setAttendanceStatus(finalStatus);
                    window.dispatchEvent(
                        new CustomEvent("attendanceUpdated", {
                            detail: finalStatus,
                        })
                    );

                    sessionStorage.setItem(storageKey, "done");

                    setSnackbarMessage(
                        finalStatus.status === "late"
                            ? "You have been marked Late for the active class session."
                            : "Your attendance has been marked Present for the active class session."
                    );

                    setOpenSnackbar(true);
                    setShowAttendanceCard(true);
                } else {
                    if (existingStatus) {
                        setAttendanceStatus(existingStatus);
                        window.dispatchEvent(
                            new CustomEvent("attendanceUpdated", {
                                detail: existingStatus,
                            })
                        );
                    }
                    hasCheckedRef.current = false;

                    console.log(
                        "No active attendance session found or attendance not marked yet."
                    );
                }
            } catch (error) {
                hasCheckedRef.current = false;

                console.error(
                    "Auto attendance failed:",
                    error.response?.data || error.message
                );
            }
        };

        autoMarkAttendance();
        intervalId = window.setInterval(() => {
            if (!attendanceStatus) {
                autoMarkAttendance();
            }
        }, 45000);

        const handleWindowFocus = () => {
            if (!attendanceStatus) {
                hasCheckedRef.current = false;
                autoMarkAttendance();
            }
        };

        window.addEventListener("focus", handleWindowFocus);

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [student, attendanceStatus]);

    return (
        <>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={
                        attendanceStatus?.status === "late"
                            ? "warning"
                            : "success"
                    }
                    sx={{ width: "100%" }}
                    icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {attendanceStatus && showAttendanceCard && (
                <Box
                    sx={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        zIndex: 1300,
                        maxWidth: 360,
                    }}
                >
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                            border: "1px solid #e0e0e0",
                        }}
                    >
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <EventAvailableIcon color="success" />
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Today’s Attendance
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowAttendanceCard(false)}
                                    aria-label="Close attendance pop-up"
                                    sx={{ ml: "auto" }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                            >
                                {attendanceStatus.batchName} •{" "}
                                {attendanceStatus.className} -{" "}
                                {attendanceStatus.section}
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <Chip
                                    label={
                                        attendanceStatus.status === "late"
                                            ? "Late"
                                            : "Present"
                                    }
                                    color={
                                        attendanceStatus.status === "late"
                                            ? "warning"
                                            : "success"
                                    }
                                    size="small"
                                />

                                {attendanceStatus.loginTime && (
                                    <Chip
                                        icon={<AccessTimeIcon />}
                                        label={formatTime(
                                            attendanceStatus.loginTime
                                        )}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Attendance is marked only during an active
                                teacher-started class session.
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </>
    );
};

export default StudentAutoAttendance;
