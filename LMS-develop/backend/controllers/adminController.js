// controllers/admin.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const dotenv = require("dotenv");
const School = require("../models/School");
const mongoose = require("mongoose");
const SchoolAdmin = require("../models/SchoolAdmin");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const SchoolAdminActivity = require("../models/SchoolAdminActivity");
const UserActivity = require("../models/UserActivity");
const AiApiUsage = require("../models/AiApiUsage");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const AttemptQuiz = require("../models/AttepmtQuiz");
const ChapterQuizAttempt = require("../models/ChapterwiseQuizAttempt");
const Announcement = require("../models/Announcement");
const PracticeProject = require("../models/PracticeProject");
const StudentCourseProgress = require("../models/studentCourseProgress");
const { QuestionBase } = require("../models/QuestionBase");
const cloudinary = require("../middleware/cloudinary");
const TimeSetting = require("../models/TimeSetting")
const Chapter = require('../models/Chapter');
const { sendTeacherCredentials } = require("../services/emailService");
const Lesson = require('../models/Lesson')
const fs = require("fs/promises");
const { validationResult, body } = require("express-validator");
const Counter = require("../models/Counter");
// Secret key for JWT
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const logSchoolAdminActivity = async (req, payload) => {
    try {
        if (!req.schoolAdmin?._id || !req.schoolAdmin?.school) return;
        await SchoolAdminActivity.create({
            schoolAdmin: req.schoolAdmin._id,
            school: req.schoolAdmin.school,
            ...payload,
        });
    } catch (error) {
        console.error("School admin activity log failed:", error.message);
    }
};

const getStartOfMonth = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth(), 1);

const getPercent = (part, total) =>
    total > 0 ? Math.round((Number(part || 0) / total) * 10000) / 100 : 0;

const toId = (value) => String(value?._id || value || "");
const toArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};
const roundOne = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 10) / 10;
const reportPercent = (part, total) => (total > 0 ? roundOne((part / total) * 100) : 0);
const addMetric = (map, key, amount = 1) => {
    if (!key) return;
    map.set(String(key), (map.get(String(key)) || 0) + amount);
};
const dateRangeFromQuery = (query) => {
    const now = new Date();
    const end = query.endDate ? new Date(query.endDate) : now;
    end.setHours(23, 59, 59, 999);

    const start = query.startDate ? new Date(query.startDate) : new Date(end);
    if (!query.startDate) start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    return { start, end };
};
const dateQuery = (start, end) => ({ createdAt: { $gte: start, $lte: end } });

