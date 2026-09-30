const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schoolAdminSchema = new Schema({
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
}, {
  timestamps: true,
});

const SchoolAdmin = mongoose.model('SchoolAdmin', schoolAdminSchema);

module.exports = SchoolAdmin;
