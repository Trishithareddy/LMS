const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs");

const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const cloudinary = require("../middleware/cloudinary");

const getAllowedExtensions = (value = "") =>
    String(value)
        .split(/[,/ ]+/)
        .map((item) => item.trim().replace(/^\./, "").toLowerCase())
        .filter(Boolean);

const getFileExtension = (fileName = "") => {
    const pieces = String(fileName).toLowerCase().split(".");
    return pieces.length > 1 ? pieces.pop() : "";
};

const buildSubmissionVersion = (submission = {}) => ({
    textAnswer: submission.textAnswer || "",
    codeAnswer: submission.codeAnswer || "",
    fileUrl: submission.fileUrl || "",
    fileName: submission.fileName || "",
    uploadedFileUrl: submission.uploadedFileUrl || "",
    uploadedFileName: submission.uploadedFileName || "",
    uploadedFileType: submission.uploadedFileType || "",
    uploadedFileSize: Number(submission.uploadedFileSize || 0),
    projectLink: submission.projectLink || "",
    studentNote: submission.studentNote || "",
    submittedAt: submission.submittedAt || null,
    status: submission.status || "",
});

const getLoggedInUserId = (req) => {
    return (
        req.teacher?._id ||
        req.student?._id ||
        req.user?._id ||
        req.admin?._id ||
        req.authUser?._id ||
        null
    );
};

const getStudentFromRequest = (req) => {
    return req.student || req.user || req.authUser || null;
};

const detectSoftwareTool = ({
    courseName = "",
    chapterName = "",
    title = "",
}) => {
    const text = `${courseName} ${chapterName} ${title}`.toLowerCase();

    if (text.includes("python")) return "Python";
    if (text.includes("scratch")) return "Scratch";
    if (text.includes("html") || text.includes("css")) return "HTML/CSS";
    if (text.includes("javascript") || text.includes("js")) return "JavaScript";
    if (text.includes("word")) return "MS Word";
    if (text.includes("excel")) return "MS Excel";
    if (text.includes("powerpoint") || text.includes("ppt")) {
        return "MS PowerPoint";
    }
    if (text.includes("robot") || text.includes("arduino")) {
        return "Robotics / Arduino";
    }
    if (text.includes("teachable") || text.includes("ai")) {
        return "AI / Teachable Machine";
    }
    if (text.includes("cyber") || text.includes("safety")) {
        return "Cyber Safety";
    }

    return "General";
};

const getDefaultRubric = (assignmentType, softwareTool, maxMarks = 10) => {
    const marks = Number(maxMarks || 10);

    if (softwareTool === "Python" || softwareTool === "JavaScript") {
        return [
            { criteria: "Correct logic", marks: Math.round(marks * 0.4) },
            {
                criteria: "Syntax and execution",
                marks: Math.round(marks * 0.25),
            },
            { criteria: "Expected output", marks: Math.round(marks * 0.25) },
            {
                criteria: "Code readability",
                marks: marks - Math.round(marks * 0.9),
            },
        ];
    }

    if (softwareTool === "Scratch") {
        return [
            {
                criteria: "Correct use of blocks",
                marks: Math.round(marks * 0.35),
            },
            {
                criteria: "Project behaviour/output",
                marks: Math.round(marks * 0.35),
            },
            {
                criteria: "Creativity and presentation",
                marks: Math.round(marks * 0.2),
            },
            {
                criteria: "Student explanation",
                marks: marks - Math.round(marks * 0.9),
            },
        ];
    }

    if (softwareTool === "HTML/CSS") {
        return [
            { criteria: "HTML structure", marks: Math.round(marks * 0.3) },
            { criteria: "CSS styling", marks: Math.round(marks * 0.3) },
            {
                criteria: "Required elements/output",
                marks: Math.round(marks * 0.3),
            },
            { criteria: "Neatness", marks: marks - Math.round(marks * 0.9) },
        ];
    }

    if (
        softwareTool === "MS Word" ||
        softwareTool === "MS PowerPoint" ||
        softwareTool === "MS Excel"
    ) {
        return [
            {
                criteria: "Completion of required task",
                marks: Math.round(marks * 0.4),
            },
            {
                criteria: "Use of correct tool features",
                marks: Math.round(marks * 0.3),
            },
            {
                criteria: "Presentation and neatness",
                marks: Math.round(marks * 0.2),
            },
            {
                criteria: "Timely submission",
                marks: marks - Math.round(marks * 0.9),
            },
        ];
    }

    if (softwareTool === "Robotics / Arduino") {
        return [
            {
                criteria: "Correct circuit/logic",
                marks: Math.round(marks * 0.35),
            },
            {
                criteria: "Code or working explanation",
                marks: Math.round(marks * 0.3),
            },
            {
                criteria: "Output/working evidence",
                marks: Math.round(marks * 0.25),
            },
            {
                criteria: "Presentation",
                marks: marks - Math.round(marks * 0.9),
            },
        ];
    }

    return [
        { criteria: "Concept understanding", marks: Math.round(marks * 0.4) },
        { criteria: "Completeness", marks: Math.round(marks * 0.3) },
        { criteria: "Clarity of answer", marks: Math.round(marks * 0.2) },
        { criteria: "Presentation", marks: marks - Math.round(marks * 0.9) },
    ];
};

