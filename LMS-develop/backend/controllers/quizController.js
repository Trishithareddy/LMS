const Quiz = require("../models/Quiz")
const QuizAttempt = require("../models/AttepmtQuiz")
const AttemptQuiz = require("../models/AttepmtQuiz")
const { body, param, validationResult } = require("express-validator")
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const Teacher = require("../models/Teacher");

const ANSWER_STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "to",
    "of",
    "for",
    "and",
    "or",
    "in",
    "on",
    "at",
    "by",
    "with",
    "from",
    "as",
    "be",
    "this",
    "that",
    "these",
    "those",
]);

const normalizeAnswerText = (value) =>
    String(value ?? "")
        .toLowerCase()
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/_/g, " ")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const tokenizeAnswer = (value) => {
    const normalized = normalizeAnswerText(value);

    if (!normalized) return [];

    return normalized
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 1 && !ANSWER_STOP_WORDS.has(token));
};

const getTokenOverlapStats = (studentAnswer, expectedAnswer) => {
    const studentTokens = new Set(tokenizeAnswer(studentAnswer));
    const expectedTokens = new Set(tokenizeAnswer(expectedAnswer));

    if (studentTokens.size === 0 || expectedTokens.size === 0) {
        return {
            common: 0,
            studentTokenCount: studentTokens.size,
            expectedTokenCount: expectedTokens.size,
            expectedCoverage: 0,
            studentCoverage: 0,
        };
    }

    let common = 0;

    studentTokens.forEach((token) => {
        if (expectedTokens.has(token)) {
            common++;
        }
    });

    return {
        common,
        studentTokenCount: studentTokens.size,
        expectedTokenCount: expectedTokens.size,
        expectedCoverage: common / expectedTokens.size,
        studentCoverage: common / studentTokens.size,
    };
};

const convertToBoolean = (value) => {
    if (typeof value === "boolean") return value;

    const normalized = normalizeAnswerText(value);

    if (["true", "yes", "correct"].includes(normalized)) return true;
    if (["false", "no", "incorrect"].includes(normalized)) return false;

    return null;
};

const getStudentSelectedAnswer = (submittedAnswer) =>
    submittedAnswer?.selectedOption ??
    submittedAnswer?.answer ??
    submittedAnswer?.studentAnswer ??
    submittedAnswer?.response ??
    "";

const evaluateTypedAnswer = ({
    studentAnswer,
    correctAnswer,
    acceptableAnswers = [],
    gradingKeywords = [],
    marks,
    type,
}) => {
    const normalizedStudent = normalizeAnswerText(studentAnswer);
    const normalizedCorrect = normalizeAnswerText(correctAnswer);
    const normalizedAcceptableAnswers = acceptableAnswers
        .map(normalizeAnswerText)
        .filter(Boolean);

    if (!normalizedStudent) {
        return {
            awardedMarks: 0,
            isCorrect: false,
            feedback: "No answer submitted.",
        };
    }

    if (
        normalizedStudent === normalizedCorrect ||
        normalizedAcceptableAnswers.includes(normalizedStudent)
    ) {
        return {
            awardedMarks: marks,
            isCorrect: true,
            feedback: "Correct answer.",
        };
    }

    const allExpectedAnswers = [correctAnswer, ...acceptableAnswers].filter(Boolean);
    let bestExpectedCoverage = 0;
    let bestStudentCoverage = 0;
    let bestCommon = 0;
    let bestStudentTokenCount = 0;

    allExpectedAnswers.forEach((answer) => {
        const stats = getTokenOverlapStats(studentAnswer, answer);

        if (
            stats.expectedCoverage > bestExpectedCoverage ||
            stats.studentCoverage > bestStudentCoverage
        ) {
            bestExpectedCoverage = Math.max(
                bestExpectedCoverage,
                stats.expectedCoverage,
            );
            bestStudentCoverage = Math.max(
                bestStudentCoverage,
                stats.studentCoverage,
            );
            bestCommon = Math.max(bestCommon, stats.common);
            bestStudentTokenCount = Math.max(
                bestStudentTokenCount,
                stats.studentTokenCount,
            );
        }
    });

    const normalizedKeywords = gradingKeywords
        .map(normalizeAnswerText)
        .filter(Boolean);
    let matchedKeywords = 0;

    normalizedKeywords.forEach((keyword) => {
        if (normalizedStudent.includes(keyword)) {
            matchedKeywords++;
        }
    });

    const keywordScore = normalizedKeywords.length
        ? matchedKeywords / normalizedKeywords.length
        : 0;
    const finalMatchScore = Math.max(bestExpectedCoverage, keywordScore);
    const shortRelevantAnswer =
        bestStudentCoverage >= 0.75 &&
        bestCommon >= 2 &&
        bestStudentTokenCount >= 2;

    if (type === "Fill In the Blanks") {
        if (finalMatchScore >= 0.8 || keywordScore >= 0.8) {
            return {
                awardedMarks: marks,
                isCorrect: true,
                feedback: "Answer is close enough to the expected answer.",
            };
        }

        if (finalMatchScore >= 0.5 || shortRelevantAnswer) {
            return {
                awardedMarks: Math.max(0.5, marks * 0.5),
                isCorrect: false,
                feedback: "Partially correct answer.",
            };
        }

        return {
            awardedMarks: 0,
            isCorrect: false,
            feedback: "Incorrect answer.",
        };
    }

    if (finalMatchScore >= 0.75 || keywordScore >= 0.75) {
        return {
            awardedMarks: marks,
            isCorrect: true,
            feedback: "Correct concept explained.",
        };
    }

    if (finalMatchScore >= 0.5 || shortRelevantAnswer) {
        return {
            awardedMarks: Math.max(0.5, marks * 0.5),
            isCorrect: false,
            feedback:
                "Partially correct. The answer includes an important idea but needs more detail.",
        };
    }

    if (finalMatchScore >= 0.3 || bestStudentCoverage >= 0.5) {
        return {
            awardedMarks: Math.max(0.25, marks * 0.25),
            isCorrect: false,
            feedback: "Some relevant points found, but the answer is incomplete.",
        };
    }

    return {
        awardedMarks: 0,
        isCorrect: false,
        feedback: "Incorrect answer.",
    };
};

