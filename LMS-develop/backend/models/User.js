// backend/models/User.js
const mongoose = require('mongoose');

try {
  // If a Teacher model exists, create User using the same schema
  const Teacher = mongoose.model('Teacher'); // throws if not registered
  mongoose.model('User', Teacher.schema);
  // Export the model for convenience
  module.exports = mongoose.model('User');
} catch (err) {
  // If Teacher model isn't available, register a permissive User schema
  const userSchema = new mongoose.Schema({}, { strict: false });
  // This will use the default collection name 'users' unless you need to point
  // it at 'teachers' collection — see comment below.
  module.exports = mongoose.model('User', userSchema);
}
