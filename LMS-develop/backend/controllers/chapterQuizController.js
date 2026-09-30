const ChapterQuiz = require("../models/ChapterwiseQuiz");
const ChapterQuizAttempt = require("../models/ChapterwiseQuizAttempt");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const axios = require("axios");
const Chapter = require("../models/Chapter");
const { recordAiUsage } = require("../services/aiUsageService");

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

const buildMissingAiraSourceMessage = (chapters = []) => {
    const chapterNames = chapters
        .map((chapter) => chapter?.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
    const suffix = chapterNames ? ` (${chapterNames})` : "";
    const hasVisibleEbook = chapters.some((chapter) => chapter?.Ebook);

    if (hasVisibleEbook) {
        return `Selected ebook${suffix} is available for viewing, but it is not indexed for AIRA quiz generation. Please re-upload the ebook file once so AIRA can read it.`;
    }

    return `Selected chapter${suffix} does not have an ebook uploaded. Please upload ebook first.`;
};

// Utility function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    next();
};

exports.generateAiraChapterQuiz = async (req, res) => {
    try {
        const {
            chapterId,
            chapterIds = [],
            blueprint,
            quizType = "MCQ",
            difficulty = "Medium",
            numberOfQuestions = 5,
            marksPerQuestion = 1,
        } = req.body;

        const requestedChapterIds = [
            ...(Array.isArray(chapterIds) ? chapterIds : []),
            chapterId,
        ]
            .filter(Boolean)
            .filter((id, index, allIds) => allIds.indexOf(id) === index);

        if (!requestedChapterIds.length) {
            return res.status(400).json({
                success: false,
                message: "At least one chapter is required",
            });
        }

        const invalidChapterId = requestedChapterIds.find(
            (id) => !mongoose.Types.ObjectId.isValid(id),
        );

        if (invalidChapterId) {
            return res.status(400).json({
                success: false,
                message: "Invalid chapter selected",
            });
        }

        const chapters = await hydrateChaptersWithAiraSources(
            await Chapter.find({
                _id: { $in: requestedChapterIds },
            }).lean(),
        );

        if (!chapters.length) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
            });
        }

        const chaptersWithPdf = chapters.filter((chapter) => chapter.pdfText);

        if (!chaptersWithPdf.length) {
            return res.status(400).json({
                success: false,
                message: buildMissingAiraSourceMessage(chapters),
            });
        }

        const missingPdfChapters = chapters.filter((chapter) => !chapter.pdfText);

        const apiKey = process.env.CHATPDF_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "CHATPDF_API_KEY is missing in backend .env",
            });
        }

        const allowedTypes = [
            "MCQ",
            "True or False",
            "Fill In the Blanks",
            "Very Short Answer",
        ];

        const allowedDifficulty = ["Easy", "Medium", "Hard"];

        const getFallbackQuizType = (index) => {
            if (quizType === "Mixed") {
                return allowedTypes[index % allowedTypes.length];
            }

            return allowedTypes.includes(quizType) ? quizType : "MCQ";
        };

        const fallbackBlueprint = Array.from(
            { length: Math.max(1, Number(numberOfQuestions) || 5) },
            (_, index) => ({
                questionNumber: index + 1,
                quizType: getFallbackQuizType(index),
                difficulty,
                marks: marksPerQuestion,
            }),
        );

        const finalBlueprint =
            Array.isArray(blueprint) && blueprint.length > 0
                ? blueprint
                : fallbackBlueprint;

        const cleanedBlueprint = finalBlueprint
            .map((item, index) => {
                const rawQuizType = item.quizType || item.type || quizType;
                const normalizedQuizType =
                    rawQuizType === "Mixed"
                        ? allowedTypes[index % allowedTypes.length]
                        : rawQuizType;

                return {
                    questionNumber: Number(item.questionNumber) || index + 1,
                    quizType: allowedTypes.includes(normalizedQuizType)
                        ? normalizedQuizType
                        : "MCQ",
                    difficulty: allowedDifficulty.includes(item.difficulty)
                        ? item.difficulty
                        : allowedDifficulty.includes(difficulty)
                          ? difficulty
                          : "Medium",
                    marks: Math.max(
                        1,
                        Number(item.marks) || Number(marksPerQuestion) || 1,
                    ),
                };
            })
            .filter((item) => item.quizType && item.difficulty && item.marks);

        if (!cleanedBlueprint.length) {
            return res.status(400).json({
                success: false,
                message: "At least one valid blueprint row is required.",
            });
        }

        const MAX_BATCH_SIZE = 5;
        const MAX_RETRY_PER_BATCH = 2;
        const MAX_REGEN_ROUNDS = 3;

        const splitIntoBatches = (array, size) => {
            const batches = [];

            for (let i = 0; i < array.length; i += size) {
                batches.push(array.slice(i, i + size));
            }

            return batches;
        };

        const normalizeText = (text = "") => {
            return String(text || "")
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(/\s+/g, " ")
                .trim();
        };

        const getWords = (text = "") => {
            return new Set(
                normalizeText(text)
                    .split(" ")
                    .filter((word) => word.length > 2),
            );
        };

        const similarityScore = (a = "", b = "") => {
            const wordsA = getWords(a);
            const wordsB = getWords(b);

            if (!wordsA.size || !wordsB.size) return 0;

            const intersection = [...wordsA].filter((word) =>
                wordsB.has(word),
            ).length;

            const union = new Set([...wordsA, ...wordsB]).size;

            return union === 0 ? 0 : intersection / union;
        };

        const isNearDuplicate = (
            question,
            existingQuestions,
            threshold = 0.72,
        ) => {
            const currentText = question?.question || "";

            return existingQuestions.some((existing) => {
                return (
                    normalizeText(existing.question) ===
                        normalizeText(currentText) ||
                    similarityScore(existing.question, currentText) >= threshold
                );
            });
        };

        const safeParseJson = (rawText) => {
            let text = String(rawText || "")
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            try {
                return JSON.parse(text);
            } catch (error) {
                const firstBrace = text.indexOf("{");
                const lastBrace = text.lastIndexOf("}");

                if (
                    firstBrace !== -1 &&
                    lastBrace !== -1 &&
                    lastBrace > firstBrace
                ) {
                    const jsonOnly = text.slice(firstBrace, lastBrace + 1);
                    return JSON.parse(jsonOnly);
                }

                throw error;
            }
        };

        const normalizeQuestion = (q, expectedBlueprint) => {
            const cleanGeneratedText = (value = "") => {
                return String(value || "")
                    .replace(/\\n/g, "\n")
                    .replace(/\\t/g, "    ")
                    .replace(/\r\n/g, "\n")
                    .replace(/\n{3,}/g, "\n\n")
                    .trim();
            };
            let type = allowedTypes.includes(q?.type)
                ? q.type
                : expectedBlueprint.quizType;

            let options = Array.isArray(q?.options)
                ? q.options.filter(Boolean).map(String)
                : [];

            let correctAnswer = q?.correctAnswer;

            if (type === "MCQ") {
                options = options
                    .map((option) => cleanGeneratedText(option))
                    .filter(Boolean);

                while (options.length < 4) {
                    options.push(`Option ${options.length + 1}`);
                }

                options = options.slice(0, 4);

                if (!options.includes(correctAnswer)) {
                    correctAnswer = options[0];
                }
            }

            if (type === "True or False") {
                if (typeof correctAnswer === "string") {
                    correctAnswer =
                        correctAnswer.toLowerCase().trim() === "true";
                }

                if (typeof correctAnswer !== "boolean") {
                    correctAnswer = true;
                }

                options = [];
            }

            if (type === "Fill In the Blanks" || type === "Very Short Answer") {
                correctAnswer = cleanGeneratedText(correctAnswer || "");

                if (!correctAnswer) {
                    correctAnswer = "Answer not provided";
                }

                options = [];
            }

            const finalQuestion = cleanGeneratedText(q?.question || "");

            if (!finalQuestion) return null;

            return {
                type,
                difficulty: allowedDifficulty.includes(q?.difficulty)
                    ? q.difficulty
                    : expectedBlueprint.difficulty,
                question: finalQuestion,
                options,
                correctAnswer,
                acceptableAnswers: Array.isArray(q?.acceptableAnswers)
                    ? q.acceptableAnswers.map(String).filter(Boolean)
                    : [],
                gradingKeywords: Array.isArray(q?.gradingKeywords)
                    ? q.gradingKeywords.map(String).filter(Boolean)
                    : [],
                gradingHint: String(q?.gradingHint || "").trim(),
                marks: Math.max(1, Number(q?.marks) || expectedBlueprint.marks),
                questionNumber: expectedBlueprint.questionNumber,
                source: "aira",
            };
        };

        const buildAvoidListText = (existingQuestions = []) => {
            if (!existingQuestions.length) return "None yet.";

            return existingQuestions
                .slice(-20)
                .map((question, index) => `${index + 1}. ${question.question}`)
                .join("\n");
        };

        const generateBatch = async ({
            batchBlueprint,
            batchIndex,
            existingQuestions = [],
            retryIndex = 0,
        }) => {
            const chapter = chaptersWithPdf[batchIndex % chaptersWithPdf.length];
            const blueprintText = batchBlueprint
                .map(
                    (item) =>
                        `Q${item.questionNumber}: Type=${item.quizType}, Difficulty=${item.difficulty}, Marks=${item.marks}`,
                )
                .join("\n");

            const avoidQuestionsText = buildAvoidListText(existingQuestions);

            const prompt = `
You are AIRA, an expert LMS quiz generator.

Use ONLY the uploaded chapter PDF content.
Do not use outside knowledge.
Do not invent facts.

Generate exactly ONE question for EACH blueprint row below.

Chapter Name: ${chapter.name}
Selected Quiz Chapters: ${chaptersWithPdf.map((item) => item.name).join(", ")}

QUIZ BLUEPRINT:
${blueprintText}

DO NOT REPEAT OR REPHRASE THESE EXISTING QUESTIONS:
${avoidQuestionsText}

IMPORTANT JSON RULES:
Return ONLY valid JSON.
Do not add markdown.
Do not add explanation outside JSON.
Do not wrap JSON in code block.
Every string must be completed.
Use double quotes for all JSON keys and string values.
Do not stop midway.

JSON format:
{
  "title": "Quiz title here",
  "questions": [
    {
      "questionNumber": 1,
      "type": "MCQ",
      "difficulty": "Easy",
      "question": "Question text based only on the chapter PDF",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Exact correct option text",
      "acceptableAnswers": [],
      "gradingKeywords": [],
      "gradingHint": "",
      "marks": 1
    }
  ]
}

QUALITY RULES:
- Follow the blueprint exactly.
- Generate exactly one question for each blueprint row.
- Do not skip any blueprint row.
- Q number, type, difficulty, and marks must match the blueprint.
- Allowed types: MCQ, True or False, Fill In the Blanks, Very Short Answer.
- For MCQ, generate exactly 4 meaningful options.
- For MCQ, correctAnswer must exactly match one of the options.
- For True or False, correctAnswer must be boolean true or false.
- For Fill In the Blanks, include ________ in the question.
- Keep questions clear, school-friendly, and chapter-based.
- Each question must test a different idea, example, or skill.
- For code-based questions, use actual line breaks in the question text, not escaped \\n text.
- Do not repeat the same concept, same variable example, same answer pattern, or same code snippet.
- Avoid apostrophes inside options and answers. Example: write "Only the else part is done" instead of "Only the 'else' part is done".

For Fill In the Blanks and Very Short Answer questions:
- correctAnswer must be the expected answer based on the chapter PDF.
- acceptableAnswers must include 2 to 5 alternative correct answers.
- gradingKeywords must include important keywords needed for fair checking.
- gradingHint must explain how to evaluate the answer in one short sentence.

For MCQ and True or False:
- acceptableAnswers should be [].
- gradingKeywords should be [].
- gradingHint should be "".

Retry number: ${retryIndex}
`;

            const chatPdfResponse = await axios.post(
                "https://api.chatpdf.com/v1/chats/message",
                {
                    referenceSources: true,
                    sourceId: chapter.pdfText,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
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
                req,
                feature: "chapter_quiz_generation",
                sourceId: chapter.pdfText,
                metadata: {
                    batchIndex,
                    retryIndex,
                    requestedQuestions: batchBlueprint.length,
                },
            });

            const rawContent = chatPdfResponse.data?.content || "";

            let parsed;

            try {
                parsed = safeParseJson(rawContent);
            } catch (parseError) {
                console.error(
                    `AIRA quiz JSON parse failed in batch ${batchIndex + 1}, retry ${retryIndex}:`,
                    rawContent,
                );

                throw new Error(
                    `AIRA returned invalid JSON in batch ${batchIndex + 1}`,
                );
            }

            const parsedQuestions = Array.isArray(parsed.questions)
                ? parsed.questions
                : [];

            const normalizedQuestions = batchBlueprint
                .map((expectedBlueprint, index) => {
                    const matchingQuestion =
                        parsedQuestions.find(
                            (q) =>
                                Number(q.questionNumber) ===
                                Number(expectedBlueprint.questionNumber),
                        ) || parsedQuestions[index];

                    if (!matchingQuestion) return null;

                    return normalizeQuestion(
                        matchingQuestion,
                        expectedBlueprint,
                    );
                })
                .filter(Boolean);

            return {
                title: parsed.title || `${chapter.name} - AIRA Quiz`,
                questions: normalizedQuestions,
                references: chatPdfResponse.data?.references || [],
            };
        };

        let allQuestions = [];
        let allReferences = [];
        let quizTitle =
            chaptersWithPdf.length === 1
                ? `${chaptersWithPdf[0].name} - AIRA Quiz`
                : `${chaptersWithPdf.length} Chapters - AIRA Quiz`;

        const generateCleanQuestionsForBlueprint = async (blueprintRows) => {
            const batches = splitIntoBatches(blueprintRows, MAX_BATCH_SIZE);
            const cleanQuestions = [];
            const references = [];
            let title = quizTitle;

            for (let i = 0; i < batches.length; i++) {
                let batchResult = null;

                for (let retry = 0; retry <= MAX_RETRY_PER_BATCH; retry++) {
                    try {
                        batchResult = await generateBatch({
                            batchBlueprint: batches[i],
                            batchIndex: i,
                            existingQuestions: [
                                ...allQuestions,
                                ...cleanQuestions,
                            ],
                            retryIndex: retry,
                        });
                        break;
                    } catch (error) {
                        if (retry === MAX_RETRY_PER_BATCH) {
                            throw error;
                        }
                    }
                }

                if (batchResult?.title) title = batchResult.title;

                const accepted = [];

                for (const question of batchResult.questions || []) {
                    if (
                        !isNearDuplicate(question, [
                            ...allQuestions,
                            ...cleanQuestions,
                            ...accepted,
                        ])
                    ) {
                        accepted.push(question);
                    }
                }

                cleanQuestions.push(...accepted);
                references.push(...(batchResult.references || []));
            }

            return {
                title,
                questions: cleanQuestions,
                references,
            };
        };

        let pendingBlueprint = [...cleanedBlueprint];

        for (
            let round = 0;
            round < MAX_REGEN_ROUNDS && pendingBlueprint.length;
            round++
        ) {
            const result =
                await generateCleanQuestionsForBlueprint(pendingBlueprint);

            quizTitle = result.title || quizTitle;
            allReferences.push(...result.references);

            allQuestions.push(...result.questions);

            const generatedQuestionNumbers = new Set(
                allQuestions.map((q) => Number(q.questionNumber)),
            );

            pendingBlueprint = cleanedBlueprint.filter(
                (bp) =>
                    !generatedQuestionNumbers.has(Number(bp.questionNumber)),
            );
        }

        allQuestions = allQuestions
            .filter(Boolean)
            .sort(
                (a, b) => Number(a.questionNumber) - Number(b.questionNumber),
            );

        const missingCount = cleanedBlueprint.length - allQuestions.length;

        return res.status(200).json({
            success: true,
            message:
                missingCount > 0
                    ? `AIRA quiz generated with ${missingCount} question(s) missing after quality checks. Please generate again for remaining.`
                    : "AIRA quiz generated successfully",
            data: {
                title: quizTitle,
                questions: allQuestions,
                totalMarks: allQuestions.reduce(
                    (sum, q) => sum + Number(q.marks || 0),
                    0,
                ),
                references: allReferences,
                blueprint: cleanedBlueprint,
                chapters: chaptersWithPdf.map((chapter) => ({
                    _id: chapter._id,
                    name: chapter.name,
                })),
                skippedChapters: missingPdfChapters.map((chapter) => ({
                    _id: chapter._id,
                    name: chapter.name,
                    reason: "Missing ebook source",
                })),
                quality: {
                    requested: cleanedBlueprint.length,
                    generated: allQuestions.length,
                    missing: Math.max(0, missingCount),
                    batchSize: MAX_BATCH_SIZE,
                },
            },
        });
    } catch (error) {
        console.error(
            "Error in generateAiraChapterQuiz:",
            error.response?.data || error.message,
        );

        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error ||
                error.message ||
                "AIRA quiz generation failed",
        });
    }
};

