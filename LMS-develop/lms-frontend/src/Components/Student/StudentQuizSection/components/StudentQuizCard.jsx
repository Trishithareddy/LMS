import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentQuizCard = ({ quiz }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const getStatusConfig = (status) => {
    switch (status) {
      case true:
        return {
          color: "success",
          icon: CheckCircle2,
          label: "Attempted",
        };

      case false:
        return {
          color: "error",
          icon: XCircle,
          label: "Not Attempted",
        };

      default:
        return {
          color: "warning",
          icon: AlertTriangle,
          label: "Unknown",
        };
    }
  };

  const status = getStatusConfig(quiz.attempted);
  const StatusIcon = status.icon;

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: 3,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        boxShadow: 2,
        transition: "0.25s",
        display: "flex",
        flexDirection: "column",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            sx={{
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {quiz.title}
          </Typography>

          <Stack spacing={1} alignItems="flex-end">
            {quiz.quizMode && quiz.quizMode !== "formal" && (
              <Chip
                size="small"
                color="warning"
                label={
                  quiz.quizMode === "revision"
                    ? "Challenge"
                    : "Practice"
                }
              />
            )}

            <Chip
              size="small"
              color={status.color}
              icon={<StatusIcon size={14} />}
              label={status.label}
            />
          </Stack>
        </Stack>

        {/* Description */}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {quiz.description}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Quiz Info */}

        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BookOpen size={16} />
            <Typography variant="body2" color="text.secondary">
              {quiz.totalMarks || 50} Marks
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Clock size={16} />
            <Typography variant="body2" color="text.secondary">
              {quiz.timeLimit || 30} Minutes
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Calendar size={16} />
            <Typography variant="body2" color="text.secondary">
              Due:{" "}
              {quiz.endDate
                ? new Date(quiz.endDate).toLocaleDateString()
                : "N/A"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <AlertTriangle size={16} />
            <Typography variant="body2" color="text.secondary">
              Pass: {quiz.passingPercentage || 50}%
            </Typography>
          </Stack>
        </Stack>

        <Box mt={3}>
          {quiz.attempted ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() =>
                navigate(`/student-dashboard/quiz-result/${quiz.attemptId}`)
              }
            >
              View Result
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={() =>
                navigate(`/student-dashboard/quiz/${quiz._id}`)
              }
            >
              Start Quiz
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StudentQuizCard;