const fs = require("fs");
const path = require("path");
const axios = require("axios");
//const sharp = require("sharp");
const mongoose = require("mongoose");
const Badge = require("../models/Badge");
const CourseBadge = require("../models/CourseBadge");
const Batch = require("../models/Batch");
const UserBadge = require("../models/UserBadge");
const Course = require("../models/Course");
const PDFDocument = require("pdfkit");
const { getCurrentAcademicYear } = require("../services/badgeArchiver");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");


/* ------------------ helpers ------------------ */
function getAcademicYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr

    // Academic year switches in April
    if (month >= 3) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}


function removePublicFile(relPath) {
    try {
        if (!relPath) return;
        const cleaned = relPath.startsWith("/") ? relPath.slice(1) : relPath;
        const full = path.join(__dirname, "..", "public", cleaned);
        if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch (err) {
        console.warn("removePublicFile failed", err.message);
    }
}

async function getNextVerifyCode() {
    const last = await UserBadge.findOne({})
        .sort({ verifyCode: -1 })
        .select("verifyCode");

    return last?.verifyCode ? last.verifyCode + 1 : 101;
}



async function findBatchForStudent({ studentId, courseId }) {
    return Batch.findOne({
        students: studentId,
        ...(courseId ? { courses: courseId } : {}),
    });
}


/* ------------------ ICON UPLOAD ------------------ */
exports.uploadIcon = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        const iconUrl = `/badges/${req.file.filename}`;

        return res.status(201).json({
            message: "Icon uploaded successfully",
            iconUrl,
        });

    } catch (err) {
        console.error("Upload icon error:", err);

        res.status(500).json({
            message: "Failed to upload icon",
        });
    }
};

/* ------------------ BADGE CRUD ------------------ */
exports.createBadge = async (req, res) => {
    try {
        let { title, code, description, iconUrl, audience, criteria } = req.body;

        if (!title) return res.status(400).json({ message: "Title required" });
        if (!audience) return res.status(400).json({ message: "Audience required" });
        if (!criteria?.type)
            return res.status(400).json({ message: "criteria.type required" });

        // 🔒 STUDENT: code must be provided manually
        if (audience === "STUDENT") {
            if (!code) {
                return res.status(400).json({ message: "Code required for student badge" });
            }
        }

        // 🔥 TEACHER: inherit from student badge
        if (audience === "TEACHER") {
            if (!criteria.derivedFromBadge) {
                return res
                    .status(400)
                    .json({ message: "derivedFromBadge is required for teacher badge" });
            }

            const studentBadge = await Badge.findById(criteria.derivedFromBadge);
            if (!studentBadge || studentBadge.audience !== "STUDENT") {
                return res.status(400).json({
                    message: "Invalid derived student badge",
                });
            }

            // ✅ FORCE DERIVED
            criteria.type = "DERIVED";

            // ✅ FORCE same code & scope
            code = studentBadge.code;
            criteria.courseId = studentBadge.criteria.courseId;
            criteria.chapterId = studentBadge.criteria.chapterId;
        }


        const badge = await Badge.create({
            title,
            code,
            description,
            iconUrl,
            audience,
            criteria,
            createdBy: req.user?._id,
        });

        res.status(201).json(badge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getBadges = async (req, res) => {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (q) {
        const r = new RegExp(q, "i");
        filter.$or = [{ title: r }, { code: r }, { description: r }];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        Badge.find(filter).skip(skip).limit(+limit).sort("-createdAt"),
        Badge.countDocuments(filter),
    ]);

    res.json({ data: items, total });
};

exports.getBadgeById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid id" });

    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: "Not found" });
    res.json(badge);
};

