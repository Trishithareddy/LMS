const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const folderSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    required: false
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },

},{
  timestamps: true,
});


const Folder = mongoose.model('Folder', folderSchema);


module.exports = Folder;
