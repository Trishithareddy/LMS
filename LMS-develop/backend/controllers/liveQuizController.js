const LiveQuizSession = require("../models/LiveQuizSession");
const Quiz = require("../models/Quiz");
const AttemptQuiz = require("../models/AttepmtQuiz");

const createSessionCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
};

const createUniqueSessionCode = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const code = createSessionCode();
        const existing = await LiveQuizSession.exists({ code });
        if (!existing) return code;
    }

    throw new Error("Unable to create a live quiz code");
};

const normalizeAssignedBatchIds = (assignedTo) =>
    (Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : [])
        .map((batchId) => String(batchId))
        .filter(Boolean);

const populateSession = (query) =>
    query
        .populate("quiz", "title description totalMarks timeLimit quizMode assignedTo")
        .populate("batch", "batchName")
        .populate("participants.student", "name username class section");

const getParticipantStudentId = (participant) =>
    String(participant.student?._id || participant.student);

const addSessionScores = async (session) => {
    if (!session) return session;

    const sessionObject =
        typeof session.toObject === "function" ? session.toObject() : session;
    const participantIds = (sessionObject.participants || []).map(
        getParticipantStudentId,
    );
    const quizId = sessionObject.quiz?._id || sessionObject.quiz;

    if (!participantIds.length || !quizId) {
        return {
            ...sessionObject,
            resultSummary: {
                submittedCount: 0,
                averagePercentage: 0,
            },
        };
    }

    const attempts = await AttemptQuiz.find({
        quizId,
        studentId: { $in: participantIds },
        createdAt: { $gte: sessionObject.createdAt },
    })
        .sort({ createdAt: -1 })
        .lean();

    const latestAttemptByStudent = new Map();
    attempts.forEach((attempt) => {
        const studentId = String(attempt.studentId);
        if (!latestAttemptByStudent.has(studentId)) {
            latestAttemptByStudent.set(studentId, attempt);
        }
    });

    const participants = (sessionObject.participants || []).map(
        (participant) => {
            const attempt = latestAttemptByStudent.get(
                getParticipantStudentId(participant),
            );

            return {
                ...participant,
                attempt: attempt
                    ? {
                          _id: attempt._id,
                          score: attempt.score,
                          percentage: attempt.percentage,
                          isPassed: attempt.isPassed,
                          duration: attempt.duration,
                          submittedAt: attempt.submittedAt,
                      }
                    : null,
            };
        },
    );

    const submittedParticipants = participants.filter(
        (participant) => participant.attempt,
    );
    const totalPercentage = submittedParticipants.reduce(
        (sum, participant) =>
            sum + Number(participant.attempt.percentage || 0),
        0,
    );

    return {
        ...sessionObject,
        participants,
        resultSummary: {
            submittedCount: submittedParticipants.length,
            averagePercentage: submittedParticipants.length
                ? Math.round(totalPercentage / submittedParticipants.length)
                : 0,
        },
    };
};

const addScoresToSessions = async (sessions) =>
    Promise.all((sessions || []).map((session) => addSessionScores(session)));

exports.createLiveQuizSession = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.body.quizId,
            createdBy: req.teacher._id,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found for this teacher",
            });
        }

        if (!quiz.assignedTo) {
            return res.status(400).json({
                success: false,
                message: "Assign this quiz to a batch before starting live mode",
            });
        }

        const assignedBatchIds = normalizeAssignedBatchIds(quiz.assignedTo);
        if (!assignedBatchIds.length) {
            return res.status(400).json({
                success: false,
                message: "Assign this quiz to at least one batch before starting live mode",
            });
        }

        const requestedBatchId = req.body.batchId
            ? String(req.body.batchId)
            : assignedBatchIds[0];

        if (!assignedBatchIds.includes(requestedBatchId)) {
            return res.status(400).json({
                success: false,
                message: "This quiz is not assigned to the selected batch",
            });
        }

        const session = await LiveQuizSession.create({
            code: await createUniqueSessionCode(),
            quiz: quiz._id,
            teacher: req.teacher._id,
            batch: requestedBatchId,
        });

        const hydrated = await populateSession(
            LiveQuizSession.findById(session._id),
        );

        return res.status(201).json({
            success: true,
            message: "Live quiz room created",
            session: await addSessionScores(hydrated),
        });
    } catch (error) {
        console.error("Error creating live quiz session:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create live quiz room",
            error: error.message,
        });
    }
};