// Validation middleware for creating quiz
exports.createChapterQuizValidation = [
    body("totalMarks")
        .isInt({ min: 1 })
        .withMessage("Total marks must be a positive integer"),

    body("timeLimit")
        .optional()
        .isInt({ min: 1, max: 600 })
        .withMessage("Time limit must be between 1 and 600 minutes"),
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
        .isIn([
            "MCQ",
            "Fill In the Blanks",
            "True or False",
            "Very Short Answer",
        ])
        .withMessage("Invalid question type"),

    body("questions.*.question")
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage("Question text must be between 5 and 1000 characters"),

    body("questions.*.marks")
        .isInt({ min: 1 })
        .withMessage("Question marks must be a positive integer"),

    body("assignedChapter")
        .optional()
        .custom((assignedChapter) => {
            if (!mongoose.Types.ObjectId.isValid(assignedChapter)) {
                throw new Error(
                    "assignedChapter must be a valid MongoDB ObjectId",
                );
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
                        `Single MCQ question "${question.id}" must have at least 2 options`,
                    );
                }

                if (
                    typeof question.correctAnswer !== "string" ||
                    !question.options.includes(question.correctAnswer)
                ) {
                    throw new Error(
                        `Single MCQ question "${question.id}" must have a valid correct answer from options`,
                    );
                }
            }

            if (question.type === "True or False") {
                if (typeof question.correctAnswer === "string") {
                    question.correctAnswer =
                        question.correctAnswer.trim().toLowerCase() === "true";
                }

                if (typeof question.correctAnswer !== "boolean") {
                    throw new Error(
                        `True/False question "${question.id}" must have a boolean correct answer`,
                    );
                }
            }

            if (
                question.type === "Very Short Answer" ||
                question.type === "Fill In the Blanks"
            ) {
                if (
                    typeof question.correctAnswer !== "string" ||
                    question.correctAnswer.trim().length === 0
                ) {
                    throw new Error(
                        `Short answer question "${question.id}" must have a non-empty string correct answer`,
                    );
                }
            }
        }

        return true;
    }),

    handleValidationErrors,
];

