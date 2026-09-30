const Quiz = require("../models/Quiz.js");
const AttemptQuiz = require("../models/AttepmtQuiz.js");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const fs = require("fs");
// helper to validate date strings
function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}

exports.downloadQuizReport = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const match = { quizId: quiz._id };

    const attempts = await AttemptQuiz.find(match)
  .populate({ path: "studentId", select: "name class" })
  .lean();

// Sort students alphabetically by name
attempts.sort((a, b) =>
  (a.studentId?.name || "").localeCompare(
    b.studentId?.name || "",
    undefined,
    { sensitivity: "base" }
  )
);

    const html = await ejs.renderFile(
      path.join(process.cwd(), "views", "quiz_report.ejs"),
      {
        quiz,
        attempts,
        generatedAt: new Date().toLocaleString(),
        rangeText: "All attempts",
      }
    );

const browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ],
});


    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "12mm", right: "12mm" },
    });

    await browser.close();

    // Yahi buffer se tumhara debug_report.pdf bhi banta hai
    // fs.writeFileSync("debug_report.pdf", pdfBuffer);

    // 👉 RAW binary response
    res.status(200);
    res.setHeader("Content-Type", "application/pdf"); // NOTE: charset mat do
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quiz_${quizId}_report.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer); // IMPORTANT: end(buffer), not json/send of an object
  } catch (err) {
    console.error("Error generating quiz report PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
// controller: downloadQuizReport


