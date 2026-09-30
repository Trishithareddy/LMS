// controllers/teacherController.js
//const Assignment = require('../models/Assignment');
//const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const dotenv = require('dotenv');
const Batch = require('../models/Batch')
const Quiz = require('../models/Quiz');
const Course = require('../models/Course')
const mongoose = require('mongoose');
const Student = require('../models/Student');
const School = require("../models/School")
const Announcement = require("../models/Announcement")
const PracticeProject = require("../models/PracticeProject");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Attendance = require("../models/Attendance");
const AttemptQuiz = require("../models/AttepmtQuiz");
const ChapterQuizAttempt = require("../models/ChapterwiseQuizAttempt");
const StudentCourseProgress = require("../models/studentCourseProgress");
const StudentChapterProgress = require("../models/studentChapterProgress");
let Project = null;                      // optional: load if it exists
try { Project = require("../models/Project"); } catch (_) { Project = null; }




dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const buildStudentLookup = (studentId) => {
  const lookupConditions = [];
  const numericStudentId = Number(studentId);

  if (Number.isInteger(numericStudentId) && String(numericStudentId) === String(studentId).trim()) {
    lookupConditions.push({ studentId: numericStudentId });
  }

  if (mongoose.Types.ObjectId.isValid(studentId)) {
    lookupConditions.push({ _id: studentId });
  }

  if (lookupConditions.length === 0) return null;

  return lookupConditions.length === 1
    ? lookupConditions[0]
    : { $or: lookupConditions };
};

