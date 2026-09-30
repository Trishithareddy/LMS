// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const optionSchema = new Schema({
//     option:{
//       type: String, // Assuming option is stored as raw HTML
//       required: true,
//     },
//   optionLD:{
//     type: String, 
//     required: true,
//   },
//   optionWeightage:{
//     type: Number,
//     default:1
//   },
//   optionNumber:{
//     type: Number,
//     required: true,
//   },
//   });


// // Create the Options model
// const Options = mongoose.model('Options', optionSchema);

// module.exports = Options;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const optionSchema = new Schema({
    option:{
      type: String, // Assuming option is stored as raw HTML
      required: true,
    },
  optionNumber:{
    type: Number,
    required: true,
  },
  });


// Create the Options model
const Options = mongoose.model('Options', optionSchema);

module.exports = Options;