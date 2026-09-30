import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, HelpCircle } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { Clock, BookOpen, Calendar, AlertTriangle, CheckCircle2, XCircle, SquarePen, Trash2Icon, LucideEye, Home, BarChart3, FileQuestion, MoveUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTheme } from "@mui/material/styles";



const MCQQuestion = ({ question, options, answer, index }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        color: "text.primary",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 2,
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
            Multiple Choice
          </span>
          <Typography
            variant="h5"
            fontWeight={700}
            color="text.primary"
          >
            {question}
          </Typography>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {options.map((option, optionIndex) => (
          <Box
            component="label"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              borderRadius: 2,
              cursor: "pointer",
              mb: 2,
              border: `2px solid ${option === answer
                ? theme.palette.success.main
                : theme.palette.divider
                }`,
              bgcolor:
                option === answer
                  ? theme.palette.success.light
                  : theme.palette.background.paper,
            }}
          >
            <input
              type="radio"
              name={`question-${index}`}
              value={option}
              checked={option === answer}
              readOnly
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <Typography
              sx={{
                ml: 2,
                color:
                  option === answer
                    ? theme.palette.success.dark
                    : theme.palette.text.primary,
              }}
            >
              {option}
            </Typography>
            {option === answer && (
              <CheckCircle className="ml-auto w-5 h-5 text-green-600" />
            )}
          </Box>
        ))}
      </div>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.success.light,
          border: `1px solid ${theme.palette.success.main}`,
        }}
      >
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800">
          <span className="font-medium">Correct Answer:</span> {answer}
        </span>
      </Box>
    </Box>
  );
};

