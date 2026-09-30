const mongoose = require("mongoose");
const SchoolAdmin = require("../models/SchoolAdmin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const School = require("../models/School");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Quiz = require("../models/Quiz");
const AttemptQuiz = require("../models/AttepmtQuiz");
const ChapterQuizAttempt = require("../models/ChapterwiseQuizAttempt");
const Announcement = require("../models/Announcement");
const PracticeProject = require("../models/PracticeProject");
const StudentCourseProgress = require("../models/studentCourseProgress");
const SchoolAdminActivity = require("../models/SchoolAdminActivity");
const StudentTransfer = require("../models/StudentTransfer");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const toId = (value) => String(value?._id || value || "");
const round = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 10) / 10;
const percent = (part, total) => (total > 0 ? round((part / total) * 100) : 0);
const inc = (map, key, amount = 1) => {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + amount);
};

const logSchoolAdminActivity = async (req, payload) => {
    try {
        const admin = req.schoolAdmin;
        if (!admin?._id || !admin?.school) return;
        await SchoolAdminActivity.create({
            schoolAdmin: admin._id,
            school: admin.school,
            ...payload,
        });
    } catch (error) {
        console.error("School admin activity log failed:", error.message);
    }
};




// create schoolAdmin 
exports.createSchoolAdmins = async (req, res) => {
    try {
        const { name, username, password, schoolId, batchIds } = req.body;

        // validation
        if (!name || !username || !password || !schoolId || !batchIds) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const SchoolId = new mongoose.Types.ObjectId(schoolId);
        const schoolExists = await School.findById(SchoolId);
        if (!schoolExists) {
            return res.status(404).json({ error: "School not found" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newSchoolAdmin = new SchoolAdmin({
            name,
            username,
            password: hashedPassword,
            school: schoolExists._id,
            batches: batchIds.map((batchId) => new mongoose.Types.ObjectId(batchId)),
        });
        const savedSchoolAdmin = await newSchoolAdmin.save();
        res.status(201).json({
            success: true,
            message: "School admin created successfully",
            schoolAdmin: savedSchoolAdmin,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating school admin",
            error,
        });
    }
};

//login school admin
exports.loginSchoolAdmin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const schoolAdmin = await SchoolAdmin.findOne({ username });
        if (!schoolAdmin) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, schoolAdmin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: schoolAdmin._id }, JWT_SECRET, { expiresIn: '3h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });

    }
};

// logout school admin 
exports.logoutSchoolAdmin = (req, res) => {

}

//get info of logged in school admin
exports.getSchoolAdminInfo = async (req, res) => {
    try {

        const schoolAdmin = await SchoolAdmin.findById(req.schoolAdmin._id)
            .populate([
                {
                    path: 'batches',
                    populate: [
                        { path: 'courses' },
                        {
                            path: 'teachers',
                            populate: [
                                { path: 'teacher' },
                            ]
                        },
                        { path: 'students' },
                    ]
                },
                {
                    path: 'school',
                    populate: [
                        { path: 'students' },
                        { path: 'teachers' }
                    ]
                }
            ]).select('-password');
        if (!schoolAdmin) {
            return res.status(404).json({ message: 'School admin not found' });
        }

        res.json({
            success: true,
            message: 'School admin details retrieved successfully',
            schoolAdmin
        });
    } catch (error) {
        console.error('Error retrieving admin:', error);
        res.status(500).json({ message: 'Error retrieving admin details' });
    }
};

exports.getSchoolAdminAnalytics = async (req, res) => {
    try {
        const schoolAdmin = await SchoolAdmin.findById(req.schoolAdmin._id)
            .populate("school")
            .populate({
                path: "batches",
                populate: [
                    { path: "students", select: "-password" },
                    { path: "teachers.teacher", select: "-password" },
                    { path: "courses" },
                ],
            })
            .select("-password")
            .lean();

        if (!schoolAdmin) {
            return res.status(404).json({ success: false, message: "School admin not found" });
        }

        const schoolId = schoolAdmin.school?._id || schoolAdmin.school;
        const batchIds = (schoolAdmin.batches || []).map((batch) => batch._id);

        const [
            students,
            teachers,
            attendanceList,
            assignments,
            submissions,
            quizzes,
            quizAttempts,
            chapterQuizAttempts,
            announcements,
            projects,
            courseProgress,
        ] = await Promise.all([
            Student.find({ school: schoolId }).select("-password").lean(),
            Teacher.find({ school: schoolId }).select("-password").lean(),
            Attendance.find({ batchId: { $in: batchIds } }).lean(),
            Assignment.find({ batchId: { $in: batchIds } }).lean(),
            AssignmentSubmission.find({ batchId: { $in: batchIds } }).lean(),
            Quiz.find({
                $or: [
                    { assignedTo: { $in: batchIds } },
                    { createdBy: { $in: (schoolAdmin.school?.teachers || []).map(toId) } },
                ],
            }).lean(),
            AttemptQuiz.find({ studentId: { $in: (schoolAdmin.school?.students || []).map(toId) } }).lean(),
            ChapterQuizAttempt.find({ studentId: { $in: (schoolAdmin.school?.students || []).map(toId) } }).lean(),
            Announcement.find({
                $or: [
                    { batches: { $in: batchIds } },
                    { createdBy: { $in: (schoolAdmin.school?.teachers || []).map(toId) } },
                ],
            }).lean(),
            PracticeProject.find({ createdBy: { $in: (schoolAdmin.school?.students || []).map(toId) } }).lean(),
            StudentCourseProgress.find({ studentId: { $in: (schoolAdmin.school?.students || []).map(toId) } }).lean(),
        ]);

        const studentIds = students.map((student) => toId(student._id));
        const teacherIds = teachers.map((teacher) => toId(teacher._id));
        const teacherIdSet = new Set(teacherIds);
        const studentIdSet = new Set(studentIds);

        const studentAttendance = new Map();
        const batchAttendance = new Map();
        const attendanceByTeacher = new Map();

        attendanceList.forEach((attendance) => {
            const batchId = toId(attendance.batchId);
            const teacherId = toId(attendance.teacherId);
            if (teacherIdSet.has(teacherId)) inc(attendanceByTeacher, teacherId);

            const batchMetric = batchAttendance.get(batchId) || { present: 0, total: 0 };
            (attendance.records || []).forEach((record) => {
                const studentId = toId(record.studentId);
                const isPresent = ["present", "late"].includes(record.status);
                if (studentIdSet.has(studentId)) {
                    const metric = studentAttendance.get(studentId) || { present: 0, total: 0 };
                    metric.total += 1;
                    if (isPresent) metric.present += 1;
                    studentAttendance.set(studentId, metric);
                }
                batchMetric.total += 1;
                if (isPresent) batchMetric.present += 1;
            });
            batchAttendance.set(batchId, batchMetric);
        });

        const submissionsByStudent = new Map();
        const submissionsByBatch = new Map();
        submissions.forEach((submission) => {
            inc(submissionsByStudent, toId(submission.studentId));
            inc(submissionsByBatch, toId(submission.batchId));
        });

        const assignmentsByTeacher = new Map();
        const assignmentsByBatch = new Map();
        assignments.forEach((assignment) => {
            inc(assignmentsByTeacher, toId(assignment.teacherId));
            inc(assignmentsByBatch, toId(assignment.batchId));
        });

        const quizzesByTeacher = new Map();
        const quizzesByBatch = new Map();
        quizzes.forEach((quiz) => {
            inc(quizzesByTeacher, toId(quiz.createdBy));
            (quiz.assignedTo || []).forEach((batchId) => inc(quizzesByBatch, toId(batchId)));
        });

        const quizAttemptsByStudent = new Map();
        [...quizAttempts, ...chapterQuizAttempts].forEach((attempt) => {
            inc(quizAttemptsByStudent, toId(attempt.studentId));
        });

        const announcementsByTeacher = new Map();
        announcements.forEach((announcement) => inc(announcementsByTeacher, toId(announcement.createdBy)));

        const projectsByStudent = new Map();
        const reviewsByTeacher = new Map();
        projects.forEach((project) => {
            if (project.status === "submitted") inc(projectsByStudent, toId(project.createdBy));
            inc(reviewsByTeacher, toId(project.teacherReview?.reviewedBy));
        });

        const progressByStudent = new Map();
        courseProgress.forEach((progress) => {
            const studentId = toId(progress.studentId);
            const metric = progressByStudent.get(studentId) || { total: 0, count: 0 };
            metric.total += Number(progress.courseUTS || 0);
            metric.count += 1;
            progressByStudent.set(studentId, metric);
        });

        const batchNamesByTeacher = new Map();
        (schoolAdmin.batches || []).forEach((batch) => {
            (batch.teachers || []).forEach((entry) => {
                const teacherId = toId(entry.teacher);
                const names = batchNamesByTeacher.get(teacherId) || [];
                names.push(batch.batchName);
                batchNamesByTeacher.set(teacherId, names);
            });
        });

        const studentRows = students.map((student) => {
            const studentId = toId(student._id);
            const attendance = studentAttendance.get(studentId) || { present: 0, total: 0 };
            const progress = progressByStudent.get(studentId) || { total: 0, count: 0 };
            return {
                id: studentId,
                name: student.name,
                username: student.username,
                class: student.class || "",
                section: student.section || "",
                status: student.isActive ? "Active" : "Inactive",
                lastLogin: student.lastLogin || null,
                batches: (student.batches || []).length,
                attendancePercent: percent(attendance.present, attendance.total),
                attendanceDays: attendance.total,
                assignmentSubmissions: submissionsByStudent.get(studentId) || 0,
                quizAttempts: quizAttemptsByStudent.get(studentId) || 0,
                projectSubmissions: projectsByStudent.get(studentId) || 0,
                averageProgress: progress.count ? round(progress.total / progress.count) : 0,
            };
        });

        const teacherRows = teachers.map((teacher) => {
            const teacherId = toId(teacher._id);
            const batchNames = batchNamesByTeacher.get(teacherId) || [];
            return {
                id: teacherId,
                name: teacher.name,
                username: teacher.username,
                status: teacher.isActive ? "Active" : "Inactive",
                lastLogin: teacher.lastLogin || null,
                batches: batchNames.length || (teacher.batches || []).length,
                batchNames,
                attendanceSessions: attendanceByTeacher.get(teacherId) || 0,
                assignmentsCreated: assignmentsByTeacher.get(teacherId) || 0,
                quizzesCreated: quizzesByTeacher.get(teacherId) || 0,
                announcementsSent: announcementsByTeacher.get(teacherId) || 0,
                projectReviews: reviewsByTeacher.get(teacherId) || 0,
            };
        });

        const batchRows = (schoolAdmin.batches || []).map((batch) => {
            const batchId = toId(batch._id);
            const attendance = batchAttendance.get(batchId) || { present: 0, total: 0 };
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
                attendancePercent: percent(attendance.present, attendance.total),
                attendanceRecords: attendance.total,
                assignments: assignmentsByBatch.get(batchId) || 0,
                submissions: submissionsByBatch.get(batchId) || 0,
                quizzes: quizzesByBatch.get(batchId) || 0,
                quizAttempts: batchQuizAttempts,
            };
        });

        const setupIssues = {
            unassignedStudents: studentRows.filter((student) => student.batches === 0),
            unassignedTeachers: teacherRows.filter((teacher) => teacher.batches === 0),
            batchesWithoutTeachers: batchRows.filter((batch) => batch.teachers === 0),
            batchesWithoutStudents: batchRows.filter((batch) => batch.students === 0),
            batchesWithoutCourses: batchRows.filter((batch) => batch.courses === 0),
            inactiveStudents: studentRows.filter((student) => student.status === "Inactive"),
            inactiveTeachers: teacherRows.filter((teacher) => teacher.status === "Inactive"),
        };

        const setupIssueCount =
            setupIssues.unassignedStudents.length +
            setupIssues.unassignedTeachers.length +
            setupIssues.batchesWithoutTeachers.length +
            setupIssues.batchesWithoutStudents.length +
            setupIssues.batchesWithoutCourses.length;

        const totalAttendancePresent = [...studentAttendance.values()].reduce((sum, item) => sum + item.present, 0);
        const totalAttendanceRecords = [...studentAttendance.values()].reduce((sum, item) => sum + item.total, 0);
        const averageProgress =
            studentRows.length > 0
                ? round(studentRows.reduce((sum, row) => sum + row.averageProgress, 0) / studentRows.length)
                : 0;

        res.status(200).json({
            success: true,
            analytics: {
                generatedAt: new Date(),
                school: {
                    id: toId(schoolId),
                    name: schoolAdmin.school?.name || "School",
                },
                overview: {
                    batches: batchRows.length,
                    students: students.length,
                    activeStudents: students.filter((student) => student.isActive).length,
                    inactiveStudents: students.filter((student) => !student.isActive).length,
                    teachers: teachers.length,
                    activeTeachers: teachers.filter((teacher) => teacher.isActive).length,
                    inactiveTeachers: teachers.filter((teacher) => !teacher.isActive).length,
                    setupIssues: setupIssueCount,
                    averageAttendance: percent(totalAttendancePresent, totalAttendanceRecords),
                    averageProgress,
                    assignments: assignments.length,
                    assignmentSubmissions: submissions.length,
                    quizzes: quizzes.length,
                    quizAttempts: quizAttempts.length + chapterQuizAttempts.length,
                    projectSubmissions: projects.filter((project) => project.status === "submitted").length,
                    projectsWaitingReview: projects.filter(
                        (project) => project.status === "submitted" && project.teacherReview?.status === "not_reviewed"
                    ).length,
                    announcements: announcements.length,
                },
                teachers: teacherRows,
                students: studentRows,
                batches: batchRows,
                setupIssues,
            },
        });
    } catch (error) {
        console.error("Error fetching school admin analytics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching school admin analytics",
            error: error.message,
        });
    }
};

