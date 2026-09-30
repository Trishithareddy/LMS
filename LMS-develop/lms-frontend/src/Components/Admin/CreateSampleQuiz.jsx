import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import {
    Save,
    Clock,
    CheckCircle,
    Settings,
    Sparkles,
    RefreshCw,
    Lock,
    Unlock,
    Trash2,
} from "lucide-react";
import CompleteQuestion from "./CompleteQuestion";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const buildGameSettings = (mode) => ({
    pointsEnabled: mode !== "formal",
    streaksEnabled: mode !== "formal",
    instantFeedback: mode !== "formal",
    leaderboardEnabled: mode === "revision",
});

const CreateSampleQuiz = ({ quizMode = "formal" }) => {
    const [quiz, setQuiz] = useState({
        title: "",
        description: "",
        instructions:
            "Every question is mandatory. Please read each question carefully before answering.",
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
        selectedMarksPerQuestion: 1,
        quizMode,
        gameSettings: buildGameSettings(quizMode),
    });

    const quizType = [
        { _id: 1, name: "MCQ" },
        { _id: 2, name: "True or False" },
        { _id: 3, name: "Very Short Answer" },
        { _id: 4, name: "Fill In the Blanks" },
    ];

    const [selectedQuizType, setSelectedQuizType] = useState("");
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [chapters, setChapters] = useState([]);
    const [selectedChapterIds, setSelectedChapterIds] = useState([]);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);

    const [getAllBatches, setGetAllBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedTargetBatchIds, setSelectedTargetBatchIds] = useState([]);

    const [open, setOpen] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isAiraLoading, setIsAiraLoading] = useState(false);
    const [regeneratingQuestionNumber, setRegeneratingQuestionNumber] =
        useState(null);

    const [airaTotalQuestions, setAiraTotalQuestions] = useState(10);
    const [airaBlueprint, setAiraBlueprint] = useState([]);
    const [airaGeneratedQuestions, setAiraGeneratedQuestions] = useState([]);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const difficultyOptions = ["Easy", "Medium", "Hard"];

    const formatAiraQuestion = (question, fallbackQuestionNumber) => ({
        questionNumber:
            question.questionNumber || Number(fallbackQuestionNumber) || 1,
        type: question.type,
        difficulty: question.difficulty || "Medium",
        question: question.question,
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer:
            question.correctAnswer === false ? false : question.correctAnswer || "",
        marks: Number(question.marks || 1),
        source: "aira",
        acceptableAnswers: Array.isArray(question.acceptableAnswers)
            ? question.acceptableAnswers
            : [],
        gradingKeywords: Array.isArray(question.gradingKeywords)
            ? question.gradingKeywords
            : [],
        gradingHint: question.gradingHint || "",
    });

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const ViewQuestionDetails = (id) => {
        setOpen(true);
        setSelectedQuestionId(id);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCheckboxChange = (question) => {
        const isAlreadySelected = selectedQuestions.some(
            (selected) => selected._id === question._id,
        );

        if (isAlreadySelected) {
            setSelectedQuestions(
                selectedQuestions.filter((every) => every._id !== question._id),
            );
        } else {
            setSelectedQuestions([...selectedQuestions, question]);
        }
    };

    useEffect(() => {
        fetchAllBatches();
    }, []);

    const fetchAllBatches = async () => {
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/AllBatches`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            const allBatch = response.data?.teacher?.batches || [];
            setGetAllBatches(allBatch);
        } catch (error) {
            console.error("Error fetching batches:", error);
            showSnackbar("Error fetching batches", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const resetQuestionData = () => {
        setQuestions([]);
        setSelectedQuestions([]);
        setAiraGeneratedQuestions([]);
        setQuiz((prev) => ({
            ...prev,
            questions: [],
            totalMarks: 0,
        }));
    };

    const handleBatchChange = (e) => {
        const batchId = e.target.value;
        const batch = getAllBatches.find((b) => b._id === batchId);

        if (batch) {
            setSelectedBatch(batch);
            setSelectedTargetBatchIds([batch._id]);
            setCourses(batch.courses || []);
            setSelectedCourse("");
            setSelectedChapterIds([]);
            setChapters([]);
            resetQuestionData();
        }
    };

    const handleCourseChange = (e) => {
        const selectedCourseObject = e.target.value;

        setSelectedCourse(selectedCourseObject);

        const selected = courses.find(
            (c) => c._id === selectedCourseObject?._id,
        );

        setChapters(selected?.chapters || []);
        setSelectedChapterIds([]);
        resetQuestionData();
    };

    const handleTargetBatchChange = (event) => {
        const values = typeof event.target.value === "string"
            ? event.target.value.split(",")
            : event.target.value;
        setSelectedTargetBatchIds(values);
    };

    const handleChapterChange = (e) => {
        const values =
            typeof e.target.value === "string"
                ? e.target.value.split(",")
                : e.target.value;
        setSelectedChapterIds(values);
        resetQuestionData();
    };

    const handleQuizTypeChange = (e) => {
        setSelectedQuizType(e.target.value);
        resetQuestionData();
    };

    const getSelectedChapters = () =>
        chapters.filter((chapter) => selectedChapterIds.includes(chapter._id));

    const fetchAllQuestions = async () => {
        try {
            const selectedChapters = getSelectedChapters();

            if (!selectedChapters.length || !selectedQuizType) return;

            const token = localStorage.getItem("token");

            const responses = await Promise.all(
                selectedChapters.map((chapter) =>
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/questionBase/quiz/questionBases`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            params: {
                                questionType: selectedQuizType,
                                qbChapterId: chapter.qbChapterId || "",
                                chapterId: chapter._id,
                            },
                        },
                    ),
                ),
            );

            const mergedQuestions = responses.flatMap(
                (response, index) =>
                    (response.data.questions || []).map((question) => ({
                        ...question,
                        chapterName:
                            question.chapterName ||
                            selectedChapters[index]?.name ||
                            "",
                    })),
            );
            const uniqueQuestions = Array.from(
                new Map(
                    mergedQuestions.map((question) => [
                        question._id || question.questionId,
                        question,
                    ]),
                ).values(),
            );

            setQuestions(uniqueQuestions);
            showSnackbar("Fetched Questions successfully");
        } catch (error) {
            console.error("Error fetching Questions:", error);
            showSnackbar("Error While Fetching Questions", "error");
        }
    };

    useEffect(() => {
        if (selectedChapterIds.length && selectedQuizType) {
            fetchAllQuestions();
        }
    }, [selectedQuizType, selectedChapterIds, chapters]);

    const handleSelectedQuestionsAndConvertToQuizFormat = (
        selectedQuestionsList,
    ) => {
        const stripHtml = (value) => {
            if (value == null) return "";
            return String(value).replace(/<[^>]*>/g, "");
        };

        return selectedQuestionsList.map((q) => ({
            type: q.questionType,
            question: stripHtml(q.questionStem),
            options: Array.isArray(q.options)
                ? q.options.map((o) => stripHtml(o.option))
                : [],
            correctAnswer:
                q.questionType === "True or False"
                    ? q.answer === true || q.answer === "true"
                    : stripHtml(q.answer),
            marks: parseInt(quiz.selectedMarksPerQuestion) || 1,
        }));
    };

    const createAiraBlueprint = () => {
        const total = Math.max(1, Number(airaTotalQuestions) || 1);

        const defaultTypes = [
            "MCQ",
            "MCQ",
            "True or False",
            "Fill In the Blanks",
            "Very Short Answer",
        ];

        const defaultDifficulties = ["Easy", "Medium", "Hard"];

        const rows = Array.from({ length: total }, (_, index) => ({
            questionNumber: index + 1,
            quizType: defaultTypes[index % defaultTypes.length],
            difficulty: defaultDifficulties[index % defaultDifficulties.length],
            marks: 1,
        }));

        setAiraBlueprint(rows);
        setAiraGeneratedQuestions([]);
        setQuiz((prev) => ({
            ...prev,
            questions: [],
            totalMarks: 0,
        }));
    };

    const updateAiraBlueprintRow = (index, field, value) => {
        setAiraBlueprint((prev) =>
            prev.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        [field]:
                            field === "marks"
                                ? Math.max(1, Number(value) || 1)
                                : value,
                    }
                    : row,
            ),
        );

        setAiraGeneratedQuestions([]);
        setQuiz((prev) => ({
            ...prev,
            questions: [],
            totalMarks: 0,
        }));
    };

    const addAiraBlueprintRow = () => {
        setAiraBlueprint((prev) => [
            ...prev,
            {
                questionNumber: prev.length + 1,
                quizType: "MCQ",
                difficulty: "Medium",
                marks: 1,
            },
        ]);

        setAiraTotalQuestions((prev) => Number(prev) + 1);
        setAiraGeneratedQuestions([]);
    };

    const removeAiraBlueprintRow = (indexToRemove) => {
        setAiraBlueprint((prev) =>
            prev
                .filter((_, index) => index !== indexToRemove)
                .map((row, index) => ({
                    ...row,
                    questionNumber: index + 1,
                })),
        );

        setAiraGeneratedQuestions([]);
        setQuiz((prev) => ({
            ...prev,
            questions: [],
            totalMarks: 0,
        }));
    };

    const applyAiraBulkChange = (field, value) => {
        setAiraBlueprint((prev) =>
            prev.map((row) => ({
                ...row,
                [field]:
                    field === "marks" ? Math.max(1, Number(value) || 1) : value,
            })),
        );

        setAiraGeneratedQuestions([]);
        setQuiz((prev) => ({
            ...prev,
            questions: [],
            totalMarks: 0,
        }));
    };

    const autoBalanceDifficulty = () => {
        const pattern = ["Easy", "Medium", "Hard"];

        setAiraBlueprint((prev) =>
            prev.map((row, index) => ({
                ...row,
                difficulty: pattern[index % pattern.length],
            })),
        );

        setAiraGeneratedQuestions([]);
    };

    const autoMixQuestionTypes = () => {
        const pattern = [
            "MCQ",
            "True or False",
            "Fill In the Blanks",
            "Very Short Answer",
        ];

        setAiraBlueprint((prev) =>
            prev.map((row, index) => ({
                ...row,
                quizType: pattern[index % pattern.length],
            })),
        );

        setAiraGeneratedQuestions([]);
    };

    const generateQuizWithAira = async () => {
        const selectedChapters = getSelectedChapters();

        if (!selectedChapters.length) {
            showSnackbar("Please select at least one chapter first", "warning");
            return;
        }

        if (!airaBlueprint.length) {
            showSnackbar("Please create a blueprint first", "warning");
            return;
        }

        const validBlueprint = airaBlueprint
            .map((row, index) => ({
                questionNumber: index + 1,
                quizType: row.quizType || "MCQ",
                difficulty: row.difficulty || "Medium",
                marks: Math.max(1, Number(row.marks) || 1),
            }))
            .filter((row) => row.quizType && row.difficulty && row.marks);

        if (!validBlueprint.length) {
            showSnackbar("Please add valid blueprint rows", "warning");
            return;
        }

        try {
            setIsAiraLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chapter-quiz/aira-generate-quiz`,
                {
                    chapterIds: selectedChapters.map((chapter) => chapter._id),
                    blueprint: validBlueprint,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.data?.success) {
                showSnackbar(
                    response.data?.message || "AIRA could not generate quiz",
                    "error",
                );
                return;
            }

            const generatedQuestions = response.data?.data?.questions || [];

            if (!generatedQuestions.length) {
                showSnackbar(
                    "AIRA did not generate questions. Try again.",
                    "warning",
                );
                return;
            }

            const formattedQuestions = generatedQuestions.map((q, index) =>
                formatAiraQuestion(q, index + 1),
            );

            setAiraGeneratedQuestions((prev) => {
                const lockedQuestions = new Map(
                    prev
                        .filter((question) => question.locked)
                        .map((question) => [
                            Number(question.questionNumber),
                            question,
                        ]),
                );

                return formattedQuestions.map((question) =>
                    lockedQuestions.get(Number(question.questionNumber)) ||
                    question,
                );
            });

            setQuiz((prev) => ({
                ...prev,
                title:
                    prev.title ||
                    response.data?.data?.title ||
                    "AIRA Generated Quiz",
            }));

            showSnackbar(
                "AIRA quiz generated. You can also select sample questions; both will be saved together.",
                "success",
            );

            setSelectedQuestions([]);

            showSnackbar(
                "AIRA quiz generated and selected automatically. Review, remove if needed, then save.",
                "success",
            );
        } catch (error) {
            console.error("AIRA quiz generation error:", error);

            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "AIRA quiz generation failed",
                "error",
            );
        } finally {
            setIsAiraLoading(false);
        }
    };

    const removeAiraQuestion = (indexToRemove) => {
        const updatedAiraQuestions = airaGeneratedQuestions
            .filter((_, index) => index !== indexToRemove)
            .map((q, index) => ({
                ...q,
                questionNumber: index + 1,
            }));

        setAiraGeneratedQuestions(updatedAiraQuestions);
    };
    const toggleAiraLock = (indexToToggle) => {
        setAiraGeneratedQuestions((prev) =>
            prev.map((question, index) =>
                index === indexToToggle
                    ? { ...question, locked: !question.locked }
                    : question,
            ),
        );
    };
    const updateAiraGeneratedQuestion = (indexToUpdate, field, value) => {
        setAiraGeneratedQuestions((prev) =>
            prev.map((question, index) =>
                index === indexToUpdate
                    ? {
                        ...question,
                        [field]:
                            field === "marks"
                                ? Math.max(1, Number(value) || 1)
                                : value,
                    }
                    : question,
            ),
        );
    };
    const regenerateSingleAiraQuestion = async (indexToRegenerate) => {
        const targetQuestion = airaGeneratedQuestions[indexToRegenerate];
        const selectedChapters = getSelectedChapters();

        if (!targetQuestion || !selectedChapters.length) {
            showSnackbar(
                "Please select at least one chapter before regenerating a question.",
                "warning",
            );
            return;
        }

        if (targetQuestion.locked) {
            showSnackbar(
                "Unlock this question first if you want AIRA to replace it.",
                "info",
            );
            return;
        }

        try {
            setRegeneratingQuestionNumber(targetQuestion.questionNumber);

            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chapter-quiz/aira-generate-quiz`,
                {
                    chapterIds: selectedChapters.map((chapter) => chapter._id),
                    blueprint: [
                        {
                            questionNumber: targetQuestion.questionNumber,
                            quizType: targetQuestion.type || "MCQ",
                            difficulty: targetQuestion.difficulty || "Medium",
                            marks: Math.max(1, Number(targetQuestion.marks) || 1),
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const nextQuestion = response.data?.data?.questions?.[0];
            if (!response.data?.success || !nextQuestion) {
                showSnackbar(
                    response.data?.message ||
                    "AIRA could not regenerate this question.",
                    "error",
                );
                return;
            }

            const formattedQuestion = formatAiraQuestion(
                nextQuestion,
                targetQuestion.questionNumber,
            );

            setAiraGeneratedQuestions((prev) =>
                prev.map((question, index) =>
                    index === indexToRegenerate ? formattedQuestion : question,
                ),
            );

            showSnackbar(
                `Question ${targetQuestion.questionNumber} regenerated.`,
                "success",
            );
        } catch (error) {
            console.error("AIRA single question regeneration error:", error);
            showSnackbar(
                error.response?.data?.message ||
                "Unable to regenerate this question right now.",
                "error",
            );
        } finally {
            setRegeneratingQuestionNumber(null);
        }
    };
    const getFinalQuizQuestions = () => {
        const selectedSampleQuestions =
            handleSelectedQuestionsAndConvertToQuizFormat(selectedQuestions);

        const selectedAiraQuestions = airaGeneratedQuestions.map(
            (question) => ({
                type: question.type,
                difficulty: question.difficulty || "Medium",
                question: question.question,
                options: Array.isArray(question.options)
                    ? question.options
                    : [],
                correctAnswer:
                    question.correctAnswer === false
                        ? false
                        : question.correctAnswer || "",
                marks: Number(question.marks || 1),
                source: "aira",
                acceptableAnswers: question.acceptableAnswers || [],
                gradingKeywords: question.gradingKeywords || [],
                gradingHint: question.gradingHint || "",
            }),
        );

        return [...selectedSampleQuestions, ...selectedAiraQuestions].map(
            (question, index) => ({
                ...question,
                questionNumber: index + 1,
            }),
        );
    };

    const getFinalQuizTotalMarks = () => {
        return getFinalQuizQuestions().reduce(
            (sum, question) => sum + Number(question.marks || 0),
            0,
        );
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalQuestions = getFinalQuizQuestions();
        const selectedChapters = getSelectedChapters();

        if (!finalQuestions || finalQuestions.length === 0) {
            showSnackbar(
                "Please select sample questions or generate questions with AIRA.",
                "warning",
            );
            return;
        }

        if (!selectedTargetBatchIds.length) {
            showSnackbar(
                "Please choose at least one batch to assign this quiz.",
                "warning",
            );
            return;
        }

        const finalQuiz = {
            ...quiz,
            questions: finalQuestions,
            assignedTo: selectedTargetBatchIds,
            chapterIds: selectedChapters.map((chapter) => chapter._id),
            chapterNames: selectedChapters.map((chapter) => chapter.name),
            totalMarks: finalQuestions.reduce(
                (sum, q) => sum + Number(q.marks || 0),
                0,
            ),
        };

        try {
            setIsLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/quiz/create`,
                finalQuiz,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.data.success) {
                showSnackbar("Quiz created successfully");

                setQuiz({
                    title: "",
                    description: "",
                    instructions:
                        "Every question is mandatory. Please read each question carefully before answering.",
                    totalMarks: 0,
                    timeLimit: 30,
                    status: "active",
                    startDate: null,
                    endDate: null,
                    assignedTo: [],
                    allowReattempt: false,
                    showCorrectAnswers: false,
                    passingPercentage: 50,
                    selectedMarksPerQuestion: 1,
                    questions: [],
                    quizMode,
                    gameSettings: buildGameSettings(quizMode),
                });

                setSelectedQuestions([]);
                setAiraGeneratedQuestions([]);
                setAiraBlueprint([]);
                setAiraTotalQuestions(10);
                setSelectedBatch("");
                setSelectedTargetBatchIds([]);
                setSelectedCourse("");
                setSelectedChapterIds([]);
                setQuestions([]);
                setCourses([]);
                setChapters([]);
            }
        } catch (error) {
            console.error("Error creating quiz:", error);
            showSnackbar("Error While Creating Quiz", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen py-4 px-4">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="rounded-2xl shadow-xl overflow-hidden border"
                        style={{
                            background: isDark ? "#1f1f1f" : "#ffffff",
                            borderColor: isDark ? "#404040" : "#e5e7eb",
                        }}
                    >
                        <div className="bg-[#008000] px-8 py-6">
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <CheckCircle className="w-8 h-8" />
                                Create an Engaging Quiz with Sample Questions
                            </h1>
                            <p className="text-blue-100 mt-2">
                                Design engaging quizzes with multiple question
                                types
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-8 space-y-8"
                            style={{
                                color: isDark ? "#ffffff" : "#111827",
                            }}
                        >
                            {quizMode !== "formal" && (
                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold uppercase text-amber-800">
                                                Practice Quiz Experience
                                            </p>
                                            <p className="mt-1 text-sm text-amber-900">
                                                Use sample and AIRA questions for a playful practice quiz.
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
                                                        gameSettings:
                                                            buildGameSettings(
                                                                nextMode,
                                                            ),
                                                    }));
                                                }}
                                                className="mt-2 w-full min-w-48 rounded-lg border border-amber-200 bg-white px-4 py-3"
                                            >
                                                <option value="fun">
                                                    Practice Quiz
                                                </option>
                                                <option value="revision">
                                                    Revision Challenge
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                </section>
                            )}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2
                                        className="text-2xl font-semibold"
                                        style={{
                                            color: isDark ? "#fff" : "#1f2937",
                                        }}
                                    >
                                        Basic Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Quiz Title{" "}
                                            <span className="text-pink-600">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={quiz.title}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                            placeholder="Enter quiz title..."
                                            required
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={quiz.description}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none"
                                            placeholder="Brief description of the quiz..."
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h2
                                        className="text-2xl font-semibold"
                                        style={{
                                            color: isDark ? "#fff" : "#1f2937",
                                        }}
                                    >
                                        Quiz Settings
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Time Per Question (Seconds)
                                        </label>
                                        <select
                                            value={quiz.timeLimit}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    timeLimit: parseInt(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                        >
                                            <option value={30}>
                                                30 seconds
                                            </option>
                                            <option value={60}>
                                                60 seconds
                                            </option>
                                            <option value={90}>
                                                90 seconds
                                            </option>
                                            <option value={120}>
                                                120 seconds
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={quiz.status}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    status: e.target.value,
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="scheduled">
                                                Scheduled
                                            </option>
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                            <option value="archived">
                                                Archived
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Passing Percentage
                                        </label>
                                        <input
                                            type="number"
                                            value={quiz.passingPercentage}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    passingPercentage: parseInt(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                            min="0"
                                            max="100"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <LocalizationProvider
                                            dateAdapter={AdapterDayjs}
                                        >
                                            <DateTimePicker
                                                value={quiz.startDate}
                                                onChange={(newValue) =>
                                                    setQuiz((prev) => ({
                                                        ...prev,
                                                        startDate: newValue,
                                                    }))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </LocalizationProvider>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <LocalizationProvider
                                            dateAdapter={AdapterDayjs}
                                        >
                                            <DateTimePicker
                                                value={quiz.endDate}
                                                onChange={(newValue) =>
                                                    setQuiz((prev) => ({
                                                        ...prev,
                                                        endDate: newValue,
                                                    }))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </LocalizationProvider>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Marks for Sample Questions
                                        </label>
                                        <select
                                            value={
                                                quiz.selectedMarksPerQuestion
                                            }
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    selectedMarksPerQuestion:
                                                        e.target.value,
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                            required
                                        >
                                            {[1, 2, 3, 4, 5].map((marks) => (
                                                <option
                                                    key={marks}
                                                    value={marks}
                                                >
                                                    {marks}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Show Correct Answers
                                        </label>
                                        <select
                                            value={quiz.showCorrectAnswers}
                                            onChange={(e) =>
                                                setQuiz((prev) => ({
                                                    ...prev,
                                                    showCorrectAnswers:
                                                        e.target.value ===
                                                        "true",
                                                }))
                                            }
                                            className="w-full px-4 py-3 rounded-lg border"
                                            style={{
                                                background: isDark ? "#2b2b2b" : "#fff",
                                                color: isDark ? "#fff" : "#111827",
                                                borderColor: isDark ? "#4b5563" : "#d1d5db",
                                            }}
                                            required
                                        >
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className="py-4 px-4 mb-4">
                                <div
                                    className="max-w-4xl mx-auto rounded-2xl shadow-xl overflow-hidden p-6"
                                    style={{
                                        background: isDark ? "#242424" : "#ffffff",
                                    }}
                                >
                                    <section className="space-y-6">
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
                                                    snackbarSeverity ===
                                                        "success" ? (
                                                        <CheckCircleOutlineIcon fontSize="inherit" />
                                                    ) : undefined
                                                }
                                            >
                                                {snackbarMessage}
                                            </Alert>
                                        </Snackbar>

                                        <Box mb={2}>
                                            <FormControl fullWidth required>
                                                <InputLabel id="Batches-select-label">
                                                    Source Batch
                                                </InputLabel>
                                                <Select
                                                    labelId="Batches-select-label"
                                                    value={
                                                        selectedBatch?._id || ""
                                                    }
                                                    onChange={handleBatchChange}
                                                    label="Source Batch"
                                                >
                                                    {getAllBatches.map(
                                                        (btc) => (
                                                            <MenuItem
                                                                key={btc._id}
                                                                value={btc._id}
                                                            >
                                                                {btc.batchName}
                                                            </MenuItem>
                                                        ),
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box mb={2}>
                                            <FormControl fullWidth required>
                                                <InputLabel id="target-batches-select-label">
                                                    Assign To Batches
                                                </InputLabel>
                                                <Select
                                                    labelId="target-batches-select-label"
                                                    multiple
                                                    value={selectedTargetBatchIds}
                                                    onChange={handleTargetBatchChange}
                                                    label="Assign To Batches"
                                                    renderValue={(selected) =>
                                                        getAllBatches
                                                            .filter((batch) =>
                                                                selected.includes(
                                                                    batch._id,
                                                                ),
                                                            )
                                                            .map(
                                                                (batch) =>
                                                                    batch.batchName,
                                                            )
                                                            .join(", ")
                                                    }
                                                >
                                                    {getAllBatches.map((batch) => (
                                                        <MenuItem
                                                            key={batch._id}
                                                            value={batch._id}
                                                        >
                                                            <Checkbox
                                                                checked={selectedTargetBatchIds.includes(
                                                                    batch._id,
                                                                )}
                                                            />
                                                            {batch.batchName}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box mb={2}>
                                            <FormControl fullWidth required>
                                                <InputLabel id="course-select-label">
                                                    Courses
                                                </InputLabel>
                                                <Select
                                                    labelId="course-select-label"
                                                    value={selectedCourse}
                                                    onChange={
                                                        handleCourseChange
                                                    }
                                                    label="Course"
                                                >
                                                    {courses.map((course) => (
                                                        <MenuItem
                                                            key={course._id}
                                                            value={course}
                                                        >
                                                            {course.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box mb={2}>
                                            <FormControl fullWidth required>
                                                <InputLabel id="Chapter-select-label">
                                                    Chapters
                                                </InputLabel>
                                                <Select
                                                    labelId="Chapter-select-label"
                                                    multiple
                                                    value={selectedChapterIds}
                                                    onChange={
                                                        handleChapterChange
                                                    }
                                                    label="Chapters"
                                                    renderValue={(selected) =>
                                                        chapters
                                                            .filter((chapter) =>
                                                                selected.includes(
                                                                    chapter._id,
                                                                ),
                                                            )
                                                            .map(
                                                                (chapter) =>
                                                                    chapter.name,
                                                            )
                                                            .join(", ")
                                                    }
                                                >
                                                    {chapters.map((chapter) => (
                                                        <MenuItem
                                                            key={chapter._id}
                                                            value={chapter._id}
                                                        >
                                                            <Checkbox
                                                                checked={selectedChapterIds.includes(
                                                                    chapter._id,
                                                                )}
                                                            />
                                                            {chapter.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box mb={2}>
                                            <FormControl fullWidth>
                                                <InputLabel id="quizType-select-label">
                                                    Fetch Sample Questions Type
                                                </InputLabel>
                                                <Select
                                                    labelId="quizType-select-label"
                                                    value={selectedQuizType}
                                                    onChange={
                                                        handleQuizTypeChange
                                                    }
                                                    label="Fetch Sample Questions Type"
                                                >
                                                    {quizType.map((type) => (
                                                        <MenuItem
                                                            key={type._id}
                                                            value={type.name}
                                                        >
                                                            {type.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <div
                                            className="mt-6 rounded-2xl p-6 border shadow-sm"
                                            style={{
                                                background: isDark ? "#242424" : "#ffffff",
                                                borderColor: isDark ? "#404040" : "#e5e7eb",
                                            }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: isDark ? "#3b2f12" : "#FEF3C7",
                                                    }}
                                                >
                                                    <Sparkles
                                                        className="w-5 h-5"
                                                        style={{ color: "#D97706" }}
                                                    />
                                                </div>

                                                <div>
                                                    <h2
                                                        className="text-xl font-semibold"
                                                        style={{ color: theme.palette.text.primary }}
                                                    >
                                                        AIRA Quiz Blueprint
                                                    </h2>

                                                    <p
                                                        className="text-sm"
                                                        style={{ color: theme.palette.text.secondary }}
                                                    >
                                                        Choose question type, difficulty, and marks for each question.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Total Questions
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={
                                                            airaTotalQuestions
                                                        }
                                                        onChange={(e) =>
                                                            setAiraTotalQuestions(
                                                                Math.max(
                                                                    1,
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 rounded-lg border"
                                                        style={{
                                                            background: isDark ? "#2b2b2b" : "#fff",
                                                            color: isDark ? "#fff" : "#111827",
                                                            borderColor: isDark ? "#4b5563" : "#d1d5db",
                                                        }}
                                                        min="1"
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            createAiraBlueprint
                                                        }
                                                        style={{
                                                            background: isDark ? "#2b2b2b" : "#fff",
                                                            color: isDark ? "#fff" : "#a16207",
                                                            borderColor: "#facc15",
                                                        }}
                                                    >
                                                        Create Blueprint
                                                    </button>
                                                </div>

                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            addAiraBlueprintRow
                                                        }
                                                        style={{
                                                            background: isDark ? "#2b2b2b" : "#fff",
                                                            color: isDark ? "#fff" : "#a16207",
                                                            borderColor: "#facc15",
                                                        }}
                                                    >
                                                        + Add One Row
                                                    </button>
                                                </div>
                                            </div>

                                            {airaBlueprint.length > 0 && (
                                                <>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                applyAiraBulkChange(
                                                                    "quizType",
                                                                    "MCQ",
                                                                )
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            All MCQ
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                applyAiraBulkChange(
                                                                    "difficulty",
                                                                    "Easy",
                                                                )
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            All Easy
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                applyAiraBulkChange(
                                                                    "difficulty",
                                                                    "Medium",
                                                                )
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            All Medium
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                applyAiraBulkChange(
                                                                    "difficulty",
                                                                    "Hard",
                                                                )
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            All Hard
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                applyAiraBulkChange(
                                                                    "marks",
                                                                    1,
                                                                )
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            All 1 Mark
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                autoBalanceDifficulty
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            Balance Difficulty
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                autoMixQuestionTypes
                                                            }
                                                            style={{
                                                                background: isDark ? "#2b2b2b" : "#fff",
                                                                color: isDark ? "#fff" : "#111827",
                                                                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                            }}
                                                        >
                                                            Auto Mix Types
                                                        </button>
                                                    </div>

                                                    <div
                                                        className="max-h-[420px] overflow-auto rounded-xl"
                                                        style={{
                                                            background: isDark ? "#242424" : "#fff",
                                                            border: `1px solid ${isDark ? "#404040" : "#fde68a"}`
                                                        }}
                                                    >
                                                        <table className="w-full text-sm">
                                                            <thead
                                                                style={{
                                                                    background: theme.palette.mode === "dark"
                                                                        ? theme.palette.background.paper
                                                                        : "#FEF3C7",
                                                                    color: theme.palette.text.primary,
                                                                }}
                                                            >
                                                                <tr>
                                                                    <th className="p-3 text-left">
                                                                        Q.No
                                                                    </th>
                                                                    <th className="p-3 text-left">
                                                                        Question
                                                                        Type
                                                                    </th>
                                                                    <th className="p-3 text-left">
                                                                        Difficulty
                                                                    </th>
                                                                    <th className="p-3 text-left">
                                                                        Marks
                                                                    </th>
                                                                    <th className="p-3 text-left">
                                                                        Action
                                                                    </th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {airaBlueprint.map(
                                                                    (
                                                                        row,
                                                                        index,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                index
                                                                            }
                                                                            style={{
                                                                                borderTop: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`
                                                                            }}
                                                                        >
                                                                            <td className="p-3 font-semibold">
                                                                                Q
                                                                                {
                                                                                    row.questionNumber
                                                                                }
                                                                            </td>

                                                                            <td className="p-3">
                                                                                <select
                                                                                    value={
                                                                                        row.quizType
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateAiraBlueprintRow(
                                                                                            index,
                                                                                            "quizType",
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        background: isDark ? "#2b2b2b" : "#fff",
                                                                                        color: isDark ? "#fff" : "#111827",
                                                                                        border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                                                    }}
                                                                                >
                                                                                    <option value="MCQ">
                                                                                        MCQ
                                                                                    </option>
                                                                                    <option value="True or False">
                                                                                        True/False
                                                                                    </option>
                                                                                    <option value="Fill In the Blanks">
                                                                                        Fill
                                                                                        in
                                                                                        the
                                                                                        Blanks
                                                                                    </option>
                                                                                    <option value="Very Short Answer">
                                                                                        Very
                                                                                        Short
                                                                                        Answer
                                                                                    </option>
                                                                                </select>
                                                                            </td>

                                                                            <td className="p-3">
                                                                                <select
                                                                                    value={
                                                                                        row.difficulty
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateAiraBlueprintRow(
                                                                                            index,
                                                                                            "difficulty",
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        background: isDark ? "#2b2b2b" : "#fff",
                                                                                        color: isDark ? "#fff" : "#111827",
                                                                                        border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                                                    }}
                                                                                >
                                                                                    <option value="Easy">
                                                                                        Easy
                                                                                    </option>
                                                                                    <option value="Medium">
                                                                                        Medium
                                                                                    </option>
                                                                                    <option value="Hard">
                                                                                        Hard
                                                                                    </option>
                                                                                </select>
                                                                            </td>

                                                                            <td className="p-3">
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        row.marks
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateAiraBlueprintRow(
                                                                                            index,
                                                                                            "marks",
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        background: isDark ? "#2b2b2b" : "#fff",
                                                                                        color: isDark ? "#fff" : "#111827",
                                                                                        border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`
                                                                                    }}
                                                                                    min="1"
                                                                                />
                                                                            </td>

                                                                            <td className="p-3">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeAiraBlueprintRow(
                                                                                            index,
                                                                                        )
                                                                                    }
                                                                                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            generateQuizWithAira
                                                        }
                                                        disabled={isAiraLoading}
                                                        className="mt-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                                                    >
                                                        <Sparkles className="w-5 h-5" />
                                                        {isAiraLoading
                                                            ? `Generating ${airaBlueprint.length} question(s)...`
                                                            : "Generate with AIRA"}
                                                    </button>

                                                    {airaBlueprint.length >
                                                        50 && (
                                                            <p className="mt-2 text-sm text-orange-700">
                                                                Large quiz
                                                                generation may take
                                                                longer. AIRA will
                                                                process it in
                                                                batches.
                                                            </p>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {airaGeneratedQuestions.length > 0 && (
                                <div
                                    className="mt-6 mb-6 rounded-2xl p-6 border"
                                    style={{
                                        background: isDark ? "#242424" : "#ffffff",
                                        borderColor: isDark ? "#404040" : "#e5e7eb",
                                    }}
                                >
                                    <h2 style={{
                                        color: isDark ? "#fff" : "#1f2937"
                                    }}>
                                        AIRA Generated Questions
                                    </h2>

                                    <div className="space-y-4">
                                        {airaGeneratedQuestions.map(
                                            (question, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        background: isDark ? "#2b2b2b" : "#f9fafb",
                                                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`
                                                    }}
                                                >
                                                    <div className="flex justify-between gap-4">
                                                        <h3 style={{
                                                            color: isDark ? "#fff" : "#1f2937"
                                                        }}>
                                                            Q{index + 1}.{" "}
                                                            {question.question}
                                                        </h3>

                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full h-fit">
                                                            AIRA
                                                        </span>
                                                    </div>

                                                    {question.type === "MCQ" &&
                                                        Array.isArray(
                                                            question.options,
                                                        ) &&
                                                        question.options
                                                            .length > 0 && (
                                                            <ul
                                                                className="mt-3 list-disc pl-6"
                                                                style={{
                                                                    color: isDark ? "#d1d5db" : "#374151"
                                                                }}
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
                                                                            {
                                                                                option
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        )}

                                                    {question.type ===
                                                        "True or False" && (
                                                            <p
                                                                className="mt-2"
                                                                style={{
                                                                    color: isDark ? "#d1d5db" : "#374151"
                                                                }}
                                                            >
                                                                True / False
                                                            </p>
                                                        )}

                                                    <p className="mt-3 text-sm text-green-700">
                                                        <strong>Answer:</strong>{" "}
                                                        {String(
                                                            question.correctAnswer,
                                                        )}
                                                    </p>

                                                    <p style={{
                                                        color: isDark ? "#cbd5e1" : "#4b5563"
                                                    }}>
                                                        <strong>Type:</strong>{" "}
                                                        {question.type} |{" "}
                                                        <strong>
                                                            Difficulty:
                                                        </strong>{" "}
                                                        {question.difficulty ||
                                                            "Medium"}{" "}
                                                        |{" "}
                                                        <strong>Marks:</strong>{" "}
                                                        {question.marks}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeAiraQuestion(
                                                                index,
                                                            )
                                                        }
                                                        className="mt-3 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            {isLoading ? (
                                <Typography
                                    variant="h6"
                                    align="center"
                                    gutterBottom
                                >
                                    Loading Questions...
                                </Typography>
                            ) : questions.length === 0 &&
                                airaGeneratedQuestions.length === 0 ? (
                                <Typography
                                    variant="h6"
                                    align="center"
                                    gutterBottom
                                >
                                    No Questions Found. Select batch, course,
                                    chapter(s), and type to fetch sample
                                    questions, or generate questions with AIRA.
                                </Typography>
                            ) : questions.length > 0 ? (
                                <TableContainer component={Paper}>
                                    <Table aria-label="sample questions table">
                                        <TableHead>
                                            <TableRow
                                                sx={{
                                                    backgroundColor: "green",
                                                }}
                                            >
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Select Question
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Question Type
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Question Title
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Chapter Name
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Question Stem
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "white" }}
                                                    align="center"
                                                >
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {questions
                                                .slice(
                                                    page * rowsPerPage,
                                                    page * rowsPerPage +
                                                    rowsPerPage,
                                                )
                                                .map((question) => (
                                                    <TableRow
                                                        key={
                                                            question._id ||
                                                            question.questionId
                                                        }
                                                    >
                                                        <TableCell align="center">
                                                            <Checkbox
                                                                checked={selectedQuestions.some(
                                                                    (
                                                                        selected,
                                                                    ) =>
                                                                        selected._id ===
                                                                        question._id,
                                                                )}
                                                                onChange={() =>
                                                                    handleCheckboxChange(
                                                                        question,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {
                                                                question.questionType
                                                            }
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {
                                                                question.questionTitle
                                                            }
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {
                                                                question.chapterName
                                                            }
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: question.questionStem,
                                                                }}
                                                            />
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() =>
                                                                    ViewQuestionDetails(
                                                                        question._id,
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : null}

                            {questions.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <TablePagination
                                        rowsPerPageOptions={[10, 15, 20]}
                                        component="div"
                                        count={questions.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={
                                            handleChangeRowsPerPage
                                        }
                                    />
                                </Box>
                            )}

                            <Typography
                                variant="h4"
                                gutterBottom
                                align="center"
                                sx={{ mt: 4 }}
                            >
                                Selected Questions
                            </Typography>

                            {selectedQuestions.length === 0 &&
                                airaGeneratedQuestions.length === 0 ? (
                                <Typography
                                    align="center"
                                    color="text.secondary"
                                >
                                    No questions selected yet.
                                </Typography>
                            ) : (
                                <>
                                    {selectedQuestions.length > 0 && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{ mb: 1, fontWeight: 700 }}
                                            >
                                                Selected Sample Questions (
                                                {selectedQuestions.length})
                                            </Typography>

                                            <TableContainer component={Paper}>
                                                <Table aria-label="selected sample questions table">
                                                    <TableHead>
                                                        <TableRow
                                                            sx={{
                                                                backgroundColor:
                                                                    "green",
                                                            }}
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    color: "white",
                                                                }}
                                                                align="center"
                                                            >
                                                                Question Type
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: "white",
                                                                }}
                                                                align="center"
                                                            >
                                                                Question Title
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: "white",
                                                                }}
                                                                align="center"
                                                            >
                                                                Chapter Name
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: "white",
                                                                }}
                                                                align="center"
                                                            >
                                                                Question Stem
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>

                                                    <TableBody>
                                                        {selectedQuestions.map(
                                                            (question) => (
                                                                <TableRow
                                                                    key={
                                                                        question._id ||
                                                                        question.questionId
                                                                    }
                                                                >
                                                                    <TableCell align="center">
                                                                        {
                                                                            question.questionType
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        {
                                                                            question.questionTitle
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        {
                                                                            question.chapterName
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        <div
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: question.questionStem,
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}

                                    {airaGeneratedQuestions.length > 0 && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{ mb: 1, fontWeight: 700 }}
                                            >
                                                Selected AIRA Questions (
                                                {airaGeneratedQuestions.length})
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gap: 2,
                                                }}
                                            >
                                                {airaGeneratedQuestions.map(
                                                    (question, index) => (
                                                        <Paper
                                                            key={index}
                                                            variant="outlined"
                                                            sx={{
                                                                borderRadius: 3,
                                                                p: 2.5,
                                                                borderColor:
                                                                    question.locked
                                                                        ? "#9fd6a2"
                                                                        : "#e5e7eb",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 1,
                                                                    flexWrap:
                                                                        "wrap",
                                                                    mb: 2,
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    Question{" "}
                                                                    {
                                                                        question.questionNumber
                                                                    }
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={
                                                                        question.locked
                                                                            ? "Locked"
                                                                            : "Editable"
                                                                    }
                                                                    color={
                                                                        question.locked
                                                                            ? "success"
                                                                            : "default"
                                                                    }
                                                                    variant={
                                                                        question.locked
                                                                            ? "filled"
                                                                            : "outlined"
                                                                    }
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Box
                                                                sx={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: {
                                                                        xs: "1fr",
                                                                        md: "180px 180px 110px auto",
                                                                    },
                                                                    gap: 2,
                                                                    alignItems:
                                                                        "start",
                                                                    mb: 2,
                                                                }}
                                                            >
                                                                <Select
                                                                    size="small"
                                                                    value={
                                                                        question.type
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateAiraGeneratedQuestion(
                                                                            index,
                                                                            "type",
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    fullWidth
                                                                >
                                                                    {quizType.map(
                                                                        (
                                                                            type,
                                                                        ) => (
                                                                            <MenuItem
                                                                                key={
                                                                                    type._id
                                                                                }
                                                                                value={
                                                                                    type.name
                                                                                }
                                                                            >
                                                                                {
                                                                                    type.name
                                                                                }
                                                                            </MenuItem>
                                                                        ),
                                                                    )}
                                                                </Select>
                                                                <Select
                                                                    size="small"
                                                                    value={
                                                                        question.difficulty
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateAiraGeneratedQuestion(
                                                                            index,
                                                                            "difficulty",
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    fullWidth
                                                                >
                                                                    {difficultyOptions.map(
                                                                        (
                                                                            difficulty,
                                                                        ) => (
                                                                            <MenuItem
                                                                                key={
                                                                                    difficulty
                                                                                }
                                                                                value={
                                                                                    difficulty
                                                                                }
                                                                            >
                                                                                {
                                                                                    difficulty
                                                                                }
                                                                            </MenuItem>
                                                                        ),
                                                                    )}
                                                                </Select>
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    value={
                                                                        question.marks
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateAiraGeneratedQuestion(
                                                                            index,
                                                                            "marks",
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    inputProps={{
                                                                        min: 1,
                                                                    }}
                                                                    label="Marks"
                                                                />
                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 1,
                                                                        flexWrap:
                                                                            "wrap",
                                                                        justifyContent: {
                                                                            xs: "flex-start",
                                                                            md: "flex-end",
                                                                        },
                                                                    }}
                                                                >
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="primary"
                                                                        size="small"
                                                                        startIcon={
                                                                            <RefreshCw
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        }
                                                                        disabled={
                                                                            regeneratingQuestionNumber ===
                                                                            question.questionNumber ||
                                                                            question.locked
                                                                        }
                                                                        sx={{
                                                                            borderRadius: 2,
                                                                        }}
                                                                        onClick={() =>
                                                                            regenerateSingleAiraQuestion(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        {regeneratingQuestionNumber ===
                                                                            question.questionNumber
                                                                            ? "Regenerating..."
                                                                            : "Regenerate"}
                                                                    </Button>
                                                                    <Button
                                                                        variant={
                                                                            question.locked
                                                                                ? "contained"
                                                                                : "outlined"
                                                                        }
                                                                        color="success"
                                                                        size="small"
                                                                        startIcon={
                                                                            question.locked ? (
                                                                                <Lock
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <Unlock
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            )
                                                                        }
                                                                        sx={{
                                                                            borderRadius: 2,
                                                                        }}
                                                                        onClick={() =>
                                                                            toggleAiraLock(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        {question.locked
                                                                            ? "Locked"
                                                                            : "Lock"}
                                                                    </Button>
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="error"
                                                                        size="small"
                                                                        startIcon={
                                                                            <Trash2
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        }
                                                                        sx={{
                                                                            borderRadius: 2,
                                                                        }}
                                                                        disabled={
                                                                            question.locked
                                                                        }
                                                                        onClick={() =>
                                                                            removeAiraQuestion(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </Box>
                                                            </Box>

                                                            <Box
                                                                sx={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: {
                                                                        xs: "1fr",
                                                                        md: "1.25fr 1fr",
                                                                    },
                                                                    gap: 2,
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        p: 2,
                                                                        borderRadius: 2,
                                                                        backgroundColor: isDark ? "#2b2b2b" : "#f8fafc",
                                                                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            display: "block",
                                                                            mb: 0.75,
                                                                            fontWeight: 700,
                                                                            letterSpacing: 0.3,
                                                                            color: isDark ? "#9ca3af" : "#4b5563",
                                                                            textTransform: "uppercase",
                                                                        }}
                                                                    >
                                                                        Question
                                                                    </Typography>

                                                                    <Typography
                                                                        sx={{
                                                                            lineHeight: 1.6,
                                                                            color: isDark ? "#ffffff" : "#1f2937",
                                                                        }}
                                                                    >
                                                                        {question.question}
                                                                    </Typography>
                                                                </Box>
                                                                <Box
                                                                    sx={{
                                                                        p: 2,
                                                                        borderRadius: 2,
                                                                        backgroundColor: isDark ? "#2b2b2b" : "#f9fafb",
                                                                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            display: "block",
                                                                            mb: 0.75,
                                                                            fontWeight: 700,
                                                                            letterSpacing: 0.3,
                                                                            color: isDark ? "#9ca3af" : "#4b5563",
                                                                            textTransform: "uppercase",
                                                                        }}
                                                                    >
                                                                        Answer
                                                                    </Typography>

                                                                    <Typography
                                                                        sx={{
                                                                            lineHeight: 1.6,
                                                                            color: isDark ? "#ffffff" : "#374151",
                                                                        }}
                                                                    >
                                                                        {String(question.correctAnswer)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    ),
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 2,
                                            background: isDark ? "#1f2937" : "#ecfdf5",
                                            border: "1px solid #b7dfb9",
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 700 }}>
                                            Final Quiz Summary
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Total Questions:{" "}
                                            {selectedQuestions.length +
                                                airaGeneratedQuestions.length}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Total Marks:{" "}
                                            {getFinalQuizTotalMarks()}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            <div className="border-t border-gray-200 pt-8">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-[#348c39] hover:bg-[#0b780b] hover:cursor-pointer text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                                >
                                    <Save className="w-5 h-5" />
                                    {isLoading
                                        ? "Saving..."
                                        : "Save Quiz & Assign"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {open && (
                <CompleteQuestion
                    open={open}
                    onClose={() => setOpen(false)}
                    questionId={selectedQuestionId}
                />
            )}
        </>
    );
};

export default CreateSampleQuiz;
