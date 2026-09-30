import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const SavedQuestionPapers = () => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [editPaper, setEditPaper] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const fetchSavedPapers = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/question-papers/my-papers`,
                {
                    headers: getAuthHeaders(),
                },
            );

            setPapers(response.data?.papers || []);
        } catch (error) {
            console.error("Error fetching saved papers:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to fetch saved question papers",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedPapers();
    }, []);

    const openPaper = async (paperId) => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/question-papers/${paperId}`,
                {
                    headers: getAuthHeaders(),
                },
            );

            setSelectedPaper(response.data?.paper);
            setViewOpen(true);
        } catch (error) {
            console.error("Error opening paper:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to open question paper",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const deletePaper = async (paperId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this saved question paper?",
        );

        if (!confirmed) return;

        try {
            setLoading(true);

            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/question-papers/${paperId}`,
                {
                    headers: getAuthHeaders(),
                },
            );

            if (response.data?.success) {
                showSnackbar("Question paper deleted successfully", "success");
                fetchSavedPapers();
            }
        } catch (error) {
            console.error("Error deleting paper:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to delete question paper",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const openEditPaper = async (paperId) => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/question-papers/${paperId}`,
                {
                    headers: getAuthHeaders(),
                },
            );

            setEditPaper(response.data?.paper || null);
            setEditOpen(true);
        } catch (error) {
            console.error("Error loading paper for edit:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to load question paper for editing",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const optionText = (option) => {
        if (typeof option === "string") return option;
        if (option?.option) return option.option;
        if (option?.text) return option.text;
        if (option?.value) return option.value;
        return String(option || "");
    };

    const getQuestionText = (question) => {
        return (
            question.question ||
            question.questionStem ||
            question.title ||
            "Question text not available"
        );
    };

    const getAnswerText = (question) => {
        const answer =
            question.correctAnswer ??
            question.answer ??
            question.answerKey ??
            "Answer not available";

        if (typeof answer === "boolean") {
            return answer ? "True" : "False";
        }

        if (Array.isArray(answer)) {
            return answer.join(", ");
        }

        return String(answer);
    };

    const escapeHtml = (value) => {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    };

    const getSectionTitle = (question, index) => {
        if (question.sectionTitle) return question.sectionTitle;

        if (question.sectionNumber) {
            return `Section ${String.fromCharCode(64 + Number(question.sectionNumber))}`;
        }

        return question.questionType || "Questions";
    };

    const groupQuestionsBySection = (paper) => {
        const groups = [];

        (paper.questions || []).forEach((question, index) => {
            const sectionTitle = getSectionTitle(question, index);
            const sectionKey = question.sectionNumber
                ? `section-${question.sectionNumber}`
                : `${sectionTitle}-${question.questionType || ""}-${question.marks || 1}`;

            let group = groups.find((item) => item.key === sectionKey);

            if (!group) {
                group = {
                    key: sectionKey,
                    title: sectionTitle,
                    questions: [],
                };
                groups.push(group);
            }

            group.questions.push(question);
        });

        return groups;
    };

    const buildPaperHtml = (paper, includeAnswers = true) => {
        const groupedSections = groupQuestionsBySection(paper);

        const questionsHtml = groupedSections
            .map((section, sectionIndex) => {
                const sectionMarks = section.questions.reduce(
                    (sum, question) => sum + Number(question.marks || 0),
                    0,
                );

                const sectionQuestionsHtml = section.questions
                    .map((question, questionIndex) => {
                        const options = Array.isArray(question.options)
                            ? question.options
                            : [];

                        const optionsHtml = options.length
                            ? `<ol type="a" class="options">${options
                                  .map(
                                      (option) =>
                                          `<li>${escapeHtml(optionText(option))}</li>`,
                                  )
                                  .join("")}</ol>`
                            : "";

                        return `
                        <div class="question-block">
                            <div class="question-row">
                                <div class="question-text">
                                    <strong>Q${questionIndex + 1}.</strong>
                                    ${escapeHtml(getQuestionText(question))}
                                </div>
                                <div class="marks">[${escapeHtml(question.marks || 1)} mark${Number(question.marks || 1) > 1 ? "s" : ""}]</div>
                            </div>
                            ${optionsHtml}
                        </div>
                    `;
                    })
                    .join("");

                return `
                <section class="paper-section">
                    <div class="section-heading">
                        <h2>${escapeHtml(section.title)}</h2>
                        <span>${section.questions.length} question(s) | ${sectionMarks} mark(s)</span>
                    </div>
                    ${sectionQuestionsHtml}
                </section>
            `;
            })
            .join("");

        const answerKeyHtml = includeAnswers
            ? `
            <div class="answer-key">
                <h2>Answer Key</h2>
                ${groupedSections
                    .map((section) => {
                        const answersHtml = section.questions
                            .map(
                                (question, questionIndex) => `
                                    <div class="answer-row">
                                        <strong>${escapeHtml(section.title)} - Q${questionIndex + 1}:</strong>
                                        ${escapeHtml(getAnswerText(question))}
                                        ${
                                            question.explanation
                                                ? `<div class="explanation"><strong>Explanation:</strong> ${escapeHtml(question.explanation)}</div>`
                                                : ""
                                        }
                                    </div>
                                `,
                            )
                            .join("");

                        return `
                            <div class="answer-section">
                                <h3>${escapeHtml(section.title)}</h3>
                                ${answersHtml}
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        `
            : "";

        return `
        <html>
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(paper.title)}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 32px;
                        line-height: 1.45;
                        color: #111;
                    }

                    h1 {
                        text-align: center;
                        margin: 0 0 8px;
                        font-size: 24px;
                    }

                    .meta {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #333;
                        font-size: 13px;
                    }

                    .instructions {
                        margin: 18px 0;
                        padding: 12px;
                        border: 1px solid #ddd;
                        background: #f8f8f8;
                    }

                    .paper-section {
                        margin-top: 24px;
                    }

                    .section-heading {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #111;
                        padding-bottom: 6px;
                        margin-bottom: 14px;
                    }

                    .section-heading h2 {
                        font-size: 18px;
                        margin: 0;
                    }

                    .section-heading span {
                        font-size: 12px;
                        color: #444;
                    }

                    .question-block {
                        margin-bottom: 16px;
                        page-break-inside: avoid;
                    }

                    .question-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 12px;
                    }

                    .question-text {
                        flex: 1;
                    }

                    .marks {
                        white-space: nowrap;
                        font-size: 12px;
                    }

                    .options {
                        margin-top: 8px;
                    }

                    .answer-key {
                        margin-top: 36px;
                        page-break-before: always;
                    }

                    .answer-key h2 {
                        border-bottom: 2px solid #111;
                        padding-bottom: 6px;
                    }

                    .answer-section {
                        margin-top: 18px;
                    }

                    .answer-row {
                        margin-bottom: 10px;
                    }

                    .explanation {
                        margin-top: 4px;
                        color: #444;
                        font-size: 12px;
                    }

                    @media print {
                        body {
                            padding: 18px;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(paper.title)}</h1>

                <div class="meta">
                    Course: ${escapeHtml(paper.courseName || "-")} |
                    Chapters: ${escapeHtml((paper.chapterNames || []).join(", ") || "-")} |
                    Total Marks: ${escapeHtml(paper.totalMarks || 0)}
                    ${
                        paper.generationMeta?.totalTime
                            ? ` | Time: ${escapeHtml(paper.generationMeta.totalTime)} minutes`
                            : ""
                    }
                </div>

                ${
                    paper.description
                        ? `<div class="instructions"><strong>Instructions:</strong> ${escapeHtml(paper.description)}</div>`
                        : ""
                }

                ${questionsHtml}
                ${answerKeyHtml}
            </body>
        </html>
    `;
    };

    const downloadAsWord = (paper, includeAnswers = true) => {
        const html = buildPaperHtml(paper, includeAnswers);
        const blob = new Blob(["\ufeff", html], {
            type: "application/msword",
        });

        const safeTitle = String(paper.title || "question-paper")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        const fileName = `${safeTitle}_${includeAnswers ? "with_answers" : "without_answers"}.doc`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const printPaper = (paper, includeAnswers = true) => {
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            showSnackbar(
                "Popup blocked. Please allow popups to print.",
                "error",
            );
            return;
        }

        printWindow.document.write(buildPaperHtml(paper, includeAnswers));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const updateEditPaperField = (name, value) => {
        setEditPaper((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const updateEditQuestion = (questionIndex, name, value) => {
        setEditPaper((prev) => ({
            ...prev,
            questions: (prev.questions || []).map((question, index) =>
                index === questionIndex
                    ? {
                          ...question,
                          [name]: value,
                          ...(name === "question"
                              ? { questionStem: value }
                              : {}),
                          ...(name === "correctAnswer"
                              ? { answer: value }
                              : {}),
                      }
                    : question,
            ),
        }));
    };

    const updateEditOption = (questionIndex, optionIndex, value) => {
        setEditPaper((prev) => ({
            ...prev,
            questions: (prev.questions || []).map((question, index) => {
                if (index !== questionIndex) return question;

                const options = Array.isArray(question.options)
                    ? question.options
                    : [];

                return {
                    ...question,
                    options: options.map((option, idx) => {
                        if (idx !== optionIndex) return option;

                        if (typeof option === "string") return value;

                        return {
                            ...option,
                            option: value,
                        };
                    }),
                };
            }),
        }));
    };

    const removeEditQuestion = (questionIndex) => {
        setEditPaper((prev) => ({
            ...prev,
            questions: (prev.questions || []).filter(
                (_, index) => index !== questionIndex,
            ),
        }));
    };

    const moveEditQuestion = (questionIndex, direction) => {
        setEditPaper((prev) => {
            const questions = [...(prev.questions || [])];
            const nextIndex = questionIndex + direction;

            if (nextIndex < 0 || nextIndex >= questions.length) return prev;

            [questions[questionIndex], questions[nextIndex]] = [
                questions[nextIndex],
                questions[questionIndex],
            ];

            return {
                ...prev,
                questions,
            };
        });
    };

    const addManualQuestion = () => {
        setEditPaper((prev) => {
            const questions = prev.questions || [];
            const lastQuestion = questions[questions.length - 1] || {};
            const sectionNumber = Number(lastQuestion.sectionNumber || 1);

            return {
                ...prev,
                questions: [
                    ...questions,
                    {
                        questionNumber: questions.length + 1,
                        sectionNumber,
                        sectionTitle:
                            lastQuestion.sectionTitle ||
                            `Section ${String.fromCharCode(64 + sectionNumber)}`,
                        sectionQuestionNumber:
                            Number(lastQuestion.sectionQuestionNumber || 0) + 1,
                        questionType: "Short Answer",
                        difficulty: "Medium",
                        skillType: "Concept Check",
                        marks: 1,
                        question: "",
                        questionStem: "",
                        options: [],
                        answer: "",
                        correctAnswer: "",
                        explanation: "",
                        source: "manual",
                    },
                ],
            };
        });
    };

    const duplicatePaper = async (paper) => {
        try {
            setLoading(true);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/question-papers/save`,
                {
                    title: `${paper.title || "Question Paper"} - Variant`,
                    description: paper.description || "",
                    courseId: paper.courseId || null,
                    courseName: paper.courseName || "",
                    chapterIds: paper.chapterIds || [],
                    chapterNames: paper.chapterNames || [],
                    sourceMode: paper.sourceMode || "hybrid",
                    blueprint: paper.blueprint || [],
                    questions: paper.questions || [],
                    totalMarks: paper.totalMarks || 0,
                    status: "draft",
                    generationMeta: {
                        ...(paper.generationMeta || {}),
                        duplicatedFrom: paper._id,
                        duplicatedAt: new Date().toISOString(),
                    },
                },
                {
                    headers: getAuthHeaders(),
                },
            );

            if (response.data?.success) {
                showSnackbar("Question paper variant created.", "success");
                fetchSavedPapers();
            }
        } catch (error) {
            console.error("Error duplicating paper:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to create paper variant",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const togglePaperFinalStatus = () => {
        setEditPaper((prev) => ({
            ...prev,
            status: prev.status === "final" ? "draft" : "final",
        }));
    };

    const saveEditedPaper = async () => {
        if (!editPaper?._id) return;

        if (!String(editPaper.title || "").trim()) {
            showSnackbar("Question paper title is required.", "error");
            return;
        }

        if (!(editPaper.questions || []).length) {
            showSnackbar("Keep at least one question in the paper.", "error");
            return;
        }

        try {
            setSavingEdit(true);

            const normalizedQuestions = (editPaper.questions || []).map(
                (question, index) => ({
                    ...question,
                    questionNumber: index + 1,
                    sectionQuestionNumber:
                        question.sectionQuestionNumber || index + 1,
                }),
            );

            const totalMarks = normalizedQuestions.reduce(
                (sum, question) => sum + Number(question.marks || 0),
                0,
            );

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/question-papers/${editPaper._id}`,
                {
                    title: editPaper.title,
                    description: editPaper.description || "",
                    questions: normalizedQuestions,
                    totalMarks,
                    status: editPaper.status || "draft",
                    generationMeta: editPaper.generationMeta || {},
                },
                {
                    headers: getAuthHeaders(),
                },
            );

            if (response.data?.success) {
                showSnackbar("Saved question paper updated.", "success");
                setEditPaper(response.data.paper);
                setEditOpen(false);
                fetchSavedPapers();
            }
        } catch (error) {
            console.error("Error updating saved paper:", error);
            showSnackbar(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to update saved question paper",
                "error",
            );
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
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

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Saved Question Papers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View, edit, download, print, or delete saved question
                        papers.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    onClick={fetchSavedPapers}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && papers.length === 0 && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography align="center" color="text.secondary">
                            No saved question papers found yet.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Grid container spacing={2}>
                {papers.map((paper) => (
                    <Grid item xs={12} md={6} key={paper._id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700 }}
                                >
                                    {paper.title}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    Course: {paper.courseName || "-"}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    Chapters:{" "}
                                    {(paper.chapterNames || []).join(", ") ||
                                        "-"}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        mt: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Chip
                                        label={`${paper.questions?.length || 0} Questions`}
                                        size="small"
                                    />
                                    <Chip
                                        label={`${paper.totalMarks || 0} Marks`}
                                        size="small"
                                    />
                                    <Chip
                                        label={paper.status || "draft"}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 1 }}
                                >
                                    Saved on:{" "}
                                    {paper.createdAt
                                        ? new Date(
                                              paper.createdAt,
                                          ).toLocaleString()
                                        : "-"}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.75,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="success"
                                            onClick={() => openPaper(paper._id)}
                                            sx={{
                                                minWidth: 0,
                                                minHeight: 30,
                                                px: 1.25,
                                                textTransform: "none",
                                            }}
                                        >
                                            View
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="success"
                                            onClick={() =>
                                                openEditPaper(paper._id)
                                            }
                                            sx={{
                                                minWidth: 0,
                                                minHeight: 30,
                                                px: 1.25,
                                                textTransform: "none",
                                            }}
                                        >
                                            Edit
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="success"
                                            onClick={() => duplicatePaper(paper)}
                                            sx={{
                                                minHeight: 30,
                                                px: 1.25,
                                                textTransform: "none",
                                            }}
                                        >
                                            Variant
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                                deletePaper(paper._id)
                                            }
                                            sx={{
                                                minWidth: 0,
                                                minHeight: 30,
                                                px: 1.25,
                                                textTransform: "none",
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.75,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() =>
                                                downloadAsWord(paper, true)
                                            }
                                            sx={{
                                                minHeight: 30,
                                                px: 1,
                                                textTransform: "none",
                                            }}
                                        >
                                            With Answers
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() =>
                                                downloadAsWord(paper, false)
                                            }
                                            sx={{
                                                minHeight: 30,
                                                px: 1,
                                                textTransform: "none",
                                            }}
                                        >
                                            Without Answers
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedPaper?.title || "Saved Question Paper"}
                </DialogTitle>

                <DialogContent dividers>
                    {selectedPaper && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Course:</strong>{" "}
                                {selectedPaper.courseName || "-"}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Chapters:</strong>{" "}
                                {(selectedPaper.chapterNames || []).join(
                                    ", ",
                                ) || "-"}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Total Marks:</strong>{" "}
                                {selectedPaper.totalMarks || 0}
                            </Typography>

                            <Divider sx={{ mb: 2 }} />

                            {groupQuestionsBySection(selectedPaper).map(
                                (section) => (
                                    <Box key={section.key} sx={{ mb: 3 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 800,
                                                mb: 1,
                                                borderBottom: "2px solid #333",
                                                pb: 0.5,
                                            }}
                                        >
                                            {section.title}
                                        </Typography>

                                        {section.questions.map(
                                            (question, index) => (
                                                <Box
                                                    key={
                                                        question._id ||
                                                        `${section.key}-${index}`
                                                    }
                                                    sx={{
                                                        mb: 2,
                                                        p: 2,
                                                        border: "1px solid #ddd",
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{ fontWeight: 700 }}
                                                    >
                                                        Q{index + 1}.{" "}
                                                        {getQuestionText(
                                                            question,
                                                        )}
                                                    </Typography>

                                                    {Array.isArray(
                                                        question.options,
                                                    ) &&
                                                        question.options
                                                            .length > 0 && (
                                                            <Box
                                                                component="ol"
                                                                type="a"
                                                                sx={{ mt: 1 }}
                                                            >
                                                                {question.options.map(
                                                                    (
                                                                        option,
                                                                        optionIndex,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                optionIndex
                                                                            }
                                                                        >
                                                                            {optionText(
                                                                                option,
                                                                            )}
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </Box>
                                                        )}

                                                    <Typography
                                                        variant="body2"
                                                        color="success.main"
                                                        sx={{ mt: 1 }}
                                                    >
                                                        <strong>Answer:</strong>{" "}
                                                        {String(
                                                            getAnswerText(
                                                                question,
                                                            ),
                                                        )}
                                                    </Typography>

                                                    {question.explanation && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mt: 1 }}
                                                        >
                                                            <strong>
                                                                Explanation:
                                                            </strong>{" "}
                                                            {
                                                                question.explanation
                                                            }
                                                        </Typography>
                                                    )}

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: "block",
                                                            mt: 1,
                                                        }}
                                                    >
                                                        Type:{" "}
                                                        {question.questionType ||
                                                            "-"}{" "}
                                                        | Difficulty:{" "}
                                                        {question.difficulty ||
                                                            "-"}{" "}
                                                        | Skill:{" "}
                                                        {question.skillType ||
                                                            "Concept Check"}{" "}
                                                        | Marks:{" "}
                                                        {question.marks || 1}
                                                    </Typography>
                                                </Box>
                                            ),
                                        )}
                                    </Box>
                                ),
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>

                    {selectedPaper && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => printPaper(selectedPaper, true)}
                            >
                                Print With Answers
                            </Button>

                            <Button
                                variant="contained"
                                onClick={() =>
                                    downloadAsWord(selectedPaper, true)
                                }
                            >
                                Download Word
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog
                open={editOpen}
                onClose={() => !savingEdit && setEditOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Edit Saved Question Paper</DialogTitle>

                <DialogContent dividers>
                    {editPaper && (
                        <Box>
                            <TextField
                                fullWidth
                                label="Paper Title"
                                value={editPaper.title || ""}
                                onChange={(e) =>
                                    updateEditPaperField(
                                        "title",
                                        e.target.value,
                                    )
                                }
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="Instructions"
                                value={editPaper.description || ""}
                                onChange={(e) =>
                                    updateEditPaperField(
                                        "description",
                                        e.target.value,
                                    )
                                }
                                sx={{ mb: 2 }}
                            />

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Questions in this saved paper:{" "}
                                {editPaper.questions?.length || 0}
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    mb: 2,
                                }}
                            >
                                <Chip
                                    label={
                                        editPaper.status === "final"
                                            ? "Final Paper"
                                            : "Draft Paper"
                                    }
                                    color={
                                        editPaper.status === "final"
                                            ? "success"
                                            : "primary"
                                    }
                                    variant="outlined"
                                />
                                <Button
                                    variant="outlined"
                                    onClick={togglePaperFinalStatus}
                                >
                                    {editPaper.status === "final"
                                        ? "Move to Draft"
                                        : "Mark as Final"}
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={addManualQuestion}
                                >
                                    Add Manual Question
                                </Button>
                            </Box>

                            {(editPaper.questions || []).map(
                                (question, questionIndex) => (
                                    <Card
                                        key={
                                            question._id ||
                                            `edit-question-${questionIndex}`
                                        }
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    >
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 1,
                                                    alignItems: "center",
                                                    mb: 1.5,
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 700 }}
                                                    >
                                                        Question{" "}
                                                        {questionIndex + 1}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {question.sectionTitle ||
                                                            `Section ${question.sectionNumber || 1}`}{" "}
                                                        |{" "}
                                                        {question.questionType ||
                                                            "Question"}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    color="error"
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() =>
                                                        removeEditQuestion(
                                                            questionIndex,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    gap: 1,
                                                    mb: 1.5,
                                                }}
                                            >
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={
                                                        questionIndex === 0
                                                    }
                                                    onClick={() =>
                                                        moveEditQuestion(
                                                            questionIndex,
                                                            -1,
                                                        )
                                                    }
                                                >
                                                    Move Up
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={
                                                        questionIndex ===
                                                        (editPaper.questions
                                                            ?.length || 0) -
                                                            1
                                                    }
                                                    onClick={() =>
                                                        moveEditQuestion(
                                                            questionIndex,
                                                            1,
                                                        )
                                                    }
                                                >
                                                    Move Down
                                                </Button>
                                            </Box>

                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                label="Question Text"
                                                value={
                                                    question.question ||
                                                    question.questionStem ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    updateEditQuestion(
                                                        questionIndex,
                                                        "question",
                                                        e.target.value,
                                                    )
                                                }
                                                sx={{ mb: 2 }}
                                            />

                                            {Array.isArray(question.options) &&
                                                question.options.length > 0 && (
                                                    <Grid
                                                        container
                                                        spacing={1.5}
                                                        sx={{ mb: 1 }}
                                                    >
                                                        {question.options.map(
                                                            (
                                                                option,
                                                                optionIndex,
                                                            ) => (
                                                                <Grid
                                                                    item
                                                                    xs={12}
                                                                    md={6}
                                                                    key={
                                                                        optionIndex
                                                                    }
                                                                >
                                                                    <TextField
                                                                        fullWidth
                                                                        label={`Option ${String.fromCharCode(
                                                                            65 +
                                                                                optionIndex,
                                                                        )}`}
                                                                        value={optionText(
                                                                            option,
                                                                        )}
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateEditOption(
                                                                                questionIndex,
                                                                                optionIndex,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </Grid>
                                                            ),
                                                        )}
                                                    </Grid>
                                                )}

                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12} md={8}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label="Answer"
                                                        value={String(
                                                            question.correctAnswer ??
                                                                question.answer ??
                                                                "",
                                                        )}
                                                        onChange={(e) =>
                                                            updateEditQuestion(
                                                                questionIndex,
                                                                "correctAnswer",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Marks"
                                                        type="number"
                                                        value={
                                                            question.marks || 1
                                                        }
                                                        onChange={(e) =>
                                                            updateEditQuestion(
                                                                questionIndex,
                                                                "marks",
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label="Explanation"
                                                        value={
                                                            question.explanation ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateEditQuestion(
                                                                questionIndex,
                                                                "explanation",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setEditOpen(false)}
                        disabled={savingEdit}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={saveEditedPaper}
                        disabled={savingEdit}
                    >
                        {savingEdit ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SavedQuestionPapers;