exports.getSchoolUsageReport = async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ success: false, message: "Valid schoolId is required" });
        }

        const { start, end } = dateRangeFromQuery(req.query);
        const school = await School.findById(schoolId).select("name city state").lean();
        if (!school) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const [students, teachers] = await Promise.all([
            Student.find({ school: schoolId }).select("-password").lean(),
            Teacher.find({ school: schoolId }).select("-password").lean(),
        ]);

        const studentIds = students.map((student) => toId(student._id));
        const teacherIds = teachers.map((teacher) => toId(teacher._id));
        const studentSet = new Set(studentIds);
        const teacherSet = new Set(teacherIds);
        const batches = await Batch.find({
            $or: [
                { students: { $in: studentIds } },
                { "teachers.teacher": { $in: teacherIds } },
            ],
        })
            .populate("students", "name username school class section lastLogin isActive")
            .populate("teachers.teacher", "name username school lastLogin isActive")
            .populate("courses", "name description")
            .lean();
        const schoolBatches = batches.filter((batch) =>
            (batch.students || []).some((student) => studentSet.has(toId(student))) ||
            (batch.teachers || []).some((entry) => teacherSet.has(toId(entry.teacher)))
        );
        const batchIds = schoolBatches.map((batch) => batch._id);

        const [
            attendanceList,
            assignments,
            submissions,
            quizzes,
            quizAttempts,
            chapterQuizAttempts,
            announcements,
            projects,
            courseProgress,
            userActivities,
            aiUsage,
        ] = await Promise.all([
            Attendance.find({ batchId: { $in: batchIds }, ...dateQuery(start, end) }).lean(),
            Assignment.find({ batchId: { $in: batchIds }, ...dateQuery(start, end) }).lean(),
            AssignmentSubmission.find({ batchId: { $in: batchIds }, ...dateQuery(start, end) }).lean(),
            Quiz.find({
                $and: [
                    { ...dateQuery(start, end) },
                    {
                        $or: [
                            { assignedTo: { $in: batchIds } },
                            { createdBy: { $in: teacherIds } },
                        ],
                    },
                ],
            }).lean(),
            AttemptQuiz.find({ studentId: { $in: studentIds }, ...dateQuery(start, end) }).lean(),
            ChapterQuizAttempt.find({ studentId: { $in: studentIds }, ...dateQuery(start, end) }).lean(),
            Announcement.find({
                $and: [
                    { ...dateQuery(start, end) },
                    {
                        $or: [
                            { batches: { $in: batchIds } },
                            { createdBy: { $in: teacherIds } },
                        ],
                    },
                ],
            }).lean(),
            PracticeProject.find({ createdBy: { $in: studentIds }, ...dateQuery(start, end) }).lean(),
            StudentCourseProgress.find({ studentId: { $in: studentIds } }).lean(),
            UserActivity.find({ school: schoolId, ...dateQuery(start, end) }).lean(),
            AiApiUsage.find({ school: schoolId, ...dateQuery(start, end) }).lean(),
        ]);

        const attendanceByStudent = new Map();
        const attendanceByBatch = new Map();
        const attendanceByTeacher = new Map();
        let attendanceLoginCaptures = 0;

        attendanceList.forEach((attendance) => {
            const batchId = toId(attendance.batchId);
            const teacherId = toId(attendance.teacherId);
            if (teacherSet.has(teacherId)) addMetric(attendanceByTeacher, teacherId);
            const batchMetric = attendanceByBatch.get(batchId) || { present: 0, total: 0 };

            (attendance.records || []).forEach((record) => {
                const studentId = toId(record.studentId);
                const isPresent = ["present", "late"].includes(record.status);
                const studentMetric = attendanceByStudent.get(studentId) || { present: 0, total: 0 };
                if (studentSet.has(studentId)) {
                    studentMetric.total += 1;
                    if (isPresent) studentMetric.present += 1;
                    attendanceByStudent.set(studentId, studentMetric);
                    if (isPresent && record.loginTime) attendanceLoginCaptures += 1;
                }
                batchMetric.total += 1;
                if (isPresent) batchMetric.present += 1;
            });
            attendanceByBatch.set(batchId, batchMetric);
        });

        const submissionsByStudent = new Map();
        const submissionsByBatch = new Map();
        submissions.forEach((submission) => {
            addMetric(submissionsByStudent, toId(submission.studentId));
            addMetric(submissionsByBatch, toId(submission.batchId));
        });

        const assignmentsByTeacher = new Map();
        const assignmentsByBatch = new Map();
        assignments.forEach((assignment) => {
            addMetric(assignmentsByTeacher, toId(assignment.teacherId));
            addMetric(assignmentsByBatch, toId(assignment.batchId));
        });

        const quizzesByTeacher = new Map();
        const quizzesByBatch = new Map();
        quizzes.forEach((quiz) => {
            addMetric(quizzesByTeacher, toId(quiz.createdBy));
            toArray(quiz.assignedTo).forEach((batchId) => addMetric(quizzesByBatch, toId(batchId)));
        });

        const quizAttemptsByStudent = new Map();
        let trackedQuizMinutes = 0;
        [...quizAttempts, ...chapterQuizAttempts].forEach((attempt) => {
            addMetric(quizAttemptsByStudent, toId(attempt.studentId));
            trackedQuizMinutes += Number(attempt.duration || 0) / 60;
        });

        const announcementsByTeacher = new Map();
        announcements.forEach((announcement) => addMetric(announcementsByTeacher, toId(announcement.createdBy)));

        const projectsByStudent = new Map();
        const reviewsByTeacher = new Map();
        projects.forEach((project) => {
            addMetric(projectsByStudent, toId(project.createdBy));
            addMetric(reviewsByTeacher, toId(project.teacherReview?.reviewedBy));
        });

        const progressByStudent = new Map();
        courseProgress.forEach((progress) => {
            const studentId = toId(progress.studentId);
            const metric = progressByStudent.get(studentId) || { total: 0, count: 0 };
            metric.total += Number(progress.courseUTS || 0);
            metric.count += 1;
            progressByStudent.set(studentId, metric);
        });

        const activityByUser = new Map();
        const activityTrend = new Map();
        userActivities.forEach((activity) => {
            addMetric(activityByUser, toId(activity.userId));
            const day = new Date(activity.createdAt).toISOString().slice(0, 10);
            const metric = activityTrend.get(day) || { date: day, students: 0, teachers: 0, events: 0 };
            metric.events += 1;
            if (activity.userType === "STUDENT") metric.students += 1;
            if (activity.userType === "TEACHER") metric.teachers += 1;
            activityTrend.set(day, metric);
        });

        const batchNamesByTeacher = new Map();
        schoolBatches.forEach((batch) => {
            (batch.teachers || []).forEach((entry) => {
                const teacherId = toId(entry.teacher);
                const names = batchNamesByTeacher.get(teacherId) || [];
                names.push(batch.batchName);
                batchNamesByTeacher.set(teacherId, names);
            });
        });

        const studentRows = students.map((student) => {
            const studentId = toId(student._id);
            const attendance = attendanceByStudent.get(studentId) || { present: 0, total: 0 };
            const progress = progressByStudent.get(studentId) || { total: 0, count: 0 };
            const events = activityByUser.get(studentId) || 0;
            return {
                id: studentId,
                name: student.name,
                username: student.username,
                class: student.class || "",
                section: student.section || "",
                status: student.isActive ? "Active" : "Inactive",
                lastLogin: student.lastLogin || null,
                activityEvents: events,
                attendancePercent: reportPercent(attendance.present, attendance.total),
                attendanceDays: attendance.total,
                assignmentSubmissions: submissionsByStudent.get(studentId) || 0,
                quizAttempts: quizAttemptsByStudent.get(studentId) || 0,
                projectSubmissions: projectsByStudent.get(studentId) || 0,
                averageProgress: progress.count ? roundOne(progress.total / progress.count) : 0,
            };
        });

        const teacherRows = teachers.map((teacher) => {
            const teacherId = toId(teacher._id);
            const events = activityByUser.get(teacherId) || 0;
            const createdWork =
                (assignmentsByTeacher.get(teacherId) || 0) +
                (quizzesByTeacher.get(teacherId) || 0) +
                (announcementsByTeacher.get(teacherId) || 0);
            return {
                id: teacherId,
                name: teacher.name,
                username: teacher.username,
                status: teacher.isActive ? "Active" : "Inactive",
                lastLogin: teacher.lastLogin || null,
                activityEvents: events,
                batches: batchNamesByTeacher.get(teacherId)?.length || 0,
                batchNames: batchNamesByTeacher.get(teacherId) || [],
                attendanceSessions: attendanceByTeacher.get(teacherId) || 0,
                assignmentsCreated: assignmentsByTeacher.get(teacherId) || 0,
                quizzesCreated: quizzesByTeacher.get(teacherId) || 0,
                announcementsSent: announcementsByTeacher.get(teacherId) || 0,
                projectReviews: reviewsByTeacher.get(teacherId) || 0,
                createdWork,
            };
        });

        const batchRows = schoolBatches.map((batch) => {
            const batchId = toId(batch._id);
            const attendance = attendanceByBatch.get(batchId) || { present: 0, total: 0 };
            const batchStudentIds = new Set((batch.students || []).map(toId));
            const batchQuizAttempts = [...quizAttempts, ...chapterQuizAttempts].filter((attempt) =>
                batchStudentIds.has(toId(attempt.studentId))
            ).length;
            return {
                id: batchId,
                name: batch.batchName,
                students: (batch.students || []).length,
                teachers: (batch.teachers || []).length,
                courses: (batch.courses || []).length,
                attendancePercent: reportPercent(attendance.present, attendance.total),
                attendanceRecords: attendance.total,
                assignments: assignmentsByBatch.get(batchId) || 0,
                submissions: submissionsByBatch.get(batchId) || 0,
                quizzes: quizzesByBatch.get(batchId) || 0,
                quizAttempts: batchQuizAttempts,
            };
        });

        const totalAttendancePresent = [...attendanceByStudent.values()].reduce((sum, item) => sum + item.present, 0);
        const totalAttendanceRecords = [...attendanceByStudent.values()].reduce((sum, item) => sum + item.total, 0);
        const averageProgress = studentRows.length
            ? roundOne(studentRows.reduce((sum, row) => sum + row.averageProgress, 0) / studentRows.length)
            : 0;
        const isInRange = (value) => {
            if (!value) return false;
            const date = new Date(value);
            return date >= start && date <= end;
        };
        const activeStudentIds = new Set(userActivities.filter((item) => item.userType === "STUDENT").map((item) => toId(item.userId)));
        const activeTeacherIds = new Set(userActivities.filter((item) => item.userType === "TEACHER").map((item) => toId(item.userId)));
        students.forEach((student) => {
            if (isInRange(student.lastLogin)) activeStudentIds.add(toId(student._id));
        });
        teachers.forEach((teacher) => {
            if (isInRange(teacher.lastLogin)) activeTeacherIds.add(toId(teacher._id));
        });

        const classMap = new Map();
        studentRows.forEach((student) => {
            const key = `${student.class || "Unassigned"}-${student.section || ""}`.trim();
            const metric = classMap.get(key) || { name: key, students: 0, active: 0, quizAttempts: 0, submissions: 0, progressTotal: 0 };
            metric.students += 1;
            if (student.activityEvents > 0 || student.lastLogin) metric.active += 1;
            metric.quizAttempts += student.quizAttempts;
            metric.submissions += student.assignmentSubmissions;
            metric.progressTotal += student.averageProgress;
            classMap.set(key, metric);
        });

        const classUsage = [...classMap.values()].map((item) => ({
            ...item,
            activePercent: reportPercent(item.active, item.students),
            averageProgress: item.students ? roundOne(item.progressTotal / item.students) : 0,
        }));

        const aiByFeatureMap = new Map();
        let aiMessages = 0;
        let aiDurationMs = 0;
        aiUsage.forEach((usage) => {
            aiMessages += Number(usage.messageCount || 1);
            aiDurationMs += Number(usage.durationMs || 0);
            addMetric(aiByFeatureMap, usage.feature || "other", Number(usage.messageCount || 1));
        });

        const insights = [
            activeStudentIds.size === 0 ? "No student activity events were recorded in this range." : "",
            activeTeacherIds.size === 0 ? "No teacher activity events were recorded in this range." : "",
            batchRows.filter((batch) => batch.students === 0).length
                ? `${batchRows.filter((batch) => batch.students === 0).length} batches have no students assigned.`
                : "",
            batchRows.filter((batch) => batch.courses === 0).length
                ? `${batchRows.filter((batch) => batch.courses === 0).length} batches have no courses assigned.`
                : "",
            teacherRows.filter((teacher) => teacher.createdWork === 0 && teacher.batches > 0).length
                ? `${teacherRows.filter((teacher) => teacher.createdWork === 0 && teacher.batches > 0).length} assigned teachers have no created work in this range.`
                : "",
            projects.filter((project) => project.status === "submitted" && project.teacherReview?.status === "not_reviewed").length
                ? `${projects.filter((project) => project.status === "submitted" && project.teacherReview?.status === "not_reviewed").length} submitted projects are waiting for review.`
                : "",
        ].filter(Boolean);

        res.status(200).json({
            success: true,
            report: {
                generatedAt: new Date(),
                range: { start, end },
                school: {
                    id: toId(school._id),
                    name: school.name,
                    city: school.city || "",
                    state: school.state || "",
                },
                overview: {
                    students: students.length,
                    teachers: teachers.length,
                    batches: batchRows.length,
                    coursesAssigned: batchRows.reduce((sum, batch) => sum + batch.courses, 0),
                    activeStudents: activeStudentIds.size,
                    activeTeachers: activeTeacherIds.size,
                    averageAttendance: reportPercent(totalAttendancePresent, totalAttendanceRecords),
                    averageProgress,
                    trackedStudentMinutes: Math.round(trackedQuizMinutes),
                    trackedQuizMinutes: Math.round(trackedQuizMinutes),
                    attendanceLoginCaptures,
                    trackedTeacherEvents: teacherRows.reduce((sum, row) => sum + row.activityEvents, 0),
                    trackedStudentEvents: studentRows.reduce((sum, row) => sum + row.activityEvents, 0),
                    assignments: assignments.length,
                    submissions: submissions.length,
                    quizzes: quizzes.length,
                    quizAttempts: quizAttempts.length + chapterQuizAttempts.length,
                    projects: projects.length,
                    projectsWaitingReview: projects.filter(
                        (project) => project.status === "submitted" && project.teacherReview?.status === "not_reviewed"
                    ).length,
                    announcements: announcements.length,
                    aiMessages,
                    aiAverageDurationMs: aiUsage.length ? Math.round(aiDurationMs / aiUsage.length) : 0,
                },
                charts: {
                    activityTrend: [...activityTrend.values()].sort((a, b) => a.date.localeCompare(b.date)),
                    classUsage,
                    teacherWorkload: teacherRows
                        .map((teacher) => ({
                            name: teacher.name,
                            work: teacher.createdWork,
                            reviews: teacher.projectReviews,
                            attendance: teacher.attendanceSessions,
                        }))
                        .sort((a, b) => b.work - a.work)
                        .slice(0, 12),
                    batchEngagement: batchRows
                        .map((batch) => ({
                            name: batch.name,
                            assignments: batch.assignments,
                            submissions: batch.submissions,
                            quizzes: batch.quizzes,
                            quizAttempts: batch.quizAttempts,
                        }))
                        .slice(0, 12),
                    aiByFeature: [...aiByFeatureMap.entries()].map(([name, messages]) => ({ name, messages })),
                },
                teachers: teacherRows,
                students: studentRows,
                batches: batchRows,
                insights,
                notes: [
                    "Usage time is limited to tracked attendance/login activity currently available in the system.",
                    "Exact total LMS session duration will require a future heartbeat/session tracker.",
                ],
            },
        });
    } catch (error) {
        console.error("Error fetching school usage report:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching school usage report",
            error: error.message,
        });
    }
};

