// controllers/questionBaseController.js

const dotenv = require("dotenv");

const Board = require("../models/Board");
const Grade = require("../models/Grade");
const Concept = require("../models/Concept");
const Chapter = require("../models/Chapter");
const Option = require("../models/Option");
const mongoose = require("mongoose");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const {
    getUsageActor,
    recordAiUsage,
} = require("../services/aiUsageService");

const {
    QuestionBase,
    MCQQuestion,
    TrueFalseQuestion,
    ShortAnswerQuestion,
    FillBlanksQuestion,
    LongAnswerQuestion,
    VeryShortAnswerQuestion,
} = require("../models/QuestionBase");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const cleanQuestionPaperText = (value = "") => {
    let text = String(value || "")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "    ")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // Protect common HTML tags so preview/download shows them as text
    // Example: <h1> becomes `<h1>`
    text = text
        .replace(/(?<!`)<!DOCTYPE html>(?!`)/gi, "`<!DOCTYPE html>`")
        .replace(/(?<!`)<\s*([a-zA-Z][a-zA-Z0-9]*)\s*>(?!`)/g, "`<$1>`")
        .replace(/(?<!`)<\s*\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*>(?!`)/g, "`</$1>`")
        .replace(/(?<!`)<\s*([a-zA-Z][a-zA-Z0-9]*)\s*\/\s*>(?!`)/g, "`<$1 />`");

    return text.trim();
};

const getSkillTypeInstruction = (skillType = "Concept Check") => {
    const normalizedSkill = String(skillType || "Concept Check").trim();

    const instructions = {
        "Concept Check":
            "Create a direct concept-checking question that tests basic understanding from the chapter.",
        "Application Based":
            "Create an application-based question where the student applies the chapter concept to solve a practical problem.",
        "Competency Based":
            "Create a competency-based question using a real-life or classroom situation where the student applies the concept.",
        HOTS: "Create a higher-order thinking question that requires reasoning, analysis, comparison, inference, or deeper thinking. Avoid simple recall.",
        "Real-life Scenario":
            "Create a real-life scenario-based question connected to the chapter concept.",
        "Case Study":
            "Create a short case-study-based question with a small scenario followed by a question.",
        "Reasoning Based":
            "Create a reasoning-based question where the student must justify, infer, compare, or explain logic.",
        "Activity Based":
            "Create an activity-based question connected to a classroom/lab activity.",
        "Tool/Software Based":
            "Create a tool/software-based question involving menus, icons, features, workflows, or usage steps.",
        "Ethics & Safety Based":
            "Create an ethics or safety-based question involving responsible use, privacy, online safety, bias, or safe behaviour.",
        "Troubleshooting Based":
            "Create a troubleshooting question where the student identifies a problem and suggests a fix.",
        "Creative Thinking":
            "Create a creative thinking question where the student designs, imagines, improves, or proposes a solution.",
        "Coding Based":
            "Create a coding-based question. It may ask the student to write code, complete code, identify logic, or solve a programming task based on the chapter.",
        Debugging:
            "Create a debugging question where the student identifies or corrects an error in logic, code, steps, or reasoning.",
        "Output Prediction":
            "Create an output-prediction question where the student predicts the result/output of given code, steps, or logic.",
        "Algorithm Thinking":
            "Create an algorithmic thinking question where the student explains steps, sequence, logic, or procedure.",
        "AI Prediction":
            "Create an AI-prediction question involving data, model training, classification, prediction, bias, or AI decision-making.",
        "Data Interpretation":
            "Create a data-interpretation question where the student reads, compares, or draws meaning from given data or observations.",
        "Cyber Safety Scenario":
            "Create a cyber-safety scenario question involving passwords, OTP, phishing, privacy, digital footprint, or safe online behaviour.",
        "Robotics Logic":
            "Create a robotics-logic question involving sensors, actuators, input-process-output, automation, wiring logic, or robot behaviour.",
    };

    return instructions[normalizedSkill] || instructions["Concept Check"];
};

const normalizeSelectedChapterId = (chapter) => {
    if (!chapter) return null;
    return chapter.qbChapterId || chapter.id || chapter._id || null;
};

const hydrateChaptersWithAiraSources = async (chapters = []) => {
    const missingSourceChapters = chapters.filter(
        (chapter) => chapter?.Ebook && !chapter.pdfText,
    );

    if (!missingSourceChapters.length) return chapters;

    const ebookIds = [
        ...new Set(missingSourceChapters.map((chapter) => chapter.Ebook)),
    ];

    const sourceChapters = await Chapter.find({
        Ebook: { $in: ebookIds },
        pdfText: { $exists: true, $nin: ["", null] },
    })
        .select("_id Ebook pdfText")
        .lean();

    const sourceByEbook = new Map(
        sourceChapters.map((chapter) => [chapter.Ebook, chapter.pdfText]),
    );

    const repairOps = [];
    const hydratedChapters = chapters.map((chapter) => {
        if (!chapter?.Ebook || chapter.pdfText) return chapter;

        const pdfText = sourceByEbook.get(chapter.Ebook);
        if (!pdfText) return chapter;

        repairOps.push({
            updateOne: {
                filter: {
                    _id: chapter._id,
                    $or: [
                        { pdfText: { $exists: false } },
                        { pdfText: { $in: ["", null] } },
                    ],
                },
                update: { $set: { pdfText } },
            },
        });

        return { ...chapter, pdfText };
    });

    if (repairOps.length) {
        try {
            await Chapter.bulkWrite(repairOps);
        } catch (error) {
            console.error("Failed to backfill chapter ChatPDF sourceId:", error);
        }
    }

    return hydratedChapters;
};

const isSectionTargetChapter = (section = {}, chapter = {}) => {
    if (section.targetCourseChapterId || section.targetChapterId) {
        return (
            String(chapter._id) === String(section.targetCourseChapterId) ||
            String(chapter._id) === String(section.targetChapterId)
        );
    }

    return true;
};

const buildMissingAiraSourceMessage = (chapters = []) => {
    const chapterNames = chapters
        .map((chapter) => chapter?.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
    const suffix = chapterNames ? ` (${chapterNames})` : "";
    const hasVisibleEbook = chapters.some((chapter) => chapter?.Ebook);

    if (hasVisibleEbook) {
        return `Selected ebook${suffix} is available for viewing, but it is not indexed for AIRA question generation. Please re-upload the ebook file once so AIRA can read it.`;
    }

    return `Selected chapter${suffix} does not have an ebook uploaded. Please upload ebook first.`;
};

const normalizeSectionsWithSkillType = (sections = []) => {
    return sections.map((section) => ({
        ...section,
        skillType: section.skillType || "Concept Check",
    }));
};

const limitQuestionPaperTemplateText = (text = "", maxChars = 7000) => {
    const cleaned = String(text || "")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned.length > maxChars ? cleaned.slice(0, maxChars) : cleaned;
};

const extractQuestionPaperTemplateText = async (file) => {
    if (!file) {
        throw new Error("Question paper format file is required");
    }

    const fileName = String(file.originalname || "").toLowerCase();
    const mimeType = String(file.mimetype || "").toLowerCase();

    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
        const pdfData = await pdf(file.buffer);
        return String(pdfData.text || "").trim();
    }

    if (mimeType.includes("wordprocessingml") || fileName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return String(result.value || "").trim();
    }

    throw new Error("Only PDF and DOCX question paper formats are supported");
};

exports.createQuestionBase = async (req, res) => {
    const questionsData = req.body;

    try {
        const createdQuestions = [];

        for (const questionData of questionsData) {
            let newQuestion;

            const commonFields = {
                questionTitle: questionData.questionTitle,
                grade: questionData.grade,
                gradeName: questionData.gradeName,
                chapter: questionData.chapter,
                chapterName: questionData.chapterName,
                difficultyLevel: questionData.difficultyLevel,
                questionStem: questionData.questionStem,
                explanation: questionData.explanation,
                course: questionData.course,
                courseName: questionData.courseName,
                skillType: questionData.skillType || "Concept Check",
                source: questionData.source || "manual",
                normalizedQuestion: normalizeGeneratedQuestionText(
                    questionData.questionStem,
                ),
                teacherApprovedCount: req.teacher ? 1 : 0,
                usageCount: 0,
            };

            switch (questionData.questionType) {
                case "MCQ": {
                    const optionIds = await Promise.all(
                        questionData.options.map(async (option) => {
                            const newOption = new Option({
                                option: option.option,
                                optionNumber: option.optionNumber,
                            });
                            await newOption.save();
                            return newOption._id;
                        }),
                    );

                    newQuestion = new MCQQuestion({
                        ...commonFields,
                        options: optionIds,
                        answer: questionData.answer.trim(),
                    });
                    break;
                }

                case "Very Short Answer":
                    newQuestion = new VeryShortAnswerQuestion({
                        ...commonFields,
                        answer: questionData.answer,
                        answerVariations: questionData.variations,
                    });
                    break;

                case "True or False":
                    newQuestion = new TrueFalseQuestion({
                        ...commonFields,
                        answer:
                            typeof questionData.answer === "string"
                                ? questionData.answer.trim().toLowerCase() ===
                                  "true"
                                : questionData.answer === true,
                    });
                    break;

                case "Short Answer":
                    newQuestion = new ShortAnswerQuestion({
                        ...commonFields,
                        answer: questionData.answer.trim(),
                    });
                    break;

                case "Fill In the Blanks":
                    newQuestion = new FillBlanksQuestion({
                        ...commonFields,
                        answer: questionData.answer.trim(),
                    });
                    break;

                case "Long Answer":
                    newQuestion = new LongAnswerQuestion({
                        ...commonFields,
                        answer: questionData.answer,
                    });
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid question type",
                    });
            }

            await newQuestion.save();
            createdQuestions.push(newQuestion);
        }

        res.status(201).json({
            message: "Questions created successfully!",
            questions: createdQuestions,
        });
    } catch (error) {
        console.error("Error creating questions:", error);
        res.status(500).json({ error: "Failed to create questions" });
    }
};

exports.createBoard = async (req, res) => {
    try {
        const { boardName, boardDescription } = req.body;

        if (!boardName || !boardDescription) {
            return res.status(400).json({
                message: "Board name and Board description are required",
            });
        }

        const newBoard = new Board({
            boardName,
            boardDescription,
        });

        const savedBoard = await newBoard.save();

        return res.status(201).json({
            message: "Board created successfully",
            board: savedBoard,
        });
    } catch (error) {
        console.error("Error creating board:", error);
        return res.status(500).json({
            message: "An error occurred while creating the board",
            error: error.message,
        });
    }
};

exports.getAllBoards = async (req, res) => {
    try {
        const boards = await Board.find();

        if (!boards || boards.length === 0) {
            return res.status(404).json({ message: "No boards found" });
        }

        return res.status(200).json({
            message: "Boards fetched successfully",
            boards,
        });
    } catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({
            message: "An error occurred while fetching boards",
            error: error.message,
        });
    }
};

exports.createGrade = async (req, res) => {
    try {
        const { gradeName } = req.body;

        if (!gradeName) {
            return res.status(400).json({ message: "Grade name is required" });
        }

        const newGrade = new Grade({
            name: gradeName,
        });

        const savedGrade = await newGrade.save();

        return res.status(201).json({
            message: "Grade created successfully",
            Grade: savedGrade,
        });
    } catch (error) {
        console.error("Error creating grade:", error);
        return res.status(500).json({
            message: "An error occurred while creating the grade",
            error: error.message,
        });
    }
};

exports.getAllGrades = async (req, res) => {
    try {
        const grades = await Grade.find();

        if (!grades || grades.length === 0) {
            return res.status(404).json({ message: "No grades found" });
        }

        return res.status(200).json({
            message: "Grades fetched successfully",
            grades,
        });
    } catch (error) {
        console.error("Error fetching grades:", error);
        return res.status(500).json({
            message: "An error occurred while fetching grades",
            error: error.message,
        });
    }
};

exports.fetchQuestionById = async (req, res) => {
    try {
        const id = req.params.id;

        const question = await QuestionBase.findById(id).populate("options");

        return res.status(201).json({
            question,
        });
    } catch (error) {
        console.error("Error fetching Question:", error);
        return res.status(500).json({
            message: "An error occurred while fetching the Question",
            error: error.message,
        });
    }
};