// Validation middleware for updating quiz
exports.updateChapterQuizValidation = [
    param("id").isMongoId().withMessage("Invalid quiz ID"),
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

    handleValidationErrors,
];

// Validation middleware for quiz attempt
exports.submitChapterQuizValidation = [
    param("ChapterquizId").isMongoId().withMessage("Invalid quiz ID"),

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

    handleValidationErrors,
];

/**
 * @desc    Create a new quiz for chapter
 * @route   POST /api/chapter-quiz
 * @access  Private (Teachers only)
 */
exports.createChapterQuiz = async (req, res) => {
    try {
        const {
            title,
            totalMarks,
            timeLimit,
            allowReattempt,
            showCorrectAnswers,
            passingPercentage,
            questions,
            assignedChapter,
            assignedChapters = [],
            chapterNames = [],
        } = req.body;

        // Calculate total marks from questions
        const calculatedTotalMarks = questions.reduce(
            (sum, q) => sum + q.marks,
            0,
        );
        if (calculatedTotalMarks !== totalMarks) {
            return res.status(400).json({
                success: false,
                message: `Total marks mismatch. Calculated: ${calculatedTotalMarks}, Provided: ${totalMarks}`,
            });
        }

        const normalizedAssignedChapters = [
            ...(Array.isArray(assignedChapters) ? assignedChapters : []),
            assignedChapter,
        ]
            .filter(Boolean)
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .filter((id, index, allIds) => allIds.indexOf(id) === index);

        const chapterQuiz = new ChapterQuiz({
            title,
            totalMarks,
            timeLimit,
            allowReattempt,
            showCorrectAnswers,
            passingPercentage,
            questions,
            createdBy: req.admin._id,
            assignedChapter: assignedChapter,
            assignedChapters: normalizedAssignedChapters,
            chapterNames: Array.isArray(chapterNames)
                ? chapterNames.map(String).filter(Boolean)
                : [],
        });
        await chapterQuiz.save();

        // push quiz._id into batch
        if (normalizedAssignedChapters.length) {
            await Chapter.updateMany(
                { _id: { $in: normalizedAssignedChapters } },
                { $set: { ChapterQuiz: chapterQuiz._id } },
            );
        }

        res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            data: chapterQuiz,
        });
    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * @desc    Get chapter quiz by ID
 * @route   GET /api/chapter-quiz/:id
 * @access  Private
 */
