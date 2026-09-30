const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");

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

const getTodayDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const normalizeText = (value = "") => {
    return String(value || "").trim();
};

const buildSummary = (records = []) => {
    const summary = {
        total: records.length,
        present: 0,
        absent: 0,
        late: 0,
    };

    records.forEach((record) => {
        if (record.status === "present") {
            summary.present += 1;
        } else if (record.status === "late") {
            summary.late += 1;
        } else {
            summary.absent += 1;
        }
    });

    return summary;
};

const calculateUsedMinutes = (record, session) => {
    if (!record.loginTime || !session) return 0;

    const loginTime = new Date(record.loginTime);

    if (Number.isNaN(loginTime.getTime())) {
        return 0;
    }

    const now = new Date();
    let effectiveEndTime = now;

    if (session.closedAt) {
        effectiveEndTime = new Date(session.closedAt);
    } else if (session.endTime) {
        const scheduledEndTime = new Date(session.endTime);

        if (
            !Number.isNaN(scheduledEndTime.getTime()) &&
            now > scheduledEndTime
        ) {
            effectiveEndTime = scheduledEndTime;
        }
    }

    if (Number.isNaN(effectiveEndTime.getTime())) {
        return 0;
    }

    const diffMs = effectiveEndTime.getTime() - loginTime.getTime();

    if (diffMs <= 0) return 0;

    return Math.round(diffMs / (1000 * 60));
};

const normalizeStudentRecords = ({
    students = [],
    className = "",
    section = "",
}) => {
    if (!Array.isArray(students)) return [];

    return students
        .filter((student) => student.studentId || student._id || student.id)
        .map((student) => ({
            studentId: student.studentId || student._id || student.id,
            studentName:
                student.studentName ||
                student.name ||
                student.fullName ||
                "Student",
            className,
            section,
            status: student.status || "absent",
            remarks: student.remarks || "Not logged in / not marked yet",
            markedBy: student.markedBy || "teacher",
            autoMarked: Boolean(student.autoMarked),
            loginTime: student.loginTime || null,
        }));
};

exports.startAttendanceSession = async (req, res) => {
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
            className,
            section,
            date = getTodayDate(),
            durationMinutes = 45,
            graceMinutes = 10,
            students = [],
        } = req.body;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        const finalClassName = normalizeText(className);
        const finalSection = normalizeText(section);

        if (!finalClassName || !finalSection) {
            return res.status(400).json({
                success: false,
                message: "Class and section are required for attendance",
            });
        }

        const existingActiveSession = await AttendanceSession.findOne({
            batchId,
            className: finalClassName,
            section: finalSection,
            date,
            status: "active",
        });

        if (existingActiveSession) {
            return res.status(400).json({
                success: false,
                message:
                    "An active attendance session already exists for this class/section",
                session: existingActiveSession,
            });
        }

        const now = new Date();
        const endTime = new Date(
            now.getTime() + Number(durationMinutes || 45) * 60 * 1000
        );

        const session = await AttendanceSession.create({
            teacherId,
            batchId,
            batchName: batchName || "",
            className: finalClassName,
            section: finalSection,
            date,
            startTime: now,
            endTime,
            durationMinutes: Number(durationMinutes || 45),
            graceMinutes: Number(graceMinutes || 10),
            status: "active",
        });

        const records = normalizeStudentRecords({
            students,
            className: finalClassName,
            section: finalSection,
        });

        const attendance = await Attendance.findOneAndUpdate(
            {
                batchId,
                className: finalClassName,
                section: finalSection,
                date,
            },
            {
                teacherId,
                batchId,
                batchName: batchName || "",
                className: finalClassName,
                section: finalSection,
                date,
                sessionId: session._id,
                records,
                summary: buildSummary(records),
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Attendance session started",
            session,
            attendance,
        });
    } catch (error) {
        console.error("Error starting attendance session:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to start attendance session",
            error: error.message,
        });
    }
};

