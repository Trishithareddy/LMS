const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Batch = require("../models/Batch");
const BatchChapterAccess = require("../models/BatchChapterAccess");
const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const File = require("../models/File");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const FormData = require("form-data");
//imports for ebook
const { CloudPDF } = require("@cloudpdf/api");
const axios = require("axios");
const { recordAiUsage } = require("../services/aiUsageService");
const fs = require("fs");
const path = require("path");
const { findById } = require("../models/Teacher");
const ChapterQuiz = require("../models/ChapterwiseQuiz");
const { extractTextbookImages } = require("../services/textbookImageExtractor");
const AttemptChapterQuiz = require("../models/ChapterwiseQuizAttempt");
require("dotenv").config();

const DEFAULT_CHAPTER_ACCESS = Object.freeze({
    chapterEnabled: false,
    ebookEnabled: true,
    videoEnabled: true,
    resourcesEnabled: true,
    practiceEnabled: true,
});

const buildChapterAccessPayload = (chapterId, courseId, accessDoc = null) => ({
    chapterId: String(chapterId),
    courseId: String(courseId),
    chapterEnabled:
        accessDoc?.chapterEnabled ?? DEFAULT_CHAPTER_ACCESS.chapterEnabled,
    ebookEnabled:
        accessDoc?.ebookEnabled ?? DEFAULT_CHAPTER_ACCESS.ebookEnabled,
    videoEnabled:
        accessDoc?.videoEnabled ?? DEFAULT_CHAPTER_ACCESS.videoEnabled,
    resourcesEnabled:
        accessDoc?.resourcesEnabled ?? DEFAULT_CHAPTER_ACCESS.resourcesEnabled,
    practiceEnabled:
        accessDoc?.practiceEnabled ?? DEFAULT_CHAPTER_ACCESS.practiceEnabled,
});