exports.fetchQuestions = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 50;
        let skip = (page - 1) * limit;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid page or limit value",
            });
        }

        const questions = await QuestionBase.aggregate([
            {
                $lookup: {
                    from: "options",
                    localField: "options",
                    foreignField: "_id",
                    as: "options",
                },
            },
            {
                $project: {
                    questionId: 1,
                    questionType: 1,
                    questionTitle: 1,
                    grade: 1,
                    gradeName: 1,
                    course: 1,
                    courseName: 1,
                    chapter: 1,
                    chapterName: 1,
                    questionStem: 1,
                    options: 1,
                    answer: 1,
                    explanation: 1,
                    difficultyLevel: 1,
                    skillType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { questionId: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const totalDocuments = await QuestionBase.countDocuments();

        return res.status(200).json({
            success: true,
            count: questions.length,
            totalDocuments,
            totalPages: Math.ceil(totalDocuments / limit),
            currentPage: page,
            questions,
        });
    } catch (error) {
        console.error("Error fetching Questions:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching the Questions",
            error: error.message,
        });
    }
};

exports.fetchQuestionsForCreateQuiz = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 50;
        let skip = (page - 1) * limit;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid page or limit value",
            });
        }

        const qbChapterId = req.query.qbChapterId;
        const chapterId = req.query.chapterId;
        const questionType = req.query.questionType;

        if (!questionType || (!qbChapterId && !chapterId)) {
            return res.status(400).json({
                success: false,
                message: "questionType or chapter identifiers are missing",
            });
        }

        const ParseqbChapterId = qbChapterId
            ? new mongoose.Types.ObjectId(qbChapterId)
            : null;
        const ParsechapterId = new mongoose.Types.ObjectId(chapterId);

        const selectedChapter =
            ParseqbChapterId !== null ? ParseqbChapterId : ParsechapterId;

        const questions = await QuestionBase.aggregate([
            {
                $match: {
                    questionType,
                    chapter: selectedChapter,
                },
            },
            {
                $lookup: {
                    from: "options",
                    localField: "options",
                    foreignField: "_id",
                    as: "options",
                },
            },
            {
                $project: {
                    questionId: 1,
                    questionType: 1,
                    questionTitle: 1,
                    course: 1,
                    courseName: 1,
                    chapter: 1,
                    chapterName: 1,
                    questionStem: 1,
                    options: 1,
                    answer: 1,
                    answerVariations: 1,
                    explanation: 1,
                    difficultyLevel: 1,
                    skillType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { questionId: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const totalDocuments = await QuestionBase.countDocuments();

        return res.status(200).json({
            success: true,
            count: questions.length,
            totalDocuments,
            totalPages: Math.ceil(totalDocuments / limit),
            currentPage: page,
            questions,
        });
    } catch (error) {
        console.error("Error fetching Questions:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching the Questions",
            error: error.message,
        });
    }
};

exports.deleteQuestionById = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedQuestion =
            await QuestionBase.findByIdAndDelete(id).populate("options");

        if (!deletedQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        return res.status(200).json({
            message: "Question deleted successfully",
            deletedQuestion,
        });
    } catch (error) {
        console.error("Error deleting Question:", error);
        return res.status(500).json({
            message: "An error occurred while deleting the Question",
            error: error.message,
        });
    }
};

exports.updateQuestionBase = async (req, res) => {
    const { questionId } = req.params;
    const editedData = req.body;

    try {
        const originalQuestion = await QuestionBase.findById(questionId);

        if (!originalQuestion) {
            return res.status(404).json({ message: "Question not found" });
        }

        const isTypeChanged =
            originalQuestion.questionType !== editedData.questionType;

        if (isTypeChanged) {
            let NewQuestionModel;

            switch (editedData.questionType) {
                case "Short Answer":
                    NewQuestionModel = ShortAnswerQuestion;
                    break;
                case "Long Answer":
                    NewQuestionModel = LongAnswerQuestion;
                    break;
                case "Fill In the Blanks":
                    NewQuestionModel = FillBlanksQuestion;
                    break;
                case "MCQ":
                    NewQuestionModel = MCQQuestion;
                    break;
                case "True or False":
                    NewQuestionModel = TrueFalseQuestion;
                    break;
                case "Very Short Answer":
                    NewQuestionModel = VeryShortAnswerQuestion;
                    break;
                default:
                    throw new Error("Invalid question type");
            }

            const newQuestionData = {
                _id: questionId,
                questionId: originalQuestion.questionId,
                ...editedData,
                skillType:
                    editedData.skillType ||
                    originalQuestion.skillType ||
                    "Concept Check",
                normalizedQuestion: normalizeGeneratedQuestionText(
                    editedData.questionStem || originalQuestion.questionStem,
                ),
                teacherApprovedCount:
                    Number(originalQuestion.teacherApprovedCount || 0) +
                    (req.teacher ? 1 : 0),
            };

            if (editedData.questionType === "MCQ") {
                if (!editedData.options || !editedData.answerKey) {
                    return res.status(400).json({
                        message: "MCQ questions require options and answer key",
                    });
                }
            } else if (editedData.questionType === "True or False") {
                newQuestionData.answer = editedData.answer === "true";
            } else if (editedData.questionType === "Very Short Answer") {
                if (!Array.isArray(editedData.answerVariations)) {
                    return res.status(400).json({
                        message:
                            "answerVariations must be an array for Very Short Answer questions",
                    });
                }
            }

            await QuestionBase.findByIdAndDelete(questionId);

            const newQuestion = new NewQuestionModel(newQuestionData);
            const savedQuestion = await newQuestion.save();

            return res.status(200).json({
                message: "Question type changed and updated successfully!",
                question: savedQuestion,
            });
        }

        let QuestionModel;

        switch (originalQuestion.questionType) {
            case "Short Answer":
                QuestionModel = ShortAnswerQuestion;
                break;
            case "Long Answer":
                QuestionModel = LongAnswerQuestion;
                break;
            case "Fill In the Blanks":
                QuestionModel = FillBlanksQuestion;
                break;
            case "MCQ":
                QuestionModel = MCQQuestion;
                break;
            case "True or False":
                QuestionModel = TrueFalseQuestion;
                break;
            case "Very Short Answer":
                QuestionModel = VeryShortAnswerQuestion;
                break;
            default:
                QuestionModel = QuestionBase;
        }

        const question = await QuestionModel.findById(questionId);

        if (originalQuestion.questionType === "Very Short Answer") {
            const updatedQuestion =
                await VeryShortAnswerQuestion.findOneAndUpdate(
                    { _id: questionId },
                    {
                        $set: {
                            ...editedData,
                            skillType:
                                editedData.skillType ||
                                originalQuestion.skillType ||
                                "Concept Check",
                            answerVariations: editedData.variations,
                            normalizedQuestion: normalizeGeneratedQuestionText(
                                editedData.questionStem ||
                                    originalQuestion.questionStem,
                            ),
                        },
                        ...(req.teacher
                            ? { $inc: { teacherApprovedCount: 1 } }
                            : {}),
                    },
                    { new: true },
                );

            return res.status(200).json({
                message: "Question updated successfully!",
                question: updatedQuestion,
            });
        }

        Object.keys(editedData).forEach((key) => {
            if (editedData[key] !== undefined) {
                question[key] = editedData[key];
            }
        });

        if (!question.skillType) {
            question.skillType = "Concept Check";
        }
        question.normalizedQuestion = normalizeGeneratedQuestionText(
            question.questionStem,
        );
        if (req.teacher) {
            question.teacherApprovedCount =
                Number(question.teacherApprovedCount || 0) + 1;
        }

        const savedQuestion = await question.save();

        return res.status(200).json({
            message: "Question updated successfully!",
            question: savedQuestion,
        });
    } catch (error) {
        console.error("Error in update process:", error);
        res.status(500).json({
            message: "Failed to update question",
            error: error.message,
        });
    }
};

exports.fetchfilteredQuestions = async (req, res) => {
    try {
        const {
            questionId,
            questionTitle,
            questionType,
            gradeName,
            chapterName,
        } = req.query;

        const matchConditions = {};

        if (questionId) {
            const questionIdArray = Array.isArray(questionId)
                ? questionId.map((id) => Number(id))
                : [Number(questionId)];

            matchConditions.questionId = { $in: questionIdArray };
        }

        if (questionTitle) {
            const questionTitleArray = Array.isArray(questionTitle)
                ? questionTitle
                : [questionTitle];
            matchConditions.$and = questionTitleArray.map((title) => ({
                questionTitle: { $regex: title, $options: "i" },
            }));
        }

        if (questionType) {
            const questionTypeArray = Array.isArray(questionType)
                ? questionType
                : [questionType];
            matchConditions.$and = matchConditions.$and || [];
            matchConditions.$and.push(
                ...questionTypeArray.map((type) => ({
                    questionType: { $regex: type, $options: "i" },
                })),
            );
        }

        if (gradeName) {
            const gradeNameArray = Array.isArray(gradeName)
                ? gradeName
                : [gradeName];
            matchConditions.$and = matchConditions.$and || [];
            matchConditions.$and.push(
                ...gradeNameArray.map((grade) => ({
                    gradeName: { $regex: grade, $options: "i" },
                })),
            );
        }

        if (chapterName) {
            const chapterNameArray = Array.isArray(chapterName)
                ? chapterName
                : [chapterName];
            matchConditions.$and = matchConditions.$and || [];
            matchConditions.$and.push(
                ...chapterNameArray.map((chapter) => ({
                    chapterName: { $regex: chapter, $options: "i" },
                })),
            );
        }

        const pipeline = [
            {
                $match: matchConditions,
            },
            {
                $lookup: {
                    from: "options",
                    localField: "options",
                    foreignField: "_id",
                    as: "options",
                },
            },
            {
                $sort: { questionId: -1 },
            },
            {
                $project: {
                    options: {
                        $filter: {
                            input: "$options",
                            as: "option",
                            cond: { $ne: ["$$option", null] },
                        },
                    },
                    questionId: 1,
                    questionTitle: 1,
                    questionType: 1,
                    gradeName: 1,
                    courseName: 1,
                    chapterName: 1,
                    questionStem: 1,
                    answer: 1,
                    explanation: 1,
                    difficultyLevel: 1,
                    skillType: 1,
                },
            },
        ];

        const questions = await QuestionBase.aggregate(pipeline);

        res.status(200).json(questions);
    } catch (error) {
        console.error("Error filtering questions:", error);
        res.status(500).json({ error: "Failed to filter questions" });
    }
};

exports.getQuestionPdf = async (req, res) => {
    try {
        cloudinary.config({
            cloud_name:
                process.env.CLOUDINARY_NAME ||
                process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
        });

        const [imageResult, rawResult] = await Promise.allSettled([
            cloudinary.api.resources({
                type: "upload",
                prefix: "editor_uploads/",
                resource_type: "image",
                max_results: 500,
            }),
            cloudinary.api.resources({
                type: "upload",
                prefix: "editor_uploads/",
                resource_type: "raw",
                max_results: 500,
            }),
        ]);

        const allFiles = [
            ...(imageResult.status === "fulfilled"
                ? imageResult.value.resources || []
                : []),
            ...(rawResult.status === "fulfilled"
                ? rawResult.value.resources || []
                : []),
        ];

        if (allFiles.length === 0) {
            return res.status(404).json({
                message: "No files found in editor_uploads folder",
                debug: {
                    imageStatus: imageResult.status,
                    rawStatus: rawResult.status,
                    imageError:
                        imageResult.status === "rejected"
                            ? imageResult.reason
                            : null,
                    rawError:
                        rawResult.status === "rejected"
                            ? rawResult.reason
                            : null,
                },
            });
        }

        const files = allFiles.map((file) => ({
            url: file.secure_url,
            filename: file.public_id.split("/").pop(),
            public_id: file.public_id,
            format: file.format,
            type:
                file.resource_type ||
                (file.secure_url.toLowerCase().endsWith(".pdf")
                    ? "pdf"
                    : "image"),
            created_at: file.created_at,
        }));

        const pdfs = files.filter(
            (file) =>
                file.type === "pdf" ||
                file.format === "pdf" ||
                file.url.toLowerCase().endsWith(".pdf"),
        );
        const images = files.filter((file) => !pdfs.includes(file));

        return res.status(200).json({
            pdfs,
            images,
            totalPdfs: pdfs.length,
            totalImages: images.length,
            totalFiles: files.length,
        });
    } catch (error) {
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
        });

        return res.status(500).json({
            message: "Error fetching files from editor_uploads",
            error: error.message,
            details: {
                cloudName:
                    process.env.CLOUDINARY_NAME ||
                    process.env.CLOUDINARY_CLOUD_NAME,
                folder: "editor_uploads",
            },
        });
    }
};

const lookupQuestionsFromBank = async ({
    sections,
    chapters,
    difficultyLevel,
    excludeIdsBySection = {},
    actor = {},
    existingQuestionsBySection = [],
}) => {
    const warnings = [];

    const result = await Promise.all(
        sections.map(async (section, sectionIndex) => {
            const { numberOfQuestions, questionType } = section;
            const requiredCount = Number(numberOfQuestions || 0);
            const effectiveDifficultyLevel =
                section.difficultyLevel || difficultyLevel || "Medium";
            const effectiveSkillType = section.skillType || "Concept Check";
            const validChapters = (chapters || []).filter((chapter) => {
                const chapterId = normalizeSelectedChapterId(chapter);

                if (!chapterId) return false;

                if (section.targetChapterId) {
                    return String(chapterId) === String(section.targetChapterId);
                }

                return true;
            });

            if (!validChapters.length || !requiredCount) return [];

            const hasQuestionWiseTarget =
                requiredCount === 1 &&
                Number.isInteger(section.originalQuestionIndex);
            const targetChapterIndex = hasQuestionWiseTarget
                ? section.originalQuestionIndex % validChapters.length
                : null;

            const questionsPerChapter = Math.floor(
                requiredCount / validChapters.length,
            );
            let remainingQuestions = requiredCount % validChapters.length;

            const excludedIds = (excludeIdsBySection[sectionIndex] || [])
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));
            const existingQuestions = existingQuestionsBySection[sectionIndex] || [];

            const questionsForSection = await Promise.all(
                validChapters.map(async (chapter, index) => {
                    const limit = hasQuestionWiseTarget
                        ? index === targetChapterIndex
                            ? 1
                            : 0
                        : index < remainingQuestions
                          ? questionsPerChapter + 1
                          : questionsPerChapter;

                    if (!limit) return [];

                    const selectedChapter = new mongoose.Types.ObjectId(
                        normalizeSelectedChapterId(chapter),
                    );

                    const match = {
                        questionType,
                        difficultyLevel: effectiveDifficultyLevel,
                        chapter: selectedChapter,
                    };

                    if (effectiveSkillType === "Concept Check") {
                        match.$or = [
                            { skillType: "Concept Check" },
                            { skillType: "" },
                            { skillType: { $exists: false } },
                        ];
                    } else {
                        match.skillType = effectiveSkillType;
                    }

                    if (excludedIds.length) {
                        match._id = { $nin: excludedIds };
                    }

                    const availableCount =
                        await QuestionBase.countDocuments(match);

                    if (availableCount < limit) {
                        warnings.push({
                            code: "question_bank_shortage",
                            visibility: "internal",
                            sectionIndex,
                            questionType,
                            skillType: effectiveSkillType,
                            chapterId: selectedChapter.toString(),
                            requested: limit,
                            available: availableCount,
                            message: `Only ${availableCount} ${effectiveDifficultyLevel} ${questionType} question(s) found in question bank for this chapter.`,
                        });
                    }

                    const candidateLimit = Math.max(limit * 6, 12);
                    const rawCandidates = await QuestionBase.aggregate([
                        { $match: match },
                        { $addFields: { _randomOrder: { $rand: {} } } },
                        {
                            $sort: {
                                teacherApprovedCount: -1,
                                usageCount: 1,
                                lastUsedAt: 1,
                                _randomOrder: 1,
                            },
                        },
                        { $limit: candidateLimit },
                        {
                            $lookup: {
                                from: "options",
                                localField: "options",
                                foreignField: "_id",
                                as: "options",
                            },
                        },
                        {
                            $project: {
                                questionId: 1,
                                questionType: 1,
                                questionTitle: 1,
                                chapter: 1,
                                chapterName: 1,
                                questionStem: 1,
                                options: 1,
                                answer: 1,
                                answerKey: 1,
                                explanation: 1,
                                difficultyLevel: 1,
                                skillType: 1,
                                normalizedQuestion: 1,
                                usageCount: 1,
                                lastUsedAt: 1,
                                teacherApprovedCount: 1,
                                generatedBySchools: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            },
                        },
                    ]);

                    const rankedCandidates = rankBankQuestionsForFreshness(
                        rawCandidates,
                        {
                            actor,
                            section,
                            existingQuestions,
                        },
                    )
                        .slice(0, candidateLimit)
                        .map((question) => ({
                            ...question,
                            skillType: effectiveSkillType,
                            marks: Number(section.marksOfEachQuestion || 1),
                            marksOfEachQuestion: Number(
                                section.marksOfEachQuestion || 1,
                            ),
                            chapter: selectedChapter,
                            targetChapterId: section.targetChapterId || null,
                            targetChapterName:
                                section.targetChapterName || "",
                            sourceMode: "question_bank",
                            sourceLabel: "Question Bank",
                        }));

                    return rankedCandidates.slice(0, limit);
                }),
            );

            return questionsForSection.flat().slice(0, requiredCount);
        }),
    );

    const reusedQuestionIds = result
        .flat()
        .map((question) => question?._id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (reusedQuestionIds.length) {
        await QuestionBase.updateMany(
            { _id: { $in: reusedQuestionIds } },
            {
                $inc: { usageCount: 1 },
                $set: { lastUsedAt: new Date() },
            },
        );
    }

    return { questions: result, warnings };
};

const safeJsonParseArray = (rawText) => {
    if (!rawText) return [];

    let text = String(rawText).trim();

    text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : parsed.questions || [];
    } catch (_) {
        const firstBracket = text.indexOf("[");
        const lastBracket = text.lastIndexOf("]");

        if (
            firstBracket !== -1 &&
            lastBracket !== -1 &&
            lastBracket > firstBracket
        ) {
            const jsonOnly = text.slice(firstBracket, lastBracket + 1);
            const parsed = JSON.parse(jsonOnly);
            return Array.isArray(parsed) ? parsed : [];
        }

        throw new Error("AIRA response was not valid JSON. Please regenerate.");
    }
};
const normalizeQuestionTypeName = (type = "") => {
    const value = String(type || "")
        .trim()
        .toLowerCase();

    if (
        value === "mcq" ||
        value === "multiple choice" ||
        value === "multiple choice questions"
    ) {
        return "MCQ";
    }

    if (
        value === "fill in the blanks" ||
        value === "fill in the blank" ||
        value === "fillups" ||
        value === "fill ups"
    ) {
        return "Fill In the Blanks";
    }

    if (value === "true or false" || value === "true/false") {
        return "True or False";
    }

    // Keep these TWO question types separate
    if (value === "very short answer") {
        return "Very Short Answer";
    }

    if (value === "short answer") {
        return "Short Answer";
    }

    if (value === "long answer") {
        return "Long Answer";
    }

    return type;
};

