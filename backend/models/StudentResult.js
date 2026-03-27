const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseName: { type: String },
  credits: { type: Number, required: true },
  grade: { type: String, required: true }
}, { _id: false });

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
  },
  sgpa: {
    type: Number,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  courses: [courseSchema],
  failedCourses: [{
    type: String,
  }]
});

const studentResultSchema = new mongoose.Schema({
  rollno: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
  },
  semesters: [semesterSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

const StudentResult = mongoose.model('StudentResult', studentResultSchema);

module.exports = StudentResult;
