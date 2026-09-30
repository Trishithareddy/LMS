const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  categoryName: {
    type: String,
    required: false
  },
  categoryDescription: {
    type: String
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;
