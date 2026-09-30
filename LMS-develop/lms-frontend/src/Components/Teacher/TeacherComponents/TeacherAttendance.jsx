import React, { useEffect, useMemo, useRef, useState } from "react";
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
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SaveIcon from "@mui/icons-material/Save";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useTheme } from "@mui/material/styles";

const getTodayDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const STATUS_OPTIONS = [
    { label: "Present", value: "present" },
    { label: "Absent", value: "absent" },
    { label: "Late", value: "late" },
];

const STATUS_COLORS = {
    present: "#16a34a",
    absent: "#dc2626",
    late: "#f59e0b",
    autoMarked: "#0284c7",
    teacherMarked: "#7c3aed",
};

const isPendingAttendanceRow = (row) => {
    const normalizedRemarks = String(row?.remarks || "").trim().toLowerCase();

    return (
        row?.status === "absent" &&
        !row?.autoMarked &&
        !row?.loginTime &&
        row?.markedBy === "teacher" &&
        (!normalizedRemarks ||
            normalizedRemarks === "not logged in / not marked yet")
    );
};

const TeacherAttendance = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedDate, setSelectedDate] = useState(getTodayDate());

    const [selectedClassName, setSelectedClassName] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const [batchStudents, setBatchStudents] = useState([]);
    const [attendanceRows, setAttendanceRows] = useState([]);
    const [savedAttendance, setSavedAttendance] = useState(null);
    const [activeSession, setActiveSession] = useState(null);

    const [durationMinutes, setDurationMinutes] = useState(45);
    const [graceMinutes, setGraceMinutes] = useState(10);

    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [startingSession, setStartingSession] = useState(false);
    const [closingSession, setClosingSession] = useState(false);
    const [saving, setSaving] = useState(false);

    const [reportFromDate, setReportFromDate] = useState(getTodayDate());
    const [reportToDate, setReportToDate] = useState(getTodayDate());
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [studentAttendanceReport, setStudentAttendanceReport] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const dirtyStudentIdsRef = useRef(new Set());
    const attendancePollRunningRef = useRef(false);
    const theme = useTheme();

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

    const classSectionOptions = useMemo(() => {
        const map = new Map();

        batchStudents.forEach((student) => {
            const className = student.className || "";
            const section = student.section || "";

            if (!className || !section) return;

            const key = `${className}__${section}`;

            if (!map.has(key)) {
                map.set(key, {
                    className,
                    section,
                    label: `${className} - ${section}`,
                });
            }
        });

        return Array.from(map.values());
    }, [batchStudents]);

    const filteredStudents = useMemo(() => {
        if (!selectedClassName || !selectedSection) return [];

        return batchStudents.filter(
            (student) =>
                String(student.className) === String(selectedClassName) &&
                String(student.section) === String(selectedSection)
        );
    }, [batchStudents, selectedClassName, selectedSection]);

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
            setBatches(Array.isArray(teacherBatches) ? teacherBatches : []);
        } catch (error) {
            console.error("Error fetching teacher batches:", error);
            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to fetch teacher batches",
                "error"
            );
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchBatchStudents = async (batchId) => {
        if (!batchId) return [];

        try {
            setLoadingStudents(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getBatchInfo/${batchId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const students = response.data?.batch?.students || [];

            const normalizedStudents = students
                .map((student) => ({
                    studentId: student._id || student.id,
                    studentName:
                        student.name ||
                        student.studentName ||
                        "Unnamed Student",
                    className:
                        student.class ||
                        student.grade ||
                        student.className ||
                        "",
                    section: student.section || "",
                }))
                .filter((student) => student.studentId);

            setBatchStudents(normalizedStudents);
            return normalizedStudents;
        } catch (error) {
            console.error("Error fetching batch students:", error);
            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to fetch batch students",
                "error"
            );
            setBatchStudents([]);
            return [];
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchAttendanceAndSession = async (
        batchId,
        date,
        { silent = false } = {}
    ) => {
        if (!batchId || !date || !selectedClassName || !selectedSection) {
            return {
                attendance: null,
                activeSession: null,
            };
        }

        try {
            if (!silent) setLoadingAttendance(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/attendance/batch/${batchId}`,
                {
                    params: {
                        date,
                        className: selectedClassName,
                        section: selectedSection,
                    },
                    headers: getAuthHeaders(),
                }
            );

            const attendance = response.data?.attendance || null;
            const session = response.data?.activeSession || null;

            setSavedAttendance(attendance);
            setActiveSession(session);

            return {
                attendance,
                activeSession: session,
            };
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setSavedAttendance(null);
            setActiveSession(null);

            return {
                attendance: null,
                activeSession: null,
            };
        } finally {
            if (!silent) setLoadingAttendance(false);
        }
    };

    const buildRows = (students = [], attendance = null) => {
        const existingRecords = attendance?.records || [];

        return students.map((student) => {
            const existing = existingRecords.find(
                (record) =>
                    String(record.studentId) === String(student.studentId)
            );

            if (existing) {
                return {
                    studentId: existing.studentId,
                    studentName: existing.studentName || student.studentName,
                    className: student.className || selectedClassName || "",
                    section: student.section || selectedSection || "",
                    status: existing.status || "present",
                    remarks: existing.remarks || "",
                    markedBy: existing.markedBy || "teacher",
                    autoMarked: Boolean(existing.autoMarked),
                    loginTime: existing.loginTime || null,
                };
            }

            return {
                studentId: student.studentId,
                studentName: student.studentName,
                className: student.className || selectedClassName || "",
                section: student.section || selectedSection || "",
                status: "absent",
                remarks: "Not logged in / not marked yet",
                markedBy: "teacher",
                autoMarked: false,
                loginTime: null,
            };
        });
    };

    const mergeLiveRowsWithLocalEdits = (liveRows = []) => {
        if (!dirtyStudentIdsRef.current.size) return liveRows;

        const localRowsById = new Map(
            attendanceRows.map((row) => [String(row.studentId), row])
        );

        return liveRows.map((liveRow) => {
            const studentId = String(liveRow.studentId);

            return dirtyStudentIdsRef.current.has(studentId)
                ? localRowsById.get(studentId) || liveRow
                : liveRow;
        });
    };

    const loadAttendancePageData = async (batchId, date) => {
        if (!batchId || !date) return;

        const students = batchStudents.length
            ? batchStudents
            : await fetchBatchStudents(batchId);

        if (!selectedClassName || !selectedSection) {
            setAttendanceRows([]);
            return;
        }

        const studentsForClass = students.filter(
            (student) =>
                String(student.className) === String(selectedClassName) &&
                String(student.section) === String(selectedSection)
        );

        const { attendance } = await fetchAttendanceAndSession(batchId, date);

        setAttendanceRows(buildRows(studentsForClass, attendance));
    };

    useEffect(() => {
        fetchTeacherBatches();
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            fetchBatchStudents(selectedBatchId);
        }
    }, [selectedBatchId]);

    useEffect(() => {
        if (
            selectedBatchId &&
            classSectionOptions.length > 0 &&
            !selectedClassName &&
            !selectedSection
        ) {
            setSelectedClassName(classSectionOptions[0].className);
            setSelectedSection(classSectionOptions[0].section);
        }
    }, [
        selectedBatchId,
        classSectionOptions,
        selectedClassName,
        selectedSection,
    ]);

    useEffect(() => {
        if (
            selectedBatchId &&
            selectedDate &&
            selectedClassName &&
            selectedSection
        ) {
            loadAttendancePageData(selectedBatchId, selectedDate);
        }
    }, [selectedBatchId, selectedDate, selectedClassName, selectedSection]);

    const handleBatchChange = (event) => {
        dirtyStudentIdsRef.current.clear();
        setSelectedBatchId(event.target.value);
        setSelectedClassName("");
        setSelectedSection("");
        setSavedAttendance(null);
        setActiveSession(null);
        setBatchStudents([]);
        setAttendanceRows([]);
        setAttendanceReport([]);
        setStudentAttendanceReport([]);
        setReportSummary(null);
    };

    const handleDateChange = (event) => {
        dirtyStudentIdsRef.current.clear();
        setSelectedDate(event.target.value);
        setSavedAttendance(null);
        setActiveSession(null);
        setAttendanceRows([]);
    };

    const updateStudentStatus = (studentId, status) => {
        dirtyStudentIdsRef.current.add(String(studentId));
        setAttendanceRows((prev) =>
            prev.map((row) =>
                String(row.studentId) === String(studentId)
                    ? {
                        ...row,
                        status,
                        markedBy: "teacher",
                        remarks:
                            row.remarks === "Not logged in / not marked yet"
                                ? ""
                                : row.remarks,
                    }
                    : row
            )
        );
    };

    const updateStudentRemarks = (studentId, remarks) => {
        dirtyStudentIdsRef.current.add(String(studentId));
        setAttendanceRows((prev) =>
            prev.map((row) =>
                String(row.studentId) === String(studentId)
                    ? {
                        ...row,
                        remarks,
                    }
                    : row
            )
        );
    };

    const markAll = (status) => {
        attendanceRows.forEach((row) =>
            dirtyStudentIdsRef.current.add(String(row.studentId))
        );
        setAttendanceRows((prev) =>
            prev.map((row) => ({
                ...row,
                status,
                markedBy: "teacher",
                remarks:
                    status === "present"
                        ? ""
                        : row.remarks === "Not logged in / not marked yet"
                            ? ""
                            : row.remarks,
            }))
        );
    };

    const summary = useMemo(() => {
        const result = {
            total: attendanceRows.length,
            present: 0,
            absent: 0,
            late: 0,
            autoMarked: 0,
        };

        attendanceRows.forEach((row) => {
            if (row.status === "present") result.present += 1;
            if (row.status === "absent") result.absent += 1;
            if (row.status === "late") result.late += 1;
            if (row.autoMarked) result.autoMarked += 1;
        });

        return result;
    }, [attendanceRows]);

    const formatDateTime = (value) => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
            });
        } catch {
            return "-";
        }
    };

    const formatLoginTime = (value) => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    const formatReportLoginTime = (value) => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    const formatUsedTime = (minutes) => {
        const totalMinutes = Number(minutes || 0);

        if (!totalMinutes) return "-";

        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }

        return `${mins}m`;
    };

    const getLiveUsedMinutes = (loginTime) => {
        if (!loginTime) return 0;

        try {
            const loginDate = new Date(loginTime);

            if (Number.isNaN(loginDate.getTime())) return 0;

            const now = new Date();
            let effectiveEndTime = now;

            if (activeSession?.closedAt) {
                effectiveEndTime = new Date(activeSession.closedAt);
            } else if (activeSession?.endTime) {
                const sessionEnd = new Date(activeSession.endTime);

                if (!Number.isNaN(sessionEnd.getTime()) && now > sessionEnd) {
                    effectiveEndTime = sessionEnd;
                }
            }

            const diffMs = effectiveEndTime.getTime() - loginDate.getTime();
            if (diffMs <= 0) return 0;

            return Math.round(diffMs / (1000 * 60));
        } catch {
            return 0;
        }
    };

    const sessionInsights = useMemo(() => {
        const confirmedCount = attendanceRows.filter(
            (row) => !isPendingAttendanceRow(row)
        ).length;
        const pendingCount = attendanceRows.length - confirmedCount;
        const manualCount = attendanceRows.filter(
            (row) => !row.autoMarked && !isPendingAttendanceRow(row)
        ).length;
        const lateCount = attendanceRows.filter(
            (row) => row.status === "late"
        ).length;
        const progressPercent = attendanceRows.length
            ? Math.round((confirmedCount / attendanceRows.length) * 100)
            : 0;
        const autoMarkedCount = attendanceRows.filter(
            (row) => row.autoMarked
        ).length;
        const teacherMarkedCount = attendanceRows.filter(
            (row) => !row.autoMarked && !isPendingAttendanceRow(row)
        ).length;
        const usedMinutesList = attendanceRows
            .filter((row) => row.loginTime)
            .map((row) => getLiveUsedMinutes(row.loginTime));
        const averageUsedMinutes = usedMinutesList.length
            ? Math.round(
                usedMinutesList.reduce((sum, value) => sum + value, 0) /
                usedMinutesList.length
            )
            : 0;
        const earliestLoginDate = attendanceRows
            .filter((row) => row.loginTime)
            .map((row) => new Date(row.loginTime))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime())[0];

        return {
            confirmedCount,
            pendingCount,
            manualCount,
            lateCount,
            progressPercent,
            autoMarkedCount,
            teacherMarkedCount,
            averageUsedMinutes,
            earliestLogin: earliestLoginDate
                ? formatLoginTime(earliestLoginDate)
                : "-",
        };
    }, [attendanceRows, activeSession]);

    const reportTrendData = useMemo(() => {
        const grouped = new Map();

        studentAttendanceReport.forEach((record) => {
            if (!grouped.has(record.date)) {
                grouped.set(record.date, {
                    date: record.date,
                    present: 0,
                    absent: 0,
                    late: 0,
                });
            }

            const current = grouped.get(record.date);
            if (record.status === "present") current.present += 1;
            else if (record.status === "late") current.late += 1;
            else current.absent += 1;
        });

        return Array.from(grouped.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    }, [studentAttendanceReport]);

    const reportStatusBreakdown = useMemo(() => {
        if (!reportSummary) return [];

        return [
            {
                name: "Present",
                value: reportSummary.present || 0,
                color: STATUS_COLORS.present,
            },
            {
                name: "Absent",
                value: reportSummary.absent || 0,
                color: STATUS_COLORS.absent,
            },
            {
                name: "Late",
                value: reportSummary.late || 0,
                color: STATUS_COLORS.late,
            },
        ].filter((item) => item.value > 0);
    }, [reportSummary]);

    const reportSourceBreakdown = useMemo(() => {
        const sourceSummary = {
            autoMarked: 0,
            teacherMarked: 0,
        };

        studentAttendanceReport.forEach((record) => {
            if (record.autoMarked) sourceSummary.autoMarked += 1;
            else sourceSummary.teacherMarked += 1;
        });

        return [
            {
                name: "Auto Marked",
                value: sourceSummary.autoMarked,
                color: STATUS_COLORS.autoMarked,
            },
            {
                name: "Teacher Marked",
                value: sourceSummary.teacherMarked,
                color: STATUS_COLORS.teacherMarked,
            },
        ].filter((item) => item.value > 0);
    }, [studentAttendanceReport]);

    const attendanceRiskList = useMemo(() => {
        const grouped = new Map();

        studentAttendanceReport.forEach((record) => {
            const key = String(record.studentId);

            if (!grouped.has(key)) {
                grouped.set(key, {
                    studentId: key,
                    studentName: record.studentName || "Student",
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                });
            }

            const current = grouped.get(key);
            current.total += 1;

            if (record.status === "present") current.present += 1;
            else if (record.status === "late") current.late += 1;
            else current.absent += 1;
        });

        return Array.from(grouped.values())
            .map((student) => ({
                ...student,
                attendancePercentage: student.total
                    ? Math.round(
                        ((student.present + student.late) / student.total) *
                        100
                    )
                    : 0,
            }))
            .sort((a, b) => {
                if (a.attendancePercentage !== b.attendancePercentage) {
                    return a.attendancePercentage - b.attendancePercentage;
                }

                return b.absent - a.absent;
            })
            .slice(0, 5);
    }, [studentAttendanceReport]);

    const startSession = async () => {
        if (!selectedBatchId) {
            showSnackbar("Please select a batch", "error");
            return;
        }

        if (!selectedClassName || !selectedSection) {
            showSnackbar("Please select class and section", "error");
            return;
        }

        if (!selectedDate) {
            showSnackbar("Please select a date", "error");
            return;
        }

        if (!filteredStudents.length) {
            showSnackbar("No students found in this class/section", "error");
            return;
        }

        try {
            setStartingSession(true);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/attendance/session/start`,
                {
                    batchId: selectedBatchId,
                    batchName:
                        selectedBatch?.batchName || selectedBatch?.name || "",
                    className: selectedClassName,
                    section: selectedSection,
                    date: selectedDate,
                    durationMinutes: Number(durationMinutes || 45),
                    graceMinutes: Number(graceMinutes || 10),
                    students: filteredStudents.map((student) => ({
                        studentId: student.studentId,
                        studentName: student.studentName,
                        className: student.className,
                        section: student.section,
                        status: "absent",
                        remarks: "Not logged in / not marked yet",
                    })),
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.data?.success) {
                dirtyStudentIdsRef.current.clear();
                setActiveSession(response.data.session);
                setSavedAttendance(response.data.attendance);
                setAttendanceRows(
                    buildRows(filteredStudents, response.data.attendance)
                );
                showSnackbar("Attendance session started", "success");
            }
        } catch (error) {
            console.error("Error starting attendance session:", error);
            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to start attendance session",
                "error"
            );
        } finally {
            setStartingSession(false);
        }
    };

    const closeSession = async () => {
        if (!activeSession?._id) {
            showSnackbar("No active session to close", "error");
            return;
        }

        try {
            setClosingSession(true);

            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/attendance/session/${activeSession._id}/close`,
                {},
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.data?.success) {
                setActiveSession(null);
                await refreshAttendance({
                    silent: true,
                    preserveLocalEdits: true,
                });
                showSnackbar("Attendance session closed", "success");
            }
        } catch (error) {
            console.error("Error closing attendance session:", error);
            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to close attendance session",
                "error"
            );
        } finally {
            setClosingSession(false);
        }
    };

    const saveAttendance = async () => {
        if (!selectedBatchId) {
            showSnackbar("Please select a batch", "error");
            return;
        }

        if (!selectedClassName || !selectedSection) {
            showSnackbar("Please select class and section", "error");
            return;
        }

        if (!selectedDate) {
            showSnackbar("Please select a date", "error");
            return;
        }

        if (!attendanceRows.length) {
            showSnackbar("No students found to save attendance", "error");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                batchId: selectedBatchId,
                batchName:
                    selectedBatch?.batchName || selectedBatch?.name || "",
                className: selectedClassName,
                section: selectedSection,
                date: selectedDate,
                sessionId:
                    activeSession?._id || savedAttendance?.sessionId || null,
                records: attendanceRows,
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/attendance/save`,
                payload,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.data?.success) {
                setSavedAttendance(response.data.attendance);
                dirtyStudentIdsRef.current.clear();
                showSnackbar("Attendance saved successfully", "success");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to save attendance",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const refreshAttendance = async ({
        silent = false,
        preserveLocalEdits = false,
    } = {}) => {
        if (
            !selectedBatchId ||
            !selectedDate ||
            !selectedClassName ||
            !selectedSection
        ) {
            return;
        }

        const { attendance, activeSession: session } =
            await fetchAttendanceAndSession(selectedBatchId, selectedDate, {
                silent,
            });

        setActiveSession(session);
        const liveRows = buildRows(filteredStudents, attendance);
        if (!preserveLocalEdits) {
            dirtyStudentIdsRef.current.clear();
        }
        setAttendanceRows(
            preserveLocalEdits
                ? mergeLiveRowsWithLocalEdits(liveRows)
                : liveRows
        );
    };

    useEffect(() => {
        if (
            !activeSession?._id ||
            !selectedBatchId ||
            !selectedDate ||
            !selectedClassName ||
            !selectedSection
        ) {
            return undefined;
        }

        const pollAttendance = async () => {
            if (
                document.visibilityState !== "visible" ||
                attendancePollRunningRef.current
            ) {
                return;
            }

            attendancePollRunningRef.current = true;

            try {
                await refreshAttendance({
                    silent: true,
                    preserveLocalEdits: true,
                });
            } finally {
                attendancePollRunningRef.current = false;
            }
        };

        const intervalId = window.setInterval(pollAttendance, 5000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                pollAttendance();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [
        activeSession?._id,
        selectedBatchId,
        selectedDate,
        selectedClassName,
        selectedSection,
        filteredStudents,
        attendanceRows,
    ]);

    const loadAttendanceReport = async () => {
        if (!selectedBatchId) {
            showSnackbar("Please select a batch first", "error");
            return;
        }

        if (!selectedClassName || !selectedSection) {
            showSnackbar("Please select class and section first", "error");
            return;
        }

        if (!reportFromDate || !reportToDate) {
            showSnackbar("Please select report date range", "error");
            return;
        }

        try {
            setLoadingReport(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/attendance/summary/${selectedBatchId}`,
                {
                    params: {
                        from: reportFromDate,
                        to: reportToDate,
                        className: selectedClassName,
                        section: selectedSection,
                    },
                    headers: getAuthHeaders(),
                }
            );

            setAttendanceReport(response.data?.attendanceList || []);
            setStudentAttendanceReport(response.data?.studentReport || []);
            setReportSummary(response.data?.overallSummary || null);

            showSnackbar("Attendance report loaded", "success");
        } catch (error) {
            console.error("Error loading attendance report:", error);

            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to load attendance report",
                "error"
            );
        } finally {
            setLoadingReport(false);
        }
    };

    const exportAttendanceReportCSV = () => {
        if (!studentAttendanceReport.length) {
            showSnackbar("No student report data available to export", "error");
            return;
        }

        const rows = [];

        rows.push([
            "Date",
            "Batch",
            "Class",
            "Section",
            "Student Name",
            "Status",
            "Marked By",
            "Login Time",
            "Used Time",
            "Remarks",
        ]);

        studentAttendanceReport.forEach((record) => {
            rows.push([
                record.date || "",
                record.batchName || selectedBatch?.batchName || "",
                record.className || selectedClassName || "",
                record.section || selectedSection || "",
                record.studentName || "",
                record.status || "",
                record.autoMarked ? "System" : "Teacher",
                formatReportLoginTime(record.loginTime),
                formatUsedTime(record.usedMinutes),
                record.remarks || "",
            ]);
        });

        const csvContent = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const safeBatchName = String(
            selectedBatch?.batchName || "attendance_report"
        )
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        link.href = url;
        link.download = `${safeBatchName}_${selectedClassName}_${selectedSection}_student_report_${reportFromDate}_to_${reportToDate}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const isLoading = loadingStudents || loadingAttendance || loadingBatches;

    return (
        <Box sx={{ p: 2 }}>
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
                    icon={
                        snackbarSeverity === "success" ? (
                            <CheckCircleOutlineIcon fontSize="inherit" />
                        ) : undefined
                    }
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 3 }}>
                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        boxShadow: 2,
                    }}
                >
                    <CardContent>
                        <Typography variant="h4" fontWeight={700}>
                            Student Attendance
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Start a live attendance session for a selected class/section.
                            Students are auto-marked only during the active session.
                        </Typography>
                    </CardContent>
                </Card>


            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Select Batch / Program</InputLabel>
                                <Select
                                    label="Select Batch / Program"
                                    value={selectedBatchId}
                                    onChange={handleBatchChange}
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

                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Select Class / Section</InputLabel>
                                <Select
                                    label="Select Class / Section"
                                    value={
                                        selectedClassName && selectedSection
                                            ? `${selectedClassName}__${selectedSection}`
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const [className, section] =
                                            e.target.value.split("__");

                                        setSelectedClassName(className);
                                        setSelectedSection(section);
                                        dirtyStudentIdsRef.current.clear();
                                        setAttendanceRows([]);
                                        setSavedAttendance(null);
                                        setActiveSession(null);
                                    }}
                                    disabled={
                                        !selectedBatchId ||
                                        !classSectionOptions.length
                                    }
                                >
                                    {classSectionOptions.map((item) => (
                                        <MenuItem
                                            key={`${item.className}__${item.section}`}
                                            value={`${item.className}__${item.section}`}
                                        >
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Attendance Date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& input::-webkit-calendar-picker-indicator": {
                                        filter: theme.palette.mode === "dark"
                                            ? "invert(1)"
                                            : "none",
                                        cursor: "pointer",
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={6} md={1.5}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Duration"
                                value={durationMinutes}
                                onChange={(e) =>
                                    setDurationMinutes(e.target.value)
                                }
                                onWheel={(e) => e.target.blur()}
                            />
                        </Grid>

                        <Grid item xs={6} md={1.5}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Grace"
                                value={graceMinutes}
                                onChange={(e) =>
                                    setGraceMinutes(e.target.value)
                                }
                                onWheel={(e) => e.target.blur()}
                            />
                        </Grid>

                        <Grid item xs={12} md={1}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() =>
                                    loadAttendancePageData(
                                        selectedBatchId,
                                        selectedDate
                                    )
                                }
                                disabled={
                                    !selectedBatchId ||
                                    !selectedDate ||
                                    !selectedClassName ||
                                    !selectedSection ||
                                    isLoading
                                }
                            >
                                {isLoading ? (
                                    <CircularProgress size={22} />
                                ) : (
                                    <RefreshIcon />
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Attendance Session
                            </Typography>

                            {activeSession ? (
                                <>
                                    <Chip
                                        label="Active Session"
                                        color="success"
                                        size="small"
                                        sx={{ mt: 1, mr: 1 }}
                                    />

                                    <Chip
                                        label={`${selectedClassName} - ${selectedSection}`}
                                        color="info"
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        Ends at:{" "}
                                        {formatDateTime(activeSession.endTime)} |
                                        Grace: {activeSession.graceMinutes} min
                                    </Typography>
                                </>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No active session. Student login will not
                                    mark attendance.
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {!activeSession ? (
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={startSession}
                                    disabled={
                                        startingSession ||
                                        !selectedBatchId ||
                                        !selectedClassName ||
                                        !selectedSection ||
                                        !filteredStudents.length
                                    }
                                >
                                    {startingSession ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Start Attendance"
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<StopCircleIcon />}
                                    onClick={closeSession}
                                    disabled={closingSession}
                                >
                                    {closingSession ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Close Session"
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={refreshAttendance}
                                disabled={
                                    !selectedBatchId ||
                                    !selectedDate ||
                                    !selectedClassName ||
                                    !selectedSection
                                }
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <PeopleAltIcon color="primary" />
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Total
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {summary.total}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Present
                            </Typography>
                            <Typography
                                variant="h5"
                                color="success.main"
                                sx={{ fontWeight: 700 }}
                            >
                                {summary.present}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Absent
                            </Typography>
                            <Typography
                                variant="h5"
                                color="error.main"
                                sx={{ fontWeight: 700 }}
                            >
                                {summary.absent}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                Auto Marked
                            </Typography>
                            <Typography
                                variant="h5"
                                color="info.main"
                                sx={{ fontWeight: 700 }}
                            >
                                {summary.autoMarked}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    flexWrap: "wrap",
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Session Progress
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Track how many student entries are
                                        confirmed for this live session.
                                    </Typography>
                                </Box>

                                <Chip
                                    label={`${sessionInsights.confirmedCount} / ${summary.total} confirmed`}
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>

                            <LinearProgress
                                variant="determinate"
                                value={sessionInsights.progressPercent}
                                sx={{
                                    height: 10,
                                    borderRadius: 999,
                                    mb: 2,
                                }}
                            />

                            <Grid container spacing={1.5}>
                                <Grid item xs={6} md={3}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Confirmed
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.confirmedCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Pending
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="warning.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.pendingCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Late
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="warning.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.lateCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Manual Overrides
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="secondary.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.manualCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card sx={{ height: "100%" }}>
                        <CardContent sx={{ height: "100%" }}>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 700, mb: 0.5 }}
                            >
                                Session Capture
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                See how attendance was captured during this
                                active session.
                            </Typography>

                            <Grid container spacing={1.5}>
                                <Grid item xs={6}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Auto Marked
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="info.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.autoMarkedCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Teacher Marked
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="secondary.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.teacherMarkedCount}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Avg. Used Time
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {formatUsedTime(
                                                sessionInsights.averageUsedMinutes
                                            )}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: 2 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            First Login
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {sessionInsights.earliestLogin}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {selectedBatchId && selectedClassName && selectedSection && (
                <Card>
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Attendance Register
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {selectedBatch?.batchName ||
                                        "Selected Batch"}{" "}
                                    • {selectedClassName} - {selectedSection} •{" "}
                                    {selectedDate}
                                </Typography>

                                {savedAttendance && (
                                    <Chip
                                        icon={<EventAvailableIcon />}
                                        label="Attendance record exists for this date"
                                        color="success"
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    color="success"
                                    onClick={() => markAll("present")}
                                    disabled={!attendanceRows.length}
                                >
                                    Mark All Present
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => markAll("absent")}
                                    disabled={!attendanceRows.length}
                                >
                                    Mark All Absent
                                </Button>

                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<SaveIcon />}
                                    onClick={saveAttendance}
                                    disabled={saving || !attendanceRows.length}
                                >
                                    {saving ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Save Attendance"
                                    )}
                                </Button>
                            </Box>
                        </Box>

                        {isLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 4,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : attendanceRows.length === 0 ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    textAlign: "center",
                                    bgcolor: "background.default"
                                }}
                            >
                                <Typography color="text.secondary">
                                    No students found in this class/section.
                                </Typography>
                            </Paper>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>S.No</TableCell>
                                            <TableCell>Student Name</TableCell>
                                            <TableCell>Class</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Marked By</TableCell>
                                            <TableCell>Login Time</TableCell>
                                            <TableCell>Used Time</TableCell>
                                            <TableCell>Remarks</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {attendanceRows.map((row, index) => (
                                            <TableRow key={row.studentId}>
                                                <TableCell>{index + 1}</TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {row.studentName}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    {row.className || "-"}
                                                    {row.section
                                                        ? ` - ${row.section}`
                                                        : ""}
                                                </TableCell>

                                                <TableCell>
                                                    <FormControl size="small">
                                                        <Select
                                                            value={
                                                                row.status ||
                                                                "absent"
                                                            }
                                                            onChange={(e) =>
                                                                updateStudentStatus(
                                                                    row.studentId,
                                                                    e.target.value
                                                                )
                                                            }
                                                            sx={{ minWidth: 130 }}
                                                        >
                                                            {STATUS_OPTIONS.map(
                                                                (status) => (
                                                                    <MenuItem
                                                                        key={
                                                                            status.value
                                                                        }
                                                                        value={
                                                                            status.value
                                                                        }
                                                                    >
                                                                        {
                                                                            status.label
                                                                        }
                                                                    </MenuItem>
                                                                )
                                                            )}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>

                                                <TableCell>
                                                    {row.autoMarked ? (
                                                        <Chip
                                                            label="System"
                                                            color="info"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Teacher"
                                                            color="default"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {formatLoginTime(row.loginTime)}
                                                </TableCell>

                                                <TableCell>
                                                    {formatUsedTime(
                                                        getLiveUsedMinutes(
                                                            row.loginTime
                                                        )
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Remarks"
                                                        value={row.remarks || ""}
                                                        onChange={(e) =>
                                                            updateStudentRemarks(
                                                                row.studentId,
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card sx={{ mt: 3, mb: 3 }}>
                <CardContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Attendance Report
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            View class/section-wise attendance summary for a
                            selected date range.
                        </Typography>
                    </Box>

                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="From Date"
                                value={reportFromDate}
                                onChange={(e) =>
                                    setReportFromDate(e.target.value)
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& input::-webkit-calendar-picker-indicator": {
                                        filter: theme.palette.mode === "dark"
                                            ? "invert(1)"
                                            : "none",
                                        cursor: "pointer",
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="To Date"
                                value={reportToDate}
                                onChange={(e) =>
                                    setReportToDate(e.target.value)
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& input::-webkit-calendar-picker-indicator": {
                                        filter: theme.palette.mode === "dark"
                                            ? "invert(1)"
                                            : "none",
                                        cursor: "pointer",
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                onClick={loadAttendanceReport}
                                disabled={
                                    loadingReport ||
                                    !selectedBatchId ||
                                    !selectedClassName ||
                                    !selectedSection
                                }
                            >
                                {loadingReport ? (
                                    <CircularProgress
                                        size={22}
                                        color="inherit"
                                    />
                                ) : (
                                    "Load Report"
                                )}
                            </Button>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={exportAttendanceReportCSV}
                                disabled={!studentAttendanceReport.length}
                            >
                                Export CSV
                            </Button>
                        </Grid>
                    </Grid>

                    {reportSummary && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Days Marked
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {reportSummary.totalDays || 0}
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
                                            Present
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="success.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {reportSummary.present || 0}
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
                                            Absent
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="error.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {reportSummary.absent || 0}
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
                                            Late
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="warning.main"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {reportSummary.late || 0}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {!!studentAttendanceReport.length && (
                        <>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardContent sx={{ height: "100%" }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ fontWeight: 700, mb: 0.5 }}
                                            >
                                                Date-wise Attendance Trend
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2 }}
                                            >
                                                See how present, absent, and late
                                                counts changed across the selected
                                                dates.
                                            </Typography>
                                            <Box sx={{ width: "100%", height: 260 }}>
                                                <ResponsiveContainer>
                                                    <BarChart
                                                        data={reportTrendData}
                                                        margin={{
                                                            top: 8,
                                                            right: 8,
                                                            left: -12,
                                                            bottom: 8,
                                                        }}
                                                    >
                                                        <XAxis dataKey="date" />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar
                                                            dataKey="present"
                                                            fill={STATUS_COLORS.present}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                        <Bar
                                                            dataKey="absent"
                                                            fill={STATUS_COLORS.absent}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                        <Bar
                                                            dataKey="late"
                                                            fill={STATUS_COLORS.late}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2} sx={{ height: "100%" }}>
                                        <Grid item xs={12}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                                    >
                                                        Status Breakdown
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        Overall attendance mix for
                                                        the selected report range.
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            height: 200,
                                                        }}
                                                    >
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie
                                                                    data={reportStatusBreakdown}
                                                                    dataKey="value"
                                                                    nameKey="name"
                                                                    innerRadius={42}
                                                                    outerRadius={70}
                                                                    paddingAngle={3}
                                                                >
                                                                    {reportStatusBreakdown.map(
                                                                        (entry) => (
                                                                            <Cell
                                                                                key={
                                                                                    entry.name
                                                                                }
                                                                                fill={
                                                                                    entry.color
                                                                                }
                                                                            />
                                                                        )
                                                                    )}
                                                                </Pie>
                                                                <Tooltip />
                                                                <Legend />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                                    >
                                                        Marking Source
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        Understand how much of the
                                                        attendance was captured
                                                        automatically versus marked
                                                        by the teacher.
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            height: 200,
                                                        }}
                                                    >
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie
                                                                    data={reportSourceBreakdown}
                                                                    dataKey="value"
                                                                    nameKey="name"
                                                                    innerRadius={42}
                                                                    outerRadius={70}
                                                                    paddingAngle={3}
                                                                >
                                                                    {reportSourceBreakdown.map(
                                                                        (entry) => (
                                                                            <Cell
                                                                                key={
                                                                                    entry.name
                                                                                }
                                                                                fill={
                                                                                    entry.color
                                                                                }
                                                                            />
                                                                        )
                                                                    )}
                                                                </Pie>
                                                                <Tooltip />
                                                                <Legend />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                    >
                                        Attendance Follow-up
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 2 }}
                                    >
                                        Students with the lowest attendance
                                        percentages in the selected range appear
                                        first.
                                    </Typography>

                                    {attendanceRiskList.length ? (
                                        <Grid container spacing={2}>
                                            {attendanceRiskList.map((student) => (
                                                <Grid
                                                    item
                                                    xs={12}
                                                    md={6}
                                                    lg={4}
                                                    key={student.studentId}
                                                >
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2,
                                                            height: "100%",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                gap: 2,
                                                                mb: 1,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {
                                                                    student.studentName
                                                                }
                                                            </Typography>
                                                            <Chip
                                                                label={`${student.attendancePercentage}%`}
                                                                color={
                                                                    student.attendancePercentage >=
                                                                        75
                                                                        ? "success"
                                                                        : student.attendancePercentage >=
                                                                            50
                                                                            ? "warning"
                                                                            : "error"
                                                                }
                                                                size="small"
                                                            />
                                                        </Box>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 1 }}
                                                        >
                                                            {student.present} present,{" "}
                                                            {student.absent} absent,{" "}
                                                            {student.late} late
                                                            across {student.total}{" "}
                                                            marked day
                                                            {student.total === 1
                                                                ? ""
                                                                : "s"}
                                                        </Typography>

                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={
                                                                student.attendancePercentage
                                                            }
                                                            color={
                                                                student.attendancePercentage >=
                                                                    75
                                                                    ? "success"
                                                                    : student.attendancePercentage >=
                                                                        50
                                                                        ? "warning"
                                                                        : "error"
                                                            }
                                                            sx={{
                                                                height: 8,
                                                                borderRadius: 999,
                                                            }}
                                                        />
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 3,
                                                textAlign: "center",
                                                backgroundColor: "#fafafa",
                                            }}
                                        >
                                            <Typography color="text.secondary">
                                                No follow-up insights available
                                                for this date range yet.
                                            </Typography>
                                        </Paper>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {!studentAttendanceReport.length ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                textAlign: "center",
                                bgcolor: "background.default"
                            }}
                        >
                            <Typography color="text.secondary">
                                Select batch, class/section, and date range to
                                load student-wise attendance report.
                            </Typography>
                        </Paper>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Class</TableCell>
                                        <TableCell>Section</TableCell>
                                        <TableCell>Student Name</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Marked By</TableCell>
                                        <TableCell>Login Time</TableCell>
                                        <TableCell>Used Time</TableCell>
                                        <TableCell>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {studentAttendanceReport.map(
                                        (record, index) => (
                                            <TableRow
                                                key={`${record.studentId}_${record.date}_${index}`}
                                            >
                                                <TableCell>
                                                    {record.date}
                                                </TableCell>

                                                <TableCell>
                                                    {record.className || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    {record.section || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {record.studentName ||
                                                            "-"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            record.status ===
                                                                "late"
                                                                ? "Late"
                                                                : record.status ===
                                                                    "present"
                                                                    ? "Present"
                                                                    : "Absent"
                                                        }
                                                        color={
                                                            record.status ===
                                                                "late"
                                                                ? "warning"
                                                                : record.status ===
                                                                    "present"
                                                                    ? "success"
                                                                    : "error"
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    {record.autoMarked ? (
                                                        <Chip
                                                            label="System"
                                                            color="info"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Teacher"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {formatReportLoginTime(
                                                        record.loginTime
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {formatUsedTime(
                                                        record.usedMinutes
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {record.remarks || "-"}
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
        </Box>
    );
};

export default TeacherAttendance;
