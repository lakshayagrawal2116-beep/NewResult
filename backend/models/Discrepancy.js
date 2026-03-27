const mongoose = require('mongoose');

const discrepancySchema = new mongoose.Schema({
  rollno: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  documentPath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Discrepancy', discrepancySchema);
