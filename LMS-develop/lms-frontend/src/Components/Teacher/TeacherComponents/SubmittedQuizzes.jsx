import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import DownloadReportButton from "./DownloadReportButton";
import { ArrowRight, BarChart3, ClipboardList, Download, FileQuestion, MoveUpRight } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { CheckCircle2, MessageSquareText } from "lucide-react";
import { useTheme } from "@mui/material/styles";

const SubmittedQuizzes = () => {
    const location = useLocation();
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [allAttemptData, setAllAttemptData] = useState([]);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("studentName");
    const [currentInput, setCurrentInput] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedQuiz, setSelectedQuiz] = useState(null)
    const [allQuizzes, setAllQuizzes] = useState([])
    const [totalCount, setTotalCount] = useState(0);
    const [analytics, setAnalytics] = useState(null);
    const [quizTitle, setQuizTitle] = useState("");
    const theme = useTheme();
    const navigate = useNavigate();
    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    function timeAgoWithDate(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        const intervals = [
            { label: "year", seconds: 31536000 },
            { label: "month", seconds: 2592000 },
            { label: "day", seconds: 86400 },
            { label: "hour", seconds: 3600 },
            { label: "minute", seconds: 60 },
            { label: "second", seconds: 1 },
        ];

        for (let i of intervals) {
            const count = Math.floor(seconds / i.seconds);
            if (count >= 1) {
                if (seconds > 7 * 86400) {
                    return date.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                }
                return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
            }
        }
        return "just now";
    }

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Quiz Submissions", path: "/teacher-dashboard/submitted-quiz" },
        ]);
    }, [location]);

    const handleSnackbarOpen = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };
    const { quizId } = useParams()
    const fetchAllFilteredQuiz = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quiz/submitted`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        quizId,
                        page: page + 1,
                        limit: rowsPerPage,
                        ...searchTags,
                    },
                }
            );
            console.log("Fetched Quiz Attempts:", response.data);
            setAllAttemptData(response.data?.attempts || []);
            setTotalCount(response.data?.pagination?.totalDocuments || 0);
            setQuizTitle(response.data?.attempts?.[0]?.quizId?.title || "");
            const allAttemptData = response.data?.attempts
            const quizIds = [...new Set(allAttemptData.map(atmt => atmt.quizId))];
            setAllQuizzes(quizIds);
        } catch (error) {
            console.error("Error fetching Quizzes:", error);
            handleSnackbarOpen("Error fetching Quizzes", "error");
        } finally {
            setIsLoading(false);
        }
    };
    const fetchQuizAnalytics = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quiz/analytics/${quizId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setAnalytics(response.data?.analytics || null);
        } catch (error) {
            console.error("Error fetching quiz analytics:", error);
        }
    };
    useEffect(() => {
        fetchAllFilteredQuiz();
    }, [searchTags, page, rowsPerPage]);
    useEffect(() => {
        if (quizId) {
            fetchQuizAnalytics();
        }
    }, [quizId]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };


    const viewAttemptDetails = (attemptId) => {
        navigate(`/teacher-dashboard/quiz-result/${attemptId}`);
    };



    //  Apply date filter only when user clicks search or presses Enter
    const applyDateFilter = () => {
        if (selectedDate) {
            const [year, month, day] = selectedDate.split("-");
            const formatted = `${day}/${month}/${year}`;

            setSearchTags((prev) => ({
                ...prev,
                submittedAt: formatted,
            }));
        }
    };

    // Handle text field filters (for studentName and grade)
    const handleAddTag = (event) => {
        if (event.key === "Enter" && currentInput.trim() !== "") {
            setSearchTags((prev) => ({
                ...prev,
                [currentField]: currentInput.trim(),
            }));
            setCurrentInput("");
        }
    };

    // Handle date field Enter key
    const handleDateKeyPress = (event) => {
        if (event.key === "Enter") {
            applyDateFilter();
        }
    };

    const handleDeleteTag = (field) => {
        setSearchTags((prev) => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });

        if (field === "submittedAt") {
            setSelectedDate("");
        }
    };

    const handleFieldChange = (e) => {
        setCurrentField(e.target.value);
        setCurrentInput("");
        setSelectedDate("");
    };

    const questionPerformanceData = (analytics?.questionStats || []).map((question, index) => ({
        name: `Q${index + 1}`,
        question: question.question,
        correct: question.correctCount,
        wrong: Math.max((question.attemptCount || 0) - (question.correctCount || 0), 0),
    }));

    const resultBreakdownData = [
        { name: "Passed", value: analytics?.passedCount || 0, color: "#16a34a" },
        { name: "Needs Review", value: Math.max((analytics?.attempts || 0) - (analytics?.passedCount || 0), 0), color: "#f59e0b" },
        { name: "Not Attempted", value: analytics?.notAttemptedCount || 0, color: "#94a3b8" },
    ].filter((item) => item.value > 0);

    const formatAnswer = (answer) => {
        if (Array.isArray(answer)) {
            return answer.length ? answer.join(", ") : "No answer";
        }
        if (answer === false) return "False";
        if (answer === true) return "True";
        if (answer === undefined || answer === null || String(answer).trim() === "") {
            return "No answer";
        }
        return String(answer);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    return (
        <>

            {allAttemptData.length <= 0 ? (
                <Box
                    sx={{
                        minHeight: "50vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        bgcolor: "background.default",
                    }}
                >
                    <Typography
                        variant="h3"
                        fontWeight={700}
                        color="text.primary"
                        textAlign="center"
                    >
                        None of Student Submitted yet
                    </Typography>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => navigate(-1)}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        Back To Quiz
                    </Button>
                </Box>
            ) : (
                <>

                    <Box
                        sx={{
                            bgcolor: "background.default",
                            color: "text.primary",
                            m: 2,
                            p: 3,
                        }}
                    >
                        <div id="report-overview" className="flex  justify-between items-center gap-3 mb-2">
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                color="text.primary"
                            >
                                {quizTitle ? `${quizTitle} Report` : "Quiz Report"}
                            </Typography>
                            <button onClick={() => navigate(-1)} className=" flex gap-1 items-center justify-center underline cursor-pointer text-green-600  hover:text-green-800 transition-all duration-150">
                                Back To Quiz
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <Typography
                            color="text.secondary"
                            sx={{ mb: 3 }}
                        >
                            Class analytics appear first, then the individual student attempts for this quiz.
                        </Typography>

                        <Box
                            className="sticky top-3 z-20"
                            sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: 3,
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: 3,
                                backdropFilter: "blur(10px)"
                            }}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                >
                                    Back to Quiz
                                </button>
                                <button
                                    onClick={() => scrollToSection("report-analytics")}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                >
                                    <BarChart3 size={16} />
                                    Analytics
                                </button>
                                <button
                                    onClick={() => scrollToSection("report-questions")}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                >
                                    <FileQuestion size={16} />
                                    Questions
                                </button>
                                <button
                                    onClick={() => scrollToSection("report-attempts")}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                >
                                    <ClipboardList size={16} />
                                    Attempts
                                </button>
                                <button
                                    onClick={() => scrollToSection("report-download")}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                                <button
                                    onClick={() => scrollToSection("report-overview")}
                                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                >
                                    Top
                                    <MoveUpRight size={16} />
                                </button>
                            </div>
                        </Box>

                        {analytics && (
                            <Box
                                sx={{
                                    mb: 4,
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    boxShadow: 2
                                }}
                            >
                                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-inherit">Quiz Analytics</h2>
                                        <Typography color="text.secondary">Performance and question accuracy for the whole class.</Typography>
                                    </div>
                                    <button
                                        onClick={fetchQuizAnalytics}
                                        className="rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-700 hover:bg-green-50"
                                    >
                                        Refresh Analytics
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[
                                        ["Attempts", analytics?.attempts || 0],
                                        ["Batch Size", analytics?.batchSize || 0],
                                        ["Average", `${Math.round(analytics?.averagePercentage || 0)}%`],
                                        ["Passed", analytics?.passedCount || 0],
                                        ["Not Attempted", analytics?.notAttemptedCount || 0],
                                        ["Highest", `${Math.round(analytics?.highestPercentage || 0)}%`],
                                        ["Lowest", `${Math.round(analytics?.lowestPercentage || 0)}%`],
                                    ].map(([label, value]) => (
                                        <Box
                                            key={label}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: "background.default",
                                                border: "1px solid",
                                                borderColor: "divider",
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                fontWeight={700}
                                                color="text.primary"
                                            >
                                                {value}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </div>
                                <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: "background.paper",
                                            border: `1px solid ${theme.palette.divider}`,
                                        }}
                                    >
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-inherit">Question-wise Performance</h3>
                                            <Typography variant="body2" color="text.secondary">How many students got each question right or wrong.</Typography>
                                        </div>
                                        {questionPerformanceData.length ? (
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={questionPerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" />
                                                        <YAxis allowDecimals={false} />
                                                        <RechartsTooltip
                                                            formatter={(value, key) => [value, key === "correct" ? "Answered Correctly" : "Answered Wrong"]}
                                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.question || label}
                                                        />
                                                        <Legend />
                                                        <Bar dataKey="correct" fill="#16a34a" radius={[6, 6, 0, 0]} />
                                                        <Bar dataKey="wrong" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: "background.default",
                                                }}
                                            >
                                                <Typography color="text.secondary">
                                                    No question analytics yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: "background.paper",
                                            border: `1px solid ${theme.palette.divider}`,
                                        }}
                                    >
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-inherit">Result Breakdown</h3>
                                            <Typography variant="body2" color="text.secondary">Quick split of passed, pending review, and not attempted.</Typography>
                                        </div>
                                        {resultBreakdownData.length ? (
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={resultBreakdownData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            innerRadius={55}
                                                            outerRadius={95}
                                                            paddingAngle={3}
                                                        >
                                                            {resultBreakdownData.map((entry) => (
                                                                <Cell key={entry.name} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: "background.default",
                                                }}
                                            >
                                                <Typography color="text.secondary">
                                                    No question analytics yet.
                                                </Typography>
                                            </Box>)}
                                    </Box>
                                </div>
                                {!!analytics?.questionStats?.length && (
                                    <div id="report-questions" className="mt-5">
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-inherit">Question Review Notes</h3>
                                            <Typography variant="body2" color="text.secondary">
                                                Use these cards to discuss the right answer and the most common student responses in class.
                                            </Typography>
                                        </div>
                                        <div className="space-y-3">
                                            {analytics.questionStats.map((question, index) => (
                                                <Box
                                                    key={question.questionId}
                                                    sx={{
                                                        p: 3,
                                                        borderRadius: 3,
                                                        bgcolor: "background.default",
                                                        border: "1px solid",
                                                        borderColor: "divider"
                                                    }}>
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="flex-1">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        px: 2,
                                                                        py: 0.8,
                                                                        borderRadius: 5,
                                                                        bgcolor: "background.paper",
                                                                        color: "text.primary",
                                                                        border: "1px solid",
                                                                        borderColor: "divider",
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    Q{index + 1}
                                                                </Box>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        px: 2,
                                                                        py: 0.8,
                                                                        borderRadius: 5,
                                                                        bgcolor: "background.paper",
                                                                        color: "text.primary",
                                                                        border: "1px solid",
                                                                        borderColor: "divider",
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {question.type}
                                                                </Box>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        px: 2,
                                                                        py: 0.8,
                                                                        borderRadius: 5,
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        bgcolor:
                                                                            question.accuracy < 50
                                                                                ? theme.palette.mode === "dark"
                                                                                    ? "rgba(239,68,68,0.18)"
                                                                                    : "#FEF2F2"
                                                                                : question.accuracy < 75
                                                                                    ? theme.palette.mode === "dark"
                                                                                        ? "rgba(245,158,11,0.18)"
                                                                                        : "#FFFBEB"
                                                                                    : theme.palette.mode === "dark"
                                                                                        ? "rgba(34,197,94,0.18)"
                                                                                        : "#F0FDF4",
                                                                        color:
                                                                            question.accuracy < 50
                                                                                ? theme.palette.error.main
                                                                                : question.accuracy < 75
                                                                                    ? theme.palette.warning.main
                                                                                    : theme.palette.success.main,
                                                                    }}
                                                                >
                                                                    {question.accuracy}% correct
                                                                </Box>
                                                            </div>
                                                            <p className="text-sm font-medium text-inherit">{question.question}</p>
                                                            {!!question.options?.length && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {question.options.map((option, optionIndex) => (
                                                                        <Box
                                                                            component="span"
                                                                            sx={{
                                                                                px: 2,
                                                                                py: 0.8,
                                                                                borderRadius: 5,
                                                                                bgcolor: "background.paper",
                                                                                color: "text.primary",
                                                                                border: "1px solid",
                                                                                borderColor: "divider",
                                                                                fontSize: 12,
                                                                            }}
                                                                        >
                                                                            {option}
                                                                        </Box>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Box
                                                            sx={{
                                                                minWidth: 260,
                                                                p: 3,
                                                                borderRadius: 2,
                                                                bgcolor:
                                                                    theme.palette.mode === "dark"
                                                                        ? "rgba(34,197,94,0.12)"
                                                                        : theme.palette.success.light,
                                                                border: "1px solid",
                                                                borderColor: "success.main",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 1,
                                                                    mb: 1,
                                                                    color: "success.main",
                                                                }}
                                                            >
                                                                <CheckCircle2 size={16} />
                                                                <Typography fontWeight={600}>
                                                                    Correct Answer
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.primary"
                                                            >
                                                                {formatAnswer(question.correctAnswer)}
                                                            </Typography>
                                                        </Box>
                                                    </div>
                                                    <Box
                                                        sx={{
                                                            mt: 3,
                                                            p: 3,
                                                            borderRadius: 2,
                                                            bgcolor: "background.paper",
                                                            border: "1px solid",
                                                            borderColor: "divider",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                mb: 2,
                                                                color: "primary.main",
                                                            }}
                                                        >
                                                            <MessageSquareText size={16} />
                                                            <Typography fontWeight={600}>
                                                                Most Common Student Responses
                                                            </Typography>
                                                        </Box>
                                                        {question.commonResponses?.length ? (
                                                            <div className="space-y-2">
                                                                {question.commonResponses.map((response, responseIndex) => (
                                                                    <Box key={`${question.questionId}-response-${responseIndex}`} sx={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        gap: 2,
                                                                        p: 2,
                                                                        borderRadius: 2,
                                                                        bgcolor: "background.default",
                                                                        border: "1px solid",
                                                                        borderColor: "divider",
                                                                    }}>
                                                                        <Typography color="text.primary">
                                                                            {formatAnswer(response.answer)}
                                                                        </Typography>
                                                                        <Box
                                                                            sx={{
                                                                                px: 2,
                                                                                py: 0.5,
                                                                                borderRadius: 5,
                                                                                bgcolor: "background.paper",
                                                                                border: "1px solid",
                                                                                borderColor: "divider",
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="caption"
                                                                                fontWeight={600}
                                                                                color="text.primary"
                                                                            >
                                                                                {response.count} student{response.count > 1 ? "s" : ""}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">No student responses yet for this question.</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Box>
                        )}

                        {/* === FILTER BAR === */}
                        <Typography
                            id="report-attempts"
                            variant="h4"
                            gutterBottom
                            align="center"
                            sx={{
                                color: (theme) => theme.palette.success.main,
                                fontSize: "1.35rem",
                                fontWeight: "600",
                                marginTop: "20px",
                            }}
                        >
                            Student Attempts
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Grid
                                container
                                spacing={2}
                                justifyContent="center"
                                alignItems="center"
                                sx={{ maxWidth: "700px" }}
                            >

                                <Grid item xs={12} sm={3}>
                                    <Select
                                        value={currentField}
                                        onChange={handleFieldChange}
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="studentName">Student Name</MenuItem>
                                        <MenuItem value="grade">Grade</MenuItem>
                                        <MenuItem value="section">Section</MenuItem>
                                        <MenuItem value="submittedAt">Submitted Date</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={12} sm={7}>
                                    {currentField === "submittedAt" ? (
                                        <TextField
                                            label="Select Date"
                                            type="date"
                                            variant="outlined"
                                            fullWidth
                                            size="small"
                                            value={selectedDate}
                                            onChange={(e) => {
                                                // FIXED: Only update the input value, don't apply filter yet
                                                setSelectedDate(e.target.value);
                                            }}
                                            onKeyPress={handleDateKeyPress}
                                            InputLabelProps={{ shrink: true }}
                                        // helperText="Press Enter or click search button to apply filter"
                                        />
                                    ) : (
                                        <TextField
                                            label={`Search by ${currentField}`}
                                            variant="outlined"
                                            value={currentInput}
                                            onChange={(e) => setCurrentInput(e.target.value)}
                                            onKeyPress={handleAddTag}
                                            fullWidth
                                            size="small"
                                        // helperText="Press Enter to apply filter"
                                        />
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        size="medium"
                                        onClick={() => {
                                            if (currentField === "submittedAt") {
                                                applyDateFilter();
                                            } else if (currentInput.trim() !== "") {
                                                setSearchTags((prev) => ({
                                                    ...prev,
                                                    [currentField]: currentInput.trim(),
                                                }));
                                                setCurrentInput("");
                                            }
                                        }}
                                        startIcon={<SearchIcon />}
                                    >
                                        Search
                                    </Button>
                                </Grid>

                            </Grid>

                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "center", mb: 2, mt: 2 }}>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    maxWidth: "600px",
                                }}
                            >
                                {Object.entries(searchTags).map(([field, value]) => (
                                    <Chip
                                        key={`${field}-${value}`}
                                        label={`${field}: ${value}`}
                                        onDelete={() => handleDeleteTag(field)}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        {/* === TABLE === */}
                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "green" }}>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Student Name
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Grade
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Section
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Quiz Title
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Score
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Percentage
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Pass/Fail
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Submitted At
                                        </TableCell>
                                        <TableCell sx={{ color: "white" }} align="center">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allAttemptData.map((atmt) => (
                                        <TableRow key={atmt._id}>
                                            <TableCell align="center">{atmt.studentId?.name}</TableCell>
                                            <TableCell align="center">{atmt.studentId?.class}</TableCell>
                                            <TableCell align="center">{atmt.studentId?.section}</TableCell>
                                            <TableCell align="center">
                                                {atmt?.quizId?.title || "No Title"}
                                            </TableCell>
                                            <TableCell align="center">{atmt.score}</TableCell>
                                            <TableCell align="center">
                                                {atmt.percentage?.toFixed(2)}%
                                            </TableCell>
                                            <TableCell align="center">
                                                {atmt.isPassed ? "Pass" : "Fail"}
                                            </TableCell>
                                            <TableCell align="center">
                                                {timeAgoWithDate(atmt.submittedAt)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => viewAttemptDetails(atmt._id)}
                                                >
                                                    View Attempt
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <TablePagination
                                rowsPerPageOptions={[10, 20, 30, 40]}
                                component="div"
                                count={totalCount}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Box>

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
                    <Box
                        id="report-download"
                        sx={{
                            bgcolor: "background.default",
                            color: "text.primary",
                            m: 2,
                            p: 3
                        }}
                    >

                        <h3 className="text-sm mb-4">Download full Report</h3>
                        <div className="flex items-center justify-start gap-3 mb-2">
                            <div className="w-[40%]">
                                <Autocomplete
                                    options={allQuizzes}
                                    getOptionLabel={(option) =>
                                        typeof option === "string" ? option : option.title
                                    }
                                    value={allQuizzes.find((quiz) => quiz._id === selectedQuiz) || null}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            setSelectedQuiz(newValue._id);
                                        } else {
                                            setSelectedQuiz(null);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Select Quiz" />
                                    )}
                                />
                            </div>
                            <Grid item xs={12} sm={2} sx={{ ml: 2, alignSelf: "center" }}>
                                {selectedQuiz && <DownloadReportButton quizId={selectedQuiz} resetSelectedQuiz={(() => setSelectedQuiz(null))} filters={""}></DownloadReportButton>}
                            </Grid>
                        </div>

                    </Box>
                </>

            )}




        </>

    );
};

export default SubmittedQuizzes;
