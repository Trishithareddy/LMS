const AiApiUsage = require("../models/AiApiUsage");

const getUsageActor = (req = {}) => {
    const user =
        req.user ||
        req.teacher ||
        req.admin ||
        req.schoolAdmin ||
        req.student ||
        null;

    return {
        user: user?._id || null,
        userRole:
            req.userRole ||
            (req.teacher
                ? "teacher"
                : req.admin
                  ? "admin"
                  : req.schoolAdmin
                    ? "school_admin"
                    : req.student
                      ? "student"
                      : "unknown"),
        school: user?.school || null,
    };
};

const recordAiUsage = async ({
    req,
    actor,
    feature,
    sourceId = "",
    success = true,
    durationMs = 0,
    metadata = {},
    error = "",
}) => {
    try {
        const resolvedActor = actor || getUsageActor(req);

        await AiApiUsage.create({
            provider: "chatpdf",
            feature,
            sourceId,
            success,
            durationMs,
            metadata,
            error: String(error || "").slice(0, 500),
            ...resolvedActor,
        });
    } catch (usageError) {
        console.warn("Unable to record AI usage:", usageError.message);
    }
};

module.exports = {
    getUsageActor,
    recordAiUsage,
};
