const Project = require("../models/Project.js");
const Teacher = require("../models/Teacher");
const Batch = require("../models/Batch.js")
const Chapter = require("../models/Chapter.js")
const Course = require("../models/Course.js")

const approxMbFromBase64 = (b64 = "") => (b64.length * 0.75) / (1024 * 1024);


exports.createOrUpdateProject = async (req, res) => {
  try {
    const {
      name,
      description,
      terminalOptions,
      codeContent = {},
      chapter,
      student,
      clearScratch = false // ← optional flag to explicitly clear saved Scratch
    } = req.body;

    // size guard for sb3
    if (codeContent?.scratch?.sb3Base64) {
      const sizeMb = approxMbFromBase64(codeContent.scratch.sb3Base64);
      if (sizeMb > 20) {
        return res
          .status(413)
          .json({ success: false, message: "Scratch file too large (>20MB)" });
      }
    }

    // Always set these code fields (default to empty strings)
    const setFields = {
      name,
      description,
      terminalOptions,
      chapter,
      "codeContent.html": codeContent.html ?? "",
      "codeContent.css": codeContent.css ?? "",
      "codeContent.js": codeContent.js ?? "",
      "codeContent.python": codeContent.python ?? ""
    };

    // Scratch update rules:
    // - If a fresh export arrived (has sb3Base64): overwrite saved scratch
    // - Else if clearScratch === true: remove it
    // - Else: DO NOTHING (preserve existing)
    if (codeContent?.scratch?.sb3Base64) {
      setFields["codeContent.scratch"] = {
        sb3Base64: codeContent.scratch.sb3Base64,
        meta: codeContent.scratch.meta ?? null
      };
    } else if (clearScratch === true) {
      setFields["codeContent.scratch"] = null;
    }

    // Upsert by (student, chapter)
    const filter = { student, chapter };
    const options = { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true };

    const project = await Project.findOneAndUpdate(filter, { $set: setFields }, options);

    return res.status(200).json({
      success: true,
      message: project?.wasNew ? "Project created successfully" : "Project updated successfully",
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in creating/updating project",
      error: error.message
    });
  }
};


exports.getTeacherProjects = async (req, res) => {
    try {
        // Get teacher from middleware
        const teacher = req.teacher;
        
        if (!teacher) {
            return res.status(401).json({
                success: false,
                message: "Teacher not authenticated",
            });
        }
        
        // Find batches that have this teacher assigned
        const batches = await Batch.find({ teachers: teacher._id });
        
        if (!batches || batches.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No batches assigned to this teacher",
                data: [],
                count: 0
            });
        }
        
        // Extract course IDs from batches
        let courseIds = [];
        batches.forEach(batch => {
            if (batch.courses && batch.courses.length > 0) {
                courseIds = [...courseIds, ...batch.courses];
            }
        });
        
        if (courseIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No courses in teacher's batches",
                data: [],
                count: 0
            });
        }
        
        // Find chapters in these courses
        const chapters = await Chapter.find({ course: { $in: courseIds } });
        const chapterIds = chapters.map(chapter => chapter._id);
        
        if (chapterIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No chapters in teacher's courses",
                data: [],
                count: 0
            });
        }
        
        // Find projects for these chapters
        const projects = await Project.find({ chapter: { $in: chapterIds } })
            .populate("chapter", "name")
            .populate("student")
            .sort({ projectId: 1 });
        
        return res.status(200).json({
            success: true,
            message: "Teacher's projects fetched successfully",
            data: projects,
            count: projects.length,
        });
    } catch (error) {
        console.error("Error in fetching teacher's projects:", error);
        return res.status(500).json({
            success: false,
            message: "Error in fetching teacher's projects",
            error: error.message,
        });
    }
};

exports.getProjectByStudentAndChapter = async (req, res) => {
    try {
        const { studentId, chapterId } = req.params;

        const project = await Project.findOne({
            student: studentId,
            chapter: chapterId,
        });

        // Always return success, but project might be null
        res.status(200).json({
            success: true,
            message: project
                ? "Project fetched successfully"
                : "No project found",
            data: project, // Will be null if no project exists
            exists: !!project, // Boolean flag to indicate if project exists
        });
    } catch (error) {
        // Only send error for actual server/DB errors
        res.status(500).json({
            success: false,
            message: "Error fetching project",
            error: error.message,
        });
    }
};

