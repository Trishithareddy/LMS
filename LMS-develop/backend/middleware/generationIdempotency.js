const crypto = require("crypto");

const activeRequests = new Map();
const recentResponses = new Map();
let lastCleanupAt = 0;

const cleanupExpiredResponses = (now = Date.now()) => {
    if (now - lastCleanupAt < 60000) return;

    lastCleanupAt = now;
    recentResponses.forEach((response, key) => {
        if (response.expiresAt <= now) {
            recentResponses.delete(key);
        }
    });
};

const stableStringify = (value) => {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${key}:${stableStringify(value[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
};

const generationIdempotency = ({ cacheMs = 30000 } = {}) => {
    return (req, res, next) => {
        cleanupExpiredResponses();

        const user =
            req.user || req.teacher || req.admin || req.student || req.authUser;
        const userId = user?._id?.toString() || req.ip || "anonymous";
        const payload = stableStringify(req.body || {});
        const fileFingerprint = req.file?.buffer
            ? crypto.createHash("sha256").update(req.file.buffer).digest("hex")
            : "";
        const key = crypto
            .createHash("sha256")
            .update(
                `${req.method}:${req.originalUrl}:${userId}:${payload}:${fileFingerprint}`,
            )
            .digest("hex");

        const cached = recentResponses.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return res.status(cached.statusCode).json({
                ...cached.body,
                reusedRequest: true,
            });
        }

        if (activeRequests.has(key)) {
            return res.status(409).json({
                success: false,
                message: "An identical generation request is already running.",
            });
        }

        activeRequests.set(key, Date.now());

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                recentResponses.set(key, {
                    statusCode: res.statusCode,
                    body,
                    expiresAt: Date.now() + cacheMs,
                });
            }
            activeRequests.delete(key);
            return originalJson(body);
        };

        res.on("finish", () => activeRequests.delete(key));
        res.on("close", () => activeRequests.delete(key));

        next();
    };
};

module.exports = generationIdempotency;