exports.getSchoolAdminActivityLog = async (req, res) => {
    try {
        const activities = await SchoolAdminActivity.find({
            schoolAdmin: req.schoolAdmin._id,
            school: req.schoolAdmin.school,
        })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.status(200).json({ success: true, activities });
    } catch (error) {
        console.error("Error fetching school admin activity:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activity log",
            error: error.message,
        });
    }
};

exports.resetUserPassword = async (req, res) => {
    try {
        const { userType, userId, password } = req.body;
        const Model = userType === "teacher" ? Teacher : Student;

        if (!["student", "teacher"].includes(userType) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Valid user type and userId are required" });
        }

        if (!password || String(password).length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await Model.findOne({ _id: userId, school: req.schoolAdmin.school });
        if (!user) {
            return res.status(404).json({ success: false, message: `${userType} not found in this school` });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        await logSchoolAdminActivity(req, {
            action: "Password reset",
            targetType: userType,
            targetId: user._id,
            targetName: user.name,
            details: `Reset password for ${user.name}`,
        });

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: error.message,
        });
    }
};

exports.updateSchoolSettings = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "address",
            "city",
            "state",
            "phoneNumber",
            "zipCode",
            "academicYear",
            "term",
            "defaultPasswordRule",
            "attendanceThreshold",
            "teacherPermissions",
        ];
        const update = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) update[field] = req.body[field];
        });

        const school = await School.findByIdAndUpdate(req.schoolAdmin.school, update, {
            new: true,
            runValidators: true,
        }).lean();

        await logSchoolAdminActivity(req, {
            action: "School settings updated",
            targetType: "school",
            targetId: school?._id,
            targetName: school?.name || "School",
            details: "Updated school settings and permissions",
        });

        res.status(200).json({ success: true, school });
    } catch (error) {
        console.error("Error updating school settings:", error);
        res.status(500).json({ success: false, message: "Error updating school settings", error: error.message });
    }
};

