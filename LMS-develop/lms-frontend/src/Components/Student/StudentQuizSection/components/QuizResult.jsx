import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Home,
  RotateCcw,
  Eye,
} from "lucide-react";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state) {
    navigate("/student-dashboard");
    return null;
  }

  const {
    quiz,
    answers,
    score,
    percentage,
    duration,
    isPassed,
    autoSubmitted,
    points = 0,
    bestStreak = 0,
  } = state;
  const isFunQuiz = quiz.quizMode === "fun" || quiz.quizMode === "revision";
  const [historySnapshot, setHistorySnapshot] = useState(null);
  const historyKey = `practice-quiz-history:${quiz._id}`;

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGrade = (nextPercentage) => {
    if (nextPercentage >= 90) return { grade: "A+", color: "text-green-600" };
    if (nextPercentage >= 80) return { grade: "A", color: "text-green-600" };
    if (nextPercentage >= 70) return { grade: "B", color: "text-blue-600" };
    if (nextPercentage >= 60) return { grade: "C", color: "text-yellow-600" };
    if (nextPercentage >= 50) return { grade: "D", color: "text-orange-600" };
    return { grade: "F", color: "text-red-600" };
  };

  const getAnswerResult = (question, userAnswer) => {
    if (!question.correctAnswer) return null;
    if (
      question.type === "Very Short Answer" ||
      question.type === "Fill In the Blanks"
    ) {
      return userAnswer
        ?.toString()
        .toLowerCase()
        .trim()
        .includes(question.correctAnswer.toString().toLowerCase().trim());
    }
    return userAnswer === question.correctAnswer;
  };

  const { grade, color } = getGrade(percentage);

  useEffect(() => {
    if (!isFunQuiz) return;

    const raw = localStorage.getItem(historyKey);
    const previous = raw ? JSON.parse(raw) : null;
    const nextBestPercentage = Math.max(
      previous?.bestPercentage || 0,
      Math.round(percentage),
    );
    const nextBestPoints = Math.max(previous?.bestPoints || 0, points);
    const nextAttempts = Number(previous?.attempts || 0) + 1;

    localStorage.setItem(
      historyKey,
      JSON.stringify({
        bestPercentage: nextBestPercentage,
        bestPoints: nextBestPoints,
        attempts: nextAttempts,
        lastPercentage: Math.round(percentage),
        lastPoints: points,
      }),
    );

    setHistorySnapshot({
      previousPercentage: previous?.lastPercentage ?? null,
      previousPoints: previous?.lastPoints ?? null,
      bestPercentage: nextBestPercentage,
      bestPoints: nextBestPoints,
      attempts: nextAttempts,
      isNewBest:
        Math.round(percentage) > Number(previous?.bestPercentage || 0),
    });
  }, [historyKey, isFunQuiz, percentage, points]);

  const starsEarned =
    percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

  const wrongQuestions = useMemo(
    () =>
      quiz.questions.filter(
        (question) => !getAnswerResult(question, answers[question._id]),
      ),
    [answers, quiz.questions],
  );

  const revisionHint = useMemo(() => {
    if (!wrongQuestions.length) {
      return "You cleared every question cleanly. This topic is in good shape.";
    }
    const text = wrongQuestions
      .map((question) => String(question.question || ""))
      .join(" ")
      .toLowerCase();
    if (text.includes("loop")) {
      return "You struggled with loops. Try the chapter practice once more for looping logic.";
    }
    if (text.includes("condition")) {
      return "Conditionals need one more pass. A quick revision on if/else blocks should help.";
    }
    if (text.includes("variable")) {
      return "Variables looked shaky here. Revisit how values change during execution.";
    }
    return "A short retry will help. Focus on the questions you missed and compare patterns before your next attempt.";
  }, [wrongQuestions]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isPassed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isPassed ? (
              <CheckCircle className="text-green-600" size={48} />
            ) : (
              <XCircle className="text-red-600" size={48} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPassed ? "Congratulations!" : "Quiz Completed"}
          </h1>
          <p className="text-gray-600">
            {autoSubmitted
              ? "Your quiz was automatically submitted due to time expiry."
              : "Your quiz has been submitted successfully."}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            {quiz.title}
          </h2>

          {isFunQuiz && (
            <div className="mb-8 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-3xl font-bold text-amber-900">
                    {points}
                  </div>
                  <div className="text-sm text-amber-950">Points Earned</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-800">
                    x{bestStreak}
                  </div>
                  <div className="text-sm text-green-900">
                    Best correct streak
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-900">
                  {starsEarned} / 3 stars
                </div>
                {historySnapshot?.isNewBest && (
                  <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                    New best score
                  </div>
                )}
                {historySnapshot?.attempts > 1 &&
                  historySnapshot.previousPercentage != null && (
                    <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
                      {Math.round(percentage) -
                        historySnapshot.previousPercentage >=
                      0
                        ? "+"
                        : ""}
                      {Math.round(percentage) -
                        historySnapshot.previousPercentage}
                      % vs last attempt
                    </div>
                  )}
              </div>
              <p className="text-sm text-amber-950">{revisionHint}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${color}`}>
              {Math.round(percentage)}%
            </div>
            <div className={`text-2xl font-semibold mb-4 ${color}`}>
              Grade: {grade}
            </div>
            <div className="text-lg text-gray-600">
              {score} out of {quiz.totalMarks} marks
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div
              className={`px-6 py-3 rounded-full font-semibold ${
                isPassed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isPassed ? "PASSED" : "FAILED"}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-6 ${
              isFunQuiz ? "md:grid-cols-4" : "md:grid-cols-3"
            }`}
          >
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Clock size={24} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700">
                {
                  quiz.questions.filter((question) =>
                    getAnswerResult(question, answers[question._id]),
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Award size={24} className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {quiz.passingPercentage}%
              </div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>

            {isFunQuiz && (
              <div className="text-center p-6 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <RotateCcw size={24} className="text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {historySnapshot?.attempts || 1}
                </div>
                <div className="text-sm text-gray-600">Practice Attempts</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Detailed Results
          </h3>
          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[question._id];
              const isCorrect = getAnswerResult(question, userAnswer);

              return (
                <div
                  key={question._id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCorrect
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCorrect ? (
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
                          {isCorrect ? question.marks : 0} / {question.marks}{" "}
                          marks
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{question.question}</p>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Your Answer:{" "}
                          </span>
                          <span
                            className={
                              isCorrect ? "text-green-700" : "text-red-700"
                            }
                          >
                            {Array.isArray(userAnswer)
                              ? userAnswer.join(", ")
                              : userAnswer || "Not answered"}
                          </span>
                        </div>

                        {question.correctAnswer && quiz.showCorrectAnswers && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Correct Answer:{" "}
                            </span>
                            <span className="text-green-700">
                              {Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.join(", ")
                                : question.correctAnswer}
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/student-dashboard/assessments")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Home size={20} />
            Back to Quizzes
          </button>

          {!quiz.showCorrectAnswers && (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-400 rounded-lg font-medium cursor-not-allowed"
            >
              <Eye size={20} />
              View Answers (Not Available)
            </button>
          )}

          {isFunQuiz && (
            <button
              onClick={() => navigate(`/student-dashboard/quiz/${quiz._id}`)}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-amber-300 text-amber-800 rounded-lg font-medium transition-colors hover:bg-amber-50"
            >
              <RotateCcw size={20} />
              Retry Practice Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