exports.updateBadge = async (req, res) => {
    try {
        let { title, code, description, iconUrl, audience, criteria } = req.body;

        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        criteria = criteria || badge.criteria;

        // 🔒 TEACHER badge: FORCE inheritance again
        if (badge.audience === "TEACHER") {
            const studentBadge = await Badge.findById(
                badge.criteria?.derivedFromBadge
            );

            if (!studentBadge) {
                return res.status(400).json({
                    message: "Derived student badge missing",
                });
            }

            // 🔥 HARD OVERRIDE (ignore client)
            code = studentBadge.code;
            criteria.courseId = studentBadge.criteria?.courseId;
            criteria.chapterId = studentBadge.criteria?.chapterId;
            criteria.derivedFromBadge = studentBadge._id;
        }

        // STUDENT badge: allow edits
        if (badge.audience === "STUDENT") {
            if (!code) {
                return res.status(400).json({ message: "Code required" });
            }
        }

        const updated = await Badge.findByIdAndUpdate(
            req.params.id,
            {
                title,
                code,
                description,
                iconUrl,
                criteria,
            },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        console.error("updateBadge error:", err);
        res.status(400).json({ message: err.message });
    }
};

exports.deleteBadge = async (req, res) => {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) return res.status(404).json({ message: "Not found" });

    // if (badge.iconUrl?.startsWith("/badges/")) {
    //     removePublicFile(badge.iconUrl);
    // }

    res.json({ message: "Badge deleted" });
};

/* ------------------ COURSE BADGES ------------------ */
exports.assignBadgeToCourse = async (req, res) => {
    const { courseId, badgeId, assignmentType = "manual", criteria, active } =
        req.body;

    if (!courseId || !badgeId)
        return res.status(400).json({ message: "courseId & badgeId required" });

    const exists = await CourseBadge.findOne({ courseId, badgeId });
    if (exists)
        return res.status(400).json({ message: "Already assigned" });

    const cb = await CourseBadge.create({
        courseId,
        badgeId,
        assignmentType,
        criteria,
        active,
    });

    await cb.populate("badgeId");
    res.status(201).json(cb);
};

/**
 * Rule:
 * If >=50% students in a batch earned the badge,
 * award same badge to the batch teacher(s)
 */
exports.evaluateTeacherForBadge = async function ({
    teacherId,
    studentBadgeId,
    courseId,
    chapterId,
    percentageRequired = 50,
}) {
    // console.log("🧪 evaluateTeacherForBadge INPUT:", {
    //     teacherId,
    //     studentBadgeId,
    //     courseId,
    //     chapterId,
    // });

    // 1️⃣ Find batches where teacher teaches
    const batches = await Batch.find({
        teachers: {
            $elemMatch: {
                teacher: teacherId,
                role: "PRIMARY",
            },
        },
    }).select("students");


    if (!batches.length) return;

    // 2️⃣ All students taught by this teacher
    const studentIds = [
        ...new Set(
            batches.flatMap(b => b.students.map(s => s.toString()))
        ),
    ];

    if (!studentIds.length) return;

    // 3️⃣ Count ONLY badges earned by THESE students
    const earnedCount = await UserBadge.countDocuments({
        userRole: "student",
        badgeId: studentBadgeId,
        courseId,
        chapterId,
        userId: { $in: studentIds },
    });

    if (earnedCount === 0) {
        console.log("⛔ No awarded students for this teacher");
        return;
    }

    const percentage = (earnedCount / studentIds.length) * 100;

    // console.log(
    //     `📊 Teacher ${teacherId}: ${earnedCount}/${studentIds.length} = ${percentage.toFixed(2)}%`
    // );

    if (percentage < percentageRequired) return;

    // 4️⃣ Resolve teacher badge
    const teacherBadge = await Badge.findOne({
        audience: "TEACHER",
        "criteria.derivedFromBadge": studentBadgeId,
        "criteria.courseId": courseId,
        "criteria.chapterId": chapterId,
    }).select("_id title");

    if (!teacherBadge) return;

    // 5️⃣ Idempotency
    const exists = await UserBadge.findOne({
        userId: teacherId,
        userRole: "teacher",
        badgeId: teacherBadge._id,
        courseId,
        chapterId,
    });

    if (exists) return;


    // find one student badge to inherit academicYear
    const sampleStudentBadge = await UserBadge.findOne({
        userRole: "student",
        badgeId: studentBadgeId,
        courseId,
        chapterId,
        userId: { $in: studentIds },
    }).select("academicYear");

    if (!sampleStudentBadge) return;
    // 6️⃣ Award

    await UserBadge.create({
        userId: teacherId,
        userRole: "teacher",
        badgeId: teacherBadge._id,
        courseId,
        chapterId,
        academicYear: sampleStudentBadge.academicYear, // ✅ INHERIT
        note: "Auto-awarded based on batch students",
        verifyCode: await getNextVerifyCode(),
        awardedAt: new Date(),
    });


    // console.log(`🏅 Teacher ${teacherId} awarded ${teacherBadge.title}`);
};