exports.getAdminOverview = async (req, res) => {
    try {
        const now = new Date();
        const monthStart = getStartOfMonth(now);
        const last30Days = new Date(now);
        last30Days.setDate(last30Days.getDate() - 30);

        const [
            schools,
            totalStudents,
            totalTeachers,
            totalBatches,
            totalCourses,
            totalQuestions,
            totalChapters,
            chaptersWithEbook,
            chaptersMissingAira,
            chaptersMissingEbook,
            chaptersMissingVideo,
            draftCourses,
            emptyBatches,
            schoolsWithoutAdmin,
            schoolsWithoutStudents,
            activeStudents,
            activeTeachers,
            aiTotals,
            aiByFeature,
            aiBySchool,
            recentActions,
        ] = await Promise.all([
            School.find()
                .populate("schoolAdmin", "name username")
                .select("name city state students teachers schoolAdmin createdAt")
                .lean(),
            Student.countDocuments(),
            Teacher.countDocuments(),
            Batch.countDocuments(),
            Course.countDocuments(),
            QuestionBase.countDocuments(),
            Chapter.countDocuments(),
            Chapter.countDocuments({ Ebook: { $exists: true, $nin: ["", null] } }),
            Chapter.find({
                Ebook: { $exists: true, $nin: ["", null] },
                $or: [
                    { pdfText: { $exists: false } },
                    { pdfText: { $in: ["", null] } },
                ],
            })
                .select("_id name course courseName Ebook")
                .limit(8)
                .lean(),
            Chapter.countDocuments({
                $or: [
                    { Ebook: { $exists: false } },
                    { Ebook: { $in: ["", null] } },
                ],
            }),
            Chapter.countDocuments({
                $or: [
                    { videoLessons: { $exists: false } },
                    { videoLessons: { $size: 0 } },
                ],
            }),
            Course.countDocuments({ published: false }),
            Batch.find({
                $or: [
                    { students: { $exists: false } },
                    { students: { $size: 0 } },
                    { teachers: { $exists: false } },
                    { teachers: { $size: 0 } },
                ],
            })
                .select("_id batchName students teachers courses status")
                .limit(8)
                .lean(),
            School.countDocuments({
                $or: [
                    { schoolAdmin: { $exists: false } },
                    { schoolAdmin: null },
                ],
            }),
            School.countDocuments({
                $or: [
                    { students: { $exists: false } },
                    { students: { $size: 0 } },
                ],
            }),
            UserActivity.distinct("userId", {
                userType: "STUDENT",
                createdAt: { $gte: last30Days },
            }),
            UserActivity.distinct("userId", {
                userType: "TEACHER",
                createdAt: { $gte: last30Days },
            }),
            AiApiUsage.aggregate([
                { $match: { createdAt: { $gte: monthStart, $lte: now } } },
                {
                    $group: {
                        _id: null,
                        calls: { $sum: "$messageCount" },
                        successful: { $sum: { $cond: ["$success", 1, 0] } },
                        failed: { $sum: { $cond: ["$success", 0, 1] } },
                    },
                },
            ]),
            AiApiUsage.aggregate([
                { $match: { createdAt: { $gte: monthStart, $lte: now } } },
                {
                    $group: {
                        _id: "$feature",
                        calls: { $sum: "$messageCount" },
                    },
                },
                { $sort: { calls: -1 } },
                { $limit: 6 },
            ]),
            AiApiUsage.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart, $lte: now },
                        school: { $ne: null },
                    },
                },
                {
                    $group: {
                        _id: "$school",
                        calls: { $sum: "$messageCount" },
                        failed: { $sum: { $cond: ["$success", 0, 1] } },
                    },
                },
                { $sort: { calls: -1 } },
                { $limit: 6 },
                {
                    $lookup: {
                        from: "schools",
                        localField: "_id",
                        foreignField: "_id",
                        as: "school",
                    },
                },
                { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        calls: 1,
                        failed: 1,
                        schoolName: "$school.name",
                    },
                },
            ]),
            SchoolAdminActivity.find()
                .sort({ createdAt: -1 })
                .limit(8)
                .populate("school", "name")
                .populate("schoolAdmin", "name")
                .lean(),
        ]);

        const monthlyLimit = Number(
            process.env.CHATPDF_MONTHLY_MESSAGE_LIMIT || 12000,
        );
        const usedCalls = Number(aiTotals[0]?.calls || 0);
        const usagePercent = monthlyLimit ? getPercent(usedCalls, monthlyLimit) : 0;
        const missingAiraChapterIds = chaptersMissingAira.map((chapter) => chapter._id);
        const missingAiraCourses = await Course.find({ chapters: { $in: missingAiraChapterIds } })
            .select("_id name chapters")
            .lean();
        const courseByChapterId = new Map();
        missingAiraCourses.forEach((course) => {
            (course.chapters || []).forEach((chapterId) => {
                courseByChapterId.set(String(chapterId), {
                    id: course._id,
                    name: course.name,
                });
            });
        });

        const schoolRows = schools
            .map((school) => ({
                id: school._id,
                name: school.name,
                city: school.city || "-",
                students: school.students?.length || 0,
                teachers: school.teachers?.length || 0,
                admin: school.schoolAdmin?.name || "Not assigned",
            }))
            .sort((a, b) => b.students + b.teachers - (a.students + a.teachers))
            .slice(0, 8);

        const onboarding = {
            schoolsCreated: schools.length,
            adminsAssigned: schools.length - schoolsWithoutAdmin,
            teachersAdded: schools.filter((school) => school.teachers?.length).length,
            studentsAdded: schools.filter((school) => school.students?.length).length,
            activeSchools: schools.filter(
                (school) => school.teachers?.length && school.students?.length,
            ).length,
        };

        res.status(200).json({
            success: true,
            generatedAt: now,
            totals: {
                schools: schools.length,
                students: totalStudents,
                teachers: totalTeachers,
                batches: totalBatches,
                courses: totalCourses,
                questions: totalQuestions,
                chapters: totalChapters,
            },
            contentHealth: {
                totalChapters,
                chaptersWithEbook,
                chaptersMissingEbook,
                chaptersMissingAira: chaptersMissingAira.length,
                chaptersMissingAiraList: chaptersMissingAira.map((chapter) => {
                    const parentCourse = courseByChapterId.get(String(chapter._id));
                    return {
                        _id: chapter._id,
                        name: chapter.name,
                        course: chapter.course || parentCourse?.id || "",
                        courseName: chapter.courseName || parentCourse?.name || "",
                        Ebook: chapter.Ebook,
                    };
                }),
                chaptersMissingVideo,
                draftCourses,
            },
            schoolActivity: {
                activeStudents30d: activeStudents.length,
                activeTeachers30d: activeTeachers.length,
                studentActivityPercent: getPercent(activeStudents.length, totalStudents),
                teacherActivityPercent: getPercent(activeTeachers.length, totalTeachers),
            },
            onboarding,
            aiUsage: {
                period: { start: monthStart, end: now },
                monthlyLimit,
                usedCalls,
                remainingCalls: Math.max(0, monthlyLimit - usedCalls),
                usagePercent,
                successful: Number(aiTotals[0]?.successful || 0),
                failed: Number(aiTotals[0]?.failed || 0),
                byFeature: aiByFeature,
                bySchool: aiBySchool,
            },
            riskAlerts: {
                schoolsWithoutAdmin,
                schoolsWithoutStudents,
                emptyBatches: emptyBatches.length,
                emptyBatchList: emptyBatches,
                draftCourses,
                chaptersMissingAira: chaptersMissingAira.length,
            },
            recentActions: recentActions.map((action) => ({
                id: action._id,
                createdAt: action.createdAt,
                action: action.action,
                targetName: action.targetName || action.targetType,
                details: action.details,
                school: action.school?.name || "",
                actor: action.schoolAdmin?.name || "School Admin",
            })),
            schoolRows,
        });
    } catch (error) {
        console.error("Error loading admin overview:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load admin overview",
            error: error.message,
        });
    }
};

