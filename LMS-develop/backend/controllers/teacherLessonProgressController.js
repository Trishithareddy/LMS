const TeacherLessonProgress = require("../models/TeacherLessonProgress");

exports.upsertLessonProgress = async (req, res) => {
    try {
        const teacherId = req.teacher?._id || req.teacher?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Teacher not authenticated",
            });
        }

        const {
            batchId,
            courseId,
            chapterId,
            lessonId,
            status,
            remarks = "",
        } = req.body;

        if (!batchId || !courseId || !chapterId || !lessonId || !status) {
            return res.status(400).json({
                success: false,
                message:
                    "batchId, courseId, chapterId, lessonId and status are required",
            });
        }

        const allowedStatuses = [
            "not-started",
            "in-progress",
            "completed",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson progress status",
            });
        }

        const progress = await TeacherLessonProgress.findOneAndUpdate(
            {
                teacher: teacherId,
                batch: batchId,
                course: courseId,
                chapter: chapterId,
                lesson: lessonId,
            },
            {
                $set: {
                    status,
                    remarks,
                    completedAt:
                        status === "completed" ? new Date() : null,
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        )
            .populate("lesson", "lessonName name")
            .populate("chapter", "name")
            .populate("course", "name")
            .populate("batch", "batchName");

        return res.status(200).json({
            success: true,
            message: "Lesson progress updated successfully",
            progress,
        });
    } catch (error) {
        console.error("Error updating lesson progress:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lesson progress",
            error: error.message,
        });
    }
};

exports.getLessonProgress = async (req, res) => {
    try {
        const teacherId = req.teacher?._id || req.teacher?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Teacher not authenticated",
            });
        }

        const { batchId, courseId, chapterId } = req.query;

        if (!batchId || !courseId || !chapterId) {
            return res.status(400).json({
                success: false,
                message: "batchId, courseId and chapterId are required",
            });
        }

        const progressList = await TeacherLessonProgress.find({
            teacher: teacherId,
            batch: batchId,
            course: courseId,
            chapter: chapterId,
        });

        return res.status(200).json({
            success: true,
            progress: progressList,
        });
    } catch (error) {
        console.error("Error fetching lesson progress:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch lesson progress",
            error: error.message,
        });
    }
};