exports.getBatchAttendance = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { date = getTodayDate(), className = "", section = "" } = req.query;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        const finalClassName = normalizeText(className);
        const finalSection = normalizeText(section);

        const attendanceQuery = {
            batchId,
            date,
        };

        if (finalClassName) attendanceQuery.className = finalClassName;
        if (finalSection) attendanceQuery.section = finalSection;

        const attendance = await Attendance.findOne(attendanceQuery).lean();

        const sessionQuery = {
            batchId,
            date,
            status: "active",
        };

        if (finalClassName) sessionQuery.className = finalClassName;
        if (finalSection) sessionQuery.section = finalSection;

        const activeSession = await AttendanceSession.findOne(sessionQuery)
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            attendance,
            activeSession,
        });
    } catch (error) {
        console.error("Error fetching batch attendance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance",
            error: error.message,
        });
    }
};

exports.saveAttendance = async (req, res) => {
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
            className,
            section,
            date = getTodayDate(),
            sessionId,
            records = [],
        } = req.body;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        const finalClassName = normalizeText(className);
        const finalSection = normalizeText(section);

        if (!finalClassName || !finalSection) {
            return res.status(400).json({
                success: false,
                message: "Class and section are required",
            });
        }

        const finalRecords = records
            .filter((record) => record.studentId)
            .map((record) => ({
                studentId: record.studentId,
                studentName: record.studentName || "Student",
                className: finalClassName,
                section: finalSection,
                status: record.status || "absent",
                remarks: record.remarks || "",
                markedBy: record.autoMarked
                    ? "system"
                    : record.markedBy || "teacher",
                autoMarked: Boolean(record.autoMarked),
                loginTime: record.loginTime || null,
            }));

        const attendance = await Attendance.findOneAndUpdate(
            {
                batchId,
                className: finalClassName,
                section: finalSection,
                date,
            },
            {
                teacherId,
                batchId,
                batchName: batchName || "",
                className: finalClassName,
                section: finalSection,
                date,
                sessionId: sessionId || null,
                records: finalRecords,
                summary: buildSummary(finalRecords),
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Attendance saved successfully",
            attendance,
        });
    } catch (error) {
        console.error("Error saving attendance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save attendance",
            error: error.message,
        });
    }
};

exports.autoMarkAttendance = async (req, res) => {
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
            batchIds = [],
            studentName = "Student",
            className = "",
            section = "",
            date = getTodayDate(),
        } = req.body;

        const finalClassName = normalizeText(className);
        const finalSection = normalizeText(section);

        if (!finalClassName || !finalSection) {
            return res.status(400).json({
                success: false,
                message: "Class and section are required for auto attendance",
            });
        }

        const validBatchIds = Array.isArray(batchIds)
            ? batchIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
            : [];

        if (!validBatchIds.length) {
            return res.status(400).json({
                success: false,
                message: "No valid batchIds provided",
            });
        }

        const activeSessions = await AttendanceSession.find({
            batchId: { $in: validBatchIds },
            className: finalClassName,
            section: finalSection,
            date,
            status: "active",
        }).lean();

        const marked = [];

        for (const session of activeSessions) {
            const attendance = await Attendance.findOne({
                batchId: session.batchId,
                className: session.className,
                section: session.section,
                date,
            });

            if (!attendance) continue;

            const now = new Date();
            const startTime = new Date(session.startTime);
            const graceLimit = new Date(
                startTime.getTime() +
                    Number(session.graceMinutes || 10) * 60 * 1000
            );

            const status = now <= graceLimit ? "present" : "late";

            let found = false;

            attendance.records = attendance.records.map((record) => {
                const plainRecord = record.toObject ? record.toObject() : record;

                if (String(plainRecord.studentId) === String(studentId)) {
                    found = true;

                    return {
                        ...plainRecord,
                        studentId: plainRecord.studentId,
                        studentName: plainRecord.studentName || studentName,
                        className: session.className,
                        section: session.section,
                        status,
                        remarks: "",
                        markedBy: "system",
                        autoMarked: true,
                        loginTime: plainRecord.loginTime || now,
                    };
                }

                return plainRecord;
            });

            if (!found) {
                attendance.records.push({
                    studentId,
                    studentName,
                    className: session.className,
                    section: session.section,
                    status,
                    remarks: "",
                    markedBy: "system",
                    autoMarked: true,
                    loginTime: now,
                });
            }

            attendance.summary = buildSummary(attendance.records);
            await attendance.save();

            marked.push({
                batchId: session.batchId,
                className: session.className,
                section: session.section,
                status,
                loginTime: now,
            });
        }

        return res.status(200).json({
            success: true,
            marked,
        });
    } catch (error) {
        console.error("Error auto-marking attendance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to auto-mark attendance",
            error: error.message,
        });
    }
};