const evaluateSingleAnswer = (question, submittedAnswer) => {
    const type = question?.type;
    const marks = Number(question?.marks || 1);
    const studentAnswer = getStudentSelectedAnswer(submittedAnswer);
    const correctAnswer = question?.correctAnswer;

    if (type === "MCQ") {
        const isCorrect =
            normalizeAnswerText(studentAnswer) ===
            normalizeAnswerText(correctAnswer);

        return {
            awardedMarks: isCorrect ? marks : 0,
            isCorrect,
            feedback: isCorrect
                ? "Correct option selected."
                : "Incorrect option selected.",
        };
    }

    if (type === "True or False") {
        const studentBoolean = convertToBoolean(studentAnswer);
        const correctBoolean = convertToBoolean(correctAnswer);
        const isCorrect =
            studentBoolean !== null &&
            correctBoolean !== null &&
            studentBoolean === correctBoolean;

        return {
            awardedMarks: isCorrect ? marks : 0,
            isCorrect,
            feedback: isCorrect ? "Correct answer." : "Incorrect answer.",
        };
    }

    if (type === "Fill In the Blanks" || type === "Very Short Answer") {
        return evaluateTypedAnswer({
            studentAnswer,
            correctAnswer,
            acceptableAnswers: question?.acceptableAnswers || [],
            gradingKeywords: question?.gradingKeywords || [],
            marks,
            type,
        });
    }

    const isCorrect =
        normalizeAnswerText(studentAnswer) === normalizeAnswerText(correctAnswer);

    return {
        awardedMarks: isCorrect ? marks : 0,
        isCorrect,
        feedback: isCorrect ? "Correct answer." : "Incorrect answer.",
    };
};

const getStudentBatchIds = (student) =>
    (student?.batches || []).map((batch) => String(batch._id || batch));

const normalizeAssignedBatchIds = (assignedTo) => {
    const nextAssigned = Array.isArray(assignedTo)
        ? assignedTo
        : assignedTo
          ? [assignedTo]
          : [];

    return nextAssigned
        .map((batchId) => String(batchId))
        .filter((batchId, index, array) =>
            batchId && mongoose.Types.ObjectId.isValid(batchId)
                ? array.indexOf(batchId) === index
                : false,
        );
};

const getAssignedBatchIds = (quiz) =>
    normalizeAssignedBatchIds(quiz?.assignedTo).map(String);

const canStudentAttemptQuiz = async (quiz, student) => {
    const now = new Date();
    const assignedBatchIds = getAssignedBatchIds(quiz);
    if (
        !assignedBatchIds.length ||
        !getStudentBatchIds(student).some((batchId) =>
            assignedBatchIds.includes(String(batchId)),
        )
    ) {
        return "You are not assigned to this quiz";
    }
    if (quiz.status !== "active") return "Quiz is not active";
    if (quiz.endDate && now > quiz.endDate) return "Quiz has ended";

    if (!quiz.allowReattempt) {
        const existingAttempt = await QuizAttempt.exists({
            quizId: quiz._id,
            studentId: student._id,
        });
        if (existingAttempt) return "You have already attempted this quiz";
    }

    return "";
};

// Utility function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

