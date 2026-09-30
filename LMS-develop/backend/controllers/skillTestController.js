const SkillTest = require("../models/SkillTest");
const Chapter = require("../models/Chapter");
const SkillTestAttempt = require("../models/SkillTestAttempt");
const QuestionBase = require("../models/QuestionBase");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const { evaluateTeacherForBadge } = require("./badgeController");

async function getNextVerifyCode() {
  const last = await UserBadge.findOne({})
    .sort({ verifyCode: -1 })
    .select("verifyCode");

  return last?.verifyCode ? last.verifyCode + 1 : 101;
}


// CREATE
exports.createSkillTest = async (req, res) => {
  try {
    const existing = await SkillTest.findOne({
      chapterId: req.body.chapterId,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Skill Test already exists" });
    }

    const skillTest = await SkillTest.create(req.body);
    res.status(201).json(skillTest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// UPDATE
exports.updateSkillTest = async (req, res) => {
  try {
    const { title, instructions } = req.body;

    const updated = await SkillTest.findByIdAndUpdate(
      req.params.id,
      { title, instructions },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("updateSkillTest error:", err);
    res.status(500).json({ message: err.message });
  }
};


// DELETE
exports.deleteSkillTest = async (req, res) => {
  try {
    await SkillTest.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill Test deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSkillTestByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const studentId = req.user?._id; // ✅ SAFE ACCESS

    const chapter = await Chapter.findById(chapterId)
      .populate({
        path: "skillTest",
        populate: {
          path: "questions",
          model: "QuestionBase",
        },
      })
      .lean();

    if (!chapter || !chapter.skillTest || !chapter.skillTestEnabled) {
      return res.json(null);
    }

    let attempt = null;

    if (studentId) {
      attempt = await SkillTestAttempt.findOne({
        skillTestId: chapter.skillTest._id,
        studentId,
      }).lean();
    }

    return res.json({
      ...chapter.skillTest,
      enabled: chapter.skillTestEnabled,
      attempt: attempt
        ? {
          percentage: attempt.percentage,
          passed: attempt.percentage >= 80,
        }
        : null,
    });
  } catch (err) {
    console.error("getSkillTestByChapter error:", err);
    res.status(500).json({ message: "Failed to fetch skill test" });
  }
};

exports.addQuestionsToSkillTest = async (req, res) => {
  try {
    const { skillTestId, questionIds } = req.body;

    await SkillTest.findByIdAndUpdate(skillTestId, {
      $addToSet: { questions: { $each: questionIds } },
    });

    res.json({ message: "Questions added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSkillTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid SkillTest ID" });
    }

    const skillTest = await SkillTest.findById(id)
      .populate("questions");

    if (!skillTest) {
      return res.status(404).json({ message: "Skill Test not found" });
    }

    res.json(skillTest);
  } catch (err) {
    console.error("getSkillTestById error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSkillTestForAdmin = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const skillTest = await SkillTest.findOne({ chapterId })
      .populate({
        path: "questions",
        model: "QuestionBase",
      })
      .lean();

    if (!skillTest) {
      return res.json(null);
    }

    const chapter = await Chapter.findById(chapterId).lean();

    return res.json({
      ...skillTest,
      enabled: chapter?.skillTestEnabled ?? false,
    });
  } catch (err) {
    console.error("getSkillTestForAdmin error:", err);
    res.status(500).json({ message: "Failed to fetch skill test" });
  }
};

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


/* ---------------- SUBMIT SKILL TEST ATTEMPT ---------------- */
exports.submitSkillTestAttempt = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { skillTestId, answers } = req.body;
    const studentId = req.user._id;

    // ✅ 1️⃣ PREVENT DUPLICATE SUBMISSION
    const existingAttempt = await SkillTestAttempt.findOne({
      skillTestId,
      studentId,
    });

    if (existingAttempt) {
      return res.json({
        success: true,
        alreadySubmitted: true,
        percentage: existingAttempt.percentage,
        passed: existingAttempt.percentage >= 80,
      });
    }

    // ✅ 2️⃣ Load skill test
    const skillTest = await SkillTest.findById(skillTestId);
    if (!skillTest) {
      return res.status(404).json({ message: "Skill Test not found" });
    }

    // ✅ 3️⃣ Calculate score
    const correct = answers.filter(a => a.isCorrect).length;
    const total = answers.length;
    const percentage = Math.round((correct / total) * 100);

    // ✅ 4️⃣ Save attempt
    await SkillTestAttempt.create({
      skillTestId,
      studentId,
      answers,
      score: correct,
      percentage,
      status: "submitted",
    });

    let awardedBadge = null;

    // ✅ 5️⃣ Award STUDENT badge
    if (percentage >= 80) {
      const badge = await Badge.findOne({
        audience: "STUDENT",
        "criteria.type": "SKILL_TEST",
        "criteria.chapterId": skillTest.chapterId,
        "criteria.minPercentage": { $lte: percentage },
      });

      if (badge) {
        const alreadyAwarded = await UserBadge.findOne({
          userId: studentId,
          badgeId: badge._id,
        });

        if (!alreadyAwarded) {
          awardedBadge = await UserBadge.create({
            userId: studentId,
            userRole: "student",
            badgeId: badge._id,
            courseId: skillTest.courseId || null,
            chapterId: skillTest.chapterId,
            academicYear: getAcademicYear(),
            note: "Auto-awarded for skill test",
            verifyCode: await getNextVerifyCode(),
            awardedAt: new Date(),
          });

          // ✅ 6️⃣ TEACHER BADGE — SAFE WRAPPER
          try {
            // find teacher(s) for this student
            const student = await Student.findById(studentId).select("batches");

            if (student?.batches?.length) {
              const batches = await Batch.find({
                _id: { $in: student.batches },
                teachers: { $elemMatch: { role: "PRIMARY" } }
              }).select("teachers");

              const primaryTeachers = batches.flatMap(b =>
                b.teachers.filter(t => t.role === "PRIMARY").map(t => t.teacher)
              );


              for (const teacherId of primaryTeachers) {
                await evaluateTeacherForBadge({
                  teacherId,
                  studentBadgeId: badge._id,
                  courseId: skillTest.courseId,
                  chapterId: skillTest.chapterId,
                });
              }
            }

          } catch (e) {
            console.error("Teacher badge evaluation failed:", e);
            // ❗ DO NOT throw
          }
        }
      }
    }

    // ✅ 7️⃣ ALWAYS RETURN SUCCESS
    return res.json({
      success: true,
      score: correct,
      total,
      percentage,
      badgeAwarded: !!awardedBadge,
      badge: awardedBadge || null,
    });

  } catch (err) {
    console.error("submitSkillTestAttempt error:", err);
    return res.status(500).json({ message: "Skill Test submission failed" });
  }
};


exports.removeQuestionFromSkillTest = async (req, res) => {
  try {
    const { skillTestId, questionId } = req.params;

    const skillTest = await SkillTest.findById(skillTestId);
    if (!skillTest) {
      return res.status(404).json({ message: "Skill Test not found" });
    }

    skillTest.questions = skillTest.questions.filter(
      (q) => q.toString() !== questionId
    );

    await skillTest.save();

    res.json({
      message: "Question removed from skill test",
      questions: skillTest.questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove question" });
  }
};