const cleanGeneratedQuestionText = (value = "") => {
    return cleanQuestionPaperText(value);
};

const normalizeGeneratedQuestionText = (text = "") => {
    return String(text || "")
        .toLowerCase()
        .replace(/`/g, "")
        .replace(/\\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/â‚¹/g, "₹")
        .replace(/\s+/g, " ")
        .trim();
};

const countAnswerWords = (value = "") => {
    return normalizeGeneratedQuestionText(value)
        .split(" ")
        .filter(Boolean).length;
};

const getMainQuestionText = (question = {}) => {
    return String(
        question.question ||
            question.questionStem ||
            question.questionText ||
            "",
    );
};

const getMainAnswerText = (question = {}) => {
    const answer =
        question.correctAnswer ?? question.answer ?? question.answerKey ?? "";

    if (typeof answer === "boolean") return String(answer);

    return String(answer || "");
};

const getQuestionWords = (text = "") => {
    const stopWords = new Set([
        "what",
        "which",
        "when",
        "where",
        "why",
        "how",
        "the",
        "this",
        "that",
        "these",
        "those",
        "with",
        "from",
        "into",
        "about",
        "using",
        "used",
        "called",
        "because",
        "student",
        "students",
        "program",
        "question",
        "answer",
        "blank",
        "fill",
        "following",
        "correctly",
        "best",
        "describes",
        "explain",
        "reason",
        "choose",
        "select",
        "identify",
        "given",
        "below",
        "above",
        "true",
        "false",
    ]);

    return new Set(
        normalizeGeneratedQuestionText(text)
            .split(" ")
            .filter((word) => word.length > 2 && !stopWords.has(word)),
    );
};

const getQuestionSimilarityScore = (a = "", b = "") => {
    const wordsA = getQuestionWords(a);
    const wordsB = getQuestionWords(b);

    if (!wordsA.size || !wordsB.size) return 0;

    const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
    const union = new Set([...wordsA, ...wordsB]).size;

    return union === 0 ? 0 : intersection / union;
};

const hasAnyPhrase = (text = "", phrases = []) => {
    const normalizedText = normalizeGeneratedQuestionText(text);

    return phrases.some((phrase) =>
        normalizedText.includes(normalizeGeneratedQuestionText(phrase)),
    );
};

const detectQuestionDomain = ({ chapter = {}, section = {} }) => {
    const text = [
        chapter.name,
        chapter.courseName,
        chapter.course?.name,
        section.questionType,
        section.skillType,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
        text.includes("python") ||
        text.includes("coding") ||
        text.includes("programming") ||
        text.includes("loop") ||
        text.includes("variable") ||
        text.includes("algorithm")
    ) {
        return "Programming";
    }

    if (
        text.includes("ai") ||
        text.includes("artificial intelligence") ||
        text.includes("machine learning") ||
        text.includes("model") ||
        text.includes("prediction") ||
        text.includes("computer vision") ||
        text.includes("nlp")
    ) {
        return "Artificial Intelligence";
    }

    if (
        text.includes("data") ||
        text.includes("chart") ||
        text.includes("graph") ||
        text.includes("visualisation") ||
        text.includes("visualization") ||
        text.includes("analysis") ||
        text.includes("spreadsheet")
    ) {
        return "Data Science";
    }

    if (
        text.includes("cyber") ||
        text.includes("password") ||
        text.includes("privacy") ||
        text.includes("phishing") ||
        text.includes("malware") ||
        text.includes("internet safety")
    ) {
        return "Cyber Security";
    }

    if (
        text.includes("robot") ||
        text.includes("sensor") ||
        text.includes("arduino") ||
        text.includes("motor") ||
        text.includes("automation")
    ) {
        return "Robotics";
    }

    if (
        text.includes("html") ||
        text.includes("css") ||
        text.includes("web") ||
        text.includes("website")
    ) {
        return "Web Design";
    }

    if (
        text.includes("word") ||
        text.includes("powerpoint") ||
        text.includes("excel") ||
        text.includes("paint") ||
        text.includes("canva") ||
        text.includes("software")
    ) {
        return "Software Tools";
    }

    return "Digital Literacy";
};

const getDomainInstruction = (domain) => {
    const instructions = {
        "Digital Literacy":
            "Use digital devices, files, folders, internet use, online information, classroom technology, and responsible digital habits.",

        Programming:
            "Use variables, loops, conditions, input-output, debugging, logic, algorithms, code tracing, and problem-solving.",

        "Artificial Intelligence":
            "Use data, training, models, prediction, classification, bias, responsible AI, computer vision, NLP, and AI decision-making.",

        "Data Science":
            "Use data collection, tables, charts, graphs, patterns, comparison, trends, outliers, interpretation, and decisions from data.",

        "Cyber Security":
            "Use passwords, privacy, phishing, suspicious links, safe sharing, cyberbullying, malware, online safety, and responsible internet behaviour.",

        Robotics:
            "Use sensors, actuators, motors, LEDs, buzzers, input-process-output, automation, conditions, and real robot behaviour.",

        "Web Design":
            "Use web pages, HTML tags, CSS styling, layout, links, images, headings, paragraphs, structure, and browser output.",

        "Software Tools":
            "Use menus, tabs, commands, icons, document editing, presentations, spreadsheets, formulas, charts, formatting, and workflow tasks.",
    };

    return instructions[domain] || instructions["Digital Literacy"];
};

const isDirectRecallQuestion = (questionText = "") => {
    const directRecallPatterns = [
        "what is",
        "what are",
        "which is",
        "which of these",
        "which one",
        "which sign",
        "which block",
        "which ribbon",
        "which function",
        "which option",
        "what does",
        "what do",
        "define",
        "full form",
        "stands for",
        "is called",
        "used for",
        "name the",
    ];

    return hasAnyPhrase(questionText, directRecallPatterns);
};

const hasScenarioOrThinkingCue = (questionText = "") => {
    const scenarioCues = [
        "a student",
        "students",
        "teacher",
        "class",
        "school",
        "project",
        "activity",
        "lab",
        "worksheet",
        "creating",
        "making",
        "designing",
        "building",
        "wants to",
        "needs to",
        "has to",
        "trying to",
        "if",
        "when",
        "because",
        "why",
        "reason",
        "problem",
        "error",
        "wrong",
        "not working",
        "output",
        "result",
        "predict",
        "choose the best",
        "best action",
        "best step",
        "improve",
        "fix",
        "correct sequence",
        "what should",
        "what will happen",
        "what would happen",
    ];

    return hasAnyPhrase(questionText, scenarioCues);
};

const getConceptSignature = (question = {}) => {
    const questionText = getMainQuestionText(question);
    const answerText = getMainAnswerText(question);

    return [...getQuestionWords(`${questionText} ${answerText}`)]
        .slice(0, 12)
        .join(" ");
};

const getScenarioSignature = (question = {}) => {
    const text = normalizeGeneratedQuestionText(getMainQuestionText(question));

    const weakWords = new Set([
        "which",
        "what",
        "where",
        "when",
        "because",
        "question",
        "answer",
        "student",
        "teacher",
        "correct",
        "following",
        "option",
        "choose",
        "select",
    ]);

    const words = text
        .split(" ")
        .filter((word) => word.length > 4 && !weakWords.has(word));

    return [...new Set(words)].slice(0, 10).join(" ");
};

const hasSameScenario = (question, existing) => {
    const currentSignature = getScenarioSignature(question);
    const existingSignature = getScenarioSignature(existing);

    if (!currentSignature || !existingSignature) return false;

    return (
        getQuestionSimilarityScore(currentSignature, existingSignature) >= 0.45
    );
};

const isDuplicateQuestion = (question, existingQuestions = []) => {
    const currentText = getMainQuestionText(question);
    const currentAnswer = normalizeGeneratedQuestionText(
        getMainAnswerText(question),
    );
    const currentConcept = getConceptSignature(question);

    if (!currentText.trim()) return true;

    return existingQuestions.some((existing) => {
        const existingText = getMainQuestionText(existing);
        const existingAnswer = normalizeGeneratedQuestionText(
            getMainAnswerText(existing),
        );
        const existingConcept = getConceptSignature(existing);

        if (!existingText.trim()) return false;

        const exactQuestionMatch =
            normalizeGeneratedQuestionText(currentText) ===
            normalizeGeneratedQuestionText(existingText);

        const nearQuestionMatch =
            getQuestionSimilarityScore(currentText, existingText) >= 0.5;

        const sameConcept =
            currentConcept &&
            existingConcept &&
            getQuestionSimilarityScore(currentConcept, existingConcept) >= 0.45;

        const sameAnswer =
            currentAnswer &&
            existingAnswer &&
            currentAnswer === existingAnswer &&
            currentAnswer.length > 2;

        const sameScenario = hasSameScenario(question, existing);
        const answerLedNearDuplicate =
            sameAnswer &&
            getQuestionSimilarityScore(currentText, existingText) >= 0.3;

        return (
            exactQuestionMatch ||
            nearQuestionMatch ||
            sameConcept ||
            sameScenario ||
            (sameAnswer && sameConcept) ||
            answerLedNearDuplicate
        );
    });
};

const RECENT_BANK_REUSE_DAYS = Number(
    process.env.QP_RECENT_BANK_REUSE_DAYS || 45,
);

const getRecentReuseCutoff = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_BANK_REUSE_DAYS);
    return cutoff;
};

const wasRecentlyUsedBySameSchool = (question = {}, actor = {}) => {
    if (!actor?.school) return false;

    const schoolId = String(actor.school);
    const generatedBySchools = Array.isArray(question.generatedBySchools)
        ? question.generatedBySchools.map(String)
        : [];

    if (!generatedBySchools.includes(schoolId)) return false;

    if (!question.lastUsedAt) return true;

    return new Date(question.lastUsedAt) >= getRecentReuseCutoff();
};

const scoreBankQuestionFreshness = (
    question = {},
    { actor = {}, existingQuestions = [] } = {},
) => {
    let score = 0;

    score += Number(question.teacherApprovedCount || 0) * 6;
    score -= Number(question.usageCount || 0) * 2;

    if (question.lastUsedAt) {
        const ageDays =
            (Date.now() - new Date(question.lastUsedAt).getTime()) /
            (1000 * 60 * 60 * 24);
        score += Math.min(Math.max(ageDays, 0), 90) * 0.25;
    } else {
        score += 8;
    }

    if (wasRecentlyUsedBySameSchool(question, actor)) {
        score -= 30;
    }

    if (isDuplicateQuestion(question, existingQuestions)) {
        score -= 100;
    }

    const questionText = getMainQuestionText(question);

    if (isDirectRecallQuestion(questionText)) {
        score -= 4;
    }

    return score;
};

const rankBankQuestionsForFreshness = (
    questions = [],
    { actor = {}, section = {}, existingQuestions = [] } = {},
) => {
    if (!Array.isArray(questions) || !questions.length) return [];

    const ranked = [...questions].sort((a, b) => {
        const scoreDiff =
            scoreBankQuestionFreshness(b, {
                actor,
                section,
                existingQuestions,
            }) -
            scoreBankQuestionFreshness(a, {
                actor,
                section,
                existingQuestions,
            });

        if (scoreDiff !== 0) return scoreDiff;

        return Number(a.usageCount || 0) - Number(b.usageCount || 0);
    });

    const selected = [];

    for (const candidate of ranked) {
        if (isDuplicateQuestion(candidate, [...existingQuestions, ...selected])) {
            continue;
        }

        selected.push(candidate);
    }

    const selectedIds = new Set(
        selected
            .map((question) =>
                question?._id ? String(question._id) : null,
            )
            .filter(Boolean),
    );

    const leftovers = ranked.filter((question) => {
        const id = question?._id ? String(question._id) : null;
        return !id || !selectedIds.has(id);
    });

    return [...selected, ...leftovers];
};

const getMinimumFreshAiraQuota = ({
    section = {},
    chapterCount = 0,
    hasIndexedChapterSource = false,
}) => {
    const required = Number(section.numberOfQuestions || 0);

    if (!hasIndexedChapterSource || required <= 1) return 0;

    if (required >= 8) return Math.min(3, required);
    if (required >= 4) return 2;
    if (required >= 2) return 1;

    return 0;
};

const isSameStoredQuestion = (question, existing = {}) => {
    const currentText = normalizeGeneratedQuestionText(
        getMainQuestionText(question),
    );
    const existingText = normalizeGeneratedQuestionText(
        existing.normalizedQuestion || getMainQuestionText(existing),
    );

    return Boolean(currentText && existingText && currentText === existingText);
};

const getQuestionModelForType = (questionType) => {
    const models = {
        MCQ: MCQQuestion,
        "Very Short Answer": VeryShortAnswerQuestion,
        "True or False": TrueFalseQuestion,
        "Short Answer": ShortAnswerQuestion,
        "Fill In the Blanks": FillBlanksQuestion,
        "Long Answer": LongAnswerQuestion,
    };

    return models[normalizeQuestionTypeName(questionType)] || null;
};

let questionPersistenceQueue = Promise.resolve();

const queueQuestionPersistence = async (worker) => {
    const previous = questionPersistenceQueue;
    let release;

    questionPersistenceQueue = new Promise((resolve) => {
        release = resolve;
    });

    await previous;

    try {
        return await worker();
    } finally {
        release();
    }
};

const persistAiraQuestionsToBank = async ({
    questions = [],
    chapter,
    actor = {},
}) => {
    const persisted = [];

    for (const question of questions) {
        try {
            const questionType = normalizeQuestionTypeName(question.questionType);
            const QuestionModel = getQuestionModelForType(questionType);
            const chapterId = question.chapter || chapter?.qbChapterId || chapter?._id;

            if (!QuestionModel || !mongoose.Types.ObjectId.isValid(chapterId)) {
                persisted.push(question);
                continue;
            }

            const normalizedQuestion = normalizeGeneratedQuestionText(
                getMainQuestionText(question),
            );
            const difficultyLevel =
                question.difficultyLevel || question.difficulty || "Medium";
            const skillType = question.skillType || "Concept Check";
            const exactStoredQuestion = await QuestionBase.findOne({
                chapter: chapterId,
                questionType,
                difficultyLevel,
                skillType,
                normalizedQuestion,
            })
                .populate("options")
                .sort({ teacherApprovedCount: -1, usageCount: -1 });

            // Older bank questions may predate normalizedQuestion. Keep a
            // narrow fallback so exact legacy duplicates are reused without
            // treating merely similar questions as the same stored question.
            const legacyCandidates = exactStoredQuestion
                ? []
                : await QuestionBase.find({
                      chapter: chapterId,
                      questionType,
                      difficultyLevel,
                      ...(skillType === "Concept Check"
                          ? {
                                $and: [
                                    {
                                        $or: [
                                            { skillType: "Concept Check" },
                                            { skillType: "" },
                                            { skillType: { $exists: false } },
                                        ],
                                    },
                                    {
                                        $or: [
                                            { normalizedQuestion: "" },
                                            {
                                                normalizedQuestion: {
                                                    $exists: false,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            }
                          : {
                                skillType,
                                $or: [
                                    { normalizedQuestion: "" },
                                    {
                                        normalizedQuestion: {
                                            $exists: false,
                                        },
                                    },
                                ],
                            }),
                  })
                      .populate("options")
                      .sort({ teacherApprovedCount: -1, usageCount: -1 })
                      .limit(150);

            const duplicate =
                exactStoredQuestion ||
                legacyCandidates.find((candidate) =>
                    isSameStoredQuestion(question, candidate.toObject()),
                );

            if (duplicate) {
                duplicate.usageCount = Number(duplicate.usageCount || 0) + 1;
                duplicate.lastUsedAt = new Date();
                if (!duplicate.normalizedQuestion) {
                    duplicate.normalizedQuestion = normalizedQuestion;
                }
                if (actor.school) duplicate.generatedBySchools.addToSet(actor.school);
                if (actor.user) duplicate.generatedByUsers.addToSet(actor.user);
                await duplicate.save();

                persisted.push({
                    ...question,
                    _id: duplicate._id,
                    questionId: duplicate.questionId,
                    source: "question_bank",
                    sourceMode: "question_bank",
                    sourceLabel: "Question Bank",
                    reusedFromBank: true,
                });
                continue;
            }

            const commonFields = {
                questionType,
                questionTitle: question.questionTitle || `${chapter?.name || "Chapter"} - AIRA Generated`,
                gradeName: question.gradeName || "",
                course: chapter?.course?._id || chapter?.course || undefined,
                courseName: chapter?.course?.name || chapter?.courseName || "",
                chapter: chapterId,
                chapterName: question.chapterName || chapter?.name || "",
                difficultyLevel,
                skillType,
                questionStem: getMainQuestionText(question),
                explanation: question.explanation || "Generated from the selected chapter.",
                source: "aira",
                normalizedQuestion,
                usageCount: 1,
                lastUsedAt: new Date(),
                generatedBySchools: actor.school ? [actor.school] : [],
                generatedByUsers: actor.user ? [actor.user] : [],
            };

            let savedQuestion;

            if (questionType === "MCQ") {
                const optionIds = await Promise.all(
                    (question.options || []).slice(0, 4).map(async (option, index) => {
                        const savedOption = await Option.create({
                            option:
                                typeof option === "string"
                                    ? option
                                    : option.option || option.text || option.value || "",
                            optionNumber: option.optionNumber || index + 1,
                        });
                        return savedOption._id;
                    }),
                );
                savedQuestion = await MCQQuestion.create({
                    ...commonFields,
                    options: optionIds,
                    answer: String(getMainAnswerText(question)),
                });
            } else if (questionType === "True or False") {
                savedQuestion = await TrueFalseQuestion.create({
                    ...commonFields,
                    answer:
                        typeof question.answer === "boolean"
                            ? question.answer
                            : String(getMainAnswerText(question)).toLowerCase() === "true",
                });
            } else if (questionType === "Very Short Answer") {
                savedQuestion = await VeryShortAnswerQuestion.create({
                    ...commonFields,
                    answer: String(getMainAnswerText(question)),
                    answerVariations: question.answerVariations || [],
                });
            } else {
                savedQuestion = await QuestionModel.create({
                    ...commonFields,
                    answer: String(getMainAnswerText(question)),
                });
            }

            persisted.push({
                ...question,
                _id: savedQuestion._id,
                questionId: savedQuestion.questionId,
                savedToQuestionBank: true,
            });
        } catch (error) {
            console.warn("Unable to persist AIRA question to bank:", error.message);
            persisted.push(question);
        }
    }

    return persisted;
};
const splitIntoGenerationBatches = (count, batchSize = 5) => {
    const batches = [];
    let remaining = Number(count || 0);

    while (remaining > 0) {
        const currentBatch = Math.min(batchSize, remaining);
        batches.push(currentBatch);
        remaining -= currentBatch;
    }

    return batches;
};

const buildAvoidQuestionsText = (questions = []) => {
    if (!questions.length) return "None yet.";

    return questions
        .slice(-8)
        .map((question, index) => {
            return `${index + 1}. ${
                question.question || question.questionStem || ""
            }`;
        })
        .join("\n");
};

const normalizeAiraQuestion = ({
    question,
    questionType,
    chapter,
    section,
    difficultyLevel,
}) => {
    const normalizedQuestionType = normalizeQuestionTypeName(
        section?.questionType || questionType || question.questionType,
    );

    const stem = cleanQuestionPaperText(
        question.questionStem || question.question || question.Question || "",
    );

    const rawAnswer =
        question.answer ??
        question.correctAnswer ??
        question.correct_answer ??
        question.Answer ??
        "";

    const cleanedAnswer = cleanQuestionPaperText(rawAnswer);

    const explanation = cleanQuestionPaperText(
        question.explanation || question.reason || "",
    );

    let options = [];

    if (normalizedQuestionType === "MCQ") {
        const rawOptions = question.options || question.Options || [];

        options = rawOptions
            .map((option, index) => {
                if (typeof option === "string") {
                    return {
                        option: cleanQuestionPaperText(option),
                        optionNumber: index + 1,
                    };
                }

                return {
                    option: cleanQuestionPaperText(
                        option.option || option.text || option.value || "",
                    ),
                    optionNumber: option.optionNumber || index + 1,
                };
            })
            .filter((option) => String(option.option || "").trim())
            .slice(0, 4);
    }

    let normalizedAnswer = cleanedAnswer;

    if (normalizedQuestionType === "True or False") {
        if (typeof rawAnswer === "string") {
            normalizedAnswer =
                rawAnswer.trim().toLowerCase() === "true" ? true : false;
        } else {
            normalizedAnswer = Boolean(rawAnswer);
        }
    }

    const skillType =
        question.skillType ||
        question.questionSkill ||
        section?.skillType ||
        "Concept Check";

    const difficulty =
        question.difficulty ||
        question.difficultyLevel ||
        difficultyLevel ||
        "Medium";

    return {
        _id: `aira_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        questionId: null,

        questionType: normalizedQuestionType,
        type: normalizedQuestionType,

        difficulty,
        difficultyLevel: difficulty,
        skillType,

        questionTitle:
            question.questionTitle || `${chapter.name} - AIRA Generated`,

        chapter: section?.targetChapterId || chapter.qbChapterId || chapter._id,
        chapterId:
            section?.targetChapterId || chapter.qbChapterId || chapter._id,
        courseChapterId: chapter._id,
        chapterName: chapter.name,

        question: stem,
        questionStem: stem,

        options,

        answer: normalizedAnswer,
        correctAnswer: normalizedAnswer,
        answerKey:
            typeof normalizedAnswer === "boolean"
                ? String(normalizedAnswer)
                : cleanQuestionPaperText(normalizedAnswer),

        explanation,

        marks: Number(question.marks || section?.marksOfEachQuestion || 1) || 1,
        marksOfEachQuestion: section?.marksOfEachQuestion,

        source: "aira",
        sourceMode: "aira",
        sourceLabel: "AIRA Generated",
        isAiraGenerated: true,
    };
};

