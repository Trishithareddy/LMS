const ChapterTest = require("../models/ChapterTest");

exports.createOrUpdateChapterTest = async (req, res) => {
  try {
    const {
      chapterId,
      testType, // QUIZ | SKILL_TEST
      title,
      instructions,
      questionIds,
      passPercentage,
    } = req.body;

    if (!chapterId || !testType || !title) {
      return res.status(400).json({
        message: "chapterId, testType and title are required",
      });
    }

    const test = await ChapterTest.findOneAndUpdate(
      { chapter: chapterId, testType },
      {
        chapter: chapterId,
        testType,
        title,
        instructions,
        questions: questionIds || [],
        passPercentage,
        enabled: true,
      },
      { upsert: true, new: true }
    );

    res.status(200).json(test);
  } catch (err) {
    console.error("createOrUpdateChapterTest error:", err);
    res.status(500).json({ message: "Failed to save chapter test" });
  }
};

exports.getChapterTest = async (req, res) => {
  try {
    const { chapterId, testType } = req.params;

    const test = await ChapterTest.findOne({
      chapter: chapterId,
      testType,
      enabled: true,
    })
      .populate({
        path: "questions",
        populate: { path: "options" },
      });

    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chapter test" });
  }
};
