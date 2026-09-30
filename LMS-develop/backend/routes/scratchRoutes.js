const express = require("express");
const router = express.Router();

const {
  createScratch,
  getAllScratchProjects,
  getScratchProjectById,
  createScratchDocument,
  updateScratchProjectById,
  updateScratchDocument,
  deleteScratchById,
} = require("../controllerForScratch/scratchController");

const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const eitherOr = require("../middleware/eitherOr");
const upload = require("../middleware/multer");

// ---------- existing routes (unchanged) ----------
router.post(
  "/scratch-cloudinary",
  eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
  upload.fields([{ name: "ScratchImage", maxCount: 1 }, { name: "ScratchFile", maxCount: 1 }]),
  createScratchDocument
);
router.put(
  "/update-scratch-cloudinary",
  eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
  upload.fields([{ name: "ScratchImage", maxCount: 1 }, { name: "ScratchFile", maxCount: 1 }]),
  updateScratchDocument
);

router.post("/create-scratch",  eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), createScratch);
router.get ("/get-scratch",     eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllScratchProjects);
router.get ("/get-scratch-by-id/:id",  eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getScratchProjectById);
router.put ("/update-scratch-by-id/:id", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), updateScratchProjectById);
router.delete("/delete-scratch/:id",     eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deleteScratchById);

// ---------- NEW: public endpoint used by the viewer ----------
const Scratch = require("../models/Scratch"); // <-- adjust path/name to your model

// GET /scratch/chapter/:chapterId
// Returns either JSON {url: "<public sb3 url>"} OR raw .sb3 bytes.
// No auth → so teacher/student can “Open in new tab” without token.
router.get("/chapter/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Find the latest project for this chapter
    const doc = await Scratch.findOne({ chapterId }).sort({ updatedAt: -1 }).lean();
    if (!doc) return res.status(204).end(); // nothing saved yet

    // Prefer a public URL if you save to Cloudinary/S3
    const url =
      doc.scratchFileUrl ||
      doc.ScratchFile?.secure_url ||
      doc.ScratchFile?.url ||
      doc.fileUrl;

    if (url) {
      return res.json({ url }); // viewer will fetch the URL and load into VM
    }

    // If you saved raw bytes/base64 on the doc:
    if (doc.scratchProjectData) {
      const buf = Buffer.isBuffer(doc.scratchProjectData)
        ? doc.scratchProjectData
        : Buffer.from(doc.scratchProjectData, "base64");
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.end(buf);
    }

    return res.status(404).json({ success: false, message: "No file for this chapter" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to load scratch project" });
  }
});

module.exports = router;
