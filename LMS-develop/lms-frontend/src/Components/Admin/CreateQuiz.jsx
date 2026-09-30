import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Copy, ArrowUp, ArrowDown, Clock, Users, CheckCircle, Settings, ChevronDown, Eye } from 'lucide-react';
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from 'axios';
import Papa from 'papaparse';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import toast from 'react-hot-toast';
import { useTheme } from "@mui/material/styles";

const buildGameSettings = (mode) => ({
  pointsEnabled: mode !== "formal",
  streaksEnabled: mode !== "formal",
  instantFeedback: mode !== "formal",
  leaderboardEnabled: mode === "revision",
});

const CSV_TEMPLATE_HEADERS = [
  "type",
  "question",
  "option1",
  "option2",
  "option3",
  "option4",
  "correctAnswer",
  "marks",
];

const CSV_TEMPLATE_ROWS = [
  ["MCQ", "Which block repeats actions?", "repeat", "say", "if", "ask", "repeat", "1"],
  ["True or False", "Variables can store changing values.", "", "", "", "", "true", "1"],
  ["Very Short Answer", "What do we call storing a first value in a variable?", "", "", "", "", "Initialization", "2"],
  ["Fill In the Blanks", "A ______ stores data in a program.", "", "", "", "", "variable", "1"],
];

const supportedQuestionTypes = [
  "MCQ",
  "True or False",
  "Very Short Answer",
  "Fill In the Blanks",
];

const normalizeQuestionType = (value = "") => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "mcq" || normalized === "multiple choice") return "MCQ";
  if (normalized === "true or false" || normalized === "true/false") return "True or False";
  if (
    normalized === "very short answer" ||
    normalized === "short answer" ||
    normalized === "fill in the blanks" ||
    normalized === "fill in the blank"
  ) {
    return normalized.includes("fill") ? "Fill In the Blanks" : "Very Short Answer";
  }
  return "";
};

