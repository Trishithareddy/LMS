const mongoose = require('mongoose');

const CourseBadgeSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  assignmentType: { type: String, enum: ['manual','auto'], default: 'manual' }, // manual = admin awards; auto = award when criteria met
  criteria: { type: mongoose.Schema.Types.Mixed }, // flexible object (e.g. {minScore:80})
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseBadge', CourseBadgeSchema);
