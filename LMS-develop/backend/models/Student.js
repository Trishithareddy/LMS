const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  studentId: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  school: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  class: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
  },
  section: {
    type: String,
    required: true,
  },
  batches: [{
    type: Schema.Types.ObjectId,
    ref: 'Batch',
  }],
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course',
  }],
  quizAttempts: [{
    type: Schema.Types.ObjectId,
    ref: 'AttemptQuiz',
  }],

  chapterQuizAttempts: [{
    type: Schema.Types.ObjectId,
    ref: 'ChapterQuizAttempt',
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true,
});

studentSchema.plugin(AutoIncrement, { inc_field: 'studentId' });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;