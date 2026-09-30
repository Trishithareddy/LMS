// models/UserActivity.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  userType: {
    type: String,
    enum: ["STUDENT", "TEACHER"],
    required: true,
  },
  school: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  activityType: {
    type: String,
    enum: ["LOGIN", "QUIZ_ATTEMPT", "COURSE_VIEW"],
    default: "LOGIN",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("UserActivity", userActivitySchema);