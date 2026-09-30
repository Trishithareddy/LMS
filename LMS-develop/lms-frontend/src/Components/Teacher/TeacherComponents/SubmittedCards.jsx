import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LucideEye,
  Users,
} from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@mui/material/styles";

const SubmittedCards = ({ quiz, fetchAllQuiz }) => {

  // console.log("Rendering QuizCard for quiz:", quiz);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: CheckCircle2,
          label: 'Active'
        };
      case 'inactive':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: XCircle,
          label: 'Inactive'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: AlertTriangle,
          label: 'Unknown'
        };
    }
  };
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");



  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const onDetailQuiz = (quizId) => {
    navigate(`/teacher-dashboard/quiz-submit-details/${quizId}`);
  };

  const statusConfig = getStatusConfig(quiz.status);
  const StatusIcon = statusConfig.icon;
  const batchNames = (quiz.assignedTo || [])
    .map((batch) => batch?.batchName || batch?.name)
    .filter(Boolean);
  const quizModeLabel =
    quiz.quizMode === "fun"
      ? "Practice Quiz"
      : quiz.quizMode === "revision"
        ? "Revision Challenge"
        : "Assessment";



  return (
    <div
  className="rounded-2xl transition-shadow duration-200 hover:shadow-lg"
  style={{
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    boxShadow: isDark
      ? "0 8px 24px rgba(0,0,0,.45)"
      : "0 8px 24px rgba(0,0,0,.08)",
  }}
>
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold"
style={{
    background: isDark ? "#1F3B2B" : "#ECFDF5",
    color: "#059669",
}}>
                {quizModeLabel}
              </span>
              {batchNames.slice(0, 2).map((batchName) => (
                <span
                  key={batchName}
                  className="rounded-full px-3 py-1 text-xs font-medium"
style={{
    background: isDark ? "#313131" : "#F1F5F9",
    color: theme.palette.text.secondary,
}}
                >
                  {batchName}
                </span>
              ))}
              {batchNames.length > 2 && (
                <span className="rounded-full px-3 py-1 text-xs font-medium"
style={{
    background: isDark ? "#313131" : "#F1F5F9",
    color: theme.palette.text.secondary,
}}>
                  +{batchNames.length - 2} more
                </span>
              )}
            </div>
            <h3
  className="line-clamp-2 text-lg font-semibold"
  style={{ color: theme.palette.text.primary }}
>
              {quiz.title}
            </h3>
          </div>
          <div className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon size={14} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        <p
  className="mb-4 line-clamp-2 text-sm"
  style={{ color: theme.palette.text.secondary }}
>
          {quiz.description || "No description added for this quiz."}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2" style={{ color: theme.palette.text.secondary }}>
            <BookOpen size={16} />
            <span className="text-sm">{quiz.totalMarks} marks</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: theme.palette.text.secondary }}>
            <Clock size={16} />
            <span className="text-sm">{quiz.timeLimit} minutes</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: theme.palette.text.secondary }}>
            <Calendar size={14} />
            <span className="text-[13px]">Due: {quiz.endDate ? new Date(quiz.endDate).toISOString().split('T')[0] : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: theme.palette.text.secondary }}>
            <AlertTriangle size={16} />
            <span className="text-sm">Pass: {quiz.passingPercentage}%</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span className="text-sm">
              {batchNames.length ? batchNames.join(", ") : "No batch linked"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-between">
          <button
            onClick={() => onDetailQuiz(quiz._id)}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700"
          >
            <LucideEye size={16} />
            View Submissions
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

export default SubmittedCards;