exports.closeAttendanceSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Valid sessionId is required",
            });
        }

        const session = await AttendanceSession.findByIdAndUpdate(
            sessionId,
            {
                status: "closed",
                closedAt: new Date(),
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Attendance session closed",
            session,
        });
    } catch (error) {
        console.error("Error closing attendance session:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to close attendance session",
            error: error.message,
        });
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const { batchId } = req.params;
        const {
            from,
            to,
            className = "",
            section = "",
        } = req.query;

        if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid batchId is required",
            });
        }

        const finalClassName = normalizeText(className);
        const finalSection = normalizeText(section);

        const query = {
            batchId,
        };

        if (finalClassName) query.className = finalClassName;
        if (finalSection) query.section = finalSection;

        if (from && to) {
            query.date = {
                $gte: from,
                $lte: to,
            };
        }

        const attendanceList = await Attendance.find(query)
            .sort({ date: -1 })
            .lean();

        const sessionIds = attendanceList
            .map((attendance) => attendance.sessionId)
            .filter(Boolean);

        const sessions = await AttendanceSession.find({
            _id: { $in: sessionIds },
        }).lean();

        const sessionMap = new Map(
            sessions.map((session) => [String(session._id), session])
        );

        const overallSummary = {
            totalDays: attendanceList.length,
            totalMarked: 0,
            present: 0,
            absent: 0,
            late: 0,
        };

        const studentReport = [];

        attendanceList.forEach((attendance) => {
            overallSummary.totalMarked += attendance.summary?.total || 0;
            overallSummary.present += attendance.summary?.present || 0;
            overallSummary.absent += attendance.summary?.absent || 0;
            overallSummary.late += attendance.summary?.late || 0;

            const session = attendance.sessionId
                ? sessionMap.get(String(attendance.sessionId))
                : null;

            (attendance.records || []).forEach((record) => {
                studentReport.push({
                    date: attendance.date,
                    batchName: attendance.batchName || "",
                    className:
                        attendance.className || record.className || "",
                    section: attendance.section || record.section || "",
                    studentId: record.studentId,
                    studentName: record.studentName || "Student",
                    status: record.status || "absent",
                    markedBy: record.markedBy || "teacher",
                    autoMarked: Boolean(record.autoMarked),
                    loginTime: record.loginTime || null,
                    usedMinutes: calculateUsedMinutes(record, session),
                    remarks: record.remarks || "",
                });
            });
        });

        return res.status(200).json({
            success: true,
            attendanceList,
            overallSummary,
            studentReport,
        });
    } catch (error) {
        console.error("Error fetching attendance summary:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance summary",
            error: error.message,
        });
    }
};

exports.getTodayAttendanceStatus = async (req, res) => {
    try {
        const student = getStudentFromRequest(req);
        const studentId = student?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: student not found",
            });
        }

        const date = req.query.date || getTodayDate();

        const records = await Attendance.find({
            date,
            "records.studentId": studentId,
        }).lean();

        const statusList = [];

        records.forEach((attendance) => {
            const record = (attendance.records || []).find(
                (item) => String(item.studentId) === String(studentId)
            );

            if (record) {
                statusList.push({
                    batchId: attendance.batchId,
                    batchName: attendance.batchName,
                    className: attendance.className,
                    section: attendance.section,
                    date: attendance.date,
                    status: record.status,
                    loginTime: record.loginTime,
                    markedBy: record.markedBy,
                    autoMarked: record.autoMarked,
                });
            }
        });

        return res.status(200).json({
            success: true,
            statusList,
        });
    } catch (error) {
        console.error("Error fetching today attendance status:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance status",
            error: error.message,
        });
    }
};

exports.startSession = exports.startAttendanceSession;
exports.closeSession = exports.closeAttendanceSession;