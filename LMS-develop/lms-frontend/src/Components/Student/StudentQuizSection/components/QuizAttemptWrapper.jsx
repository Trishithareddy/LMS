import React,{useState,useEffect} from 'react';
import { useNavigate } from 'react-router-dom'
import QuizAttempt from "../components/QuizAttempt"
import axios from 'axios'
import {
    CircularProgress,
    Button,
    Box,
    Paper,
    Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function QuizAttemptWrapper() {
    const [quize, setQuize] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const navigate = useNavigate();
    const theme = useTheme();
    
    const quizId = window.location.pathname.split("/").pop();
    
    const fetchSingleQuiz = async () => {
        setIsLoading(true);
        setFetchError("");
       
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quiz/attempt-quiz/${quizId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const payload = response.data?.data || response.data?.quizObj || null;
            setQuize(payload);
          
        } catch (error) {
            console.error("Error fetching Questions:", error);
            const message =
                error?.response?.data?.message || "Unable to open this quiz right now.";

            if (error?.response?.data?.attemptId) {
                navigate(`/student-dashboard/quiz-result/${error.response.data.attemptId}`);
                return;
            }

            setFetchError(message);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchSingleQuiz();
    }, [quizId]);
    // // if (!quiz) {
    //     return navigate("/student-dashboard");
    // // }

    if (isLoading) {
        return (
            <Box
    sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
    }}
>
    <CircularProgress color="success" />
</Box>
        );
    }

    if (fetchError || !quize) {
        return (
           <Box
    sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        bgcolor: "background.default",
    }}
>
    <Paper
        elevation={6}
        sx={{
            maxWidth: 600,
            width: "100%",
            p: 5,
            borderRadius: 4,
            textAlign: "center",
            bgcolor: "background.paper",
        }}
    >
                    <Typography variant="h4" fontWeight={700}>Quiz unavailable</Typography>
                    <Typography color="text.secondary" sx={{ mt: 3 }}>
                        {fetchError || "We couldn't load this quiz."}
                    </Typography>
                    <Box sx={{ mt: 6, display: "flex", justifyContent: "center", gap: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/student-dashboard/assessments")}
                        >
                            Back to Quizzes
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    if (quize.status !== 'active') {
        return (
           <Box
    sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
    }}
>
    <Typography variant="h5">
        This quiz is not active right now.
    </Typography>
</Box>
        );
    }

    if (!hasStarted) {
        const isFunQuiz = quize.quizMode === "fun" || quize.quizMode === "revision";

        return (
            <Box
    sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        bgcolor: "background.default",
    }}
>
                <Paper
                    elevation={6}
                    sx={{
                        width: "100%",
                        maxWidth: 600,
                        p: 5,
                        borderRadius: 4,
                    }}
                >
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isFunQuiz ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"}`}>
                            {quize.quizMode === "revision"
                                ? "Revision Challenge"
                                : isFunQuiz
                                  ? "Practice Quiz"
                                  : "Assessment"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                            {quize.questions?.length || 0} questions
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                            {quize.timeLimit || 30}s per question
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{quize.title}</h1>
                    <p className="mt-3 text-gray-600">
                        {quize.description ||
                            "Read carefully and answer one question at a time."}
                    </p>
                    <div className={`mt-6 rounded-xl border p-4 ${isFunQuiz ? "border-amber-200 bg-amber-50" : "border-green-100 bg-green-50"}`}>
                        {isFunQuiz
                            ? "Correct answers build points and streaks. Learn from the feedback as you play."
                            : quize.instructions ||
                              "Your answers are submitted when the quiz is completed."}
                    </div>
                    <button
                        onClick={() => setHasStarted(true)}
                        className="mt-8 rounded-xl bg-green-600 px-7 py-3 font-semibold text-white hover:bg-green-700"
                    >
                        Start Quiz
                    </button>
                </Paper>
            </Box>
        );
    }

    const liveCode = new URLSearchParams(window.location.search).get("liveCode");

    return (<QuizAttempt quiz={quize} liveCode={liveCode} />);
}

export default QuizAttemptWrapper;  
