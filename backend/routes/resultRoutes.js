const express = require('express');
const router = express.Router();
const StudentResult = require('../models/StudentResult');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
// @route   POST /api/results
// @desc    Create or update a student's result
// @access  Public (Should be Admin in production)
router.post('/', async (req, res) => {
  try {
    const { rollno, name, department, semesters } = req.body;

    if (!rollno || !name || !department) {
      return res.status(400).json({ message: 'Roll number, Name, and Department are required.' });
    }

    // Format rollno to avoid case/space mismatches
    const formattedRollNo = rollno.toUpperCase().replace(/\s+/g, '');

    // Check if student already exists
    let student = await StudentResult.findOne({ rollno: formattedRollNo });

    if (student) {
      // Update existing student's semesters (append or replace depending on logic, let's replace for simplicity)
      student.name = name || student.name;
      student.department = department || student.department;
      if (semesters && semesters.length > 0) {
          const incomingSem = semesters[0];
          const existingSemIndex = student.semesters.findIndex(s => s.semesterNumber === incomingSem.semesterNumber);
          if (existingSemIndex >= 0) {
              const existingSem = student.semesters[existingSemIndex];
              existingSem.sgpa = incomingSem.sgpa || existingSem.sgpa;
              existingSem.credits = incomingSem.credits || existingSem.credits;
              existingSem.failedCourses = incomingSem.failedCourses || [];
              
              const courseMap = {};
              existingSem.courses.forEach(c => { courseMap[c.courseCode] = c; });
              
              incomingSem.courses.forEach(newCourse => {
                if (courseMap[newCourse.courseCode]) {
                  courseMap[newCourse.courseCode].grade = newCourse.grade;
                } else {
                  existingSem.courses.push(newCourse);
                }
              });
          } else {
              student.semesters.push(incomingSem);
          }
      }
      await student.save();
      return res.json({ message: 'Student result updated successfully', student });
    }

    // Create new student record
    student = new StudentResult({
      rollno: formattedRollNo,
      name,
      department,
      semesters: semesters || []
    });

    await student.save();
    res.status(201).json({ message: 'Student result created successfully', student });

  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/results/leaderboard
// @desc    Get all students, optionally filtered by branch and graduation year, sorted by CGPA
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { branch, year } = req.query;
    
    // Build query
    let query = {};
    if (branch && branch.toLowerCase() !== 'cumulative') {
      query.department = branch.toUpperCase();
    }
    
    // If year = 2027, roll numbers usually start with 23/
    if (year) {
      const joinYear = parseInt(year) - 4; // BTech is 4 years
      const prefix = joinYear.toString().slice(-2) + '/'; 
      query.rollno = { $regex: '^' + prefix };
    }

    const students = await StudentResult.find(query).lean();

    // Map and Calculate CGPA
    const leaderboard = students.map(student => {
      let totalPoints = 0;
      let totalCredits = 0;
      
      const semesters = student.semesters || [];
      const semMap = {};
      
      semesters.forEach(sem => {
        const sid = sem.semesterNumber;
        semMap[`sem${sid}`] = sem.sgpa;
        totalPoints += (sem.sgpa * sem.credits);
        totalCredits += sem.credits;
      });
      
      const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(3) : 0;
      
      return {
        id: student._id,
        name: student.name,
        rollno: student.rollno,
        branch: student.department || 'N/A',
        sem1: semMap.sem1 || '-',
        sem2: semMap.sem2 || '-',
        sem3: semMap.sem3 || '-',
        cgpa: parseFloat(cgpa)
      };
    });

    // Sort by CGPA descending
    leaderboard.sort((a, b) => b.cgpa - a.cgpa);
    
    // Assign Ranks
    let currentRank = 1;
    for (let i = 0; i < leaderboard.length; i++) {
      if (i > 0 && leaderboard[i].cgpa === leaderboard[i - 1].cgpa) {
        leaderboard[i].rank = leaderboard[i - 1].rank;
      } else {
        leaderboard[i].rank = currentRank;
      }
      currentRank++;
    }

    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/results/profile/:rollno
// @desc    Get comprehensive student profile including ranks, percentiles, and charts data
// @access  Public
router.get('/profile/:rollno', async (req, res) => {
  try {
    const formattedRollNo = req.params.rollno.toUpperCase().replace(/\s+/g, '');
    const student = await StudentResult.findOne({ rollno: formattedRollNo }).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 1. Calculate this student's CGPA, total credits, and semester SGPAs
    let totalPoints = 0;
    let totalCredits = 0;
    const gradeBreakdown = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, P: 0, F: 0 };
    
    // For SGPA Trend chart
    const sgpaTrend = []; 

    student.semesters.forEach(sem => {
      totalPoints += (sem.sgpa * sem.credits);
      totalCredits += sem.credits;
      
      sgpaTrend.push({
        semester: `Sem ${sem.semesterNumber}`,
        sgpa: sem.sgpa
      });
      
      // Count grades
      sem.courses.forEach(course => {
        const grade = course.grade.trim();
        if (gradeBreakdown[grade] !== undefined) {
          gradeBreakdown[grade]++;
        } else if (grade) {
          gradeBreakdown[grade] = 1; // dynamically track odd grades if any
        }
      });
    });

    const studentCGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(3)) : 0;

    // 2. Fetch ALL students to calculate ranks and branch stats
    const yearPrefix = student.rollno.substring(0, 3); // e.g., "23/" or "24/"
    const allStudents = await StudentResult.find({ rollno: { $regex: '^' + yearPrefix.replace('/', '\\/') } }).lean();

    let branchHighest = 0;
    let branchTotalCGPA = 0;
    let branchCount = 0;
    
    const allCgpas = [];
    const departmentCgpas = [];

    allStudents.forEach(s => {
      let sPoints = 0;
      let sCredits = 0;
      s.semesters.forEach(sem => {
        sPoints += (sem.sgpa * sem.credits);
        sCredits += sem.credits;
      });
      const sCgpa = sCredits > 0 ? parseFloat((sPoints / sCredits).toFixed(3)) : 0;
      
      allCgpas.push(sCgpa);
      
      if (s.department === student.department) {
        departmentCgpas.push(sCgpa);
        branchCount++;
        branchTotalCGPA += sCgpa;
        if (sCgpa > branchHighest) branchHighest = sCgpa;
      }
    });

    // 3. Calculate Ranks
    // Sort descending
    allCgpas.sort((a, b) => b - a);
    departmentCgpas.sort((a, b) => b - a);

    const universityRank = allCgpas.indexOf(studentCGPA) + 1;
    const departmentRank = departmentCgpas.indexOf(studentCGPA) + 1;
    
    // Percentile
    const percentile = allCgpas.length > 1 ? ((allCgpas.length - universityRank) / (allCgpas.length - 1)) * 100 : 100;

    const branchAverage = branchCount > 0 ? parseFloat((branchTotalCGPA / branchCount).toFixed(3)) : 0;

    res.json({
      student,
      metrics: {
        cgpa: studentCGPA,
        totalCredits,
        universityRank,
        departmentRank,
        percentile: parseFloat(percentile.toFixed(1)),
        branchHighest,
        branchAverage
      },
      charts: {
        sgpaTrend,
        gradeBreakdown,
        // Since we only have Sem 1 right now, rank progression is basically flat for Sem 1
        rankProgression: [
          { semester: "Sem 1", univRank: universityRank, deptRank: departmentRank }
        ],
        cgpaDistribution: [
          { name: "Highest", value: branchHighest, fill: "#fbbf24" },
          { name: "Average", value: branchAverage, fill: "#22d3ee" },
          { name: "Your CGPA", value: studentCGPA, fill: "#4ade80" }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/results/analytics
// @desc    Get batch analytics by year and department
// @access  Public
router.get('/analytics', async (req, res) => {
  try {
    const { year, department } = req.query;
    
    if (!year || !department) {
      return res.status(400).json({ message: 'Year and Department are required.' });
    }

    // Determine rollno prefix from graduation year
    const joinYear = parseInt(year) - 4; // BTech is 4 years
    const prefix = joinYear.toString().slice(-2) + '/'; 

    const query = {
      rollno: { $regex: '^' + prefix }
    };

    if (department.toUpperCase() !== 'ALL' && department.toUpperCase() !== 'CUMULATIVE') {
      query.department = department.toUpperCase();
    }

    const students = await StudentResult.find(query).lean();

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this batch.' });
    }

    let totalStudents = students.length;
    let totalCGPA = 0;
    let highestCGPA = 0;
    
    // CGPA Buckets: O(>=9), A+(8-9), A(7-8), B+(6-7), Average(<6)
    const cgpaDistribution = {
      '9-10 (Outstanding)': 0,
      '8-9 (Excellent)': 0,
      '7-8 (Very Good)': 0,
      '6-7 (Good)': 0,
      '<6 (Average)': 0
    };

    // Semester Trends: track total sgpa and count per semester
    const semStats = {};

    // Subject Analysis: track F counts and O/A+ counts per subject
    const subjectStats = {};

    students.forEach(s => {
      let sPoints = 0;
      let sCredits = 0;
      
      s.semesters.forEach(sem => {
        sPoints += (sem.sgpa * sem.credits);
        sCredits += sem.credits;

        // Semester trend tracking
        if (!semStats[`Sem ${sem.semesterNumber}`]) {
          semStats[`Sem ${sem.semesterNumber}`] = { total: 0, count: 0 };
        }
        semStats[`Sem ${sem.semesterNumber}`].total += sem.sgpa;
        semStats[`Sem ${sem.semesterNumber}`].count += 1;

        // Subject tracking
        sem.courses.forEach(c => {
          if (!subjectStats[c.courseCode]) {
             subjectStats[c.courseCode] = { failed: 0, scoring: 0, total: 0, name: c.courseName || c.courseCode };
          }
          subjectStats[c.courseCode].total += 1;
          const grade = c.grade.trim();
          if (grade === 'F') {
            subjectStats[c.courseCode].failed += 1;
          } else if (grade === 'O' || grade === 'A+') {
            subjectStats[c.courseCode].scoring += 1;
          }
        });
      });

      const sCgpa = sCredits > 0 ? parseFloat((sPoints / sCredits).toFixed(3)) : 0;
      totalCGPA += sCgpa;
      if (sCgpa > highestCGPA) highestCGPA = sCgpa;

      if (sCgpa >= 9) cgpaDistribution['9-10 (Outstanding)']++;
      else if (sCgpa >= 8) cgpaDistribution['8-9 (Excellent)']++;
      else if (sCgpa >= 7) cgpaDistribution['7-8 (Very Good)']++;
      else if (sCgpa >= 6) cgpaDistribution['6-7 (Good)']++;
      else cgpaDistribution['<6 (Average)']++;
    });

    const averageCGPA = totalStudents > 0 ? parseFloat((totalCGPA / totalStudents).toFixed(3)) : 0;

    // Format CGPA Distribution
    const formattedDistribution = Object.keys(cgpaDistribution).map(k => ({
      name: k,
      value: cgpaDistribution[k]
    }));

    // Format Semester Trends
    const sgpaTrend = Object.keys(semStats).map(k => ({
      semester: k,
      avgSgpa: parseFloat((semStats[k].total / semStats[k].count).toFixed(2))
    })).sort((a, b) => a.semester.localeCompare(b.semester));

    // Format Subjects
    const subjectsArray = Object.values(subjectStats);
    
    // Top 5 Toughest (highest failure rate / failed count)
    const toughestSubjects = [...subjectsArray].sort((a, b) => b.failed - a.failed).slice(0, 5).map(s => ({
      name: s.name,
      failedCount: s.failed
    }));

    // Top 5 Scoring (highest O/A+ count)
    const scoringSubjects = [...subjectsArray].sort((a, b) => b.scoring - a.scoring).slice(0, 5).map(s => ({
      name: s.name,
      scoringCount: s.scoring
    }));

    res.json({
      summary: {
        totalStudents,
        averageCGPA,
        highestCGPA,
        totalSubjects: Object.keys(subjectStats).length
      },
      cgpaDistribution: formattedDistribution,
      sgpaTrend,
      toughestSubjects,
      scoringSubjects
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/results/:rollno
// @desc    Get a student's full result history by roll number
// @access  Public
router.get('/:rollno', async (req, res) => {
  try {
    const formattedRollNo = req.params.rollno.toUpperCase().replace(/\s+/g, '');
    const student = await StudentResult.findOne({ rollno: formattedRollNo });

    if (!student) {
      return res.status(404).json({ message: 'Result not found for this Roll Number.' });
    }

    res.json(student);

  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/results/upload-pdf
// @desc    Upload a Result PDF, extract data via Python script, and return JSON preview
// @access  Public (Should be Admin)
router.post('/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded.' });
  }

  const pdfPath = req.file.path;
  const scriptPath = path.join(__dirname, '../parser/extract_results.py');

  // Spawn Python script
  const pythonProcess = spawn('python', [scriptPath, pdfPath]);
  
  let dataString = '';
  let errorString = '';

  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  pythonProcess.on('close', (code) => {
    // Delete the file after parsing
    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Failed to delete Temp PDF:', err);
    });

    if (code !== 0) {
      console.error(`Python script exited with code ${code}: ${errorString}`);
      return res.status(500).json({ message: 'Error parsing PDF', error: errorString });
    }
    
    try {
      const parsedData = JSON.parse(dataString);
      if (parsedData.error) {
         return res.status(400).json({ message: 'Parsing failed', error: parsedData.error });
      }
      res.json({ message: 'PDF parsed successfully', data: parsedData });
    } catch (e) {
      console.error('Failed to parse Python JSON output:', dataString);
      res.status(500).json({ message: 'Invalid JSON returned from parser' });
    }
  });
});



module.exports = router;