exports.getDataQualityChecks = async (req, res) => {
    try {
        const [students, teachers] = await Promise.all([
            Student.find({ school: req.schoolAdmin.school }).select("-password").lean(),
            Teacher.find({ school: req.schoolAdmin.school }).select("-password").lean(),
        ]);

        const usernameCounts = new Map();
        [...students, ...teachers].forEach((user) => inc(usernameCounts, String(user.username || "").toLowerCase()));
        const duplicateUsernames = [...usernameCounts.entries()]
            .filter(([username, count]) => username && count > 1)
            .map(([username, count]) => ({ username, count }));

        const missingStudentData = students.filter(
            (student) => !student.class || !student.section || !student.contact || !student.fatherName
        );
        const studentsWithoutBatch = students.filter((student) => !student.batches?.length);
        const teachersWithoutBatch = teachers.filter((teacher) => !teacher.batches?.length);

        res.status(200).json({
            success: true,
            checks: {
                duplicateUsernames,
                missingStudentData,
                studentsWithoutBatch,
                teachersWithoutBatch,
            },
        });
    } catch (error) {
        console.error("Error fetching data quality checks:", error);
        res.status(500).json({ success: false, message: "Error fetching data quality checks", error: error.message });
    }
};

exports.transferStudent = async (req, res) => {
    try {
        const { studentId, batchId, studentClass, section, reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ success: false, message: "Valid studentId is required" });
        }

        const student = await Student.findOne({ _id: studentId, school: req.schoolAdmin.school });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found in this school" });
        }

        const oldBatches = [...(student.batches || [])];
        const oldClass = student.class || "";
        const oldSection = student.section || "";
        const newBatchIds = batchId ? [batchId] : [];

        await Batch.updateMany({ students: student._id }, { $pull: { students: student._id } });
        if (batchId) {
            await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: student._id } });
        }

        student.batches = newBatchIds;
        if (studentClass) student.class = studentClass;
        if (section) student.section = section;
        await student.save();

        await StudentTransfer.create({
            school: req.schoolAdmin.school,
            schoolAdmin: req.schoolAdmin._id,
            student: student._id,
            fromBatches: oldBatches,
            toBatch: batchId || null,
            fromClass: oldClass,
            toClass: student.class,
            fromSection: oldSection,
            toSection: student.section,
            reason,
        });

        await logSchoolAdminActivity(req, {
            action: "Student transferred",
            targetType: "student",
            targetId: student._id,
            targetName: student.name,
            details: `Moved ${student.name} to ${student.class}-${student.section}`,
        });

        res.status(200).json({ success: true, student, message: "Student transferred successfully" });
    } catch (error) {
        console.error("Error transferring student:", error);
        res.status(500).json({ success: false, message: "Error transferring student", error: error.message });
    }
};