const buildSubmissionText = (submission = {}) => {
    return [
        submission.textAnswer,
        submission.codeAnswer,
        submission.projectLink,
        submission.studentNote,
        submission.fileUrl,
        submission.uploadedFileUrl,
    ]
        .filter(Boolean)
        .join("\n\n");
};

const localAiraEvaluate = ({ assignment, submission }) => {
    const submittedText = buildSubmissionText(submission).trim();
    const rubric =
        assignment.rubric?.length > 0
            ? assignment.rubric
            : getDefaultRubric(
                  assignment.assignmentType,
                  assignment.softwareTool,
                  assignment.maxMarks,
              );

    const criteriaScores = [];
    let total = 0;

    const wordCount = submittedText.split(/\s+/).filter(Boolean).length;
    const hasCode =
        Boolean(submission.codeAnswer) ||
        /print|input|def |for |while |if |else|<html|<body|style=|function/.test(
            submittedText.toLowerCase(),
        );
    const hasFileOrLink = Boolean(submission.fileUrl || submission.projectLink);

    rubric.forEach((item) => {
        let score = 0;
        const max = Number(item.marks || 0);
        const criteria = String(item.criteria || "").toLowerCase();

        if (!submittedText && !hasFileOrLink) {
            score = 0;
        } else if (
            criteria.includes("syntax") ||
            criteria.includes("code") ||
            criteria.includes("logic") ||
            criteria.includes("html") ||
            criteria.includes("css")
        ) {
            score = hasCode ? Math.round(max * 0.8) : Math.round(max * 0.45);
        } else if (
            criteria.includes("output") ||
            criteria.includes("evidence") ||
            criteria.includes("file") ||
            criteria.includes("project")
        ) {
            score =
                hasFileOrLink || wordCount > 20
                    ? Math.round(max * 0.75)
                    : Math.round(max * 0.4);
        } else if (
            criteria.includes("presentation") ||
            criteria.includes("neatness") ||
            criteria.includes("clarity")
        ) {
            score =
                wordCount > 15 || hasFileOrLink
                    ? Math.round(max * 0.75)
                    : Math.round(max * 0.5);
        } else {
            score =
                wordCount > 10 || hasCode || hasFileOrLink
                    ? Math.round(max * 0.75)
                    : Math.round(max * 0.4);
        }

        if (score > max) score = max;
        total += score;

        criteriaScores.push({
            criteria: item.criteria,
            maxMarks: max,
            awardedMarks: score,
            feedback:
                score >= max * 0.75
                    ? "Good attempt based on the submitted work."
                    : "Needs more detail or clearer completion evidence.",
        });
    });

    const maxMarks = Number(assignment.maxMarks || 10);
    if (total > maxMarks) total = maxMarks;

    return {
        suggestedMarks: total,
        feedback:
            assignment.softwareTool === "Python"
                ? "AIRA checked the submitted Python/code response based on logic, syntax, output, and clarity. Teacher review is recommended before final marks."
                : `AIRA reviewed this ${assignment.softwareTool} submission using the assignment rubric. Teacher can edit marks and feedback before finalizing.`,
        criteriaScores,
        strengths: [
            submittedText || hasFileOrLink
                ? "Submission has been attempted."
                : "No clear submission content found.",
            hasCode
                ? "Code/tool-specific response detected."
                : "Response reviewed using rubric.",
        ],
        improvements: [
            "Add clear output evidence or explanation where required.",
            "Follow all instructions given in the assignment description.",
        ],
        evaluatedAt: new Date(),
    };
};