// Validation middleware for creating quiz
exports.createQuizValidation = [
    body("title")
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters"),

    body("instructions")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Instructions cannot exceed 2000 characters"),

    body("totalMarks")
        .isInt({ min: 1 })
        .withMessage("Total marks must be a positive integer"),

    body("timeLimit")
        .optional()
        .isInt({ min: 1, max: 600 })
        .withMessage("Time limit must be between 1 and 600 minutes"),

    body("startDate")
        .optional()
        .isISO8601()
        .withMessage("Start date must be a valid date"),

    body("endDate")
        .optional()
        .isISO8601()
        .withMessage("End date must be a valid date")
        .custom((endDate, { req }) => {
            if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),

    body("allowReattempt")
        .optional()
        .isBoolean()
        .withMessage("Allow reattempt must be a boolean"),

    body("showCorrectAnswers")
        .optional()
        .isBoolean()
        .withMessage("Show correct answers must be a boolean"),

    body("passingPercentage")
        .isFloat({ min: 0, max: 100 })
        .withMessage("Passing percentage must be between 0 and 100"),

    body("questions")
        .isArray({ min: 1 })
        .withMessage("Questions must be a non-empty array"),


    body("questions.*.type")
        .isIn(["MCQ", "Very Short Answer", "Fill In the Blanks", "True or False"])
        .withMessage("Invalid question type"),

    body("questions.*.question")
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage("Question text must be between 5 and 1000 characters"),

    body("questions.*.marks")
        .isInt({ min: 1 })
        .withMessage("Question marks must be a positive integer"),


    body("assignedTo")
        .optional()
        .custom((assignedTo) => {
            const batchIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
            if (!batchIds.length) {
                throw new Error("assignedTo must include at least one batch");
            }
            const invalidBatch = batchIds.find(
                (batchId) => !mongoose.Types.ObjectId.isValid(batchId),
            );
            if (invalidBatch) {
                throw new Error("assignedTo must contain valid MongoDB ObjectIds");
            }
            return true;
        }),

    // Custom validation for questions
    body("questions").custom((questions) => {

        // Validate each question based on type
        for (const question of questions) {
            if (question.type === "MCQ") {
                if (
                    !question.options ||
                    !Array.isArray(question.options) ||
                    question.options.length < 2
                ) {
                    throw new Error(
                        `Single MCQ question "${question.id}" must have at least 2 options`
                    );
                }

                if (
                    typeof question.correctAnswer !== "string" ||
                    !question.options.includes(question.correctAnswer)
                ) {
                    throw new Error(
                        `Single MCQ question "${question.id}" must have a valid correct answer from options`
                    );
                }
            }


            if (question.type === "True or False") {
                if (typeof question.correctAnswer === "string") {
                    question.correctAnswer = question.correctAnswer.trim().toLowerCase() === "true";
                }

                if (typeof question.correctAnswer !== "boolean") {
                    throw new Error(`True/False question "${question.id}" must have a boolean correct answer`);
                }
            }

            if (question.type === "Very Short Answer" || question.type === "Fill In the Blanks") {
                if (typeof question.correctAnswer !== "string" || question.correctAnswer.trim().length === 0) {
                    throw new Error(`Short answer question "${question.id}" must have a non-empty string correct answer`);
                }
            }
        }

        return true;
    }),

    handleValidationErrors
];

// Validation middleware for updating quiz
exports.updateQuizValidation = [
    param("id").isMongoId().withMessage("Invalid quiz ID"),
    body("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters"),

    body("totalMarks")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Total marks must be a positive integer"),

    body("timeLimit")
        .optional()
        .isInt({ min: 1, max: 600 })
        .withMessage("Time limit must be between 1 and 600 minutes"),

    body("passingPercentage")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("Passing percentage must be between 0 and 100"),

    handleValidationErrors
];

// Validation middleware for quiz attempt
exports.submitQuizValidation = [
    param("quizId").isMongoId().withMessage("Invalid quiz ID"),

    body("answers")
        .isArray({ min: 1 })
        .withMessage("Answers must be a non-empty array"),

    body("answers.*.questionId")
        .trim()
        .notEmpty()
        .withMessage("Question ID is required for each answer"),

    body("answers.*.selectedOption")
        .notEmpty()
        .withMessage("Selected option is required for each answer"),

    handleValidationErrors
];

/**
 * @desc    Create a new quiz
 * @route   POST /api/quizzes
 * @access  Private (Teachers only)
 */
exports.createQuiz = async (req, res) => {

    try {
        const {
            title,
            description,
            instructions,
            totalMarks,
            timeLimit,
            startDate,
            endDate,
            allowReattempt,
            showCorrectAnswers,
            passingPercentage,
            questions,
            assignedTo,
            status,
            chapterIds = [],
            chapterNames = [],
        } = req.body;
        const assignedBatchIds = normalizeAssignedBatchIds(assignedTo);
        // Calculate total marks from questions
        const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        if (calculatedTotalMarks !== totalMarks) {
            return res.status(400).json({
                success: false,
                message: `Total marks mismatch. Calculated: ${calculatedTotalMarks}, Provided: ${totalMarks}`
            });
        }

        const quiz = new Quiz({
            title,
            description,
            instructions,
            totalMarks,
            timeLimit,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            allowReattempt,
            showCorrectAnswers,
            passingPercentage,
            questions,
            status: status || "draft",
            quizMode: req.body.quizMode || "formal",
            gameSettings: req.body.gameSettings || undefined,
            createdBy: req.teacher._id,
            assignedTo: assignedBatchIds,
            chapterIds: Array.isArray(chapterIds)
                ? chapterIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
                : [],
            chapterNames: Array.isArray(chapterNames)
                ? chapterNames.map(String).filter(Boolean)
                : [],
        });
        await quiz.save();

        if (assignedBatchIds.length) {
            await Batch.updateMany(
                { _id: { $in: assignedBatchIds } },
                { $addToSet: { quizzes: quiz._id } },
            );
        }

        res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            data: quiz
        });
    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * @desc    Get all quizzes with pagination and filtering
 * @route   GET /api/quizzes
 * @access  Private
 */
exports.getQuizzes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const {
            status,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
            quizMode,
            assignedTo
        } = req.query;
        const createdBy = req.teacher._id;
        // Build filter object
        const filter = {};

        if (status) filter.status = status;
        if (quizMode) {
            const requestedModes = String(quizMode)
                .split(",")
                .map((mode) => mode.trim())
                .filter(Boolean);

            if (requestedModes.length) {
                filter.quizMode = { $in: requestedModes };
            }
        }
        if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
            filter.assignedTo = assignedTo;
        }
        if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
            filter.createdBy = createdBy;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }



        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

        const quizzes = await Quiz.find(filter)
            .populate("createdBy", "name username")
            .populate("assignedTo")
            .select("-questions.correctAnswer") // Hide correct answers in list view
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Quiz.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                quizzes,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