exports.getStudentTransfers = async (req, res) => {
    try {
        const transfers = await StudentTransfer.find({ school: req.schoolAdmin.school })
            .populate("student", "name username")
            .populate("toBatch", "batchName")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.status(200).json({ success: true, transfers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching transfers", error: error.message });
    }
};

exports.createSchoolNotice = async (req, res) => {
    try {
        const { title, announcementContent, priority = "normal" } = req.body;
        if (!title || !announcementContent) {
            return res.status(400).json({ success: false, message: "Title and content are required" });
        }

        const admin = await SchoolAdmin.findById(req.schoolAdmin._id).lean();
        const notice = await Announcement.create({
            title,
            announcementContent,
            priority,
            announcementType: "general",
            batches: admin.batches || [],
        });

        await logSchoolAdminActivity(req, {
            action: "School notice posted",
            targetType: "school",
            targetId: req.schoolAdmin.school,
            targetName: title,
            details: "Posted a school-wide notice",
        });

        res.status(201).json({ success: true, notice, message: "School notice posted" });
    } catch (error) {
        console.error("Error posting school notice:", error);
        res.status(500).json({ success: false, message: "Error posting school notice", error: error.message });
    }
};

exports.archiveBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { archived = true } = req.body;
        const admin = await SchoolAdmin.findById(req.schoolAdmin._id).lean();
        if (!admin.batches.map(toId).includes(String(batchId))) {
            return res.status(403).json({ success: false, message: "Batch is not assigned to this school admin" });
        }

        const batch = await Batch.findByIdAndUpdate(
            batchId,
            { status: archived ? "archived" : "active", archivedAt: archived ? new Date() : null },
            { new: true }
        ).lean();

        await logSchoolAdminActivity(req, {
            action: archived ? "Batch archived" : "Batch restored",
            targetType: "batch",
            targetId: batch._id,
            targetName: batch.batchName,
            details: `${batch.batchName} marked ${batch.status}`,
        });

        res.status(200).json({ success: true, batch });
    } catch (error) {
        console.error("Error archiving batch:", error);
        res.status(500).json({ success: false, message: "Error updating batch archive status", error: error.message });
    }
};