// Controller function to create a new chapter
exports.createChapter = async (req, res) => {
    const { courseId } = req.params;
    const { name } = req.body;

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Create a new chapter
        const newChapter = new Chapter({
            name,
            course: courseId,
            courseName: course.name,
            courseDescription: course.description,
        });

        // Save the chapter
        await newChapter.save();

        // Add the chapter to the course's chapters array
        course.chapters.push(newChapter._id);
        await course.save();

        res.status(201).json(newChapter);
    } catch (error) {
        console.error("Error creating chapter:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAllChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find().populate("lessons"); // Populate lessons field

        res.json(chapters);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getChapterById = async (req, res) => {
    const { chapterId } = req.params;

    try {
        // Find the chapter by ID and populate its lessons
        const chapter = await Chapter.findById(chapterId)
            .populate("lessons") // Populate lessons
            .populate("concepts")
            .populate("skillTest")
            .populate({
                path: "course", // Populate the course field in Chapter
                populate: {
                    path: "subCategory", // Populate subCategory within course
                },
            });

        if (!chapter) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        res.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getBatchChapterAccessMap = async (req, res) => {
    const { batchId, courseId } = req.query;

    try {
        if (!batchId || !courseId) {
            return res.status(400).json({
                error: "batchId and courseId are required",
            });
        }

        const [batch, course] = await Promise.all([
            Batch.findById(batchId).select("_id"),
            Course.findById(courseId).select("_id chapters"),
        ]);

        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const chapterIds = Array.isArray(course.chapters) ? course.chapters : [];

        const accessDocs = await BatchChapterAccess.find({
            batchId,
            courseId,
            chapterId: { $in: chapterIds },
        }).lean();

        const accessByChapter = new Map(
            accessDocs.map((doc) => [String(doc.chapterId), doc])
        );

        const accessMap = {};

        chapterIds.forEach((chapterId) => {
            accessMap[String(chapterId)] = buildChapterAccessPayload(
                chapterId,
                courseId,
                accessByChapter.get(String(chapterId))
            );
        });

        res.status(200).json({
            success: true,
            accessMap,
        });
    } catch (error) {
        console.error("Error fetching batch chapter access map:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateBatchChapterAccess = async (req, res) => {
    const {
        batchId,
        courseId,
        chapterId,
        chapterEnabled,
        ebookEnabled,
        videoEnabled,
        resourcesEnabled,
        practiceEnabled,
    } = req.body;

    try {
        if (!batchId || !courseId || !chapterId) {
            return res.status(400).json({
                error: "batchId, courseId, and chapterId are required",
            });
        }

        const [batch, course, chapter] = await Promise.all([
            Batch.findById(batchId).select("_id"),
            Course.findById(courseId).select("_id chapters"),
            Chapter.findById(chapterId).select("_id"),
        ]);

        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        if (!chapter) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        const chapterBelongsToCourse = (course.chapters || []).some(
            (id) => String(id) === String(chapterId)
        );

        if (!chapterBelongsToCourse) {
            return res.status(400).json({
                error: "Chapter does not belong to the selected course",
            });
        }

        const update = {};

        if (typeof chapterEnabled === "boolean") {
            update.chapterEnabled = chapterEnabled;
        }
        if (typeof ebookEnabled === "boolean") {
            update.ebookEnabled = ebookEnabled;
        }
        if (typeof videoEnabled === "boolean") {
            update.videoEnabled = videoEnabled;
        }
        if (typeof resourcesEnabled === "boolean") {
            update.resourcesEnabled = resourcesEnabled;
        }
        if (typeof practiceEnabled === "boolean") {
            update.practiceEnabled = practiceEnabled;
        }

        const accessDoc = await BatchChapterAccess.findOneAndUpdate(
            { batchId, courseId, chapterId },
            { $set: update },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        ).lean();

        res.status(200).json({
            success: true,
            access: buildChapterAccessPayload(chapterId, courseId, accessDoc),
        });
    } catch (error) {
        console.error("Error updating batch chapter access:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// exports.getChapterById = async (req, res) => {
//   const { chapterId } = req.params;

//   try {
//     const chapter = await Chapter.findById(chapterId)
//       .populate("lessons")
//       .populate("concepts")
//       .populate("skillTest")
//       //.populate("badgeId")
//       .populate({
//         path: "course",
//         populate: { path: "subCategory" },
//       });

//     if (!chapter) {
//       return res.status(404).json({ error: "Chapter not found" });
//     }

//     res.json(chapter);
//   } catch (error) {
//     console.error("Error fetching chapter:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.updateChapter = async (req, res) => {
    const chapterId = req.params.id;
    const { name, description, grade, lessonsToRemove } = req.body;

    try {
        // Find the chapter by ID
        let chapter = await Chapter.findById(chapterId);

        if (!chapter) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        // Update chapter fields
        if (name) {
            chapter.name = name;
            // Update lessons' chapterName
            await Lesson.updateMany(
                { chapter: chapterId },
                { chapterName: name },
                { multi: true },
            );
        }

        if (description) {
            chapter.description = description;
            // Update lessons' chapterDescription
            await Lesson.updateMany(
                { chapter: chapterId },
                { chapterDescription: description },
                { multi: true },
            );
        }

        if (grade) {
            chapter.grade = grade;
        }

        // Remove lessons from the chapter's lessons array
        if (lessonsToRemove && lessonsToRemove.length > 0) {
            await Promise.all(
                lessonsToRemove.map(async (lessonId) => {
                    // Remove lesson from the chapter's lessons array
                    chapter.lessons.pull(lessonId);

                    // Update the actual lesson document to remove chapter details
                    await Lesson.findByIdAndUpdate(lessonId, {
                        $unset: {
                            chapter: "",
                            chapterName: "",
                            chapterDescription: "",
                        },
                    });

                    // Optionally, delete the actual lesson document from the Lesson collection
                    // await Lesson.findByIdAndDelete(lessonId); // Uncomment if you want to delete the lesson document
                }),
            );
        }

        await chapter.save();

        res.status(200).json(chapter);
    } catch (error) {
        console.error("Error updating chapter:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.addExistingChapterToCourse = async (req, res) => {
    const { courseId } = req.params;
    const { chapterId } = req.body;

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if the chapter exists
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        if (!course.chapters.includes(chapterId)) {
            course.chapters.push(chapterId);
            await course.save();
        }

        chapter.course = courseId;
        chapter.courseName = course.name;
        chapter.courseDescription = course.description;
        await chapter.save();

        res.status(200).json({
            message: "Chapter added to course successfully",
        });
    } catch (error) {
        console.error("Error adding chapter to course:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// exports.deleteChapter = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { id } = req.params;

//         const chapter = await Chapter.findById(id).session(session);
//         if (!chapter) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(404).json({ message: "Chapter not found" });
//         }

//         if (chapter.course) {
//             await Course.updateOne(
//                 { _id: chapter.course },
//                 { $pull: { chapters: chapter._id } }
//             ).session(session);
//         }

//         await Lesson.deleteMany({ chapterId: chapter._id }).session(session);

//         await Chapter.findByIdAndDelete(id).session(session);

//         // Commit the transaction
//         await session.commitTransaction();
//         session.endSession();

//         res.status(200).json({
//             message: "Chapter and all associated lessons deleted successfully",
//         });
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("Error in deleteChapter:", error);
//         res.status(500).json({
//             message: "Error deleting chapter",
//             error: error.message,
//         });
//     }
// };

const cloudPDF = new CloudPDF({
    apiKey: process.env.CLOUDPDF_API_KEY,
    cloudName: process.env.CLOUDPDF_CLOUD_NAME,
    signingSecret: process.env.CLOUDPDF_SECRET_KEY,
});

exports.deleteChapter = async (req, res) => {
    try {
        const { id } = req.params;

        const chapter = await Chapter.findById(id);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        // 1️⃣ Remove chapter reference from Course
        if (chapter.course) {
            await Course.updateOne(
                { _id: chapter.course },
                { $pull: { chapters: chapter._id } },
            );
        }

        // 2️⃣ If chapter has a quiz → delete attempts first → then quiz
        if (chapter.ChapterQuiz) {
            const quizId = chapter.ChapterQuiz;

            // Delete all attempts related to this quiz
            await AttemptChapterQuiz.deleteMany({ quizId });

            // Delete the quiz
            await ChapterQuiz.findByIdAndDelete(quizId);
        }

        // 3️⃣ Delete all lessons of this chapter
        await Lesson.deleteMany({ chapterId: chapter._id });

        // 4️⃣ Finally delete the chapter
        await Chapter.findByIdAndDelete(id);

        res.status(200).json({
            message:
                "Chapter, quiz, attempts, and lessons deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteChapter:", error);
        res.status(500).json({
            message: "Error deleting chapter",
            error: error.message,
        });
    }
};

exports.addEbook = async (req, res) => {
    axios.defaults.maxContentLength = Infinity;
    axios.defaults.maxBodyLength = Infinity;
    const { chapterId, EbookExpectedtime } = req.body;
    const ebook = req.file;

    if (!chapterId)
        return res.status(400).json({ error: "ChapterId not found" });

    if (!ebook) return res.status(400).json({ error: "Ebook file not found" });

    try {
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter)
            return res.status(404).json({ error: "Chapter not found" });

        const oldTime = existingChapter.EbookExpectedtime || 0;

        // Read buffer once
        const dataBuffer = await fs.promises.readFile(ebook.path);

        // Upload to CloudPDF
        // 1. Create a document in CloudPDF
        const createDoc = await axios.post(
            "https://api.cloudpdf.io/v2/documents",
            {
                name: ebook.originalname,
                description: `Ebook for chapter ${chapterId}`,
                defaultPermissions: {
                    search: false,
                    selection: false,
                    public: true,
                    download: "NotAllowed",
                },
            },
            {
                headers: {
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            },
        );

        const document = createDoc.data;

        // 2. Upload the file to the pre-signed URL
        await axios.put(document.file.uploadUrl, dataBuffer, {
            headers: { "Content-Type": "application/pdf" },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // 3. Notify CloudPDF that the file upload is complete

        await axios.patch(
            `https://api.cloudpdf.io/v2/documents/${document.id}/files/${document.file.id}`,
            { uploadCompleted: true },
            {
                headers: {
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            },
        );

        // Poll until Ready
        let status = "Processing";
        let retries = 0;
        const MAX_RETRIES = 40;
        let processedDoc;

        while (!["Completed", "Error"].includes(status)) {
            if (retries >= MAX_RETRIES) {
                throw new Error("CloudPDF processing timeout");
            }

            await new Promise((r) => setTimeout(r, 2500));

            const check = await axios.get(
                `https://api.cloudpdf.io/v2/documents/${document.id}`,
                {
                    headers: {
                        "X-Authorization": process.env.CLOUDPDF_API_KEY,
                    },
                },
            );

            processedDoc = check.data;
            status = processedDoc.file.status;

            // console.log("CloudPDF status:", status);

            retries++;
        }

        if (status === "Error") {
            throw new Error("CloudPDF processing failed");
        }

        // console.log("CloudPDF processing completed");

        const cloudPdfDocumentId = processedDoc.id;

        // CHAT PDF UPLOAD
        const formData = new FormData();
        formData.append("file", fs.createReadStream(ebook.path));

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/sources/add-file",
            formData,
            {
                headers: {
                    "x-api-key": process.env.CHATPDF_API_KEY,
                    ...formData.getHeaders(),
                },
            },
        );

        const chatPdfSourceId = chatPdfResponse.data.sourceId;
        //   console.log("ChatPDF source taks");

        // UPDATE DB

        const timeDifference = Number(EbookExpectedtime || 0) - oldTime;

        const updatedChapter = await Chapter.findByIdAndUpdate(
            chapterId,
            {
                $set: {
                    Ebook: cloudPdfDocumentId,
                    pdfText: chatPdfSourceId,
                    EbookExpectedtime: EbookExpectedtime || 0,
                },
            },
            { new: true },
        );

        if (existingChapter.course) {
            await Course.findByIdAndUpdate(existingChapter.course, {
                $inc: { courseExpectedtime: timeDifference },
            });
        }

        // console.log("Chapter updated with Ebook and ChatPDF source ID");

        // Delete temp file
        await fs.promises.unlink(ebook.path);

        res.status(200).json({
            success: true,
            message: "Ebook uploaded successfully",
            chapter: updatedChapter,
        });
    } catch (error) {
        if (ebook?.path) {
            try {
                await fs.promises.unlink(ebook.path);
            } catch {}
        }

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

// update ebook expected time
exports.updateEbookExpectedTime = async (req, res) => {
    const { chapterId, EbookExpectedtime } = req.body;

    if (!chapterId) {
        return res
            .status(400)
            .json({ success: false, error: "Chapter ID is required" });
    }

    if (typeof EbookExpectedtime !== "number" || EbookExpectedtime < 0) {
        return res
            .status(400)
            .json({
                success: false,
                error: "Valid EbookExpectedtime is required",
            });
    }

    try {
        // Fetch the existing chapter
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter) {
            return res
                .status(404)
                .json({ success: false, error: "Chapter not found" });
        }

        // Store old EbookExpectedtime for calculating difference
        const oldEbookExpectedtime = existingChapter.EbookExpectedtime || 0;

        // Calculate the time difference
        const timeDifference = EbookExpectedtime - oldEbookExpectedtime;

        // Update the chapter's EbookExpectedtime
        const updatedChapter = await Chapter.findByIdAndUpdate(
            chapterId,
            { $set: { EbookExpectedtime: EbookExpectedtime } },
            { new: true },
        );

        // If the chapter belongs to a course, update courseExpectedtime
        if (existingChapter.course) {
            await Course.findByIdAndUpdate(existingChapter.course, {
                $inc: { courseExpectedtime: timeDifference },
            });
        }

        res.status(200).json({
            success: true,
            message: "Ebook expected time updated successfully.",
            chapter: updatedChapter,
        });
    } catch (error) {
        console.error("Error updating Ebook expected time:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const buildGuardedAiraPrompt = (message) => `
You are AIRA, an LMS chapter assistant.

STRICT RULES:
- Answer ONLY using the uploaded chapter PDF content.
- Do not use outside knowledge.
- Do not guess.
- If the question is not related to this chapter, reply exactly:
  "Please ask questions related to this chapter only."
- Keep the answer suitable for school students.
- Use simple, clear language.
- Use clean Markdown formatting where helpful.

USER QUESTION:
${message}
`;

const buildAiraToolPrompt = ({
    tool,
    grade,
    chapterName,
    difficulty,
    questionType,
    numberOfQuestions,
    totalMarks,
    includeAnswers = true,
    includeExplanations = true,
}) => {
    const commonRules = `
STRICT RULES:
- Use ONLY the uploaded chapter PDF content.
- Do not use outside knowledge.
- Do not invent facts.
- Keep language suitable for Grade ${grade || "school"} students.
- Use clean Markdown formatting.
- Do not write unnecessary introduction or conclusion.
- If the PDF content is insufficient, clearly say that the chapter does not contain enough information.
`;

    if (tool === "question_paper") {
        return `
You are AIRA, an academic question paper generator.

${commonRules}

Generate a question paper using these requirements:

Grade: ${grade || "Not specified"}
Chapter: ${chapterName || "Selected chapter"}
Difficulty: ${difficulty || "Medium"}
Question Type: ${questionType || "Mixed"}
Number of Questions: ${numberOfQuestions || 10}
Total Marks: ${totalMarks || "Not specified"}
Include Answer Key: ${includeAnswers ? "Yes" : "No"}
Include Explanations: ${includeExplanations ? "Yes" : "No"}

Output format:
# Question Paper

## Section A: Objective Questions

## Section B: Short Answer Questions

## Section C: Long Answer Questions

${includeAnswers ? "## Answer Key" : ""}
${includeExplanations ? "## Explanations" : ""}
`;
    }

    if (tool === "lesson_plan") {
        return `
You are AIRA, an expert teacher lesson planner.

${commonRules}

Create a practical lesson plan using these requirements:

Grade: ${grade || "Not specified"}
Chapter: ${chapterName || "Selected chapter"}
Duration: ${totalMarks || "40 minutes"}
Difficulty: ${difficulty || "Medium"}

Output format:
# Lesson Plan

## Learning Objectives
## Required Materials
## Warm-up Activity
## Teaching Steps
## Classroom Activity
## Assessment Questions
## Homework
## Teacher Notes
`;
    }

    if (tool === "worksheet") {
        return `
You are AIRA, an academic worksheet creator.

${commonRules}

Create a student worksheet using these requirements:

Grade: ${grade || "Not specified"}
Chapter: ${chapterName || "Selected chapter"}
Difficulty: ${difficulty || "Medium"}
Question Type: ${questionType || "Mixed"}
Number of Questions: ${numberOfQuestions || 10}
Include Answer Key: ${includeAnswers ? "Yes" : "No"}

Output format:
# Worksheet

## Student Details
Name: ____________    Date: ____________

## Practice Questions

${includeAnswers ? "## Answer Key" : ""}
`;
    }

    if (tool === "chapter_summary") {
        return `
You are AIRA, a chapter summary assistant.

${commonRules}

Create a clear chapter summary.

Grade: ${grade || "Not specified"}
Chapter: ${chapterName || "Selected chapter"}

Output format:
# Chapter Summary

## Key Concepts
## Important Terms
## Main Points
## Quick Recap
## 5 Revision Questions
`;
    }

    if (tool === "important_questions") {
        return `
You are AIRA, an academic important questions generator.

${commonRules}

Generate important exam-oriented questions.

Grade: ${grade || "Not specified"}
Chapter: ${chapterName || "Selected chapter"}
Difficulty: ${difficulty || "Medium"}
Number of Questions: ${numberOfQuestions || 10}

Output format:
# Important Questions

## Questions
${includeAnswers ? "## Answer Key" : ""}
`;
    }

    return null;
};

exports.chatWithPdf = async (req, res) => {
    try {
        const { sourceId, message } = req.body;

        if (!sourceId || !message) {
            return res.status(400).json({
                error: "Both sourceId and message are required",
            });
        }

        const guardedPrompt = buildGuardedAiraPrompt(message);

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            {
                sourceId: sourceId,
                referenceSources: true,
                messages: [
                    {
                        role: "user",
                        content: guardedPrompt,
                    },
                ],
            },
            {
                headers: {
                    "x-api-key": process.env.CHATPDF_API_KEY,
                    "Content-Type": "application/json",
                },
            },
        );
        await recordAiUsage({
            req,
            feature: "chapter_chatbot",
            sourceId,
        });

        return res.json({
            message: "Chat response received successfully",
            response: chatPdfResponse.data.content,
            references: chatPdfResponse.data.references || [],
        });
    } catch (error) {
        console.error(
            "Error in chatWithPdf:",
            error.response?.data || error.message,
        );

        const statusCode = error.response?.status || 500;
        const errorMessage =
            error.response?.data?.error ||
            error.message ||
            "Internal Server Error";

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
};

exports.generateAiraContent = async (req, res) => {
    try {
        const {
            sourceId,
            tool,
            grade,
            chapterName,
            difficulty,
            questionType,
            numberOfQuestions,
            totalMarks,
            includeAnswers,
            includeExplanations,
        } = req.body;

        if (!sourceId || !tool) {
            return res.status(400).json({
                success: false,
                error: "sourceId and tool are required",
            });
        }

        const prompt = buildAiraToolPrompt({
            tool,
            grade,
            chapterName,
            difficulty,
            questionType,
            numberOfQuestions,
            totalMarks,
            includeAnswers: includeAnswers !== false,
            includeExplanations: includeExplanations !== false,
        });

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Invalid AIRA tool selected",
            });
        }

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            {
                sourceId,
                referenceSources: true,
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
            },
        );
        await recordAiUsage({
            req,
            feature: `aira_tool_${tool}`,
            sourceId,
        });

        return res.json({
            success: true,
            tool,
            response: chatPdfResponse.data.content,
            references: chatPdfResponse.data.references || [],
        });
    } catch (error) {
        console.error(
            "Error in generateAiraContent:",
            error.response?.data || error.message,
        );

        const statusCode = error.response?.status || 500;
        const errorMessage =
            error.response?.data?.error ||
            error.message ||
            "Internal Server Error";

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
};

// exports.chatWithPdf = async (req, res) => {
//   try {
//     const { sourceId, message } = req.body;

//     if (!sourceId || !message) {
//       return res.status(400).json({
//         error: "Both sourceId and message are required",
//       });
//     }

//     // ✅ Embed rules inside user message (ChatPDF-safe)
//     const guardedPrompt = `
// You are AIRA, an LMS chapter assistant.

// STRICT RULES:
// - Answer ONLY using the content of this chapter.
// - If the question is NOT related to this chapter, reply exactly:
//   "Please ask questions related to this chapter only."
// - Do NOT use outside knowledge.
// - Do NOT guess.
// -

// QUESTION:
// ${message}
// `;

//     const chatPdfResponse = await axios.post(
//       "https://api.chatpdf.com/v1/chats/message",
//       {
//         sourceId: sourceId,
//         messages: [
//           {
//             role: "user",
//             content: guardedPrompt,
//           },
//         ],
//       },
//       {
//         headers: {
//           "x-api-key": process.env.CHATPDF_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return res.json({
//       response: chatPdfResponse.data.content,
//     });

//   } catch (error) {
//     console.error("Error in chatWithPdf:", error.response?.data || error.message);

//     return res.status(500).json({
//       success: false,
//       error: "Sorry, I encountered an error processing your request.",
//     });
//   }
// };
exports.generateAiraLessonPlan = async (req, res) => {
    try {
        const {
            chapterId,
            grade,
            lessonNo,
            lessonName,
            numberOfSessions,
            durationPerSession,
            teachingStyle,
            includeHomework,
            includeAssessment,
        } = req.body;

        if (!chapterId) {
            return res.status(400).json({
                success: false,
                error: "chapterId is required",
            });
        }

        const chapter = await Chapter.findById(chapterId)
            .populate("course")
            .lean();

        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: "Chapter not found",
            });
        }

        if (!chapter.pdfText) {
            return res.status(400).json({
                success: false,
                error: "This chapter does not have ChatPDF sourceId. Please upload ebook first.",
            });
        }

        const sourceId = chapter.pdfText;

        const finalLessonName = lessonName || chapter.name;
        const finalGrade = grade || chapter.grade || "Not specified";
        const finalLessonNo = lessonNo || "Not specified";
        const finalNumberOfSessions = numberOfSessions || 2;
        const finalDurationPerSession = durationPerSession || "40 minutes";
        const finalTeachingStyle = teachingStyle || "Activity-based";

        const prompt = `
You are AIRA, an expert academic lesson planner for a school LMS.

Use ONLY the uploaded chapter PDF content.
Do not use outside knowledge.
Do not invent topics that are not present in the chapter.
If the PDF does not contain enough content, clearly mention:
"Not enough content found in the chapter PDF."

Create a detailed lesson plan in the EXACT structure below.

GENERAL DETAILS:

GRADE: ${finalGrade}
LESSON NO.: ${finalLessonNo}
NAME: ${finalLessonName}
No. of Sessions/Periods: ${finalNumberOfSessions}

LESSON OVERVIEW:
Write a clear overview of the lesson based only on the chapter PDF.

WHAT IS THE FOCUS OF THE UNIT?
Explain the main focus of this chapter/unit.

PREVIOUS KNOWLEDGE:
Mention what prior knowledge students need before learning this lesson.

VOCABULARY / TERMINOLOGY:
List important new words or terminology from the chapter with simple meanings.

Now create session-wise plans.

For EACH session, use this format:

SESSION NO.: Session 1
CONCEPT NAME:
Mention the main concept taught in this session.

LEARNING OUTCOMES:
List 3 to 5 measurable learning outcomes.

RESOURCES REQUIRED:
Mention physical, digital, books, charts, PPTs, videos, weblinks, worksheets, or classroom resources required.

TEACHER ACTIVITY:
Time Assigned: ${finalDurationPerSession}

Introduction: Provocation / Recapitulation / Preassessment
Write how the teacher will begin the class.

Methodology:
Write step-by-step teaching methodology.
Teaching style should be: ${finalTeachingStyle}

STUDENT ACTIVITY:
Time Assigned: ${finalDurationPerSession}
Write what students will do during the session.

ASSESSMENT:
${includeAssessment === false ? "Do not include assessment." : "Include oral questions, written checks, activity-based checks, or short quiz questions."}

ASSIGNMENT/HW:
${includeHomework === false ? "Do not include homework." : "Give suitable homework or assignment from the chapter."}

SKILLS/COMPETENCIES:
Mention skills developed in this session.

INTELLIGENCES ADDRESSED:
Mention suitable intelligences addressed, such as logical, linguistic, spatial, interpersonal, intrapersonal, kinesthetic, or naturalistic.

IMPORTANT OUTPUT RULES:
- Use clean Markdown.
- Use headings exactly.
- Create exactly ${finalNumberOfSessions} session plans.
- Keep language teacher-friendly.
- Keep it suitable for Grade ${finalGrade}.
- Do not include unrelated content.
- Mention source page references if available.
`;

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            {
                referenceSources: true,
                sourceId,
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
            },
        );
        await recordAiUsage({
            req,
            feature: "lesson_plan_generation",
            sourceId,
        });

        return res.status(200).json({
            success: true,
            lessonPlan: chatPdfResponse.data.content,
            references: chatPdfResponse.data.references || [],
            chapter: {
                _id: chapter._id,
                name: chapter.name,
                courseName: chapter.courseName,
            },
        });
    } catch (error) {
        console.error(
            "Error in generateAiraLessonPlan:",
            error.response?.data || error.message,
        );

        return res.status(error.response?.status || 500).json({
            success: false,
            error:
                error.response?.data?.error ||
                error.message ||
                "Lesson plan generation failed",
        });
    }
};

exports.addWorksheetFile = async (req, res) => {
    const { chapterId } = req.body;
    const worksheet = req.file;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!worksheet) {
        return res.status(400).json({ error: "Worksheet File not found" });
    }

    try {
        // 1. Create a document in CloudPDF (assuming you're using the same service for worksheets)
        const createDocResponse = await axios.post(
            "https://api.cloudpdf.io/v2/documents",
            {
                name: worksheet.originalname,
                description: `Worksheet for chapter ${chapterId}`,
                defaultPermissions: {
                    search: false,
                    selection: false,
                    public: true,
                    download: "NotAllowed",
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            },
        );

        const document = createDocResponse.data;

        // 2. Upload the file to the pre-signed URL
        const uploadUrl = document.file.uploadUrl;
        const fileBuffer = await fs.promises.readFile(worksheet.path);

        await axios.put(uploadUrl, fileBuffer, {
            headers: {
                "Content-Type": "application/pdf",
            },
        });

        // 3. Notify CloudPDF that the file upload is complete
        await axios.patch(
            `https://api.cloudpdf.io/v2/documents/${document.id}/files/${document.file.id}`,
            {
                uploadCompleted: true,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            },
        );

        // 4. Fetch the processed document information
        const processedDocResponse = await axios.get(
            `https://api.cloudpdf.io/v2/documents/${document.id}`,
            {
                headers: {
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            },
        );

        const processedDocument = processedDocResponse.data;

        const worksheetUrl = processedDocument.file.documentId;

        // 5. Update the chapter with the new worksheet URL
        const chapter = await Chapter.findByIdAndUpdate(
            chapterId,
            { $set: { worksheet: worksheetUrl } },
            { new: true },
        );

        if (!chapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id.",
            });
        }

        res.status(200).json({
            message: "Worksheet added successfully.",
            chapter: chapter,
        });
    } catch (error) {
        console.error("Error adding Worksheet:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// add worksheet file directly by document id
exports.addWorksheetByCloudPdfDocumentId = async (req, res) => {
    const { chapterId, cloudPdfDocumentId } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!cloudPdfDocumentId) {
        return res.status(400).json({ error: "cloudPdfDocumentId not found" });
    }

    try {
        const chapter = await Chapter.findByIdAndUpdate(
            chapterId,
            { $set: { worksheet: cloudPdfDocumentId } },
            { new: true },
        );

        if (!chapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id.",
            });
        }

        res.status(200).json({
            message: "Worksheet added successfully.",
            chapter: chapter,
        });
    } catch (error) {
        console.error("Error adding Worksheet by document Id:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addEbookByCloudPdfDocumentId = async (req, res) => {
    const { chapterId, cloudPdfDocumentId, EbookExpectedtime } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!cloudPdfDocumentId) {
        return res.status(400).json({ error: "cloudPdfDocumentId not found" });
    }

    try {
        // First check if chapter exists and get its current state
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id.",
            });
        }

        const getChapterByCPdfDocId = await Chapter.findOne({
            Ebook: cloudPdfDocumentId,
            pdfText: { $exists: true, $ne: "" },
        });

        if (!getChapterByCPdfDocId) {
            return res.status(400).json({
                success: false,
                message: "ChatPDF reference ID not found for this Ebook",
            });
        }
        if (
            getChapterByCPdfDocId.pdfText == null ||
            getChapterByCPdfDocId.pdfText == undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "ChatPDF reference ID not found for this Ebook, Upload Ebook First",
            });
        }
        // Store old EbookExpectedtime for calculating difference
        const oldEbookExpectedtime = existingChapter.EbookExpectedtime || 0;

        // Calculate the difference in expected time
        const timeDifference = EbookExpectedtime - oldEbookExpectedtime;

        const chapter = await Chapter.findByIdAndUpdate(
            chapterId,
            {
                $set: {
                    Ebook: cloudPdfDocumentId,
                    EbookExpectedtime: EbookExpectedtime,
                    pdfText: getChapterByCPdfDocId.pdfText,
                },
            },
            { new: true },
        );

        // If the chapter belongs to a course, update courseExpectedtime
        if (existingChapter.course) {
            await Course.findByIdAndUpdate(existingChapter.course, {
                $inc: { courseExpectedtime: timeDifference },
            });
        }

        res.status(200).json({
            message: "E-Book added successfully.",
            chapter: chapter,
        });
    } catch (error) {
        console.error("Error adding E-Book by document Id:", error);
        res.status(500).json({ message: "Server error" });
    }
};

//controller to add terminal options

exports.addTerminalOptions = async (req, res) => {
    const { terminalEnabled, terminalOptions, chapterId, links, linksEnabled } =
        req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    try {
        const chapter = await Chapter.findByIdAndUpdate(
            chapterId,
            { $set: { terminalEnabled, terminalOptions, links, linksEnabled } },
            { new: true, runValidators: true },
        );

        if (!chapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id.",
            });
        }

        res.status(200).json({
            message: "Terminal Options Configured successfully.",
            chapter: chapter,
        });
    } catch (error) {
        console.error("Error adding Terminal Options :", error);
        res.status(500).json({ message: "Server error" });
    }
};

//controller to create a folder

exports.createFolder = async (req, res) => {
    const { name, parent_id, color, chapterId } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    try {
        const folder = new Folder({
            name,
            parent_id, // Can be null, as it's optional
            color,
            chapterId,
        });

        await folder.save();

        res.status(201).json({
            message: "Folder created successfully.",
            folder: folder,
        });
    } catch (error) {
        console.error("Error creating folder:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getFoldersByChapterAndParent = async (req, res) => {
    const { chapterId, parentId } = req.params;

    // Check for missing chapterId
    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
        return res.status(400).json({ message: "Invalid chapterId" });
    }

    // Convert string IDs to ObjectIds
    const chapterObjectId = new mongoose.Types.ObjectId(chapterId);

    let parentObjectId;
    if (parentId === "null" || parentId === undefined) {
        parentObjectId = null;
    } else if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: "Invalid parentId" });
    } else {
        parentObjectId = new mongoose.Types.ObjectId(parentId);
    }

    try {
        const folders = await Folder.find({
            chapterId: chapterObjectId,
            parent_id: parentObjectId,
        });

        // Always return 200 with the folders array (empty or not)
        res.status(200).json({
            message: folders.length
                ? "Folders fetched successfully"
                : "No folders found",
            folders: folders,
        });
    } catch (error) {
        console.error("Error fetching folders:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateFolderName = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid folder Mongodb Id" });
    }

    // Convert string IDs to ObjectIds
    const objectId = new mongoose.Types.ObjectId(id);

    try {
        // Find the folder by its id
        const folder = await Folder.findById(objectId);

        // Check if the folder exists
        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        // Update the folder name
        folder.name = name;

        // Save the updated folder
        await folder.save();

        // Return the updated folder
        return res.status(200).json({
            message: "Folder name updated successfully",
            folder,
        });
    } catch (error) {
        // Handle errors and send a response
        return res.status(500).json({
            message: "Server error while updating folder",
            error: error.message,
        });
    }
};

exports.addFileByCloudPdfDocumentId = async (req, res) => {
    const { chapterId, fileUrl, name, folder_id } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!fileUrl) {
        return res.status(400).json({ error: "FileUrl not found" });
    }

    try {
        const file = new File({
            name,
            folder_id, // Can be null, as it's optional
            fileUrl,
            chapterId,
        });

        await file.save();

        res.status(201).json({
            message: "File created successfully.",
            file: file,
        });
    } catch (error) {
        console.error("Error creating file:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getFilesByChapterAndFolder = async (req, res) => {
    const { chapterId, folderId } = req.params;

    // Check for missing chapterId
    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
        return res.status(400).json({ message: "Invalid chapterId" });
    }

    // Convert string IDs to ObjectIds
    const chapterObjectId = new mongoose.Types.ObjectId(chapterId);

    let folderObjectId;
    if (folderId === "null" || folderId === undefined) {
        folderObjectId = null; // explicitly set to null
    } else if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return res.status(400).json({ message: "Invalid folderId" });
    } else {
        folderObjectId = new mongoose.Types.ObjectId(folderId);
    }

    try {
        // Query to fetch all files belonging to the chapterId and folder_id
        const files = await File.find({
            chapterId: chapterObjectId,
            folder_id: folderObjectId,
        });

        // Always return 200 with the files array (empty or not)
        res.status(200).json({
            message: files.length
                ? "Files fetched successfully"
                : "No files found",
            files: files,
            totalFiles: files.length, // Optional: might be useful for the frontend
        });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message, // Optional: helpful for debugging
        });
    }
};

exports.updateFileName = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid folder Mongodb Id" });
    }

    // Convert string IDs to ObjectIds
    const objectId = new mongoose.Types.ObjectId(id);

    try {
        // Find the folder by its id
        const file = await File.findById(objectId);

        // Check if the folder exists
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Update the folder name
        file.name = name;

        // Save the updated folder
        await file.save();

        // Return the updated folder
        return res.status(200).json({
            message: "Folder name updated successfully",
            file,
        });
    } catch (error) {
        // Handle errors and send a response
        return res.status(500).json({
            message: "Server error while updating folder",
            error: error.message,
        });
    }
};

