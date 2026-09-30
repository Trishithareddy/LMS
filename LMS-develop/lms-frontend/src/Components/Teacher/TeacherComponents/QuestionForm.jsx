import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Stack,
    Autocomplete,
    Snackbar,
    Alert,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    FormControlLabel,
    Switch,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TuneIcon from "@mui/icons-material/Tune";
import React, { useState, useEffect } from "react";
import axios from "axios";
import SectionQuestions from "./SectionQuestions";
import QuestionPaper from "./QuestionPaper";
import SavedQuestionPapers from "./SavedQuestionPapers";

function QuestionForm({ chapterId }) {
    const [isLoading, setIsLoading] = useState(false);
    const [sectionsQuestions, setSectionsQuestions] = useState([]);
    const [totalMarks, setTotalMarks] = useState("");
    const sourceMode = "hybrid";

    const [paperTitle, setPaperTitle] = useState("");
    const [isSavingPaper, setIsSavingPaper] = useState(false);
    const [activePaperView, setActivePaperView] = useState("generate");
    const [difficultyBlueprint, setDifficultyBlueprint] = useState({});
    const [generationStepIndex, setGenerationStepIndex] = useState(0);
    const [lockedQuestions, setLockedQuestions] = useState({});
    const [chapterWeightage, setChapterWeightage] = useState([]);
    const [useCustomSchoolFormat, setUseCustomSchoolFormat] = useState(false);
    const [templateFile, setTemplateFile] = useState(null);
    const [customFormattedPaper, setCustomFormattedPaper] = useState("");
    const [generationWarnings, setGenerationWarnings] = useState([]);
    const [qualityControls, setQualityControls] = useState({
        languageLevel: "Exam-style",
        aiWording: "avoid",
        repeatControl: "strict",
        textbookMode: "prefer",
        hotsLevel: "Medium",
        strictChapterOnly: true,
    });
    const [questionStyle, setQuestionStyle] = useState("recommended");

    const [paperDetails, setPaperDetails] = useState({
        title: "",
        instruction: "* All questions are compulsory.",
        totalTime: "",
        difficultyLevel: "",
    });

    const [sections, setSections] = useState([
        {
            marksOfEachQuestion: "",
            questionType: "",
            skillType: "Concept Check",
            numberOfQuestions: "",
            difficultyLevel: "",
            useQuestionWiseDifficulty: false,
        },
    ]);

    const [selectedCourse, setSelectedCourse] = useState("");
    const [chapters, setChapters] = useState([]);
    const [selectedChapters, setSelectedChapters] = useState([]);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [currentChapter, setCurrentChapter] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState(false);
    const [allBatchesData, setAllBatchesData] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [availableCourses, setAvailableCourses] = useState([]);
    const SKILL_TYPES = [
        "Concept Check",
        "Application Based",
        "Competency Based",
        "HOTS",
        "Real-life Scenario",
        "Case Study",
        "Reasoning Based",
        "Activity Based",
        "Tool/Software Based",
        "Ethics & Safety Based",
        "Troubleshooting Based",
        "Creative Thinking",
        "Coding Based",
        "Debugging",
        "Output Prediction",
        "Algorithm Thinking",
        "AI Prediction",
        "Data Interpretation",
        "Cyber Safety Scenario",
        "Robotics Logic",
    ];
    const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
    const QUESTION_TYPE_SKILL_GUIDE = {
        MCQ: {
            defaultSkill: "Concept Check",
            recommended: [
                "Concept Check",
                "Application Based",
                "Competency Based",
                "Reasoning Based",
                "Output Prediction",
                "Cyber Safety Scenario",
                "AI Prediction",
            ],
        },
        "Fill In the Blanks": {
            defaultSkill: "Concept Check",
            recommended: [
                "Concept Check",
                "Tool/Software Based",
                "Coding Based",
                "Output Prediction",
            ],
        },
        "True or False": {
            defaultSkill: "Concept Check",
            recommended: [
                "Concept Check",
                "Ethics & Safety Based",
                "Cyber Safety Scenario",
            ],
        },
        "Very Short Answer": {
            defaultSkill: "Concept Check",
            recommended: [
                "Concept Check",
                "Tool/Software Based",
                "Algorithm Thinking",
                "Output Prediction",
                "Coding Based",
            ],
        },
        "Short Answer": {
            defaultSkill: "Application Based",
            recommended: [
                "Application Based",
                "Competency Based",
                "HOTS",
                "Reasoning Based",
                "Troubleshooting Based",
                "Coding Based",
                "Debugging",
                "Activity Based",
            ],
        },
        "Long Answer": {
            defaultSkill: "HOTS",
            recommended: [
                "HOTS",
                "Case Study",
                "Competency Based",
                "Creative Thinking",
                "Data Interpretation",
                "Real-life Scenario",
            ],
        },
    };
    const GENERATION_STEPS = [
        "Reading your paper blueprint",
        "Finding matching chapter questions",
        "Creating remaining questions with AIRA",
        "Preparing the question paper preview",
    ];

    const getDefaultDifficulty = () => paperDetails.difficultyLevel || "Medium";

    const getSectionDifficulty = (section = {}) =>
        section.difficultyLevel || getDefaultDifficulty();

    const getDifficultyRowsForSection = (sectionIndex, count) => {
        const total = Math.max(0, Number(count) || 0);
        const section = sections[sectionIndex] || {};
        const rows = difficultyBlueprint[sectionIndex] || [];

        return Array.from({ length: total }, (_, index) => ({
            questionNumber: index + 1,
            difficultyLevel:
                rows[index]?.difficultyLevel || getSectionDifficulty(section),
        }));
    };

    const buildDifficultyRowsForSection = (sectionIndex, count) => {
        const total = Math.max(0, Number(count) || 0);

        setDifficultyBlueprint((prev) => {
            const oldRows = prev[sectionIndex] || [];
            const section = sections[sectionIndex] || {};

            const newRows = Array.from({ length: total }, (_, index) => ({
                questionNumber: index + 1,
                difficultyLevel:
                    oldRows[index]?.difficultyLevel ||
                    getSectionDifficulty(section),
            }));

            return {
                ...prev,
                [sectionIndex]: newRows,
            };
        });
    };

    const updateQuestionDifficulty = (sectionIndex, questionIndex, value) => {
        setDifficultyBlueprint((prev) => {
            const section = sections[sectionIndex] || {};
            const existingRows =
                prev[sectionIndex] ||
                getDifficultyRowsForSection(
                    sectionIndex,
                    section.numberOfQuestions,
                );

            return {
                ...prev,
                [sectionIndex]: existingRows.map((row, index) =>
                    index === questionIndex
                        ? {
                            ...row,
                            difficultyLevel: value,
                        }
                        : row,
                ),
            };
        });

        setSectionsQuestions([]);
        setPreviewQuestions(false);
    };

    const getQuestionDifficulty = (sectionIndex, questionIndex) => {
        const section = sections[sectionIndex] || {};
        const rows = getDifficultyRowsForSection(
            sectionIndex,
            section.numberOfQuestions,
        );

        return (
            rows[questionIndex]?.difficultyLevel ||
            getSectionDifficulty(section)
        );
    };

    const buildDifficultyBlueprintPayload = () => {
        const payload = {};

        sections.forEach((section, sectionIndex) => {
            if (section.useQuestionWiseDifficulty) {
                payload[sectionIndex] = getDifficultyRowsForSection(
                    sectionIndex,
                    section.numberOfQuestions,
                );
            }
        });

        return payload;
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const handleSnackbarOpen = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    const fetchAllBatchesData = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/AllBatches`,
                {
                    headers: getAuthHeaders(),
                },
            );

            setAllBatchesData(response.data?.teacher?.batches || []);
        } catch (error) {
            console.error("Error fetching batches:", error);
            handleSnackbarOpen("Error fetching data", "error");
        }
    };

    useEffect(() => {
        fetchAllBatchesData();
    }, []);

    useEffect(() => {
        if (!isLoading) return undefined;

        const intervalId = window.setInterval(() => {
            setGenerationStepIndex((current) =>
                current < GENERATION_STEPS.length - 1 ? current + 1 : current,
            );
        }, 3500);

        return () => window.clearInterval(intervalId);
    }, [isLoading]);

    useEffect(() => {
        setChapterWeightage((prev) =>
            selectedChapters.map((chapter) => {
                const chapterId = chapter.qbChapterId || chapter._id;
                const existing = prev.find(
                    (item) =>
                        item.chapterId === chapterId ||
                        item.courseChapterId === chapter._id,
                );

                return {
                    chapterId,
                    courseChapterId: chapter._id,
                    chapterName: chapter.name || "Selected chapter",
                    sectionMarks: sections.reduce(
                        (acc, section, sectionIndex) => ({
                            ...acc,
                            [sectionIndex]:
                                existing?.sectionMarks?.[sectionIndex] || "",
                        }),
                        {},
                    ),
                };
            }),
        );
    }, [selectedChapters, sections.length]);

    const handleBatchChange = (batch) => {
        setSelectedBatch(batch);

        if (batch) {
            setAvailableCourses(batch.courses || []);
        } else {
            setAvailableCourses([]);
        }

        setSelectedCourse("");
        setChapters([]);
        setSelectedChapters([]);
        setSectionsQuestions([]);
        setPreviewQuestions(false);
    };

    useEffect(() => {
        const fetchChapter = async () => {
            if (!chapterId) return;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                    {
                        headers: getAuthHeaders(),
                    },
                );

                setCurrentChapter({
                    _id: response.data._id,
                    name: response.data.name,
                    courseId: response.data.course._id,
                    qbChapterId: response.data.qbChapterId,
                });
            } catch (error) {
                console.error("Error fetching Chapter:", error);
            }
        };

        fetchChapter();
    }, [chapterId]);

    useEffect(() => {
        const fetchCourses = async () => {
            if (!currentChapter) return;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/courses/getAllCourses`,
                    {
                        headers: getAuthHeaders(),
                    },
                );

                const allCourses = Array.isArray(response.data)
                    ? response.data
                    : response.data?.courses || response.data?.data || [];

                const courseOfCurrentChapter = allCourses.find(
                    (course) => course._id === currentChapter.courseId,
                );

                if (courseOfCurrentChapter) {
                    setSelectedCourse(courseOfCurrentChapter);

                    setChapters(
                        (courseOfCurrentChapter.chapters || []).map(
                            (chapter) => ({
                                _id: chapter._id,
                                name: chapter.name,
                                courseId:
                                    chapter.course?._id ||
                                    courseOfCurrentChapter._id,
                                qbChapterId: chapter.qbChapterId,
                            }),
                        ),
                    );

                    setSelectedChapters([currentChapter]);
                }
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };

        fetchCourses();
    }, [currentChapter]);

    const handleOnChangeChapter = (event, newValue) => {
        setSelectedChapters(newValue);
        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);
        setCustomFormattedPaper("");
        setGenerationWarnings([]);
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;

        setSelectedCourse(course);
        setChapters(course?.chapters || []);
        setSelectedChapters([]);
        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);
        setCustomFormattedPaper("");
        setGenerationWarnings([]);
    };

    const handleChapterSectionWeightageChange = (
        chapterId,
        sectionIndex,
        value,
    ) => {
        setChapterWeightage((prev) =>
            prev.map((item) =>
                item.chapterId === chapterId
                    ? {
                        ...item,
                        sectionMarks: {
                            ...(item.sectionMarks || {}),
                            [sectionIndex]: value,
                        },
                    }
                    : item,
            ),
        );
        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);
        setCustomFormattedPaper("");
    };

    const getActiveChapterWeightage = () =>
        chapterWeightage
            .map((item) => ({
                ...item,
                sections: sections
                    .map((section, sectionIndex) => ({
                        sectionIndex,
                        questionType: section.questionType,
                        marksOfEachQuestion: Number(
                            section.marksOfEachQuestion || 0,
                        ),
                        marks: Number(
                            item.sectionMarks?.[sectionIndex] || 0,
                        ),
                    }))
                    .filter((section) => section.marks > 0),
                marks: Object.values(item.sectionMarks || {}).reduce(
                    (sum, value) => sum + Number(value || 0),
                    0,
                ),
            }))
            .filter((item) => item.chapterId && item.marks > 0);

    const getChapterWeightageTotal = () =>
        getActiveChapterWeightage().reduce(
            (sum, item) => sum + Number(item.marks || 0),
            0,
        );

    const getSectionWeightageTotal = (sectionIndex) =>
        chapterWeightage.reduce(
            (sum, item) =>
                sum + Number(item.sectionMarks?.[sectionIndex] || 0),
            0,
        );

    const getSectionTotalMarks = (section = {}) =>
        Number(section.numberOfQuestions || 0) *
        Number(section.marksOfEachQuestion || 0);

    const handleTemplateFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const lowerName = file.name.toLowerCase();
        const isValid =
            file.type === "application/pdf" ||
            file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            lowerName.endsWith(".pdf") ||
            lowerName.endsWith(".docx");

        if (!isValid) {
            handleSnackbarOpen("Please upload only PDF or DOCX format.", "error");
            return;
        }

        setTemplateFile(file);
        setCustomFormattedPaper("");
    };

    const handleQuestionStyleChange = (value) => {
        const presets = {
            recommended: {
                languageLevel: "Exam-style",
                aiWording: "avoid",
                repeatControl: "strict",
                textbookMode: "prefer",
                hotsLevel: "Medium",
                strictChapterOnly: true,
            },
            simple: {
                languageLevel: "Simple",
                aiWording: "avoid",
                repeatControl: "strict",
                textbookMode: "prefer",
                hotsLevel: "Low",
                strictChapterOnly: true,
            },
            higher_order: {
                languageLevel: "Standard",
                aiWording: "avoid",
                repeatControl: "strict",
                textbookMode: "balanced",
                hotsLevel: "High",
                strictChapterOnly: true,
            },
        };

        setQuestionStyle(value);
        setQualityControls(presets[value] || presets.recommended);
        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);
        setCustomFormattedPaper("");
    };

    const handleBasicDetailsChange = (e) => {
        const { name, value } = e.target;

        setPaperDetails((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "title") {
            setPaperTitle(value);
        }
    };

    const getTeacherFacingGenerationWarnings = (warnings = []) => {
        return warnings.filter((warning) => warning?.visibility !== "internal");
    };

    const showGenerationWarnings = (warnings = []) => {
        const teacherWarnings = getTeacherFacingGenerationWarnings(warnings);

        if (!teacherWarnings.length) return;

        const message = teacherWarnings
            .map((warning) => warning.message)
            .filter(Boolean)
            .slice(0, 3)
            .join(" ");

        if (message) {
            handleSnackbarOpen(message, "warning");
        }
    };

    const recalculateTotalMarks = (updatedSections) => {
        return updatedSections.reduce(
            (acc, sec) =>
                acc +
                (parseInt(sec.marksOfEachQuestion) || 0) *
                (parseInt(sec.numberOfQuestions) || 0),
            0,
        );
    };

    const handleSectionChange = (index, e) => {
        const { name, value } = e.target;

        setSections((prevSections) => {
            const updatedSections = prevSections.map((section, i) => {
                if (i !== index) return section;

                if (name === "questionType") {
                    const guide = QUESTION_TYPE_SKILL_GUIDE[value];
                    const recommendedSkills = guide?.recommended || [];
                    const currentSkill = section.skillType || "Concept Check";

                    return {
                        ...section,
                        questionType: value,
                        skillType: recommendedSkills.includes(currentSkill)
                            ? currentSkill
                            : guide?.defaultSkill || currentSkill,
                    };
                }

                return { ...section, [name]: value };
            });

            setTotalMarks(recalculateTotalMarks(updatedSections));
            return updatedSections;
        });

        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);

        if (name === "numberOfQuestions") {
            buildDifficultyRowsForSection(index, value);
        }
    };

    const addSection = () => {
        setSections((prev) => [
            ...prev,
            {
                marksOfEachQuestion: "",
                questionType: "",
                skillType: "Concept Check",
                numberOfQuestions: "",
                difficultyLevel: "",
                useQuestionWiseDifficulty: false,
            },
        ]);

        setPreviewQuestions(false);
    };

    const removeSection = (index) => {
        setSections((prev) => {
            const updatedSections = prev.filter((_, i) => i !== index);
            setTotalMarks(recalculateTotalMarks(updatedSections));
            return updatedSections;
        });

        setDifficultyBlueprint((prev) => {
            const updatedBlueprint = {};

            Object.keys(prev).forEach((key) => {
                const oldIndex = Number(key);

                if (oldIndex < index) {
                    updatedBlueprint[oldIndex] = prev[oldIndex];
                } else if (oldIndex > index) {
                    updatedBlueprint[oldIndex - 1] = prev[oldIndex];
                }
            });

            return updatedBlueprint;
        });
        setChapterWeightage((prev) =>
            prev.map((item) => {
                const nextSectionMarks = {};

                Object.entries(item.sectionMarks || {}).forEach(
                    ([key, value]) => {
                        const oldIndex = Number(key);

                        if (oldIndex < index) {
                            nextSectionMarks[oldIndex] = value;
                        } else if (oldIndex > index) {
                            nextSectionMarks[oldIndex - 1] = value;
                        }
                    },
                );

                return {
                    ...item,
                    sectionMarks: nextSectionMarks,
                };
            }),
        );

        setSectionsQuestions((prev) => prev.filter((_, i) => i !== index));
        setLockedQuestions((prev) => {
            const nextLocks = {};

            Object.entries(prev).forEach(([key, value]) => {
                const [sectionIndex, questionIndex] = key
                    .split("-")
                    .map(Number);

                if (sectionIndex < index) {
                    nextLocks[key] = value;
                } else if (sectionIndex > index) {
                    nextLocks[`${sectionIndex - 1}-${questionIndex}`] = value;
                }
            });

            return nextLocks;
        });
        setPreviewQuestions(false);
    };

    const toggleQuestionWiseDifficulty = (sectionIndex, enabled) => {
        setSections((prevSections) =>
            prevSections.map((section, index) =>
                index === sectionIndex
                    ? {
                        ...section,
                        useQuestionWiseDifficulty: enabled,
                    }
                    : section,
            ),
        );

        if (enabled) {
            buildDifficultyRowsForSection(
                sectionIndex,
                sections[sectionIndex]?.numberOfQuestions,
            );
        } else {
            setDifficultyBlueprint((prev) => {
                const next = { ...prev };
                delete next[sectionIndex];
                return next;
            });
        }

        setSectionsQuestions([]);
        setLockedQuestions({});
        setPreviewQuestions(false);
    };

    const getChapterInfo = () => {
        return selectedChapters.map((chapter) => ({
            qbChapterId: chapter.qbChapterId,
            id: chapter._id,
        }));
    };

    const getSkillGuideForSection = (section = {}) => {
        const guide = QUESTION_TYPE_SKILL_GUIDE[section.questionType];
        const recommended = guide?.recommended || [];
        const otherSkills = SKILL_TYPES.filter(
            (skill) => !recommended.includes(skill),
        );

        return {
            recommended,
            otherSkills,
            isRecommended:
                !section.skillType || recommended.includes(section.skillType),
        };
    };

    const validateFormBeforeGeneration = () => {
        for (let section of sections) {
            if (
                section.questionType === "" ||
                section.skillType === "" ||
                section.numberOfQuestions === "" ||
                section.marksOfEachQuestion === ""
            ) {
                handleSnackbarOpen(
                    "Please add all fields of section or remove the section.",
                    "error",
                );
                return false;
            }
        }

        if (
            paperDetails.title === "" ||
            paperDetails.instruction === "" ||
            paperDetails.difficultyLevel === "" ||
            paperDetails.totalTime === "" ||
            selectedChapters.length === 0 ||
            !selectedCourse
        ) {
            handleSnackbarOpen(
                "Please add all fields present above sections.",
                "error",
            );
            return false;
        }

        if (getActiveChapterWeightage().length > 0) {
            const weightageTotal = getChapterWeightageTotal();
            const paperTotal = Number(totalMarks || 0);

            if (paperTotal > 0 && weightageTotal !== paperTotal) {
                handleSnackbarOpen(
                    `Chapter weightage total should match total marks (${paperTotal}). Current weightage is ${weightageTotal}.`,
                    "error",
                );
                return false;
            }

            for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                const section = sections[sectionIndex];
                const sectionTotal = getSectionTotalMarks(section);
                const plannedTotal = getSectionWeightageTotal(sectionIndex);

                if (sectionTotal > 0 && plannedTotal !== sectionTotal) {
                    handleSnackbarOpen(
                        `Section ${sectionIndex + 1} weightage should be ${sectionTotal} marks. Current planned marks are ${plannedTotal}.`,
                        "error",
                    );
                    return false;
                }

                const marksOfEachQuestion = Number(
                    section.marksOfEachQuestion || 0,
                );

                if (marksOfEachQuestion > 0) {
                    const invalidChapter = chapterWeightage.find((item) => {
                        const plannedMarks = Number(
                            item.sectionMarks?.[sectionIndex] || 0,
                        );

                        return plannedMarks > 0 && plannedMarks % marksOfEachQuestion !== 0;
                    });

                    if (invalidChapter) {
                        handleSnackbarOpen(
                            `${invalidChapter.chapterName} marks in Section ${sectionIndex + 1} must be divisible by ${marksOfEachQuestion}.`,
                            "error",
                        );
                        return false;
                    }
                }
            }
        }

        if (useCustomSchoolFormat && !templateFile) {
            handleSnackbarOpen(
                "Please upload the school question paper format.",
                "error",
            );
            return false;
        }

        return true;
    };

    const normalizeQuestionText = (text = "") => {
        return String(text)
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    };

    const removeDuplicateQuestions = (questions = []) => {
        const seen = new Set();
        const finalQuestions = [];

        questions.forEach((question) => {
            const normalized = normalizeQuestionText(question.question);

            if (!normalized) return;

            if (!seen.has(normalized)) {
                seen.add(normalized);
                finalQuestions.push(question);
            }
        });

        return finalQuestions;
    };

    const getBlueprintSummary = () => {
        const summary = {
            totalQuestions: 0,
            difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
            questionTypes: {},
            skillTypes: {},
        };

        sections.forEach((section, sectionIndex) => {
            const count = Number(section.numberOfQuestions || 0);

            summary.totalQuestions += count;

            if (section.questionType) {
                summary.questionTypes[section.questionType] =
                    (summary.questionTypes[section.questionType] || 0) + count;
            }

            if (section.skillType) {
                summary.skillTypes[section.skillType] =
                    (summary.skillTypes[section.skillType] || 0) + count;
            }

            const rows = section.useQuestionWiseDifficulty
                ? getDifficultyRowsForSection(sectionIndex, count)
                : Array.from({ length: count }, (_, questionIndex) => ({
                    questionNumber: questionIndex + 1,
                    difficultyLevel: getSectionDifficulty(section),
                }));

            rows.forEach((row) => {
                const difficulty =
                    row.difficultyLevel || getSectionDifficulty(section);

                if (summary.difficultyCounts[difficulty] !== undefined) {
                    summary.difficultyCounts[difficulty] += 1;
                }
            });
        });

        return summary;
    };

    const formatSummaryEntries = (entries = {}) => {
        return Object.entries(entries)
            .filter(([, count]) => count > 0)
            .map(([label, count]) => `${label}: ${count}`)
            .join(" | ");
    };

    const getQuestionLockKey = (sectionIndex, questionIndex) =>
        `${sectionIndex}-${questionIndex}`;

    const toggleQuestionLock = (sectionIndex, questionIndex) => {
        const key = getQuestionLockKey(sectionIndex, questionIndex);

        setLockedQuestions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const generateCustomFormattedPaper = async (generatedQuestions) => {
        if (!useCustomSchoolFormat || !templateFile) return "";

        const formData = new FormData();
        const chapterInfo = getChapterInfo().map((chapter, index) => ({
            ...chapter,
            courseChapterId: selectedChapters[index]?._id,
        }));

        formData.append("templateFile", templateFile);
        formData.append("questions", JSON.stringify(generatedQuestions));
        formData.append(
            "chapters",
            JSON.stringify(
                selectedChapters.map((chapter) => ({
                    id: chapter._id,
                    qbChapterId: chapter.qbChapterId,
                    name: chapter.name,
                })),
            ),
        );
        formData.append(
            "meta",
            JSON.stringify({
                title: paperDetails.title,
                courseName: selectedCourse?.name || "",
                chapterNames: selectedChapters.map((chapter) => chapter.name),
                totalMarks,
                totalTime: paperDetails.totalTime,
                instruction: paperDetails.instruction,
                sourceMode,
                chapterWeightage: getActiveChapterWeightage(),
                qualityControls,
                sectionMarks: sections.map((section) =>
                    Number(section.marksOfEachQuestion || 1),
                ),
                chapterInfo,
            }),
        );

        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/questionBase/generate/custom-format/question-paper`,
            formData,
            {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            },
        );

        return response.data?.formattedPaper || "";
    };

    const removeGeneratedQuestion = (sectionIndex, questionIndex) => {
        const key = getQuestionLockKey(sectionIndex, questionIndex);

        if (lockedQuestions[key]) return;

        setSectionsQuestions((prev) =>
            prev.map((sectionQuestions, index) =>
                index === sectionIndex
                    ? sectionQuestions.filter((_, idx) => idx !== questionIndex)
                    : sectionQuestions,
            ),
        );

        setLockedQuestions((prev) => {
            const nextLocks = {};

            Object.entries(prev).forEach(([lockKey, value]) => {
                const [lockSectionIndex, lockQuestionIndex] = lockKey
                    .split("-")
                    .map(Number);

                if (lockSectionIndex !== sectionIndex) {
                    nextLocks[lockKey] = value;
                    return;
                }

                if (lockQuestionIndex < questionIndex) {
                    nextLocks[lockKey] = value;
                } else if (lockQuestionIndex > questionIndex) {
                    nextLocks[`${sectionIndex}-${lockQuestionIndex - 1}`] =
                        value;
                }
            });

            return nextLocks;
        });
    };

    const updateGeneratedQuestion = (
        sectionIndex,
        questionIndex,
        field,
        value,
    ) => {
        setSectionsQuestions((prev) =>
            prev.map((sectionQuestions, currentSectionIndex) =>
                currentSectionIndex === sectionIndex
                    ? sectionQuestions.map((question, currentQuestionIndex) =>
                        currentQuestionIndex === questionIndex
                            ? {
                                ...question,
                                [field]: value,
                                ...(field === "questionStem"
                                    ? { question: value }
                                    : {}),
                                ...(field === "answer"
                                    ? {
                                        correctAnswer: value,
                                        answerKey: value,
                                    }
                                    : {}),
                            }
                            : question,
                    )
                    : sectionQuestions,
            ),
        );
        setCustomFormattedPaper("");
    };

    const updateGeneratedQuestionOption = (
        sectionIndex,
        questionIndex,
        optionIndex,
        value,
    ) => {
        setSectionsQuestions((prev) =>
            prev.map((sectionQuestions, currentSectionIndex) =>
                currentSectionIndex === sectionIndex
                    ? sectionQuestions.map((question, currentQuestionIndex) => {
                        if (currentQuestionIndex !== questionIndex) {
                            return question;
                        }

                        const options = Array.isArray(question.options)
                            ? question.options
                            : [];

                        return {
                            ...question,
                            options: options.map((option, currentOptionIndex) =>
                                currentOptionIndex === optionIndex
                                    ? typeof option === "string"
                                        ? value
                                        : { ...option, option: value }
                                    : option,
                            ),
                        };
                    })
                    : sectionQuestions,
            ),
        );
        setCustomFormattedPaper("");
    };

    const generateQuestionPaper = async () => {
        if (!validateFormBeforeGeneration()) return;

        const chapterInfo = getChapterInfo();

        setIsLoading(true);
        setGenerationStepIndex(0);

        try {
            const payload = {
                sections,
                chapters: chapterInfo,
                difficultyLevel: paperDetails.difficultyLevel || "Medium",
                difficultyBlueprint: buildDifficultyBlueprintPayload(),
                sourceMode,
                chapterWeightage: getActiveChapterWeightage(),
                qualityControls,
                grade:
                    selectedCourse?.grade ||
                    selectedCourse?.className ||
                    selectedCourse?.name ||
                    "",
                excludeQuestionIdsBySection: Object.fromEntries(
                    (sectionsQuestions || []).map((sectionQuestions, index) => [
                        index,
                        (sectionQuestions || [])
                            .map((question) => question?._id)
                            .filter(Boolean),
                    ]),
                ),
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/questionBase/generate/smart/questions`,
                payload,
                {
                    headers: getAuthHeaders(),
                    withCredentials: true,
                },
            );

            const generated = response.data.questions || [];
            const totalGenerated = generated.reduce(
                (sum, section) =>
                    sum + (Array.isArray(section) ? section.length : 0),
                0,
            );

            if (totalGenerated === 0) {
                handleSnackbarOpen(
                    response.data.message ||
                    "No questions were generated. Try AIRA Only, reduce question count, or select fewer chapters.",
                    "warning",
                );
                setSectionsQuestions(generated);
                setPreviewQuestions(false);
                return;
            }

            setSectionsQuestions(generated);
            setLockedQuestions({});
            setPreviewQuestions(true);
            setGenerationWarnings(response.data.warnings || []);

            if (!paperTitle) {
                setPaperTitle(paperDetails.title);
            }

            if (useCustomSchoolFormat) {
                try {
                    const formattedPaper =
                        await generateCustomFormattedPaper(generated);
                    setCustomFormattedPaper(formattedPaper);
                } catch (formatError) {
                    console.error(
                        "Error generating custom school format:",
                        formatError,
                    );
                    setCustomFormattedPaper("");
                    handleSnackbarOpen(
                        formatError.response?.data?.error ||
                        "Questions were generated, but custom school format failed.",
                        "warning",
                    );
                }
            } else {
                setCustomFormattedPaper("");
            }

            await saveGeneratedPaperToLms(generated, { silent: true });

            const teacherWarnings = getTeacherFacingGenerationWarnings(
                response.data.warnings || [],
            );

            if (teacherWarnings.length) {
                showGenerationWarnings(teacherWarnings);
            } else {
                handleSnackbarOpen(
                    generated.some((section) => section?.length > 0)
                        ? "Questions generated successfully!"
                        : "No questions generated. Try AIRA mode or reduce strict skill filters.",
                    generated.some((section) => section?.length > 0)
                        ? "success"
                        : "warning",
                );
            }

            setTimeout(() => {
                const previewElement = document.getElementById(
                    "question-paper-preview-section",
                );

                if (previewElement) {
                    previewElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 200);
        } catch (error) {
            console.error("Error Generating Questions:", error);

            handleSnackbarOpen(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Error occurred while generating questions.",
                "error",
            );
        } finally {
            setIsLoading(false);
            setGenerationStepIndex(0);
        }
    };

    const handleRegenerateSectionQuestions = async (section, index) => {
        try {
            const chapterInfo = getChapterInfo();
            const sectionDifficultyRows = getDifficultyRowsForSection(
                index,
                section.numberOfQuestions,
            );

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL
                }/questionBase/generate/smart/questions`,
                {
                    sections: [section],
                    chapters: chapterInfo,
                    difficultyLevel: paperDetails.difficultyLevel || "Medium",
                    difficultyBlueprint: {
                        0: sectionDifficultyRows,
                    },
                    sourceMode,
                    chapterWeightage: getActiveChapterWeightage(),
                    qualityControls,
                    excludeQuestionIdsBySection: {
                        0: (sectionsQuestions[index] || [])
                            .map((question) => question?._id)
                            .filter(Boolean),
                    },
                },
                {
                    headers: getAuthHeaders(),
                    withCredentials: true,
                },
            );

            if (!response.data.questions?.length) {
                handleSnackbarOpen(
                    "No new questions available for this section.",
                    "error",
                );
                return;
            }

            showGenerationWarnings(response.data.warnings || []);

            const lockedSectionQuestions = (sectionsQuestions[index] || [])
                .map((question, questionIndex) =>
                    lockedQuestions[getQuestionLockKey(index, questionIndex)]
                        ? question
                        : null,
                )
                .filter(Boolean);

            const replacementQuestions = response.data.questions[0] || [];
            const newSectionsQuestions = sectionsQuestions.map(
                (sectionQuestions, sectionIndex) =>
                    sectionIndex === index
                        ? [
                            ...lockedSectionQuestions,
                            ...replacementQuestions.filter(
                                (question) =>
                                    !lockedSectionQuestions.some(
                                        (lockedQuestion) =>
                                            normalizeQuestionText(
                                                lockedQuestion.question ||
                                                lockedQuestion.questionStem,
                                            ) ===
                                            normalizeQuestionText(
                                                question.question ||
                                                question.questionStem,
                                            ),
                                    ),
                            ),
                        ].slice(0, Number(section.numberOfQuestions || 0))
                        : sectionQuestions,
            );

            setSectionsQuestions(newSectionsQuestions);
            setCustomFormattedPaper("");
            setLockedQuestions((prev) => {
                const nextLocks = {};

                lockedSectionQuestions.forEach((_, questionIndex) => {
                    nextLocks[getQuestionLockKey(index, questionIndex)] = true;
                });

                Object.entries(prev).forEach(([key, value]) => {
                    const [sectionIndex] = key.split("-").map(Number);

                    if (sectionIndex !== index) {
                        nextLocks[key] = value;
                    }
                });

                return nextLocks;
            });
        } catch (error) {
            console.error("Error in regenerating questions:", error);
            handleSnackbarOpen(
                "Error occurred while fetching questions.",
                "error",
            );
        }
    };

    const regenerateQuestion = async (
        questionType,
        chapter,
        sectionIndex,
        questionIndex,
    ) => {
        if (lockedQuestions[getQuestionLockKey(sectionIndex, questionIndex)]) {
            handleSnackbarOpen(
                "Unlock this question before regenerating it.",
                "info",
            );
            return;
        }

        const currentQuestion =
            sectionsQuestions[sectionIndex]?.[questionIndex];

        if (
            currentQuestion?.isAiraGenerated ||
            currentQuestion?.sourceMode === "aira"
        ) {
            try {
                const chapterInfo = getChapterInfo();

                const questionDifficulty = getQuestionDifficulty(
                    sectionIndex,
                    questionIndex,
                );

                const sectionForOneQuestion = {
                    ...sections[sectionIndex],
                    questionType,
                    skillType:
                        sections[sectionIndex]?.skillType || "Concept Check",
                    numberOfQuestions: 1,
                    difficultyLevel: questionDifficulty,
                };

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/questionBase/generate/smart/questions`,
                    {
                        sections: [sectionForOneQuestion],
                        chapters: chapterInfo,
                        difficultyLevel: questionDifficulty || "Medium",
                        difficultyBlueprint: {
                            0: [
                                {
                                    questionNumber: 1,
                                    difficultyLevel:
                                        questionDifficulty || "Medium",
                                },
                            ],
                        },
                        sourceMode: "question_bank",
                        qualityControls,
                        excludeQuestionIdsBySection: {
                            0: (sectionsQuestions[sectionIndex] || [])
                                .map((question) => question?._id)
                                .filter(Boolean),
                        },
                        grade:
                            selectedCourse?.grade ||
                            selectedCourse?.className ||
                            selectedCourse?.name ||
                            "",
                    },
                    {
                        headers: getAuthHeaders(),
                        withCredentials: true,
                    },
                );

                const newQuestion = response.data.questions?.[0]?.[0];

                if (!newQuestion) {
                    handleSnackbarOpen(
                        "AIRA could not regenerate this question.",
                        "error",
                    );
                    return;
                }

                const newSectionsQuestions = sectionsQuestions.map(
                    (sectionQuestions, idx) => {
                        if (idx !== sectionIndex) return sectionQuestions;

                        return sectionQuestions.map((question, qIdx) =>
                            qIdx === questionIndex ? newQuestion : question,
                        );
                    },
                );

                setSectionsQuestions(newSectionsQuestions);
                showGenerationWarnings(response.data.warnings || []);
                setCustomFormattedPaper("");
                return;
            } catch (error) {
                console.error("Error regenerating AIRA question:", error);
                handleSnackbarOpen(
                    "Error occurred while regenerating AIRA question.",
                    "error",
                );
                return;
            }
        }

        const sectionQuestionsOfThisSection =
            sectionsQuestions[sectionIndex] || [];

        const sectionQuestionsOfThisSectionIds =
            sectionQuestionsOfThisSection.map((every) => every._id);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL
                }/questionBase/generate/random/questionOfASection`,
                {
                    params: {
                        questionType,
                        chapter,
                        course: selectedCourse._id,
                        difficultyLevel: getQuestionDifficulty(
                            sectionIndex,
                            questionIndex,
                        ),
                        skillType:
                            sections[sectionIndex]?.skillType ||
                            "Concept Check",
                        sectionQuestionsIds:
                            sectionQuestionsOfThisSectionIds.join(","),
                    },
                    headers: getAuthHeaders(),
                },
            );

            const replacementQuestion = response.data.question?.[0];

            if (!replacementQuestion) {
                handleSnackbarOpen(
                    "There are only this number of questions in this section, can't regenerate new question.",
                    "error",
                );
                return;
            }

            const newSectionsQuestions = sectionsQuestions.map(
                (sectionQuestions, idx) => {
                    if (idx !== sectionIndex) return sectionQuestions;

                    return sectionQuestions.map((question, qIdx) =>
                        qIdx === questionIndex ? replacementQuestion : question,
                    );
                },
            );

            setSectionsQuestions(newSectionsQuestions);
            setCustomFormattedPaper("");
        } catch (error) {
            console.error("Error regenerating section question:", error);
            handleSnackbarOpen(
                "Error occurred while regenerating section question.",
                "error",
            );
        }
    };

    const flattenGeneratedQuestionsForSave = (
        questionSections = sectionsQuestions,
    ) => {
        const flatQuestions = [];
        const normalizedSections = Array.isArray(questionSections)
            ? questionSections
            : Array.isArray(questionSections?.questions)
                ? questionSections.questions
                : [];

        normalizedSections.forEach((sectionQuestions, sectionIndex) => {
            const section = sections[sectionIndex] || {};
            const sectionTitle = `Section ${String.fromCharCode(65 + sectionIndex)}`;

            (sectionQuestions || []).forEach((question, questionIndex) => {
                const answerValue =
                    question.answer ??
                    question.correctAnswer ??
                    question.answerKey ??
                    "";

                const correctAnswerValue =
                    question.correctAnswer ??
                    question.answer ??
                    question.answerKey ??
                    "";

                flatQuestions.push({
                    questionNumber: flatQuestions.length + 1,
                    sectionNumber: sectionIndex + 1,
                    sectionTitle,
                    sectionQuestionNumber: questionIndex + 1,
                    questionType:
                        question.questionType ||
                        question.type ||
                        section.questionType ||
                        "",
                    difficulty:
                        question.difficulty ||
                        question.difficultyLevel ||
                        getQuestionDifficulty(sectionIndex, questionIndex) ||
                        paperDetails.difficultyLevel ||
                        "",
                    skillType:
                        question.skillType ||
                        question.questionSkill ||
                        section.skillType ||
                        "Concept Check",
                    marks:
                        Number(
                            question.marks ||
                            question.marksOfEachQuestion ||
                            section.marksOfEachQuestion ||
                            1,
                        ) || 1,
                    question:
                        question.question ||
                        question.questionStem ||
                        question.title ||
                        "",
                    questionStem:
                        question.questionStem ||
                        question.question ||
                        question.title ||
                        "",
                    options: Array.isArray(question.options)
                        ? question.options
                        : [],
                    answer: answerValue,
                    correctAnswer: correctAnswerValue,
                    explanation:
                        question.explanation || question.solution || "",
                    source:
                        question.source ||
                        question.sourceMode ||
                        (question.isAiraGenerated ? "aira" : "question_bank"),
                    sourceReference:
                        question.sourceReference ||
                        question.reference ||
                        question.pageReference ||
                        "",
                    rawQuestion: question,
                });
            });
        });

        return flatQuestions;
    };

    const buildBlueprintForSave = () => {
        const blueprint = [];

        sections.forEach((section, sectionIndex) => {
            const count = Number(section.numberOfQuestions || 0);
            const difficultyRows = getDifficultyRowsForSection(
                sectionIndex,
                count,
            );
            const sectionTitle = `Section ${String.fromCharCode(65 + sectionIndex)}`;

            for (let i = 0; i < count; i++) {
                blueprint.push({
                    questionNumber: blueprint.length + 1,
                    sectionNumber: sectionIndex + 1,
                    sectionTitle,
                    sectionQuestionNumber: i + 1,
                    questionType: section.questionType,
                    difficulty:
                        difficultyRows[i]?.difficultyLevel ||
                        getDefaultDifficulty(),
                    skillType: section.skillType || "Concept Check",
                    marks: Number(section.marksOfEachQuestion || 1),
                });
            }
        });

        return blueprint;
    };

    const saveGeneratedPaperToLms = async (
        questionSections = sectionsQuestions,
        { silent = false } = {},
    ) => {
        try {
            const normalizedSections = Array.isArray(questionSections)
                ? questionSections
                : Array.isArray(questionSections?.questions)
                    ? questionSections.questions
                    : sectionsQuestions;
            const questionsToSave =
                flattenGeneratedQuestionsForSave(normalizedSections);

            if (!questionsToSave.length) {
                if (!silent) {
                    handleSnackbarOpen(
                        "No generated questions found to save.",
                        "error",
                    );
                }
                return;
            }

            const finalTitle =
                paperTitle || paperDetails.title || "Saved Question Paper";

            if (!finalTitle.trim()) {
                if (!silent) {
                    handleSnackbarOpen("Please enter paper title.", "error");
                }
                return;
            }

            setIsSavingPaper(true);

            const payload = {
                title: finalTitle,
                description: paperDetails.instruction || "",
                courseId: selectedCourse?._id || null,
                courseName: selectedCourse?.name || "",
                chapterIds: selectedChapters.map(
                    (chapter) => chapter._id || chapter,
                ),
                chapterNames: selectedChapters
                    .map((chapter) => chapter.name)
                    .filter(Boolean),
                sourceMode: sourceMode || "hybrid",
                blueprint: buildBlueprintForSave(),
                questions: questionsToSave,
                totalMarks:
                    Number(totalMarks) ||
                    questionsToSave.reduce(
                        (sum, question) => sum + Number(question.marks || 0),
                        0,
                    ),
                status: "draft",
                generationMeta: {
                    savedFrom: "question-paper-generator",
                    autoSaved: silent,
                    difficultyLevel: paperDetails.difficultyLevel,
                    chapterWeightage: getActiveChapterWeightage(),
                    customSchoolFormat: useCustomSchoolFormat
                        ? {
                            enabled: true,
                            templateName: templateFile?.name || "",
                            formattedPaper: customFormattedPaper,
                        }
                        : { enabled: false },
                    generationWarnings,
                    qualityControls,
                    questionWiseDifficultyBlueprint:
                        buildDifficultyBlueprintPayload(),
                    totalTime: paperDetails.totalTime,
                    instruction: paperDetails.instruction,
                    sectionCount: sections.length,
                    createdAt: new Date().toISOString(),
                },
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/question-papers/save`,
                payload,
                {
                    headers: getAuthHeaders(),
                },
            );

            if (response.data?.success && !silent) {
                handleSnackbarOpen(
                    "Question paper saved to LMS successfully!",
                    "success",
                );
            }
        } catch (error) {
            console.error("Error saving paper:", error);

            if (!silent) {
                handleSnackbarOpen(
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to save question paper",
                    "error",
                );
            }
        } finally {
            setIsSavingPaper(false);
        }
    };

    const downloadCustomFormattedPaper = () => {
        if (!customFormattedPaper) return;

        const blob = new Blob([customFormattedPaper], {
            type: "application/msword;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeTitle = String(paperDetails.title || "question-paper")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        link.href = url;
        link.download = `${safeTitle}_school_format.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const hasGeneratedQuestions = sectionsQuestions.some(
        (section) => section && section.length > 0,
    );
    const blueprintSummary = getBlueprintSummary();

    return (
        <Box sx={{ mt: 2 }}>
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

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                    variant={
                        activePaperView === "generate"
                            ? "contained"
                            : "outlined"
                    }
                    color="success"
                    onClick={() => setActivePaperView("generate")}
                >
                    Generate New Paper
                </Button>

                <Button
                    variant={
                        activePaperView === "saved" ? "contained" : "outlined"
                    }
                    color="success"
                    onClick={() => setActivePaperView("saved")}
                >
                    Saved Question Papers
                </Button>
            </Box>

            {activePaperView === "saved" ? (
                <SavedQuestionPapers />
            ) : (
                <Card
                    sx={{
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <CardContent>
                        <Box
                            component="form"
                            sx={{ "& .MuiTextField-root": { my: 1 } }}
                        >
                            <Box sx={{ mb: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Question Paper Title"
                                    name="title"
                                    value={paperDetails.title}
                                    onChange={handleBasicDetailsChange}
                                    required
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Total Time (minutes)"
                                    name="totalTime"
                                    type="number"
                                    value={paperDetails.totalTime}
                                    onChange={handleBasicDetailsChange}
                                    required
                                    onWheel={(e) => e.target.blur()}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Instruction"
                                    name="instruction"
                                    value={paperDetails.instruction}
                                    onChange={handleBasicDetailsChange}
                                    required
                                    sx={{ mb: 2 }}
                                />

                                <Box display="flex" alignItems="center" mb={2}>
                                    <FormControl
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        required
                                    >
                                        <InputLabel>Select Batch</InputLabel>
                                        <Select
                                            value={selectedBatch || ""}
                                            onChange={(e) =>
                                                handleBatchChange(
                                                    e.target.value,
                                                )
                                            }
                                            label="Select Batch"
                                        >
                                            {allBatchesData?.map((batch) => (
                                                <MenuItem
                                                    key={batch._id}
                                                    value={batch}
                                                >
                                                    {batch.batchName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box display="flex" alignItems="center" mb={2}>
                                    <FormControl
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        required
                                    >
                                        <InputLabel id="course-select-label">
                                            Course
                                        </InputLabel>
                                        <Select
                                            labelId="course-select-label"
                                            value={selectedCourse}
                                            onChange={handleCourseChange}
                                            label="Course"
                                        >
                                            {availableCourses.map((course) => (
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

                                <Stack
                                    spacing={3}
                                    sx={{ marginBottom: "20px" }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Autocomplete
                                            sx={{ width: "100%" }}
                                            multiple
                                            id="tags-outlined"
                                            options={chapters || []}
                                            getOptionLabel={(option) =>
                                                option.name || ""
                                            }
                                            filterSelectedOptions
                                            value={selectedChapters}
                                            onChange={handleOnChangeChapter}
                                            isOptionEqualToValue={(
                                                option,
                                                value,
                                            ) => option._id === value._id}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Chapters"
                                                    placeholder="Chapters"
                                                />
                                            )}
                                        />
                                    </Box>
                                </Stack>

                                {selectedChapters.length > 0 && (
                                    <Card
                                        sx={{
                                            bgcolor: "background.paper",
                                            borderColor: "divider",
                                        }}
                                    >

                                    </Card>
                                )}

                                <Card
                                    sx={{
                                        bgcolor: "background.paper",
                                        borderColor: "divider",
                                    }}
                                >
                                    <CardContent>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={
                                                        useCustomSchoolFormat
                                                    }
                                                    onChange={(e) => {
                                                        setUseCustomSchoolFormat(
                                                            e.target.checked,
                                                        );
                                                        setCustomFormattedPaper(
                                                            "",
                                                        );
                                                    }}
                                                />
                                            }
                                            label="Use uploaded school question paper format"
                                        />

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            Upload a sample PDF or DOCX. AIRA
                                            will use only its structure and
                                            format, then fill this generated
                                            paper into that style.
                                        </Typography>

                                        {useCustomSchoolFormat && (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    gap: 2,
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <Button
                                                    component="label"
                                                    variant="outlined"
                                                    color="success"
                                                >
                                                    Upload Format
                                                    <input
                                                        hidden
                                                        type="file"
                                                        accept=".pdf,.docx"
                                                        onChange={
                                                            handleTemplateFileChange
                                                        }
                                                    />
                                                </Button>
                                                <Typography
                                                    variant="body2"
                                                    color={
                                                        templateFile
                                                            ? "success.main"
                                                            : "text.secondary"
                                                    }
                                                >
                                                    {templateFile
                                                        ? templateFile.name
                                                        : "No format uploaded"}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>

                                <FormControl fullWidth required sx={{ mb: 2 }}>
                                    <InputLabel>
                                        Default Difficulty Level
                                    </InputLabel>
                                    <Select
                                        name="difficultyLevel"
                                        value={paperDetails.difficultyLevel}
                                        onChange={handleBasicDetailsChange}
                                        label="Default Difficulty Level"
                                    >
                                        <MenuItem value="Easy">Easy</MenuItem>
                                        <MenuItem value="Medium">
                                            Medium
                                        </MenuItem>
                                        <MenuItem value="Hard">Hard</MenuItem>
                                    </Select>
                                </FormControl>

                                <Accordion
                                    elevation={0}
                                    sx={{
                                        mt: 2,
                                        mb: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        bgcolor: "background.paper",
                                        "&:before": {
                                            display: "none",
                                        },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="question-advanced-settings"
                                        sx={{
                                            bgcolor: "background.paper",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.25,
                                            }}
                                        >
                                            <TuneIcon color="primary" />
                                            <Box>
                                                <Typography sx={{ fontWeight: 700 }}>
                                                    Advanced settings
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Optional. Recommended settings are already applied.
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            Choose a different style only when this
                                            paper needs simpler language or more
                                            reasoning-based questions.
                                        </Typography>
                                        <FormControl fullWidth>
                                            <InputLabel>Question Style</InputLabel>
                                            <Select
                                                value={questionStyle}
                                                label="Question Style"
                                                onChange={(e) =>
                                                    handleQuestionStyleChange(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <MenuItem value="recommended">
                                                    Exam-ready (Recommended)
                                                </MenuItem>
                                                <MenuItem value="simple">
                                                    Simple and direct
                                                </MenuItem>
                                                <MenuItem value="higher_order">
                                                    More reasoning and HOTS
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Card
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        Paper Blueprint
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(150px, 1fr))",
                                            gap: 1.5,
                                            mt: 1,
                                            mb: 1.5,
                                        }}
                                    >
                                        {[
                                            {
                                                label: "Questions",
                                                value: blueprintSummary.totalQuestions,
                                            },
                                            {
                                                label: "Marks",
                                                value: totalMarks || 0,
                                            },
                                            {
                                                label: "Sections",
                                                value: sections.length,
                                            },
                                            {
                                                label: "Chapters",
                                                value: selectedChapters.length,
                                            },
                                        ].map((item) => (
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 1,
                                                    bgcolor: "background.default",
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {item.value}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {item.label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Typography variant="body2">
                                        Difficulty: Easy{" "}
                                        {blueprintSummary.difficultyCounts.Easy}
                                        {" | "}Medium{" "}
                                        {
                                            blueprintSummary.difficultyCounts
                                                .Medium
                                        }
                                        {" | "}Hard{" "}
                                        {blueprintSummary.difficultyCounts.Hard}
                                    </Typography>

                                    {!!formatSummaryEntries(
                                        blueprintSummary.questionTypes,
                                    ) && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.5 }}
                                            >
                                                Question types:{" "}
                                                {formatSummaryEntries(
                                                    blueprintSummary.questionTypes,
                                                )}
                                            </Typography>
                                        )}

                                    {!!formatSummaryEntries(
                                        blueprintSummary.skillTypes,
                                    ) && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.5 }}
                                            >
                                                Skills:{" "}
                                                {formatSummaryEntries(
                                                    blueprintSummary.skillTypes,
                                                )}
                                            </Typography>
                                        )}
                                </CardContent>
                            </Card>

                            {sections.map((section, index) => {
                                const skillGuide =
                                    getSkillGuideForSection(section);

                                return (
                                    <Card
                                        key={index}
                                        variant="outlined"
                                        sx={{ mb: 2, p: 2 }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 2,
                                            }}
                                        >
                                            <Typography variant="h6">
                                                Section {index + 1}
                                            </Typography>

                                            {sections.length > 1 && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() =>
                                                        removeSection(index)
                                                    }
                                                    size="small"
                                                >
                                                    Remove Section
                                                </Button>
                                            )}
                                        </Box>

                                        <FormControl
                                            fullWidth
                                            required
                                            sx={{ mb: 2 }}
                                        >
                                            <InputLabel>
                                                Type of Question
                                            </InputLabel>
                                            <Select
                                                name="questionType"
                                                value={section.questionType}
                                                onChange={(e) =>
                                                    handleSectionChange(index, e)
                                                }
                                                label="Type of Question"
                                            >
                                                <MenuItem value="MCQ">
                                                    Multiple Choice
                                                </MenuItem>
                                                <MenuItem value="Short Answer">
                                                    Short Answer
                                                </MenuItem>
                                                <MenuItem value="Fill In the Blanks">
                                                    Fill In the Blanks
                                                </MenuItem>
                                                <MenuItem value="Long Answer">
                                                    Long Answer
                                                </MenuItem>
                                                <MenuItem value="Very Short Answer">
                                                    Very Short Answer
                                                </MenuItem>
                                                <MenuItem value="True or False">
                                                    True or False
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl
                                            fullWidth
                                            required
                                            sx={{ mb: 2 }}
                                        >
                                            <InputLabel>
                                                Question Skill / Style
                                            </InputLabel>
                                            <Select
                                                name="skillType"
                                                value={
                                                    section.skillType ||
                                                    "Concept Check"
                                                }
                                                onChange={(e) =>
                                                    handleSectionChange(index, e)
                                                }
                                                label="Question Skill / Style"
                                            >
                                                {skillGuide.recommended.length >
                                                    0 && (
                                                        <MenuItem disabled>
                                                            Recommended
                                                        </MenuItem>
                                                    )}
                                                {skillGuide.recommended.map(
                                                    (skill) => (
                                                        <MenuItem
                                                            key={skill}
                                                            value={skill}
                                                        >
                                                            {skill}
                                                        </MenuItem>
                                                    ),
                                                )}
                                                {skillGuide.otherSkills.length >
                                                    0 &&
                                                    skillGuide.recommended.length >
                                                    0 && (
                                                        <MenuItem disabled>
                                                            Other styles
                                                        </MenuItem>
                                                    )}
                                                {(skillGuide.recommended.length
                                                    ? skillGuide.otherSkills
                                                    : SKILL_TYPES
                                                ).map((skill) => (
                                                    <MenuItem
                                                        key={skill}
                                                        value={skill}
                                                    >
                                                        {skill}
                                                    </MenuItem>
                                                ))}
                                            </Select>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mt: 1 }}
                                            >
                                                {skillGuide.recommended.length
                                                    ? `Recommended for ${section.questionType}: ${skillGuide.recommended.join(", ")}.`
                                                    : "Choose the question style after selecting a question type."}
                                            </Typography>
                                        </FormControl>

                                        {section.questionType &&
                                            !skillGuide.isRecommended && (
                                                <Alert
                                                    severity="warning"
                                                    sx={{ mb: 2 }}
                                                >
                                                    {section.skillType} can be used
                                                    with {section.questionType}, but
                                                    a recommended style usually
                                                    generates a stronger paper
                                                    faster.
                                                </Alert>
                                            )}

                                        <TextField
                                            fullWidth
                                            label="Number of Questions"
                                            name="numberOfQuestions"
                                            type="number"
                                            value={section.numberOfQuestions}
                                            onChange={(e) =>
                                                handleSectionChange(index, e)
                                            }
                                            required
                                            onWheel={(e) => e.target.blur()}
                                            sx={{ mb: 2 }}
                                        />

                                        <FormControl
                                            fullWidth
                                            required
                                            sx={{ mb: 1 }}
                                        >
                                            <InputLabel>
                                                Section Difficulty
                                            </InputLabel>
                                            <Select
                                                name="difficultyLevel"
                                                value={
                                                    section.difficultyLevel ||
                                                    getDefaultDifficulty()
                                                }
                                                onChange={(e) =>
                                                    handleSectionChange(index, e)
                                                }
                                                label="Section Difficulty"
                                            >
                                                {DIFFICULTY_LEVELS.map((level) => (
                                                    <MenuItem
                                                        key={level}
                                                        value={level}
                                                    >
                                                        {level}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControlLabel
                                            sx={{ mb: 1 }}
                                            control={
                                                <Switch
                                                    checked={Boolean(
                                                        section.useQuestionWiseDifficulty,
                                                    )}
                                                    onChange={(e) =>
                                                        toggleQuestionWiseDifficulty(
                                                            index,
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            }
                                            label="Customize difficulty for each question"
                                        />

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 2 }}
                                        >
                                            Keep this off for faster generation.
                                            Turn it on only when this section needs
                                            a mixed difficulty pattern.
                                        </Typography>

                                        {section.useQuestionWiseDifficulty &&
                                            Number(section.numberOfQuestions || 0) >
                                            0 && (
                                                <Box
                                                    sx={{
                                                        mb: 2,
                                                        p: 2,
                                                        bgcolor: "background.default",
                                                        border: "1px solid",
                                                        borderColor: "divider",
                                                        borderRadius: 2,

                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 700,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        Question-wise Difficulty
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        These choices override the
                                                        section difficulty for this
                                                        section only.
                                                    </Typography>

                                                    <Box
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns:
                                                                "repeat(auto-fit, minmax(170px, 1fr))",
                                                            gap: 2,
                                                            mt: 2,
                                                        }}
                                                    >
                                                        {getDifficultyRowsForSection(
                                                            index,
                                                            section.numberOfQuestions,
                                                        ).map((row, questionIndex) => (
                                                            <FormControl
                                                                key={`${index}-${questionIndex}`}
                                                                size="small"
                                                                fullWidth
                                                            >
                                                                <InputLabel>
                                                                    Q{questionIndex + 1}
                                                                </InputLabel>
                                                                <Select
                                                                    value={
                                                                        row.difficultyLevel
                                                                    }
                                                                    label={`Q${questionIndex +
                                                                        1
                                                                        }`}
                                                                    onChange={(e) =>
                                                                        updateQuestionDifficulty(
                                                                            index,
                                                                            questionIndex,
                                                                            e.target
                                                                                .value,
                                                                        )
                                                                    }
                                                                >
                                                                    {DIFFICULTY_LEVELS.map(
                                                                        (level) => (
                                                                            <MenuItem
                                                                                key={
                                                                                    level
                                                                                }
                                                                                value={
                                                                                    level
                                                                                }
                                                                            >
                                                                                {level}
                                                                            </MenuItem>
                                                                        ),
                                                                    )}
                                                                </Select>
                                                            </FormControl>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                        <TextField
                                            fullWidth
                                            label="Marks of each question"
                                            name="marksOfEachQuestion"
                                            type="number"
                                            value={section.marksOfEachQuestion}
                                            onChange={(e) =>
                                                handleSectionChange(index, e)
                                            }
                                            required
                                            onWheel={(e) => e.target.blur()}
                                            sx={{ mb: 2 }}
                                        />

                                        {sectionsQuestions[index] &&
                                            sectionsQuestions[index].length !==
                                            0 && (
                                                <SectionQuestions
                                                    regenerateQuestion={
                                                        regenerateQuestion
                                                    }
                                                    removeGeneratedQuestion={
                                                        removeGeneratedQuestion
                                                    }
                                                    toggleQuestionLock={
                                                        toggleQuestionLock
                                                    }
                                                    updateGeneratedQuestion={
                                                        updateGeneratedQuestion
                                                    }
                                                    updateGeneratedQuestionOption={
                                                        updateGeneratedQuestionOption
                                                    }
                                                    lockedQuestions={
                                                        lockedQuestions
                                                    }
                                                    section={section}
                                                    sectionIndex={index}
                                                    sectionQuestions={
                                                        sectionsQuestions[index]
                                                    }
                                                />
                                            )}

                                        {sectionsQuestions[index] &&
                                            sectionsQuestions[index].length !==
                                            0 && (
                                                <Box
                                                    sx={{
                                                        textAlign: "center",
                                                        marginTop: "10px",
                                                    }}
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            handleRegenerateSectionQuestions(
                                                                section,
                                                                index,
                                                            )
                                                        }
                                                        variant="contained"
                                                    >
                                                        Regenerate section Questions
                                                    </Button>
                                                </Box>
                                            )}
                                    </Card>
                                );
                            })}

                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Chapter-wise Weightage
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    Assign marks for each chapter
                                    inside each paper section. This
                                    controls both syllabus coverage
                                    and question type distribution.
                                </Typography>

                                <Box
                                    sx={{
                                        overflowX: "auto",
                                        border: "1px solid #d9eadf",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            minWidth: Math.max(
                                                520,
                                                220 +
                                                sections.length *
                                                170,
                                            ),
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: `220px repeat(${sections.length}, 170px) 120px`,
                                                bgcolor: "action.hover",
                                                borderBottom:
                                                    "1px solid #d9eadf",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    p: 1.5,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Chapter
                                            </Typography>
                                            {sections.map(
                                                (
                                                    section,
                                                    sectionIndex,
                                                ) => (
                                                    <Typography
                                                        key={`section-head-${sectionIndex}`}
                                                        sx={{
                                                            p: 1.5,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Section{" "}
                                                        {sectionIndex +
                                                            1}
                                                        <br />
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {section.questionType ||
                                                                "Type pending"}{" "}
                                                            |{" "}
                                                            {getSectionTotalMarks(
                                                                section,
                                                            )}{" "}
                                                            marks
                                                        </Typography>
                                                    </Typography>
                                                ),
                                            )}
                                            <Typography
                                                sx={{
                                                    p: 1.5,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Total
                                            </Typography>
                                        </Box>

                                        {chapterWeightage.map(
                                            (item) => (
                                                <Box
                                                    key={
                                                        item.chapterId
                                                    }
                                                    sx={{
                                                        display:
                                                            "grid",
                                                        gridTemplateColumns: `220px repeat(${sections.length}, 170px) 120px`,
                                                        borderBottom:
                                                            "1px solid #edf4ef",
                                                        alignItems:
                                                            "center",
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            p: 1.5,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {
                                                            item.chapterName
                                                        }
                                                    </Typography>
                                                    {sections.map(
                                                        (
                                                            section,
                                                            sectionIndex,
                                                        ) => (
                                                            <Box
                                                                key={`${item.chapterId}-${sectionIndex}`}
                                                                sx={{
                                                                    p: 1,
                                                                }}
                                                            >
                                                                <TextField
                                                                    size="small"
                                                                    type="number"
                                                                    value={
                                                                        item
                                                                            .sectionMarks?.[
                                                                        sectionIndex
                                                                        ] ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleChapterSectionWeightageChange(
                                                                            item.chapterId,
                                                                            sectionIndex,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    onWheel={(
                                                                        e,
                                                                    ) =>
                                                                        e
                                                                            .target
                                                                            .blur()
                                                                    }
                                                                    placeholder="Marks"
                                                                    helperText={
                                                                        section.marksOfEachQuestion
                                                                            ? `x ${section.marksOfEachQuestion}`
                                                                            : "Set marks/q"
                                                                    }
                                                                />
                                                            </Box>
                                                        ),
                                                    )}
                                                    <Typography
                                                        sx={{
                                                            p: 1.5,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {Object.values(
                                                            item.sectionMarks ||
                                                            {},
                                                        ).reduce(
                                                            (
                                                                sum,
                                                                value,
                                                            ) =>
                                                                sum +
                                                                Number(
                                                                    value ||
                                                                    0,
                                                                ),
                                                            0,
                                                        )}
                                                    </Typography>
                                                </Box>
                                            ),
                                        )}

                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: `220px repeat(${sections.length}, 170px) 120px`,
                                                bgcolor: "background.default",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    p: 1.5,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Section Total
                                            </Typography>
                                            {sections.map(
                                                (
                                                    section,
                                                    sectionIndex,
                                                ) => {
                                                    const planned =
                                                        getSectionWeightageTotal(
                                                            sectionIndex,
                                                        );
                                                    const target =
                                                        getSectionTotalMarks(
                                                            section,
                                                        );

                                                    return (
                                                        <Typography
                                                            key={`section-total-${sectionIndex}`}
                                                            color={
                                                                planned !==
                                                                    target
                                                                    ? "error"
                                                                    : "success.main"
                                                            }
                                                            sx={{
                                                                p: 1.5,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {
                                                                planned
                                                            }
                                                            /
                                                            {
                                                                target
                                                            }
                                                        </Typography>
                                                    );
                                                },
                                            )}
                                            <Typography
                                                color={
                                                    Number(
                                                        totalMarks ||
                                                        0,
                                                    ) &&
                                                        getChapterWeightageTotal() !==
                                                        Number(
                                                            totalMarks ||
                                                            0,
                                                        )
                                                        ? "error"
                                                        : "success.main"
                                                }
                                                sx={{
                                                    p: 1.5,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {getChapterWeightageTotal()}
                                                /
                                                {Number(
                                                    totalMarks || 0,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 1 }}
                                >
                                    Each cell should be divisible by
                                    that section's marks per
                                    question. Example: if Section 2
                                    is 2 marks per question, enter
                                    2, 4, 6, etc.
                                </Typography>
                            </CardContent>

                            <Button
                                variant="outlined"
                                onClick={addSection}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Add Section
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={generateQuestionPaper}
                                fullWidth
                                disabled={isLoading}
                                sx={{ mb: 2 }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    "Generate Question Paper"
                                )}
                            </Button>

                            {isLoading && (
                                <Card
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        bgcolor: "background.paper",
                                        borderColor: "divider",
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 700, mb: 0.5 }}
                                        >
                                            Generating your question paper
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1.5 }}
                                        >
                                            AIRA fills the remaining questions
                                            from selected chapter PDFs when the
                                            question bank does not have the
                                            requested match.
                                        </Typography>

                                        {GENERATION_STEPS.map(
                                            (step, stepIndex) => (
                                                <Typography
                                                    key={step}
                                                    variant="body2"
                                                    sx={{
                                                        color:
                                                            stepIndex <=
                                                                generationStepIndex
                                                                ? "#1b5e20"
                                                                : "text.secondary",
                                                        fontWeight:
                                                            stepIndex ===
                                                                generationStepIndex
                                                                ? 700
                                                                : 400,
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {stepIndex + 1}. {step}
                                                </Typography>
                                            ),
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {previewQuestions && (
                                <Box
                                    id="question-paper-preview-section"
                                    sx={{
                                        mt: 3,
                                        p: 2,
                                        bgcolor: "background.default",
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <QuestionPaper
                                        title={paperDetails.title}
                                        instruction={paperDetails.instruction}
                                        totalTime={paperDetails.totalTime}
                                        totalMarks={totalMarks}
                                        selectedChapters={selectedChapters}
                                        selectedCourse={selectedCourse}
                                        questionsGenerated={sectionsQuestions}
                                        sectionsBlueprint={sections}
                                        chapterWeightage={
                                            getActiveChapterWeightage()
                                        }
                                        generationWarnings={
                                            getTeacherFacingGenerationWarnings(
                                                generationWarnings,
                                            )
                                        }
                                        qualityControls={qualityControls}
                                    />
                                </Box>
                            )}

                            {previewQuestions &&
                                getTeacherFacingGenerationWarnings(
                                    generationWarnings,
                                ).length > 0 && (
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            mt: 2,
                                            border: "1px solid",
                                            borderColor: "warning.main",
                                            bgcolor: "background.paper",
                                        }}
                                    >
                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                sx={{ fontWeight: 700, mb: 1 }}
                                            >
                                                Generation Notes
                                            </Typography>
                                            {getTeacherFacingGenerationWarnings(
                                                generationWarnings,
                                            )
                                                .slice(0, 6)
                                                .map((warning, index) => (
                                                    <Typography
                                                        key={`${warning.code}-${index}`}
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 0.75 }}
                                                    >
                                                        {index + 1}.{" "}
                                                        {warning.message}
                                                    </Typography>
                                                ))}
                                        </CardContent>
                                    </Card>
                                )}

                            {customFormattedPaper && (
                                <Card
                                    variant="outlined"
                                    sx={{
                                        mt: 3,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <CardContent>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems: "center",
                                                gap: 2,
                                                flexWrap: "wrap",
                                                mb: 2,
                                            }}
                                        >
                                            <Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    School Format Paper
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Generated using{" "}
                                                    {templateFile?.name ||
                                                        "uploaded school format"}
                                                    .
                                                </Typography>
                                            </Box>

                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={
                                                    downloadCustomFormattedPaper
                                                }
                                            >
                                                Download School Format
                                            </Button>
                                        </Box>

                                        <Box
                                            component="pre"
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                fontFamily:
                                                    "Arial, sans-serif",
                                                fontSize: 14,
                                                lineHeight: 1.55,
                                                p: 2,
                                                maxHeight: 520,
                                                overflow: "auto",
                                                border: "1px solid #d9eadf",
                                                borderRadius: 2,
                                                backgroundColor: "#fff",
                                            }}
                                        >
                                            {customFormattedPaper}
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                            {hasGeneratedQuestions && (
                                <Card
                                    variant="outlined"
                                    sx={(theme) => ({
                                        mt: 3,
                                        mb: 3,
                                        p: 2,
                                        bgcolor: theme.palette.background.paper,
                                        border: "1px solid",
                                        borderColor: theme.palette.divider,
                                    })}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={(theme) => ({
                                            mb: 1,
                                            fontWeight: 700,
                                            color: theme.palette.success.main,
                                        })}
                                    >
                                        Save Generated Paper to LMS
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 2 }}
                                    >
                                        Save this generated paper so teachers
                                        can reuse it later.
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Saved Paper Title"
                                        value={paperTitle}
                                        onChange={(e) =>
                                            setPaperTitle(e.target.value)
                                        }
                                        placeholder="Enter paper title before saving"
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        type="button"
                                        variant="contained"
                                        color="success"
                                        onClick={() => saveGeneratedPaperToLms()}
                                        disabled={isSavingPaper}
                                        fullWidth
                                        sx={{
                                            py: 1.3,
                                            fontWeight: 700,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {isSavingPaper ? (
                                            <CircularProgress
                                                size={22}
                                                color="inherit"
                                            />
                                        ) : (
                                            "Save to LMS"
                                        )}
                                    </Button>
                                </Card>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default QuestionForm;