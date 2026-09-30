const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const ChapterwiseQuizAttempt = require("../models/ChapterwiseQuizAttempt");

const getLoggedInUserId = (req) => {
    return (
        req.teacher?._id ||
        req.user?._id ||
        req.admin?._id ||
        req.authUser?._id ||
        null
    );
};

const toId = (value) => String(value || "");

const getPerformanceStatus = ({
    attendancePercentage,
    pendingAssignments,
    averageAssignmentMarks,
    averageQuizPercentage,
    quizAttempts,
}) => {
    const hasQuizData = Number(quizAttempts || 0) > 0;
    const hasAssignmentMarks = Number(averageAssignmentMarks || 0) > 0;

    if (
        attendancePercentage < 60 ||
        pendingAssignments >= 3 ||
        (hasAssignmentMarks && averageAssignmentMarks < 40) ||
        (hasQuizData && averageQuizPercentage < 40)
    ) {
        return "Critical";
    }

    if (
        attendancePercentage < 75 ||
        pendingAssignments >= 1 ||
        (hasAssignmentMarks && averageAssignmentMarks < 50) ||
        (hasQuizData && averageQuizPercentage < 50)
    ) {
        return "Needs Attention";
    }

    if (
        attendancePercentage >= 90 &&
        pendingAssignments === 0 &&
        (!hasAssignmentMarks || averageAssignmentMarks >= 80) &&
        (!hasQuizData || averageQuizPercentage >= 80)
    ) {
        return "Excellent";
    }

    return "Good";
};

