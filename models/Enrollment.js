const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // The user's ID from user-service
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  courseId: { type: String, required: true },
  completedAt: { type: Date, default: Date.now },
  certificateUrl: { type: String }, // Optional: If we save the cert somewhere, else just email
}, { timestamps: true });

// Prevent duplicate enrollments for the same course by the same user
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
