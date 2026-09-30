const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  teacherId: {
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
  school: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  batches: [{
    type: Schema.Types.ObjectId,
    ref: 'Batch',
  }],

  isActive: {
    type: Boolean,
    default:true
  },
  lastLogin: {
    type: Date,
    default: null
  },
}, {
  timestamps: true,
});

teacherSchema.plugin(AutoIncrement, { inc_field: 'teacherId' });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