const buildAiraPrompt = ({
    chapter,
    section,
    difficultyLevel,
    count,
    grade,
    existingQuestions = [],
    round = 0,
    qualityControls = {},
}) => {
    const effectiveDifficulty =
        section.difficultyLevel || difficultyLevel || "Medium";

    const questionType = normalizeQuestionTypeName(section.questionType);
    const skillType = section.skillType || "Concept Check";
    const languageLevel = qualityControls.languageLevel || "Exam-style";
    const aiWording = qualityControls.aiWording || "avoid";
    const repeatControl = qualityControls.repeatControl || "strict";
    const textbookMode = qualityControls.textbookMode || "prefer";
    const hotsLevel = qualityControls.hotsLevel || "Medium";
    const strictChapterOnly = qualityControls.strictChapterOnly !== false;

    const domain = detectQuestionDomain({ chapter, section });
    const domainInstruction = getDomainInstruction(domain);

    const avoidList = buildAvoidQuestionsText(existingQuestions)
        .split("\n")
        .slice(0, 8)
        .join("\n");

    const skillInstructionMap = {
        "Concept Check":
            "Ask direct understanding-based questions. Basic recall is allowed only here.",

        "Application Based":
            "Every question must include a small situation and ask the student to apply the concept. Avoid direct recall.",

        "Competency Based":
            "Use a practical classroom/lab/life situation and test decision-making.",

        HOTS: "Require reasoning, prediction, comparison, cause-effect, or decision-making. Avoid direct recall.",

        "Real-life Scenario":
            "Use a familiar real-world situation and ask what should be done or chosen.",

        "Case Study": "Include a short case/scenario and ask based on it.",

        "Reasoning Based":
            "Require logic, inference, comparison, or justification.",

        "Activity Based": "Connect to a classroom/lab/project activity.",

        "Tool/Software Based":
            "Use tool features, menus, buttons, tabs, commands, or workflows.",

        "Ethics & Safety Based":
            "Use privacy, responsible use, cyber safety, bias, or digital citizenship context.",

        "Troubleshooting Based":
            "Include a problem/error/unexpected result and ask for cause or fix.",

        "Creative Thinking":
            "Ask the student to design, improve, imagine, or propose a solution.",

        "Coding Based":
            "Use coding/programming logic. Code must use real line breaks.",

        Debugging:
            "Include wrong code, wrong steps, or wrong logic and ask to fix it.",

        "Output Prediction":
            "Include code, steps, formula, data, or logic and ask for output/result.",

        "Algorithm Thinking": "Ask for sequence, steps, logic, or procedure.",

        "AI Prediction":
            "Use AI model/data/training/prediction/classification context.",

        "Data Interpretation":
            "Provide simple data/table/values and ask to interpret or compare.",

        "Cyber Safety Scenario":
            "Use password, phishing, privacy, suspicious link, or safe sharing context.",

        "Robotics Logic":
            "Use sensors, actuators, input-process-output, automation, or robot behaviour.",
    };

    const skillInstruction =
        skillInstructionMap[skillType] ||
        "Generate grade-appropriate questions matching the selected skill.";
    const applicationMcqInstruction =
        skillType === "Application Based" && questionType === "MCQ"
            ? `Application MCQ format rule:
- Start each question with a clear chapter-grounded mini-situation only when the chapter naturally supports it.
- Prefer direct situations from the chapter topic, commands, steps, blocks, tools, outputs, or textbook examples.
- Do not invent unrelated game names, project stories, or random classroom scenes unless that exact type of example is clearly present in the chapter.
- Ask the student to choose the best action, block, option, step, or result for that situation.
- Do not write direct definition or recall-only MCQs.`
            : "";
    const visibleSkillInstructionMap = {
        "Application Based":
            'The question text must visibly include an application situation, but keep it directly tied to the chapter content, command usage, block behavior, tool action, or textbook example.',
        HOTS: 'The question text must visibly require thinking using words or structure such as why, predict, compare, decide, if, cause/effect, improve, error, or what will happen.',
        "Output Prediction":
            "The question text must visibly include code, steps, values, logic, or an input/output situation whose result must be predicted.",
        Debugging:
            "The question text must visibly include an error, wrong step, wrong logic, or broken code to fix.",
        "Troubleshooting Based":
            "The question text must visibly describe a problem, unexpected result, or not-working situation.",
        "Case Study":
            "The question text must visibly include a short case or scenario before asking the question.",
    };
    const visibleSkillInstruction =
        visibleSkillInstructionMap[skillType] ||
        "Make the selected skill visible in the question wording, not only in the JSON skillType field.";
    const retryStyleInstruction =
        round > 0 && skillType !== "Concept Check"
            ? `Retry reminder:
- Previous attempts may be rejected when the selected skill is not obvious in the question text.
- Make the ${skillType} style unmistakable in every new question.`
            : "";

    return `
Generate exactly ${count} ${questionType} question(s) from the selected chapter PDF only.

Chapter: ${chapter.name}
Domain: ${domain}
Grade: ${grade || "school"}
Question Type: ${questionType}
Difficulty: ${effectiveDifficulty}
Skill: ${skillType}
Marks: ${section.marksOfEachQuestion}

Domain rule:
${domainInstruction}

Skill rule:
${skillInstruction}

Visible skill rule:
${visibleSkillInstruction}

${applicationMcqInstruction}

${retryStyleInstruction}

Question type rules:
${
        questionType === "Very Short Answer"
            ? `- Ask only a crisp direct question.
- Do not ask "explain", "describe", "compare", "justify", or other long-answer prompts.
- The expected answer must be a word, phrase, value, output, command, or at most one very short line.`
            : questionType === "Short Answer"
              ? `- Ask for a brief explanation, comparison, reasoning step, prediction, or short process.
- Do not generate one-word or pure label-style answers.
- The expected answer should usually be 1 to 3 concise sentences.`
              : questionType === "MCQ"
                ? `- Each question must have exactly four distinct options and one clearly correct answer.`
                : ""
    }

Cross-section repetition rule:
- Do not test the same micro-concept, same code snippet, same fact, or same answer pattern that already appears in the avoid list.
- If another section already covers a concept, ask a meaningfully different concept or situation here.

Context grounding rule:
- Keep every question tightly anchored to the selected chapter.
- Do not suddenly switch to unrelated Balloon Popper, project, shopping, festival, or story contexts unless the selected chapter explicitly teaches that exact example.
- Prefer real textbook flow, actual block usage, direct code behavior, chapter terminology, and immediate in-chapter situations over invented scenarios.
- Prefer chapter concepts, commands, examples, outputs, definitions, comparisons, and step logic over worksheet labels, game titles, challenge page names, or project headings.
- If the chapter contains projects, games, activities, or wrap-up tasks, ask about the concept being taught through them, not the decorative activity title itself.

Quality controls:
- Language level: ${languageLevel}. ${
        languageLevel === "Simple"
            ? "Use short sentences and grade-friendly words."
            : languageLevel === "Standard"
              ? "Use clear school-level wording without unnecessary complexity."
              : "Use formal exam wording, but keep it age-appropriate."
    }
- AI-heavy wording: ${aiWording}. ${
        aiWording === "avoid"
            ? "Do not force AI, NLP, computer vision, dataset, model, or prediction wording unless the selected chapter itself teaches those ideas."
            : "AI-related wording is allowed only when it naturally fits the chapter."
    }
- Repetition control: ${repeatControl}. ${
        repeatControl === "strict"
            ? "Avoid repeated openings such as 'Understanding...', repeated situations, repeated verbs, and repeated answer patterns."
            : "Avoid obvious repeated questions."
    }
- Textbook wording: ${textbookMode}. ${
        textbookMode === "prefer"
            ? "Prefer direct textbook concepts and classroom wording over stretched analogies."
            : "Balance textbook wording with application contexts."
    }
- HOTS level: ${hotsLevel}. Use this only for HOTS/reasoning/application skills; do not make basic concept questions unnecessarily complex.
- Strict chapter-only mode: ${strictChapterOnly ? "ON" : "OFF"}. ${
        strictChapterOnly
            ? "Use only concepts clearly present in the selected chapter PDF. Do not import outside concepts."
            : "You may use simple familiar context, but the tested concept must still come from the chapter."
    }

Avoid repeating these questions:
${avoidList || "None"}

Return ONLY valid JSON array. No markdown. No explanation outside JSON.

JSON format:
[
  {
    "questionType": "${questionType}",
    "difficulty": "${effectiveDifficulty}",
    "skillType": "${skillType}",
    "marks": ${Number(section.marksOfEachQuestion || 1)},
    "question": "question text",
    "questionStem": "question text",
    "options": [],
    "correctAnswer": "answer",
    "answer": "answer",
    "explanation": "short explanation",
    "source": "aira"
  }
]

Rules:
- Match the requested question type and skill.
- Use different subtopics from the chapter.
- Do not repeat concept, answer, example, scenario, name, code, or wording.
- Use different contexts suitable to the domain.
- Use different names or avoid names.
- MCQ: exactly 4 meaningful options.
- Fill In the Blanks: exactly one ________ and short answer.
- True or False: answer must be true or false.
- HTML tags must be wrapped in backticks, like \`<h1>\`.
- Code must use real line breaks, not escaped \\n.
- Quality is more important than count.
- Retry round: ${round}
`;
};

