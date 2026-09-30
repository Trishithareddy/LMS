const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const Schema = mongoose.Schema;

const schoolSchema = new Schema({
  schoolId: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
  },
  schoolAdmin: {
    type: Schema.Types.ObjectId,
    ref: 'SchoolAdmin', // Reference to SchoolAdmin model
  },
  imageUrl: {
    type: String,
    required: false // Set to true if you want to make it mandatory
  },
   schoolAdmin: {
    type: Schema.Types.ObjectId,
    ref: 'SchoolAdmin', // Reference to SchoolAdmin model
  },
  students: [{
    type: Schema.Types.Mixed,
    ref: 'Student', // Reference to Student model
  }],
  teachers: [{
    type: Schema.Types.ObjectId,
    ref: 'Teacher', // Reference to Teacher model
  }],
  academicYear: {
    type: String,
    default: "",
  },
  term: {
    type: String,
    default: "",
  },
  defaultPasswordRule: {
    type: String,
    default: "Minimum 6 characters",
  },
  attendanceThreshold: {
    type: Number,
    default: 75,
  },
  teacherPermissions: {
    createAssignments: { type: Boolean, default: true },
    createQuizzes: { type: Boolean, default: true },
    reviewProjects: { type: Boolean, default: true },
    sendAnnouncements: { type: Boolean, default: true },
    unlockChapters: { type: Boolean, default: true },
  },


}, {
  timestamps: true,
});

schoolSchema.plugin(AutoIncrement, { inc_field: 'schoolId' });

const School = mongoose.model('School', schoolSchema);

module.exports = School;