// create admin user

exports.createAdmin = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
        name,
        username,
        password: hashedPassword,
    });

    try {
        await newAdmin.save();
        res.status(201).json({ message: "Admin created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating admin", error });
    }
};

// login admin

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Username and password are required" });
    }

    try {
        const admin = await Admin.findOne({ username });

        if (!admin) { 
            return res
                .status(401)
                .json({ message: "Invalid username or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, {
            expiresIn: "6h",
        });


        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
};

// create school

exports.createSchool = async (req, res) => {
    const { name, address, city, state, phoneNumber, zipCode } = req.body;
    const imageFile = req.file;
    try {

        let imageUrl = "";
        if (imageFile) {
            const result = await cloudinary.uploader.upload(imageFile.path);
            imageUrl = result.secure_url;
        }

        const newSchool = new School({
            name,
            address,
            city,
            state,
            phoneNumber,
            zipCode,
            imageUrl,

        });

        // Save the school
        await newSchool.save();

        res.status(201).json(newSchool);
    } catch (error) {
        console.error("Error creating school:", error);
        res.status(400).send({ message: error.message, details: error });
    }
};


//updating school details
exports.updateSchool = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, address, city, state, phoneNumber, zipCode } = req.body;
        const imageFile = req.file;

        if (!mongoose.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid School ID" });
        }

        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        // Upload new image if provided
        if (imageFile) {
            // 🔴 Delete old image
            if (school.imageUrl) {
                const publicId = school.imageUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }

            // 🟢 Upload new image
            const result = await cloudinary.uploader.upload(imageFile.path);
            school.imageUrl = result.secure_url;
        }

        // Update fields
        if (name !== undefined) school.name = name;
        if (address !== undefined) school.address = address;
        if (city !== undefined) school.city = city;
        if (state !== undefined) school.state = state;
        if (phoneNumber !== undefined) school.phoneNumber = phoneNumber;
        if (zipCode !== undefined) school.zipCode = zipCode;

        await school.save();

        res.status(200).json({
            success: true,
            message: "School updated successfully",
            school
        });

    } catch (error) {
        console.error("Error updating school:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

exports.getSchoolById = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        res.status(200).json(school);
    } catch (error) {
        console.error("Error fetching school:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


exports.getAllSchoolAdmin = async (req, res) => {
    try {
        const schoolAdmins = await SchoolAdmin.find();
        res.json(schoolAdmins);
    } catch (error) {
        console.error("Error fetching school admins", error);
        res.status(500).json({ message: "Server Error", error });
    }
};


//creating school admin
exports.createSchoolAdmin = async (req, res) => {
    const { name, username, password, schoolId } = req.body;

    if (!name || !username || !password || !schoolId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        const newSchoolAdmin = new SchoolAdmin({
            name,
            username,
            password: hashedPassword,
            school: school._id,
        });

        await newSchoolAdmin.save();

        school.schoolAdmin = newSchoolAdmin._id;
        await school.save();

        await logSchoolAdminActivity(req, {
            action: "Teachers created",
            targetType: "teacher",
            targetName: `${createdTeachers.length} teacher(s)`,
            details: `Created ${createdTeachers.length} teacher account(s)`,
        });

        res.status(201).json({
            newSchoolAdmin,
            message: "School admin created and assigned to school successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating school admin", error });
    }
};

exports.deleteSchool = async (req, res) => {
    try {
        const { schoolId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid School ID" });
        }

        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        await Student.deleteMany({ school: schoolId });
        await Teacher.deleteMany({ school: schoolId });
        await SchoolAdmin.deleteMany({ school: schoolId });

        await School.findByIdAndDelete(schoolId);

        await logSchoolAdminActivity(req, {
            action: "Batch assignment updated",
            targetType: "batch",
            targetId: batch._id,
            targetName: batch.batchName,
            details: `Assigned ${newStudentIds.length} student(s) and ${(teacherIdsToUpdate || []).length} teacher(s)`,
        });

        res.status(200).json({
            success: true,
            message: "School deleted successfully",
        });
    } catch (error) {
        console.error("Delete school error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createStudent = async (req, res) => {
    try {


        const { students } = req.body;
        const createdStudents = [];

        for (const studentData of Array.isArray(students)
            ? students
            : [students]) {
            const {
                name,
                username,
                password,
                age,
                contact,
                fatherName,
                address,
                schoolId,
                studentClass,
                section,
                batchId
            } = studentData;

            if (
                !name ||
                !username ||
                !password ||
                !age ||
                !contact ||
                !fatherName ||
                !address ||
                !schoolId ||
                !studentClass ||
                !section
            ) {
                return res.status(400).json({
                    message: "All fields are required for each student",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const school = await School.findById(schoolId);

            if (!school) {
                return res
                    .status(404)
                    .json({ message: `School not found for student ${name}` });
            }

            const newStudent = new Student({
                name,
                username,
                password: hashedPassword,
                age,
                contact,
                fatherName,
                address,
                school: school._id,
                class: studentClass,
                section,
                batches: batchId
            });

            await newStudent.save();

            school.students.push(newStudent._id);
            await school.save();

            createdStudents.push(newStudent);

            if (Array.isArray(batchId)) {
                for (const id of batchId) {
                    await Batch.findByIdAndUpdate(id, {
                        $addToSet: { students: newStudent._id },
                    });
                }
            }

        }
        await logSchoolAdminActivity(req, {
            action: "Students created",
            targetType: "student",
            targetName: `${createdStudents.length} student(s)`,
            details: `Created ${createdStudents.length} student account(s)`,
        });
        res.status(201).json({
            success: true,
            newStudents: createdStudents,
            message: `${createdStudents.length} student(s) created and assigned to school successfully`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating student(s)",
            error: error.message,
        });
    }
};


//creating a teacher within a school    
exports.createTeacher = async (req, res) => {
    const { teachers } = req.body; // teachers is an array of teacher objects

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
        return res.status(400).json({
            message: "Teachers array is required and should not be empty",
        });
    }

    try {
        const schoolIdSet = new Set(
            teachers.map((teacher) => teacher.schoolId)
        );
        const schoolIds = Array.from(schoolIdSet);

        const schools = await School.find({ _id: { $in: schoolIds } });

        if (schools.length !== schoolIds.length) {
            return res
                .status(404)
                .json({ message: "Some schools were not found" });
        }

        const createdTeachers = [];
        const errors = [];

        for (const teacher of teachers) {
            const { name, username, password, schoolId, batchId } = teacher;

            if (!name || !username || !password || !schoolId) {
                errors.push(`Missing required fields for teacher: ${username}`);
                continue;
            }

            const existingTeacher = await Teacher.findOne({ username });

            if (existingTeacher) {
                errors.push(`Username '${username}' is already taken`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            //   const highestTeacher = await Teacher.findOne().sort({ teacherId: -1 });

            // // Determine the new batchId
            // const teacherId = highestTeacher ? highestTeacher.teacherId + 1 : 1;

            const newTeacher = new Teacher({
                name,
                username,
                password: hashedPassword,
                school: schoolId,
                batches: batchId
            });

            await newTeacher.save();

            // send email
            await sendTeacherCredentials(username, username, password, name);

            const school = schools.find((s) => s._id.toString() === schoolId);
            school.teachers.push(newTeacher._id);
            await school.save();


            createdTeachers.push({
                _id: newTeacher._id,
                name: newTeacher.name,
                username: newTeacher.username,
                school: newTeacher.school,
                batches: newTeacher.batches
            });

            if (Array.isArray(batchId)) {
                for (const id of batchId) {
                    // await Batch.findByIdAndUpdate(id, {
                    //     $addToSet: { teachers: newTeacher._id },
                    // });
                    await Batch.findByIdAndUpdate(id, {
                        $addToSet: {
                            teachers: {
                                teacher: newTeacher._id,
                                role: "SECONDARY", // default
                            },
                        },
                    });

                }
            }
        }

        res.status(201).json({
            success: true,
            message: "teacher created successfully",
            createdCount: createdTeachers.length,
            errors: errors.length > 0 ? errors : undefined,
            createdTeachers,
        });
    } catch (error) {
        console.error("Error creating teachers:", error);
        res.status(500).json({
            success: false,
            message: "Error creating teachers",
            error: error.message,
        });
    }
};

//update student deetails
exports.updateStudent = async (req, res) => {

    const studentId = req.params.id;
    const {
        name,
        contact,
        fatherName,
        username,
        studentClass,
        batchId,
        age,
        address,
        section,
        password,
    } = req.body;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const school = await School.findById(student.school);
        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        //  Update only if value is not undefined
        if (name !== undefined) student.name = name;
        if (fatherName !== undefined) student.fatherName = fatherName;
        if (age !== undefined) student.age = age;
        if (address !== undefined) student.address = address;
        if (section !== undefined) student.section = section;
        if (username !== undefined) student.username = username;
        if (contact !== undefined) student.contact = contact;
        if (studentClass !== undefined) student.class = studentClass;

        //Replace batchIds if new ones are provided
        if (batchId && Array.isArray(batchId)) {

            const validBatches = [];
            for (const id of batchId) {
                const batch = await Batch.findById(id);
                if (!batch) {
                    return res.status(404).json({ message: `Batch with ID ${id} not found` });
                }
                validBatches.push(batch._id);
            }

            student.batches = validBatches;
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            student.password = hashedPassword;
        }

        await student.save();

        // Remove student from all previous batches
        await Batch.updateMany(
            { students: student._id },
            { $pull: { students: student._id } }
        );

        // Add to new batches
        if (Array.isArray(batchId)) {
            for (const id of batchId) {
                await Batch.findByIdAndUpdate(id, {
                    $addToSet: { students: student._id },
                });
            }
        }

        await logSchoolAdminActivity(req, {
            action: "Batch assignment removed",
            targetType: "batch",
            targetId: batch._id,
            targetName: batch.batchName,
            details: `Removed ${studentIds.length} student(s) and ${teacherIds.length} teacher(s) from batch`,
        });

        res.status(200).json({
            success: true,
            student,
            message: "Student details updated successfully",
        });
    } catch (error) {
        console.error("Error updating student details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// get all schools
exports.getAllSchools = async (req, res) => {
    try {
        const schools = await School.find()
            .populate("schoolAdmin")
            .populate("teachers.teacher", "name username")
            .sort({ name: 1 });


        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: "Error fetching schools", error });
    }
};

//updating the teacher model
exports.updateTeacher = async (req, res) => {
    const teacherId = req.params.teacherId || req.params.id;

    const { name, username, password, batchId } = req.body;

    try {
        // Find the teacher by ID
        let teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        //update teacher details
        if (name !== undefined) teacher.name = name;
        if (username !== undefined) teacher.username = username;

        // update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            teacher.password = hashedPassword;
        }
        // replace batchIds if new ones are provided
        if (batchId !== undefined && batchId.length > 0) {
            if (!Array.isArray(batchId)) {
                return res.status(400).json({ message: "batchId must be an array" });
            }

            const validBatches = [];

            for (const id of batchId) {
                const batch = await Batch.findById(id);
                if (!batch) {
                    return res.status(404).json({ message: `Batch with ID ${id} not found` });
                }
                validBatches.push(batch._id);
            }

            // Remove teacher from old batches
            if (Array.isArray(teacher.batches)) {
                await Batch.updateMany(
                    { _id: { $in: teacher.batches } },
                    //{ $pull: { teachers: teacher._id } }
                    { $pull: { teachers: { teacher: teacher._id } } }

                );
            }

            // Add teacher to new batches
            await Batch.updateMany(
                { _id: { $in: validBatches } },
                //{ $addToSet: { teachers: teacher._id } }
                { $addToSet: { teachers: { teacher: teacher._id, role: "SECONDARY" } } }

            );

            // Update teacher.batches
            teacher.batches = validBatches;
        }
        await teacher.save();
        res.status(200).json({
            success: true,
            teacher,
            message: "Teacher updated successfully"
        });
    } catch (error) {
        console.error("Error updating teacher:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Get details of a single student
exports.getStudentById = async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await Student.findById(studentId).populate("school");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Get details of a single teacher
exports.getTeacherById = async (req, res) => {
    const { teacherId } = req.params;

    try {
        const teacher = await Teacher.findById(teacherId).populate("school");
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.status(200).json(teacher);
    } catch (error) {
        console.error("Error fetching teacher:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;


        const filter = {}
        const { school, ...otherQueries } = req.query

        // Dynamic filtering in backend instead filtering frontend
        Object.entries(otherQueries).forEach(([key, value]) => {
            if (!["page", "limit"].includes(key) && value) {
                filter[key] = { $regex: value, $options: "i" }
            }
        })

        // check school filtering 
        if (school) {
            const matchedSchool = await School.findOne({ name: { $regex: school, $options: "i" } })
            if (matchedSchool) {
                filter.school = matchedSchool._id;
            } else {
                // no School matched - so return empty result
                return res.status(200).json({
                    success: true,
                    data: [],
                    page: 1,
                    totalPages: 0,
                    totalStudents: 0,
                    count: 0
                })
            }
        }
        // fetch student ans  total count with the same filter
        const [students, total] = await Promise.all([
            Student.find(filter)
                .select('-password')
                .populate('school', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Student.countDocuments(filter)
        ]);
        // response 
        res.status(200).json({
            success: true,
            data: students,
            page,
            totalPages: Math.ceil(total / limit),
            totalStudents: total,
            count: students.length,
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getStudentGroups = async (req, res) => {
    try {
        const filter = {};
        const { school, class: studentClass, section, name, username } = req.query;

        if (school) {
            const matchedSchools = await School.find({
                name: { $regex: school, $options: "i" },
            }).select("_id");

            if (!matchedSchools.length) {
                return res.status(200).json({
                    success: true,
                    groups: [],
                    totalGroups: 0,
                    totalStudents: 0,
                });
            }

            filter.school = { $in: matchedSchools.map((item) => item._id) };
        }

        if (studentClass) filter.class = { $regex: studentClass, $options: "i" };
        if (section) filter.section = { $regex: section, $options: "i" };
        if (name) filter.name = { $regex: name, $options: "i" };
        if (username) filter.username = { $regex: username, $options: "i" };

        const groups = await Student.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        school: "$school",
                        class: "$class",
                        section: "$section",
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "schools",
                    localField: "_id.school",
                    foreignField: "_id",
                    as: "school",
                },
            },
            { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    schoolId: "$_id.school",
                    schoolName: { $ifNull: ["$school.name", "No school assigned"] },
                    class: "$_id.class",
                    section: "$_id.section",
                    count: 1,
                },
            },
            { $sort: { schoolName: 1, class: 1, section: 1 } },
        ]);

        const totalStudents = groups.reduce((sum, group) => sum + group.count, 0);

        return res.status(200).json({
            success: true,
            groups,
            totalGroups: groups.length,
            totalStudents,
        });
    } catch (err) {
        console.error("Error fetching student groups:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getAllTeachers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 50
        const skip = (page - 1) * limit;


        const filter = {}
        const { school, ...otherQueries } = req.query

        // Dynamic filtering in backend instead filtering frontend
        Object.entries(otherQueries).forEach(([key, value]) => {
            if (!["page", "limit"].includes(key) && value) {
                filter[key] = { $regex: value, $options: "i" }
            }
        })

        // check school filtering 
        if (school) {
            const matchedSchool = await School.findOne({ name: { $regex: school, $options: "i" } })
            if (matchedSchool) {
                filter.school = matchedSchool._id;
            } else {
                // no School matched - so return empty result
                return res.status(200).json({
                    success: true,
                    data: [],
                    page: 1,
                    totalPages: 0,
                    totalTeachers: 0,
                    count: 0
                })
            }
        }

        const [teachers, total] = await Promise.all([
            Teacher.find(filter)
                .select("-password")
                .populate('school', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Teacher.countDocuments(filter)
        ])
        res.status(200).json({
            success: true,
            data: teachers,
            page,
            totalPages: Math.ceil(total / limit),
            totalTeachers: total,
            count: teachers.length,
        });
    } catch (err) {
        console.error("Error fetching teachers:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getTeacherGroups = async (req, res) => {
    try {
        const filter = {};
        const { school, name, username } = req.query;

        if (school) {
            const matchedSchools = await School.find({
                name: { $regex: school, $options: "i" },
            }).select("_id");

            if (!matchedSchools.length) {
                return res.status(200).json({
                    success: true,
                    groups: [],
                    totalGroups: 0,
                    totalTeachers: 0,
                });
            }

            filter.school = { $in: matchedSchools.map((item) => item._id) };
        }

        if (name) filter.name = { $regex: name, $options: "i" };
        if (username) filter.username = { $regex: username, $options: "i" };

        const groups = await Teacher.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$school",
                    count: { $sum: 1 },
                    totalBatches: {
                        $sum: { $size: { $ifNull: ["$batches", []] } },
                    },
                },
            },
            {
                $lookup: {
                    from: "schools",
                    localField: "_id",
                    foreignField: "_id",
                    as: "school",
                },
            },
            { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    schoolId: "$_id",
                    schoolName: { $ifNull: ["$school.name", "No school assigned"] },
                    count: 1,
                    totalBatches: 1,
                },
            },
            { $sort: { schoolName: 1 } },
        ]);

        const totalTeachers = groups.reduce((sum, group) => sum + group.count, 0);

        return res.status(200).json({
            success: true,
            groups,
            totalGroups: groups.length,
            totalTeachers,
        });
    } catch (err) {
        console.error("Error fetching teacher groups:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

//creating a batch
// exports.createBatch = async (req, res) => {
//     const { batchName, academicYear } = req.body;
//     const imageFile = req.file;

//     try {

// if (imageFile) {
//   let uploadResult;
//   try {
//     uploadResult = await cloudinary.uploader.upload(imageFile.path);
//     imageUrl = uploadResult.secure_url;
//     uploadedPublicId = uploadResult.public_id;
//   } finally {
//     // Always delete temp file, whether upload succeeded or failed
//     await fs.unlink(imageFile.path).catch((unlinkErr) => {
//       console.error("Failed to delete temp file:", imageFile.path, unlinkErr);
//     });
//   }

//         // Find the batch with the highest batchId
//         const highestBatch = await Batch.findOne().sort({ batchId: -1 });

//         // Determine the new batchId
//         const batchId = highestBatch ? highestBatch.batchId + 1 : 1;

//         // Create a new batch with an empty quizzes array
//         const newBatch = new Batch({
//             batchId,
//             batchName,
//             academicYear: academicYear || null,
//             imageUrl,
//             students: [],
//             teachers: [],
//             quizzes: [], // Initialize the quizzes array as empty
//         });

//         // Save the batch to the database
//         await newBatch.save();

//         // Respond with the created batch
//         res.status(201).json(newBatch);
//     } catch (err) {
//         console.error("Error creating batch:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// };


exports.createBatch = async (req, res) => {

    const { batchName, academicYear } = req.body;
    const imageFile = req.file;

    let uploadedPublicId = null;
    let imageUrl = "";

    try {
        // 1. Upload image first, track public_id for rollback
        if (imageFile) {
            let uploadResult;
            try {
                uploadResult = await cloudinary.uploader.upload(imageFile.path);
                imageUrl = uploadResult.secure_url;
                uploadedPublicId = uploadResult.public_id;
            } finally {
                // Always delete temp file, whether upload succeeded or failed
                await fs.unlink(imageFile.path).catch((unlinkErr) => {
                    console.error("Failed to delete temp file:", imageFile.path, unlinkErr);
                });
            }
        }

        // 2. Atomic ID generation — no race condition
        const counter = await Counter.findOneAndUpdate(
            { _id: "batchId" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        // 3. Create and save batch
        const newBatch = new Batch({
            batchId: counter.seq,
            batchName: batchName.trim(),
            academicYear: academicYear || null,
            imageUrl,
            imagePublicId: uploadedPublicId || null,
        });

        await newBatch.save();

        return res.status(201).json(newBatch);

    } catch (err) {
        // 4. Rollback Cloudinary upload if DB save failed
        if (uploadedPublicId) {
            await cloudinary.uploader.destroy(uploadedPublicId).catch((destroyErr) => {
                console.error("Cloudinary rollback failed:", uploadedPublicId, destroyErr);
            });
        }

        console.error("Error creating batch:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

//updating batch details
exports.updateBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { batchName, academicYear } = req.body;
        const imageFile = req.file;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ message: "Invalid Batch ID" });
        }

        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        //  IMAGE HANDLING
        if (imageFile) {
            //  Delete old image from cloudinary
            if (batch.imageUrl) {
                try {
                    const publicId = getPublicIdFromUrl(batch.imageUrl);

                    if (publicId) {
                        const result = await cloudinary.uploader.destroy(publicId);
                        // console.log(
                        //     `Cloudinary cleanup for batch ${batchId}:`,
                        //     result
                        // );
                    }
                } catch (cloudinaryError) {
                    console.error(
                        `Cloudinary cleanup failed for batch ${batchId}:`,
                        cloudinaryError
                    );
                }
            }

            //  Upload new image
            const result = await cloudinary.uploader.upload(imageFile.path);
            batch.imageUrl = result.secure_url;
            batch.imagePublicId = result.public_id;
        }

        // ✅ Update fields
        if (batchName !== undefined) batch.batchName = batchName;
        if (academicYear !== undefined) batch.academicYear = academicYear;

        await batch.save();

        res.status(200).json({
            success: true,
            message: "Batch updated successfully",
            batch
        });

    } catch (error) {
        console.error("Error updating batch:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// get batch by id
exports.getBatchById = async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ error: "Invalid batch ID" });
        }

        const batch = await Batch.findById(batchId)
            .populate({
                path: "students",
                populate: {
                    path: "school",
                    select: "name"
                }
            })
            .populate({
                path: "teachers.teacher",
                populate: {
                    path: "school",
                    select: "name"
                }
            })
            .populate("courses")
            .populate("quizzes");

        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        res.status(200).json(batch);

    } catch (error) {
        console.error("Error fetching batch:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Batch ID",
            });
        }

        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found",
            });
        }

        // Remove batch reference from students
        await Student.updateMany(
            { batches: batchId },
            { $pull: { batches: batchId } }
        );

        // Remove batch reference from teachers
        await Teacher.updateMany(
            { batches: batchId },
            { $pull: { batches: batchId } }
        );

        // Delete batch
        await Batch.findByIdAndDelete(batchId);

        // Delete Cloudinary image (if exists)
        if (batch.imageUrl) {
            try {
                const publicId = getPublicIdFromUrl(batch.imageUrl);

                if (publicId) {
                    const result = await cloudinary.uploader.destroy(publicId);
                    // console.log(
                    //     `Cloudinary cleanup for batch ${batchId}:`,
                    //     result
                    // );
                }
            } catch (cloudinaryError) {
                console.error(
                    `Cloudinary cleanup failed for batch ${batchId}:`,
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Batch deleted successfully",
        });
    } catch (error) {
        console.error("Delete batch error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Helper Function
function getPublicIdFromUrl(url) {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
    const match = url.match(regex);

    return match ? match[1] : null;
}


exports.assignStudentsAndTeachersToBatch = async (req, res) => {
    try {
        const { batchId, studentIds = [], teacherIds = [], teachers } = req.body;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ error: "Invalid batchId" });
        }

        const batch = await Batch.findById(batchId).populate("courses");
        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        /* ---------------- STUDENTS ---------------- */

        const validStudentIds = studentIds.filter(id =>
            mongoose.Types.ObjectId.isValid(id)
        );

        const students = await Student.find({ _id: { $in: validStudentIds } });
        if (students.length !== validStudentIds.length) {
            return res.status(400).json({ error: "Some studentIds are invalid" });
        }

        const newStudentIds = students
            .filter(s => !batch.students.includes(s._id))
            .map(s => s._id);

        batch.students.push(...newStudentIds);

        /* ---------------- TEACHERS ---------------- */

        // 🔹 New UI (explicit roles)
        if (Array.isArray(teachers) && teachers.length > 0) {
            // Check existing PRIMARY teacher in batch
            const existingPrimary = batch.teachers.find(t => t.role === "PRIMARY");

            // Count PRIMARY in new request
            const newPrimaryCount = teachers.filter(t => t.role === "PRIMARY").length;

            // If batch already has PRIMARY and request tries to add another
            if (existingPrimary && newPrimaryCount > 0) {
                return res.status(400).json({
                    error: "Batch already has a PRIMARY teacher. Change primary teacher instead."
                });
            }

            // If batch has no PRIMARY yet
            if (!existingPrimary && newPrimaryCount !== 1) {
                return res.status(400).json({
                    error: "Exactly one PRIMARY teacher is required"
                });
            }

            const teacherIdsFromPayload = teachers.map(t => t.teacherId);
            const validTeacherIds = teacherIdsFromPayload.filter(id =>
                mongoose.Types.ObjectId.isValid(id)
            );

            const teacherDocs = await Teacher.find({ _id: { $in: validTeacherIds } });
            if (teacherDocs.length !== validTeacherIds.length) {
                return res.status(400).json({ error: "Some teacherIds are invalid" });
            }

            teachers.forEach(t => {
                const exists = batch.teachers.find(
                    bt => bt.teacher.toString() === t.teacherId
                );

                if (!exists) {
                    batch.teachers.push({
                        teacher: t.teacherId,
                        role: t.role
                    });
                }
            });
        }

        // 🔹 Old UI (teacherIds only)
        else if (teacherIds.length > 0) {
            const validTeacherIds = teacherIds.filter(id =>
                mongoose.Types.ObjectId.isValid(id)
            );

            const teacherDocs = await Teacher.find({ _id: { $in: validTeacherIds } });
            if (teacherDocs.length !== validTeacherIds.length) {
                return res.status(400).json({ error: "Some teacherIds are invalid" });
            }

            validTeacherIds.forEach(tid => {
                if (!batch.teachers.some(t => t.teacher.equals(tid))) {
                    batch.teachers.push({
                        teacher: tid,
                        role: batch.teachers.length === 0 ? "PRIMARY" : "SECONDARY"
                    });
                }
            });
        }

        await batch.save();

        /* ---------------- SYNC REFERENCES ---------------- */

        if (newStudentIds.length > 0) {
            await Student.updateMany(
                { _id: { $in: newStudentIds } },
                {
                    $addToSet: {
                        batches: batch._id,
                        courses: {
                            $each: batch.courses.map(c => c._id)
                        }
                    }
                }
            );
        }

        const teacherIdsToUpdate =
            teachers?.map(t => t.teacherId) || teacherIds;

        if (teacherIdsToUpdate.length > 0) {
            await Teacher.updateMany(
                { _id: { $in: teacherIdsToUpdate } },
                { $addToSet: { batches: batch._id } }
            );
        }

        res.status(200).json({
            message: "Students and teachers assigned successfully",
            batch,
            newlyAssignedStudents: newStudentIds
        });

    } catch (err) {
        console.error("Assign error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

//deassign batches from students and teachers
exports.deassignStudentsAndTeachersFromBatch = async (req, res) => {
    try {
        const { batchId, studentIds = [], teacherIds = [] } = req.body;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ error: "Invalid batchId" });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        //  Handle primary teacher
        const primaryTeacher = batch.teachers.find(t => t.role === "PRIMARY");

        if (primaryTeacher && teacherIds.includes(primaryTeacher.teacher.toString())) {
            const remainingTeachers = batch.teachers.filter(
                t => !teacherIds.includes(t.teacher.toString())
            );

            if (remainingTeachers.length > 0) {
                const nextPrimary =
                    remainingTeachers.find(t => t.role === "SECONDARY") ||
                    remainingTeachers[0];

                nextPrimary.role = "PRIMARY";
            }
        }

        //  Remove teachers
        batch.teachers = batch.teachers.filter(
            t => !teacherIds.includes(t.teacher.toString())
        );

        //  Remove students
        batch.students = batch.students.filter(
            s => !studentIds.includes(s.toString())
        );

        await batch.save();

        //  Sync references
        await Promise.all([
            Student.updateMany(
                { _id: { $in: studentIds } },
                { $pull: { batches: batch._id } },

            ),
            Teacher.updateMany(
                { _id: { $in: teacherIds } },
                { $pull: { batches: batch._id } },
            ),
        ]);

        res.status(200).json({
            message: "Students and teachers deassigned successfully",
            batch,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};


exports.changePrimaryTeacher = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { teacherId } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(batchId) ||
            !mongoose.Types.ObjectId.isValid(teacherId)
        ) {
            return res.status(400).json({ error: "Invalid IDs" });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        let found = false;

        batch.teachers.forEach(t => {
            if (t.teacher.toString() === teacherId) {
                t.role = "PRIMARY";
                found = true;
            } else {
                t.role = "SECONDARY";
            }
        });

        if (!found) {
            return res.status(400).json({
                error: "Teacher is not assigned to this batch"
            });
        }

        await batch.save();

        res.status(200).json({
            success: true,
            message: "Primary teacher updated successfully",
            batch
        });

    } catch (err) {
        console.error("Change primary error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

//assign courses to batch and same goes for student
exports.assignCoursesToBatchAndStudents = async (req, res) => {
    try {
        const { batchId, courseIds } = req.body;

        // Validate batchId
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ error: "Invalid batchId" });
        }

        // Find batch by ID
        const batch = await Batch.findById(batchId).populate("courses");

        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        // Validate courseIds
        const validCourseIds = courseIds.filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
        );

        // Find courses by IDs
        const courses = await Course.find({ _id: { $in: validCourseIds } });

        if (courses.length !== validCourseIds.length) {
            return res
                .status(400)
                .json({ error: "Some courseIds are invalid" });
        }

        // Filter out courses already in the batch
        const newCourses = courses.filter(
            (course) =>
                !batch.courses.some((existingCourse) =>
                    existingCourse._id.equals(course._id)
                )
        );

        // Add new courses to batch
        batch.courses.push(...newCourses.map((course) => course._id));
        await batch.save();

        // Assign new courses to all students in the batch
        if (newCourses.length > 0) {
            await Student.updateMany(
                { batches: batch._id },
                {
                    $addToSet: {
                        courses: {
                            $each: newCourses.map((course) => course._id),
                        },
                    },
                }
            );
        }
        res.status(200).json({
            message: "Courses assigned to batch and students successfully",
            batch,
            newlyAssignedCourses: newCourses.map((course) => course._id),
        });
    } catch (err) {
        console.error("Error assigning courses to batch and students:", err);
        res.status(500).json({ error: "Server error" });
    }
};

//deassign courses from batches and students
exports.deassignCoursesFromBatchAndStudents = async (req, res) => {
    try {
        const { batchId, courseIds } = req.body;

        // Validate batchId
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ error: "Invalid batchId" });
        }

        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        const validCourseIds = courseIds.filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
        );

        // Find courses by IDs
        const courses = await Course.find({ _id: { $in: validCourseIds } });

        if (courses.length !== validCourseIds.length) {
            return res
                .status(400)
                .json({ error: "Some courseIds are invalid" });
        }

        // Remove courses from batch
        batch.courses = batch.courses.filter(
            (courseId) => !validCourseIds.includes(courseId.toString())
        );
        await batch.save();

        // Remove courses from all students in the batch
        const students = await Student.find({ batches: batch._id });

        for (const student of students) {
            student.courses = student.courses.filter(
                (courseId) => !validCourseIds.includes(courseId.toString())
            );
            await student.save();
        }

        res.status(200).json({
            message: "Courses deassigned from batch and students successfully",
            batch,
            students,
        });
    } catch (err) {
        console.error(
            "Error deassigning courses from batch and students:",
            err
        );
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAllBatches = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const query = {
            batchName: { $regex: search, $options: "i" }
        };

        const batches = await Batch.find(query)
            .select("_id batchName")
            .sort({ batchName: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Batch.countDocuments(query);

        res.status(200).json({
            data: batches,
            hasMore: skip + batches.length < total
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllBatchesWithFillterAndPagination = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 50;
        const skip = (page - 1) * limit;

        // Search query (for search bar)
        const searchQuery = req.query.q?.trim() || req.query.search?.trim() || '';

        // Build filter object
        const filter = {};

        // If search query exists, create search conditions
        if (searchQuery) {
            filter.$or = [
                { batchName: { $regex: searchQuery, $options: "i" } },
                { description: { $regex: searchQuery, $options: "i" } },
                { instructor: { $regex: searchQuery, $options: "i" } },
                // Add other fields you want to search in
            ];
        }

        // Additional filters (can work alongside search)
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.instructor) {
            filter.instructor = { $regex: req.query.instructor, $options: "i" };
        }

        // Date range filter
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                filter.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.createdAt.$lte = new Date(req.query.endDate);
            }
        }

        // Legacy batchName filter (for backward compatibility)
        if (req.query.batchName && !searchQuery) {
            if (Array.isArray(req.query.batchName)) {
                filter.$or = req.query.batchName.map((name) => ({
                    batchName: { $regex: name, $options: "i" }
                }));
            } else {
                filter.batchName = { $regex: req.query.batchName, $options: "i" };
            }
        }

        // Sorting
        const sortField = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        // Fetch batches and count in parallel
        const [batches, total] = await Promise.all([
            Batch.find(filter)
                .select('-__v') // Exclude version key
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for better performance
            Batch.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: batches,
            pagination: {
                page,
                limit,
                totalPages,
                totalBatches: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            count: batches.length,
            filters: {
                search: searchQuery || null,
                status: req.query.status || null,
                instructor: req.query.instructor || null
            }
        });
    } catch (error) {
        console.error("Error fetching batches:", error);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

};

//delete multiple students 
exports.deleteMultipleStudents = async (req, res) => {

    try {
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty studentIds array' });
        }

        // Find the students to be deleted
        const studentsToDelete = await Student.find({ _id: { $in: studentIds } });

        if (studentsToDelete.length !== studentIds.length) {
            throw new Error('One or more student IDs are invalid');
        }

        // Collect unique school and batch IDs
        const schoolIds = [...new Set(studentsToDelete.map(student => student.school.toString()))];
        const batchIds = [...new Set(studentsToDelete.flatMap(student => student.batches.map(batch => batch.toString())))];

        // Remove students from schools
        await School.updateMany(
            { _id: { $in: schoolIds } },
            { $pull: { students: { $in: studentIds } } },

        );

        // Remove students from batches
        await Batch.updateMany(
            { _id: { $in: batchIds } },
            { $pull: { students: { $in: studentIds } } },
        );

        // Delete the students
        await Student.deleteMany({ _id: { $in: studentIds } });



        res.status(200).json({ message: `Successfully deleted ${studentsToDelete.length} students` });
    } catch (error) {

        console.error('Error in deleteMultipleStudents:', error);
        res.status(500).json({ message: 'An error occurred while deleting students', error: error.message });
    }
};

// delete multiple teachers
exports.deleteMultipleTeachers = async (req, res) => {
    try {
        const { teacherIds } = req.body;

        if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty teacherIds array' });
        }

        // Find teachers
        const teachersToDelete = await Teacher.find({ _id: { $in: teacherIds } });

        if (teachersToDelete.length !== teacherIds.length) {
            return res.status(400).json({ message: 'One or more teacher IDs are invalid' });
        }

        // Collect unique school and batch IDs
        const schoolIds = [...new Set(teachersToDelete.map(t => t.school.toString()))];
        const batchIds = [...new Set(teachersToDelete.flatMap(t => t.batches.map(b => b.toString())))];

        // Remove teachers from schools
        await School.updateMany(
            { _id: { $in: schoolIds } },
            { $pull: { teachers: { $in: teacherIds } } }
        );

        // Remove teachers from batches
        await Batch.updateMany(
            { _id: { $in: batchIds } },
            { $pull: { teachers: { $in: teacherIds } } }
        );

        // Delete the teachers
        await Teacher.deleteMany({ _id: { $in: teacherIds } });

        res.status(200).json({ message: `Successfully deleted ${teachersToDelete.length} teacher(s)` });
    } catch (error) {
        console.error('Error in deleteMultipleTeachers:', error);
        res.status(500).json({ message: 'An error occurred while deleting teachers', error: error.message });
    }
};


// this function is used for managing progress in admin side for getting all lessons within a chapter

exports.getChapterLessons = async (req, res) => {
    try {
        const { chapterId } = req.params;

        // Find the chapter and populate the lessons array with slides
        const chapter = await Chapter.findById(chapterId)
            .populate({
                path: 'lessons',
                model: 'Lesson',
                select: 'lessonName lessonExpectedtime', // Include fields you want
            });

        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Chapter not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: chapter.lessons
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving chapter lessons',
            error: error.message
        });
    }
};


// this function is used to get all video in admin side for managing progress within a chapter
exports.getChapterVideos = async (req, res) => {
    try {
        const { chapterId } = req.params;

        // Find the chapter and populate the videoLessons array
        const chapter = await Chapter.findById(chapterId)
            .populate({
                path: 'videoLessons',
                model: 'VideoContent',
                select: 'videoTitle videoUrl expectedTime', // Include fields you want
            });

        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Chapter not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: chapter.videoLessons
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving chapter videos',
            error: error.message
        });
    }
};

// get all lesson slides for a particular lesson 
exports.getLessonSlides = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Find the lesson and select the slides array
        const lesson = await Lesson.findById(lessonId)
            .select('lessonName lessonExpectedtime slides')
            .populate([
                {
                    path: 'slides.selectedQuestion',
                    model: 'QuestionBase'
                },
                {
                    path: 'slides.quizId',
                    model: 'QuizV2Final'
                }
            ]);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                lessonName: lesson.lessonName,
                lessonExpectedtime: lesson.lessonExpectedtime,
                slides: lesson.slides
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving lesson slides',
            error: error.message
        });
    }
};