exports.loginTeacher = async (req, res) => {
  const { username, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ username });
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }
    // BLOCKED CHECK
    if (!teacher.isActive) {
      return res.status(403).json({ success: false, message: "Your account is blocked by the school administrator" });
    }
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    teacher.lastLogin = new Date();
    await teacher.save();


    const token = jwt.sign({ id: teacher._id, role: "Teacher" }, JWT_SECRET, { expiresIn: '6h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};



//get info of logged in student
exports.getTeacherInfo = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate('batches', 'batchName _id batchId imageUrl')
      .populate('school', 'name imageUrl');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const { name, username, age, school, address, batches } = teacher;

    const formattedBatches = batches.map(batch => ({
      _id: batch._id,
      batchName: batch.batchName,
      batchId: batch.batchId,
      batchImageUrl: batch.imageUrl
    }));

    const teacherDetails = { name, username, age, school, address, batches: formattedBatches };

    res.json({ teacher: teacherDetails });
  } catch (error) {
    console.error('Error retrieving teacher:', error);
    res.status(500).json({ message: 'Error retrieving teacher details' });
  }
};
exports.getBatchBasicInfo = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .select("batchName students courses")
      .populate("students", "name") // only name
      .populate("courses", "name imageUrl"); // no chapters ❌

    res.json({ batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBatchInfo = async (req, res) => {
  // accept either :id or :batchId1
  const id = req.params.id || req.params.batchId1;

  try {
    const teacherSchoolName = await Teacher.findById(req.teacher._id)
      .populate("school", "name schoolId");

    const teacherMongoDbId = req.teacher._id;
    const { name, schoolId } = teacherSchoolName.school;

    const q = Batch.findById(id)
      .populate('students', 'name age username class section lastLogin')
      .populate('teachers', 'teacherId name username school')
      .populate({
        path: 'courses',
        populate: {
          path: 'chapters',
          model: 'Chapter',
          populate: { path: 'lessons', model: 'Lesson' }
        }
      });

    // ❌ DO NOT populate "projects" — it's not in the schema.
    // If you ever add it later, you can conditionally populate like this:
    // if (Batch.schema.path('projects')) {
    //   q.populate({ path: 'projects', select: 'title updatedAt' });
    // }

    // Be tolerant to any other missing paths
    q.setOptions({ strictPopulate: false });

    const batch = await q.lean();
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

     const now = new Date();

const studentsWithStatus = (batch.students || []).map((s) => {
  let status = "Inactive";

  if (s.lastLogin) {
    const diffDays =
      (now - new Date(s.lastLogin)) / (1000 * 60 * 60 * 24);

    if (diffDays <= 15) {
      status = "Active";
    }
  }

  return {
    ...s,
    status,
  };
});

    const { _id, batchId, batchName, teachers, courses } = batch;

    // classes from students
    const uniqueClasses = [...new Set((batch.students || []).map(s => s.class))];

    

    const batchDetails = {
      teacherMongoDbId,
      uniqueClasses,
      name, schoolId,
      batchId, _id, batchName,
      students: studentsWithStatus, teachers, courses
    };

    res.json({ batch: batchDetails });
  } catch (error) {
    console.error('Error retrieving batch:', error);
    res.status(500).json({ message: 'Error retrieving batch details' });
  }
};



const mkUpdate = (when, title, body = "") => ({
  when: when ? new Date(when) : new Date(),
  title,
  body,
});


const grabId = (x) => {
  if (!x) return null;
  if (typeof x === 'string') return x;
  if (x._id) return String(x._id);
  const y = x.student ?? x.studentId ?? x.user ?? x.userId ?? x.id;
  return y ? (typeof y === 'object' && y._id ? String(y._id) : String(y)) : null;
};

exports.getTeacherOverview = async (req, res) => {
  try {
    const teacherId = req.teacher?._id;
    if (!teacherId) return res.status(401).json({ error: "Unauthorized" });

    // 1️⃣ Teacher + batches
    const teacher = await Teacher.findById(teacherId)
      .populate("batches", "_id batchName")
      .lean();

    const batches = teacher?.batches || [];
    const batchIds = batches.map(b => b._id);
    const batchNameMap = Object.fromEntries(
      batches.map(b => [String(b._id), b.batchName])
    );

    // 2️⃣ Students
    const students = await Student.find({ batches: { $in: batchIds } })
      .select("_id name batches")
      .lean();

    const studentIds = students.map(s => s._id);

    const studentBatchMap = {};
    students.forEach(s => {
      const bid = (s.batches || []).find(b => batchNameMap[String(b)]);
      if (bid) studentBatchMap[String(s._id)] = batchNameMap[String(bid)];
    });

    // 3️⃣ Project submissions
    const projects = await PracticeProject.find({
  createdBy: { $in: studentIds },
  status: "submitted"
})
.populate("createdBy", "name")
.sort({ submittedAt: -1 })
// .limit(100)
.lean();
let projectEvents = [];
projectEvents = projects.map(p => ({
  type: "project",
  when: p.submittedAt || p.createdAt,
  studentName: p.createdBy?.name || "Student",
  projectTitle: p.name,
  batchName: studentBatchMap[String(p.createdBy?._id)] || ""
}));
    // 4️⃣ Quiz attempts
    const batchesFull = await Batch.find({ _id: { $in: batchIds } })
      .populate({
        path: "quizzes",
        select: "title attempts submissions responses createdAt updatedAt"
      })
      .lean();

    const quizEvents = [];
    const quizStudents = new Set();

    batchesFull.forEach(b => {
      (b.quizzes || []).forEach(q => {
        const arr = q.attempts || q.submissions || q.responses || [];
        arr.forEach(a => {
          const sid = a.student || a.studentId || a.user || a.userId;
          if (!sid) return;

          quizStudents.add(String(sid));

          quizEvents.push({
            type: "quiz",
            when: a.createdAt || q.updatedAt || q.createdAt,
            studentName: "Student",
            quizTitle: q.title,
            batchName: b.batchName
          });
        });
      });
    });
// 5️⃣ Announcements
const announcements = await Announcement.find({
  batches: { $in: batchIds }
})
.sort({ createdAt: -1 })
.limit(10)
.lean();

const announcementEvents = announcements.map(a => ({
  type: "announcement",
  when: a.createdAt,
  title: a.title || a.announcementContent || ""
}));
    // 6️⃣ Latest updates
    const latestProjects = projectEvents
  .sort((a,b)=> new Date(b.when)-new Date(a.when))
  .slice(0,3);

const latestQuizzes = quizEvents
  .sort((a,b)=> new Date(b.when)-new Date(a.when))
  .slice(0,3);

const latestAnnouncements = announcementEvents
  .sort((a,b)=> new Date(b.when)-new Date(a.when))
  .slice(0,3);

const updates = [
  ...latestProjects,
  ...latestQuizzes,
  ...latestAnnouncements
].sort((a,b)=> new Date(b.when)-new Date(a.when));

    return res.json({
      name: teacher.name,
      counts: {
        batches: batches.length,
        students: students.length,
        quizAttempts: quizStudents.size,
        projectSubmissions: projectEvents.length,
        pendingAssessments: 0,
        upcomingDeadlines: 0
      },
      updates
    });

  } catch (err) {
    console.error("Teacher overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// update the course published section
exports.updateCoursePublishedStatus = async (req, res) => {
  const courseId = req.params.id;
  const { published } = req.body;

  try {
    // Find the course by ID
    let course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Ensure only the published field is updated by teacher
    course.published = published;
    await course.save();

    res.status(200).json({ message: 'Course published status updated successfully', course });
  } catch (error) {
    console.error('Error updating course published status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



// get all student from teachers batch
exports.getStudentsFromTeacherBatches = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id).populate(
      "batches",
      "_id"
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
 
    const batches = teacher.batches;

    let allStudents = [...batches];

    for (const batch of batches) {
      const populatedBatch = await Batch.findById(batch._id).populate({
        path: "students",
        select: "name username school class section fatherName courses",
        populate: {
          path: "school", // Populates the 'school' field from the 'School' model
          select: "name", // Specify which fields you want from the 'School' model
        },
        populate: {
          path: "courses", // Populates the 'school' field from the 'School' model
          select: "_id", // Specify which fields you want from the 'School' model
          match: { ...batches }
        },
      });

      if (populatedBatch && populatedBatch.students.length > 0) {
        allStudents = allStudents.concat(populatedBatch.students);
      }
    }

    // Remove duplicate students based on 'username' using filter and findIndex
    const uniqueStudents = allStudents.filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.username === student.username)
    );

    res.status(200).json(uniqueStudents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



// Function to get all students by teacher ID
exports.getStudentsByTeacherId = async (req, res) => {

  try {
    const teacherId = req.teacher._id

    if (!teacherId) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    // Step 1: Find the teacher and populate the batches field
    const teacher = await Teacher.findById(teacherId).populate('batches', '_id');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Extract batch IDs from the teacher's batches
    const batchIds = teacher.batches.map(batch => batch._id);

    const batchesCourses = await Batch.find({ _id: { $in: batchIds } })
      .select("courses")
      .exec();

    const allCourses = batchesCourses.flatMap(batch => batch.courses);

    const uniqueCourses = Array.from(new Set(allCourses.map(id => id.toString())))
      .map(id => new mongoose.Types.ObjectId(id));





    // Step 2: Find all batches with these IDs and populate the students field
    const batches = await Batch.find({ _id: { $in: batchIds } })
      .select("batchId")
      .populate({
        path: "students",
        select: "studentId name username school class section fatherName courses updatedAt password",
        populate: [
          {
            path: "batches",
            select: "batchId batchName courses"
          },
          {
            path: "school",
            select: "name schoolId"
          },
          {
            path: "courses",
            select: "courseId name",
            match: { _id: { $in: uniqueCourses } }
          }
        ]

      });

    // Extract students from batches

    // const students = batches.flatMap(batch => batch.students);

    const students = batches.flatMap(batch =>
      batch.students.map(student => ({
        _id: student._id,
        batchId: batch.batchId,
        batchCourses: batch.courses,
        batchName: batch.batchName,
        studentId: student.studentId,
        batches: student.batches,           // Include batchId from the batch
        name: student.name,
        password: student.password,
        updatedAt: student.updatedAt,
        username: student.username,
        courses: student.courses,
        school: student.school ? [{
          schoolId: student.school.schoolId,          // Check if school is populated
          id: student.school._id,             // Include school id
          name: student.school.name           // Include school name
        }] : [],          // Include school name if populated
        class: student.class,
        section: student.section,
        fatherName: student.fatherName,
        // Include courses (if populated)
      }))
    );
   
    // Remove duplicate students based on 'username'
    const uniqueStudents = students.filter((student, index, self) =>
      index === self.findIndex((s) => s.username === student.username)
    );
 


    res.status(200).json(uniqueStudents);
  } catch (error) {
    console.error('Error retrieving students by teacher ID:', error);
    res.status(500).json({ message: 'Error retrieving students', error });
  }
};

exports.getBatchId = async (req, res) => {
 
  const { batchId } = req.params;




  try {
    const teacherId = req.teacher._id


    if (!teacherId) {
      return res.status(404).json({ message: "Teacher not found" });
    }




    // Step 2: Find all batches with these IDs and populate the students field
    const batches = await Batch.findOne({ batchId: batchId });





    res.status(200).json(batches);
  } catch (error) {
    console.error('Error retrieving students by teacher ID:', error);
    res.status(500).json({ message: 'Error retrieving students', error });
  }
}


// update the student details

exports.viewStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const userId = req.teacher?._id || req.admin?._id || req.student?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentQuery = buildStudentLookup(studentId);

    if (!studentQuery) {
      return res.status(400).json({ message: "Invalid student identifier" });
    }

    const student = await Student.findOne(studentQuery)
      .populate({
        path: "school",
        select: "name schoolId",
      })
      .populate({
        path: "batches",
        select: "_id batchId batchName"
      })
      .populate({
        path: "courses",
        select: "_id courseId name"
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const responseData = {
      studentId: student.studentId,
      name: student.name,
      fatherName: student.fatherName,
      username: student.username,
      class: student.class,
      section: student.section,
      address: student.address,
      contact: student.contact,
      age: student.age,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      school: student.school ? student.school.name : "N/A",
      schoolId: student.school ? student.school.schoolId : "N/A",
      batches: (student.batches || []).map(batch => ({
        _id: batch._id,
        batchId: batch.batchId,
        batchName: batch.batchName
      })),
      courses: (student.courses || []).map(course => ({
        _id: course._id,
        courseId: course.courseId,
        name: course.name
      })),
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error retrieving student details:', error);
    res.status(500).json({ message: 'Error retrieving student', error });
  }
};

exports.getStudentInsights = async (req, res) => {
  const { studentId } = req.params;

  try {
    const studentQuery = buildStudentLookup(studentId);

    if (!studentQuery) {
      return res.status(400).json({ message: "Invalid student identifier" });
    }

    const student = await Student.findOne(studentQuery)
      .populate({
        path: "batches",
        select: "_id batchId batchName"
      })
      .populate({
        path: "courses",
        select: "_id courseId name courseExpectedtime chapters",
        populate: {
          path: "chapters",
          select: "_id name chapterExpectedtime EbookExpectedtime videoExpectedtime"
        }
      })
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (req.teacher?._id) {
      const teacher = await Teacher.findById(req.teacher._id).select("batches").lean();
      const teacherBatchIds = (teacher?.batches || []).map((batch) => String(batch));
      const studentBatchIds = (student.batches || []).map((batch) => String(batch._id || batch));
      const canViewStudent = studentBatchIds.some((batchId) => teacherBatchIds.includes(batchId));

      if (!canViewStudent) {
        return res.status(403).json({ message: "You can only view students from your batches" });
      }
    }

    if (req.student?._id && String(req.student._id) !== String(student._id)) {
      return res.status(403).json({ message: "You can only view your own insights" });
    }

    const courseIds = (student.courses || []).map((course) => course._id);
    const chapterIds = (student.courses || []).flatMap((course) =>
      (course.chapters || []).map((chapter) => chapter._id)
    );

    const [
      courseProgress,
      chapterProgress,
      attendanceList,
      assignmentSubmissions,
      practiceProjects,
      quizAttempts,
      chapterQuizAttempts,
    ] = await Promise.all([
      StudentCourseProgress.find({
        studentId: student._id,
        courseId: { $in: courseIds },
      }).lean(),
      StudentChapterProgress.find({
        studentId: student._id,
        chapterId: { $in: chapterIds },
      }).lean(),
      Attendance.find({ "records.studentId": student._id })
        .sort({ date: -1 })
        .limit(30)
        .lean(),
      AssignmentSubmission.find({ studentId: student._id })
        .sort({ submittedAt: -1 })
        .limit(10)
        .populate("assignmentId", "title taskType assignmentType totalMarks dueDate")
        .lean(),
      PracticeProject.find({ createdBy: student._id })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      AttemptQuiz.find({ studentId: student._id })
        .sort({ submittedAt: -1 })
        .limit(10)
        .populate("quizId", "title totalMarks passingPercentage")
        .lean(),
      ChapterQuizAttempt.find({ studentId: student._id })
        .sort({ submittedAt: -1 })
        .limit(10)
        .populate("ChapterquizId", "title totalMarks passingPercentage")
        .lean(),
    ]);

    const courseProgressMap = new Map(
      courseProgress.map((progress) => [String(progress.courseId), progress])
    );
    const chapterProgressMap = new Map(
      chapterProgress.map((progress) => [String(progress.chapterId), progress])
    );

    const courses = (student.courses || []).map((course) => {
      const progress = courseProgressMap.get(String(course._id));
      const expectedTime = Number(course.courseExpectedtime || 0);
      const spentTime = Number(progress?.courseUTS || 0);
      const percent = expectedTime > 0
        ? Math.min(100, Math.round((spentTime / expectedTime) * 100))
        : 0;

      return {
        _id: course._id,
        courseId: course.courseId,
        name: course.name,
        expectedTime,
        spentTime,
        percent,
        chapters: (course.chapters || []).map((chapter) => {
          const chapterStatus = chapterProgressMap.get(String(chapter._id));
          const chapterExpectedTime = Number(chapter.chapterExpectedtime || 0);
          const chapterSpentTime = Number(chapterStatus?.chapterUTS || 0);

          return {
            _id: chapter._id,
            name: chapter.name,
            expectedTime: chapterExpectedTime,
            spentTime: chapterSpentTime,
            ebookTime: Number(chapterStatus?.EbookUTS || 0),
            videoTime: Number(chapterStatus?.videoUTS || 0),
            percent: chapterExpectedTime > 0
              ? Math.min(100, Math.round((chapterSpentTime / chapterExpectedTime) * 100))
              : 0,
          };
        }),
      };
    });

    const attendanceRecords = [];
    const attendanceSummary = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    attendanceList.forEach((attendance) => {
      const record = (attendance.records || []).find(
        (item) => String(item.studentId) === String(student._id)
      );

      if (!record) return;

      attendanceSummary.total += 1;
      attendanceSummary[record.status] = (attendanceSummary[record.status] || 0) + 1;
      attendanceRecords.push({
        date: attendance.date,
        batchName: attendance.batchName,
        className: attendance.className,
        section: attendance.section,
        status: record.status,
        markedBy: record.markedBy,
        loginTime: record.loginTime,
        remarks: record.remarks,
      });
    });

    if (attendanceSummary.total > 0) {
      attendanceSummary.percentage = Math.round(
        ((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100
      );
    }

    const assignments = assignmentSubmissions.map((submission) => ({
      _id: submission._id,
      title: submission.assignmentId?.title || "Assignment",
      type: submission.assignmentId?.assignmentType || submission.assignmentId?.taskType || "",
      status: submission.status,
      submittedAt: submission.submittedAt,
      finalMarks: submission.finalMarks,
      suggestedMarks: submission.airaEvaluation?.suggestedMarks,
      feedback: submission.teacherComment || submission.airaEvaluation?.feedback || "",
      isLate: submission.isLate,
    }));

    const projects = practiceProjects.map((project) => ({
      _id: project._id,
      name: project.name,
      status: project.status,
      language: project.selectedLanguage,
      submittedAt: project.submittedAt,
      updatedAt: project.updatedAt,
      reviewStatus: project.teacherReview?.status || "not_reviewed",
      feedback: project.teacherReview?.feedback || project.airaEvaluation?.feedback || "",
    }));

    const quizzes = [
      ...quizAttempts.map((attempt) => ({
        _id: attempt._id,
        title: attempt.quizId?.title || "Quiz",
        score: attempt.score,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        submittedAt: attempt.submittedAt,
        type: "Quiz",
      })),
      ...chapterQuizAttempts.map((attempt) => ({
        _id: attempt._id,
        title: attempt.ChapterquizId?.title || "Chapter Quiz",
        score: attempt.score,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        submittedAt: attempt.submittedAt,
        type: "Chapter Quiz",
      })),
    ].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)).slice(0, 10);

    const averageCourseProgress = courses.length
      ? Math.round(courses.reduce((sum, course) => sum + course.percent, 0) / courses.length)
      : 0;
    const needsFollowUp = [];

    if (!student.lastLogin) {
      needsFollowUp.push("No login recorded yet");
    }

    if (averageCourseProgress < 30 && courses.length > 0) {
      needsFollowUp.push("Course progress is below 30%");
    }

    if (attendanceSummary.total > 0 && attendanceSummary.percentage < 75) {
      needsFollowUp.push("Attendance is below 75%");
    }

    if (assignments.some((assignment) => assignment.status === "needs_correction")) {
      needsFollowUp.push("Assignment needs correction");
    }

    if (projects.some((project) => project.reviewStatus === "needs_revision")) {
      needsFollowUp.push("Project needs revision");
    }

    return res.status(200).json({
      summary: {
        averageCourseProgress,
        attendancePercentage: attendanceSummary.percentage,
        assignmentSubmissions: assignments.length,
        projectCount: projects.length,
        quizAttempts: quizzes.length,
        followUps: needsFollowUp,
      },
      courses,
      attendance: {
        summary: attendanceSummary,
        recent: attendanceRecords.slice(0, 8),
      },
      assignments,
      projects,
      quizzes,
    });
  } catch (error) {
    console.error("Error retrieving student insights:", error);
    res.status(500).json({ message: "Error retrieving student insights", error });
  }
};

// update the student details
exports.updateStudentDetails = async (req, res) => {
  const studentId = req.params.studentId;
  const { data } = req.body;
  var { fatherName, password, passwordChange } = data

  if (!password || !fatherName) {
    return res.status(400).json({ message: "All fields are required" });
  }



  try {
    // Find the course by ID
    let student = await Student.findOne({ studentId: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (passwordChange) {
      const hashedPassword = await bcrypt.hash(password, 10);
      student.password = hashedPassword;
    }
    student.fatherName = fatherName;
    await student.save();

    res.status(200).json({ message: 'Student Details updated successfully', student });
  } catch (error) {
    console.error('Error updating student Details:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// exports.getTeacherBatches = async (req, res) => {
//   try {
//     const teacher = await Teacher.findById(req.teacher._id)
//       .populate({
//         path: "batches",
//        populate: [
//     {
//       path: "students",
//       select: "name lastLogin",
//     },
//    {
//   path: "courses",
//   populate: {
//     path: "chapters",
//     select: "_id name"
//   }
// }
//   ]
//       });

//     const now = new Date();

//     const batchesWithStatus = teacher.batches.map((batch) => {
//       const students = (batch.students || []).map((s) => {
//         let status = "Inactive";

//         if (s.lastLogin) {
//           const diffDays =
//             (now - new Date(s.lastLogin)) / (1000 * 60 * 60 * 24);



//           if (diffDays <= 15) {
//             status = "Active";
//           }
//         }

//         return {
//           _id: s._id,
//           name: s.name,
//           status,
//           lastLogin: s.lastLogin,
//         };
//       });

//       return {
//         _id: batch._id,
//         batchName: batch.batchName,
//         students,
//         courses: batch.courses || [] 
//       };
//     });

//     res.json({ batches: batchesWithStatus });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error fetching batches" });
//   }
// };


/*never modify this api get Teacher Batches it have lots of dependencies */
exports.getTeacherBatches = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate('batches', 'batchName _id batchId imageUrl')
      .lean();

    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const batchIds = (teacher.batches || []).map(b => b._id);

    const q = Batch.find({ _id: { $in: batchIds } })
      .populate('students', 'name _id studentId')
      .populate('teachers', 'name _id')
      .populate({ path: 'courses', populate: { path: 'chapters' } })
      .populate('quizzes'); // OK — quizzes DOES exist

    // avoid strictPopulate surprises if something else is missing
    q.setOptions({ strictPopulate: false });

    const batches = await q.lean();

    return res.status(200).json({
      teacher: { _id: teacher._id, name: teacher.name, batches }
    });
  } catch (error) {
    console.error('Error fetching teacher batch details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


const ANNOUNCEMENT_TYPE_LABELS = {
  general: "General Notice",
  reminder: "Reminder",
  activity: "Activity Update",
  assessment: "Assessment Update",
  urgent: "Urgent Notice",
  event: "Event / Circular",
};

const normalizeAnnouncementBody = (body = {}) => ({
  title: body.title?.trim(),
  announcementContent: body.announcementContent,
  announcementType: body.announcementType || "general",
  priority: body.priority || "normal",
  isPinned: Boolean(body.isPinned),
  isReminder: Boolean(body.isReminder),
  expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  linkUrl: body.linkUrl?.trim?.() || "",
  linkLabel: body.linkLabel?.trim?.() || "",
  batches: Array.isArray(body.batches)
    ? body.batches.map((batch) => batch._id || batch).filter(Boolean)
    : [],
});

const buildTeacherAnnouncementPayload = async (announcement) => {
  const batchIds = (announcement.batches || []).map((batch) => batch._id || batch);
  const targetBatches = await Batch.find({ _id: { $in: batchIds } })
    .select("_id batchName students")
    .populate("students", "_id name");

  const targetedStudentMap = new Map();
  targetBatches.forEach((batch) => {
    (batch.students || []).forEach((student) => {
      targetedStudentMap.set(student._id.toString(), {
        _id: student._id,
        name: student.name,
        batchName: batch.batchName,
      });
    });
  });

  const acknowledgedIds = new Set(
    (announcement.readBy || [])
      .map((entry) => entry.student?._id?.toString?.() || entry.student?.toString?.())
      .filter(Boolean)
  );

  const pendingStudents = Array.from(targetedStudentMap.entries())
    .filter(([studentId]) => !acknowledgedIds.has(studentId))
    .map(([, student]) => student);

  return {
    ...announcement.toObject(),
    isExpired: Boolean(announcement.expiresAt && announcement.expiresAt < new Date()),
    typeLabel:
      ANNOUNCEMENT_TYPE_LABELS[announcement.announcementType] || "General Notice",
    acknowledgedCount: acknowledgedIds.size,
    targetedStudentCount: targetedStudentMap.size,
    pendingAcknowledgementCount: pendingStudents.length,
    pendingStudents,
  };
};

exports.createAnnouncement = async (req, res) => {
  const createdBy = req.teacher._id;

  try {
    const payload = normalizeAnnouncementBody(req.body);

    if (!payload.title || !payload.announcementContent || payload.batches.length === 0) {
      return res.status(400).json({
        message: "Title, content, and at least one batch are required",
      });
    }

    const announcement = new Announcement({ ...payload, createdBy });
    await announcement.save();

    res.status(201).json({ message: "Announcement created successfully", announcement });
  } catch (error) {
    console.error("Error creating Announcement:", error);
    res.status(500).json({ message: "Error creating Announcement", error: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      createdBy: req.teacher._id,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const payload = normalizeAnnouncementBody(req.body);

    if (!payload.title || !payload.announcementContent || payload.batches.length === 0) {
      return res.status(400).json({
        message: "Title, content, and at least one batch are required",
      });
    }

    Object.assign(announcement, payload);
    await announcement.save();

    return res.status(200).json({
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error updating Announcement:", error);
    return res.status(500).json({
      message: "Error updating Announcement",
      error: error.message,
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.teacher._id,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting Announcement:", error);
    return res.status(500).json({
      message: "Error deleting Announcement",
      error: error.message,
    });
  }
};

exports.repostAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      createdBy: req.teacher._id,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const reposted = new Announcement({
      title: announcement.title,
      announcementContent: announcement.announcementContent,
      announcementType: announcement.announcementType,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      isReminder: announcement.isReminder,
      expiresAt: announcement.expiresAt,
      linkUrl: announcement.linkUrl,
      linkLabel: announcement.linkLabel,
      batches: announcement.batches,
      createdBy: req.teacher._id,
      readBy: [],
    });

    await reposted.save();

    return res.status(201).json({
      message: "Announcement reposted successfully",
      announcement: reposted,
    });
  } catch (error) {
    console.error("Error reposting Announcement:", error);
    return res.status(500).json({
      message: "Error reposting Announcement",
      error: error.message,
    });
  }
};

// GET announcements for the teacher's batches (latest first)
// exports.getTeacherAnnouncements = async (req, res) => {
//   try {
//     const teacher = await Teacher.findById(req.teacher._id)
//       .populate('batches', '_id batchName');

//     if (!teacher) {
//       return res.status(404).json({ message: 'Teacher not found' });
//     }

//     const batchIds = teacher.batches.map(b => b._id);

//     const announcements = await Announcement.find({
//       batches: { $in: batchIds },
//     })
//       .populate('batches', '_id batchName')
//       .populate('createdBy', '_id name')
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       teacher: { _id: teacher._id, name: teacher.name },
//       announcements,
//     });
//   } catch (err) {
//     console.error('Error fetching teacher announcements:', err);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };
exports.getTeacherAnnouncements = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate("batches", "_id batchName");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const batchIds = teacher.batches.map(b => b._id);

    const announcements = await Announcement.find({
      batches: { $in: batchIds }
    })
      .populate("batches", "_id batchName")
      .populate("createdBy", "_id name")
      .populate("readBy.student", "_id name studentId")
      .sort({ isPinned: -1, createdAt: -1 });

    const formatted = await Promise.all(
      announcements.map((announcement) => buildTeacherAnnouncementPayload(announcement))
    );

    return res.status(200).json({
      teacher: { _id: teacher._id, name: teacher.name },
      announcements: formatted
    });

  } catch (err) {
    console.error("Error fetching teacher announcements:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