const callGeminiEvaluation = async ({ assignment, submission }) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return null;
    }

    const prompt = `
You are AIRA, an LMS academic evaluator.

Evaluate the student submission fairly.
Return only JSON.

Assignment:
Title: ${assignment.title}
Description: ${assignment.description}
Type: ${assignment.assignmentType}
Software/Tool: ${assignment.softwareTool}
Max Marks: ${assignment.maxMarks}
Rubric: ${JSON.stringify(assignment.rubric || [])}

Student Submission:
Text Answer: ${submission.textAnswer || ""}
Code Answer: ${submission.codeAnswer || ""}
File URL: ${submission.fileUrl || ""}
Project Link: ${submission.projectLink || ""}
Student Note: ${submission.studentNote || ""}

Return JSON format:
{
  "suggestedMarks": 0,
  "feedback": "short feedback",
  "criteriaScores": [
    {
      "criteria": "criteria name",
      "maxMarks": 0,
      "awardedMarks": 0,
      "feedback": "feedback"
    }
  ],
  "strengths": ["point"],
  "improvements": ["point"]
}
`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 60000,
            },
        );

        const text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const cleaned = text
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/i, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return {
            suggestedMarks: Number(parsed.suggestedMarks || 0),
            feedback: parsed.feedback || "",
            criteriaScores: Array.isArray(parsed.criteriaScores)
                ? parsed.criteriaScores
                : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            improvements: Array.isArray(parsed.improvements)
                ? parsed.improvements
                : [],
            evaluatedAt: new Date(),
        };
    } catch (error) {
        console.error("Gemini AIRA evaluation failed:", error.message);
        return null;
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: teacher not found",
            });
        }

        const {
            batchId,
            batchName,
            courseId,
            courseName,
            chapterId,
            chapterName,
            title,
            taskType,
            description,
            assignmentType,
            softwareTool,
            submissionType,
            dueDate,
            maxMarks,
            autoEvaluate,
            rubric,
            attachmentUrl,
            attachmentName,
            attachmentType,
            attachmentSize,
            status,
            className,
            sectionName,
            classSection,
            expectedAnswerLength,
            problemStatement,
            starterCode,
            expectedOutput,
            testCases,
            practicalSteps,
            projectRequirements,
            allowedFileTypes,
            fileNameInstruction,
        } = req.body;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title and due date are required",
            });
        }

        const finalTool =
            softwareTool ||
            detectSoftwareTool({ courseName, chapterName, title });

        const finalMaxMarks = Number(maxMarks || 10);

        const finalRubric =
            Array.isArray(rubric) && rubric.length > 0
                ? rubric
                : getDefaultRubric(assignmentType, finalTool, finalMaxMarks);

        const assignment = await Assignment.create({
            teacherId,

            batchId,
            batchName,

            className: className || "",
            sectionName: sectionName || "",
            classSection: classSection || "",

            courseId: courseId || null,
            courseName: courseName || "",

            chapterId: chapterId || null,
            chapterName: chapterName || "",

            title,
            taskType: taskType || "Written Task",
            description,

            assignmentType,
            softwareTool,
            submissionType,

            expectedAnswerLength: expectedAnswerLength || "",
            problemStatement: problemStatement || "",
            starterCode: starterCode || "",
            expectedOutput: expectedOutput || "",
            testCases: testCases || "",
            practicalSteps: practicalSteps || "",
            projectRequirements: projectRequirements || "",
            allowedFileTypes: allowedFileTypes || "",
            fileNameInstruction: fileNameInstruction || "",

            dueDate,
            maxMarks: finalMaxMarks,
            autoEvaluate: Boolean(autoEvaluate),
            rubric: finalRubric,
            attachmentUrl,
            attachmentName: attachmentName || "",
            attachmentType: attachmentType || "",
            attachmentSize: Number(attachmentSize || 0),
            status: ["draft", "active", "closed"].includes(status)
                ? status
                : "active",
        });
        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment,
        });
    } catch (error) {
        console.error("Error creating assignment:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create assignment",
            error: error.message,
        });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);
        const { assignmentId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: teacher not found",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Valid assignmentId is required",
            });
        }

        const allowedFields = [
            "title",
            "taskType",
            "description",
            "className",
            "sectionName",
            "classSection",
            "courseId",
            "courseName",
            "chapterId",
            "chapterName",
            "assignmentType",
            "softwareTool",
            "submissionType",
            "expectedAnswerLength",
            "problemStatement",
            "starterCode",
            "expectedOutput",
            "testCases",
            "practicalSteps",
            "projectRequirements",
            "allowedFileTypes",
            "fileNameInstruction",
            "dueDate",
            "maxMarks",
            "autoEvaluate",
            "rubric",
            "attachmentUrl",
            "attachmentName",
            "attachmentType",
            "attachmentSize",
            "status",
        ];

        const updates = allowedFields.reduce((next, field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                next[field] = req.body[field];
            }
            return next;
        }, {});

        if (updates.maxMarks !== undefined) {
            updates.maxMarks = Number(updates.maxMarks || 10);
        }

        if (updates.courseId === "") {
            updates.courseId = null;
        }

        if (updates.chapterId === "") {
            updates.chapterId = null;
        }

        if (
            updates.status &&
            !["draft", "active", "closed"].includes(updates.status)
        ) {
            delete updates.status;
        }

        const assignment = await Assignment.findOneAndUpdate(
            { _id: assignmentId, teacherId },
            updates,
            { new: true, runValidators: true },
        );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            assignment,
        });
    } catch (error) {
        console.error("Error updating assignment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update assignment",
            error: error.message,
        });
    }
};