const isSkillStyleMismatch = (question, section) => {
    const questionText = getMainQuestionText(question);
    const skillType =
        section?.skillType || question?.skillType || "Concept Check";
    const normalizedSkill = String(skillType || "").trim();
    const questionType = normalizeQuestionTypeName(section?.questionType);

    const directRecall = isDirectRecallQuestion(questionText);
    const hasCue = hasScenarioOrThinkingCue(questionText);

    if (normalizedSkill === "Concept Check") {
        return false;
    }

    if (normalizedSkill === "Application Based") {
        const applicationCues = [
            "wants to",
            "needs to",
            "has to",
            "trying to",
            "creating",
            "making",
            "preparing",
            "working on",
            "using",
            "project",
            "task",
            "activity",
            "which should",
            "what should",
            "best option",
            "best step",
            "choose the correct action",
        ];

        const hasApplicationCue = hasAnyPhrase(
            questionText,
            applicationCues,
        );

        if (!hasApplicationCue && !hasCue) return true;

        // Scenario MCQs can still contain phrases such as "which block" or
        // "which option". Keep rejecting recall-only items, but allow them
        // when the prompt carries an actual application situation.
        if (directRecall && !hasApplicationCue) return true;
    }

    if (normalizedSkill === "HOTS") {
        const hotsCues = [
            "why",
            "because",
            "reason",
            "what will happen",
            "what would happen",
            "predict",
            "compare",
            "decide",
            "best",
            "effect",
            "impact",
            "if",
            "error",
            "wrong",
            "improve",
        ];

        if (!hasAnyPhrase(questionText, hotsCues)) return true;
        if (directRecall) return true;

        if (questionType === "Fill In the Blanks") {
            const hotsFillCues = [
                "because",
                "so that",
                "therefore",
                "if",
                "when",
                "reason",
                "effect",
                "impact",
                "would happen",
                "can be solved",
                "helps to",
                "makes it easier",
                "prevents",
            ];

            if (!hasAnyPhrase(questionText, hotsFillCues)) return true;
        }
    }

    if (
        [
            "Competency Based",
            "Real-life Scenario",
            "Case Study",
            "Reasoning Based",
            "Troubleshooting Based",
            "Creative Thinking",
            "Activity Based",
            "Ethics & Safety Based",
            "Cyber Safety Scenario",
            "Robotics Logic",
        ].includes(normalizedSkill)
    ) {
        if (!hasCue) return true;
        if (directRecall) return true;
    }

    if (
        [
            "Coding Based",
            "Debugging",
            "Output Prediction",
            "Algorithm Thinking",
        ].includes(normalizedSkill)
    ) {
        const codeLogicCues = [
            "code",
            "program",
            "output",
            "error",
            "debug",
            "loop",
            "condition",
            "variable",
            "algorithm",
            "steps",
            "sequence",
            "logic",
            "result",
        ];

        if (!hasAnyPhrase(questionText, codeLogicCues)) return true;
    }

    if (normalizedSkill === "Data Interpretation") {
        const dataCues = [
            "table",
            "chart",
            "data",
            "value",
            "values",
            "compare",
            "highest",
            "lowest",
            "average",
            "total",
            "graph",
            "number",
            "numbers",
        ];

        if (!hasAnyPhrase(questionText, dataCues)) return true;
    }

    if (normalizedSkill === "AI Prediction") {
        const aiCues = [
            "ai",
            "model",
            "training",
            "data",
            "prediction",
            "predict",
            "classify",
            "recognize",
            "input",
            "output",
        ];

        if (!hasAnyPhrase(questionText, aiCues)) return true;
    }

    if (
        normalizedSkill === "Tool/Software Based" &&
        !hasAnyPhrase(questionText, [
            "tool",
            "menu",
            "tab",
            "button",
            "icon",
            "command",
            "option",
            "feature",
            "insert",
            "select",
            "click",
            "open",
            "use",
        ])
    ) {
        return true;
    }

    return false;
};

const getQuestionValidationResult = (
    question,
    section,
    existingQuestions = [],
) => {
    const questionText = getMainQuestionText(question);
    const answerText = getMainAnswerText(question);
    const questionType = normalizeQuestionTypeName(section.questionType);
    const normalizedQuestionText = normalizeGeneratedQuestionText(questionText);
    const answerWordCount = countAnswerWords(answerText);
    const longAnswerCues = [
        "explain",
        "describe",
        "compare",
        "justify",
        "give reason",
        "why",
        "how does",
        "how do",
        "differentiate",
        "discuss",
    ];
    const shortAnswerCues = [
        "how",
        "why",
        "explain",
        "describe",
        "compare",
        "predict",
        "what happens",
        "what will happen",
        "give reason",
        "justify",
    ];

    if (!String(questionText).trim()) {
        return { valid: false, reason: "missing-question-text" };
    }

    if (String(questionText).trim().length < 20) {
        return { valid: false, reason: "question-too-short" };
    }

    if (isDuplicateQuestion(question, existingQuestions)) {
        return { valid: false, reason: "duplicate-question" };
    }

    if (isSkillStyleMismatch(question, section)) {
        return { valid: false, reason: "skill-style-mismatch" };
    }

    if (questionType === "MCQ") {
        const options = Array.isArray(question.options) ? question.options : [];

        if (options.length < 4) {
            return { valid: false, reason: "mcq-options-missing" };
        }

        const optionTexts = options.map((option) =>
            normalizeGeneratedQuestionText(
                typeof option === "string"
                    ? option
                    : option.option || option.text || option.value || "",
            ),
        );

        const uniqueOptions = new Set(optionTexts.filter(Boolean));

        if (uniqueOptions.size < 4) {
            return { valid: false, reason: "mcq-options-not-unique" };
        }

        if (!String(answerText).trim()) {
            return { valid: false, reason: "missing-answer" };
        }

        if (String(answerText).trim() === ",") {
            return { valid: false, reason: "invalid-answer" };
        }
    }

    if (questionType === "Fill In the Blanks") {
        const blankCount = (String(questionText).match(/________/g) || [])
            .length;

        if (blankCount !== 1) {
            return { valid: false, reason: "fill-blank-format" };
        }

        if (!String(answerText).trim()) {
            return { valid: false, reason: "missing-answer" };
        }

        if (String(answerText).trim() === ",") {
            return { valid: false, reason: "invalid-answer" };
        }

        if (String(answerText).trim().length < 2) {
            return { valid: false, reason: "fill-blank-answer-too-short" };
        }
    }

    if (questionType === "True or False") {
        if (
            typeof question.correctAnswer !== "boolean" &&
            typeof question.answer !== "boolean" &&
            !["true", "false"].includes(
                String(answerText || "")
                    .toLowerCase()
                    .trim(),
            )
        ) {
            return { valid: false, reason: "true-false-answer-format" };
        }
    }

    if (questionType === "Very Short Answer") {
        if (
            longAnswerCues.some((cue) =>
                normalizedQuestionText.includes(
                    normalizeGeneratedQuestionText(cue),
                ),
            )
        ) {
            return {
                valid: false,
                reason: "very-short-answer-open-ended",
            };
        }

        if (answerWordCount > 12) {
            return {
                valid: false,
                reason: "very-short-answer-too-long",
            };
        }
    }

    if (questionType === "Short Answer") {
        const hasShortAnswerCue = shortAnswerCues.some((cue) =>
            normalizedQuestionText.includes(normalizeGeneratedQuestionText(cue)),
        );

        if (answerWordCount > 0 && answerWordCount < 5 && !hasShortAnswerCue) {
            return {
                valid: false,
                reason: "short-answer-too-brief",
            };
        }
    }

    return { valid: true, reason: "accepted" };
};

const isValidQuestionForSection = (
    question,
    section,
    existingQuestions = [],
) => {
    return getQuestionValidationResult(
        question,
        section,
        existingQuestions,
    ).valid;
};

const filterQuestionsForSection = (
    questions = [],
    section,
    existing = [],
    rejectionCounts = null,
) => {
    const accepted = [];

    for (const question of questions) {
        const validation = getQuestionValidationResult(question, section, [
            ...existing,
            ...accepted,
        ]);

        if (validation.valid) {
            accepted.push(question);
        } else if (rejectionCounts) {
            rejectionCounts[validation.reason] =
                (rejectionCounts[validation.reason] || 0) + 1;
        }
    }

    return accepted;
};

const cleanQuestionDisplayText = (value = "") => {
    return String(value || "")
        .replace(/â‚¹/g, "₹")
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        .replace(/\s+/g, " ")
        .trim();
};

const normalizeNumericAnswerDisplay = (value = "") => {
    const text = cleanQuestionDisplayText(value);

    if (!/^-?\d+\.\d{5,}$/.test(text)) return text;

    const rounded = Number(text);

    if (!Number.isFinite(rounded)) return text;

    return Number(rounded.toFixed(2)).toString();
};

const polishQuestionForPresentation = (question = {}) => {
    const polished = { ...question };

    polished.question = cleanQuestionDisplayText(
        question.question || question.questionStem || "",
    );
    polished.questionStem = polished.question;

    if (typeof question.answer === "string") {
        polished.answer = normalizeNumericAnswerDisplay(question.answer);
    }

    if (typeof question.correctAnswer === "string") {
        polished.correctAnswer = normalizeNumericAnswerDisplay(
            question.correctAnswer,
        );
    }

    if (typeof question.answerKey === "string") {
        polished.answerKey = normalizeNumericAnswerDisplay(question.answerKey);
    }

    if (typeof question.explanation === "string") {
        polished.explanation = cleanQuestionDisplayText(question.explanation);
    }

    if (Array.isArray(question.options)) {
        polished.options = question.options.map((option) => {
            if (typeof option === "string") {
                return cleanQuestionDisplayText(option);
            }

            return {
                ...option,
                option: cleanQuestionDisplayText(
                    option.option || option.text || option.value || "",
                ),
            };
        });
    }

    return polished;
};

const getQuestionQualityScore = (
    question = {},
    section = {},
    selectedQuestions = [],
) => {
    const questionText = getMainQuestionText(question);
    const answerText = getMainAnswerText(question);
    const questionType = normalizeQuestionTypeName(section.questionType);
    const effectiveDifficulty = normalizeDifficultyLevel(
        section.difficultyLevel || question.difficultyLevel || "Medium",
        "Medium",
    );
    const answerWordCount = countAnswerWords(answerText);

    let score = 50;

    score += Math.min(questionText.length / 12, 10);
    score += question.explanation ? 4 : 0;
    score += Array.isArray(question.options) ? 3 : 0;

    if (hasScenarioOrThinkingCue(questionText)) score += 6;
    if (isSkillStyleMismatch(question, section)) score -= 18;
    if (isDirectRecallQuestion(questionText)) score -= 8;

    if (
        ["Medium", "Hard"].includes(effectiveDifficulty) &&
        isDirectRecallQuestion(questionText)
    ) {
        score -= 8;
    }

    if (
        questionType === "MCQ" &&
        ["Medium", "Hard"].includes(effectiveDifficulty) &&
        !hasScenarioOrThinkingCue(questionText)
    ) {
        score -= 6;
    }

    if (questionType === "Very Short Answer" && answerWordCount > 10) {
        score -= 8;
    }

    if (questionType === "Short Answer" && answerWordCount < 4) {
        score -= 6;
    }

    if (/based on understanding of/i.test(questionText)) score -= 3;
    if (/in python, when a program asks/i.test(questionText)) score -= 4;
    if (/identify the reason for using/i.test(questionText)) score -= 3;
    if (
        /(balloon\s*popper|game\s*zone|project\s*corner|activity\s*corner|wrap\s*up\s*activity)/i.test(
            questionText,
        ) &&
        !["Activity Based", "Case Study", "Competency Based"].includes(
            section.skillType || "",
        )
    ) {
        score -= 10;
    }

    if (/^-?\d+\.\d{5,}$/.test(String(answerText || "").trim())) {
        score -= 8;
    }

    if (
        selectedQuestions.some(
            (existing) =>
                getQuestionSimilarityScore(
                    getConceptSignature(question),
                    getConceptSignature(existing),
                ) >= 0.45,
        )
    ) {
        score -= 16;
    }

    if (
        selectedQuestions.some(
            (existing) =>
                normalizeGeneratedQuestionText(getMainAnswerText(existing)) ===
                    normalizeGeneratedQuestionText(answerText) &&
                normalizeGeneratedQuestionText(answerText).length > 2,
        )
    ) {
        score -= 8;
    }

    return score;
};

const curateSectionQuestions = ({
    questions = [],
    section = {},
    requiredCount = 0,
    existingAcrossPaper = [],
}) => {
    if (!Array.isArray(questions) || !questions.length) return [];

    const polishedQuestions = questions.map(polishQuestionForPresentation);
    const ranked = [...polishedQuestions].sort(
        (a, b) =>
            getQuestionQualityScore(b, section, existingAcrossPaper) -
            getQuestionQualityScore(a, section, existingAcrossPaper),
    );

    const selected = [];
    const deferred = [];

    for (const candidate of ranked) {
        const hasSameConcept = selected.some(
            (existing) =>
                getQuestionSimilarityScore(
                    getConceptSignature(candidate),
                    getConceptSignature(existing),
                ) >= 0.45,
        );
        const hasSameAnswer = selected.some(
            (existing) =>
                normalizeGeneratedQuestionText(getMainAnswerText(existing)) ===
                    normalizeGeneratedQuestionText(getMainAnswerText(candidate)) &&
                normalizeGeneratedQuestionText(
                    getMainAnswerText(candidate),
                ).length > 2,
        );
        const repeatsScenario = selected.some((existing) =>
            hasSameScenario(candidate, existing),
        );

        if (hasSameConcept || hasSameAnswer || repeatsScenario) {
            deferred.push(candidate);
            continue;
        }

        selected.push(candidate);

        if (selected.length >= requiredCount) break;
    }

    if (selected.length < requiredCount) {
        for (const candidate of deferred) {
            selected.push(candidate);
            if (selected.length >= requiredCount) break;
        }
    }

    return selected.slice(0, requiredCount);
};

const curateGeneratedSections = ({
    questionsBySection = [],
    sections = [],
}) => {
    const curated = [];

    questionsBySection.forEach((sectionQuestions, index) => {
        const existingAcrossPaper = getExistingQuestionsAcrossSections(
            curated,
            index,
        );
        const requiredCount = Number(
            sections[index]?.numberOfQuestions || sectionQuestions?.length || 0,
        );

        curated[index] = curateSectionQuestions({
            questions: sectionQuestions || [],
            section: sections[index] || {},
            requiredCount,
            existingAcrossPaper,
        });
    });

    return curated;
};

const getExistingQuestionsAcrossSections = (
    sectionsQuestions = [],
    currentSectionIndex = -1,
) => {
    return (sectionsQuestions || []).flatMap((sectionQuestions, sectionIndex) =>
        sectionIndex === currentSectionIndex ? [] : sectionQuestions || [],
    );
};

const fillQuestionShortagesFromBank = async ({
    finalQuestions,
    sections,
    chapters,
    difficultyLevel,
    actor = {},
}) => {
    const fallbackSections = sections.map((section, index) => ({
        ...section,
        numberOfQuestions: Math.max(
            0,
            Number(section.numberOfQuestions || 0) -
                Number(finalQuestions[index]?.length || 0),
        ),
    }));
    const hasShortage = fallbackSections.some(
        (section) => Number(section.numberOfQuestions || 0) > 0,
    );

    if (!hasShortage) return [];

    const excludeIdsBySection = Object.fromEntries(
        finalQuestions.map((questions, index) => [
            index,
            (questions || [])
                .map((question) => question?._id)
                .filter((id) => mongoose.Types.ObjectId.isValid(id)),
        ]),
    );
    const fallbackBank = await lookupQuestionsFromBank({
        sections: fallbackSections,
        chapters,
        difficultyLevel,
        excludeIdsBySection,
        actor,
        existingQuestionsBySection: finalQuestions,
    });

    fallbackBank.questions.forEach((questions, index) => {
        const required = Number(sections[index]?.numberOfQuestions || 0);
        const existing = finalQuestions[index] || [];
        const existingAcrossPaper = getExistingQuestionsAcrossSections(
            finalQuestions,
            index,
        );
        const remaining = Math.max(0, required - existing.length);

        if (!remaining) return;

        const acceptedFallback = filterQuestionsForSection(
            questions,
            sections[index],
            [...existingAcrossPaper, ...existing],
        );

        finalQuestions[index] = [
            ...existing,
            ...acceptedFallback.slice(0, remaining),
        ];
    });

    return fallbackBank.warnings;
};

