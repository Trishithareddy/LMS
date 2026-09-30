const PracticeProject = require("../models/PracticeProject");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const mongoose = require("mongoose");
const Batch = require("../models/Batch");
const axios = require("axios");

/* Helpers */
const stripDataUrlBase64 = (val) => {
  if (!val) return null;
  const s = String(val);
  return s.includes(",") ? s.split(",")[1] : s;
};
const normalizeOptions = (arr = []) =>
  [...new Set(arr.map((s) => String(s || "").trim().toLowerCase()))];

const getLoggedInUserId = (req) =>
  req.teacher?._id ||
  req.user?._id ||
  req.authUser?._id ||
  req.admin?._id ||
  null;

const prettyToolName = (tool = "") => {
  const normalized = String(tool || "").trim().toLowerCase();
  if (normalized === "js") return "JavaScript";
  if (normalized === "html") return "HTML";
  if (normalized === "css") return "CSS";
  if (normalized === "python") return "Python";
  if (normalized === "scratch") return "Scratch";
  return normalized
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getProjectCodeBundle = (project = {}) => {
  const scratchMeta = project?.codeContent?.scratch?.meta || null;

  return {
    html: project?.codeContent?.html || "",
    css: project?.codeContent?.css || "",
    js: project?.codeContent?.js || "",
    python: project?.codeContent?.python || "",
    scratchMeta,
    hasScratchFile: Boolean(project?.codeContent?.scratch?.sb3Base64),
  };
};

const buildProjectEvaluationContext = (project = {}) => {
  const selectedLanguage = String(
    project?.selectedLanguage || project?.terminalOptions?.[0] || "project",
  )
    .trim()
    .toLowerCase();
  const codeBundle = getProjectCodeBundle(project);

  return {
    projectName: project?.name || "Untitled Project",
    description: project?.description || "",
    toolLabel: prettyToolName(selectedLanguage),
    selectedLanguage,
    terminalOptions: normalizeOptions(project?.terminalOptions || []),
    studentName: project?.createdBy?.name || "Student",
    codeBundle,
  };
};

const localProjectAiraEvaluate = (project = {}) => {
  const context = buildProjectEvaluationContext(project);
  const combinedCode = [
    context.codeBundle.html,
    context.codeBundle.css,
    context.codeBundle.js,
    context.codeBundle.python,
  ]
    .filter(Boolean)
    .join("\n\n");

  const codeLength = combinedCode.trim().length;
  const descriptionLength = context.description.trim().length;
  const hasScratchEvidence =
    context.selectedLanguage === "scratch" && context.codeBundle.hasScratchFile;

  const conceptMatch =
    codeLength > 400 || hasScratchEvidence
      ? "Strong concept application"
      : codeLength > 120 || descriptionLength > 80
        ? "Partial concept application"
        : "Basic concept evidence";

  const completionLevel =
    codeLength > 600 || hasScratchEvidence
      ? "Mostly complete"
      : codeLength > 180 || descriptionLength > 60
        ? "Partially complete"
        : "Needs completion";

  const strengths = [];
  const improvements = [];

  if (hasScratchEvidence) {
    strengths.push(
      "Scratch project file is available for review, so the student has submitted working project evidence.",
    );
  }

  if (codeLength > 200) {
    strengths.push(
      `The ${context.toolLabel} submission includes enough code to review logic and structure.`,
    );
  } else if (descriptionLength > 60) {
    strengths.push(
      "The student has explained the project intent clearly enough for a first review.",
    );
  } else {
    strengths.push("A project attempt is present and ready for teacher follow-up.");
  }

  if (context.selectedLanguage === "python") {
    improvements.push(
      "Ask the student to show clearer output handling, test cases, or sample runs if the program goal is not obvious.",
    );
  } else if (context.selectedLanguage === "html") {
    improvements.push(
      "Check whether layout, styling, and page structure fully match the intended activity outcome.",
    );
  } else if (context.selectedLanguage === "scratch") {
    improvements.push(
      "Review sprite logic, events, and expected interaction flow to confirm the activity objective is fully met.",
    );
  } else {
    improvements.push(
      "Encourage the student to complete any missing logic, polish, or explanation before final teacher review.",
    );
  }

  improvements.push(
    "Ask for clearer output evidence or a short note on what the project is expected to demonstrate if needed.",
  );

  return {
    summary: `${context.studentName} submitted a ${context.toolLabel} project titled "${context.projectName}".`,
    feedback: `AIRA reviewed the ${context.toolLabel} project for concept use, completion, and code clarity. Teacher review is still recommended before final feedback.`,
    conceptMatch,
    completionLevel,
    strengths,
    improvements,
    suggestedTeacherFeedback:
      completionLevel === "Mostly complete"
        ? "Good project attempt. The core idea is visible and the work shows relevant concept usage. A little more refinement can make it stronger."
        : "The project shows a start, but it still needs clearer completion, output evidence, or concept application before it can be considered fully ready.",
    evaluatedAt: new Date(),
  };
};

const callGeminiProjectEvaluation = async (project = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const context = buildProjectEvaluationContext(project);

  const prompt = `
You are AIRA, an LMS project review assistant for school teachers.

Review the submitted student project and return only JSON.

Project:
Title: ${context.projectName}
Description: ${context.description}
Tool: ${context.toolLabel}
Selected Language: ${context.selectedLanguage}
Terminal Options: ${JSON.stringify(context.terminalOptions)}
Student Name: ${context.studentName}

Code / Submission Evidence:
HTML: ${context.codeBundle.html || ""}
CSS: ${context.codeBundle.css || ""}
JavaScript: ${context.codeBundle.js || ""}
Python: ${context.codeBundle.python || ""}
Scratch Meta: ${JSON.stringify(context.codeBundle.scratchMeta || {})}
Scratch File Present: ${context.codeBundle.hasScratchFile ? "yes" : "no"}

Return JSON in this format:
{
  "summary": "1-2 line project review summary",
  "feedback": "overall teacher-facing feedback",
  "conceptMatch": "Strong concept application | Partial concept application | Basic concept evidence",
  "completionLevel": "Mostly complete | Partially complete | Needs completion",
  "strengths": ["point"],
  "improvements": ["point"],
  "suggestedTeacherFeedback": "short final feedback teacher can reuse"
}
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || "",
      feedback: parsed.feedback || "",
      conceptMatch: parsed.conceptMatch || "",
      completionLevel: parsed.completionLevel || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
      suggestedTeacherFeedback: parsed.suggestedTeacherFeedback || "",
      evaluatedAt: new Date(),
    };
  } catch (error) {
    console.error("Gemini AIRA project evaluation failed:", error.message);
    return null;
  }
};

exports.createPracticeProject = async (req, res) => {
  try {
    const userId = req.student?.id;
    if (!userId) return res.status(401).json({ message: "Student not authenticated" });

    let { name, description, terminalOptions = [], codeContent = {}, selectedLanguage, status } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required and must be a string" });
    }

    terminalOptions = normalizeOptions(terminalOptions);
    if (terminalOptions.length === 0) {
      return res.status(400).json({ message: "terminalOptions must be a non-empty array" });
    }

    // sanitize scratch if present
    let scratch = codeContent?.scratch || null;
    if (scratch?.sb3Base64) {
      scratch = {
        sb3Base64: stripDataUrlBase64(scratch.sb3Base64),
        meta: scratch.meta || null,
      };
      // protect against Mongo's 16MB doc limit (~15MB safety)
      const approxBytes = Buffer.byteLength(scratch.sb3Base64, "base64");
      if (approxBytes > 15 * 1024 * 1024) {
        return res.status(413).json({ message: "Scratch file too large (max ~15MB)" });
      }
    }

    const newProject = await PracticeProject.create({
      name,
      description: description || "",
      terminalOptions,
      selectedLanguage: selectedLanguage || terminalOptions[0],
      codeContent: {
        html: codeContent?.html || "",
        css: codeContent?.css || "",
        js: codeContent?.js || "",
        python: codeContent?.python || "",
        scratch, // may be null
      },
      createdBy: userId,
      status: status === "submitted" ? "submitted" : "draft",
      submittedAt: status === "submitted" ? new Date() : undefined,
    });

    return res.status(201).json(newProject);
  } catch (error) {
    console.error("Create Project Error:", error);
    return res.status(500).json({ message: "Error creating project" });
  }
};

exports.getMyPracticeProjects = async (req, res) => {
  try {
    const userId = req.student?.id;
    if (!userId) return res.status(401).json({ message: "Student not authenticated" });

    const projects = await PracticeProject.find({ createdBy: userId }).sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching your projects" });
  }
};

exports.getSubmittedProjectsForTeacher = async (req, res) => {
  try {
    // console.log("request query:", req.query);
    const { page = 1, limit = 10, studentName,grade, section } = req.query;
    const skip = (page - 1) * limit;

    // 1. Find batches taught by the teacher
    const teacherBatches = await Batch.find({ teachers: { $elemMatch: { teacher: req.teacher._id } } });
    if (!teacherBatches.length) {
      return res.status(404).json({ success: false, message: "No batches found for teacher" });
    }


    // 2. Collect all students in those batches
    const studentIds = teacherBatches.flatMap(b => b.students.map(s => s._id));

    let projects = await PracticeProject.find({
      createdBy: { $in: studentIds },
      status: "submitted",
    })
      .populate("createdBy", "name class section")
      .sort({ submittedAt: -1 })

    // 6. Filter by student name and class (in-memory)
    if (studentName) {
      projects = projects.filter(p =>
        p.createdBy?.name?.toLowerCase().includes(studentName.toLowerCase())
      );
    }

    if (grade) {
      projects = projects.filter(p =>
        p.createdBy?.class === grade
      );
    }
    if (section) {
      projects = projects.filter(p =>
        p.createdBy?.section === section
      );
    }
    const totalDoc =  await PracticeProject.countDocuments({
      createdBy: { $in: studentIds },
      status: "submitted",
    });
    // 7. Pagination and response
    const total = projects.length;
    const paginated = projects.slice(skip, skip + Number(limit));


    res.json({
      success: true,
      projects: paginated,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit),
        totalDocuments: totalDoc,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch submitted projects" });
  }
};

exports.getPracticeProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID parameter is required" });

    const project = await PracticeProject.findById(id).populate("createdBy");
    if (!project) return res.status(404).json({ message: "Project not found" });

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching project" });
  }
};

exports.runAiraProjectEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = getLoggedInUserId(req);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid project id is required" });
    }

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized teacher request",
      });
    }

    const project = await PracticeProject.findById(id).populate("createdBy", "name class section");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.status !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Only submitted projects can be evaluated with AIRA",
      });
    }

    const teacherBatches = await Batch.find({
      teachers: { $elemMatch: { teacher: teacherId } },
      students: project.createdBy?._id,
    }).lean();

    if (!teacherBatches.length) {
      return res.status(403).json({
        success: false,
        message: "You can only evaluate projects from your assigned batches",
      });
    }

    const geminiEval = await callGeminiProjectEvaluation(project.toObject());
    const evaluation = geminiEval || localProjectAiraEvaluate(project.toObject());

    project.airaEvaluation = evaluation;
    await project.save();

    return res.status(200).json({
      success: true,
      message: "AIRA project evaluation completed",
      evaluation,
      project,
    });
  } catch (error) {
    console.error("Error running AIRA project evaluation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run AIRA project evaluation",
      error: error.message,
    });
  }
};

exports.saveTeacherProjectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = getLoggedInUserId(req);
    const { feedback = "", status = "reviewed" } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid project id is required",
      });
    }

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized teacher request",
      });
    }

    const project = await PracticeProject.findById(id).populate(
      "createdBy",
      "name class section",
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const teacherBatches = await Batch.find({
      teachers: { $elemMatch: { teacher: teacherId } },
      students: project.createdBy?._id,
    }).lean();

    if (!teacherBatches.length) {
      return res.status(403).json({
        success: false,
        message: "You can only review projects from your assigned batches",
      });
    }

    const nextStatus = ["reviewed", "needs_revision"].includes(status)
      ? status
      : "reviewed";

    project.teacherReview = {
      feedback: String(feedback || "").trim(),
      status: nextStatus,
      reviewedAt: new Date(),
      reviewedBy: teacherId,
    };

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Teacher project feedback saved",
      teacherReview: project.teacherReview,
      project,
    });
  } catch (error) {
    console.error("Error saving teacher project review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save teacher feedback",
      error: error.message,
    });
  }
};

exports.updatePracticeProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.student?.id;
    const { name, description, terminalOptions, codeContent, status } = req.body;

    const project = await PracticeProject.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!userId || project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this project" });
    }
    const canReviseSubmittedProject =
      project.status === "submitted" &&
      project.teacherReview?.status === "needs_revision";

    if (project.status === "submitted" && !canReviseSubmittedProject) {
      return res.status(400).json({ message: "Cannot update a submitted project" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (Array.isArray(terminalOptions)) project.terminalOptions = normalizeOptions(terminalOptions);

    if (codeContent) {
      // keep existing fields unless explicitly set
      const next = { ...project.codeContent.toObject(), ...codeContent };

      // sanitize scratch if present
      if (next?.scratch?.sb3Base64) {
        next.scratch = {
          sb3Base64: stripDataUrlBase64(next.scratch.sb3Base64),
          meta: next.scratch.meta || null,
        };
        const approxBytes = Buffer.byteLength(next.scratch.sb3Base64, "base64");
        if (approxBytes > 15 * 1024 * 1024) {
          return res.status(413).json({ message: "Scratch file too large (max ~15MB)" });
        }
      }
      project.codeContent = next;
    }

    if (status && ["draft", "submitted"].includes(status)) {
      project.status = status;
      if (status === "submitted") project.submittedAt = new Date();
    } else if (canReviseSubmittedProject) {
      project.status = "draft";
    }

    const updated = await project.save();
    return res.status(200).json({
      message: canReviseSubmittedProject
        ? "Project revision saved. Submit again once your changes are ready."
        : "Project updated",
      project: updated,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({ message: "Error updating project" });
  }
};

exports.submitPracticeProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await PracticeProject.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "submitted";
    project.submittedAt = new Date();
    await project.save();

    return res.status(200).json({ message: "Project submitted successfully", project });
  } catch (error) {
    console.error("Submit Project Error:", error);
    return res.status(500).json({ message: "Submission failed" });
  }
};

exports.deletePracticeProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID parameter is required" });

    const deleted = await PracticeProject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting project" });
  }
};