exports.uploadSubmissionFile = async (req, res) => {
    const cleanup = () => {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }
    };

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please choose a file to upload",
            });
        }

        const assignment = mongoose.Types.ObjectId.isValid(
            req.body.assignmentId,
        )
            ? await Assignment.findById(req.body.assignmentId).lean()
            : null;

        if (!assignment) {
            cleanup();
            return res.status(404).json({
                success: false,
                message: "Assignment not found for file upload",
            });
        }

        const allowedExtensions = getAllowedExtensions(
            assignment.allowedFileTypes,
        );
        const extension = getFileExtension(req.file.originalname);

        if (
            allowedExtensions.length > 0 &&
            (!extension || !allowedExtensions.includes(extension))
        ) {
            cleanup();
            return res.status(400).json({
                success: false,
                message: `This task accepts: ${assignment.allowedFileTypes}`,
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "assignment-submissions",
            resource_type: "auto",
        });

        cleanup();

        return res.status(201).json({
            success: true,
            file: {
                url: result.secure_url || result.url,
                name: req.file.originalname,
                type: req.file.mimetype || "",
                size: req.file.size || 0,
            },
        });
    } catch (error) {
        cleanup();
        console.error("Error uploading assignment submission file:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload assignment file",
            error: error.message,
        });
    }
};

exports.uploadAssignmentAttachment = async (req, res) => {
    const cleanup = () => {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }
    };

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please choose an attachment to upload",
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "assignment-attachments",
            resource_type: "auto",
        });

        cleanup();

        return res.status(201).json({
            success: true,
            file: {
                url: result.secure_url || result.url,
                name: req.file.originalname,
                type: req.file.mimetype || "",
                size: req.file.size || 0,
            },
        });
    } catch (error) {
        cleanup();
        console.error("Error uploading assignment attachment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload assignment attachment",
            error: error.message,
        });
    }
};

exports.getTeacherAssignments = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);
        const { batchId, status } = req.query;

        const query = { teacherId };

        if (batchId) query.batchId = batchId;
        if (status) query.status = status;

        const assignments = await Assignment.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            assignments,
        });
    } catch (error) {
        console.error("Error fetching teacher assignments:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assignments",
            error: error.message,
        });
    }
};

