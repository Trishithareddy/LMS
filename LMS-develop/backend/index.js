const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { archiveOldTeacherBadges } = require("./services/badgeArchiver");

const categoryRoutes = require("./routes/categoryRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const courseRoutes = require("./routes/courseRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const skillTestRoutes = require("./routes/skillTestRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const videoContentRoutes = require("./routes/videoContentRoutes.js");
const questionBaseRoutes = require("./routes/questionBaseRoutes.js");
const reportRoutes = require("./routes/reportRoutes.js");
const badgesRoutes = require("./routes/badgesRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js")
const progressStatusRoutes = require("./routes/progressRoutes.js")
const scratchRoutes = require("./routes/scratchRoutes.js")
const schoolAdminRoutes = require("./routes/schoolAdminRoutes.js");
const quizRoutes = require("./routes/quizRoutes.js")
const path = require('path');
const authRoutes = require("./routes/authRoutes");
const chapterQuizRoutes = require('./routes/chapterQuizRoutes.js')
const savedQuestionPaperRoutes = require("./routes/savedQuestionPaperRoutes.js");
dotenv.config();
const attendanceRoutes = require("./routes/attendanceRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const liveQuizRoutes = require("./routes/liveQuizRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const teacherLessonProgressRoutes = require("./routes/teacherLessonProgressRoutes");
const arduinoRoutes = require("./routes/arduinoRoutes");
const app = express();
app.get("/download", (req, res) => {
  const file = path.join(__dirname, "public/files/Super_Installer.zip");
  res.download(file);
});
// Serve uploaded badge icons
app.use('/badges', express.static(path.join(__dirname, 'public', 'badges')));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8602',
  'http://localhost:5174',
  'https://myailab.opencs.in',
  'https://thinkcs.co',
  'https://www.thinkcs.co',
  'https://www.opencs.in',
  'https://opencs.in'
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin','Cache-Control','Pragma','Expires'],
}));

// reply to *any* preflight
 app.options('*', cors());


app.use(express.json({ limit: '32mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use("/ebooks", express.static(path.join(__dirname, "public", "ebooks")));

mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    dbName: 'lmsDB'  // explicitly specify database name
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    // Auto-archive teacher badges on academic year change (June rollover)
    await archiveOldTeacherBadges();

  })

  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);  // Exit process with failure if connection fails
  });



// Add connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('😴 MongoDB disconnected');
});

// Routes
app.use("/categories", categoryRoutes);
app.use("/subcategories", subcategoryRoutes);
app.use("/courses", courseRoutes);
app.use("/chapters", chapterRoutes);
app.use("/skilltest", skillTestRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/lessons", lessonRoutes);
app.use("/admin", adminRoutes);
app.use("/student", studentRoutes);
app.use("/teacher", teacherRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/arduino", arduinoRoutes);
app.use("/chapters", chapterRoutes);

app.use("/video", videoContentRoutes);
app.use("/questionBase", questionBaseRoutes);
app.use("/question-papers", savedQuestionPaperRoutes);
app.use("/project", projectRoutes);
app.use("/api/projects", projectRoutes);
//app.use("/projects", projectRoutes);
app.use("/api/project", projectRoutes);
app.use("/progress", progressStatusRoutes);
app.use("/scratch", scratchRoutes);
app.use("/school-admin", schoolAdminRoutes);
app.use("/quiz", quizRoutes);
app.use("/live-quiz", liveQuizRoutes);
app.use("/api", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/chapter-quiz",chapterQuizRoutes)
app.use("/attendance", attendanceRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/performance", performanceRoutes);
app.use("/teacher", teacherRoutes);
app.use("/teacher-progress", teacherLessonProgressRoutes);


// Home route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the LMS API!" });
});

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`✅ Server is running on ${process.env.BACKEND_URL || `http://localhost:${port}`}`);
});
