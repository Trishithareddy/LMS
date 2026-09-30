import React, { useState, useEffect } from "react";
import {
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Award, Home } from "lucide-react";

const ChapterQuizResultInStudent = () => {
    const [quizzes, setQuizzes] = useState(null);
    const [attemptedData, setAttemptedData] = useState(null);
    const [answers, setAnswers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const navigate = useNavigate();
    const { attemptId } = useParams();

    useEffect(() => {
        const fetchAttemptData = async () => {
            if (!attemptId) return;

            setLoading(true);

            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapter-quiz/get-submitted-chapter-quiz/${attemptId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const attempt = response.data?.attempt;

                setAttemptedData(attempt);
                setQuizzes(attempt?.ChapterquizId || null);
                setAnswers(Array.isArray(attempt?.answers) ? attempt.answers : []);
            } catch (error) {
                console.error("Error fetching quiz result:", error);
                showSnackbar(
                    error.response?.data?.message ||
                        "Error while fetching quiz result",
                    "error",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttemptData();
    }, [attemptId]);

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const getGrade = (percentage = 0) => {
        if (percentage >= 90) return { grade: "A+", color: "text-green-600" };
        if (percentage >= 80) return { grade: "A", color: "text-green-600" };
        if (percentage >= 70) return { grade: "B", color: "text-blue-600" };
        if (percentage >= 60) return { grade: "C", color: "text-yellow-600" };
        if (percentage >= 50) return { grade: "D", color: "text-orange-600" };
        return { grade: "F", color: "text-red-600" };
    };

    const formatDuration = (seconds = 0) => {
        const safeSeconds = Number(seconds || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = safeSeconds % 60;

        return `${minutes}m ${remainingSeconds}s`;
    };

    const formatAnswer = (answer) => {
        if (answer === undefined || answer === null || answer === "") {
            return "Not answered";
        }

        if (typeof answer === "boolean") {
            return answer ? "True" : "False";
        }

        if (Array.isArray(answer)) {
            return answer.join(", ");
        }

        return String(answer);
    };

    const getEvaluatedAnswer = (questionId) => {
        return answers.find(
            (answer) =>
                String(answer.questionId || "") === String(questionId || ""),
        );
    };

    const correctCount = answers.filter(
        (answer) =>
            answer.isCorrect === true ||
            Number(answer.awardedMarks || 0) === Number(answer.maxMarks || 0),
    ).length;

    const { grade, color } = getGrade(Number(attemptedData?.percentage || 0));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    if (!attemptedData || !quizzes) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] py-8">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Result not found
                    </h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F8F6] py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <div
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                            attemptedData?.isPassed
                                ? "bg-green-100"
                                : "bg-red-100"
                        }`}
                    >
                        {attemptedData?.isPassed ? (
                            <CheckCircle className="text-green-600" size={48} />
                        ) : (
                            <XCircle className="text-red-600" size={48} />
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {attemptedData?.isPassed
                            ? "Congratulations!"
                            : "Quiz Completed"}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                        {quizzes?.title}
                    </h2>

                    <div className="text-center mb-8">
                        <div className={`text-6xl font-bold mb-2 ${color}`}>
                            {Math.round(Number(attemptedData?.percentage || 0))}%
                        </div>

                        <div className={`text-2xl font-semibold mb-4 ${color}`}>
                            Grade: {grade}
                        </div>

                        <div className="text-lg text-gray-600">
                            {Number(attemptedData?.score || 0)} out of{" "}
                            {Number(quizzes?.totalMarks || 0)} marks
                        </div>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div
                            className={`px-6 py-3 rounded-full font-semibold ${
                                attemptedData?.isPassed
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                        >
                            {attemptedData?.isPassed ? "PASSED" : "FAILED"}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <Clock size={24} className="text-blue-600" />
                            </div>

                            <div className="text-2xl font-bold text-blue-700">
                                {formatDuration(attemptedData?.duration)}
                            </div>

                            <div className="text-sm text-gray-600">
                                Time Taken
                            </div>
                        </div>

                        <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <CheckCircle
                                    size={24}
                                    className="text-green-600"
                                />
                            </div>

                            <div className="text-2xl font-bold text-green-700">
                                {correctCount}
                            </div>

                            <div className="text-sm text-gray-600">
                                Fully Correct Answers
                            </div>
                        </div>

                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <Award size={24} className="text-purple-600" />
                            </div>

                            <div className="text-2xl font-bold text-purple-700">
                                {quizzes?.passingPercentage}%
                            </div>

                            <div className="text-sm text-gray-600">
                                Passing Score
                            </div>
                        </div>
                    </div>
                </div>

                {quizzes?.showCorrectAnswers && (
                    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            Detailed Results
                        </h3>

                        <div className="space-y-6">
                            {quizzes?.questions.map((question, index) => {
                                const evaluatedAnswer = getEvaluatedAnswer(
                                    question._id,
                                );

                                const awardedMarks = Number(
                                    evaluatedAnswer?.awardedMarks || 0,
                                );

                                const maxMarks = Number(
                                    evaluatedAnswer?.maxMarks ||
                                        question.marks ||
                                        0,
                                );

                                const isFullyCorrect =
                                    evaluatedAnswer?.isCorrect === true ||
                                    (maxMarks > 0 && awardedMarks === maxMarks);

                                const isPartial =
                                    awardedMarks > 0 && awardedMarks < maxMarks;

                                return (
                                    <div
                                        key={question._id}
                                        className="border border-gray-200 rounded-lg p-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    isFullyCorrect
                                                        ? "bg-green-100 text-green-600"
                                                        : isPartial
                                                          ? "bg-yellow-100 text-yellow-700"
                                                          : "bg-red-100 text-red-600"
                                                }`}
                                            >
                                                {isFullyCorrect ? (
                                                    <CheckCircle size={16} />
                                                ) : (
                                                    <XCircle size={16} />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                        Question {index + 1}
                                                    </h4>

                                                    <div className="text-sm text-gray-500">
                                                        {awardedMarks} /{" "}
                                                        {maxMarks} marks
                                                    </div>
                                                </div>

                                                <p className="text-gray-700 mb-4">
                                                    {question.question}
                                                </p>

                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Your Answer:{" "}
                                                        </span>

                                                        <span
                                                            className={
                                                                isFullyCorrect
                                                                    ? "text-green-700"
                                                                    : isPartial
                                                                      ? "text-yellow-700"
                                                                      : "text-red-700"
                                                            }
                                                        >
                                                            {formatAnswer(
                                                                evaluatedAnswer?.selectedOption,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Correct Answer:{" "}
                                                        </span>

                                                        <span className="text-green-700">
                                                            {formatAnswer(
                                                                evaluatedAnswer?.correctAnswer ??
                                                                    question.correctAnswer,
                                                            )}
                                                        </span>
                                                    </div>

                                                    {evaluatedAnswer?.feedback && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-600">
                                                                Feedback:{" "}
                                                            </span>

                                                            <span className="text-gray-700">
                                                                {
                                                                    evaluatedAnswer.feedback
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Home size={20} />
                        Back to Quizzes
                    </button>
                </div>
            </div>

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
        </div>
    );
};

export default ChapterQuizResultInStudent;