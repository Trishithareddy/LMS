import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Clock,
    BookOpen,
    Flag,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
} from "lucide-react";
import QuestionComponent from "../StudentQuizSection/components/QuestionComponent";
import SubmitModal from "../StudentQuizSection/components/SubmitModal";
import { Snackbar, Alert } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";

const ChapterQuizInStudent = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [timeRemaining, setTimeRemaining] = useState(20 * 60);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [loading, setLoading] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [quiz, setChapterQuiz] = useState(null);

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    useEffect(() => {
        const fetchAttemptData = async () => {
            setLoading(true);

            try {
                if (!id) {
                    console.error("Quiz ID is missing in URL parameters.");
                    return;
                }

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapter-quiz/get-chapter-quiz/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const fetchedQuiz = response.data?.quiz;

                setChapterQuiz(fetchedQuiz);

                if (fetchedQuiz?.timeLimit) {
                    setTimeRemaining(Number(fetchedQuiz.timeLimit) * 60);
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
                showSnackbar(
                    error.response?.data?.message || "Error fetching quiz",
                    "error",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAttemptData();
    }, [id]);

    const handleSubmitQuiz = useCallback(
        async (autoSubmit = false) => {
            if (!quiz) {
                showSnackbar("Quiz data not available", "error");
                return;
            }

            const duration = Math.max(
                0,
                Number(quiz.timeLimit || 0) * 60 - Number(timeRemaining || 0),
            );

            const transformedAnswers = (quiz.questions || []).map(
                (question) => ({
                    questionId: question._id,
                    selectedOption: answers[question._id] ?? "",
                }),
            );

            try {
                setLoading(true);

                const token = localStorage.getItem("token");

                const payload = {
                    ChapterquizId: quiz._id,
                    answers: transformedAnswers,
                    duration,
                };

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/chapter-quiz/submit-chapter-quiz`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data?.success) {
                    const backendResult = response.data?.result || {};
                    const attemptId = response.data?.AttemptQuiz?._id;

                    showSnackbar(
                        response.data.message || "Quiz submitted successfully",
                    );

                    navigate(
                        `/student-dashboard/chapter-quiz-result/${attemptId}`,
                        {
                            state: {
                                quiz,
                                answers,
                                attemptId,
                                result: backendResult,
                                evaluatedAnswers: backendResult.answers || [],
                                score: backendResult.score,
                                totalMarks: backendResult.totalMarks,
                                percentage: backendResult.percentage,
                                duration,
                                isPassed: backendResult.isPassed,
                                autoSubmit,
                            },
                        },
                    );
                }
            } catch (err) {
                console.error("Error submitting quiz:", err);

                showSnackbar(
                    err.response?.data?.message ||
                        err.response?.data?.error ||
                        "Error submitting quiz",
                    "error",
                );
            } finally {
                setLoading(false);
                setShowSubmitModal(false);
            }
        },
        [quiz, answers, timeRemaining, navigate],
    );

    useEffect(() => {
        if (!quiz) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz(true);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz, handleSubmitQuiz]);

    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            setLastSaved(new Date());
        }
    }, [answers]);

    if (loading && !quiz) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!quiz) {
        return <div className="text-center py-10">No quiz data available.</div>;
    }

    const currentQuestion = quiz?.questions?.[currentQuestionIndex];

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes
                .toString()
                .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }

        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleMarkForReview = (questionId) => {
        setMarkedForReview((prev) => {
            const newSet = new Set(prev);

            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }

            return newSet;
        });
    };

    const getQuestionStatus = (questionId, index) => {
        const isAnswered = answers[questionId] !== undefined;
        const isMarked = markedForReview.has(questionId);
        const isCurrent = index === currentQuestionIndex;

        if (isCurrent) return "current";
        if (isMarked) return "marked";
        if (isAnswered) return "answered";
        return "unanswered";
    };

    const getAnsweredCount = () => {
        return Object.keys(answers).length;
    };

    const getTimeWarningColor = () => {
        if (timeRemaining <= 300) return "text-red-600";
        if (timeRemaining <= 600) return "text-yellow-600";
        return "text-green-600";
    };

    return (
        <>
            <div className="min-h-screen bg-[#F9F8F6]">
                {!showSubmitModal ? (
                    <>
                        <div className="bg-white shadow-md border-b">
                            <div className="max-w-6xl mx-auto px-4 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                            <span>Back to Quizzes</span>
                                        </button>

                                        <div className="h-6 w-px bg-gray-300"></div>

                                        <h1 className="text-xl font-semibold text-gray-900">
                                            {quiz.title}
                                        </h1>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {lastSaved && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <CheckCircle
                                                    size={16}
                                                    className="text-green-500"
                                                />
                                                <span>
                                                    Saved at{" "}
                                                    {lastSaved.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`flex items-center gap-2 font-mono text-lg ${getTimeWarningColor()}`}
                                        >
                                            <Clock size={20} />
                                            <span>
                                                {formatTime(timeRemaining)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-6xl mx-auto px-4 py-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-3">
                                    <div className="bg-white rounded-lg shadow-md">
                                        <div className="border-b border-gray-200 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    Question{" "}
                                                    {currentQuestionIndex + 1}{" "}
                                                    of {quiz.questions.length}
                                                </h2>

                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <BookOpen size={16} />
                                                    <span>
                                                        {currentQuestion?.marks}{" "}
                                                        marks
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${
                                                            ((currentQuestionIndex +
                                                                1) /
                                                                quiz.questions
                                                                    .length) *
                                                            100
                                                        }%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            {currentQuestion && (
                                                <QuestionComponent
                                                    question={currentQuestion}
                                                    answer={
                                                        answers[
                                                            currentQuestion._id
                                                        ]
                                                    }
                                                    onAnswerChange={
                                                        handleAnswerChange
                                                    }
                                                />
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setCurrentQuestionIndex(
                                                                Math.max(
                                                                    0,
                                                                    currentQuestionIndex -
                                                                        1,
                                                                ),
                                                            )
                                                        }
                                                        disabled={
                                                            currentQuestionIndex ===
                                                            0
                                                        }
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft
                                                            size={16}
                                                        />
                                                        Previous
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setCurrentQuestionIndex(
                                                                Math.min(
                                                                    quiz
                                                                        .questions
                                                                        .length -
                                                                        1,
                                                                    currentQuestionIndex +
                                                                        1,
                                                                ),
                                                            )
                                                        }
                                                        disabled={
                                                            currentQuestionIndex ===
                                                            quiz.questions
                                                                .length -
                                                                1
                                                        }
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Next
                                                        <ChevronRight
                                                            size={16}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            handleMarkForReview(
                                                                currentQuestion._id,
                                                            )
                                                        }
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                                            markedForReview.has(
                                                                currentQuestion._id,
                                                            )
                                                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                                                : "border border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <Flag size={16} />
                                                        {markedForReview.has(
                                                            currentQuestion._id,
                                                        )
                                                            ? "Marked for Review"
                                                            : "Mark for Review"}
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setShowSubmitModal(
                                                                true,
                                                            )
                                                        }
                                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                                    >
                                                        Submit Quiz
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                                        <h3 className="font-semibold text-gray-900 mb-4">
                                            Quiz Progress
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {getAnsweredCount()}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    Answered
                                                </div>
                                            </div>

                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <div className="text-2xl font-bold text-yellow-600">
                                                    {markedForReview.size}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    Marked
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            {quiz.questions.map(
                                                (question, index) => {
                                                    const status =
                                                        getQuestionStatus(
                                                            question._id,
                                                            index,
                                                        );

                                                    let className =
                                                        "w-8 h-8 rounded text-xs font-medium flex items-center justify-center cursor-pointer transition-colors ";

                                                    switch (status) {
                                                        case "current":
                                                            className +=
                                                                "bg-green-600 text-white ring-2 ring-green-300";
                                                            break;
                                                        case "answered":
                                                            className +=
                                                                "bg-green-100 text-green-800 hover:bg-green-200";
                                                            break;
                                                        case "marked":
                                                            className +=
                                                                "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
                                                            break;
                                                        default:
                                                            className +=
                                                                "bg-gray-100 text-gray-600 hover:bg-gray-200";
                                                    }

                                                    return (
                                                        <button
                                                            key={question._id}
                                                            onClick={() =>
                                                                setCurrentQuestionIndex(
                                                                    index,
                                                                )
                                                            }
                                                            className={
                                                                className
                                                            }
                                                            title={`Question ${
                                                                index + 1
                                                            } - ${status}`}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-100 rounded"></div>
                                                <span className="text-gray-600">
                                                    Answered
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                                                <span className="text-gray-600">
                                                    Marked for Review
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                                                <span className="text-gray-600">
                                                    Not Answered
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <SubmitModal
                        quiz={quiz}
                        answeredCount={getAnsweredCount()}
                        markedCount={markedForReview.size}
                        onConfirm={() => handleSubmitQuiz(false)}
                        onCancel={() => setShowSubmitModal(false)}
                        isLoading={loading}
                    />
                )}

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
        </>
    );
};

export default ChapterQuizInStudent;