const createQuestionPaperTraceId = () =>
    `qp_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const getElapsedMs = (startedAt) => Date.now() - startedAt;

const logQuestionPaperMetric = (traceId, event, details = {}) => {
    console.log(`[QP PERF] ${traceId} ${event}`, details);
};

const mapWithConcurrency = async (items, concurrency, worker) => {
    const results = new Array(items.length);
    let nextIndex = 0;

    const runWorker = async () => {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await worker(
                items[currentIndex],
                currentIndex,
            );
        }
    };

    await Promise.all(
        Array.from(
            { length: Math.min(Math.max(concurrency, 1), items.length) },
            () => runWorker(),
        ),
    );

    return results;
};

const generateAiraQuestionsForSection = async ({
    section,
    chapters,
    difficultyLevel,
    count,
    grade,
    traceId = "qp_untracked",
    sectionIndex = null,
    qualityControls = {},
    actor = {},
    avoidQuestions = [],
}) => {
    const sectionStartedAt = Date.now();
    const apiKey = process.env.CHATPDF_API_KEY;

    if (!apiKey) {
        throw new Error("CHATPDF_API_KEY is missing in backend .env");
    }

    const requiredCount = Number(count || 0);
    if (!requiredCount) return [];

    const validChapterIds = chapters
        .map((chapter) => chapter.id || chapter._id)
        .filter(Boolean);

    const dbChapters = await hydrateChaptersWithAiraSources(
        await Chapter.find({
            _id: { $in: validChapterIds },
        }).lean(),
    );

    const chaptersById = new Map(
        dbChapters.map((chapter) => [chapter._id.toString(), chapter]),
    );

    const validChapters = chapters
        .map((chapter) => chaptersById.get(String(chapter.id || chapter._id)))
        .filter((chapter) => chapter && isSectionTargetChapter(section, chapter))
        .filter((chapter) => chapter.pdfText);

    if (!validChapters.length) {
        const selectedChapters = chapters
            .map((chapter) => chaptersById.get(String(chapter.id || chapter._id)))
            .filter(
                (chapter) => chapter && isSectionTargetChapter(section, chapter),
            );

        throw new Error(buildMissingAiraSourceMessage(selectedChapters));
    }

    const generated = [];
    const MAX_BATCH_SIZE = 4;
    const MAX_REGEN_ROUNDS = 5;
    const MAX_CONSECUTIVE_EMPTY_ROUNDS = 2;
    let chatPdfCalls = 0;
    let acceptedFromChatPdf = 0;
    let consecutiveEmptyRounds = 0;
    let stoppedForNoProgress = false;

    const sectionDifficulty =
        section.difficultyLevel || difficultyLevel || "Medium";

    logQuestionPaperMetric(traceId, "aira-section-start", {
        sectionIndex,
        questionType: section.questionType,
        skillType: section.skillType || "Concept Check",
        difficultyLevel: sectionDifficulty,
        requestedQuestions: requiredCount,
        chapterCount: validChapters.length,
    });

    const generateFromChapter = async ({
        chapter,
        batchCount,
        existingQuestions,
        round,
    }) => {
        const batchStartedAt = Date.now();
        const prompt = buildAiraPrompt({
            chapter,
            section,
            difficultyLevel: sectionDifficulty,
            count: batchCount,
            grade,
            existingQuestions,
            round,
            qualityControls,
        });

        chatPdfCalls += 1;

        const chatStartedAt = Date.now();
        let chatPdfResponse;

        try {
            chatPdfResponse = await axios.post(
                "https://api.chatpdf.com/v1/chats/message",
                {
                    sourceId: chapter.pdfText,
                    referenceSources: true,
                    messages: [{ role: "user", content: prompt }],
                },
                {
                    headers: {
                        "x-api-key": apiKey,
                        "Content-Type": "application/json",
                    },
                    timeout: 120000,
                },
            );
            await recordAiUsage({
                actor,
                feature: "question_paper_generation",
                sourceId: chapter.pdfText,
                durationMs: Date.now() - chatStartedAt,
                metadata: { sectionIndex, round, requestedQuestions: batchCount },
            });
        } catch (error) {
            await recordAiUsage({
                actor,
                feature: "question_paper_generation",
                sourceId: chapter.pdfText,
                success: false,
                durationMs: Date.now() - chatStartedAt,
                metadata: { sectionIndex, round, requestedQuestions: batchCount },
                error: error.response?.data?.error || error.message,
            });
            throw error;
        }

        const parsedQuestions = safeJsonParseArray(
            chatPdfResponse.data?.content || "",
        );

        const normalized = parsedQuestions.map((question) =>
            normalizeAiraQuestion({
                question,
                questionType: section.questionType,
                chapter,
                section,
                difficultyLevel: sectionDifficulty,
            }),
        );

        const rejectionCounts = {};
        const acceptedQuestions = filterQuestionsForSection(
            normalized,
            section,
            existingQuestions,
            rejectionCounts,
        );
        const reusableQuestions = await queueQuestionPersistence(() =>
            persistAiraQuestionsToBank({
                questions: acceptedQuestions,
                chapter,
                actor,
            }),
        );

        acceptedFromChatPdf += reusableQuestions.length;

        logQuestionPaperMetric(traceId, "aira-batch-complete", {
            sectionIndex,
            round,
            chapter: chapter.name,
            requestedQuestions: batchCount,
            parsedQuestions: parsedQuestions.length,
            acceptedQuestions: reusableQuestions.length,
            rejectionCounts,
            elapsedMs: getElapsedMs(batchStartedAt),
        });

        return reusableQuestions;
    };

    for (let round = 0; round < MAX_REGEN_ROUNDS; round++) {
        if (generated.length >= requiredCount) break;

        const remaining = requiredCount - generated.length;
        const batchCount = Math.min(MAX_BATCH_SIZE, remaining);

        const chapter = validChapters[round % validChapters.length];

        try {
            const batchQuestions = await generateFromChapter({
                chapter,
                batchCount,
                existingQuestions: [...avoidQuestions, ...generated],
                round,
            });

            generated.push(...batchQuestions);
            consecutiveEmptyRounds = batchQuestions.length
                ? 0
                : consecutiveEmptyRounds + 1;
        } catch (error) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || error.message || "";

            console.error("AIRA QP batch failed:", errorData || error.message);

            if (
                String(errorMessage).includes("maximum is 2500") ||
                String(errorMessage).includes("tokens")
            ) {
                throw new Error(
                    "AIRA prompt became too long for ChatPDF. Please select fewer chapters or reduce question count.",
                );
            }

            consecutiveEmptyRounds += 1;
        }

        if (consecutiveEmptyRounds >= MAX_CONSECUTIVE_EMPTY_ROUNDS) {
            stoppedForNoProgress = true;
            break;
        }
    }

    const finalQuestions = generated.slice(0, requiredCount);

    logQuestionPaperMetric(traceId, "aira-section-complete", {
        sectionIndex,
        questionType: section.questionType,
        skillType: section.skillType || "Concept Check",
        requestedQuestions: requiredCount,
        generatedQuestions: finalQuestions.length,
        chatPdfCalls,
        acceptedFromChatPdf,
        stoppedForNoProgress,
        maxRetryRounds: MAX_REGEN_ROUNDS,
        elapsedMs: getElapsedMs(sectionStartedAt),
    });

    return finalQuestions;
};

const generateAiraSections = async ({
    sections,
    chapters,
    difficultyLevel,
    grade,
    countsOverride = {},
    traceId = "qp_untracked",
    qualityControls = {},
    actor = {},
    existingQuestionsBySection = [],
}) => {
    const sectionsStartedAt = Date.now();
    const AIRA_SECTION_CONCURRENCY = Number(
        process.env.QP_AIRA_SECTION_CONCURRENCY || 3,
    );

    logQuestionPaperMetric(traceId, "aira-sections-start", {
        sectionCount: sections.length,
        requestedSectionCount: Object.keys(countsOverride).length,
        concurrency: AIRA_SECTION_CONCURRENCY,
    });

    const result = await mapWithConcurrency(
        sections,
        AIRA_SECTION_CONCURRENCY,
        async (section, sectionIndex) => {
            const requiredCount = Number(
                countsOverride[sectionIndex] ?? section.numberOfQuestions ?? 0,
            );

            if (!requiredCount) return [];

            const effectiveDifficultyLevel =
                section.difficultyLevel || difficultyLevel || "Medium";

            return generateAiraQuestionsForSection({
                section,
                chapters,
                difficultyLevel: effectiveDifficultyLevel,
                count: requiredCount,
                grade,
                traceId,
                sectionIndex,
                qualityControls,
                actor,
                avoidQuestions: existingQuestionsBySection[sectionIndex] || [],
            });
        },
    );

    logQuestionPaperMetric(traceId, "aira-sections-complete", {
        generatedQuestions: result.reduce(
            (total, sectionQuestions) =>
                total + (Array.isArray(sectionQuestions) ? sectionQuestions.length : 0),
            0,
        ),
        elapsedMs: getElapsedMs(sectionsStartedAt),
    });

    return result;
};

const VALID_DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

const normalizeDifficultyLevel = (difficulty, fallback = "Medium") => {
    const value = String(difficulty || fallback || "Medium").trim();

    return VALID_DIFFICULTY_LEVELS.includes(value) ? value : "Medium";
};

const expandSectionsByQuestionDifficulty = (
    sections = [],
    difficultyBlueprint = {},
    fallbackDifficultyLevel = "Medium",
) => {
    const expandedSections = [];
    const originalSectionMap = [];

    sections.forEach((section, sectionIndex) => {
        const count = Number(section.numberOfQuestions || 0);
        const rows = Array.isArray(difficultyBlueprint?.[sectionIndex])
            ? difficultyBlueprint[sectionIndex]
            : [];
        const normalizedQuestionDifficulties = Array.from(
            { length: count },
            (_, questionIndex) =>
                normalizeDifficultyLevel(
                    rows[questionIndex]?.difficultyLevel ||
                        rows[questionIndex]?.difficulty ||
                        section.difficultyLevel ||
                        fallbackDifficultyLevel,
                    fallbackDifficultyLevel,
                ),
        );
        const uniqueDifficulties = new Set(normalizedQuestionDifficulties);

        // Keep default/same-difficulty sections batched. Splitting every
        // question into its own AIRA call is expensive and is only needed when
        // the blueprint truly mixes difficulties inside a section.
        if (count > 0 && uniqueDifficulties.size <= 1) {
            expandedSections.push({
                ...section,
                numberOfQuestions: count,
                difficultyLevel:
                    normalizedQuestionDifficulties[0] ||
                    normalizeDifficultyLevel(
                        section.difficultyLevel || fallbackDifficultyLevel,
                        fallbackDifficultyLevel,
                    ),
                originalSectionIndex: sectionIndex,
            });

            originalSectionMap.push(sectionIndex);
            return;
        }

        for (let questionIndex = 0; questionIndex < count; questionIndex++) {
            const questionDifficulty =
                normalizedQuestionDifficulties[questionIndex] ||
                normalizeDifficultyLevel(
                    section.difficultyLevel || fallbackDifficultyLevel,
                    fallbackDifficultyLevel,
                );

            expandedSections.push({
                ...section,
                numberOfQuestions: 1,
                difficultyLevel: questionDifficulty,
                originalSectionIndex: sectionIndex,
                originalQuestionIndex: questionIndex,
            });

            originalSectionMap.push(sectionIndex);
        }
    });

    return { expandedSections, originalSectionMap };
};

const normalizeChapterWeightage = (chapterWeightage = [], chapters = []) => {
    const selectedIds = new Set(
        (chapters || [])
            .map((chapter) => String(normalizeSelectedChapterId(chapter) || ""))
            .filter(Boolean),
    );

    return (Array.isArray(chapterWeightage) ? chapterWeightage : [])
        .map((item) => {
            const chapterId = String(
                item.chapterId ||
                    item.qbChapterId ||
                    item.id ||
                    item._id ||
                    "",
            );
            const courseChapterId = String(
                item.courseChapterId || item.lmsChapterId || item._id || "",
            );

            return {
                chapterId,
                courseChapterId,
                chapterName: item.chapterName || item.name || "",
                marks: Number(item.marks || item.weightageMarks || 0),
                sections: (Array.isArray(item.sections)
                    ? item.sections
                    : []
                )
                    .map((section) => ({
                        sectionIndex: Number(section.sectionIndex),
                        questionType: section.questionType || "",
                        marksOfEachQuestion: Number(
                            section.marksOfEachQuestion || 0,
                        ),
                        marks: Number(section.marks || 0),
                    }))
                    .filter(
                        (section) =>
                            Number.isInteger(section.sectionIndex) &&
                            section.marks > 0,
                    ),
            };
        })
        .filter(
            (item) =>
                item.chapterId &&
                selectedIds.has(item.chapterId) &&
                Number.isFinite(item.marks) &&
                item.marks > 0,
        );
};

const allocateCountsByChapterWeightage = (totalCount, weightage = []) => {
    const count = Number(totalCount || 0);

    if (!count || !weightage.length) return [];

    const totalMarks = weightage.reduce(
        (sum, item) => sum + Number(item.marks || 0),
        0,
    );

    if (!totalMarks) return [];

    const rawAllocations = weightage.map((item) => {
        const exact = (count * Number(item.marks || 0)) / totalMarks;

        return {
            ...item,
            count: Math.floor(exact),
            remainder: exact - Math.floor(exact),
        };
    });

    let remaining =
        count - rawAllocations.reduce((sum, item) => sum + item.count, 0);

    rawAllocations
        .sort((a, b) => b.remainder - a.remainder)
        .forEach((item) => {
            if (remaining <= 0) return;
            item.count += 1;
            remaining -= 1;
        });

    return rawAllocations.filter((item) => item.count > 0);
};

const expandSectionsByChapterWeightage = (
    sections = [],
    chapters = [],
    chapterWeightage = [],
) => {
    const normalizedWeightage = normalizeChapterWeightage(
        chapterWeightage,
        chapters,
    );

    if (!normalizedWeightage.length) {
        return {
            weightedSections: sections,
            weightedSectionMap: sections.map((_, index) => index),
            activeChapterWeightage: [],
        };
    }

    const weightedSections = [];
    const weightedSectionMap = [];
    const hasSectionMatrix = normalizedWeightage.some(
        (item) => Array.isArray(item.sections) && item.sections.length > 0,
    );

    sections.forEach((section, sectionIndex) => {
        if (hasSectionMatrix) {
            normalizedWeightage.forEach((weightageItem) => {
                const sectionTarget = (weightageItem.sections || []).find(
                    (item) => item.sectionIndex === sectionIndex,
                );
                const marksOfEachQuestion = Number(
                    section.marksOfEachQuestion || 1,
                );
                const targetMarks = Number(sectionTarget?.marks || 0);
                const questionCount =
                    marksOfEachQuestion > 0
                        ? Math.floor(targetMarks / marksOfEachQuestion)
                        : 0;

                if (!questionCount) return;

                weightedSections.push({
                    ...section,
                    numberOfQuestions: questionCount,
                    targetChapterId: weightageItem.chapterId,
                    targetCourseChapterId: weightageItem.courseChapterId,
                    targetChapterName: weightageItem.chapterName,
                    targetChapterMarks: weightageItem.marks,
                    targetSectionMarks: targetMarks,
                });
                weightedSectionMap.push(sectionIndex);
            });

            return;
        }

        const allocations = allocateCountsByChapterWeightage(
            section.numberOfQuestions,
            normalizedWeightage,
        );

        if (!allocations.length) {
            weightedSections.push(section);
            weightedSectionMap.push(sectionIndex);
            return;
        }

        allocations.forEach((allocation) => {
            weightedSections.push({
                ...section,
                numberOfQuestions: allocation.count,
                targetChapterId: allocation.chapterId,
                targetCourseChapterId: allocation.courseChapterId,
                targetChapterName: allocation.chapterName,
                targetChapterMarks: allocation.marks,
            });
            weightedSectionMap.push(sectionIndex);
        });
    });

    return {
        weightedSections,
        weightedSectionMap,
        activeChapterWeightage: normalizedWeightage,
    };
};

const buildChapterWeightageWarnings = ({
    groupedQuestions = [],
    originalSections = [],
    chapterWeightage = [],
}) => {
    if (!chapterWeightage.length) return [];

    const actualMarksByChapter = {};
    const actualMarksByChapterSection = {};
    const hasSectionMatrix = chapterWeightage.some(
        (item) => Array.isArray(item.sections) && item.sections.length > 0,
    );

    groupedQuestions.forEach((sectionQuestions, sectionIndex) => {
        const sectionMarks = Number(
            originalSections[sectionIndex]?.marksOfEachQuestion || 1,
        );

        (sectionQuestions || []).forEach((question) => {
            const chapterId = String(
                question.chapter ||
                    question.chapterId ||
                    question.qbChapterId ||
                    "",
            );

            if (!chapterId) return;

            actualMarksByChapter[chapterId] =
                (actualMarksByChapter[chapterId] || 0) + sectionMarks;
            const sectionKey = `${chapterId}:${sectionIndex}`;
            actualMarksByChapterSection[sectionKey] =
                (actualMarksByChapterSection[sectionKey] || 0) +
                sectionMarks;
        });
    });

    if (hasSectionMatrix) {
        return chapterWeightage
            .flatMap((item) =>
                (item.sections || []).map((section) => {
                    const actual = Number(
                        actualMarksByChapterSection[
                            `${item.chapterId}:${section.sectionIndex}`
                        ] || 0,
                    );
                    const target = Number(section.marks || 0);

                    if (actual === target) return null;

                    return {
                        code: "chapter_section_weightage_variance",
                        visibility: "teacher",
                        chapterId: item.chapterId,
                        chapterName: item.chapterName,
                        sectionIndex: section.sectionIndex,
                        questionType: section.questionType,
                        targetMarks: target,
                        actualMarks: actual,
                        message: `${item.chapterName || "Selected chapter"} / Section ${
                            section.sectionIndex + 1
                        } generated ${actual}/${target} mark(s) against the planned blueprint.`,
                    };
                }),
            )
            .filter(Boolean);
    }

    return chapterWeightage
        .map((item) => {
            const actual = Number(actualMarksByChapter[item.chapterId] || 0);
            const target = Number(item.marks || 0);

            if (actual === target) return null;

            return {
                code: "chapter_weightage_variance",
                visibility: "teacher",
                chapterId: item.chapterId,
                chapterName: item.chapterName,
                targetMarks: target,
                actualMarks: actual,
                message: `${item.chapterName || "Selected chapter"} generated ${actual}/${target} mark(s) against the planned chapter weightage.`,
            };
        })
        .filter(Boolean);
};

const regroupQuestionsToOriginalSections = (
    questions = [],
    originalSectionMap = [],
    originalSectionCount = 0,
) => {
    const grouped = Array.from({ length: originalSectionCount }, () => []);

    questions.forEach((sectionQuestions, expandedIndex) => {
        const originalIndex = originalSectionMap[expandedIndex];

        if (originalIndex === undefined) return;

        grouped[originalIndex].push(...(sectionQuestions || []));
    });

    return grouped;
};

const mapWarningsToOriginalSections = (
    warnings = [],
    originalSectionMap = [],
) => {
    return warnings.map((warning) => {
        const mappedSectionIndex = originalSectionMap[warning.sectionIndex];

        return {
            ...warning,
            sectionIndex:
                mappedSectionIndex === undefined
                    ? warning.sectionIndex
                    : mappedSectionIndex,
        };
    });
};

const weakSkillQuestionTypePairs = {
    HOTS: ["Fill In the Blanks", "True or False"],
    "Case Study": ["Fill In the Blanks", "True or False"],
    "Creative Thinking": ["Fill In the Blanks", "True or False"],
    "Troubleshooting Based": ["Fill In the Blanks"],
    "Reasoning Based": ["Fill In the Blanks"],
};

const isWeakSkillQuestionTypePair = (section = {}) => {
    const skillType = section.skillType || "";
    const questionType = normalizeQuestionTypeName(section.questionType || "");

    return (weakSkillQuestionTypePairs[skillType] || []).includes(questionType);
};

exports.generateSmartQuestions = async (req, res) => {
    const traceId = createQuestionPaperTraceId();
    const requestStartedAt = Date.now();
    const actor = getUsageActor(req);

    try {
        const {
            sections,
            chapters,
            difficultyLevel,
            sourceMode = "question_bank",
            grade,
            difficultyBlueprint = {},
            chapterWeightage = [],
            qualityControls = {},
            excludeQuestionIdsBySection = {},
        } = req.body;

        if (!sections || !chapters) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters",
            });
        }

        if (!["question_bank", "aira", "hybrid"].includes(sourceMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sourceMode",
            });
        }

        const fallbackDifficultyLevel = normalizeDifficultyLevel(
            difficultyLevel,
            "Medium",
        );
        const normalizedSections = normalizeSectionsWithSkillType(sections);
        const {
            weightedSections,
            weightedSectionMap,
            activeChapterWeightage,
        } = expandSectionsByChapterWeightage(
            normalizedSections,
            chapters,
            chapterWeightage,
        );
        const weightedDifficultyBlueprint = {};

        weightedSections.forEach((_, weightedIndex) => {
            const originalIndex = weightedSectionMap[weightedIndex];
            weightedDifficultyBlueprint[weightedIndex] =
                difficultyBlueprint?.[originalIndex] || [];
        });

        const { expandedSections, originalSectionMap } =
            expandSectionsByQuestionDifficulty(
                weightedSections,
                weightedDifficultyBlueprint,
                fallbackDifficultyLevel,
            );
        const finalOriginalSectionMap = expandedSections.length
            ? originalSectionMap.map(
                  (weightedIndex) => weightedSectionMap[weightedIndex],
              )
            : weightedSectionMap;

        const sectionsToGenerate = expandedSections.length
            ? expandedSections
            : weightedSections;

        logQuestionPaperMetric(traceId, "smart-generation-start", {
            sourceMode,
            originalSectionCount: normalizedSections.length,
            generationSectionCount: sectionsToGenerate.length,
            chapterCount: Array.isArray(chapters) ? chapters.length : 0,
            requestedQuestions: sectionsToGenerate.reduce(
                (total, section) =>
                    total + Number(section.numberOfQuestions || 0),
                0,
            ),
            questionWiseDifficulty: Boolean(expandedSections.length),
            chapterWeightage: activeChapterWeightage.length > 0,
        });

        if (sourceMode === "hybrid") {
            const bankStartedAt = Date.now();
            const bank = await lookupQuestionsFromBank({
                sections: sectionsToGenerate,
                chapters,
                difficultyLevel: fallbackDifficultyLevel,
                excludeIdsBySection: excludeQuestionIdsBySection,
                actor,
            });

            logQuestionPaperMetric(traceId, "question-bank-complete", {
                sourceMode,
                generatedQuestions: bank.questions.reduce(
                    (total, sectionQuestions) =>
                        total +
                        (Array.isArray(sectionQuestions)
                            ? sectionQuestions.length
                            : 0),
                    0,
                ),
                warningCount: bank.warnings.length,
                elapsedMs: getElapsedMs(bankStartedAt),
            });

            const finalQuestions = [];
            const missingCounts = {};
            const hybridWarnings = [];

            for (let index = 0; index < sectionsToGenerate.length; index++) {
                const section = sectionsToGenerate[index];
                const required = Number(section.numberOfQuestions || 0);
                const targetChapters = (chapters || []).filter((chapter) =>
                    isSectionTargetChapter(section, chapter),
                );
                const minimumFreshAiraQuota = getMinimumFreshAiraQuota({
                    section,
                    chapterCount: targetChapters.length,
                    hasIndexedChapterSource: targetChapters.some(
                        (chapter) => chapter?.pdfText,
                    ),
                });
                const targetBankCount = Math.max(
                    0,
                    required - minimumFreshAiraQuota,
                );

                const bankQuestionsRaw = bank.questions[index] || [];
                const existingAcrossPaper = getExistingQuestionsAcrossSections(
                    finalQuestions,
                    index,
                );

                const goodBankQuestions = filterQuestionsForSection(
                    bankQuestionsRaw,
                    section,
                    existingAcrossPaper,
                );

                if (isWeakSkillQuestionTypePair(section)) {
                    const originalSectionIndex =
                        finalOriginalSectionMap[index] ?? index;

                    hybridWarnings.push({
                        code: "weak_skill_question_type_pair",
                        visibility: "teacher",
                        sectionIndex: originalSectionIndex,
                        skillType: section.skillType,
                        questionType: section.questionType,
                        message: `${section.skillType} works better with MCQ, Very Short Answer, Case Study, or reasoning-style questions. ${section.questionType} may produce limited-quality questions.`,
                    });
                }

                finalQuestions[index] = goodBankQuestions.slice(
                    0,
                    targetBankCount,
                );

                if (bankQuestionsRaw.length > goodBankQuestions.length) {
                    hybridWarnings.push({
                        code: "question_bank_quality_filter",
                        visibility: "internal",
                        sectionIndex:
                            finalOriginalSectionMap[index] ?? index,
                        skillType: section.skillType || "Concept Check",
                        message: `Some question bank questions in Section ${
                            (finalOriginalSectionMap[index] ?? index) + 1
                        } were skipped because they did not match quality or skill rules.`,
                    });
                }

                if (finalQuestions[index].length < required) {
                    missingCounts[index] =
                        required - finalQuestions[index].length;
                }
            }

            const airaGeneratedSections = Object.keys(missingCounts).length
                ? await generateAiraSections({
                      sections: sectionsToGenerate,
                      chapters,
                      difficultyLevel: fallbackDifficultyLevel,
                      grade,
                      countsOverride: missingCounts,
                      traceId,
                      qualityControls,
                      actor,
                      existingQuestionsBySection: finalQuestions,
                  })
                : [];

            Object.entries(missingCounts).forEach(([sectionIndex, missing]) => {
                const idx = Number(sectionIndex);
                const section = sectionsToGenerate[idx];
                const required = Number(section.numberOfQuestions || 0);

                const existingQuestions = finalQuestions[idx] || [];
                const existingAcrossPaper = getExistingQuestionsAcrossSections(
                    finalQuestions,
                    idx,
                );

                const goodAiraQuestions = filterQuestionsForSection(
                    airaGeneratedSections[idx] || [],
                    section,
                    [...existingAcrossPaper, ...existingQuestions],
                );

                const mergedQuestions = [
                    ...existingQuestions,
                    ...goodAiraQuestions.slice(0, missing),
                ];

                finalQuestions[idx] = mergedQuestions.slice(0, required);
            });

            const finalFallbackWarnings = await fillQuestionShortagesFromBank({
                finalQuestions,
                sections: sectionsToGenerate,
                chapters,
                difficultyLevel: fallbackDifficultyLevel,
                actor,
            });

            const curatedFinalQuestions = curateGeneratedSections({
                questionsBySection: finalQuestions,
                sections: sectionsToGenerate,
            });

            const groupedQuestions = regroupQuestionsToOriginalSections(
                curatedFinalQuestions,
                finalOriginalSectionMap,
                normalizedSections.length,
            );

            const shortageWarnings = curatedFinalQuestions
                .map((sectionQuestions, expandedIndex) => {
                    const required = Number(
                        sectionsToGenerate[expandedIndex]?.numberOfQuestions ||
                            0,
                    );

                    const generated = Array.isArray(sectionQuestions)
                        ? sectionQuestions.length
                        : 0;

                    if (generated >= required) return null;

                    const originalSectionIndex =
                        finalOriginalSectionMap[expandedIndex] ??
                        expandedIndex;

                    const section = sectionsToGenerate[expandedIndex] || {};

                    return {
                        code: "question_generation_shortage",
                        visibility: "teacher",
                        sectionIndex: originalSectionIndex,
                        missing: required - generated,
                        difficultyLevel:
                            section.difficultyLevel || fallbackDifficultyLevel,
                        skillType: section.skillType || "Concept Check",
                        message: `Section ${
                            originalSectionIndex + 1
                        } generated ${generated}/${required} usable question(s) from the selected chapters. Regenerate this section or adjust the selected chapters to complete the paper.`,
                    };
                })
                .filter(Boolean);

            const questions = regroupQuestionsToOriginalSections(
                bank.questions,
                finalOriginalSectionMap,
                normalizedSections.length,
            );

            const filteredQuestions = questions.map((sectionQuestions, index) =>
                filterQuestionsForSection(
                    sectionQuestions,
                    normalizedSections[index] || sectionsToGenerate[index],
                    [],
                ),
            );

            logQuestionPaperMetric(traceId, "smart-generation-complete", {
                sourceMode,
                generatedQuestions: groupedQuestions.reduce(
                    (total, sectionQuestions) =>
                        total +
                        (Array.isArray(sectionQuestions)
                            ? sectionQuestions.length
                            : 0),
                    0,
                ),
                missingSectionCount: Object.keys(missingCounts).length,
                elapsedMs: getElapsedMs(requestStartedAt),
            });
            const chapterWeightageWarnings = buildChapterWeightageWarnings({
                groupedQuestions,
                originalSections: normalizedSections,
                chapterWeightage: activeChapterWeightage,
            });

            return res.status(200).json({
                success: true,
                questions: groupedQuestions,
                warnings: [
                    ...mapWarningsToOriginalSections(
                        bank.warnings,
                        finalOriginalSectionMap,
                    ),
                    ...mapWarningsToOriginalSections(
                        finalFallbackWarnings,
                        finalOriginalSectionMap,
                    ),
                    ...hybridWarnings,
                    ...shortageWarnings,
                    ...chapterWeightageWarnings,
                ],
                meta: {
                    sourceMode,
                    missingCounts,
                    questionWiseDifficulty: Boolean(expandedSections.length),
                    chapterWeightage: activeChapterWeightage,
                    traceId,
                },
            });
        }

        if (sourceMode === "aira") {
            const airaQuestions = await generateAiraSections({
                sections: sectionsToGenerate,
                chapters,
                difficultyLevel: fallbackDifficultyLevel,
                grade,
                traceId,
                qualityControls,
                actor,
            });

            const curatedAiraQuestions = curateGeneratedSections({
                questionsBySection: airaQuestions,
                sections: sectionsToGenerate,
            });

            const questions = regroupQuestionsToOriginalSections(
                curatedAiraQuestions,
                finalOriginalSectionMap,
                normalizedSections.length,
            );

            logQuestionPaperMetric(traceId, "smart-generation-complete", {
                sourceMode,
                generatedQuestions: questions.reduce(
                    (total, sectionQuestions) =>
                        total +
                        (Array.isArray(sectionQuestions)
                            ? sectionQuestions.length
                            : 0),
                    0,
                ),
                elapsedMs: getElapsedMs(requestStartedAt),
            });

            return res.status(200).json({
                success: true,
                questions,
                warnings: buildChapterWeightageWarnings({
                    groupedQuestions: questions,
                    originalSections: normalizedSections,
                    chapterWeightage: activeChapterWeightage,
                }),
                meta: {
                    sourceMode,
                    questionWiseDifficulty: Boolean(expandedSections.length),
                    chapterWeightage: activeChapterWeightage,
                    traceId,
                },
            });
        }

        const bankStartedAt = Date.now();
        const bank = await lookupQuestionsFromBank({
            sections: sectionsToGenerate,
            chapters,
            difficultyLevel: fallbackDifficultyLevel,
            excludeIdsBySection: excludeQuestionIdsBySection,
            actor,
        });

        logQuestionPaperMetric(traceId, "question-bank-complete", {
            sourceMode,
            generatedQuestions: bank.questions.reduce(
                (total, sectionQuestions) =>
                    total +
                    (Array.isArray(sectionQuestions)
                        ? sectionQuestions.length
                        : 0),
                0,
            ),
            warningCount: bank.warnings.length,
            elapsedMs: getElapsedMs(bankStartedAt),
        });

        const missingCounts = {};

        bank.questions.forEach((sectionQuestions, expandedIndex) => {
            const required = Number(
                sectionsToGenerate[expandedIndex]?.numberOfQuestions || 0,
            );
            const current = sectionQuestions.length;

            if (current < required) {
                missingCounts[expandedIndex] = required - current;
            }
        });

        const finalQuestions = [];

        bank.questions.forEach((sectionQuestions, index) => {
            const existingAcrossPaper = getExistingQuestionsAcrossSections(
                finalQuestions,
                index,
            );

            finalQuestions[index] = filterQuestionsForSection(
                sectionQuestions,
                sectionsToGenerate[index],
                existingAcrossPaper,
            );
        });

        finalQuestions.forEach((sectionQuestions, expandedIndex) => {
            const required = Number(
                sectionsToGenerate[expandedIndex]?.numberOfQuestions || 0,
            );

            const current = sectionQuestions.length;

            if (current < required) {
                missingCounts[expandedIndex] = required - current;
            }
        });
        const airaGeneratedSections = Object.keys(missingCounts).length
            ? await generateAiraSections({
                  sections: sectionsToGenerate,
                  chapters,
                  difficultyLevel: fallbackDifficultyLevel,
                  grade,
                  countsOverride: missingCounts,
                  traceId,
                  qualityControls,
                  actor,
                  existingQuestionsBySection: finalQuestions,
              })
            : [];

        Object.entries(missingCounts).forEach(([sectionIndex, missing]) => {
            const idx = Number(sectionIndex);

            const existingQuestions = finalQuestions[idx] || [];
            const existingAcrossPaper = getExistingQuestionsAcrossSections(
                finalQuestions,
                idx,
            );

            const uniqueAiraQuestions = filterQuestionsForSection(
                airaGeneratedSections[idx] || [],
                sectionsToGenerate[idx],
                [...existingAcrossPaper, ...existingQuestions],
            );

            finalQuestions[idx] = [
                ...existingQuestions,
                ...uniqueAiraQuestions.slice(0, missing),
            ];
        });

        const finalFallbackWarnings = await fillQuestionShortagesFromBank({
            finalQuestions,
            sections: sectionsToGenerate,
            chapters,
            difficultyLevel: fallbackDifficultyLevel,
        });

        const curatedFinalQuestions = curateGeneratedSections({
            questionsBySection: finalQuestions,
            sections: sectionsToGenerate,
        });

        const groupedQuestions = regroupQuestionsToOriginalSections(
            curatedFinalQuestions,
            finalOriginalSectionMap,
            normalizedSections.length,
        );

        const shortageWarnings = curatedFinalQuestions
            .map((sectionQuestions, expandedIndex) => {
                const required = Number(
                    sectionsToGenerate[expandedIndex]?.numberOfQuestions || 0,
                );
                const generated = Array.isArray(sectionQuestions)
                    ? sectionQuestions.length
                    : 0;

                if (generated >= required) return null;

                const originalSectionIndex =
                    finalOriginalSectionMap[expandedIndex] ?? expandedIndex;
                const section = sectionsToGenerate[expandedIndex] || {};

                return {
                    code: "question_generation_shortage",
                    visibility: "teacher",
                    sectionIndex: originalSectionIndex,
                    missing: required - generated,
                    difficultyLevel:
                        section.difficultyLevel || fallbackDifficultyLevel,
                    skillType: section.skillType || "Concept Check",
                    message: `Section ${
                        originalSectionIndex + 1
                    } generated ${generated}/${required} usable question(s) from the selected chapters. Regenerate this section or adjust the selected chapters to complete the paper.`,
                };
            })
            .filter(Boolean);

        logQuestionPaperMetric(traceId, "smart-generation-complete", {
            sourceMode,
            generatedQuestions: groupedQuestions.reduce(
                (total, sectionQuestions) =>
                    total +
                    (Array.isArray(sectionQuestions)
                        ? sectionQuestions.length
                        : 0),
                0,
            ),
            missingSectionCount: Object.keys(missingCounts).length,
            elapsedMs: getElapsedMs(requestStartedAt),
        });
        const chapterWeightageWarnings = buildChapterWeightageWarnings({
            groupedQuestions,
            originalSections: normalizedSections,
            chapterWeightage: activeChapterWeightage,
        });

        return res.status(200).json({
            success: true,
            questions: groupedQuestions,
            warnings: [
                ...mapWarningsToOriginalSections(
                    bank.warnings,
                    finalOriginalSectionMap,
                ),
                ...mapWarningsToOriginalSections(
                    finalFallbackWarnings,
                    finalOriginalSectionMap,
                ),
                ...shortageWarnings,
                ...chapterWeightageWarnings,
            ],
            meta: {
                sourceMode,
                missingCounts,
                questionWiseDifficulty: Boolean(expandedSections.length),
                chapterWeightage: activeChapterWeightage,
                traceId,
            },
        });
    } catch (error) {
        logQuestionPaperMetric(traceId, "smart-generation-failed", {
            error: error.response?.data?.error || error.message,
            elapsedMs: getElapsedMs(requestStartedAt),
        });

        console.error(
            "Error generating smart questions:",
            error.response?.data || error.message,
        );

        res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error ||
                error.message ||
                "Failed to generate smart questions",
        });
    }
};

const stripQuestionHtml = (value = "") =>
    String(value || "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

const stringifyGeneratedQuestionPaper = (questions = [], meta = {}) => {
    const lines = [];

    lines.push(`Title: ${meta.title || "Question Paper"}`);
    lines.push(`Course: ${meta.courseName || ""}`);
    lines.push(`Chapters: ${(meta.chapterNames || []).join(", ")}`);
    lines.push(`Total Marks: ${meta.totalMarks || ""}`);
    lines.push(`Time: ${meta.totalTime || ""} minutes`);
    lines.push(`Instructions: ${meta.instruction || ""}`);

    if (Array.isArray(meta.chapterWeightage) && meta.chapterWeightage.length) {
        lines.push("\nChapter-wise Section Weightage:");
        meta.chapterWeightage.forEach((item) => {
            lines.push(
                `- ${item.chapterName || item.name || item.chapterId}: ${item.marks || 0} marks`,
            );
            (item.sections || []).forEach((section) => {
                lines.push(
                    `  - Section ${Number(section.sectionIndex || 0) + 1} (${section.questionType || "Questions"}): ${section.marks || 0} marks`,
                );
            });
        });
    }

    lines.push("\nGenerated Questions:");

    questions.forEach((sectionQuestions, sectionIndex) => {
        lines.push(`\nSection ${String.fromCharCode(65 + sectionIndex)}`);

        (sectionQuestions || []).forEach((question, questionIndex) => {
            const marks = Number(question.marks || meta.sectionMarks?.[sectionIndex] || 1);
            const text = stripQuestionHtml(
                question.questionStem || question.question || question.title,
            );

            lines.push(
                `${questionIndex + 1}. [${marks} mark${marks > 1 ? "s" : ""}] ${text}`,
            );

            if (Array.isArray(question.options) && question.options.length) {
                question.options.forEach((option, optionIndex) => {
                    lines.push(
                        `   ${String.fromCharCode(65 + optionIndex)}. ${stripQuestionHtml(option.option || option.text || option)}`,
                    );
                });
            }

            const answer =
                question.answer ?? question.correctAnswer ?? question.answerKey;

            if (answer !== undefined && answer !== null && answer !== "") {
                lines.push(`   Answer: ${stripQuestionHtml(String(answer))}`);
            }

            if (question.explanation) {
                lines.push(
                    `   Explanation: ${stripQuestionHtml(question.explanation)}`,
                );
            }
        });
    });

    return lines.join("\n");
};

exports.generateCustomFormatQuestionPaper = async (req, res) => {
    try {
        if (!process.env.CHATPDF_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "CHATPDF_API_KEY is missing in backend .env",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please upload a school question paper format file",
            });
        }

        const questions = JSON.parse(req.body.questions || "[]");
        const meta = JSON.parse(req.body.meta || "{}");
        const chapters = JSON.parse(req.body.chapters || "[]");

        if (!Array.isArray(questions) || !questions.length) {
            return res.status(400).json({
                success: false,
                error: "Generated questions are required before formatting",
            });
        }

        const rawTemplateText = await extractQuestionPaperTemplateText(req.file);
        const templateText = limitQuestionPaperTemplateText(rawTemplateText);

        if (!templateText || templateText.length < 80) {
            return res.status(400).json({
                success: false,
                error: "Could not read enough text from the uploaded question paper format. Please upload a clearer PDF or DOCX file.",
            });
        }

        const validChapterIds = (chapters || [])
            .map((chapter) => chapter.id || chapter._id || chapter.courseChapterId)
            .filter(Boolean);

        const chapterWithSource = await Chapter.findOne({
            _id: { $in: validChapterIds },
            pdfText: { $exists: true, $ne: "" },
        }).lean();

        if (!chapterWithSource?.pdfText) {
            return res.status(400).json({
                success: false,
                error: "At least one selected chapter must have an uploaded ebook/PDF source to use custom school format.",
            });
        }

        const generatedPaperText = stringifyGeneratedQuestionPaper(
            questions,
            meta,
        );

        const prompt = `