/**
 * @desc    Get quiz by ID
 * @route   GET /api/quizzes/:id
 * @access  Private
 */

function shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
exports.createQuizgetQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID"
            });
        }

        const quiz = await Quiz.findById(id)
            .populate("createdBy", "name email");

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        if (req.student) {
            const denialMessage = await canStudentAttemptQuiz(quiz, req.student);
            if (denialMessage) {
                return res.status(403).json({
                    success: false,
                    message: denialMessage,
                });
            }
        }

        //convert to plain object (important)
        const quizObj = quiz.toObject();

        //Randomize Questionsand using a helper function to shuffle arrays
        if (req.userRole === "student" && quizObj.questions?.length) {
            quizObj.questions = shuffleArray(quizObj.questions);


            quizObj.questions = quizObj.questions.map(q => {
                const shuffledQuestion = {
                    ...q,
                    options: shuffleArray(q.options)
                };

                if (quizObj.quizMode === "formal") {
                    delete shuffledQuestion.correctAnswer;
                }

                return shuffledQuestion;
            });
        }

        res.status(200).json({
            success: true,
            quizObj
        });

    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * @desc    Update quiz
 * @route   PUT /api/quizzes/:id
 * @access  Private (Creator only)
 */
exports.updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Check if user is the creator
        if (quiz.createdBy.toString() !== req.teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only quiz creator can update the quiz"
            });
        }

        // Check if quiz has attempts (restrict major changes)
        const hasAttempts = await QuizAttempt.exists({ quizId: id });
        if (hasAttempts && req.body.questions) {
            return res.status(400).json({
                success: false,
                message: "Cannot modify questions after quiz has been attempted"
            });
        }

        // Validate total marks if questions are being updated
        if (req.body.questions && req.body.totalMarks) {
            const calculatedTotalMarks = req.body.questions.reduce((sum, q) => sum + q.marks, 0);
            if (calculatedTotalMarks !== req.body.totalMarks) {
                return res.status(400).json({
                    success: false,
                    message: `Total marks mismatch. Calculated: ${calculatedTotalMarks}, Provided: ${req.body.totalMarks}`
                });
            }
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate("createdBy", "name username")
            .populate("assignedTo", "name");

        res.status(200).json({
            success: true,
            message: "Quiz updated successfully",
            data: updatedQuiz
        });
    } catch (error) {
        console.error("Error updating quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * @desc    Delete quiz
 * @route   DELETE /api/quizzes/:id
 * @access  Private (Creator only)
 */
exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID",
            });
        }

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        // Check if user is the creator
        if (quiz.createdBy.toString() !== req.teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only quiz creator can delete the quiz",
            });
        }

        // Get related attempt IDs
        const attempts = await AttemptQuiz.find({ quizId: id }).select("_id");

        // Remove attempts from students
        if (attempts.length > 0) {
            const attemptIds = attempts.map((a) => a._id);
            await Student.updateMany(
                { quizAttempts: { $in: attemptIds } },
                { $pull: { quizAttempts: { $in: attemptIds } } }
            );
        }

        // Delete related quiz attempts
        await AttemptQuiz.deleteMany({ quizId: id });

        // Remove quiz reference from batch
        await Batch.findOneAndUpdate({ quizzes: id }, { $pull: { quizzes: id } });

        // Delete the quiz
        const quizDelete = await Quiz.findByIdAndDelete(id);
        if (!quizDelete) {
            return res.status(404).json({
                success: false,
                message: "Unable to delete quiz",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Quiz and related data deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


/**
 * @desc    Submit quiz attempt
 * @route   POST /api/quizzes/:quizId/attempt
 * @access  Private (Students only)
 */
exports.submitQuizAttempt = async (req, res) => {
    try {
        const { quizId, answers, duration } = req.body;
        const studentId = req.student?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: student not found in token"
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be an array"
            });
        }

        const denialMessage = await canStudentAttemptQuiz(quiz, student);
        if (denialMessage) {
            return res.status(403).json({
                success: false,
                message: denialMessage,
            });
        }

        const submittedByQuestion = new Map(
            answers.map((answer) => [String(answer.questionId), answer]),
        );
        let score = 0;
        const evaluatedAnswers = quiz.questions.map((question) => {
            const submittedAnswer = submittedByQuestion.get(String(question._id));
            const evaluation = evaluateSingleAnswer(question, submittedAnswer);
            score += Number(evaluation.awardedMarks || 0);

            return {
                questionId: String(question._id),
                questionType: question.type,
                question: question.question,
                selectedOption: getStudentSelectedAnswer(submittedAnswer),
                correctAnswer: question.correctAnswer,
                maxMarks: Number(question.marks || 1),
                awardedMarks: Number(evaluation.awardedMarks || 0),
                isCorrect: evaluation.isCorrect,
                feedback: evaluation.feedback,
            };
        });
        const percentage = quiz.totalMarks
            ? Math.round((score / quiz.totalMarks) * 10000) / 100
            : 0;
        const isPassed = percentage >= quiz.passingPercentage;

        // Create new attempt
        const AttemptQuiz = await QuizAttempt.create({
            quizId,
            studentId,
            answers: evaluatedAnswers,
            score,
            isPassed,
            percentage,
            duration
        });
        // Push attempt into student's quizAttempts array
        student.quizAttempts.push(AttemptQuiz._id);
        await student.save();

        res.status(201).json({
            success: true,
            message: "Quiz submitted successfully",
            AttemptQuiz
        });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getQuizAnalytics = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            createdBy: req.teacher._id,
        }).populate("assignedTo", "batchName students");

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        const attempts = await QuizAttempt.find({ quizId: quiz._id })
            .populate("studentId", "name username class section")
            .sort({ createdAt: -1 })
            .lean();
        const latestAttempts = new Map();
        attempts.forEach((attempt) => {
            const studentId = String(attempt.studentId?._id || attempt.studentId);
            if (!latestAttempts.has(studentId)) latestAttempts.set(studentId, attempt);
        });
        const uniqueAttempts = [...latestAttempts.values()];
        const attemptedIds = new Set(uniqueAttempts.map((attempt) => String(attempt.studentId?._id || attempt.studentId)));
        const batchStudents = Array.from(
            new Set(
                (quiz.assignedTo || []).flatMap((batch) =>
                    (batch?.students || []).map((student) => String(student)),
                ),
            ),
        );
        const batchStudentDocs = batchStudents.length
            ? await Student.find(
                { _id: { $in: batchStudents } },
                "name username class section",
            ).lean()
            : [];
        const notAttempted = batchStudentDocs.filter(
            (student) => !attemptedIds.has(String(student._id)),
        );
        const scores = uniqueAttempts.map((attempt) => Number(attempt.percentage || 0));
        const averagePercentage = scores.length
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;
        const questionStats = quiz.questions.map((question) => {
            const answerRows = uniqueAttempts
                .map((attempt) =>
                    attempt.answers.find(
                        (answer) => String(answer.questionId) === String(question._id),
                    ),
                )
                .filter(Boolean);
            const correctCount = answerRows.filter((answer) => answer.isCorrect).length;
            const responseTally = new Map();
            answerRows.forEach((answer) => {
                const selectedOption = answer.selectedOption;
                let normalizedAnswer = "No answer";

                if (Array.isArray(selectedOption)) {
                    normalizedAnswer = selectedOption.length
                        ? selectedOption.join(", ")
                        : "No answer";
                } else if (
                    selectedOption !== undefined &&
                    selectedOption !== null &&
                    String(selectedOption).trim() !== ""
                ) {
                    normalizedAnswer = String(selectedOption).trim();
                }

                responseTally.set(
                    normalizedAnswer,
                    (responseTally.get(normalizedAnswer) || 0) + 1,
                );
            });

            const commonResponses = [...responseTally.entries()]
                .sort((first, second) => second[1] - first[1])
                .slice(0, 4)
                .map(([answer, count]) => ({
                    answer,
                    count,
                }));

            return {
                questionId: question._id,
                question: question.question,
                type: question.type,
                correctAnswer: question.correctAnswer,
                options: Array.isArray(question.options) ? question.options : [],
                correctCount,
                attemptCount: answerRows.length,
                accuracy: answerRows.length
                    ? Math.round((correctCount / answerRows.length) * 100)
                    : 0,
                commonResponses,
            };
        });

        return res.json({
            success: true,
            analytics: {
                attempts: uniqueAttempts.length,
                batchSize: batchStudentDocs.length,
                assignedBatchCount: (quiz.assignedTo || []).length,
                notAttemptedCount: notAttempted.length,
                notAttemptedStudents: notAttempted.map((student) => ({
                    _id: student._id,
                    name: student.name,
                    username: student.username,
                    class: student.class,
                    section: student.section,
                })),
                averagePercentage,
                highestPercentage: scores.length ? Math.max(...scores) : 0,
                lowestPercentage: scores.length ? Math.min(...scores) : 0,
                passedCount: uniqueAttempts.filter((attempt) => attempt.isPassed).length,
                recentAttempts: uniqueAttempts
                    .slice()
                    .sort(
                        (first, second) =>
                            new Date(second.createdAt) - new Date(first.createdAt),
                    )
                    .slice(0, 8)
                    .map((attempt) => ({
                        _id: attempt._id,
                        studentName: attempt.studentId?.name || "Student",
                        username: attempt.studentId?.username || "",
                        percentage: Math.round(attempt.percentage || 0),
                        score: attempt.score || 0,
                        isPassed: attempt.isPassed,
                        submittedAt: attempt.createdAt,
                    })),
                questionStats,
            },
        });
    } catch (error) {
        console.error("Error fetching quiz analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch quiz analytics",
        });
    }
};

