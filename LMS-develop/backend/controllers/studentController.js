const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const Announcement = require("../models/Announcement");
const Attendance = require("../models/Attendance");
const mongoose = require('mongoose');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const ANNOUNCEMENT_TYPE_LABELS = {
  general: 'General Notice',
  reminder: 'Reminder',
  activity: 'Activity Update',
  assessment: 'Assessment Update',
  urgent: 'Urgent Notice',
  event: 'Event / Circular',
};

//login student
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const student = await Student.findOne({ username });

    if (!student) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked by the school administrator",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid  username or password' });
    }

    const token = jwt.sign({ id: student._id, role: "Student" }, JWT_SECRET, { expiresIn: '6h' });
    student.lastLogin = new Date();
    await student.save();
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.getLoggedInStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate({
        path: "batches",
        populate: { path: "courses" }
      })
      .populate('courses')
      .populate({
        path: 'school',
        select: 'imageUrl name'
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const {
      _id,
      name,
      age,
      contact,
      fatherName,
      address,
      school,
      batches,
      courses,
      class: className,
      grade,
      section,
      batchId,
      username,
    } = student;
    const studentDetails = {
      _id,
      name,
      age,
      contact,
      fatherName,
      address,
      school,
      batches,
      courses,
      class: className,
      grade,
      section,
      batchId,
      username,
    };

    res.json({ student: studentDetails });
  } catch (error) {
    console.error('Error retrieving student:', error);
    res.status(500).json({ message: 'Error retrieving student details' });
  }
};

exports.getStudentAnnouncements = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id).populate('batches', '_id batchName');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const batchIds = student.batches.map((batch) => batch._id);
    const now = new Date();
    const priorityOrder = { urgent: 3, important: 2, normal: 1 };

    const announcements = await Announcement.find({
      batches: { $in: batchIds },
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('batches', '_id batchName')
      .populate('createdBy', '_id name');

    const studentIdStr = req.student._id.toString();

    const formattedAnnouncements = announcements
      .map((announcement) => {
        const isRead = (announcement.readBy || []).some(
          (entry) =>
            (entry.student ? entry.student.toString() : entry.toString()) === studentIdStr
        );

        return {
          ...announcement.toObject(),
          isRead,
          isExpired: Boolean(announcement.expiresAt && announcement.expiresAt < now),
          typeLabel:
            ANNOUNCEMENT_TYPE_LABELS[announcement.announcementType] || 'General Notice',
          audienceSummary:
            announcement.batches?.length > 2
              ? `${announcement.batches.length} batches`
              : (announcement.batches || []).map((batch) => batch.batchName).join(', '),
        };
      })
      .sort((left, right) => {
        if (left.isRead !== right.isRead) {
          return left.isRead ? 1 : -1;
        }
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }
        const rightPriority = priorityOrder[right.priority] || 0;
        const leftPriority = priorityOrder[left.priority] || 0;
        if (rightPriority !== leftPriority) {
          return rightPriority - leftPriority;
        }
        return new Date(right.createdAt) - new Date(left.createdAt);
      });

    return res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
      },
      announcements: formattedAnnouncements
    });
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markAnnouncementRead = async (req, res) => {
  try {
    const studentId = req.student._id;
    const announcementId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({ message: "Invalid announcement ID" });
    }

    const announcement = await Announcement.findById(announcementId).select("_id readBy");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const alreadyRead = (announcement.readBy || []).some(
      r => (r.student ? r.student.toString() : r.toString()) === studentId.toString()
    );

    if (!alreadyRead) {
      await Announcement.updateOne(
        {
          _id: announcementId,
          "readBy.student": { $ne: studentId },
        },
        {
          $push: {
            readBy: {
              student: studentId,
              readAt: new Date(),
            },
          },
        }
      );
    }

    res.status(200).json({ message: "Announcement acknowledged" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentId = req.student?._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const records = await Attendance.find({
      "records.studentId": studentId,
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const attendanceHistory = [];
    const batchSummaryMap = new Map();
    let present = 0;
    let absent = 0;
    let late = 0;

    records.forEach((attendance) => {
      const record = (attendance.records || []).find(
        (item) => String(item.studentId) === String(studentId)
      );

      if (!record) return;

      if (record.status === "present") present += 1;
      if (record.status === "absent") absent += 1;
      if (record.status === "late") late += 1;

      const historyItem = {
        id: `${attendance._id}-${attendance.date}`,
        date: attendance.date,
        batchId: attendance.batchId,
        batchName: attendance.batchName || "Current Batch",
        className: attendance.className || record.className || "",
        section: attendance.section || record.section || "",
        status: record.status || "absent",
        markedBy: record.markedBy || "teacher",
        autoMarked: Boolean(record.autoMarked),
        loginTime: record.loginTime || null,
        remarks: record.remarks || "",
      };

      attendanceHistory.push(historyItem);

      const batchKey = String(attendance.batchId || "batch");
      if (!batchSummaryMap.has(batchKey)) {
        batchSummaryMap.set(batchKey, {
          batchId: attendance.batchId,
          batchName: attendance.batchName || "Current Batch",
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        });
      }

      const batchSummary = batchSummaryMap.get(batchKey);
      batchSummary.total += 1;
      if (record.status === "present") batchSummary.present += 1;
      if (record.status === "absent") batchSummary.absent += 1;
      if (record.status === "late") batchSummary.late += 1;
    });

    const totalDays = attendanceHistory.length;
    const attended = present + late;
    const attendancePercentage = totalDays
      ? Number(((attended / totalDays) * 100).toFixed(1))
      : 0;

    const today = new Date().toISOString().split("T")[0];
    const todayStatus = attendanceHistory.find((item) => item.date === today) || null;

    const batchSummary = Array.from(batchSummaryMap.values()).map((item) => ({
      ...item,
      percentage: item.total
        ? Number((((item.present + item.late) / item.total) * 100).toFixed(1))
        : 0,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalDays,
        present,
        absent,
        late,
        attended,
        attendancePercentage,
      },
      todayStatus,
      batchSummary,
      history: attendanceHistory.slice(0, 60),
    });
  } catch (error) {
    console.error("Error fetching student attendance summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance summary",
      error: error.message,
    });
  }
};