const TrueFalseQuestion = ({ question, answer, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
            True / False
          </span>
          <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
            {question}
          </h3>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {["true", "false"].map((option) => (
          <button
            key={option}
            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all duration-200 ${option === answer
              ? 'border-green-300 bg-green-50 text-green-800 shadow-sm'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            disabled
          >
            {option ? 'True' : 'False'}
            {option === answer && (
              <CheckCircle className="inline-block ml-2 w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800">
          <span className="font-medium">Correct Answer:</span> {answer}
        </span>
      </div>
    </div>
  );
};


const SingleWordQuestion = ({ question, answer, index }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        color: "text.primary",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 2,
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>

        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full mb-2">
            Single Word
          </span>

          <Typography
            variant="h5"
            fontWeight={700}
            color="text.primary"
          >
            {question}
          </Typography>
        </div>
      </div>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 1 }}
        >
          Answer
        </Typography>

        <Box
          component="input"
          value={answer}
          readOnly
          sx={{
            width: "100%",
            p: 1.5,
            borderRadius: 2,
            bgcolor: theme.palette.success.light,
            border: `2px solid ${theme.palette.success.main}`,
            color: theme.palette.success.dark,
            fontWeight: 600,
          }}
        />
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.success.light,
          border: `1px solid ${theme.palette.success.main}`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CheckCircle className="w-4 h-4 text-green-600" />

        <Typography
          variant="body2"
          sx={{ color: theme.palette.success.dark }}
        >
          <strong>Correct Answer:</strong> {answer}
        </Typography>
      </Box>
    </Box>
  );
};

function ViewQuizDetails() {

  const [quize, setQuize] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          icon: Circle,
          label: 'Draft'
        };
      case 'scheduled':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: Calendar,
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
          icon: CheckCircle,
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
  const getShowCorrectAnswersConfig = (status) => {
    switch (status) {
      case true:
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: CheckCircle2,
          label: 'Yes'
        };
      case false:
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: XCircle,
          label: 'No'
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

  const statusConfig = getStatusConfig(quize?.status);
  const StatusIcon = statusConfig.icon;

  const showCorrectAnswersConfig = getShowCorrectAnswersConfig(quize?.showCorrectAnswers);
  const ShowCorrectAnswersIcon = showCorrectAnswersConfig.icon;
  const isPracticeQuiz = quize?.quizMode === "fun" || quize?.quizMode === "revision";
  const assignedBatchNames = Array.isArray(quize?.assignedTo)
    ? quize.assignedTo.map((batch) => batch.batchName || batch.name).filter(Boolean)
    : [];

  const quizId = window.location.pathname.split("/").pop();

  const fetchSingleQuiz = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/quiz/get-single-quiz/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuize(response.data.quizObj || null);

    } catch (error) {
      console.error("Error fetching Questions:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchQuizAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/quiz/analytics/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalytics(response.data.analytics || null);
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
    }
  };
  const handleFieldUpdate = async (fieldName, newValue) => {
    setIsLoading(true);
    try {
      if (!quizId) return;
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/quiz/update/${quizId}`,
        {
          [fieldName]: newValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setQuize((prev) => ({ ...prev, [fieldName]: newValue }));
      }
      fetchSingleQuiz();
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSingleQuiz();
    fetchQuizAnalytics();
  }, [quizId]);

  const questionPerformanceData = (analytics?.questionStats || []).map((question, index) => ({
    name: `Q${index + 1}`,
    question: question.question,
    correct: question.correctCount,
    wrong: Math.max((question.attemptCount || 0) - (question.correctCount || 0), 0),
    accuracy: question.accuracy || 0,
  }));

  const resultBreakdownData = [
    {
      name: 'Passed',
      value: analytics?.passedCount || 0,
      color: '#16a34a',
    },
    {
      name: 'Needs Review',
      value: Math.max((analytics?.attempts || 0) - (analytics?.passedCount || 0), 0),
      color: '#f59e0b',
    },
    {
      name: 'Not Attempted',
      value: analytics?.notAttemptedCount || 0,
      color: '#94a3b8',
    },
  ].filter((item) => item.value > 0);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          height: "100vh",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary"
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <Box
          id="quiz-overview"
          sx={{
            maxWidth: "64rem",
            mx: "auto",
            mb: 4,
            p: 4,
            borderRadius: 2,
            bgcolor: "background.paper",
            color: "text.primary",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 2,
          }}
        >
          <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                mb: 2,
              }}
            >
              {quize?.title || "Quiz Title"}
            </Typography>
            {/* <button onClick={handleStatusChange} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer font-medium ${statusConfig.bg} ${statusConfig.text}`}>

              <StatusIcon size={14} />
              <span>{statusConfig.label}</span>

            </button> */}
          </div>

          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              mt: 2,
              maxWidth: "42rem",
            }}
          >
            {quize?.description || "No description available."}
          </Typography>

          <div className='max-w-2xl mx-auto flex justify-between items-center gap-4 mt-3'>
            {/* Quiz Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <BookOpen size={16} />
                <span className="text-sm">{quize?.totalMarks} marks</span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <Clock size={16} />
                <span className="text-sm">{quize?.timeLimit} minutes</span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <Calendar size={14} />
                <span className="text-[13px]">Due: {quize?.endDate ? new Date(quize?.endDate).toISOString().split('T')[0] : 'N/A'}</span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <AlertTriangle size={16} />
                <span className="text-sm">Pass: {quize?.passingPercentage}%</span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <StatusIcon size={16} />
                <span className="text-sm">{statusConfig.label}</span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ color: theme.palette.text.secondary }}
              >
                <CheckCircle size={16} />
                <span className="text-sm">
                  {isPracticeQuiz
                    ? quize?.quizMode === "revision"
                      ? "Revision Challenge"
                      : "Practice Quiz"
                    : "Assessment Quiz"}
                </span>
              </div>
            </div>

            <div className='grid grid-rows-2 gap-2'>

              <div className='flex items-center justify-between gap-2'>

                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 1 }}
                >
                  Quiz Lifecycle :
                </Typography>
                <select
                  value={quize?.status || 'draft'}
                  onChange={(event) => handleFieldUpdate('status', event.target.value)}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Live</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>

              </div>

              <div className='flex items-center justify-center gap-2'>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 1 }}
                >
                  Show Correct Answers :
                </Typography>

                <button onClick={() =>
                  handleFieldUpdate('showCorrectAnswers', !quize.showCorrectAnswers)
                } className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer font-medium ${showCorrectAnswersConfig.bg} ${showCorrectAnswersConfig.text}`}>
                  <ShowCorrectAnswersIcon size={14} />
                  <span>{showCorrectAnswersConfig.label}</span>

                </button>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-2 flex max-w-2xl flex-wrap items-center gap-3 text-sm text-gray-600">
            <span
              style={{
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                borderRadius: "999px",
                padding: "6px 14px",
                display: "inline-block",
              }}
            >
              Reattempts: {quize?.allowReattempt ? "Allowed" : "One attempt"}
            </span>
            <span
              style={{
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                borderRadius: "999px",
                padding: "6px 14px",
                display: "inline-block",
              }}
            >
              Batch size: {analytics?.batchSize || 0}
            </span>
            {!!assignedBatchNames.length && (
              <span
                style={{
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  borderRadius: "999px",
                  padding: "6px 14px",
                  display: "inline-block",
                }}
              >
                Assigned: {assignedBatchNames.join(", ")}
              </span>
            )}
            {quize?.startDate && (
              <span
                style={{
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  borderRadius: "999px",
                  padding: "6px 14px",
                  display: "inline-block",
                }}
              >
                Starts: {new Date(quize.startDate).toISOString().split('T')[0]}
              </span>
            )}
          </div>
        </Box>

        <div className="sticky top-3 z-20 mx-auto mb-6 max-w-4xl rounded-2xl border border-green-100 bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Home size={16} />
              Back to Quizzes
            </button>
            <button
              onClick={() => scrollToSection("quiz-overview")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("quiz-analytics")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button
              onClick={() => scrollToSection("quiz-questions")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              <FileQuestion size={16} />
              Questions
            </button>
            <button
              onClick={() => scrollToSection("quiz-overview")}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              Top
              <MoveUpRight size={16} />
            </button>
          </div>
        </div>

        <Box
          id="quiz-analytics"
          sx={{
            maxWidth: "64rem",
            mx: "auto",
            mb: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            color: "text.primary",
            boxShadow: 2,
          }}
        >
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <Typography
                variant="h4"
                fontWeight={700}
                color="text.primary"
              >Quiz Analytics</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Batch performance and question accuracy for this quiz submission flow.
              </Typography>
            </div>
            <button
              onClick={fetchQuizAnalytics}
              className="rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-700 hover:bg-green-50"
            >
              Refresh Analytics
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Attempts', analytics?.attempts || 0],
              ['Batch Size', analytics?.batchSize || 0],
              ['Average', `${analytics?.averagePercentage || 0}%`],
              ['Passed', analytics?.passedCount || 0],
              ['Not Attempted', analytics?.notAttemptedCount || 0],
              ['Highest', `${analytics?.highestPercentage || 0}%`],
              ['Lowest', `${analytics?.lowestPercentage || 0}%`],
            ].map(([label, value]) => (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "background.default",
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="text.primary"
                >{value}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <div className="mb-3">
                <Typography variant="h6" fontWeight={700} color="text.primary">Question-wise Performance</Typography>
                <p className="text-sm text-gray-500">See exactly how many students got each question right or wrong.</p>
              </div>
              {questionPerformanceData.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionPerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip
                        formatter={(value, key) => [value, key === 'correct' ? 'Answered Correctly' : 'Answered Wrong']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.question || label}
                      />
                      <Legend />
                      <Bar dataKey="correct" fill="#16a34a" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="wrong" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography color="text.secondary">
                    No question analytics yet.
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <div className="mb-3">
                <Typography variant="h6" fontWeight={700} color="text.primary">Result Breakdown</Typography>
                <p className="text-sm text-gray-500">Quick infographic of completion and pass status.</p>
              </div>
              {resultBreakdownData.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {resultBreakdownData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography color="text.secondary">
                    No question analytics yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </div>
          {!!analytics?.notAttemptedStudents?.length && (
            <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-900">Students Still Pending</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {analytics.notAttemptedStudents.map((student) => (
                  <span
                    key={student._id}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-sm text-amber-900"
                  >
                    {student.name}
                    {student.section ? ` (${student.class || ""}${student.class && student.section ? " - " : ""}${student.section})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!analytics?.questionStats?.length && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Questions Needing Attention
              </Typography>
              {analytics.questionStats
                .slice()
                .sort((first, second) => first.accuracy - second.accuracy)
                .slice(0, 6)
                .map((question, index) => (
                  <Box
                    key={question.questionId}
                    sx={{
                      p: 3,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <Typography
                        variant="body1"
                        sx={{
                          color: "text.primary",
                          fontWeight: 500,
                        }}
                      >
                        {index + 1}. {question.question}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: 10,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor:
                            question.accuracy < 50
                              ? theme.palette.error.light
                              : question.accuracy < 75
                                ? theme.palette.warning.light
                                : theme.palette.success.light,
                          color:
                            question.accuracy < 50
                              ? theme.palette.error.dark
                              : question.accuracy < 75
                                ? theme.palette.warning.dark
                                : theme.palette.success.dark,
                        }}
                      >
                        {question.accuracy}% correct
                      </Box>
                    </div>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 2,
                        color: "text.secondary",
                      }}
                    >
                      {question.correctCount} of {question.attemptCount} recent attempts answered this correctly.
                    </Typography>
                  </Box>
                ))}
            </Box>
          )}
          {!!analytics?.recentAttempts?.length && (
            <div className="mt-5">
              <Typography variant="h6" fontWeight={700} color="text.primary">Recent Student Results</Typography>
              <Box
                sx={{
                  mt: 3,
                  overflow: "hidden",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <table
                  className="min-w-full text-sm"
                  style={{
                    color: theme.palette.text.primary,
                  }}
                >
                  <thead
                    style={{
                      background: theme.palette.background.default,
                    }}
                  >
                    <tr>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}>Student</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}>Result</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}>Status</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody
                    style={{
                      background: theme.palette.background.paper,
                    }}
                  >
                    {analytics.recentAttempts.map((attempt) => (
                      <tr key={attempt._id}>
                        <td className="px-4 py-3">
                          <Typography fontWeight={600} color="text.primary">
                            {attempt.studentName}
                          </Typography>
                          {attempt.username && (
                            <Typography variant="caption" color="text.secondary">
                              {attempt.username}
                            </Typography>
                          )}
                        </td>
                        <td style={{
                          padding: "12px 16px",
                          color: theme.palette.text.primary,
                        }}>
                          {attempt.score} marks ({attempt.percentage}%)
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${attempt.isPassed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
                            {attempt.isPassed ? 'Passed' : 'Needs Review'}
                          </span>
                        </td>
                        <td style={{
                          padding: "12px 16px",
                          color: theme.palette.text.primary,
                        }}>
                          {new Date(attempt.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </div>
          )}
        </Box>

        <div id="quiz-questions" className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
          {quize?.questions.map((quiz, index) => {
            switch (quiz.type) {
              case 'MCQ':
                return (
                  <MCQQuestion
                    key={index}
                    question={quiz.question}
                    options={quiz.options || []}
                    answer={quiz.correctAnswer}
                    index={index}
                  />
                );
              case 'True or False':
                return (
                  <TrueFalseQuestion
                    key={index}
                    question={quiz.question}
                    answer={quiz.correctAnswer}
                    index={index}
                  />
                );
              case 'Very Short Answer':
                return (
                  <SingleWordQuestion
                    key={index}
                    question={quiz.question}
                    answer={quiz.correctAnswer}
                    index={index}
                  />
                );
              case 'Fill In the Blanks':
                return (
                  <SingleWordQuestion
                    key={index}
                    question={quiz.question}
                    answer={quiz.correctAnswer}
                    index={index}
                  />
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Home size={20} />
            Back to Quizzes
          </button>
        </div>
      </div>
    </Box>
  );
}

export default ViewQuizDetails;
