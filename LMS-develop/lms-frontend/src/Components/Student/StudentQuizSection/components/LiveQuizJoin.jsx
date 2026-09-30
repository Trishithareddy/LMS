import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const LiveQuizJoin = () => {
    const [code, setCode] = useState("");
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const theme = useTheme();

    const joinRoom = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/live-quiz/join`,
                { code },
                { headers: authHeaders() },
            );
            setSession(response.data.session);
            setError("");
        } catch (joinError) {
            console.error("Error joining live quiz:", joinError);
            setError(
                joinError.response?.data?.message ||
                    "That live quiz room is not available.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session?._id || session.status === "ended") return undefined;

        const intervalId = setInterval(async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/live-quiz/sessions/${session._id}`,
                    { headers: authHeaders() },
                );
                setSession(response.data.session);
            } catch (pollError) {
                console.error("Error refreshing live quiz room:", pollError);
            }
        }, 4000);

        return () => clearInterval(intervalId);
    }, [session?._id, session?.status]);

    const startQuiz = () => {
        navigate(`/student-dashboard/quiz/${session.quiz._id}?liveCode=${session.code}`);
    };

    return (
        <Box
    sx={{
        minHeight: "calc(100vh - 120px)",
        display: "grid",
        placeItems: "center",
        p: 2,
        bgcolor: "background.default",
    }}
>
            <Paper variant="outlined" sx={{ width: "min(540px, 100%)", p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Join Live Quiz
                        </Typography>
                        <Typography color="text.secondary">
                            Enter the room code shared by your teacher.
                        </Typography>
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    {!session && (
                        <>
                            <TextField
                                label="Room Code"
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value.toUpperCase())
                                }
                                inputProps={{ maxLength: 6 }}
                                placeholder="ABC234"
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                color="success"
                                onClick={joinRoom}
                                disabled={loading || code.trim().length < 6}
                            >
                                {loading ? <CircularProgress size={22} /> : "Join Room"}
                            </Button>
                        </>
                    )}

                    {session && (
                        <Stack spacing={2}>
                            <Alert severity={session.status === "live" ? "success" : "info"}>
                                {session.status === "live"
                                    ? "Your teacher started the quiz."
                                    : session.status === "ended"
                                      ? "This live quiz has ended."
                                      : "You are in. Wait for your teacher to start."}
                            </Alert>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {session.quiz?.title}
                                </Typography>
                                <Typography color="text.secondary">
                                    Room code: {session.code}
                                </Typography>
                            </Box>
                            {session.status === "live" && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={startQuiz}
                                >
                                    Start Live Quiz
                                </Button>
                            )}
                        </Stack>
                    )}
                </Stack>
            </Paper>
        </Box>
    );
};

export default LiveQuizJoin;