// get all schoolAdmins
exports.getAllSchoolAdmins = async (req, res) => {
    try {
        const schoolAdmins = await SchoolAdmin.find()
            .populate("school")
            .populate({
                path: "batches",
                populate: { path: "courses" }
            });
        res.status(200).json({
            success: true,
            message: "School admins fetched successfully",
            schoolAdmins,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching school admins",
            error,
        });
    }
};

// update school admin 
exports.updateSchoolAdmin = async (req, res) => {
    try {
        const schoolAdminId = req.params.id;
        const {
            name,
            username,
            schoolId,
            removeBatchIds = [],
            addBatchIds = []
        } = req.body;

        const admin = await SchoolAdmin.findById(schoolAdminId);
        if (!admin) {
            return res.status(404).json({ error: "School admin not found" });
        }

        if (name) admin.name = name;
        if (username) admin.username = username;

        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            admin.password = hashedPassword;
        }

        if (schoolId) {
            const schoolExists = await School.findById(schoolId);
            if (!schoolExists) {
                return res.status(404).json({ error: "School not found" });
            }
            admin.school = schoolExists._id;
        }

        // if (batchIds && Array.isArray(batchIds)) {
        //     admin.batches = batchIds.map((id) => new mongoose.Types.ObjectId(id));
        // }

        // Remove batches
        if (Array.isArray(removeBatchIds)) {
            admin.batches = admin.batches.filter(
                (batchId) => !removeBatchIds.includes(batchId.toString())
            );
        }

        // Add new batches
        if (Array.isArray(addBatchIds)) {
            addBatchIds.forEach((id) => {
                if (!admin.batches.some((b) => b.toString() === id)) {
                    admin.batches.push(new mongoose.Types.ObjectId(id));
                }
            });
        }

        const updatedAdmin = await admin.save();

        res.status(200).json({
            success: true,
            message: "School admin updated successfully",
            schoolAdmin: updatedAdmin,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating school admin",
            error,
        });
    }
};


