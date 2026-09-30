const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const batchSchema = new Schema({
  batchId: {
    type: Number,
    unique: true,
    required: true,
  },
  batchName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false // Set to true if you want to make it mandatory
  },
  imagePublicId: {
  type: String,
  required: false,
  select: false,  
},
  academicYear: {
    type: String,
    required: false,
    index: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student',
  }],
  teachers: [
    {
      teacher: {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
      },
      role: {
        type: String,
        enum: ["PRIMARY", "SECONDARY"],
        default: "SECONDARY",
      },
    },
  ],
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course',
  }],
  quizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
  }],
  status: {
    type: String,
    enum: ["active", "archived"],
    default: "active",
    index: true,
  },
  archivedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
