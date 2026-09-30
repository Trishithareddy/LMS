import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Radio, UsersRound } from "lucide-react";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const statusColor = {
    waiting: "warning",
    live: "success",
    ended: "default",
};

const getParticipantScore = (participant) =>
    Number(participant.attempt?.score ?? participant.progress?.score ?? 0);

const getParticipantPercentage = (participant) =>
    Math.round(
        Number(
            participant.attempt?.percentage ??
            participant.progress?.percentage ??
            0,
        ),
    );

const getParticipantAnsweredCount = (participant) =>
    Number(
        participant.progress?.answeredCount ??
        (participant.attempt ? Number.MAX_SAFE_INTEGER : 0),
    );

const getRankedParticipants = (participants = []) =>
    [...participants].sort((first, second) => {
        const scoreGap =
            getParticipantScore(second) - getParticipantScore(first);
        if (scoreGap !== 0) return scoreGap;

        const percentageGap =
            getParticipantPercentage(second) -
            getParticipantPercentage(first);
        if (percentageGap !== 0) return percentageGap;

        return (
            getParticipantAnsweredCount(second) -
            getParticipantAnsweredCount(first)
        );
    });

const podiumStyle = {
    1: {
        label: "1st",
        title: "Top Performer",
        backgroundColor: "#fff2b8",
        borderColor: "#e6b800",
        minHeight: 190,
    },
    2: {
        label: "2nd",
        title: "Runner Up",
        backgroundColor: "#eef2f6",
        borderColor: "#a7b4c2",
        minHeight: 152,
    },
    3: {
        label: "3rd",
        title: "Third Place",
        backgroundColor: "#f6e1d0",
        borderColor: "#bd7b44",
        minHeight: 136,
    },
};

