const mongoose = require("mongoose");
const crypto = require("crypto");
const SavedQuestionPaper = require("../models/SavedQuestionPaper");

const getLoggedInUser = (req) => {
    const user =
        req.user ||
        req.teacher ||
        req.admin ||
        req.student ||
        req.authUser ||
        null;

    return user;
};

const normalizeQuestions = (questions = []) => {
    if (!Array.isArray(questions)) return [];

    return questions.map((q, index) => ({
        questionNumber: q.questionNumber || index + 1,
        sectionNumber: Number(q.sectionNumber || 1),
        sectionTitle:
            q.sectionTitle ||
            `Section ${String.fromCharCode(64 + Number(q.sectionNumber || 1))}`,
        sectionQuestionNumber: Number(q.sectionQuestionNumber || index + 1),
        questionType: q.questionType || q.type || "",
        difficulty: q.difficulty || q.difficultyLevel || "",
        skillType:
            q.skillType || q.questionSkill || q.purpose || "Concept Check",
        marks: Number(q.marks || q.marksOfEachQuestion || 1),
        question: q.question || q.questionStem || "",
        questionStem: q.questionStem || q.question || "",
        options: Array.isArray(q.options) ? q.options : [],
        answer: q.answer ?? q.correctAnswer ?? q.answerKey ?? "",
        correctAnswer: q.correctAnswer ?? q.answer ?? q.answerKey ?? "",
        explanation: q.explanation || "",
        source: q.source || "",
        sourceReference: q.sourceReference || q.reference || "",
    }));
};

const getPaperFingerprint = (questions = []) =>
    crypto
        .createHash("sha256")
        .update(
            questions
                .map((question) =>
                    String(question.question || question.questionStem || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9 ]/g, " ")
                        .replace(/\s+/g, " ")
                        .trim(),
                )
                .join("|"),
        )
        .digest("hex");

exports.saveQuestionPaper = async (req, res) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        if (!loggedInUser?._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const {
            title,
            description,
            courseId,
            courseName,
            chapterIds,
            chapterNames,
            sourceMode,
            blueprint,
            questions,
            totalMarks,
            status,
            generationMeta,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question paper title is required",
            });
        }

        const normalizedQuestions = normalizeQuestions(questions);

        if (!normalizedQuestions.length) {
            return res.status(400).json({
                success: false,
                message: "At least one question is required to save paper",
            });
        }

        const calculatedTotalMarks =
            Number(totalMarks) ||
            normalizedQuestions.reduce(
                (sum, q) => sum + Number(q.marks || 0),
                0,
            );
        const generationFingerprint = getPaperFingerprint(normalizedQuestions);

        const savedPaper = await SavedQuestionPaper.findOneAndUpdate({
            createdBy: loggedInUser._id,
            generationFingerprint,
        }, {
            title: title.trim(),
            description: description || "",
            createdBy: loggedInUser._id,
            createdByRole: req.teacher
                ? "teacher"
                : req.admin
                  ? "admin"
                  : "user",
            courseId: courseId || undefined,
            courseName: courseName || "",
            chapterIds: Array.isArray(chapterIds)
                ? chapterIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
                : [],
            chapterNames: Array.isArray(chapterNames) ? chapterNames : [],
            sourceMode: sourceMode || "hybrid",
            blueprint: Array.isArray(blueprint) ? blueprint : [],
            questions: normalizedQuestions,
            totalMarks: calculatedTotalMarks,
            status: status || "draft",
            generationMeta: generationMeta || {},
            generationFingerprint,
        }, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        });

        return res.status(201).json({
            success: true,
            message: "Question paper saved to generation history",
            paper: savedPaper,
        });
    } catch (error) {
        console.error("Error saving question paper:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save question paper",
            error: error.message,
        });
    }
};

exports.getMyQuestionPapers = async (req, res) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        if (!loggedInUser?._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const query = {
            createdBy: loggedInUser._id,
        };

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.sourceMode) {
            query.sourceMode = req.query.sourceMode;
        }

        const [papers, total] = await Promise.all([
            SavedQuestionPaper.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SavedQuestionPaper.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            papers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching saved papers:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved question papers",
            error: error.message,
        });
    }
};

exports.getQuestionPaperById = async (req, res) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        if (!loggedInUser?._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper id",
            });
        }

        const paper = await SavedQuestionPaper.findOne({
            _id: id,
            createdBy: loggedInUser._id,
        }).lean();

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Question paper not found",
            });
        }

        return res.status(200).json({
            success: true,
            paper,
        });
    } catch (error) {
        console.error("Error fetching question paper:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch question paper",
            error: error.message,
        });
    }
};

exports.updateQuestionPaper = async (req, res) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        if (!loggedInUser?._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper id",
            });
        }

        const allowedUpdates = {};

        const fields = [
            "title",
            "description",
            "sourceMode",
            "blueprint",
            "questions",
            "totalMarks",
            "status",
            "generationMeta",
        ];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                allowedUpdates[field] = req.body[field];
            }
        });

        if (allowedUpdates.questions) {
            allowedUpdates.questions = normalizeQuestions(
                allowedUpdates.questions,
            );
        }

        if (!allowedUpdates.totalMarks && allowedUpdates.questions) {
            allowedUpdates.totalMarks = allowedUpdates.questions.reduce(
                (sum, q) => sum + Number(q.marks || 0),
                0,
            );
        }

        const updatedPaper = await SavedQuestionPaper.findOneAndUpdate(
            {
                _id: id,
                createdBy: loggedInUser._id,
            },
            allowedUpdates,
            {
                new: true,
                runValidators: true,
            },
        );

        if (!updatedPaper) {
            return res.status(404).json({
                success: false,
                message: "Question paper not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Question paper updated successfully",
            paper: updatedPaper,
        });
    } catch (error) {
        console.error("Error updating question paper:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update question paper",
            error: error.message,
        });
    }
};

exports.deleteQuestionPaper = async (req, res) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        if (!loggedInUser?._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper id",
            });
        }

        const deletedPaper = await SavedQuestionPaper.findOneAndDelete({
            _id: id,
            createdBy: loggedInUser._id,
        });

        if (!deletedPaper) {
            return res.status(404).json({
                success: false,
                message: "Question paper not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Question paper deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting question paper:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete question paper",
            error: error.message,
        });
    }
};