exports.deleteFolderById = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedFolder = await Folder.findByIdAndDelete(id);

        if (!deletedFolder) {
            return res.status(404).json({
                message: "Folder not found",
            });
        }

        return res.status(200).json({
            message: "Folder deleted successfully",
            deletedFolder: deletedFolder,
        });
    } catch (error) {
        console.error("Error deleting Folder:", error);
        return res.status(500).json({
            message: "An error occurred while deleting the Folder",
            error: error.message,
        });
    }
};

exports.deleteFileById = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedFile = await File.findByIdAndDelete(id);

        if (!deletedFile) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        return res.status(200).json({
            message: "File deleted successfully",
            deletedFile: deletedFile,
        });
    } catch (error) {
        console.error("Error deleting File:", error);
        return res.status(500).json({
            message: "An error occurred while deleting the File",
            error: error.message,
        });
    }
};

exports.toggleFileStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid file ID" });
        }

        const file = await File.findById(id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Toggle the isActive status
        file.isActive = !file.isActive;
        await file.save();

        return res.status(200).json({
            message: "File status updated successfully",
            file,
        });
    } catch (error) {
        console.error("Error updating file status:", error);
        return res.status(500).json({
            message: "Server error while updating file status",
            error: error.message,
        });
    }
};

// --- GET /api/chapters/:chapterId/instructions ---
exports.getChapterInstructions = async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId).lean();
        if (!chapter)
            return res.status(404).json({ message: "Chapter not found" });
        res.json({ text: chapter.instructionsText || "" });
    } catch (err) {
        console.error("getChapterInstructions error:", err);
        res.status(500).json({ message: "Error fetching instructions" });
    }
};