const LiveQuizHub = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [selectedBatchByQuiz, setSelectedBatchByQuiz] = useState({});
    const theme = useTheme();
    const dark = theme.palette.mode === "dark";

    const fetchData = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const [quizResponse, sessionResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/quiz/get-all-quizzes`, {
                    headers: authHeaders(),
                    params: {
                        limit: 30,
                        status: "active",
                        quizMode: "fun,revision",
                    },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/live-quiz/sessions`, {
                    headers: authHeaders(),
                }),
            ]);

            setQuizzes(quizResponse.data?.data?.quizzes || []);
            setSessions(sessionResponse.data?.sessions || []);
            setError("");
        } catch (fetchError) {
            console.error("Error loading live quizzes:", fetchError);
            setError("Live quiz rooms could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true);
        const intervalId = setInterval(() => fetchData(false), 5000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const launchRoom = async (quizId) => {
        setBusyId(quizId);
        try {
            const quiz = quizzes.find((item) => item._id === quizId);
            const assignedBatches = Array.isArray(quiz?.assignedTo)
                ? quiz.assignedTo
                : quiz?.assignedTo
                    ? [quiz.assignedTo]
                    : [];
            const batchId =
                selectedBatchByQuiz[quizId] || assignedBatches[0]?._id;
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/live-quiz/sessions`,
                { quizId, batchId },
                { headers: authHeaders() },
            );
            setSessions((prev) => [response.data.session, ...prev]);
            setError("");
        } catch (launchError) {
            console.error("Error creating live room:", launchError);
            setError(
                launchError.response?.data?.message ||
                "Live quiz room could not be created.",
            );
        } finally {
            setBusyId("");
        }
    };

    const updateRoom = async (sessionId, status) => {
        setBusyId(sessionId);
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/live-quiz/sessions/${sessionId}/status`,
                { status },
                { headers: authHeaders() },
            );
            setSessions((prev) =>
                prev.map((session) =>
                    session._id === sessionId ? response.data.session : session,
                ),
            );
        } catch (updateError) {
            console.error("Error updating live room:", updateError);
            setError("Live quiz room could not be updated.");
        } finally {
            setBusyId("");
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Launch Live Quiz
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                    Pick a practice quiz, share its room code, and start when students join.
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {quizzes.map((quiz) => (
                    <Grid item xs={12} md={6} xl={4} key={quiz._id}>
                        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip
                                        label={
                                            quiz.quizMode === "revision"
                                                ? "Revision Challenge"
                                                : "Practice Quiz"
                                        }
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${quiz.questions?.length || 0} questions`}
                                        size="small"
                                    />
                                </Stack>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {quiz.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Assigned batches:{" "}
                                    {(Array.isArray(quiz.assignedTo)
                                        ? quiz.assignedTo
                                        : quiz.assignedTo
                                            ? [quiz.assignedTo]
                                            : []
                                    )
                                        .map((batch) => batch.batchName || batch.name)
                                        .join(", ") || "Assigned batch"}
                                </Typography>
                                {Array.isArray(quiz.assignedTo) &&
                                    quiz.assignedTo.length > 1 && (
                                        <FormControl fullWidth size="small">
                                            <InputLabel id={`live-batch-${quiz._id}`}>
                                                Live batch
                                            </InputLabel>
                                            <Select
                                                labelId={`live-batch-${quiz._id}`}
                                                label="Live batch"
                                                value={
                                                    selectedBatchByQuiz[quiz._id] ||
                                                    quiz.assignedTo[0]?._id ||
                                                    ""
                                                }
                                                onChange={(event) =>
                                                    setSelectedBatchByQuiz((prev) => ({
                                                        ...prev,
                                                        [quiz._id]: event.target.value,
                                                    }))
                                                }
                                            >
                                                {quiz.assignedTo.map((batch) => (
                                                    <MenuItem
                                                        key={batch._id}
                                                        value={batch._id}
                                                    >
                                                        {batch.batchName || batch.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<Radio size={16} />}
                                    onClick={() => launchRoom(quiz._id)}
                                    disabled={busyId === quiz._id}
                                >
                                    Create Live Room
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {!quizzes.length && (
                <Alert severity="info">
                    Create a Practice Quiz first. Live rooms are launched from practice quizzes and revision challenges.
                </Alert>
            )}

            <Divider />

            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Recent Rooms
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                    Joined student counts refresh while this tab stays open.
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {sessions.map((session) => {
                    const rankedParticipants = getRankedParticipants(
                        session.participants,
                    );
                    const leader = rankedParticipants[0];
                    const activeRankedParticipants = rankedParticipants.filter(
                        (participant) =>
                            participant.attempt ||
                            participant.progress?.answeredCount,
                    );
                    const podiumParticipants =
                        activeRankedParticipants.slice(0, 3);
                    const podiumOrder =
                        podiumParticipants.length === 3
                            ? [podiumParticipants[1], podiumParticipants[0], podiumParticipants[2]]
                            : podiumParticipants.length === 2
                                ? [podiumParticipants[1], podiumParticipants[0]]
                                : podiumParticipants;

                    return (
                        <Grid item xs={12} lg={6} key={session._id}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    bgcolor: "background.paper",
                                    borderColor: "divider",
                                }}
                            >
                                <Stack spacing={2}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        gap={1}
                                    >
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {session.quiz?.title || "Live Quiz"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {session.batch?.batchName || "Batch room"}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                label={session.status}
                                                color={statusColor[session.status]}
                                                size="small"
                                            />
                                            <Chip
                                                label={session.code}
                                                color="primary"
                                                sx={{ fontWeight: 700, letterSpacing: 1 }}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <UsersRound size={18} />
                                        <Typography>
                                            {session.participants?.length || 0} students joined
                                        </Typography>
                                    </Stack>

                                    {!!session.participants?.length && (
                                        <>
                                            {session.status === "live" &&
                                                leader &&
                                                (leader.attempt ||
                                                    leader.progress?.answeredCount) && (
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: dark ? "rgba(46,125,50,0.15)" : "#effaf0",
                                                            borderColor: dark ? "success.dark" : "#a5d6a7",
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: "success.main",
                                                                textTransform:
                                                                    "uppercase",
                                                            }}
                                                        >
                                                            Leading Now
                                                        </Typography>
                                                        <Stack
                                                            direction={{
                                                                xs: "column",
                                                                sm: "row",
                                                            }}
                                                            justifyContent="space-between"
                                                            gap={1}
                                                            sx={{ mt: 0.5 }}
                                                        >
                                                            <Typography
                                                                variant="h6"
                                                                sx={{ fontWeight: 700 }}
                                                            >
                                                                {leader.student?.name ||
                                                                    "Student"}
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: "success.main",
                                                                }}
                                                            >
                                                                {getParticipantScore(
                                                                    leader,
                                                                )}{" "}
                                                                pts
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                )}

                                            {session.status === "ended" &&
                                                podiumParticipants.length > 0 && (
                                                    <Box>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                mb: 1,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Final Podium
                                                        </Typography>
                                                        <Grid
                                                            container
                                                            spacing={1}
                                                            alignItems="flex-end"
                                                        >
                                                            {podiumOrder.map(
                                                                (participant) => {
                                                                    const rank =
                                                                        rankedParticipants.findIndex(
                                                                            (item) =>
                                                                                String(
                                                                                    item.student
                                                                                        ?._id ||
                                                                                    item.student,
                                                                                ) ===
                                                                                String(
                                                                                    participant
                                                                                        .student
                                                                                        ?._id ||
                                                                                    participant.student,
                                                                                ),
                                                                        ) + 1;
                                                                    const podium =
                                                                        podiumStyle[
                                                                        rank
                                                                        ];

                                                                    return (
                                                                        <Grid
                                                                            item
                                                                            xs={12}
                                                                            sm={
                                                                                podiumOrder.length ===
                                                                                    1
                                                                                    ? 7
                                                                                    : podiumOrder.length ===
                                                                                        2
                                                                                        ? 5
                                                                                        : 4
                                                                            }
                                                                            key={
                                                                                participant
                                                                                    .student
                                                                                    ?._id ||
                                                                                participant.student
                                                                            }
                                                                        >
                                                                            <Paper
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    p: 2,
                                                                                    minHeight:
                                                                                        podium.minHeight,
                                                                                    display:
                                                                                        "flex",
                                                                                    flexDirection:
                                                                                        "column",
                                                                                    justifyContent:
                                                                                        "space-between",
                                                                                    backgroundColor:
                                                                                        podium.backgroundColor,
                                                                                    borderColor:
                                                                                        podium.borderColor,
                                                                                    boxShadow:
                                                                                        rank ===
                                                                                            1
                                                                                            ? "0 10px 24px rgba(102, 76, 0, 0.16)"
                                                                                            : "none",
                                                                                }}
                                                                            >
                                                                                <Stack
                                                                                    direction="row"
                                                                                    justifyContent="space-between"
                                                                                    alignItems="center"
                                                                                    gap={1}
                                                                                >
                                                                                    <Chip
                                                                                        label={
                                                                                            podium.label
                                                                                        }
                                                                                        size="small"
                                                                                        sx={{
                                                                                            fontWeight: 700,
                                                                                        }}
                                                                                    />
                                                                                    <Typography
                                                                                        variant="caption"
                                                                                        sx={{
                                                                                            fontWeight: 700,
                                                                                            textTransform:
                                                                                                "uppercase",
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            podium.title
                                                                                        }
                                                                                    </Typography>
                                                                                </Stack>
                                                                                <Box>
                                                                                    <Typography
                                                                                        variant="h6"
                                                                                        sx={{
                                                                                            fontWeight: 700,
                                                                                        }}
                                                                                    >
                                                                                        {participant
                                                                                            .student
                                                                                            ?.name ||
                                                                                            "Student"}
                                                                                    </Typography>
                                                                                    <Typography variant="body2">
                                                                                        {getParticipantScore(
                                                                                            participant,
                                                                                        )}{" "}
                                                                                        /{" "}
                                                                                        {session
                                                                                            .quiz
                                                                                            ?.totalMarks ||
                                                                                            0}{" "}
                                                                                        marks
                                                                                    </Typography>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            opacity: 0.8,
                                                                                        }}
                                                                                    >
                                                                                        {getParticipantPercentage(
                                                                                            participant,
                                                                                        )}
                                                                                        %
                                                                                        accuracy
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Paper>
                                                                        </Grid>
                                                                    );
                                                                },
                                                            )}
                                                        </Grid>
                                                    </Box>
                                                )}

                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: dark
                                                                ? "rgba(46,125,50,0.12)"
                                                                : "#f6fff7",
                                                            borderColor: theme.palette.divider,
                                                        }}
                                                    >
                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                            {session.resultSummary?.submittedCount || 0}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Submitted
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: dark
                                                                ? "rgba(255,152,0,0.12)"
                                                                : "#fffaf0",
                                                            borderColor: theme.palette.divider,
                                                        }}
                                                    >
                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                            {session.resultSummary?.averagePercentage || 0}%
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Average Score
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>

                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    overflow: "hidden",
                                                    bgcolor: "background.paper",
                                                    borderColor: "divider",
                                                }}
                                            >
                                                <Table size="small" aria-label="live quiz leaderboard">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Rank</TableCell>
                                                            <TableCell>Student</TableCell>
                                                            <TableCell align="right">Marks</TableCell>
                                                            <TableCell align="right">Status</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {rankedParticipants.map((participant, index) => (
                                                            <TableRow
                                                                key={participant.student?._id || participant.student}
                                                            >
                                                                <TableCell>
                                                                    {participant.attempt ||
                                                                        participant.progress?.answeredCount
                                                                        ? `#${index + 1}`
                                                                        : "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {participant.student?.name || "Student"}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {participant.attempt
                                                                        ? `${participant.attempt.score} / ${session.quiz?.totalMarks || 0} (${Math.round(participant.attempt.percentage || 0)}%)`
                                                                        : participant.progress?.answeredCount
                                                                            ? `${participant.progress.score} / ${session.quiz?.totalMarks || 0} (${participant.progress.percentage || 0}%)`
                                                                            : "Waiting"}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {participant.attempt ? (
                                                                        <Chip
                                                                            label={
                                                                                participant.attempt.isPassed
                                                                                    ? "Passed"
                                                                                    : "Submitted"
                                                                            }
                                                                            size="small"
                                                                            color={
                                                                                participant.attempt.isPassed
                                                                                    ? "success"
                                                                                    : "warning"
                                                                            }
                                                                        />
                                                                    ) : participant.progress?.answeredCount ? (
                                                                        <Chip
                                                                            label={`${participant.progress.answeredCount} answered`}
                                                                            size="small"
                                                                            color="info"
                                                                        />
                                                                    ) : (
                                                                        <Chip
                                                                            label="In room"
                                                                            size="small"
                                                                            variant="outlined"
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Paper>
                                        </>
                                    )}

                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {session.status === "waiting" && (
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => updateRoom(session._id, "live")}
                                                disabled={busyId === session._id}
                                            >
                                                Start Room
                                            </Button>
                                        )}
                                        {session.status === "live" && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => updateRoom(session._id, "ended")}
                                                disabled={busyId === session._id}
                                            >
                                                End Room
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Stack>
    );
};

export default LiveQuizHub;