exports.getBatchPerformanceDashboard = async (req, res) => {
    try {
        const teacherId = getLoggedInUserId(req);

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: teacher not found",
            });
        }

        const { batchId, from, to, students = [] } = req.body;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        const attendanceQuery = { batchId };

        if (from && to) {
            attendanceQuery.date = {
                $gte: from,
                $lte: to,
            };
        }

        const assignmentQuery = {
            teacherId,
            batchId,
        };

        if (from && to) {
            assignmentQuery.createdAt = {
                $gte: new Date(`${from}T00:00:00.000Z`),
                $lte: new Date(`${to}T23:59:59.999Z`),
            };
        }

        const [attendanceList, assignments] = await Promise.all([
            Attendance.find(attendanceQuery).lean(),
            Assignment.find(assignmentQuery).lean(),
        ]);

        const assignmentIds = assignments.map((assignment) => assignment._id);

        const submissions = await AssignmentSubmission.find({
            assignmentId: { $in: assignmentIds },
        }).lean();

        const studentIds = students
            .map((student) => student.studentId || student._id || student.id)
            .filter(Boolean);

        const quizQuery = {
            studentId: { $in: studentIds },
        };

        if (from && to) {
            quizQuery.submittedAt = {
                $gte: new Date(`${from}T00:00:00.000Z`),
                $lte: new Date(`${to}T23:59:59.999Z`),
            };
        }

        const quizAttempts =
            await ChapterwiseQuizAttempt.find(quizQuery).lean();

        const studentMap = new Map();

        students.forEach((student) => {
            const studentId = toId(
                student.studentId || student._id || student.id,
            );

            if (!studentId) return;

            studentMap.set(studentId, {
                studentId,
                studentName:
                    student.studentName ||
                    student.name ||
                    student.fullName ||
                    "Student",
                className:
                    student.className || student.class || student.grade || "",
                section: student.section || "",

                attendance: {
                    totalDays: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    percentage: 0,
                },

                assignments: {
                    total: assignments.length,
                    submitted: 0,
                    pending: assignments.length,
                    reviewed: 0,
                    needsCorrection: 0,
                    late: 0,
                    totalMarksAwarded: 0,
                    totalMaxMarks: 0,
                    averageMarksPercentage: 0,
                },

                quizzes: {
                    attempts: 0,
                    passed: 0,
                    failed: 0,
                    totalPercentage: 0,
                    averagePercentage: 0,
                    totalScore: 0,
                    averageScore: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                },

                status: "Good",
            });
        });

        attendanceList.forEach((attendance) => {
            (attendance.records || []).forEach((record) => {
                const studentId = toId(record.studentId);

                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        studentId,
                        studentName: record.studentName || "Student",
                        className: "",
                        section: "",
                        attendance: {
                            totalDays: 0,
                            present: 0,
                            absent: 0,
                            late: 0,
                            percentage: 0,
                        },
                        assignments: {
                            total: assignments.length,
                            submitted: 0,
                            pending: assignments.length,
                            reviewed: 0,
                            needsCorrection: 0,
                            late: 0,
                            totalMarksAwarded: 0,
                            totalMaxMarks: 0,
                            averageMarksPercentage: 0,
                        },
                        quizzes: {
                            attempts: 0,
                            passed: 0,
                            failed: 0,
                            totalPercentage: 0,
                            averagePercentage: 0,
                            totalScore: 0,
                            averageScore: 0,
                            totalDuration: 0,
                            averageDuration: 0,
                        },
                        status: "Good",
                    });
                }

                const student = studentMap.get(studentId);

                student.attendance.totalDays += 1;

                if (record.status === "present")
                    student.attendance.present += 1;
                if (record.status === "absent") student.attendance.absent += 1;
                if (record.status === "late") student.attendance.late += 1;
            });
        });

        submissions.forEach((submission) => {
            const studentId = toId(submission.studentId);

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    studentId,
                    studentName: submission.studentName || "Student",
                    className: "",
                    section: "",
                    attendance: {
                        totalDays: 0,
                        present: 0,
                        absent: 0,
                        late: 0,
                        percentage: 0,
                    },
                    assignments: {
                        total: assignments.length,
                        submitted: 0,
                        pending: assignments.length,
                        reviewed: 0,
                        needsCorrection: 0,
                        late: 0,
                        totalMarksAwarded: 0,
                        totalMaxMarks: 0,
                        averageMarksPercentage: 0,
                    },
                    quizzes: {
                        attempts: 0,
                        passed: 0,
                        failed: 0,
                        totalPercentage: 0,
                        averagePercentage: 0,
                        totalScore: 0,
                        averageScore: 0,
                        totalDuration: 0,
                        averageDuration: 0,
                    },
                    status: "Good",
                });
            }

            const student = studentMap.get(studentId);

            student.assignments.submitted += 1;
            student.assignments.pending = Math.max(
                0,
                student.assignments.total - student.assignments.submitted,
            );

            if (submission.status === "reviewed") {
                student.assignments.reviewed += 1;
            }

            if (submission.status === "needs_correction") {
                student.assignments.needsCorrection += 1;
            }

            if (submission.isLate) {
                student.assignments.late += 1;
            }

            const assignment = assignments.find(
                (item) => toId(item._id) === toId(submission.assignmentId),
            );

            const maxMarks = Number(assignment?.maxMarks || 0);

            const awardedMarks =
                submission.finalMarks !== null &&
                submission.finalMarks !== undefined
                    ? Number(submission.finalMarks)
                    : submission.airaEvaluation?.suggestedMarks !== null &&
                        submission.airaEvaluation?.suggestedMarks !== undefined
                      ? Number(submission.airaEvaluation.suggestedMarks)
                      : null;

            if (awardedMarks !== null && maxMarks > 0) {
                student.assignments.totalMarksAwarded += awardedMarks;
                student.assignments.totalMaxMarks += maxMarks;
            }
        });

        quizAttempts.forEach((attempt) => {
            const studentId = toId(attempt.studentId);

            if (!studentMap.has(studentId)) return;

            const student = studentMap.get(studentId);

            student.quizzes.attempts += 1;
            student.quizzes.totalPercentage += Number(attempt.percentage || 0);
            student.quizzes.totalScore += Number(attempt.score || 0);
            student.quizzes.totalDuration += Number(attempt.duration || 0);

            if (attempt.isPassed) {
                student.quizzes.passed += 1;
            } else {
                student.quizzes.failed += 1;
            }
        });

        const studentPerformance = Array.from(studentMap.values()).map(
            (student) => {
                const totalAttendanceDays = student.attendance.totalDays;

                student.attendance.percentage =
                    totalAttendanceDays > 0
                        ? Math.round(
                              ((student.attendance.present +
                                  student.attendance.late) /
                                  totalAttendanceDays) *
                                  100,
                          )
                        : 0;

                student.assignments.averageMarksPercentage =
                    student.assignments.totalMaxMarks > 0
                        ? Math.round(
                              (student.assignments.totalMarksAwarded /
                                  student.assignments.totalMaxMarks) *
                                  100,
                          )
                        : 0;

                student.quizzes.averagePercentage =
                    student.quizzes.attempts > 0
                        ? Math.round(
                              student.quizzes.totalPercentage /
                                  student.quizzes.attempts,
                          )
                        : 0;

                student.quizzes.averageScore =
                    student.quizzes.attempts > 0
                        ? Math.round(
                              student.quizzes.totalScore /
                                  student.quizzes.attempts,
                          )
                        : 0;

                student.quizzes.averageDuration =
                    student.quizzes.attempts > 0
                        ? Math.round(
                              student.quizzes.totalDuration /
                                  student.quizzes.attempts,
                          )
                        : 0;

                student.status = getPerformanceStatus({
                    attendancePercentage: student.attendance.percentage,
                    pendingAssignments: student.assignments.pending,
                    averageAssignmentMarks:
                        student.assignments.averageMarksPercentage,
                    averageQuizPercentage: student.quizzes.averagePercentage,
                    quizAttempts: student.quizzes.attempts,
                });

                return student;
            },
        );

        const totalStudents = studentPerformance.length;

        const overview = {
            totalStudents,
            totalAttendanceDays: attendanceList.length,
            assignmentsGiven: assignments.length,
            totalSubmissions: submissions.length,
            reviewedSubmissions: submissions.filter(
                (submission) => submission.status === "reviewed",
            ).length,
            pendingReviews: submissions.filter(
                (submission) =>
                    submission.status === "submitted" ||
                    submission.status === "late_submission",
            ).length,
            needsCorrection: submissions.filter(
                (submission) => submission.status === "needs_correction",
            ).length,
            lateSubmissions: submissions.filter(
                (submission) => submission.isLate,
            ).length,

            quizAttempts: quizAttempts.length,
            quizPassed: quizAttempts.filter((attempt) => attempt.isPassed)
                .length,
            quizFailed: quizAttempts.filter((attempt) => !attempt.isPassed)
                .length,

            averageAttendance:
                totalStudents > 0
                    ? Math.round(
                          studentPerformance.reduce(
                              (sum, student) =>
                                  sum + student.attendance.percentage,
                              0,
                          ) / totalStudents,
                      )
                    : 0,

            averageAssignmentMarks:
                totalStudents > 0
                    ? Math.round(
                          studentPerformance.reduce(
                              (sum, student) =>
                                  sum +
                                  student.assignments.averageMarksPercentage,
                              0,
                          ) / totalStudents,
                      )
                    : 0,

            averageQuizScore:
                totalStudents > 0
                    ? Math.round(
                          studentPerformance.reduce(
                              (sum, student) =>
                                  sum + student.quizzes.averagePercentage,
                              0,
                          ) / totalStudents,
                      )
                    : 0,

            needsAttentionStudents: studentPerformance.filter(
                (student) =>
                    student.status === "Needs Attention" ||
                    student.status === "Critical",
            ).length,
        };

        const attendanceAnalytics = attendanceList
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .map((attendance) => ({
                date: attendance.date,
                total: attendance.summary?.total || 0,
                present: attendance.summary?.present || 0,
                absent: attendance.summary?.absent || 0,
                late: attendance.summary?.late || 0,
            }));

        const assignmentAnalytics = assignments.map((assignment) => {
            const relatedSubmissions = submissions.filter(
                (submission) =>
                    toId(submission.assignmentId) === toId(assignment._id),
            );

            const reviewedWithMarks = relatedSubmissions.filter(
                (submission) =>
                    submission.finalMarks !== null &&
                    submission.finalMarks !== undefined,
            );

            const averageMarks =
                reviewedWithMarks.length > 0
                    ? Math.round(
                          reviewedWithMarks.reduce(
                              (sum, submission) =>
                                  sum + Number(submission.finalMarks || 0),
                              0,
                          ) / reviewedWithMarks.length,
                      )
                    : 0;

            return {
                assignmentId: assignment._id,
                title: assignment.title,
                softwareTool: assignment.softwareTool,
                dueDate: assignment.dueDate,
                maxMarks: assignment.maxMarks,
                totalStudents,
                submitted: relatedSubmissions.length,
                pending: Math.max(0, totalStudents - relatedSubmissions.length),
                reviewed: relatedSubmissions.filter(
                    (submission) => submission.status === "reviewed",
                ).length,
                needsCorrection: relatedSubmissions.filter(
                    (submission) => submission.status === "needs_correction",
                ).length,
                late: relatedSubmissions.filter(
                    (submission) => submission.isLate,
                ).length,
                averageMarks,
            };
        });

        const quizAnalytics = {
            totalAttempts: quizAttempts.length,
            passed: quizAttempts.filter((attempt) => attempt.isPassed).length,
            failed: quizAttempts.filter((attempt) => !attempt.isPassed).length,
            averagePercentage:
                quizAttempts.length > 0
                    ? Math.round(
                          quizAttempts.reduce(
                              (sum, attempt) =>
                                  sum + Number(attempt.percentage || 0),
                              0,
                          ) / quizAttempts.length,
                      )
                    : 0,
            averageDuration:
                quizAttempts.length > 0
                    ? Math.round(
                          quizAttempts.reduce(
                              (sum, attempt) =>
                                  sum + Number(attempt.duration || 0),
                              0,
                          ) / quizAttempts.length,
                      )
                    : 0,
        };

        return res.status(200).json({
            success: true,
            overview,
            studentPerformance,
            attendanceAnalytics,
            assignmentAnalytics,
            quizAnalytics,
        });
    } catch (error) {
        console.error("Error fetching performance dashboard:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch performance dashboard",
            error: error.message,
        });
    }
};
