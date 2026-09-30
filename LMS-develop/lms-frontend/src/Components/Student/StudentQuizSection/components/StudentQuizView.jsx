import React, { useMemo, useState, useEffect } from 'react'
import {
    Snackbar,
    Alert,
    CircularProgress
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios"
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Award, Home, RotateCcw, Eye, Pencil, Save, X } from 'lucide-react';
const StudentQuizView = () => {

    const [quizzes, setQuizzes] = useState(null)
    const [attemptedData, setAttemptedData] = useState(null);
    const [answers, setAnswers] = useState([])
    const [editMode, setEditMode] = useState(false);
    const [reviewAnswers, setReviewAnswers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [savingReview, setSavingReview] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };
    const navigate = useNavigate();
    const isTeacherView = window.location.pathname.includes("/teacher-dashboard/");

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    }

    useEffect(() => {
        const fetchAttemptData = async () => {
            setLoading(true);
            const attemptId = window.location.pathname.split("/").pop();
            // console.log("Attempt Id ", attemptId)
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/quiz/attempt/${attemptId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setAttemptedData(response.data?.attempt)
                setQuizzes(response.data?.attempt?.quizId || []);
                setAnswers(response.data?.attempt?.answers || [])
                setReviewAnswers(response.data?.attempt?.answers || [])
                showSnackbar("Quizzes Fetched successfully");
            } catch (error) {
                console.error("Error fetching Questions:", error);
                showSnackbar("Error While Fetching Quizzes", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAttemptData();
    }, []);

    const getGrade = (percentage) => {
        if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
        if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
        if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' };
        if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600' };
        if (percentage >= 50) return { grade: 'D', color: 'text-orange-600' };
        return { grade: 'F', color: 'text-red-600' };
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };
    const getAnswerResult = (question, userAnswer) => {
        if (!question.correctAnswer) return false;

        if (question.type === 'Very Short Answer' || question.type === 'Fill In the Blanks') {
            // Simple contains check for demo purposes
            return userAnswer?.toString().toLowerCase().includes(
                question.correctAnswer.toString().toLowerCase()
            );
        }

        // works for string or array
        if (Array.isArray(question.correctAnswer)) {
            return Array.isArray(userAnswer)
                ? question.correctAnswer.every(opt => userAnswer.includes(opt))
                : question.correctAnswer.includes(userAnswer);
        }

        return userAnswer === question.correctAnswer;
    };


    const getUserAnswer = (questionId) => {
        const currAns = answers.find(
            (a) => a.questionId?.toString() === questionId?.toString()
        );
        return currAns ? currAns.selectedOption : null;
    };

    const reviewSummary = useMemo(() => {
        const totalScore = reviewAnswers.reduce(
            (sum, answer) => sum + Number(answer?.awardedMarks || 0),
            0,
        );
        const totalMarks = Number(quizzes?.totalMarks || 0);
        const percentage = totalMarks
            ? Math.round((totalScore / totalMarks) * 10000) / 100
            : 0;

        return {
            score: totalScore,
            percentage,
            isPassed: percentage >= Number(quizzes?.passingPercentage || 0),
        };
    }, [quizzes?.passingPercentage, quizzes?.totalMarks, reviewAnswers]);
    const currentPercentage = editMode ? reviewSummary.percentage : attemptedData?.percentage;
    const { grade, color } = getGrade(currentPercentage);

    const updateReviewedAnswer = (questionId, field, value) => {
        setReviewAnswers((previous) =>
            previous.map((answer) => {
                if (answer.questionId?.toString() !== questionId?.toString()) {
                    return answer;
                }

                if (field === "awardedMarks") {
                    const question = quizzes?.questions?.find(
                        (q) => q._id?.toString() === questionId?.toString(),
                    );
                    const maxMarks = Number(question?.marks || answer.maxMarks || 0);
                    const nextMarks = Number(value);
                    const safeMarks = Number.isFinite(nextMarks)
                        ? Math.min(Math.max(nextMarks, 0), maxMarks)
                        : 0;

                    return {
                        ...answer,
                        maxMarks,
                        awardedMarks: safeMarks,
                        isCorrect: safeMarks >= maxMarks && maxMarks > 0,
                    };
                }

                return {
                    ...answer,
                    [field]: value,
                };
            }),
        );
    };

    const cancelReview = () => {
        setReviewAnswers(attemptedData?.answers || []);
        setEditMode(false);
    };

    const saveReview = async () => {
        try {
            setSavingReview(true);
            const token = localStorage.getItem("token");
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/quiz/attempt/${attemptedData?._id}/review`,
                {
                    answers: reviewAnswers.map((answer) => ({
                        questionId: answer.questionId,
                        awardedMarks: Number(answer.awardedMarks || 0),
                        feedback: answer.feedback || "",
                    })),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const nextAttempt = response.data?.attempt;
            setAttemptedData(nextAttempt);
            setQuizzes(nextAttempt?.quizId || []);
            setAnswers(nextAttempt?.answers || []);
            setReviewAnswers(nextAttempt?.answers || []);
            setEditMode(false);
            showSnackbar("Teacher review saved successfully");
        } catch (error) {
            console.error("Error saving teacher review:", error);
            showSnackbar("Failed to save reviewed marks", "error");
        } finally {
            setSavingReview(false);
        }
    };




    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <CircularProgress />
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-[#F9F8F6] py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${(editMode ? reviewSummary.isPassed : attemptedData?.isPassed) ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {(editMode ? reviewSummary.isPassed : attemptedData?.isPassed) ? (
                            <CheckCircle className="text-green-600" size={48} />
                        ) : (
                            <XCircle className="text-red-600" size={48} />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {(editMode ? reviewSummary.isPassed : attemptedData?.isPassed) ? 'Congratulations!' : 'Quiz Completed'}
                    </h1>
                    {/* <p className="text-gray-600">
                        {autoSubmitted 
                            ? 'Your quiz was automatically submitted due to time expiry.'
                            : 'Your quiz has been submitted successfully.'
                        }
                    </p> */}
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">{quizzes?.title}</h2>

                    {/* Score Display */}
                    <div className="text-center mb-8">
                        <div className={`text-6xl font-bold mb-2 ${color}`}>
                            {Math.round(editMode ? reviewSummary.percentage : attemptedData?.percentage)}%
                        </div>
                        <div className={`text-2xl font-semibold mb-4 ${color}`}>
                            Grade: {grade}
                        </div>
                        <div className="text-lg text-gray-600">
                            {editMode ? reviewSummary.score : attemptedData?.score} out of {quizzes?.totalMarks} marks
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center mb-8">
                        <div className={`px-6 py-3 rounded-full font-semibold ${(editMode ? reviewSummary.isPassed : attemptedData?.isPassed)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {(editMode ? reviewSummary.isPassed : attemptedData?.isPassed) ? 'PASSED' : 'FAILED'}
                        </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <Clock size={24} className="text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-blue-700">{formatDuration(attemptedData?.duration) || "30 min"} </div>
                            <div className="text-sm text-gray-600">Time Taken</div>
                        </div>

                        <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                            <div className="text-2xl font-bold text-green-700">
                                {(editMode ? reviewAnswers : answers).filter(
                                    (answer) => answer?.isCorrect,
                                ).length}
                            </div>
                            <div className="text-sm text-gray-600">Correct Answers</div>
                        </div>

                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-center mb-3">
                                <Award size={24} className="text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-purple-700">{quizzes?.passingPercentage}%</div>
                            <div className="text-sm text-gray-600">Passing Score</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Results */}

                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Detailed Results</h3>
                        {isTeacherView && (
                            <div className="flex flex-wrap gap-3">
                                {!editMode ? (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                                    >
                                        <Pencil size={16} />
                                        Edit Marks
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={cancelReview}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveReview}
                                            disabled={savingReview}
                                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                                        >
                                            <Save size={16} />
                                            {savingReview ? "Saving..." : "Save Review"}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        {quizzes?.questions.map((question, index) => {
                            const userAnswer = getUserAnswer(question._id);
                            const answerDetails = (editMode ? reviewAnswers : answers).find(
                                (answer) => answer.questionId?.toString() === question._id?.toString()
                            );
                            const awardedMarks = Number(answerDetails?.awardedMarks ?? (getAnswerResult(question, userAnswer) ? question.marks : 0));
                            const isCorrect = typeof answerDetails?.isCorrect === "boolean"
                                ? answerDetails.isCorrect
                                : getAnswerResult(question, userAnswer);

                            return (
                                <div key={question._id} className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">
                                                    Question {index + 1}
                                                </h4>
                                                <div className="text-sm text-gray-500">
                                                    {awardedMarks} / {question.marks} marks
                                                </div>
                                            </div>

                                            <p className="text-gray-700 mb-4">{question.question}</p>

                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Your Answer: </span>
                                                    <span className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                        {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'Not answered'}
                                                    </span>
                                                </div>

                                                {isTeacherView && editMode && (
                                                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-amber-100 bg-amber-50 p-4 md:grid-cols-2">
                                                        <div>
                                                            <span className="mb-2 block text-sm font-medium text-gray-700">
                                                                Awarded Marks
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={question.marks}
                                                                step="0.5"
                                                                value={answerDetails?.awardedMarks ?? 0}
                                                                onChange={(e) =>
                                                                    updateReviewedAnswer(
                                                                        question._id,
                                                                        "awardedMarks",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="mb-2 block text-sm font-medium text-gray-700">
                                                                Teacher Feedback
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={answerDetails?.feedback || ""}
                                                                onChange={(e) =>
                                                                    updateReviewedAnswer(
                                                                        question._id,
                                                                        "feedback",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="Optional review note"
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {isTeacherView && !editMode && answerDetails?.feedback && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">Review Note: </span>
                                                        <span className="text-gray-700">
                                                            {answerDetails.feedback}
                                                        </span>
                                                    </div>
                                                )}

                                                {quizzes.showCorrectAnswers && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">Correct Answer: </span>
                                                        <span className="text-green-700">
                                                            {Array.isArray(question.correctAnswer)
                                                                ? question.correctAnswer.join(', ')
                                                                : question.correctAnswer
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


                {/* Actions */}
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

    )
}

export default StudentQuizView