exports.duplicateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            createdBy: req.teacher._id,
        }).lean();
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        const duplicateAssignedBatchIds = normalizeAssignedBatchIds(
            req.body.assignedTo || quiz.assignedTo,
        );

        const duplicate = await Quiz.create({
            ...quiz,
            _id: undefined,
            title: `${quiz.title} - Copy`,
            assignedTo: duplicateAssignedBatchIds,
            status: "draft",
            createdAt: undefined,
            updatedAt: undefined,
        });

        if (duplicateAssignedBatchIds.length) {
            await Batch.updateMany(
                { _id: { $in: duplicateAssignedBatchIds } },
                { $addToSet: { quizzes: duplicate._id } },
            );
        }

        return res.status(201).json({
            success: true,
            message: "Quiz duplicated as draft",
            data: duplicate,
        });
    } catch (error) {
        console.error("Error duplicating quiz:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to duplicate quiz",
        });
    }
};


/**
 * @desc    Get quiz attempts for a specific quiz
 * @route   GET /api/quizzes/:quizId/attempts
 * @access  Private (Creator and assigned students)
 */
exports.getQuizzesWithStatus = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", status = "", sort = "desc" } = req.query;

        const query = {};

        //  ADD BATCH FILTERING FOR STUDENTS
        if (req.student) {
            const studentBatches = req.student.batches;
            // If student has no batches, return empty array
            if (!studentBatches || studentBatches.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        quizzes: [],
                        pagination: {
                            totalItems: 0,
                            currentPage: parseInt(page),
                            totalPages: 0,
                            limit: parseInt(limit),
                        },
                    },
                    message: "No batches assigned to this student"
                });
            }

            // Filter quizzes by student's batches
            const batchIds = studentBatches.map(batch => {
                const batchId = batch._id || batch;
                return mongoose.Types.ObjectId.isValid(batchId)
                    ? new mongoose.Types.ObjectId(batchId)
                    : batchId;
            });

            query.assignedTo = { $in: batchIds };


        }

        // search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // filter by status
        if (status) {
            query.status = status;
        }

        const totalItems = await Quiz.countDocuments(query);

        const quizzes = await Quiz.find(query)
            .populate("assignedTo", "name") // populate batch info
            .sort({ createdAt: sort === "asc" ? 1 : -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();


        // Get student's attempts
        const attempts = await QuizAttempt.find({ studentId: req.student._id }).lean();

        const attemptsMap = {};
        attempts.forEach((a) => {
            attemptsMap[a.quizId.toString()] = a;
        });

        const result = quizzes.map((q) => ({
            ...q,
            attempted: !!attemptsMap[q._id.toString()],
            attemptId: attemptsMap[q._id.toString()]?._id || null,
        }));

        res.json({
            success: true,
            data: {
                quizzes: result,
                pagination: {
                    totalItems,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error('Error in getQuizzes:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};



exports.getQuizAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID"
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Build filter for attempts
        const filter = { quizId };

        // Students can only see their own attempts
        if (req.user.role === "student") {
            filter.studentId = req.user.id;
        }

        const attempts = await QuizAttempt.find(filter)
            .populate("studentId", "name email class section")
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await QuizAttempt.countDocuments(filter);

        // Add percentage and pass/fail status to each attempt
        const enrichedAttempts = attempts.map(attempt => {
            const percentage = (attempt.score / quiz.totalMarks) * 100;
            return {
                ...attempt.toObject(),
                percentage: Math.round(percentage * 100) / 100,
                passed: percentage >= quiz.passingPercentage
            };
        });

        res.status(200).json({
            success: true,
            data: {
                attempts: enrichedAttempts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * @desc    Get detailed quiz attempt by ID
 * @route   GET /api/quiz-attempts/:attemptId
 * @access  Private
 */
exports.getQuizAttemptDetails = async (req, res) => {
    try {
        const { attemptId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attempt ID"
            });
        }

        const attempt = await QuizAttempt.findById(attemptId)
            .populate("studentId")
            .populate("quizId");

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found"
            });
        }

        res.status(200).json({
            success: true,
            attempt

        });
    } catch (error) {
        console.error("Error fetching attempt details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * @desc    Teacher review / override quiz attempt marks
 * @route   PUT /api/quiz/attempt/:attemptId/review
 * @access  Private (Teachers only)
 */
exports.reviewQuizAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { answers = [] } = req.body;

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attempt ID",
            });
        }

        if (!Array.isArray(answers) || !answers.length) {
            return res.status(400).json({
                success: false,
                message: "Reviewed answers are required",
            });
        }

        const attempt = await QuizAttempt.findById(attemptId).populate("quizId");

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found",
            });
        }

        if (!attempt.quizId) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found for this attempt",
            });
        }

        if (String(attempt.quizId.createdBy) !== String(req.teacher._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to review this attempt",
            });
        }

        const questionMap = new Map(
            (attempt.quizId.questions || []).map((question) => [
                String(question._id || question.id),
                question,
            ]),
        );

        const submittedAnswerMap = new Map(
            (attempt.answers || []).map((answer) => [String(answer.questionId), answer]),
        );

        let recalculatedScore = 0;

        answers.forEach((reviewedAnswer) => {
            const questionId = String(reviewedAnswer.questionId || "");
            const existingAnswer = submittedAnswerMap.get(questionId);
            const question = questionMap.get(questionId);

            if (!existingAnswer || !question) return;

            const maxMarks = Number(question.marks || existingAnswer.maxMarks || 0);
            const nextMarks = Number(reviewedAnswer.awardedMarks);

            const safeAwardedMarks = Number.isFinite(nextMarks)
                ? Math.min(Math.max(nextMarks, 0), maxMarks)
                : Number(existingAnswer.awardedMarks || 0);

            existingAnswer.maxMarks = maxMarks;
            existingAnswer.awardedMarks = safeAwardedMarks;
            existingAnswer.feedback =
                typeof reviewedAnswer.feedback === "string"
                    ? reviewedAnswer.feedback.trim()
                    : existingAnswer.feedback || "";
            existingAnswer.isCorrect =
                safeAwardedMarks >= maxMarks && maxMarks > 0;

            recalculatedScore += safeAwardedMarks;
        });

        attempt.score = recalculatedScore;
        attempt.percentage = attempt.quizId.totalMarks
            ? Math.round((recalculatedScore / Number(attempt.quizId.totalMarks || 1)) * 10000) / 100
            : 0;
        attempt.isPassed =
            attempt.percentage >= Number(attempt.quizId.passingPercentage || 0);
        attempt.teacherReviewed = true;
        attempt.teacherReviewedAt = new Date();
        attempt.teacherReviewedBy = req.teacher._id;

        await attempt.save();
        await attempt.populate("studentId");
        await attempt.populate("quizId");

        return res.status(200).json({
            success: true,
            message: "Quiz attempt reviewed successfully",
            attempt,
        });
    } catch (error) {
        console.error("Error reviewing quiz attempt:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to review quiz attempt",
            error: error.message,
        });
    }
};