exports.getChapterQuizByChapterId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID",
            });
        }

        const quiz = await ChapterQuiz.findOne({
            $or: [{ assignedChapter: id }, { assignedChapters: id }],
        }).lean();

        if (!quiz) {
            return res.status(200).json({
                success: true,
                quiz: null,
                message: "No quiz exists yet",
            });
        }

        res.status(200).json({
            success: true,
            quiz,
        });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * @desc    Update  chapter quiz
 * @route   PUT /api/chapter-quiz/:id
 * @access  Private (Creator only)
 */
exports.updateChapterQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await ChapterQuiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Chapter Quiz not found",
            });
        }

        // Check if user is the creator
        if (quiz.createdBy.toString() !== req.admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message:
                    "Only chapter quiz creator can update the chapter quiz",
            });
        }

        // Validate total marks if questions are being updated
        if (req.body.questions && req.body.totalMarks) {
            const calculatedTotalMarks = req.body.questions.reduce(
                (sum, q) => sum + q.marks,
                0,
            );
            if (calculatedTotalMarks !== req.body.totalMarks) {
                return res.status(400).json({
                    success: false,
                    message: `Total marks mismatch. Calculated: ${calculatedTotalMarks}, Provided: ${req.body.totalMarks}`,
                });
            }
        }

        const updatedQuiz = await ChapterQuiz.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true },
        );

        res.status(200).json({
            success: true,
            message: "Chapter Quiz updated successfully",
            data: updatedQuiz,
        });
    } catch (error) {
        console.error("Error updating chapter quiz:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * @desc    Delete chapter quiz
 * @route   DELETE /api/chapter-quiz/:id
 * @access  Private (Creator only)
 */
exports.deleteChapterQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID",
            });
        }

        const chapterquiz = await ChapterQuiz.findById(id);
        if (!chapterquiz) {
            return res.status(404).json({
                success: false,
                message: "Chapter Quiz not found",
            });
        }

        // Check if user is the creator
        if (chapterquiz.createdBy.toString() !== req.admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message:
                    "Only chapter quiz creator can delete the chapter quiz",
            });
        }

        // Get related attempt IDs
        const attempts = await ChapterQuizAttempt.find({
            ChapterquizId: id,
        }).select("_id");

        // Remove attempts from students
        if (attempts.length > 0) {
            const attemptIds = attempts.map((a) => a._id);
            await Student.updateMany(
                { chapterQuizAttempts: { $in: attemptIds } },
                { $pull: { chapterQuizAttempts: { $in: attemptIds } } },
            );
        }

        // Delete related quiz attempts
        await ChapterQuizAttempt.deleteMany({ ChapterquizId: id });

        // Remove quiz reference from batch
        await Chapter.findOneAndUpdate(
            { ChapterQuiz: id },
            { $pull: { ChapterQuiz: id } },
        );

        // Delete the quiz
        const ChapterquizDelete = await ChapterQuiz.findByIdAndDelete(id);
        if (!ChapterquizDelete) {
            return res.status(404).json({
                success: false,
                message: "Unable to delete chapter quiz",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chapter quiz and related data deleted successfully",
            ChapterquizDelete,
        });
    } catch (error) {
        console.error("Error deleting chapter quiz:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * @desc    Submit chapter quiz attempt
 * @route   POST /api/chapter-quizzes/:quizId/attempt
 * @access  Private (Students only)
 */
const ANSWER_STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "am",
    "be",
    "been",
    "being",
    "it",
    "its",
    "this",
    "that",
    "these",
    "those",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "and",
    "or",
    "by",
    "as",
    "at",
    "from",
    "into",
    "about",
    "because",
    "why",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "over",
    "under",
    "than",
    "then",
    "so",
    "can",
    "could",
    "would",
    "should",
    "will",
    "shall",
    "may",
    "might",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "also",
    "very",
    "briefly",
]);