// get all courses that are assigned to a batch

exports.getBatchCourses = async (req, res) => {
    try {
        const { batchId } = req.params;  // This will be the MongoDB _id

        // Changed from findOne({batchId}) to findById()
        const batch = await Batch.findById(batchId)
            .populate({
                path: 'courses',
                model: 'Course',
                select: 'courseId name description courseExpectedtime'
            });

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // If batch exists but has no courses
        if (!batch.courses || batch.courses.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No courses found in this batch',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                batchName: batch.batchName,
                courses: batch.courses
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving batch courses',
            error: error.message
        });
    }

};

// get list of chapters within a course
exports.getCourseChapters = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find course by MongoDB _id and populate specific chapter fields
        const course = await Course.findById(courseId)
            .populate({
                path: 'chapters',
                model: 'Chapter',

            });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // If course exists but has no chapters
        if (!course.chapters || course.chapters.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No chapters found in this course',
                data: {
                    courseName: course.name,
                    chapters: []
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                courseName: course.name,
                chapters: course.chapters
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving course chapters',
            error: error.message
        });
    }
};

// updating ebook expected time
exports.updateEbookExpectedTime = async (req, res) => {
    const { chapterId, EbookExpectedtime } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not provided." });
    }

    if (typeof EbookExpectedtime !== "number" || EbookExpectedtime < 0) {
        return res.status(400).json({ error: "Valid EbookExpectedtime must be provided." });
    }

    try {
        // Fetch the chapter by ID
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter) {
            return res.status(404).json({ error: "No chapter found with the provided chapter ID." });
        }

        // Store the old EbookExpectedtime
        const oldEbookExpectedtime = existingChapter.EbookExpectedtime || 0;

        // Calculate the difference in expected time
        const timeDifference = EbookExpectedtime - oldEbookExpectedtime;

        // Update the chapter's EbookExpectedtime
        existingChapter.EbookExpectedtime = EbookExpectedtime;
        await existingChapter.save();

        // Update courseExpectedtime if the chapter belongs to a course
        if (existingChapter.course) {
            await Course.findByIdAndUpdate(
                existingChapter.course,
                {
                    $inc: { courseExpectedtime: timeDifference },
                }
            );
        }

        res.status(200).json({
            success: true,
            message: "Ebook expected time updated successfully.",
            chapter: existingChapter,
        });

    } catch (error) {
        console.error("Error updating Ebook expected time:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// time management for student side controllers
exports.updateTimeInterval = async (req, res) => {
    try {
        const { timeInterval } = req.body;

        if (!timeInterval || timeInterval < 5) {
            return res.status(400).json({
                success: false,
                message: 'Time interval must be at least 5 seconds'
            });
        }

        // Using findOneAndUpdate with upsert: true to create if doesn't exist
        const updatedSettings = await TimeSetting.findOneAndUpdate(
            {}, // empty filter to match any document
            {
                timeInterval,
                updatedAt: Date.now()
            },
            {
                new: true, // return updated document
                upsert: true // create if doesn't exist
            }
        );

        res.json({
            success: true,
            data: updatedSettings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating time interval',
            error: error.message
        });
    }
}

exports.getTimeInterval = async (req, res) => {
    try {
        const timeSettings = await TimeSetting.findOne();

        // If no settings exist, return default value of 5
        if (!timeSettings) {
            return res.json({
                success: true,
                data: {
                    timeInterval: 5
                }
            });
        }

        res.json({
            success: true,
            data: timeSettings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching time interval',
            error: error.message
        });
    }
}

exports.updateAdminData = async (req, res) => {
    try {
        const { name, username, password } = req.body

        const admin = await Admin.findOne({ username })
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            })
        }

        admin.name = name || admin.name
        admin.username = username || admin.username

        if (password) {
            admin.password = await bcrypt.hash(password, 10)
        }
        await admin.save()
        res.status(200).json({
            success: true,
            message: "Admin data updated successfully",
            data: admin
        })


    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating admin data",
            error: error.message
        })
    }
}