/**
 * @desc    Get quiz for student attempt (without correct answers)
 * @route   GET /api/quizzes/:quizId/attempt
 * @access  Private (Assigned students only)
 */
exports.getQuizForAttempt = async (req, res) => {
    try {
        const { quizId } = req.params;
        const studentId = req.user.id;

        const quiz = await Quiz.findById(quizId)
            .populate("createdBy", "name");

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Check if student is assigned
        const assignedBatchIds = getAssignedBatchIds(quiz);
        const studentBatchIds = getStudentBatchIds(req.student || {});
        const hasMatchingBatch = studentBatchIds.some((batchId) =>
            assignedBatchIds.includes(String(batchId)),
        );

        if (!hasMatchingBatch) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this quiz"
            });
        }

        // Check quiz status and timing
        if (quiz.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Quiz is not active"
            });
        }

        const now = new Date();
        if (quiz.endDate && now > quiz.endDate) {
            return res.status(400).json({
                success: false,
                message: "Quiz has ended"
            });
        }

        // Check for existing attempts
        const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
        if (existingAttempt && !quiz.allowReattempt) {
            return res.status(400).json({
                success: false,
                message: "You have already attempted this quiz",
                attemptId: existingAttempt._id
            });
        }

        // Remove correct answers only for formal assessments.
        const questionsForStudent = quiz.questions.map((question) => {
            const nextQuestion = {
                _id: question._id,
                id: question.id,
                type: question.type,
                question: question.question,
                options: question.options,
                marks: question.marks,
            };

            if (quiz.quizMode !== "formal") {
                nextQuestion.correctAnswer = question.correctAnswer;
            }

            return nextQuestion;
        });

        res.status(200).json({
            success: true,
            data: {
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                instructions: quiz.instructions,
                status: quiz.status,
                quizMode: quiz.quizMode || "formal",
                totalMarks: quiz.totalMarks,
                timeLimit: quiz.timeLimit,
                passingPercentage: quiz.passingPercentage,
                questions: questionsForStudent,
                createdBy: quiz.createdBy.name,
                hasExistingAttempt: !!existingAttempt,
                allowReattempt: quiz.allowReattempt
            }
        });
    } catch (error) {
        console.error("Error fetching quiz for attempt:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};



exports.getBatchForQuiz = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id)
            .populate('batches', 'batchName _id batchId')

        if (!teacher.batches.length) {
            return res.status(404).json({
                success: false,
                message: "No batches found for teacher"
            });
        }

        res.json({
            success: true,
            teacherBatches: teacher.batches,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get all attempts for teacher's batch 
// @route   GET /api/quiz/submitted
// @access  Private (teacher)
exports.getBatchAttempts = async (req, res) => {
    try {
        const { page = 1, limit = 10, studentName, grade, section, submittedAt,quizId } = req.query;
        // const { quizId } = req.params;

        // 1. Teacher ke batches
        const teacherBatches = await Batch.find({ teachers: { $elemMatch: { teacher: req.teacher._id } } });
        if (!teacherBatches.length) {
            return res.status(404).json({ success: false, message: "No batches found for teacher" });
        }

        const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.teacher._id });
        if (!quiz) {
            return res.status(403).json({ success: false, message: "Quiz not found or unauthorized" });
        }

        const studentIds = teacherBatches.flatMap(b => b.students.map(s => s._id));

        // 2. Student-level filters DB pe resolve karo
        const studentFilter = { _id: { $in: studentIds } };
        if (studentName) studentFilter.name = { $regex: studentName, $options: "i" };
        if (grade) studentFilter.class = grade;
        if (section) studentFilter.section = section;

        const matchingStudents = await Student.find(studentFilter, "_id");
        const matchingStudentIds = matchingStudents.map(s => s._id);

        // 3. AttemptQuiz query build karo
        const query = {
            quizId,
            studentId: { $in: matchingStudentIds },
        };

        if (submittedAt) {
            const [day, month, year] = submittedAt.split("/");
            const start = new Date(year, month - 1, day, 0, 0, 0);
            const end = new Date(year, month - 1, day, 23, 59, 59);
            query.submittedAt = { $gte: start, $lte: end };
        }

        const skip = (page - 1) * limit;
        const total = await AttemptQuiz.countDocuments(query);

        const attempts = await AttemptQuiz.find(query)
            .populate("studentId", "name username class section")
            .populate("quizId", "title description")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            attempts,
            pagination: {
                page: Number(page),
                pages: Math.ceil(total / limit),
                totalDocuments: total,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getBatchAndQuiz = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // find all batches of this student
        const studentBatches = await Batch.find({ students: req.student._id });

        if (!studentBatches.length) {
            return res.status(404).json({
                success: false,
                message: "No batches found for student"
            });
        }

        // collect all quiz IDs from those batches
        const quizIds = studentBatches.flatMap(b => b.quizzes);

        const skip = (page - 1) * limit;

        // fetch quizzes
        const quizzes = await Quiz.find({ _id: { $in: quizIds } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // count total
        const total = await Quiz.countDocuments({ _id: { $in: quizIds } });

        res.json({
            success: true,
            quizzes,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