You are AIRA, an expert school exam paper formatter.

TASK:
Format the generated question paper below using the uploaded school's question paper format.

IMPORTANT:
- The uploaded format is only for structure, layout, headings, order, and style.
- Do not copy any old questions or answers from the uploaded format.
- Use only the generated questions provided below.
- Preserve chapter-wise weightage as closely as possible.
- Create two clean sections in the response:
  1. STUDENT COPY
  2. ANSWER KEY
- In STUDENT COPY, do not show answers or explanations.
- In ANSWER KEY, include answers and explanations where available.
- If the uploaded format has tables, recreate them using markdown tables.
- Do not mention AI, ChatPDF, or this instruction.
- Return clean markdown only.

UPLOADED SCHOOL QUESTION PAPER FORMAT:
${templateText}

GENERATED PAPER CONTENT:
${generatedPaperText}
`;

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            {
                referenceSources: false,
                sourceId: chapterWithSource.pdfText,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            },
            {
                headers: {
                    "x-api-key": process.env.CHATPDF_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 120000,
            },
        );
        await recordAiUsage({
            req,
            feature: "custom_question_paper_formatting",
            sourceId: chapterWithSource.pdfText,
            metadata: { templateName: req.file.originalname },
        });

        return res.status(200).json({
            success: true,
            formattedPaper: cleanQuestionPaperText(
                chatPdfResponse.data?.content || "",
            ),
            templateName: req.file.originalname,
        });
    } catch (error) {
        console.error("Error in generateCustomFormatQuestionPaper:");
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
        console.error("Message:", error.message);

        return res.status(error.response?.status || 500).json({
            success: false,
            error:
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Custom question paper formatting failed",
            details: error.response?.data || null,
        });
    }
};

exports.getQuestionsForSections = async (req, res) => {
    try {
        const { sections, chapters, difficultyLevel } = req.body;
        const actor = getUsageActor(req);

        if (!sections || !chapters || !difficultyLevel) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters",
            });
        }

        const normalizedSections = normalizeSectionsWithSkillType(sections);

        const result = await lookupQuestionsFromBank({
            sections: normalizedSections,
            chapters,
            difficultyLevel,
            actor,
        });

        res.status(200).json({
            success: true,
            questions: result.questions,
            warnings: result.warnings,
        });
    } catch (error) {
        console.error("Error fetching questions:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.regenerationOfQuestion = async (req, res) => {
    let {
        questionType,
        chapter,
        course,
        difficultyLevel,
        sectionQuestionsIds,
        skillType,
    } = req.query;

    if (typeof sectionQuestionsIds === "string") {
        sectionQuestionsIds = sectionQuestionsIds.split(",");
    }

    if (!chapter || !mongoose.Types.ObjectId.isValid(chapter)) {
        return res.status(400).json({
            success: false,
            message: "Valid chapter id is required",
        });
    }

    const effectiveDifficultyLevel = ["Easy", "Medium", "Hard"].includes(
        difficultyLevel,
    )
        ? difficultyLevel
        : "Medium";

    const sectionsQuestionsArray = [];

    for (let ele of sectionQuestionsIds || []) {
        // Important:
        // Hybrid sections can contain AIRA ids like "aira_..."
        // Those are not valid MongoDB ObjectIds.
        if (ele && mongoose.Types.ObjectId.isValid(ele)) {
            sectionsQuestionsArray.push(new mongoose.Types.ObjectId(ele));
        }
    }

    try {
        const question = await QuestionBase.aggregate([
            {
                $match: {
                    questionType,
                    difficultyLevel: effectiveDifficultyLevel,
                    chapter: new mongoose.Types.ObjectId(chapter),
                    _id: { $nin: sectionsQuestionsArray },
                },
            },
            { $sample: { size: 1 } },
            {
                $lookup: {
                    from: "options",
                    localField: "options",
                    foreignField: "_id",
                    as: "options",
                },
            },
            {
                $project: {
                    questionId: 1,
                    questionType: 1,
                    questionTitle: 1,
                    chapter: 1,
                    chapterName: 1,
                    questionStem: 1,
                    options: 1,
                    answer: 1,
                    explanation: 1,
                    difficultyLevel: 1,
                    skillType: 1,
                },
            },
            {
                $addFields: {
                    skillType: skillType || "Concept Check",
                    sourceMode: "question_bank",
                    sourceLabel: "Question Bank",
                },
            },
        ]);

        res.status(200).json({ success: true, question });
    } catch (error) {
        console.error("Error fetching questions:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getQuestionDistributionByChapter = async (req, res) => {
    try {
        const { qbChapterId } = req.params;

        if (!qbChapterId) {
            return res.status(400).json({
                success: false,
                message: "Chapter ID is required",
            });
        }

        const chapterObjectId = new mongoose.Types.ObjectId(qbChapterId);

        const distribution = await QuestionBase.aggregate([
            {
                $match: {
                    chapter: chapterObjectId,
                },
            },
            {
                $group: {
                    _id: {
                        questionType: "$questionType",
                        difficultyLevel: "$difficultyLevel",
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        const questionTypes = [
            "MCQ",
            "Fill In the Blanks",
            "True or False",
            "Short Answer",
            "Very Short Answer",
            "Long Answer",
        ];

        const difficulties = ["Easy", "Medium", "Hard"];

        const result = questionTypes.map((type) => {
            const entry = {
                questionType: type,
                Easy: 0,
                Medium: 0,
                Hard: 0,
                total: 0,
            };

            distribution.forEach((d) => {
                if (d._id.questionType === type) {
                    const level = d._id.difficultyLevel;

                    if (difficulties.includes(level)) {
                        entry[level] = d.count;
                    }

                    entry.total += d.count;
                }
            });

            return entry;
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Error in getQuestionDistributionByChapter:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting DistributionByChapter",
        });
    }
};