exports.getProjectsByStudent = async (req, res) => {
    try {
        const studentId = req.student._id;
        const projects = await Project.find({ student: studentId })
            .populate("chapter", "name course courseName")
            .populate("student", "name")
            .sort({ projectId: 1 });

        // Return success with empty array if no projects
        res.status(200).json({
            success: true,
            message: projects.length
                ? "Projects fetched successfully"
                : "No projects found for this student",
            data: projects, // This will be an empty array if no projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in fetching student projects",
            error: error.message,
        });
    }
};

exports.getProjectByTeacher = async (req, res) => {
    try {
        const { batchId, courseId, chapterId } = req.params;
        const teacherId = req.teacher._id;

        // Validate that all required parameters are present
        if (!batchId || !courseId || !chapterId) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters: batchId, courseId, or chapterId"
            });
        }

        // Find teacher and verify batch belongs to them
        const teacher = await Teacher.findOne({ 
            _id: teacherId,
            batches: batchId 
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher or batch not found"
            });
        }

        // Get the batch with its students
        const batch = await Batch.findOne({
            _id: batchId,
            courses: courseId
        }).populate('students', 'name username studentId');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch or course not found"
            });
        }

        // Verify chapter belongs to course
        const chapter = await Chapter.findOne({
            _id: chapterId,
            course: courseId
        }).populate('course', 'name');

        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found or does not belong to the specified course"
            });
        }

        // Fetch all projects that match the criteria
        const projects = await Project.find({
            student: { $in: batch.students.map(student => student._id) },
            chapter: chapterId
        }).populate('student', 'name username studentId')
          .populate('chapter')
          .sort({ createdAt: -1 });

        // Organize the data for response
        const formattedProjects = projects.map(project => ({
            projectId: project.projectId,
            studentName: project.student.name,
            studentId: project.student.studentId,
            name: project.name,
            description: project.description,
            chapterName: project.chapter.name,
            terminalOptions: project.terminalOptions,
            codeContent: project.codeContent,
            createdAt: project.createdAt,
            htmlContent: project.codeContent.html,
            cssContent: project.codeContent.css,
            jsContent: project.codeContent.js,
            pythonContent: project.codeContent.python
        }));

        return res.status(200).json({
            success: true,
            data: {
                batchInfo: {
                    name: batch.batchName,
                    id: batch._id
                },
                courseInfo: {
                    name: chapter.course.name,
                    id: courseId
                },
                chapterInfo: {
                    name: chapter.name,
                    id: chapter._id
                },
                totalProjects: projects.length,
                projects: formattedProjects
            }
        });

    } catch (error) {
        console.error("Error in getProjectsForTeacherStudents:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// --- SCRATCH .sb3 binary endpoints (file store) ---
const path = require("path");
const fs = require("fs");

const SB3_DIR = path.join(__dirname, "..", "uploads", "projects");
fs.mkdirSync(SB3_DIR, { recursive: true });

/**
 * PUT /api/projects/:id.sb3
 * Body: raw application/octet-stream (the .sb3 bytes)
 */
exports.putSb3 = async (req, res, next) => {
  try {
    // defend against accidental query strings in :id
    const rawId = req.params.id || "";
    const id = rawId.split("?")[0];

    const filePath = path.join(SB3_DIR, `${id}.sb3`);

    // req.body is a Buffer because of express.raw()
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ ok: false, message: "Expected raw .sb3 bytes" });
    }

    await fs.promises.writeFile(filePath, req.body);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("putSb3 failed:", e);
    return res.status(500).json({ ok: false, message: "putSb3 failed" });
  }
};

/**
 * GET /api/projects/:id.sb3
 * Streams the .sb3 back
 */
exports.getSb3 = async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(SB3_DIR, `${id}.sb3`);
    if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${id}.sb3"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error("getSb3 failed:", e);
    return res.status(500).send("getSb3 failed");
  }
};