exports.awardBadgeToUsers = async (req, res) => {
    // console.log("🔥 awardBadgeToUsers CALLED", req.body);

    try {
        const { userIds, userId, badgeId, courseId, note } = req.body;

        const ids = userIds?.length ? userIds : userId ? [userId] : [];
        if (!ids.length || !badgeId || !courseId) {
            return res.status(400).json({ message: "Missing data" });
        }

        // 1️⃣ Load badge
        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }

        // 2️⃣ STUDENT badges ONLY can be manually awarded
        if (badge.audience !== "STUDENT") {
            return res.status(400).json({
                message: "Teacher badges are auto-awarded only",
            });
        }

        let awardedCount = 0;

        for (const uid of ids) {
            // 3️⃣ Prevent duplicate student badge
            const exists = await UserBadge.findOne({
                userId: uid,
                badgeId,
                courseId,
                //userRole: "student",
            });

            if (exists) continue;

            // 4️⃣ Resolve academic year
            const batch = await findBatchForStudent({
                studentId: uid,
                courseId,
            });

            const academicYear =
                batch?.academicYear || getAcademicYear();



            // 5️⃣ Award STUDENT badge
            await UserBadge.create({
                userId: uid,
                userRole: "student",
                badgeId,
                courseId,
                chapterId: badge.criteria?.chapterId,
                academicYear,
                note,
                verifyCode: await getNextVerifyCode(),
                awardedAt: new Date(),
            });

            awardedCount++;
        }


        // Evaluate TEACHER badge eligibility AFTER student award
        await evaluateTeacherForBadge({
            teacherId: req.user._id,   // 🔥 THIS FIXES EVERYTHING
            studentBadgeId: badgeId,
            courseId,
            chapterId: badge.criteria.chapterId,
        });


        return res.json({
            awarded: awardedCount,
            badge: badge.title,
            teacherAutoAward: true,
        });
    } catch (err) {
        console.error("awardBadgeToUsers error:", err);
        return res.status(500).json({ message: "Failed to award badge" });
    }
};


exports.getMyBadges = async (req, res) => {
    try {
        const userId = req.user._id;

        // console.log("FETCHING BADGES FOR:", userId);



        const badges = await UserBadge.find({ userId })
            .populate("badgeId")
            .sort({ awardedAt: -1 });
        // console.log("BADGES API PAYLOAD:", badges);

        res.json(badges);
    } catch (err) {
        console.error("getMyBadges error:", err);
        res.status(500).json({ message: "Failed to fetch badges" });
    }
};

exports.getTeacherBadges = async (req, res) => {
    try {
        const teacherId = req.user._id;

        const badges = await UserBadge.find({
            userId: teacherId,

            // 🔥 FIX 1: tolerate missing userRole
            $or: [
                { userRole: "teacher" },
                { userRole: { $exists: false } },
                { userRole: null },
                { userRole: "" }
            ],

            // 🔥 FIX 2: tolerate missing isArchived
            $and: [
                {
                    $or: [
                        { isArchived: false },
                        { isArchived: { $exists: false } }
                    ]
                }
            ]
        })
            .populate("badgeId", "title description iconUrl")
            .sort({ awardedAt: -1 });

        res.json(badges);
    } catch (err) {
        console.error("getTeacherBadges error:", err);
        res.status(500).json({ message: "Failed to fetch teacher badges" });
    }
};

