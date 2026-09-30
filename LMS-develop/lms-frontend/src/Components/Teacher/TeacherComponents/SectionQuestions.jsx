import React, { useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Button,
} from "@mui/material";
import { DeleteOutline, Edit, Lock, LockOpen, Refresh } from "@mui/icons-material";

const SectionQuestions = ({
  sectionQuestions,
  section,
  sectionIndex,
  regenerateQuestion,
  removeGeneratedQuestion,
  toggleQuestionLock,
  updateGeneratedQuestion,
  updateGeneratedQuestionOption,
  lockedQuestions,
}) => {
  const [editingQuestions, setEditingQuestions] = useState({});

  const regeneratingThisQuestion = (question, questionIndex) => {
    regenerateQuestion(
      question.questionType,
      question.chapter,
      sectionIndex,
      questionIndex
    );
  };

  const isQuestionLocked = (questionIndex) =>
    Boolean(lockedQuestions?.[`${sectionIndex}-${questionIndex}`]);

  const optionText = (option) =>
    typeof option === "string" ? option : option?.option || option?.text || "";

  const stripHtml = (value = "") => String(value || "").replace(/<[^>]*>/g, "");

  const toggleEditQuestion = (questionIndex) => {
    setEditingQuestions((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  return (
    <>
      <Box
  p={3}
  sx={(theme) => ({
    bgcolor: theme.palette.background.default,
    mt: 2,
    borderRadius: 2,
  })}
>
        {sectionQuestions.length !== 0 && (
          <Paper
  elevation={3}
  sx={(theme) => ({
    p: 3,
    mb: 3,
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: "1px solid",
    borderColor: theme.palette.divider,
  })}
>
            <Typography variant="h5" gutterBottom>
              Review Questions: {section.questionType || sectionQuestions[0].questionType}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Edit text, options, answers, or explanations before final preview/download.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box>
              {sectionQuestions.map((question, questionIndex) => (
                <Box key={questionIndex} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Q.{questionIndex + 1}
                      </Typography>

                      {!editingQuestions[questionIndex] ? (
                        <>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 1,
                              maxWidth: 900,
                              lineHeight: 1.45,
                            }}
                          >
                            {stripHtml(question.questionStem || question.question)}
                          </Typography>

                          {Array.isArray(question.options) &&
                            question.options.length > 0 && (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                  gap: 0.75,
                                  mb: 1,
                                }}
                              >
                                {question.options.map((option, optionIndex) => (
                                  <Chip
                                    key={optionIndex}
                                    size="small"
                                    variant="outlined"
                                    label={`${String.fromCharCode(65 + optionIndex)}. ${stripHtml(optionText(option))}`}
                                   sx={(theme) => ({
    justifyContent: "flex-start",
    maxWidth: "100%",
    height: "auto",
    py: 0.5,
    bgcolor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderColor: theme.palette.divider,
    "& .MuiChip-label": {
      whiteSpace: "normal",
    },
  })}
                                  />
                                ))}
                              </Box>
                            )}

                          <Typography variant="caption" color="text.secondary">
                            Answer:{" "}
                            {String(
                              question.answer ??
                                question.correctAnswer ??
                                question.answerKey ??
                                "-"
                            )}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label={`Q.${questionIndex + 1} Question`}
                            value={question.questionStem || question.question || ""}
                            onChange={(e) =>
                              updateGeneratedQuestion(
                                sectionIndex,
                                questionIndex,
                                "questionStem",
                                e.target.value
                              )
                            }
                            disabled={isQuestionLocked(questionIndex)}
                            sx={{ mb: 1.5 }}
                          />

                          {question.options && (
                            <Grid container spacing={1}>
                              {question.options.map((option, optionIndex) => (
                                <Grid item xs={12} sm={6} key={optionIndex}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                    value={optionText(option)}
                                    onChange={(e) =>
                                      updateGeneratedQuestionOption(
                                        sectionIndex,
                                        questionIndex,
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                    disabled={isQuestionLocked(questionIndex)}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          )}

                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Answer"
                                value={String(
                                  question.answer ??
                                    question.correctAnswer ??
                                    question.answerKey ??
                                    ""
                                )}
                                onChange={(e) =>
                                  updateGeneratedQuestion(
                                    sectionIndex,
                                    questionIndex,
                                    "answer",
                                    e.target.value
                                  )
                                }
                                disabled={isQuestionLocked(questionIndex)}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Explanation"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                  updateGeneratedQuestion(
                                    sectionIndex,
                                    questionIndex,
                                    "explanation",
                                    e.target.value
                                  )
                                }
                                disabled={isQuestionLocked(questionIndex)}
                              />
                            </Grid>
                          </Grid>

                          <Button
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => toggleEditQuestion(questionIndex)}
                          >
                            Done
                          </Button>
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <Tooltip title={editingQuestions[questionIndex] ? "Close editor" : "Edit question"}>
                        <span>
                          <IconButton
                            color={editingQuestions[questionIndex] ? "success" : "default"}
                            onClick={() => toggleEditQuestion(questionIndex)}
                          >
                            <Edit />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip
                        title={
                          isQuestionLocked(questionIndex)
                            ? "Unlock question"
                            : "Lock question"
                        }
                      >
                        <IconButton
                          color={
                            isQuestionLocked(questionIndex)
                              ? "success"
                              : "default"
                          }
                          onClick={() =>
                            toggleQuestionLock(sectionIndex, questionIndex)
                          }
                        >
                          {isQuestionLocked(questionIndex) ? (
                            <Lock />
                          ) : (
                            <LockOpen />
                          )}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Regenerate question">
                        <span>
                          <IconButton
                            color="primary"
                            disabled={isQuestionLocked(questionIndex)}
                            onClick={() =>
                              regeneratingThisQuestion(question, questionIndex)
                            }
                          >
                            <Refresh />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Remove question">
                        <span>
                          <IconButton
                            color="error"
                            disabled={isQuestionLocked(questionIndex)}
                            onClick={() =>
                              removeGeneratedQuestion(
                                sectionIndex,
                                questionIndex
                              )
                            }
                          >
                            <DeleteOutline />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                  {isQuestionLocked(questionIndex) && (
                    <Chip
                      size="small"
                      color="success"
                      label="Locked"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default SectionQuestions;
