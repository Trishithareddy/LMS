import React, { useEffect, useState } from "react";
import {
    Plus,
    Trash2,
    Save,
    Users,
    CheckCircle,
    Settings,
    Sparkles,
} from "lucide-react";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import { useParams } from "react-router-dom";
function ChapterQuiz() {
    const [quiz, setQuiz] = useState({
        title: "",
        totalMarks: 0,
        timeLimit: 30,
        status: "active",
        assignedChapter: "",
        allowReattempt: true,
        showCorrectAnswers: true,
        passingPercentage: 50,
        questions: [],
    });

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsloading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAiraLoading, setIsAiraLoading] = useState(false);
    const [airaQuizType, setAiraQuizType] = useState("Mixed");
    const [airaDifficulty, setAiraDifficulty] = useState("Medium");
    const [airaQuestionCount, setAiraQuestionCount] = useState(5);
    const [airaMarksPerQuestion, setAiraMarksPerQuestion] = useState(1);

    // step-1 get chapter Quiz by Chapter Id

    const { chapterId } = useParams();
    // console.log("Chapter ID from URL:", chapterId);

    const fetchChapterQuiz = async () => {
        if (!chapterId) {
            console.error("No chapter ID provided in URL");
            showSnackbar("No chapter ID provided in URL", "error");
            setIsloading(false);
            return;
        }
        try {
            setIsloading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/chapter-quiz/get-chapter-quiz/${chapterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const quizData = response.data.quiz;
            console.log("Fetched Quiz Data:", response.data.quiz);
            if (quizData) {
                setQuiz(quizData);
                setIsEditMode(true);
            } else {
                setIsEditMode(false);
            }
        } catch (error) {
            console.error("Error fetching chapter quiz:", error);
            showSnackbar("Error While Fetching Chapter Quiz", "error");
        } finally {
            setIsloading(false);
        }
    };

    useEffect(() => {
        fetchChapterQuiz();
    }, []);

    const addQuestion = () => {
        const newQuestion = {
            type: "MCQ",
            question: "",
            options: ["", ""],
            correctAnswer: "",
            marks: 1,
        };
        setQuiz((prev) => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
        }));
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
        setQuiz((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q,
            ),
        }));
    };

    const removeQuestion = (index) => {
        setQuiz((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const addOption = (questionIndex) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options.push("");
        setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
    };

    const updateOption = (questionIndex, optionIndex, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options[optionIndex] = value;
        setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
    };

    const removeOption = (questionIndex, optionIndex) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options.splice(optionIndex, 1);
        setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
    };
    const generateQuizWithAira = async () => {
        if (!chapterId) {
            showSnackbar("Chapter ID not found", "error");
            return;
        }

        try {
            setIsAiraLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chapter-quiz/aira-generate-quiz`,
                {
                    chapterId,
                    quizType: airaQuizType,
                    difficulty: airaDifficulty,
                    numberOfQuestions: airaQuestionCount,
                    marksPerQuestion: airaMarksPerQuestion,
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

            const generated = response.data.data;
            const generatedQuestions = Array.isArray(generated?.questions)
                ? generated.questions
                : [];

            if (generatedQuestions.length === 0) {
                showSnackbar(
                    "AIRA did not generate any questions. Try again.",
                    "warning",
                );
                return;
            }

            const normalizedGeneratedQuestions = generatedQuestions.map(
                (question, index) => ({
                    type: question.type || "MCQ",
                    difficulty: question.difficulty || "Medium",
                    questionNumber: question.questionNumber || index + 1,
                    question: question.question || "",
                    options: Array.isArray(question.options)
                        ? question.options
                        : [],
                    correctAnswer:
                        question.correctAnswer === false
                            ? false
                            : question.correctAnswer || "",
                    acceptableAnswers: Array.isArray(question.acceptableAnswers)
                        ? question.acceptableAnswers
                        : [],
                    gradingKeywords: Array.isArray(question.gradingKeywords)
                        ? question.gradingKeywords
                        : [],
                    gradingHint: question.gradingHint || "",
                    marks: Number(question.marks || airaMarksPerQuestion || 1),
                    source: question.source || "aira",
                }),
            );

            setQuiz((prev) => ({
                ...prev,
                title: prev.title || generated.title || "AIRA Generated Quiz",
                questions: normalizedGeneratedQuestions,
                totalMarks: normalizedGeneratedQuestions.reduce(
                    (sum, q) => sum + Number(q.marks || 0),
                    0,
                ),
                assignedChapter: chapterId,
            }));

            showSnackbar(
                "AIRA quiz generated. Please review before saving.",
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
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Calculate total marks
        const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
        const finalQuiz = { ...quiz, totalMarks };
        finalQuiz.assignedChapter = chapterId;

        // console.log("Submitting Quiz Data:", finalQuiz);
        try {
            setIsloading(true);
            const token = localStorage.getItem("token");
            const response = !isEditMode
                ? await axios.post(
                      `${
                          import.meta.env.VITE_API_URL
                      }/chapter-quiz/create-quiz`,
                      finalQuiz,
                      {
                          headers: {
                              Authorization: `Bearer ${token}`,
                          },
                      },
                  )
                : await axios.patch(
                      `${
                          import.meta.env.VITE_API_URL
                      }/chapter-quiz/update-chapter-quiz/${quiz._id}`,
                      finalQuiz,
                      {
                          headers: {
                              Authorization: `Bearer ${token}`,
                          },
                      },
                  );
            if (response.data.success) {
                fetchChapterQuiz();
                showSnackbar(
                    response.data.message || "Quiz saved successfully",
                );
            }
        } catch (error) {
            console.error("Error creating quiz:", error);
            showSnackbar("Error While Creating Quiz", "error");
        } finally {
            setIsloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <CircularProgress className="mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                        Loading...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#008000] px-8 py-6">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <CheckCircle className="w-8 h-8" />
                            Create Quiz For Chapter
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* AIRA Quiz Generator */}
                        <section className="space-y-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-yellow-700" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Generate Quiz with AIRA
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        AIRA will generate questions from the
                                        selected chapter eBook. Review before
                                        saving.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Quiz Type
                                    </label>
                                    <select
                                        value={airaQuizType}
                                        onChange={(e) =>
                                            setAiraQuizType(e.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="Mixed">Mixed</option>
                                        <option value="MCQ">MCQ</option>
                                        <option value="True or False">
                                            True/False
                                        </option>
                                        <option value="Fill In the Blanks">
                                            Fill in the Blanks
                                        </option>
                                        <option value="Very Short Answer">
                                            Very Short Answer
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        value={airaDifficulty}
                                        onChange={(e) =>
                                            setAiraDifficulty(e.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        No. of Questions
                                    </label>
                                    <input
                                        type="number"
                                        value={airaQuestionCount}
                                        onChange={(e) =>
                                            setAiraQuestionCount(
                                                Math.max(
                                                    1,
                                                    Number(e.target.value) || 1,
                                                ),
                                            )
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                        min="1"
                                        max="30"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Marks / Question
                                    </label>
                                    <input
                                        type="number"
                                        value={airaMarksPerQuestion}
                                        onChange={(e) =>
                                            setAiraMarksPerQuestion(
                                                Math.max(
                                                    1,
                                                    Number(e.target.value) || 1,
                                                ),
                                            )
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={generateQuizWithAira}
                                    disabled={isAiraLoading}
                                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 hover:cursor-pointer text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    {isAiraLoading
                                        ? "Generating..."
                                        : "Generate with AIRA"}
                                </button>

                                <span className="text-sm text-gray-600">
                                    This will replace the current questions in
                                    the editor.
                                </span>
                            </div>
                        </section>
                        {/* Basic Information */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    Basic Information
                                </h2>
                            </div>
                        </section>

                        {/* Quiz Settings */}
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Quiz Title{" "}
                                        <span className="text-pink-600">*</span>
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter quiz title..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Time Limit (minutes){" "}
                                        <span className="text-pink-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={quiz.timeLimit}
                                        onChange={(e) =>
                                            setQuiz((prev) => ({
                                                ...prev,
                                                timeLimit: parseInt(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        min="1"
                                    />
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Passing Percentage{" "}
                                        <span className="text-pink-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={quiz.passingPercentage}
                                        required
                                        onChange={(e) =>
                                            setQuiz((prev) => ({
                                                ...prev,
                                                passingPercentage: parseInt(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Allow Reattempt
                                    </label>
                                    <select
                                        value={quiz.allowReattempt}
                                        onChange={(e) =>
                                            setQuiz((prev) => ({
                                                ...prev,
                                                allowReattempt: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value={false}>Yes</option>
                                        <option value={true}>No</option>
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
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Questions{" "}
                                        <span className="text-pink-600">*</span>
                                    </h2>
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                                        {quiz.questions.length} question
                                        {quiz.questions.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {quiz.questions.map((question, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                Question {index + 1}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeQuestion(index)
                                                }
                                                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Question Type{" "}
                                                    <span className="text-pink-600">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={question.type}
                                                    required={true}
                                                    onChange={(e) => {
                                                        const newType =
                                                            e.target.value;
                                                        let correctAnswer = "";
                                                        if (
                                                            newType ===
                                                            "True or False"
                                                        )
                                                            correctAnswer = true;
                                                        if (newType === "MCQ")
                                                            correctAnswer = "";
                                                        if (
                                                            newType ===
                                                            "Very Short Answer"
                                                        )
                                                            correctAnswer = "";

                                                        updateQuestion(
                                                            index,
                                                            "type",
                                                            newType,
                                                        );
                                                        updateQuestion(
                                                            index,
                                                            "correctAnswer",
                                                            correctAnswer,
                                                        );
                                                        updateQuestion(
                                                            index,
                                                            "options",
                                                            newType === "MCQ"
                                                                ? ["", ""]
                                                                : [],
                                                        );
                                                    }}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                >
                                                    <option value="MCQ">
                                                        Multiple Choice
                                                    </option>
                                                    <option value="True or False">
                                                        True/False
                                                    </option>
                                                    <option value="Fill In the Blanks">
                                                        Fill In the Blanks
                                                    </option>

                                                    <option value="Very Short Answer">
                                                        Very Short Answer
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Marks
                                                </label>
                                                <input
                                                    type="number"
                                                    value={question.marks}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            index,
                                                            "marks",
                                                            parseInt(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    min="1"
                                                />
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Question Text{" "}
                                                    <span className="text-pink-600">
                                                        *
                                                    </span>
                                                </label>
                                                <textarea
                                                    value={question.question}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            index,
                                                            "question",
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                                    placeholder="Enter your question..."
                                                    required={true}
                                                />
                                            </div>

                                            {question.type === "MCQ" && (
                                                <div className="lg:col-span-2">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <label className="block text-sm font-semibold text-gray-700">
                                                            Options
                                                        </label>
                                                        <button
                                                            type="button"
                                                            required={true}
                                                            onClick={() =>
                                                                addOption(index)
                                                            }
                                                            className="text-[#31a131] hover:text-green-700 text-sm font-medium flex items-center
                               gap-1 cursor-pointer"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Add Option
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {question.options.map(
                                                            (
                                                                option,
                                                                optionIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        optionIndex
                                                                    }
                                                                    className="flex gap-3"
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            option
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateOption(
                                                                                index,
                                                                                optionIndex,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500
                                   focus:border-transparent transition-all duration-200"
                                                                        placeholder={`Option ${optionIndex + 1}...`}
                                                                        required
                                                                    />
                                                                    {question
                                                                        .options
                                                                        .length >
                                                                        2 && (
                                                                        <button
                                                                            type="button"
                                                                            required={
                                                                                true
                                                                            }
                                                                            onClick={() =>
                                                                                removeOption(
                                                                                    index,
                                                                                    optionIndex,
                                                                                )
                                                                            }
                                                                            className="text-red-600 hover:text-red-700 p-3 rounded-lg
                                     hover:bg-red-50 transition-all duration-200"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Correct Answer{" "}
                                                            <span className="text-pink-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <select
                                                            value={
                                                                question.correctAnswer
                                                            }
                                                            required={true}
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    index,
                                                                    "correctAnswer",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        >
                                                            <option value="">
                                                                Select correct
                                                                answer...
                                                            </option>
                                                            {question.options.map(
                                                                (
                                                                    option,
                                                                    optionIndex,
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            optionIndex
                                                                        }
                                                                        value={
                                                                            option
                                                                        }
                                                                    >
                                                                        {option ||
                                                                            `Option ${optionIndex + 1}`}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {question.type ===
                                                "True or False" && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Correct Answer{" "}
                                                        <span className="text-pink-600">
                                                            *
                                                        </span>
                                                    </label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${index}`}
                                                                checked={
                                                                    question.correctAnswer ===
                                                                    true
                                                                }
                                                                onChange={() =>
                                                                    updateQuestion(
                                                                        index,
                                                                        "correctAnswer",
                                                                        true,
                                                                    )
                                                                }
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                                True
                                                            </span>
                                                        </label>
                                                        <label className="flex items-center">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${index}`}
                                                                checked={
                                                                    question.correctAnswer ===
                                                                    false
                                                                }
                                                                onChange={() =>
                                                                    updateQuestion(
                                                                        index,
                                                                        "correctAnswer",
                                                                        false,
                                                                    )
                                                                }
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                                False
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {(question.type ===
                                                "Very Short Answer" ||
                                                question.type ===
                                                    "Fill In the Blanks") && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Sample/Expected Answer{" "}
                                                        <span className="text-pink-600">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            question.correctAnswer
                                                        }
                                                        onChange={(e) =>
                                                            updateQuestion(
                                                                index,
                                                                "correctAnswer",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Enter expected answer..."
                                                        required={true}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {quiz.questions.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <Plus className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            No questions yet
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            Start building your quiz by adding
                                            your first question.
                                        </p>
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
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Total Questions:{" "}
                                    <span className="font-semibold">
                                        {quiz.questions.length}
                                    </span>{" "}
                                    | Total Marks:{" "}
                                    <span className="font-semibold">
                                        {quiz.questions.reduce(
                                            (sum, q) => sum + q.marks,
                                            0,
                                        )}
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-[#348c39] hover:bg-[#0b780b] hover:cursor-pointer text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-5 h-5" />
                                    {isEditMode ? "Update Quiz" : "Save Quiz"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
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

export default ChapterQuiz;