// 👨‍🏫 TEACHER: STUDENTS WITH BADGES (SERVER-SIDE PAGINATION)
exports.getStudentsWithBadges = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            course,
            academicYear,
        } = req.query;

        const skip = (page - 1) * limit;

        // 🔹 Base filter (same logic as old working code)
        const match = {
            $or: [
                { userRole: "student" },
                { userRole: null },
                { userRole: "" },
                { userRole: { $exists: false } },
            ],
        };

        if (academicYear) {
            match.academicYear = academicYear;
        }

        if (course) {
            match.course = course;
        }

        // 1️⃣ Fetch paginated badge records
        const records = await UserBadge.find(match)
            .populate("badgeId", "title iconUrl")
            .populate("courseId", "name")
            .populate("chapterId", "name")
            .sort({ awardedAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        // 2️⃣ Total count (for pagination)
        const total = await UserBadge.countDocuments(match);

        // 3️⃣ Resolve student names
        const studentIds = records.map(r => r.userId);

        const students = await mongoose
            .model("Student")
            .find({ _id: { $in: studentIds } })
            .select("name");

        const studentMap = {};
        students.forEach(s => {
            studentMap[s._id.toString()] = s.name;
        });

        // 4️⃣ Apply search on student name (AFTER lookup)
        let rows = records
            .filter(r => r.badgeId) // 🔥 CRITICAL
            .map(r => ({
                _id: r._id,
                badge: {
                    title: r.badgeId.title,
                    iconUrl: r.badgeId.iconUrl,
                },
                course: r.courseId?.name ?? "—",
                chapter: r.chapterId?.name ?? "—",
                studentName: studentMap[r.userId.toString()] || "—",
                awardedAt: r.awardedAt,
                academicYear: r.academicYear ?? "—",
            }));


        if (search) {
            const s = search.toLowerCase();
            rows = rows.filter(r =>
                r.studentName.toLowerCase().includes(s)
            );
        }

        res.json({
            rows,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("getStudentsWithBadges error:", err);
        res.status(500).json({ message: "Failed to fetch student badges" });
    }
};



exports.downloadBadge = async (req, res) => {
    try {
        // 🔁 RENAMED
        const { badgeNumber } = req.params;

        if (!badgeNumber) {
            return res.status(400).send("Badge number is required");
        }

        const ub = await UserBadge.findOne({ badgeNumber })
            .populate("badgeId", "title iconUrl description")
            .populate("courseId", "name")
            .populate("chapterId", "name");

        if (!ub) {
            return res.status(404).send("Invalid badge number");
        }

        // 🔐 Resolve user
        let user = null;
        if (ub.userRole === "student") {
            user = await mongoose.model("Student").findById(ub.userId).select("name");
        }
        if (ub.userRole === "teacher") {
            user = await mongoose.model("Teacher").findById(ub.userId).select("name");
        }

        // 🧾 Create PDF
        const doc = new PDFDocument({ size: "A4", margin: 50 });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=badge-${badgeNumber}.pdf`
        );
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // 🏆 Title
        doc.fontSize(22).text("SuperTeacher Badge", { align: "center" });
        doc.moveDown(1);

        // 🖼 Badge Icon from Cloudinary URL
        if (ub.badgeId?.iconUrl) {
            try {
                const response = await axios.get(ub.badgeId.iconUrl, {
                    responseType: "arraybuffer",
                });

                doc.image(response.data, {
                    fit: [120, 120],
                    align: "center",
                });

                doc.moveDown(1);
            } catch (err) {
                console.error("Failed to load Cloudinary image:", err.message);
            }
        }

        // 📄 Details (NULL SAFE)
        doc.fontSize(16).text(`Name: ${user?.name || "N/A"}`);
        doc.text(`Role: ${ub.userRole}`);
        doc.text(`Badge: ${ub.badgeId?.title || "Badge Deleted"}`);
        doc.text(`Awarded On: ${ub.awardedAt.toDateString()}`);
        //doc.text(`Badge Number: ${ub.badgeNumber}`);

        if (ub.academicYear) doc.text(`Academic Year: ${ub.academicYear}`);
        if (ub.courseId?.name) doc.text(`Course: ${ub.courseId.name}`);
        if (ub.chapterId?.name) doc.text(`Chapter: ${ub.chapterId.name}`);

        doc.moveDown(2);
        // doc.fontSize(12).text(
        //     `Verify this badge at: https://superteacher.in/verify/${ub.badgeNumber}`
        // );

        doc.end();
    } catch (err) {
        console.error("downloadBadge error:", err);

        // 🛑 Prevent stream crash
        if (!res.headersSent) {
            res.status(500).send("Failed to generate badge");
        }
    }
};

exports.archiveTeacherBadge = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const { id } = req.params;

        const result = await UserBadge.updateOne(
            {
                _id: id,
                userId: teacherId,

                // tolerate legacy records
                $or: [
                    { userRole: "teacher" },
                    { userRole: { $exists: false } },
                    { userRole: null },
                    { userRole: "" }
                ]
            },
            {
                $set: { isArchived: true }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Badge not found" });
        }

        res.json({ message: "Badge archived successfully" });
    } catch (err) {
        console.error("archiveTeacherBadge error:", err);
        res.status(500).json({ message: "Failed to archive badge" });
    }
};

// 👨‍🏫 TEACHER: ARCHIVED BADGES
exports.getArchivedTeacherBadges = async (req, res) => {
    try {
        const teacherId = req.user._id;

        const badges = await UserBadge.find({
            userId: teacherId,

            // tolerate legacy records
            $or: [
                { userRole: "teacher" },
                { userRole: { $exists: false } },
                { userRole: null },
                { userRole: "" }
            ],

            isArchived: true
        })
            .populate("badgeId", "title description iconUrl")
            .sort({ awardedAt: -1 });

        res.json(badges);
    } catch (err) {
        console.error("getArchivedTeacherBadges error:", err);
        res.status(500).json({ message: "Failed to fetch archived badges" });
    }
};

exports.restoreTeacherBadge = async (req, res) => {
    try {
        const badge = await UserBadge.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }

        const currentYear = getAcademicYear();


        if (badge.academicYear !== currentYear) {
            return res.status(400).json({
                message: "Cannot restore badge from previous academic year",
            });
        }

        badge.isArchived = false;
        await badge.save();

        res.json({ message: "Badge restored" });
    } catch (err) {
        res.status(500).json({ message: "Failed to restore badge" });
    }
};

