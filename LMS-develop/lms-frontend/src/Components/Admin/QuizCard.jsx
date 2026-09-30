import React, { useEffect, useState } from 'react';
import { Clock, BookOpen, Calendar, AlertTriangle, CheckCircle2, XCircle, Copy, Trash2Icon, LucideEye } from 'lucide-react';
import axios from "axios"
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@mui/material/styles";

const QuizCard = ({ quiz, fetchAllQuiz }) => {

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // console.log("Rendering QuizCard for quiz:", quiz);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: CheckCircle2,
          label: 'Live'
        };
      case 'draft':
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          icon: AlertTriangle,
          label: 'Draft'
        };
      case 'scheduled':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: AlertTriangle,
          label: 'Scheduled'
        };
      case 'closed':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          icon: AlertTriangle,
          label: 'Closed'
        };
      case 'archived':
        return {
          bg: 'bg-zinc-100',
          text: 'text-zinc-700',
          icon: AlertTriangle,
          label: 'Archived'
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
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [duplicateBatchIds, setDuplicateBatchIds] = useState([]);



  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleDeleteClick = (id) => {
    setSelectedQuizId(id);
    setOpenDialog(true);
  };

  const onDetailQuiz = (quizId) => {
    navigate(`/teacher-dashboard/quiz-details/${quizId}`);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/quiz/delete/${selectedQuizId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showSnackbar("Quiz deleted successfully!");
      fetchAllQuiz();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      showSnackbar("Failed to delete quiz.", "error");
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/quiz/get-batch-for-quiz`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBatches(response.data?.teacherBatches || []);
      } catch (error) {
        console.error("Error loading batches for duplication:", error);
      }
    };

    fetchBatches();
  }, []);

  const duplicateQuiz = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/quiz/duplicate/${quiz._id}`,
        duplicateBatchIds.length ? { assignedTo: duplicateBatchIds } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar("Quiz duplicated as a draft.");
      setDuplicateDialogOpen(false);
      setDuplicateBatchIds([]);
      fetchAllQuiz();
    } catch (error) {
      console.error("Error duplicating quiz:", error);
      showSnackbar("Quiz could not be duplicated.", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const statusConfig = getStatusConfig(quiz.status);
  const StatusIcon = statusConfig.icon;

  // if (loading) {
  //   return (
  //     <Box
  //       sx={{
  //         display: "flex",
  //         justifyContent: "center",
  //         padding: "20px",
  //         height: "100vh",
  //         alignItems: "center",
  //       }}
  //     >
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  return (
    <div
      className="
    rounded-2xl
    shadow-sm
    hover:shadow-xl
    hover:-translate-y-1
    transition-all duration-300
  "
      style={{
        backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`,
      }}
    >

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">


          {/* <div
            className={`py-2 px-4 flex justify-center items-center text-sm rounded-lg font-medium transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white`}
          >
            <SquarePen className="inline-block mr-2" size={16} />
            Edit
          </div> */}

        </div>
        <div className="flex items-start justify-between mb-4">
          <h3
            className="text-lg font-bold line-clamp-1"
            style={{
              color: isDark ? "#ffffff" : "#111827",
            }}
          >{quiz.title}</h3>
          <div className="flex flex-col items-end gap-2">
            {quiz.quizMode && quiz.quizMode !== 'formal' && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {quiz.quizMode === 'revision' ? 'Revision' : 'Practice Quiz'}
              </span>
            )}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon size={14} />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm mb-5 line-clamp-2 min-h-[42px]"
          style={{
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
        >{quiz.description}</p>

        {/* Quiz Details */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
          <div className="flex items-center gap-2"
            style={{
              color: isDark ? "#9ca3af" : "#4b5563",
            }}>
            <BookOpen size={16} />
            <span className="text-sm">{quiz.totalMarks} marks</span>
          </div>
          <div className="flex items-center gap-2"
            style={{
              color: isDark ? "#9ca3af" : "#4b5563",
            }}>
            <Clock size={16} />
            <span className="text-sm">{quiz.timeLimit} minutes</span>
          </div>
          <div className="flex items-center gap-2"
            style={{
              color: isDark ? "#9ca3af" : "#4b5563",
            }}>
            <Calendar size={14} />
            <span className="text-[13px]">Due: {quiz.endDate ? new Date(quiz.endDate).toISOString().split('T')[0] : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2"
            style={{
              color: isDark ? "#9ca3af" : "#4b5563",
            }}>
            <AlertTriangle size={16} />
            <span className="text-sm">Pass: {quiz.passingPercentage}%</span>
          </div>
        </div>
        {/* Action Button */}
        <div className="flex flex-wrap gap-2 justify-between">
          <button
            onClick={() => onDetailQuiz(quiz._id)}
            className={`py-2 px-4 flex justify-center items-center cursor-pointer text-sm rounded-lg font-medium transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white`}
          >
            <LucideEye className="inline-block mr-2" size={16} />
            View Quiz
          </button>
          <button
            onClick={() => setDuplicateDialogOpen(true)}
            className={`py-2 px-4 flex justify-center cursor-pointer items-center text-sm rounded-lg font-medium transition-colors duration-200 bg-blue-50 hover:bg-blue-100 text-blue-700`}
          >
            <Copy className="inline-block mr-2" size={16} />
            Duplicate
          </button>
          <button
            onClick={() => handleDeleteClick(quiz._id)}
            className={`py-2 px-4 flex justify-center cursor-pointer items-center text-sm rounded-lg font-medium transition-colors duration-200 bg-red-50 hover:bg-red-100 text-red-700`}
          >
            <Trash2Icon className="inline-block mr-2" size={16} />
            Delete Quiz
          </button>
        </div>

      </div>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={loading}
            color="error"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Duplicate Quiz</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a draft copy of this quiz. You can keep the same batch or place the copy into another batch now.
          </DialogContentText>
          <select
            value={duplicateBatchIds}
            onChange={(event) =>
              setDuplicateBatchIds(
                Array.from(event.target.selectedOptions, (option) => option.value),
              )
            }
            className="w-full min-h-40 rounded-lg px-4 py-3"
            style={{
              background: isDark ? "#2a2a2a" : "#ffffff",
              color: isDark ? "#ffffff" : "#111827",
              border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
            }}
            multiple
          >
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs"
            style={{
              color: isDark ? "#9ca3af" : "#6b7280",
            }}>
            Leave this empty to keep the original batch assignment. Hold Ctrl or Cmd to select multiple batches.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
          <Button onClick={duplicateQuiz} disabled={loading}>
            {loading ? "Duplicating..." : "Create Draft Copy"}
          </Button>
        </DialogActions>
      </Dialog>

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

export default QuizCard;
