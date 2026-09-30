

const lessonController = require("../controllers/lessonController");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Lesson = require("../models/Lesson");
const Chapter = require("../models/Chapter");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const eitherOr = require("../middleware/eitherOr");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const os = require("os");
const path = require("path");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

const pptUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, os.tmpdir());
        },
        filename: function (req, file, cb) {
            const safeName = `${Date.now()}-${file.originalname}`.replace(
                /[^a-zA-Z0-9._-]/g,
                "_",
            );
            cb(null, safeName);
        },
    }),
    limits: {
        fileSize: 64 * 1024 * 1024,
    },
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname || "").toLowerCase();
        if (![".ppt", ".pptx"].includes(ext)) {
            return cb(new Error("Only .ppt and .pptx files are supported"));
        }
        cb(null, true);
    },
});


const pdfUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, os.tmpdir());
        },
        filename: function (req, file, cb) {
            const safeName = `${Date.now()}-${file.originalname}`.replace(
                /[^a-zA-Z0-9._-]/g,
                "_",
            );
            cb(null, safeName);
        },
    }),
    limits: {
        fileSize: 64 * 1024 * 1024,
    },
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname || "").toLowerCase();

        if (ext !== ".pdf") {
            return cb(new Error("Only PDF files are supported"));
        }

        cb(null, true);
    },
});

router.post("/upload-image",upload.single("files[0]"), async (req, res) => {
    console.log("Received upload request");

    if (!req.file) {
        return res.status(400).json({
            success: false,
            messages: ["No file uploaded"],
        });
    }

    try {
        const fileStr = req.file.buffer.toString("base64");
        const fileType = req.file.mimetype;

        const uploadResponse = await cloudinary.uploader.upload(
            `data:${fileType};base64,${fileStr}`,
            {
                folder: "editor_uploads",
            }
        );

        res.json({
            success: true,
            messages: ["File uploaded successfully"],
            data: {
                files: [uploadResponse.secure_url],
                isImages: [true],
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            messages: [error.message || "Error uploading file"],
        });
    }
});

router.post(
    "/import-ppt",
    authMiddleware,
    pptUpload.single("ppt"),
    lessonController.importLessonPpt,
);

router.post(
    "/import-pdf",
    authMiddleware,
    pdfUpload.single("pdf"),
    lessonController.importLessonPdf,
);

// Create a new lesson
router.post("/addlesson",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonController.addLesson);

// Update an existing lesson
router.put("/lessons/:lessonId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonController.updateLesson);

// Get lessons by chapter ID
router.get("/lessons/:chapterId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonController.getLessonsByChapter);

// get a particular lesson by id
router.get("/:id",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonController.getLessonById);

// delete a lesson
router.delete("/deletelesson/:lessonId", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),lessonController.deleteLesson);

router.delete("/:lessonId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonController.deleteLesson);

module.exports = router;
