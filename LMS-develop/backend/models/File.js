const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const fileSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  folder_id: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    required: false
  },
  fileUrl: {
    type: String,
    required: false,
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  isActive: {
    type: Boolean,
    default:false,
  }

},{
  timestamps: true,
});


const File = mongoose.model('File', fileSchema);


module.exports = File;