// delete school admin

exports.deleteSchoolAdmin = async (req, res) => {
    try {
        const schoolAdminId = req.params.id;
        const deletedSchoolAdmin = await SchoolAdmin.findByIdAndDelete(schoolAdminId);
        res.status(200).json({
            success: true,
            message: "School admin deleted successfully",
            schoolAdmin: deletedSchoolAdmin,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting school admin",
            error,
        });
    }
};

// controller for block / unblock 
exports.blockStudent = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await Student.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isActive = !user.isActive;
        await user.save();
        await logSchoolAdminActivity(req, {
            action: user.isActive ? "Student unblocked" : "Student blocked",
            targetType: "student",
            targetId: user._id,
            targetName: user.name,
            details: `${user.name} account status changed`,
        });

        res.json({
            success: true,
            message: user.isActive ? "Student unblocked" : "Student blocked",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.blockTeacher = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await Teacher.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isActive = !user.isActive;
        await user.save();
        await logSchoolAdminActivity(req, {
            action: user.isActive ? "Teacher unblocked" : "Teacher blocked",
            targetType: "teacher",
            targetId: user._id,
            targetName: user.name,
            details: `${user.name} account status changed`,
        });

        res.json({
            success: true,
            message: user.isActive ? "Teacher unblocked" : "Teacher blocked",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// add / remove  controller for teacher and student
exports.deleteStudent = async (req, res) => {
    const studentId = req.params.id;

    try {
        // 1. Find the student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // 2. Remove student from school.teachers
        if (student.school) {
            await School.findByIdAndUpdate(student.school, {
                $pull: { teachers: studentId },
            });
        }

        // 3. Remove student from all batch.teachers
        if (Array.isArray(student.batches)) {
            await Batch.updateMany(
                { _id: { $in: student.batches } },
                { $pull: { students: studentId } }
            );
        }

        // 4. Delete the student document
        await Student.findByIdAndDelete(studentId);
        await logSchoolAdminActivity(req, {
            action: "Student removed",
            targetType: "student",
            targetId: student._id,
            targetName: student.name,
            details: `${student.name} was removed from school records`,
        });

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting student:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting student",
            error: error.message,
        });
    }
};

exports.deleteTeacher = async (req, res) => {
    const teacherId = req.params.id;

    try {
        // 1. Find the teacher
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // 2. Remove teacher from school.teachers
        if (teacher.school) {
            await School.findByIdAndUpdate(teacher.school, {
                $pull: { teachers: teacherId },
            });
        }

        // 3. Remove teacher from all batch.teachers (FIXED)
        if (Array.isArray(teacher.batches) && teacher.batches.length > 0) {
            await Batch.updateMany(
                { _id: { $in: teacher.batches } },
                { $pull: { teachers: { teacher: teacherId } } }
            );
        }

        // 4. Delete the teacher document
        await Teacher.findByIdAndDelete(teacherId);
        await logSchoolAdminActivity(req, {
            action: "Teacher removed",
            targetType: "teacher",
            targetId: teacher._id,
            targetName: teacher.name,
            details: `${teacher.name} was removed from school records`,
        });

        return res.status(200).json({
            success: true,
            message: "Teacher deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting teacher",
            error: error.message,
        });
    }
};
