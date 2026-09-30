const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseId: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: false // Set to true if you want to make it mandatory
  },
  subCategory: {
    type: Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: false
  },
  subCategoryName: {
    type: String,
    required: false
  },
  subCategoryDescription: {
    type: String
  },
  chapters: [{
    type: Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  published: {
    type: Boolean,
    default: false // By default, the course is unpublished
  },
  courseExpectedtime: {
    type: Number,         
    default: 0
  }
});

courseSchema.plugin(AutoIncrement, { inc_field: 'courseId' });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