exports.getTeacherLiveQuizSessions = async (req, res) => {
    try {
        const sessions = await populateSession(
            LiveQuizSession.find({ teacher: req.teacher._id })
                .sort({ createdAt: -1 })
                .limit(12),
        );

        return res.json({
            success: true,
            sessions: await addScoresToSessions(sessions),
        });
    } catch (error) {
        console.error("Error fetching live quiz sessions:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch live quiz rooms",
        });
    }
};

exports.getLiveQuizSession = async (req, res) => {
    try {
        const session = await populateSession(
            LiveQuizSession.findById(req.params.id),
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Live quiz room not found",
            });
        }

        const isTeacherOwner =
            req.teacher && String(session.teacher) === String(req.teacher._id);
        const isParticipant =
            req.student &&
            session.participants.some(
                (participant) =>
                    String(participant.student?._id || participant.student) ===
                    String(req.student._id),
            );

        if (!isTeacherOwner && !isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You cannot view this live quiz room",
            });
        }

        return res.json({
            success: true,
            session: await addSessionScores(session),
        });
    } catch (error) {
        console.error("Error fetching live quiz session:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch live quiz room",
        });
    }
};

exports.updateLiveQuizSessionStatus = async (req, res) => {
    try {
        const allowedStatuses = ["waiting", "live", "ended"];
        const status = req.body.status;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid live quiz status",
            });
        }

        const session = await LiveQuizSession.findOne({
            _id: req.params.id,
            teacher: req.teacher._id,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Live quiz room not found",
            });
        }

        session.status = status;
        if (status === "live" && !session.startedAt) {
            session.startedAt = new Date();
        }
        if (status === "ended") {
            session.endedAt = new Date();
        }
        await session.save();

        const hydrated = await populateSession(
            LiveQuizSession.findById(session._id),
        );

        return res.json({
            success: true,
            message: "Live quiz room updated",
            session: await addSessionScores(hydrated),
        });
    } catch (error) {
        console.error("Error updating live quiz session:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update live quiz room",
        });
    }
};

exports.joinLiveQuizSession = async (req, res) => {
    try {
        const code = String(req.body.code || "").trim().toUpperCase();

        const session = await LiveQuizSession.findOne({
            code,
            status: { $ne: "ended" },
        }).populate("quiz", "title _id assignedTo quizMode");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Live quiz code is not active",
            });
        }

        const isInBatch = (req.student.batches || []).some(
            (batch) => String(batch._id || batch) === String(session.batch),
        );

        if (!isInBatch) {
            return res.status(403).json({
                success: false,
                message: "This live quiz is for another batch",
            });
        }

        const alreadyJoined = session.participants.some(
            (participant) => String(participant.student) === String(req.student._id),
        );

        if (!alreadyJoined) {
            session.participants.push({ student: req.student._id });
            await session.save();
        }

        const hydrated = await populateSession(
            LiveQuizSession.findById(session._id),
        );

        return res.json({
            success: true,
            message:
                hydrated.status === "live"
                    ? "Joined live quiz"
                    : "Joined live quiz room. Wait for your teacher to start.",
            session: await addSessionScores(hydrated),
        });
    } catch (error) {
        console.error("Error joining live quiz session:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to join live quiz room",
        });
    }
};

exports.updateLiveQuizProgress = async (req, res) => {
    try {
        const code = String(req.body.code || "").trim().toUpperCase();
        const session = await LiveQuizSession.findOne({
            code,
            status: "live",
        }).populate("quiz", "totalMarks");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Live quiz room is not running",
            });
        }

        const participant = session.participants.find(
            (item) => String(item.student) === String(req.student._id),
        );

        if (!participant) {
            return res.status(403).json({
                success: false,
                message: "Join the live quiz room before answering",
            });
        }

        const score = Math.max(0, Number(req.body.score) || 0);
        const totalMarks = Math.max(1, Number(session.quiz?.totalMarks) || 1);

        participant.progress = {
            answeredCount: Math.max(0, Number(req.body.answeredCount) || 0),
            correctCount: Math.max(0, Number(req.body.correctCount) || 0),
            score,
            percentage: Math.round((score / totalMarks) * 100),
            updatedAt: new Date(),
        };
        await session.save();

        return res.json({
            success: true,
            message: "Live progress updated",
        });
    } catch (error) {
        console.error("Error updating live quiz progress:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update live quiz progress",
        });
    }
};