exports.getStudentAssignments = async (req, res) => {
    try {
        const student = getStudentFromRequest(req);
        const studentId = student?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: student not found",
            });
        }

        const batches = Array.isArray(student.batches) ? student.batches : [];

        const batchIds = batches
            .map((batch) => batch._id || batch.id || batch.batchId || batch)
            .filter(Boolean);

        const assignments = await Assignment.find({
            batchId: { $in: batchIds },
            status: "active",
        })
            .sort({ dueDate: 1 })
            .lean();

        const submissions = await AssignmentSubmission.find({
            studentId,
            assignmentId: { $in: assignments.map((a) => a._id) },
        }).lean();

        const submissionMap = new Map(
            submissions.map((submission) => [
                String(submission.assignmentId),
                submission,
            ]),
        );

        const result = assignments.map((assignment) => ({
            ...assignment,
            submission: submissionMap.get(String(assignment._id)) || null,
        }));

        return res.status(200).json({
            success: true,
            assignments: result,
        });
    } catch (error) {
        console.error("Error fetching student assignments:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student assignments",
            error: error.message,
        });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const student = getStudentFromRequest(req);
        const studentId = student?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: student not found",
            });
        }

        const {
            assignmentId,
            textAnswer,
            codeAnswer,
            fileUrl,
            fileName,
            uploadedFileUrl,
            uploadedFileName,
            uploadedFileType,
            uploadedFileSize,
            projectLink,
            studentNote,
        } = req.body;

        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Valid assignmentId is required",
            });
        }

        const assignment = await Assignment.findById(assignmentId).lean();

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        const now = new Date();

        let isLate = false;

        if (assignment.dueDate) {
            const dueEnd = new Date(assignment.dueDate);
            dueEnd.setHours(23, 59, 59, 999);
            isLate = now > dueEnd;
        }

        const studentName =
            student.name ||
            student.studentName ||
            student.fullName ||
            "Student";

        const existingSubmission = await AssignmentSubmission.findOne({
            assignmentId,
            studentId,
        }).lean();
        const submissionHistory = existingSubmission
            ? [
                  ...(existingSubmission.submissionHistory || []),
                  buildSubmissionVersion(existingSubmission),
              ]
            : [];

        let submission = await AssignmentSubmission.findOneAndUpdate(
            {
                assignmentId,
                studentId,
            },
            {
                assignmentId,
                batchId: assignment.batchId,

                className: assignment.className || "",
                sectionName: assignment.sectionName || "",
                classSection: assignment.classSection || "",

                studentId,
                studentName,

                textAnswer: textAnswer || "",
                codeAnswer: codeAnswer || "",
                fileUrl: fileUrl || "",
                fileName: fileName || "",
                uploadedFileUrl: uploadedFileUrl || "",
                uploadedFileName: uploadedFileName || "",
                uploadedFileType: uploadedFileType || "",
                uploadedFileSize: Number(uploadedFileSize || 0),
                projectLink: projectLink || "",
                studentNote: studentNote || "",

                submittedAt: new Date(),
                isLate,
                resubmissionCount: existingSubmission
                    ? Number(existingSubmission.resubmissionCount || 0) + 1
                    : 0,
                submissionHistory,
                status: isLate ? "late_submission" : "submitted",
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            },
        );

        if (assignment.autoEvaluate) {
            const geminiEval = await callGeminiEvaluation({
                assignment,
                submission,
            });

            const evaluation =
                geminiEval || localAiraEvaluate({ assignment, submission });

            submission = await AssignmentSubmission.findByIdAndUpdate(
                submission._id,
                {
                    airaEvaluation: evaluation,
                    finalMarks:
                        submission.finalMarks === null ||
                        submission.finalMarks === undefined
                            ? evaluation.suggestedMarks
                            : submission.finalMarks,
                },
                { new: true },
            );
        }

        return res.status(200).json({
            success: true,
            message: "Assignment submitted successfully",
            submission,
        });
    } catch (error) {
        console.error("Error submitting assignment:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit assignment",
            error: error.message,
        });
    }
};

exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Valid assignmentId is required",
            });
        }

        const submissions = await AssignmentSubmission.find({ assignmentId })
            .sort({ submittedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Error fetching submissions:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch submissions",
            error: error.message,
        });
    }
};

