const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Discrepancy = require('../models/Discrepancy');

// Configure multer for discrepancy PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/discrepancies');
    // Create directories if they don't exist
    if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../uploads'));
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Make file unique
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// @route   POST /api/discrepancies
// @desc    Submit a new discrepancy report with PDF proof
// @access  Public
router.post('/', (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Supporting PDF document is required.' });
    }

    try {
      const { rollno, email, description } = req.body;

      if (!rollno || !email || !description) {
        return res.status(400).json({ message: 'Roll Number, Email, and Description are required.' });
      }

      // documentPath stores the relative URL to access the file
      const documentPath = `/uploads/discrepancies/${req.file.filename}`;

      const newDiscrepancy = new Discrepancy({
        rollno,
        email,
        description,
        documentPath
      });

      await newDiscrepancy.save();

      res.status(201).json({ message: 'Discrepancy reported successfully. We will review it shortly.' });
    } catch (error) {
      console.error('Error saving discrepancy:', error);
      res.status(500).json({ message: 'Server error while submitting report.' });
    }
  });
});

module.exports = router;