// --- PUT /api/chapters/:chapterId/instructions  (superadmin only) ---
exports.updateChapterInstructions = async (req, res) => {
    try {
        const text = (req.body?.text ?? "").toString();
        const updated = await Chapter.findByIdAndUpdate(
            req.params.chapterId,
            { instructionsText: text },
            { new: true },
        ).lean();

        if (!updated)
            return res.status(404).json({ message: "Chapter not found" });
        res.json({ ok: true });
    } catch (err) {
        console.error("updateChapterInstructions error:", err);
        res.status(500).json({ message: "Error saving instructions" });
    }
};

exports.getChaptersByCourse = async (req, res) => {
    try {
        const { courseId } = req.query;
        if (!courseId) {
            return res.status(400).json({ message: "courseId required" });
        }

        const chapters = await Chapter.find(
            { course: courseId },
            { _id: 1, name: 1 }, // 👈 projection (VERY IMPORTANT)
        ).lean();

        res.json(chapters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.assignSkillTestAndBadge = async (req, res) => {
    try {
        const { skillTestId, badgeId, enabled } = req.body;

        const chapter = await Chapter.findByIdAndUpdate(
            req.params.chapterId,
            {
                skillTest: skillTestId,
                badgeId,
                skillTestEnabled: enabled,
            },
            { new: true },
        ).populate("skillTest");

        res.json(chapter);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignSkillTestToChapter = async (req, res) => {
    const { chapterId } = req.params;
    const { skillTestId, enabled } = req.body;

    try {
        await Chapter.findByIdAndUpdate(chapterId, {
            skillTest: skillTestId,
            skillTestEnabled: enabled,
        });

        await SkillTest.findByIdAndUpdate(skillTestId, {
            enabled,
        });

        res.json({ message: "Skill Test assigned successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const cleanAiText = (text = "") => {
    return String(text || "")
        .replace(/^```(?:markdown|md|json)?/i, "")
        .replace(/```$/i, "")
        .trim();
};

const limitText = (text = "", maxChars = 6000) => {
    const cleaned = String(text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (cleaned.length <= maxChars) return cleaned;

    return cleaned.slice(0, maxChars);
};

const extractTemplateTextFromUpload = async (file) => {
    if (!file) {
        throw new Error("Template file is required");
    }

    const fileName = String(file.originalname || "").toLowerCase();
    const mimeType = String(file.mimetype || "").toLowerCase();

    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
        const pdfData = await pdf(file.buffer);
        return String(pdfData.text || "").trim();
    }

    if (mimeType.includes("wordprocessingml") || fileName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({
            buffer: file.buffer,
        });

        return String(result.value || "").trim();
    }

    throw new Error("Only PDF and DOCX lesson plan templates are supported");
};

const buildChapterContentForLessonPlan = (chapter) => {
    const parts = [];

    if (chapter.name) {
        parts.push(`Chapter Name: ${chapter.name}`);
    }

    if (chapter.courseName) {
        parts.push(`Course Name: ${chapter.courseName}`);
    }

    if (chapter.courseDescription) {
        parts.push(`Course Description: ${chapter.courseDescription}`);
    }

    if (chapter.instructionsText) {
        parts.push(`Chapter Instructions:\n${chapter.instructionsText}`);
    }

    if (chapter.pdfText) {
        parts.push(`Chapter eBook Content:\n${chapter.pdfText}`);
    }

    if (Array.isArray(chapter.links) && chapter.links.length > 0) {
        const linkText = chapter.links
            .map((link, index) => {
                return `${index + 1}. ${link.title || ""}: ${
                    link.instruction || ""
                } ${link.link || ""}`;
            })
            .join("\n");

        parts.push(`Chapter Links:\n${linkText}`);
    }

    return parts.join("\n\n").trim();
};

exports.generateAiraCustomLessonPlan = async (req, res) => {
    try {
        const {
            chapterId,
            grade,
            lessonNo,
            lessonName,
            numberOfSessions,
            durationPerSession,
            teachingStyle,
            includeHomework,
            includeAssessment,
        } = req.body;

        if (!process.env.CHATPDF_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "CHATPDF_API_KEY is missing in backend .env",
            });
        }

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({
                success: false,
                error: "Valid chapterId is required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please upload a school lesson plan format file",
            });
        }

        const chapter = await Chapter.findById(chapterId)
            .populate("course")
            .lean();

        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: "Chapter not found",
            });
        }

        if (!chapter.pdfText) {
            return res.status(400).json({
                success: false,
                error: "This chapter does not have ChatPDF sourceId. Please upload ebook first.",
            });
        }

        const rawTemplateText = await extractTemplateTextFromUpload(req.file);
        const templateText = limitText(rawTemplateText, 6000);

        if (!templateText || templateText.length < 80) {
            return res.status(400).json({
                success: false,
                error: "Could not read enough text from the uploaded template. Please upload a clearer PDF or DOCX format.",
            });
        }

        const sourceId = chapter.pdfText;

        const finalLessonName =
            lessonName || chapter.name || "Selected Chapter";
        const finalGrade = grade || "Not specified";
        const finalLessonNo = lessonNo || "Not specified";
        const finalNumberOfSessions = numberOfSessions || 2;
        const finalDurationPerSession = durationPerSession || "40 minutes";
        const finalTeachingStyle = teachingStyle || "Activity-based";

        const finalIncludeAssessment =
            includeAssessment === true ||
            includeAssessment === "true" ||
            includeAssessment === "on";

        const finalIncludeHomework =
            includeHomework === true ||
            includeHomework === "true" ||
            includeHomework === "on";

        const prompt = `
You are AIRA, an expert school lesson plan assistant.

Use ONLY the selected chapter PDF content from this ChatPDF source.
Do not use outside knowledge.

TASK:
Generate a fresh lesson plan for the selected chapter using the uploaded school's lesson plan format.

IMPORTANT:
The uploaded template is ONLY for structure and format.
Do not copy the old lesson content from the uploaded template.
Use its headings, order, fields, and table structure.
Replace all content with new content based on the selected chapter PDF.

UPLOADED SCHOOL TEMPLATE STRUCTURE:
${templateText}

NEW LESSON DETAILS:
Grade: ${finalGrade}
Lesson No.: ${finalLessonNo}
Lesson Name: ${finalLessonName}
Chapter: ${chapter.name || ""}
Course: ${chapter.course?.name || chapter.courseName || ""}
No. of Sessions / Periods: ${finalNumberOfSessions}
Duration per Session: ${finalDurationPerSession}
Teaching Style: ${finalTeachingStyle}
Include Assessment: ${finalIncludeAssessment ? "Yes" : "No"}
Include Assignment / Homework: ${finalIncludeHomework ? "Yes" : "No"}

STRICT RULES:
1. Follow the uploaded school's format as closely as possible.
2. Keep the same main headings and same order.
3. If the uploaded format has tables, recreate them using markdown tables.
4. Fill every field using the selected chapter PDF content.
5. If a field is not applicable, write "Not applicable".
6. Do not mention AI or ChatPDF.
7. Do not explain the process.
8. Do not add anything outside the lesson plan.
9. Use clear teacher-friendly English.
10. Create exactly ${finalNumberOfSessions} session/period plans if the format requires session-wise planning.
11. Return clean markdown only.
`;

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            {
                referenceSources: true,
                sourceId,
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
                timeout: 90000,
            },
        );
        await recordAiUsage({
            req,
            feature: "custom_lesson_plan_generation",
            sourceId,
            metadata: { templateName: req.file.originalname },
        });

        return res.status(200).json({
            success: true,
            lessonPlan: chatPdfResponse.data?.content || "",
            references: (chatPdfResponse.data?.references || []).map((ref) => {
                if (typeof ref === "string") return ref;
                if (ref?.pageNumber) return `Page ${ref.pageNumber}`;
                if (ref?.page) return `Page ${ref.page}`;
                if (ref?.text) return ref.text;
                return JSON.stringify(ref);
            }),
            chapter: {
                _id: chapter._id,
                name: chapter.name,
                courseName: chapter.course?.name || chapter.courseName || "",
            },
        });
    } catch (error) {
        console.error("Error in generateAiraCustomLessonPlan:");
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
        console.error("Message:", error.message);

        return res.status(error.response?.status || 500).json({
            success: false,
            error:
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Custom lesson plan generation failed",
            details: error.response?.data || null,
        });
    }
};


exports.testExtractTextbookImages = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF."
            });
        }

        const pdfPath = req.file.path;

        const outputDir = path.join(
            __dirname,
            "../uploads/extracted-pages",
            Date.now().toString()
        );

        // Extract images
        const extractionResult =
            await extractTextbookImages(
                pdfPath,
                outputDir
            );
            const metadataPath = path.join(
    outputDir,
    "metadata.json"
);