function CreateQuiz({ quizMode = "formal" }) {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    instructions: 'Every question is mandatory. Please read each question carefully before answering.',
    totalMarks: 0,
    timeLimit: 30,
    status: "active",
    startDate: null,
    endDate: null,
    assignedTo: [],
    allowReattempt: false,
    showCorrectAnswers: false,
    passingPercentage: 50,
    questions: [],
    quizMode,
    gameSettings: buildGameSettings(quizMode),
  });

  const addQuestion = () => {
    const newQuestion = {
      type: 'MCQ',
      question: '',
      options: ['', ''],
      correctAnswer: '',
      marks: 1
    };
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [csvImportSummary, setCsvImportSummary] = useState(null);
  const isPracticeQuiz = quiz.quizMode === "fun" || quiz.quizMode === "revision";
  const totalMarks = quiz.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
  const estimatedAttemptSeconds = quiz.questions.length * Number(quiz.timeLimit || 0);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const inputClass = `
w-full px-4 py-3 rounded-lg transition-all duration-200
border
`;

  const inputStyle = {
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
  };

  const cardStyle = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  };

  const labelStyle = {
    color: theme.palette.text.primary,
  };

  const secondaryText = {
    color: theme.palette.text.secondary,
  };

  const sectionStyle = {
    background: isDark ? "#262626" : "#F9FAFB",
    border: `1px solid ${theme.palette.divider}`,
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const updateQuestion = (index, field, value) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[`question-${index}-${field}`];
      if (field === "type") {
        delete next[`question-${index}-options`];
        delete next[`question-${index}-correctAnswer`];
      }
      return next;
    });
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setExpandedQuestions((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const duplicateQuestion = (index) => {
    setQuiz((prev) => {
      const copy = {
        ...prev.questions[index],
        options: [...(prev.questions[index].options || [])],
      };
      return {
        ...prev,
        questions: [
          ...prev.questions.slice(0, index + 1),
          copy,
          ...prev.questions.slice(index + 1),
        ],
      };
    });
  };

  const moveQuestion = (index, direction) => {
    setQuiz((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      [questions[index], questions[nextIndex]] = [
        questions[nextIndex],
        questions[index],
      ];
      return { ...prev, questions };
    });
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options.push('');
    setQuiz(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuiz(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuiz(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const toggleQuestionExpanded = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const downloadCsvTemplate = () => {
    const csv = Papa.unparse({
      fields: CSV_TEMPLATE_HEADERS,
      data: CSV_TEMPLATE_ROWS,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "quiz-question-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importQuestionsFromCsv = (file) => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedQuestions = [];
        const rejectedRows = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2;
          const type = normalizeQuestionType(row.type || row.Type || "");
          const questionText = String(row.question || row.Question || "").trim();
          const marksValue = Number(row.marks || row.Marks || 1);
          const rawAnswer = String(
            row.correctAnswer || row.correct_answer || row.answer || row.Answer || ""
          ).trim();

          if (!type) {
            rejectedRows.push(`Row ${rowNumber}: unsupported type`);
            return;
          }

          if (!questionText) {
            rejectedRows.push(`Row ${rowNumber}: question text is missing`);
            return;
          }

          if (!marksValue || marksValue < 1) {
            rejectedRows.push(`Row ${rowNumber}: marks should be at least 1`);
            return;
          }

          if (type === "MCQ") {
            const options = [row.option1, row.option2, row.option3, row.option4]
              .map((value) => String(value || "").trim())
              .filter(Boolean);

            if (options.length < 2) {
              rejectedRows.push(`Row ${rowNumber}: MCQ needs at least 2 options`);
              return;
            }

            if (!rawAnswer) {
              rejectedRows.push(`Row ${rowNumber}: MCQ correct answer is missing`);
              return;
            }

            importedQuestions.push({
              type,
              question: questionText,
              options,
              correctAnswer: rawAnswer,
              marks: marksValue,
            });
            return;
          }

          if (type === "True or False") {
            const loweredAnswer = rawAnswer.toLowerCase();
            if (loweredAnswer !== "true" && loweredAnswer !== "false") {
              rejectedRows.push(`Row ${rowNumber}: True or False answer must be true or false`);
              return;
            }

            importedQuestions.push({
              type,
              question: questionText,
              options: [],
              correctAnswer: loweredAnswer === "true",
              marks: marksValue,
            });
            return;
          }

          if (!rawAnswer) {
            rejectedRows.push(`Row ${rowNumber}: expected answer is missing`);
            return;
          }

          importedQuestions.push({
            type,
            question: questionText,
            options: [],
            correctAnswer: rawAnswer,
            marks: marksValue,
          });
        });

        if (!importedQuestions.length) {
          showSnackbar("No valid questions were found in the CSV file.", "error");
          setCsvImportSummary({
            added: 0,
            rejected: rejectedRows,
          });
          return;
        }

        setQuiz((prev) => ({
          ...prev,
          questions: [...prev.questions, ...importedQuestions],
        }));
        setExpandedQuestions((prev) => {
          const next = { ...prev };
          const startIndex = quiz.questions.length;
          importedQuestions.forEach((_, offset) => {
            next[startIndex + offset] = true;
          });
          return next;
        });
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next.questions;
          return next;
        });
        setCsvImportSummary({
          added: importedQuestions.length,
          rejected: rejectedRows,
        });
        showSnackbar(
          `Imported ${importedQuestions.length} question${importedQuestions.length !== 1 ? "s" : ""} from CSV`,
          "success"
        );
      },
      error: () => {
        showSnackbar("Could not read the CSV file.", "error");
      },
    });
  };

  const handleCsvFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importQuestionsFromCsv(file);
    }
    event.target.value = "";
  };

  const getQuestionValidationErrors = (question, index) => {
    const errors = {};
    if (!question.question?.trim()) {
      errors[`question-${index}-question`] = "Question text is required.";
    }
    if (!question.marks || Number(question.marks) < 1) {
      errors[`question-${index}-marks`] = "Marks must be at least 1.";
    }
    if (question.type === "MCQ") {
      const filledOptions = (question.options || []).filter((option) => option.trim());
      if (filledOptions.length < 2) {
        errors[`question-${index}-options`] = "At least two filled options are required.";
      }
      if (!String(question.correctAnswer || "").trim()) {
        errors[`question-${index}-correctAnswer`] = "Choose the correct option.";
      }
    }
    if (
      (question.type === "Very Short Answer" || question.type === "Fill In the Blanks") &&
      !String(question.correctAnswer || "").trim()
    ) {
      errors[`question-${index}-correctAnswer`] = "Expected answer is required.";
    }
    return errors;
  };

  const validateQuiz = () => {
    const nextErrors = {};
    if (!quiz.title.trim()) nextErrors.title = "Quiz title is required.";
    if (!quiz.description.trim()) nextErrors.description = "Quiz description is required.";
    if (!quiz.assignedTo.length) nextErrors.assignedTo = "Please select at least one batch.";
    if (!quiz.startDate) nextErrors.startDate = "Start date is required.";
    if (!quiz.endDate) nextErrors.endDate = "End date is required.";
    if (quiz.startDate && quiz.endDate && quiz.endDate.isBefore?.(quiz.startDate)) {
      nextErrors.endDate = "End date should be after the start date.";
    }
    if (!quiz.questions.length) nextErrors.questions = "Add at least one question.";

    quiz.questions.forEach((question, index) => {
      Object.assign(nextErrors, getQuestionValidationErrors(question, index));
    });

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const [batchData, setBatchData] = useState([]);
  // get batch name and Id
  useEffect(() => {
    const getBatchData = async () => {
      try {
        setIsloading(true)
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/quiz/get-batch-for-quiz`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBatchData(response.data?.teacherBatches);

      } catch (error) {
        console.error("Error fetching batch data:", error);
        toast.error("Error fetching batch data. Please try again later.");
      } finally {
        setIsloading(false)
      }
    }
    getBatchData()
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowValidation(true);
    if (!validateQuiz()) {
      showSnackbar("Please fix the highlighted fields before saving.", "warning");
      return;
    }

    // Calculate total marks
    const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
    const finalQuiz = { ...quiz, totalMarks };
    // console.log("Final Quiz Object to submit:", finalQuiz);
    try {
      setIsloading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL
        }/quiz/create`,
        finalQuiz,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {

        showSnackbar("Quiz created successfully");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      showSnackbar("Error While Creating Quiz", "error");
    } finally {
      setIsloading(false);

      setQuiz({
        title: '',
        description: '',
        instructions: 'Every question is mandatory. Please read each question carefully before answering.',
        totalMarks: 0,
        timeLimit: 30,
        status: "draft",
        startDate: null,
        endDate: null,
        assignedTo: [],
        allowReattempt: false,
        showCorrectAnswers: false,
        passingPercentage: 50,
        questions: [],
        quizMode,
        gameSettings: buildGameSettings(quizMode),
      })
      setExpandedQuestions({});
      setValidationErrors({});
      setShowValidation(false);
      setCsvImportSummary(null);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div
  className="rounded-2xl overflow-hidden"
  style={{
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.palette.mode === "dark"
      ? "0 8px 32px rgba(0,0,0,.55)"
      : "0 8px 24px rgba(0,0,0,.08)",
  }}
>
          {/* Header */}
          <div className="bg-[#008000] px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              Create New Quiz
            </h1>
            <p className="text-blue-100 mt-2">Design engaging quizzes with multiple question types</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Create Assessment</p>
                <p className="mt-1 text-sm text-green-900">Formal test flow with marks, pass percentage, and reports.</p>
              </div>
              <div className={`rounded-xl border p-4 ${isPracticeQuiz ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${isPracticeQuiz ? "text-amber-800" : "text-gray-600"}`}>Create Practice Quiz</p>
                <p className={`mt-1 text-sm ${isPracticeQuiz ? "text-amber-950" : "text-gray-700"}`}>Use points, streaks, and instant feedback for revision-style quizzes.</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Preview Before Publish</p>
                <p className="mt-1 text-sm text-blue-900">Check the student view before you save and assign this quiz.</p>
              </div>
            </section>

            {quizMode !== "formal" && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase text-amber-800">
                      Practice Quiz Experience
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                      Students get a start screen, points, streaks, and instant feedback.
                    </p>
                  </div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Quiz Style
                    <select
                      value={quiz.quizMode}
                      onChange={(e) => {
                        const nextMode = e.target.value;
                        setQuiz((prev) => ({
                          ...prev,
                          quizMode: nextMode,
                          gameSettings: buildGameSettings(nextMode),
                        }));
                      }}
                      className="mt-2 w-full min-w-48 rounded-lg border border-amber-200 bg-white px-4 py-3"
                    >
                      <option value="fun">Practice Quiz</option>
                      <option value="revision">Revision Challenge</option>
                    </select>
                  </label>
                </div>
              </section>
            )}
            {showValidation && Object.keys(validationErrors).length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Please review the highlighted quiz details before saving.
              </div>
            )}
            {/* Basic Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <h2
                  className="text-2xl font-semibold"
                  style={{
                    color: theme.palette.text.primary,
                  }}
                >Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Quiz Title <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => {
                      setQuiz(prev => ({ ...prev, title: e.target.value }));
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.title;
                        return next;
                      });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors.title ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    placeholder="Enter quiz title..."
                    required
                  />
                  {validationErrors.title && <p className="mt-2 text-sm text-red-600">{validationErrors.title}</p>}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Description <span className="text-pink-600">*</span>
                  </label>
                  <textarea
                    value={quiz.description}
                    onChange={(e) => {
                      setQuiz(prev => ({ ...prev, description: e.target.value }));
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${validationErrors.description ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    placeholder="Brief description of the quiz..."
                    required
                  />
                  {validationErrors.description && <p className="mt-2 text-sm text-red-600">{validationErrors.description}</p>}
                </div>

                {/* <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={quiz.instructions}
                    onChange={(e) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Instructions for students taking the quiz..."
                  />
                </div> */}
              </div>
            </section>

            {/* Quiz Settings */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <h2
                  className="text-2xl font-semibold"
                  style={{
                    color: theme.palette.text.primary,
                  }}
                >Quiz Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Time Per Question (Seconds) <span className="text-pink-600">*</span>
                  </label>
                  <select
                    value={quiz.timeLimit}
                    onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Status
                  </label>
                  <select
                    value={quiz.status}
                    onChange={(e) => setQuiz(prev => ({ ...prev, status: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Passing Percentage <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={quiz.passingPercentage}
                    required
                    onChange={(e) => setQuiz(prev => ({ ...prev, passingPercentage: parseInt(e.target.value) }))}
                    className={inputClass}
                    style={inputStyle}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Reattempts
                  </label>
                  <select
                    value={quiz.allowReattempt}
                    onChange={(e) =>
                      setQuiz((prev) => ({
                        ...prev,
                        allowReattempt: e.target.value === "true",
                      }))
                    }
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value={false}>One attempt only</option>
                    <option value={true}>Allow reattempt</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Start Date <span className="text-pink-600">*</span>
                  </label>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      value={quiz.startDate} // should be a Dayjs object or null
                      onChange={(newValue) => {
                        setQuiz(prev => ({ ...prev, startDate: newValue }));
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.startDate;
                          return next;
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          className={inputClass}
                          style={inputStyle}
                        />
                      )}
                      required
                    />
                  </LocalizationProvider>
                  {validationErrors.startDate && <p className="mt-2 text-sm text-red-600">{validationErrors.startDate}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    End Date <span className="text-pink-600">*</span>
                  </label>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      value={quiz.endDate} // should be a Dayjs object or null
                      onChange={(newValue) => {
                        setQuiz(prev => ({ ...prev, endDate: newValue }));
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.endDate;
                          return next;
                        });
                      }}
                      required
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      )}
                    />
                  </LocalizationProvider>
                  {validationErrors.endDate && <p className="mt-2 text-sm text-red-600">{validationErrors.endDate}</p>}
                </div>


                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Select Batch <span className="text-pink-600">*</span>
                  </label>
                  <select
                    value={quiz.assignedTo}
                    onChange={(e) => {
                      const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
                      setQuiz(prev => ({ ...prev, assignedTo: selectedValues }));
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.assignedTo;
                        return next;
                      });
                    }}
                    className={`w-full min-h-40 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors.assignedTo ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    multiple
                    required
                  >
                    {batchData?.map((b) => (
                      <option key={b._id} value={b._id} className="p-4 rounded-2xl">
                        {b.batchName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">Hold Ctrl or Cmd to select more than one batch.</p>
                  {validationErrors.assignedTo && <p className="mt-2 text-sm text-red-600">{validationErrors.assignedTo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={labelStyle}>
                    Show Correct Answers <span className="text-pink-600">*</span>
                  </label>
                  <select
                    value={String(quiz.showCorrectAnswers)}
                    onChange={(e) => setQuiz(prev => ({ ...prev, showCorrectAnswers: e.target.value === "true" }))}
                    className={inputClass}
                    style={inputStyle}
                    required
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Questions Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2
                    className="text-2xl font-semibold"
                    style={{
                      color: theme.palette.text.primary,
                    }}
                  >Questions <span className="text-pink-600">*</span></h2>
                  <span style={{
                    background: isDark ? "#333" : "#F3F4F6",
                    color: theme.palette.text.primary,
                  }}>
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{
                    background: isDark ? "#333" : "#F3F4F6",
                    color: theme.palette.text.primary,
                  }}>
                    {totalMarks} marks total
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!quiz.questions.length}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
                    style={{
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      opacity: !quiz.questions.length ? 0.6 : 1,
                      cursor: !quiz.questions.length ? "not-allowed" : "pointer",
                    }}
                  >
                    <Eye
                      className="h-4 w-4"
                      color={theme.palette.text.primary}
                    />
                    Preview
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Bulk Import Questions
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-emerald-950">
                      Upload a CSV to add questions quickly
                    </h3>
                    <p className="mt-2 text-sm text-emerald-900">
                      Use the sample format with columns for type, question, options, correct answer,
                      and marks. Supported types: {supportedQuestionTypes.join(", ")}.
                    </p>
                    <p className="mt-2 text-xs text-emerald-800">
                      For MCQ rows, fill at least <code>option1</code> and <code>option2</code>.
                      For True/False rows, use <code>true</code> or <code>false</code> in
                      <code> correctAnswer</code>.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Download CSV Template
                    </button>
                    <label className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">
                      Upload CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {csvImportSummary && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-emerald-900">
                      Imported {csvImportSummary.added} question
                      {csvImportSummary.added !== 1 ? "s" : ""}
                      {csvImportSummary.rejected.length
                        ? `, skipped ${csvImportSummary.rejected.length} row${csvImportSummary.rejected.length !== 1 ? "s" : ""}.`
                        : "."}
                    </p>
                    {csvImportSummary.rejected.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
                        {csvImportSummary.rejected.slice(0, 6).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {validationErrors.questions && (
                <p className="text-sm text-red-600">{validationErrors.questions}</p>
              )}

              <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                  <div key={index} className="rounded-xl p-6"
                    style={sectionStyle}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 style={labelStyle}>
                          Question {index + 1}
                        </h3>
                        <p style={secondaryText}>
                          {question.type} • {question.marks || 0} marks
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => toggleQuestionExpanded(index)} title="Expand or collapse question" className="p-2 text-gray-600 hover:bg-white">
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedQuestions[index] === false ? "-rotate-90" : ""}`} />
                        </button>
                        <button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0} title="Move up" className="p-2 text-gray-600 hover:bg-white disabled:opacity-30">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveQuestion(index, 1)} disabled={index === quiz.questions.length - 1} title="Move down" className="p-2 text-gray-600 hover:bg-white disabled:opacity-30">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => duplicateQuestion(index)} title="Duplicate question" className="p-2 text-blue-600 hover:bg-blue-50">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          title="Remove question"
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedQuestions[index] !== false && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold mb-2"
                            style={labelStyle}>
                            Question Type <span className="text-pink-600">*</span>
                          </label>
                          <select
                            value={question.type}
                            required={true}
                            onChange={(e) => {
                              const newType = e.target.value;
                              let correctAnswer = '';
                              if (newType === 'True or False') correctAnswer = true;
                              if (newType === 'MCQ') correctAnswer = '';
                              if (newType === 'Very Short Answer' || newType === 'Fill In the Blanks') correctAnswer = '';

                              updateQuestion(index, 'type', newType);
                              updateQuestion(index, 'correctAnswer', correctAnswer);
                              updateQuestion(index, 'options', newType === 'MCQ' ? ['', ''] : []);
                            }}
                            className={inputClass}
                            style={inputStyle}
                          >
                            <option value="MCQ">Multiple Choice</option>
                            <option value="True or False">True/False</option>
                            <option value="Very Short Answer">Very Short Answer</option>
                            <option value="Fill In the Blanks">Fill In the Blanks</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2"
                            style={labelStyle}>
                            Marks
                          </label>
                          <input
                            type="number"
                            value={question.marks}
                            onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors[`question-${index}-marks`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            min="1"
                          />
                          {validationErrors[`question-${index}-marks`] && <p className="mt-2 text-sm text-red-600">{validationErrors[`question-${index}-marks`]}</p>}
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-sm font-semibold mb-2"
                            style={labelStyle}>
                            Question Text <span className="text-pink-600">*</span>
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${validationErrors[`question-${index}-question`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            placeholder="Enter your question..."
                            required={true}

                          />
                          {validationErrors[`question-${index}-question`] && <p className="mt-2 text-sm text-red-600">{validationErrors[`question-${index}-question`]}</p>}
                        </div>

                        {question.type === 'MCQ' && (
                          <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                              <label className="block text-sm font-semibold text-gray-700">
                                Options
                              </label>
                              <button
                                type="button"
                                required={true}
                                onClick={() => addOption(index)}
                                className="text-[#31a131] hover:text-green-700 text-sm font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                Add Option
                              </button>
                            </div>
                            <div className="space-y-3">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-3">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder={`Option ${optionIndex + 1}...`}
                                    required
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      required={true}
                                      onClick={() => removeOption(index, optionIndex)}
                                      className="text-red-600 hover:text-red-700 p-3 rounded-lg hover:bg-red-50 transition-all duration-200"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {validationErrors[`question-${index}-options`] && <p className="mt-2 text-sm text-red-600">{validationErrors[`question-${index}-options`]}</p>}
                            <div className="mt-4">
                              <label className="block text-sm font-semibold mb-2"
                                style={labelStyle}>
                                Correct Answer <span className="text-pink-600">*</span>
                              </label>
                              <select
                                value={question.correctAnswer}
                                required={true}
                                onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors[`question-${index}-correctAnswer`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                              >
                                <option value="">Select correct answer...</option>
                                {question.options.map((option, optionIndex) => (
                                  <option key={optionIndex} value={option}>
                                    {option || `Option ${optionIndex + 1}`}
                                  </option>
                                ))}
                              </select>
                              {validationErrors[`question-${index}-correctAnswer`] && <p className="mt-2 text-sm text-red-600">{validationErrors[`question-${index}-correctAnswer`]}</p>}
                            </div>
                          </div>
                        )}

                        {question.type === 'True or False' && (
                          <div>
                            <label className="block text-sm font-semibold mb-2"
                              style={labelStyle}>
                              Correct Answer <span className="text-pink-600">*</span>
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={question.correctAnswer === true}
                                  onChange={() => updateQuestion(index, 'correctAnswer', true)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">True</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={question.correctAnswer === false}
                                  onChange={() => updateQuestion(index, 'correctAnswer', false)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">False</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {(question.type === 'Very Short Answer' || question.type === 'Fill In the Blanks') && (
                          <div>
                            <label className="block text-sm font-semibold mb-2"
                              style={labelStyle}>
                              {question.type === 'Fill In the Blanks' ? 'Blank Answer' : 'Sample/Expected Answer'} <span className="text-pink-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer}
                              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors[`question-${index}-correctAnswer`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                              placeholder="Enter expected answer..."
                              required={true}

                            />
                            {validationErrors[`question-${index}-correctAnswer`] && <p className="mt-2 text-sm text-red-600">{validationErrors[`question-${index}-correctAnswer`]}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {quiz.questions.length === 0 && (
                  <div className="text-center py-12 rounded-xl border-2 border-dashed"
                    style={sectionStyle}>
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No questions yet</h3>
                    <p className="text-gray-500 mb-4">Start building your quiz by adding your first question.</p>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="bg-[#348c39] hover:bg-[#0b780b] hover:cursor-pointer text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                    >
                      Add First Question
                    </button>
                  </div>
                )}

                {/* Add Question Button - Always at bottom */}
                {quiz.questions.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="bg-[#348c39] hover:bg-[#0b780b] hover:cursor-pointer text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      Add Question
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                  <div className="rounded-xl px-4 py-3"
                    style={cardStyle}>
                    Total Questions: <span className="font-semibold">{quiz.questions.length}</span>
                  </div>
                  <div className="rounded-xl px-4 py-3"
                    style={cardStyle}>
                    Total Marks: <span className="font-semibold">{totalMarks}</span>
                  </div>
                  <div className="rounded-xl px-4 py-3"
                    style={cardStyle}>
                    Attempt Window: <span className="font-semibold">{estimatedAttemptSeconds}s estimated</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!quiz.questions.length}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
                    style={{
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      opacity: !quiz.questions.length ? 0.65 : 1,
                      cursor: !quiz.questions.length ? "not-allowed" : "pointer",
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#348c39] hover:bg-[#0b780b] hover:cursor-pointer text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Saving...' : 'Save Quiz & Assign'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}>
        <DialogTitle>Student Preview</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200" style={sectionStyle} p-4>
              <h3 className="text-xl font-semibold text-gray-900">{quiz.title || "Untitled Quiz"}</h3>
              <p className="mt-1 text-sm text-gray-600">{quiz.description || "Description will appear here."}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                <span>{quiz.questions.length} questions</span>
                <span>{totalMarks} marks</span>
                <span>{quiz.timeLimit}s per question</span>
              </div>
            </div>
            {quiz.questions.length ? quiz.questions.map((question, index) => (
              <div key={`${question.question}-${index}`} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                    {question.marks || 0} marks
                  </span>
                </div>
                <p className="mb-4 text-gray-800 whitespace-pre-line">
  {question.question || "Question text not added yet."}
</p>
                {question.type === "MCQ" && (
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                        {option || `Option ${optionIndex + 1}`}
                      </div>
                    ))}
                  </div>
                )}
                {question.type === "True or False" && (
                  <div className="flex gap-3">
                    <div className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700">True</div>
                    <div className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700">False</div>
                  </div>
                )}
                {(question.type === "Very Short Answer" || question.type === "Fill In the Blanks") && (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                    {question.type === "Fill In the Blanks"
                      ? "Student will type the missing word here."
                      : "Student will type a short answer here."}
                  </div>
                )}
              </div>
            )) : (
              <p style={secondaryText}>Add at least one question to see the preview.</p>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
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
}

export default CreateQuiz;