const normalizeAnswerText = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/_/g, " ")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

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

const getTokenSimilarity = (studentAnswer, expectedAnswer) => {
    const stats = getTokenOverlapStats(studentAnswer, expectedAnswer);

    return Math.max(stats.expectedCoverage, stats.studentCoverage);
};

const convertToBoolean = (value) => {
    if (typeof value === "boolean") return value;

    const normalized = normalizeAnswerText(value);

    if (["true", "yes", "correct"].includes(normalized)) return true;
    if (["false", "no", "incorrect"].includes(normalized)) return false;

    return null;
};

const getStudentSelectedAnswer = (submittedAnswer) => {
    return (
        submittedAnswer.selectedOption ??
        submittedAnswer.answer ??
        submittedAnswer.studentAnswer ??
        submittedAnswer.response ??
        ""
    );
};

const findQuestionForSubmittedAnswer = (
    quizQuestions,
    submittedAnswer,
    index,
) => {
    const questionId =
        submittedAnswer.questionId || submittedAnswer._id || submittedAnswer.id;

    if (questionId) {
        const matchedQuestion = quizQuestions.find((question) => {
            return (
                String(question._id) === String(questionId) ||
                String(question.id) === String(questionId)
            );
        });

        if (matchedQuestion) return matchedQuestion;
    }

    return quizQuestions[index];
};

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

    const allExpectedAnswers = [correctAnswer, ...acceptableAnswers].filter(
        Boolean,
    );

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

    const keywordScore =
        normalizedKeywords.length > 0
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
            feedback:
                "Some relevant points found, but the answer is incomplete.",
        };
    }

    return {
        awardedMarks: 0,
        isCorrect: false,
        feedback: "Incorrect answer.",
    };
};