exports.runAiraEvaluation = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await AssignmentSubmission.findById(submissionId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        const assignment = await Assignment.findById(
            submission.assignmentId,
        ).lean();

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        const geminiEval = await callGeminiEvaluation({
            assignment,
            submission,
        });

        const evaluation =
            geminiEval || localAiraEvaluate({ assignment, submission });

        submission.airaEvaluation = evaluation;
        submission.finalMarks = evaluation.suggestedMarks;
        await submission.save();

        return res.status(200).json({
            success: true,
            message: "AIRA evaluation completed",
            evaluation,
            submission,
        });
    } catch (error) {
        console.error("Error running AIRA evaluation:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to run AIRA evaluation",
            error: error.message,
        });
    }
};

exports.reviewSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { finalMarks, teacherComment, status } = req.body;

        const submission = await AssignmentSubmission.findByIdAndUpdate(
            submissionId,
            {
                finalMarks:
                    finalMarks === "" || finalMarks === null
                        ? null
                        : Number(finalMarks),
                teacherComment: teacherComment || "",
                status: status || "reviewed",
            },
            { new: true },
        );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Submission reviewed successfully",
            submission,
        });
    } catch (error) {
        console.error("Error reviewing submission:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to review submission",
            error: error.message,
        });
    }
};

exports.getAllTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);
        const { batchId } = req.query;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: teacher not found",
            });
        }

        const assignmentQuery = { teacherId };

        if (batchId) {
            assignmentQuery.batchId = batchId;
        }

        const assignments = await Assignment.find(assignmentQuery)
            .sort({ createdAt: -1 })
            .lean();

        const assignmentIds = assignments.map((assignment) => assignment._id);

        const submissions = await AssignmentSubmission.find({
            assignmentId: { $in: assignmentIds },
        })
            .sort({ submittedAt: -1 })
            .lean();

        const assignmentMap = new Map(
            assignments.map((assignment) => [
                String(assignment._id),
                assignment,
            ]),
        );

        const submissionCards = submissions.map((submission) => {
            const assignment = assignmentMap.get(
                String(submission.assignmentId),
            );

            return {
                ...submission,
                assignmentTitle: assignment?.title || "",
                assignmentDescription: assignment?.description || "",
                batchName: assignment?.batchName || "",
                softwareTool: assignment?.softwareTool || "General",
                assignmentType:
                    assignment?.assignmentType || "Theory Assignment",
                dueDate: assignment?.dueDate || "",
                maxMarks: assignment?.maxMarks || 0,
            };
        });

        return res.status(200).json({
            success: true,
            submissions: submissionCards,
        });
    } catch (error) {
        console.error("Error fetching all teacher submissions:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch submitted assignments",
            error: error.message,
        });
    }
};
exports.getAssignmentReport = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);
        const { batchId } = req.query;

        const assignmentQuery = { teacherId };
        if (batchId) assignmentQuery.batchId = batchId;

        const assignments = await Assignment.find(assignmentQuery)
            .sort({ createdAt: -1 })
            .lean();

        const assignmentIds = assignments.map((assignment) => assignment._id);

        const submissions = await AssignmentSubmission.find({
            assignmentId: { $in: assignmentIds },
        }).lean();

        const submissionByAssignment = new Map();

        submissions.forEach((submission) => {
            const key = String(submission.assignmentId);

            if (!submissionByAssignment.has(key)) {
                submissionByAssignment.set(key, []);
            }

            submissionByAssignment.get(key).push(submission);
        });

        const report = assignments.map((assignment) => {
            const related =
                submissionByAssignment.get(String(assignment._id)) || [];

            return {
                assignmentId: assignment._id,
                title: assignment.title,
                batchName: assignment.batchName,
                softwareTool: assignment.softwareTool,
                dueDate: assignment.dueDate,
                maxMarks: assignment.maxMarks,
                totalSubmissions: related.length,
                reviewed: related.filter((s) => s.status === "reviewed").length,
                needsCorrection: related.filter(
                    (s) => s.status === "needs_correction",
                ).length,
                late: related.filter((s) => s.isLate).length,
                pendingReview: related.filter(
                    (s) =>
                        s.status === "submitted" ||
                        s.status === "late_submission",
                ).length,
            };
        });

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Error fetching assignment report:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assignment report",
            error: error.message,
        });
    }
};
