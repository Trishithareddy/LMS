const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SubCategory = require('./SubCategory'); // Adjusted import for SubCategory model

// Define the Category schema
const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subcategories: [{
    type: Schema.Types.ObjectId,
    ref: 'SubCategory' // Reference to the SubCategory model
  }]
});

// Create the Category model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