const evaluateSingleAnswer = (question, submittedAnswer) => {
    const type = question.type;
    const marks = Number(question.marks || 1);
    const studentAnswer = getStudentSelectedAnswer(submittedAnswer);
    const correctAnswer = question.correctAnswer;

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
            acceptableAnswers: question.acceptableAnswers || [],
            gradingKeywords: question.gradingKeywords || [],
            marks,
            type,
        });
    }

    return {
        awardedMarks: 0,
        isCorrect: false,
        feedback: "Unsupported question type.",
    };
};
exports.submitChapterQuizAttempt = async (req, res) => {
    try {
        const { ChapterquizId, answers, duration } = req.body;
        const studentId = req.student?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: student not found in token",
            });
        }

        if (!ChapterquizId || !mongoose.Types.ObjectId.isValid(ChapterquizId)) {
            return res.status(400).json({
                success: false,
                message: "Valid ChapterquizId is required",
            });
        }

        const quiz = await ChapterQuiz.findById(ChapterquizId);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Chapter Quiz not found",
            });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be an array",
            });
        }

        const quizQuestions = Array.isArray(quiz.questions)
            ? quiz.questions
            : [];

        const evaluatedAnswers = answers.map((submittedAnswer, index) => {
            const question = findQuestionForSubmittedAnswer(
                quizQuestions,
                submittedAnswer,
                index,
            );

            if (!question) {
                return {
                    ...submittedAnswer,
                    awardedMarks: 0,
                    maxMarks: 0,
                    isCorrect: false,
                    feedback: "Question not found.",
                };
            }

            const evaluation = evaluateSingleAnswer(question, submittedAnswer);

            return {
                questionId: question._id,
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

        const calculatedScore = evaluatedAnswers.reduce(
            (sum, answer) => sum + Number(answer.awardedMarks || 0),
            0,
        );

        const totalMarks =
            Number(quiz.totalMarks) ||
            quizQuestions.reduce(
                (sum, question) => sum + Number(question.marks || 0),
                0,
            );

        const percentage =
            totalMarks > 0
                ? Number(((calculatedScore / totalMarks) * 100).toFixed(2))
                : 0;

        const isPassed = percentage >= Number(quiz.passingPercentage || 0);

        const AttemptQuiz = await ChapterQuizAttempt.create({
            ChapterquizId,
            studentId,
            answers: evaluatedAnswers,
            score: calculatedScore,
            percentage,
            isPassed,
            duration,
        });

        student.chapterQuizAttempts.push(AttemptQuiz._id);
        await student.save();

        return res.status(201).json({
            success: true,
            message: "Chapter Quiz submitted and evaluated successfully",
            AttemptQuiz,
            result: {
                score: calculatedScore,
                totalMarks,
                percentage,
                isPassed,
                answers: evaluatedAnswers,
            },
        });
    } catch (error) {
        console.error("Error submitting chapter quiz:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * @desc    Get detailed chapter quiz attempt by ID
 * @route   GET /api/chapter-quiz-attempts/:attemptId
 * @access  Private
 */
exports.getQuizAttemptDetails = async (req, res) => {
    try {
        const { attemptId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attempt ID",
            });
        }

        const attempt = await ChapterQuizAttempt.findById(attemptId)
            .populate("studentId", "name username")
            .populate("ChapterquizId");

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found",
            });
        }

        res.status(200).json({
            success: true,
            attempt,
        });
    } catch (error) {
        console.error("Error fetching attempt details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getSingleQuizWithStatus = async (req, res) => {
    try {
        const { chapterId } = req.params;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({
                success: false,
                message: "Chapter ID is required",
            });
        }

        const chapterquiz = await ChapterQuiz.findOne({
            assignedChapter: chapterId,
        })
            .populate("assignedChapter")
            .lean();

        if (!chapterquiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        const attempt = await ChapterQuizAttempt.findOne({
            ChapterquizId: chapterquiz._id,
            studentId: req.student._id,
        }).lean();

        const result = {
            ...chapterquiz,
            attempted: !!attempt,
            attemptId: attempt ? attempt._id : null,
        };

        res.json({
            success: true,
            result,
        });
    } catch (err) {
        console.error("Error in getSingleQuizWithStatus:", err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};