await fs.promises.writeFile(
    metadataPath,
    JSON.stringify(extractionResult, null, 2),
    "utf8"
);

        // Delete temporary uploaded PDF
        await fs.promises.unlink(pdfPath);

        res.status(200).json({

            success: true,

            // Number of pages in the PDF
            totalPages:
                extractionResult.totalPages || null,

            // Folder where images were saved
            outputFolder:
                outputDir,

            // Folder ID used by browser preview
            folderId:
                extractionResult.folderId,

            // Image statistics
            totalImages:
                extractionResult.totalImages,

            usableImages:
                extractionResult.usableImages,

            rejectedImages:
                extractionResult.rejectedImages,

            // All extracted image metadata
            images:
                extractionResult.images

        });

    } catch (error) {

        console.error(
            "Textbook extraction error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.testExtractedImages = (req, res) => {
    try {

        const folderId = req.query.folder;

        if (!folderId) {
            return res.status(400).send(
                "Please provide folder ID"
            );
        }

        const safeFolderId =
            path.basename(folderId);

        const folderPath = path.join(
            __dirname,
            "..",
            "uploads",
            "extracted-pages",
            safeFolderId
        );

        if (!fs.existsSync(folderPath)) {
            return res.status(404).send(
                "Extraction folder not found"
            );
        }

        const metadataPath = path.join(
            folderPath,
            "metadata.json"
        );

        if (!fs.existsSync(metadataPath)) {
            return res.status(404).send(`
                <h2>Metadata not found</h2>
                <p>Please run the PDF extraction again.</p>
            `);
        }

        const metadata =
            JSON.parse(
                fs.readFileSync(
                    metadataPath,
                    "utf8"
                )
            );

        const images =
            metadata.images || [];

        const usableImages =
            images.filter(
                image => image.usable
            );

        const rejectedImages =
            images.filter(
                image => !image.usable
            );

        let html = `
<!DOCTYPE html>
<html>

<head>

<title>Extracted Textbook Images</title>

<style>

body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background: #f5f5f5;
}

h1 {
    margin-bottom: 10px;
}

.summary {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.summary-card {
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.summary-card strong {
    display: block;
    font-size: 24px;
    margin-bottom: 5px;
}

.grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
}

.card {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow:
        0 2px 8px rgba(0,0,0,0.1);
}

.card img {
    width: 100%;
    height: 180px;
    object-fit: contain;
    background: #eee;
    border-radius: 5px;
}

.filename {
    margin-top: 10px;
    font-size: 13px;
    font-weight: bold;
    word-break: break-all;
}

.details {
    margin-top: 8px;
    font-size: 13px;
    color: #555;
}

.status {
    margin-top: 8px;
    padding: 6px 8px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: bold;
}

.usable {
    background: #e8f5e9;
    color: #2e7d32;
}

.rejected {
    background: #ffebee;
    color: #c62828;
}

</style>

</head>

<body>

<h1>Extracted Textbook Images</h1>

<p>
Folder: ${safeFolderId}
</p>

<div class="summary">

    <div class="summary-card">
        <strong>${images.length}</strong>
        Total extracted
    </div>

    <div class="summary-card">
        <strong>${usableImages.length}</strong>
        Usable candidates
    </div>

    <div class="summary-card">
        <strong>${rejectedImages.length}</strong>
        Rejected
    </div>

</div>

<div class="grid">
`;

        images.forEach((image, index) => {

            const statusClass =
                image.usable
                    ? "usable"
                    : "rejected";

            const statusText =
                image.usable
                    ? "✓ Candidate"
                    : "✕ Rejected";

            html += `

<div class="card">

    <img
        src="/extracted-images/${encodeURIComponent(
            safeFolderId
        )}/${encodeURIComponent(
            image.filename
        )}"
        alt="${image.filename}"
    />

    <div class="filename">
        ${index + 1}. ${image.filename}
    </div>

    <div class="details">

        Page: ${image.pageNumber}

        <br>

        Size:
        ${image.width} × ${image.height}

        <br>

        Aspect ratio:
        ${image.aspectRatio}

    </div>

    <div class="status ${statusClass}">

        ${statusText}

        <br>

        ${image.reason}

    </div>

</div>

`;

        });

        html += `

</div>

</body>

</html>
`;

        res.send(html);

    } catch (error) {

        console.error(
            "Preview error:",
            error
        );

        res.status(500).send(`
            <h2>Error loading extracted images</h2>
            <pre>${error.message}</pre>
        `);
    }
};