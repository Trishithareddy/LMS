import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Flag, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import QuestionComponent from './QuestionComponent';
import SubmitModal from './SubmitModal';
import {
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  TablePagination
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from 'axios';

const QuizAttempt = ({ quiz, liveCode }) => {
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        No quiz data available.
      </div>
    );
  }

  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedbackByQuestion, setFeedbackByQuestion] = useState({});
  const awardedQuestionsRef = useRef(new Set());
  const isFunQuiz = quiz.quizMode === "fun" || quiz.quizMode === "revision";

  // ✅ quiz.timeLimit already in seconds (30/60/90/120)
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ✅ Stale closure fix — setInterval ke andar ye always fresh value dega
  const currentIndexRef = useRef(currentQuestionIndex);
  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  // ✅ Per-question timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          const currentIdx = currentIndexRef.current;
          const isLastQuestion = currentIdx === quiz.questions.length - 1;

          if (isLastQuestion) {
            // ✅ Last question expire — submit modal open karo
            setShowSubmitModal(true);
          } else {
            // ✅ Next question pe shift karo
            setCurrentQuestionIndex(currentIdx + 1);
          }

          // ✅ Timer reset
          return quiz.timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // ✅ Empty array — stale closure nahi hoga kyunki ref use kar rahe hain

  // ✅ Student khud navigate kare toh bhi timer reset ho
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setTimeRemaining(quiz.timeLimit);
  };

  const handleSnackbarClose = () => setOpenSnackbar(false);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Auto-save effect
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      setLastSaved(new Date());
    }
  }, [answers]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizeAnswerText = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/_/g, " ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const isCorrectAnswer = (question, answer) => {
    if (!question || answer == null || question.correctAnswer == null) return false;

    const normalizedAnswer = normalizeAnswerText(answer);
    const normalizedCorrect = normalizeAnswerText(question.correctAnswer);

    if (
      question.type === "Very Short Answer" ||
      question.type === "Fill In the Blanks"
    ) {
      return (
        normalizedAnswer === normalizedCorrect ||
        normalizedAnswer.includes(normalizedCorrect)
      );
    }

    return normalizedAnswer === normalizedCorrect;
  };

  const sendLiveProgress = async (nextAnswers) => {
    if (!liveCode) return;

    const stats = quiz.questions.reduce(
      (summary, question) => {
        const answer = nextAnswers[question._id];
        if (answer === undefined) return summary;

        const isCorrect = isCorrectAnswer(question, answer);
        return {
          answeredCount: summary.answeredCount + 1,
          correctCount: summary.correctCount + (isCorrect ? 1 : 0),
          score: summary.score + (isCorrect ? Number(question.marks || 0) : 0),
        };
      },
      { answeredCount: 0, correctCount: 0, score: 0 },
    );

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/live-quiz/progress`,
        { code: liveCode, ...stats },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
    } catch (error) {
      console.error("Error updating live quiz progress:", error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    const question = quiz.questions.find((item) => item._id === questionId);
    const isCorrect = isCorrectAnswer(question, answer);
    const nextAnswers = { ...answers, [questionId]: answer };

    setAnswers(nextAnswers);
    sendLiveProgress(nextAnswers);

    if (!isFunQuiz || awardedQuestionsRef.current.has(questionId)) {
      return;
    }

    awardedQuestionsRef.current.add(questionId);
    setFeedbackByQuestion((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        answer: question?.correctAnswer,
      },
    }));

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setPoints((prev) => prev + 100 + Math.min(nextStreak - 1, 4) * 20);
    } else {
      setStreak(0);
    }
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    const duration = (quiz.timeLimit * quiz.questions.length) - timeRemaining;

    const transformedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => {
      const question = quiz.questions.find((item) => item._id === questionId);
      return {
        questionId,
        selectedOption,
        ...(isFunQuiz && question?.correctAnswer != null
          ? { isCorrect: isCorrectAnswer(question, selectedOption) }
          : {}),
      };
    });

    try {
      setLoading(true);
      const data = {
        quizId: quiz._id,
        answers: transformedAnswers,
        duration,
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/quiz/attempt/submit`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (!isFunQuiz) {
          navigate(`/student-dashboard/quiz-result/${response.data.AttemptQuiz._id}`);
          return;
        }

        navigate("/student-dashboard/quiz-result", {
          state: {
            quiz,
            answers,
            score: response.data.AttemptQuiz.score,
            percentage: response.data.AttemptQuiz.percentage,
            duration,
            isPassed: response.data.AttemptQuiz.isPassed,
            autoSubmitted: autoSubmit,
            points,
            bestStreak,
          },
        });
        showSnackbar(response.data.message);
      }
    } catch (err) {
      console.error("Error Submitting Quiz:", err);
      showSnackbar("Error Submitting Quiz", "error");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (questionId, index) => {
    const isAnswered = answers[questionId] !== undefined;
    const isMarked = markedForReview.has(questionId);
    const isCurrent = index === currentQuestionIndex;

    if (isCurrent) return 'current';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  const getTimeWarningColor = () => {
    if (timeRemaining <= 10) return 'text-red-600';
    if (timeRemaining <= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <>
      <div className="min-h-screen bg-[#F9F8F6]">
        {!showSubmitModal ? (
          <>
            {/* Header — same as before */}
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
                    <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
                  </div>
                  <div className="flex items-center gap-6">
                    {isFunQuiz && (
                      <>
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                          {points} pts
                        </div>
                        <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
                          Streak x{streak}
                        </div>
                      </>
                    )}
                    {lastSaved && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Saved at {lastSaved.toLocaleTimeString()}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-2 font-mono text-lg ${getTimeWarningColor()}`}>
                      <Clock size={20} />
                      <span>{formatTime(timeRemaining)}</span>
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
                          Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <BookOpen size={16} />
                          <span>{currentQuestion.marks} marks</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-6">
                      <QuestionComponent
                        question={currentQuestion}
                        answer={answers[currentQuestion._id]}
                        onAnswerChange={handleAnswerChange}
                      />
                      {isFunQuiz && feedbackByQuestion[currentQuestion._id] && (
                        <div
                          className={`mt-5 rounded-xl border p-4 ${
                            feedbackByQuestion[currentQuestion._id].isCorrect
                              ? "border-green-200 bg-green-50 text-green-900"
                              : "border-amber-200 bg-amber-50 text-amber-950"
                          }`}
                        >
                          <p className="font-semibold">
                            {feedbackByQuestion[currentQuestion._id].isCorrect
                              ? "Correct. Keep the streak going."
                              : "Good try. Learn from this one and continue."}
                          </p>
                          {!feedbackByQuestion[currentQuestion._id].isCorrect &&
                            quiz.showCorrectAnswers && (
                              <p className="mt-1 text-sm">
                                Correct answer:{" "}
                                {String(feedbackByQuestion[currentQuestion._id].answer)}
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* ✅ goToQuestion use karo — timer bhi reset hoga */}
                          <button
                            onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={16} />
                            Previous
                          </button>
                          <button
                            onClick={() => goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                            disabled={currentQuestionIndex === quiz.questions.length - 1}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleMarkForReview(currentQuestion._id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${markedForReview.has(currentQuestion._id)
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            <Flag size={16} />
                            {markedForReview.has(currentQuestion._id) ? 'Marked for Review' : 'Mark for Review'}
                          </button>
                          <button
                            onClick={() => setShowSubmitModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            Submit Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Quiz Progress</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{getAnsweredCount()}</div>
                        <div className="text-xs text-gray-600">Answered</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{markedForReview.size}</div>
                        <div className="text-xs text-gray-600">Marked</div>
                      </div>
                    </div>
                    {isFunQuiz && (
                      <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 p-3">
                        <div className="text-2xl font-bold text-amber-800">{points}</div>
                        <div className="text-xs text-amber-900">
                          Points earned with best streak x{bestStreak}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      {quiz.questions.map((question, index) => {
                        const status = getQuestionStatus(question._id, index);
                        let className = 'w-8 h-8 rounded text-xs font-medium flex items-center justify-center cursor-pointer transition-colors ';
                        switch (status) {
                          case 'current': className += 'bg-green-600 text-white ring-2 ring-green-300'; break;
                          case 'answered': className += 'bg-green-100 text-green-800 hover:bg-green-200'; break;
                          case 'marked': className += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'; break;
                          default: className += 'bg-gray-100 text-gray-600 hover:bg-gray-200';
                        }
                        return (
                          <button
                            // {/* ✅ question.id → question._id fix */}
                            key={question._id}
                            onClick={() => goToQuestion(index)}
                            className={className}
                            title={`Question ${index + 1} - ${status}`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    {/* Legend — same as before */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 rounded"></div>
                        <span className="text-gray-600">Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                        <span className="text-gray-600">Marked for Review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-100 rounded"></div>
                        <span className="text-gray-600">Not Answered</span>
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
            onConfirm={() => handleSubmitQuiz()}
            onCancel={() => setShowSubmitModal(false)}
            isLoading={loading}
          />
        )}

        {/* Snackbar — same as before */}
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}
            icon={snackbarSeverity === "success" ? <CheckCircleOutlineIcon fontSize="inherit" /> : undefined}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default QuizAttempt;