exports.verifyBadgePublic = async (req, res) => {
    try {
        const { verifyCode, name } = req.query;

        if (!verifyCode || !name) {
            return res
                .status(400)
                .json({ message: "Verification code and name are required" });
        }

        const badges = await UserBadge.find({ verifyCode })
            .populate("badgeId", "title description iconUrl");

        if (!badges.length) {
            return res.status(404).json({ message: "Invalid verification code" });
        }

        let matchedBadge = null;
        let matchedUser = null;

        for (const b of badges) {
            let user =
                (await mongoose
                    .model("Teacher")
                    .findById(b.userId)
                    .select("name")) ||
                (await mongoose
                    .model("Student")
                    .findById(b.userId)
                    .select("name"));

            if (
                user &&
                user.name.trim().toLowerCase() === name.trim().toLowerCase()
            ) {
                matchedBadge = b;
                matchedUser = user;
                break;
            }
        }

        if (!matchedBadge) {
            return res
                .status(404)
                .json({ message: "Badge not found for this name" });
        }

        // ✅ SUCCESS
        return res.json({
            verifyCode: matchedBadge.verifyCode,
            badgeNumber: matchedBadge.badgeNumber,
            awardedAt: matchedBadge.awardedAt,
            userName: matchedUser.name,
            badge: {
                title: matchedBadge.badgeId.title,
                description: matchedBadge.badgeId.description,
                iconUrl: matchedBadge.badgeId.iconUrl,
            },
        });
    } catch (err) {
        console.error("verifyBadgePublic error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
};

// GET /share/badge/:verifyCode
exports.shareBadgePreview = async (req, res) => {
    const { verifyCode } = req.params;

    const badge = await UserBadge.findOne({ verifyCode })
        .populate("badgeId", "title description iconUrl");

    if (!badge) {
        return res.status(404).send("Invalid badge");
    }

    const user =
        (await mongoose.model("Teacher").findById(badge.userId).select("name")) ||
        (await mongoose.model("Student").findById(badge.userId).select("name"));

    const shareUrl = `https://api.opencs.in/api/badges/share/badge/${verifyCode}`;

    const verifyUrl = `https://opencs.in/verify?verifyCode=${verifyCode}&name=${encodeURIComponent(
        user.name
    )}`;

    const imageUrl = `https://opencs.in${badge.badgeId.iconUrl}`;

    res.set("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${badge.badgeId.title}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${badge.badgeId.title}" />
  <meta property="og:description" content="Awarded to ${user.name} • Verified by Super Teacher EduroForms" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="website" />

  <!-- Optional but recommended -->
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
  <h2>${badge.badgeId.title}</h2>
  <p>Awarded to ${user.name}</p>
  <p>
    <a href="${verifyUrl}">Verify Badge</a>
  </p>
</body>
</html>
  `);
};