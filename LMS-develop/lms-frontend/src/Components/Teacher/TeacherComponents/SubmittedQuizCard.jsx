import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Search, Filter, BookOpen, Layers3, Users } from "lucide-react";
import Cards from "./SubmittedCards";
import { useTheme } from "@mui/material/styles";

const SubmittedQuizCard = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(12);
    const [page, setPage] = useState(0);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const [batches, setBatches] = useState([]);
    const [batchFilter, setBatchFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const handleSnackbarClose = () => setOpenSnackbar(false);

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleChangePage = (_, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const fetchAllQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quiz/get-all-quizzes`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        status:
                            statusFilter !== "all" ? statusFilter : undefined,
                        search: appliedSearch || undefined,
                        quizMode:
                            modeFilter === "all"
                                ? undefined
                                : modeFilter === "formal"
                                  ? "formal"
                                  : "fun,revision",
                        assignedTo:
                            batchFilter !== "all" ? batchFilter : undefined,
                    },
                },
            );

            setQuizzes(response.data?.data?.quizzes || []);
            setTotalItems(response.data?.data?.pagination?.totalItems || 0);
        } catch (error) {
            console.error("Error fetching Questions:", error);
            showSnackbar("Error while fetching quizzes", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllQuizzes();
    }, [page, rowsPerPage, appliedSearch, statusFilter, modeFilter, batchFilter]);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/quiz/get-batch-for-quiz`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                setBatches(response.data?.teacherBatches || []);
            } catch (error) {
                console.error("Error fetching report batches:", error);
            }
        };

        fetchBatches();
    }, []);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            setAppliedSearch(searchTerm.trim());
            setPage(0);
        }
    };

    const handleSearchClick = () => {
        setAppliedSearch(searchTerm.trim());
        setPage(0);
    };

    const statusCounts = useMemo(
        () =>
            quizzes.reduce(
                (accumulator, quiz) => {
                    const key = quiz.status || "unknown";
                    accumulator[key] = (accumulator[key] || 0) + 1;
                    return accumulator;
                },
                {
                    active: 0,
                    inactive: 0,
                    draft: 0,
                    scheduled: 0,
                    closed: 0,
                    archived: 0,
                },
            ),
        [quizzes],
    );

    const groupedQuizzes = useMemo(() => {
        if (batchFilter !== "all") {
            const selectedBatch = batches.find((batch) => batch._id === batchFilter);
            return [
                {
                    id: batchFilter,
                    label: selectedBatch?.batchName || "Selected Batch",
                    quizzes,
                },
            ];
        }

        const batchMap = new Map();

        quizzes.forEach((quiz) => {
            const assignedBatches = Array.isArray(quiz.assignedTo)
                ? quiz.assignedTo
                : [];

            if (!assignedBatches.length) {
                if (!batchMap.has("unassigned")) {
                    batchMap.set("unassigned", {
                        id: "unassigned",
                        label: "Unassigned",
                        quizzes: [],
                    });
                }
                batchMap.get("unassigned").quizzes.push(quiz);
                return;
            }

            assignedBatches.forEach((batch) => {
                const batchId = batch?._id || batch?.id || "unknown";
                const batchName = batch?.batchName || batch?.name || "Unknown Batch";

                if (!batchMap.has(batchId)) {
                    batchMap.set(batchId, {
                        id: batchId,
                        label: batchName,
                        quizzes: [],
                    });
                }

                batchMap.get(batchId).quizzes.push(quiz);
            });
        });

        return Array.from(batchMap.values()).sort((first, second) =>
            first.label.localeCompare(second.label),
        );
    }, [batchFilter, batches, quizzes]);

    const summary = useMemo(() => {
        const uniqueBatchCount = new Set(
            quizzes.flatMap((quiz) =>
                (quiz.assignedTo || []).map((batch) => batch?._id || batch?.id),
            ),
        ).size;

        return {
            visibleQuizzes: quizzes.length,
            visibleBatches: uniqueBatchCount,
            practiceCount: quizzes.filter(
                (quiz) => quiz.quizMode === "fun" || quiz.quizMode === "revision",
            ).length,
        };
    }, [quizzes]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px",
                    height: "90vh",
                    alignItems: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Box
  sx={{
    mb: 3,
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    p: { xs: 2, md: 3 },
    boxShadow: isDark
      ? "0 8px 24px rgba(0,0,0,.5)"
      : "0 8px 24px rgba(0,0,0,.08)",
  }}
>
                <Typography
                    sx={{
                        fontSize: { xs: 26, md: 34 },
                        fontWeight: 700,
                        color: "text.primary",
                    }}
                >
                    Submitted Quiz Reports
                </Typography>
                <Typography
                    sx={{
                        mt: 0.5,
                        fontSize: 15,
                        color: "text.secondary",
                    }}
                >
                    Review submitted quizzes batch-wise instead of scanning one long mixed list.
                </Typography>

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-emerald-700">
                            <BookOpen size={18} />
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                Visible Quizzes
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-900">
                            {summary.visibleQuizzes}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sky-700">
                            <Layers3 size={18} />
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                Batch Groups
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-sky-900">
                            {groupedQuizzes.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-amber-700">
                            <Users size={18} />
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                Practice / Revision
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-amber-900">
                            {summary.practiceCount}
                        </p>
                    </div>
                </div>
            </Box>

            <div className="mb-6 rounded-2xl p-5"
style={{
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}}>
                <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="relative flex flex-1">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
    type="text"
    placeholder="Search quiz title or description..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={handleSearchKeyDown}
    className="w-full rounded-l-xl py-2.5 pl-10 pr-4 outline-none"
    style={{
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
    }}
/>
                        <button
                            onClick={handleSearchClick}
                            className="rounded-r-xl bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                        >
                            Search
                        </button>
                    </div>

                    <div className="relative">
                        <Filter
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                            style={{
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
}}
className="min-w-44 appearance-none rounded-xl py-2.5 pl-10 pr-8"
                        >
                            <option value="all">All status ({quizzes.length})</option>
                            <option value="active">Active ({statusCounts.active})</option>
                            <option value="draft">Draft ({statusCounts.draft})</option>
                            <option value="scheduled">Scheduled ({statusCounts.scheduled})</option>
                            <option value="closed">Closed ({statusCounts.closed})</option>
                            <option value="archived">Archived ({statusCounts.archived})</option>
                            <option value="inactive">Inactive ({statusCounts.inactive})</option>
                        </select>
                    </div>

                    <select
                        value={modeFilter}
                        onChange={(e) => {
                            setModeFilter(e.target.value);
                            setPage(0);
                        }}
                        style={{
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
}}
className="min-w-44 appearance-none rounded-xl py-2.5 pl-10 pr-8"
                    >
                        <option value="all">All modes</option>
                        <option value="formal">Assessments</option>
                        <option value="practice">Practice and Revision</option>
                    </select>

                    <select
                        value={batchFilter}
                        onChange={(e) => {
                            setBatchFilter(e.target.value);
                            setPage(0);
                        }}
                        style={{
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
}}
className="min-w-44 appearance-none rounded-xl py-2.5 pl-10 pr-8"
                    >
                        <option value="all">All batches</option>
                        {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                                {batch.batchName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {groupedQuizzes.length > 0 ? (
                    groupedQuizzes.map((group) => (
                        <div
                            key={group.id}
                            className="rounded-2xl p-5"
style={{
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}}
                        >
                            <div className="mb-4 flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between"
style={{
    borderBottom: `1px solid ${theme.palette.divider}`,
}}>
                                <div>
                                    <h3
    className="text-xl font-semibold"
    style={{
        color: theme.palette.text.primary,
    }}
>
                                        {group.label}
                                    </h3>
                                    <p
    className="text-sm"
    style={{
        color: theme.palette.text.secondary,
    }}
>
                                        {group.quizzes.length} quiz
                                        {group.quizzes.length !== 1 ? "zes" : ""} with submissions to review
                                    </p>
                                </div>
                                <span
    className="inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium"
    style={{
        background: isDark ? "#2c2c2c" : "#f3f4f6",
        color: theme.palette.text.primary,
    }}
>
                                    Batch View
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {group.quizzes.map((quiz) => (
                                    <Cards
                                        key={`${group.id}-${quiz._id}`}
                                        quiz={quiz}
                                        fetchAllQuiz={fetchAllQuizzes}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
                        <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
                        <h3 className="mb-2 text-xl font-semibold text-gray-600">
                            No submitted quizzes found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting the batch, mode, or status filters.
                        </p>
                    </div>
                )}
            </div>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <TablePagination
                    rowsPerPageOptions={[12, 24, 36]}
                    component="div"
                    count={totalItems}
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
        </>
    );
};

export default SubmittedQuizCard;
