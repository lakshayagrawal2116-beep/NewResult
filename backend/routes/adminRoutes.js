const express = require('express');
const router = express.Router();
const StudentResult = require('../models/StudentResult');
const multer = require('multer');
const csv = require('csv-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// ─── Config ──────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'admin-portal-secret-key-2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ─── Multer for CSV uploads ──────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'csv-' + Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// ─── Auth Middleware ─────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// @route   POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ message: 'Login successful', token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// @route   GET /api/admin/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// ═══════════════════════════════════════════════════════════
// HELPER: Extract graduation year from roll number
// Roll "23/CS/001" → joined 2023 → graduates 2027 (4-year BTech)
// ═══════════════════════════════════════════════════════════
function getGraduationYear(rollno) {
  const match = rollno.match(/^(\d{2})\//);
  if (!match) return null;
  const joinYear = 2000 + parseInt(match[1]);
  return joinYear + 4; // BTech 4-year program
}

function getYearPrefix(gradYear) {
  const joinYear = parseInt(gradYear) - 4;
  return joinYear.toString().slice(-2) + '/';
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

// @route   GET /api/admin/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalStudents = await StudentResult.countDocuments();
    
    const departmentStats = await StudentResult.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const semesterStats = await StudentResult.aggregate([
      { $unwind: '$semesters' },
      { $group: { _id: '$semesters.semesterNumber', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Year-wise stats: group by roll number prefix
    const allStudents = await StudentResult.find().select('rollno').lean();
    const yearMap = {};
    allStudents.forEach(s => {
      const gy = getGraduationYear(s.rollno);
      if (gy) {
        yearMap[gy] = (yearMap[gy] || 0) + 1;
      }
    });
    const yearStats = Object.entries(yearMap)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    const recentlyUpdated = await StudentResult.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('rollno name department updatedAt')
      .lean();

    res.json({
      totalStudents,
      totalDepartments: departmentStats.length,
      totalSemesters: semesterStats.length,
      departmentStats: departmentStats.map(d => ({ name: d._id, count: d.count })),
      semesterStats: semesterStats.map(s => ({ semester: s._id, count: s.count })),
      yearStats,
      recentlyUpdated
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════
// STUDENT CRUD
// ═══════════════════════════════════════════════════════════

// @route   GET /api/admin/students
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', department = '', year = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (search) {
      query.$or = [
        { rollno: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      query.department = department.toUpperCase();
    }

    // Filter by graduation year
    if (year && year !== 'all') {
      const prefix = getYearPrefix(year);
      query.rollno = { ...(query.rollno || {}), $regex: '^' + prefix.replace('/', '\\/') };
    }

    const [students, total] = await Promise.all([
      StudentResult.find(query)
        .sort({ rollno: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StudentResult.countDocuments(query)
    ]);

    // Compute CGPA for each student
    const enriched = students.map(s => {
      let totalPoints = 0, totalCredits = 0;
      (s.semesters || []).forEach(sem => {
        totalPoints += sem.sgpa * sem.credits;
        totalCredits += sem.credits;
      });
      const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(3)) : 0;
      return { ...s, cgpa, semesterCount: (s.semesters || []).length };
    });

    res.json({
      students: enriched,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/students/:id
router.get('/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await StudentResult.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/students/:id
router.put('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { name, department, rollno, semesters } = req.body;
    const student = await StudentResult.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (name) student.name = name;
    if (department) student.department = department;
    if (rollno) student.rollno = rollno.toUpperCase().replace(/\s+/g, '');
    if (semesters) student.semesters = semesters;

    await student.save();
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/students/:id
router.delete('/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await StudentResult.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/students/:id/semester/:semNumber
router.delete('/students/:id/semester/:semNumber', authMiddleware, async (req, res) => {
  try {
    const student = await StudentResult.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const semNum = parseInt(req.params.semNumber);
    student.semesters = student.semesters.filter(s => s.semesterNumber !== semNum);
    await student.save();

    res.json({ message: `Semester ${semNum} deleted successfully`, student });
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════

// @route   POST /api/admin/bulk/summary
// @desc    Get summary stats for a specific dept/year/semester combination
router.post('/bulk/summary', authMiddleware, async (req, res) => {
  try {
    const { department, year, semester } = req.body;
    let query = {};

    if (department && department !== 'all') {
      query.department = department.toUpperCase();
    }
    if (year && year !== 'all') {
      const prefix = getYearPrefix(year);
      query.rollno = { $regex: '^' + prefix.replace('/', '\\/') };
    }

    const students = await StudentResult.find(query).lean();

    let totalWithSemester = 0;
    let totalCGPA = 0;
    let avgSGPA = 0;
    let sgpaCount = 0;
    const deptBreakdown = {};

    students.forEach(s => {
      // Department counts
      deptBreakdown[s.department] = (deptBreakdown[s.department] || 0) + 1;

      // CGPA calc
      let tp = 0, tc = 0;
      s.semesters.forEach(sem => {
        tp += sem.sgpa * sem.credits;
        tc += sem.credits;
        if (semester && sem.semesterNumber === parseInt(semester)) {
          totalWithSemester++;
          avgSGPA += sem.sgpa;
          sgpaCount++;
        }
      });
      const cgpa = tc > 0 ? tp / tc : 0;
      totalCGPA += cgpa;
    });

    res.json({
      totalStudents: students.length,
      avgCGPA: students.length > 0 ? parseFloat((totalCGPA / students.length).toFixed(3)) : 0,
      semesterInfo: semester ? {
        studentsWithSemester: totalWithSemester,
        avgSGPA: sgpaCount > 0 ? parseFloat((avgSGPA / sgpaCount).toFixed(3)) : 0
      } : null,
      departmentBreakdown: Object.entries(deptBreakdown).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    console.error('Error fetching bulk summary:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/bulk/students
// @desc    Delete ALL students matching dept + year filter
router.delete('/bulk/students', authMiddleware, async (req, res) => {
  try {
    const { department, year } = req.body;
    if (!department && !year) {
      return res.status(400).json({ message: 'At least one filter (department or year) is required' });
    }

    let query = {};
    if (department && department !== 'all') {
      query.department = department.toUpperCase();
    }
    if (year && year !== 'all') {
      const prefix = getYearPrefix(year);
      query.rollno = { $regex: '^' + prefix.replace('/', '\\/') };
    }

    const result = await StudentResult.deleteMany(query);
    res.json({ message: `Deleted ${result.deletedCount} students`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/admin/bulk/semester
// @desc    Remove a specific semester's data from matching students (keeps the student record)
router.delete('/bulk/semester', authMiddleware, async (req, res) => {
  try {
    const { department, year, semester } = req.body;
    if (!semester) {
      return res.status(400).json({ message: 'Semester number is required' });
    }

    let query = {};
    if (department && department !== 'all') {
      query.department = department.toUpperCase();
    }
    if (year && year !== 'all') {
      const prefix = getYearPrefix(year);
      query.rollno = { $regex: '^' + prefix.replace('/', '\\/') };
    }

    const semNum = parseInt(semester);
    const result = await StudentResult.updateMany(
      query,
      { $pull: { semesters: { semesterNumber: semNum } } }
    );

    res.json({
      message: `Removed Semester ${semNum} data from ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk deleting semester:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/bulk/department-rename
// @desc    Rename a department across all matching students
router.put('/bulk/department-rename', authMiddleware, async (req, res) => {
  try {
    const { oldName, newName, year } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Both old and new department names are required' });
    }

    let query = { department: oldName.toUpperCase() };
    if (year && year !== 'all') {
      const prefix = getYearPrefix(year);
      query.rollno = { $regex: '^' + prefix.replace('/', '\\/') };
    }

    const result = await StudentResult.updateMany(query, { $set: { department: newName.toUpperCase() } });
    res.json({
      message: `Renamed ${oldName} → ${newName} for ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error renaming department:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════
// CSV UPLOAD
// ═══════════════════════════════════════════════════════════

// Helper: parse grades string "AM101:F, CO101:C, CS103:B+" into courses array
function parseGrades(gradesStr) {
  if (!gradesStr) return [];
  const courses = [];
  // Split by comma, semicolon, or pipe
  const pairs = gradesStr.split(/[,;|]/);
  for (const pair of pairs) {
    const trimmed = pair.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const courseCode = trimmed.substring(0, colonIdx).trim();
    const grade = trimmed.substring(colonIdx + 1).trim();
    if (!courseCode) continue;
    courses.push({ courseCode, courseName: '', credits: 0, grade: grade || 'N/A' });
  }
  return courses;
}

// @route   POST /api/admin/upload-csv
// @desc    Upload CSV, parse it, return preview data (does NOT save yet)
router.post('/upload-csv', authMiddleware, upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded.' });
  }

  const results = [];
  const errors = [];
  let rowIndex = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      rowIndex++;
      try {
        // Expected columns: Roll No., Name, Department, SGPA, Credits, Failed Courses, Subjects and Grades
        const rollno = row['Roll No.'] || row['rollno'] || row['Roll No'] || '';
        const name = row['Name'] || row['name'] || '';
        const department = row['Department'] || row['department'] || row['Dept'] || '';
        const sgpa = parseFloat(row['SGPA'] || row['sgpa'] || 0);
        const credits = parseFloat(row['Credits'] || row['credits'] || 0);
        const failedCoursesStr = row['Failed Courses'] || row['failedCourses'] || '';
        const gradesStr = row['Subjects and Grades'] || row['grades'] || '';

        if (!rollno || !name) {
          errors.push({ row: rowIndex, error: 'Missing roll number or name', data: row });
          return;
        }

        const failedCourses = failedCoursesStr
          ? failedCoursesStr.split(' ').map(s => s.trim()).filter(s => s.length > 0)
          : [];

        const courses = parseGrades(gradesStr);

        results.push({
          rollno: rollno.toUpperCase().replace(/\s+/g, ''),
          name,
          department: department.toUpperCase(),
          sgpa,
          credits,
          failedCourses,
          courses
        });
      } catch (err) {
        errors.push({ row: rowIndex, error: err.message, data: row });
      }
    })
    .on('end', () => {
      // Delete temp file
      fs.unlink(req.file.path, () => {});
      res.json({
        message: `Parsed ${results.length} students successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
        preview: results,
        errors,
        totalParsed: results.length,
        totalErrors: errors.length
      });
    })
    .on('error', (err) => {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ message: 'Error parsing CSV', error: err.message });
    });
});

// @route   POST /api/admin/confirm-upload
// @desc    Save the previewed data to database
router.post('/confirm-upload', authMiddleware, async (req, res) => {
  try {
    const { students, semesterNumber } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No student data provided' });
    }

    if (!semesterNumber) {
      return res.status(400).json({ message: 'Semester number is required' });
    }

    const semNum = parseInt(semesterNumber);
    let saved = 0, updated = 0, failed = 0;
    const failedEntries = [];

    for (const s of students) {
      try {
        const formattedRollNo = s.rollno.toUpperCase().replace(/\s+/g, '');
        let student = await StudentResult.findOne({ rollno: formattedRollNo });

        const semesterData = {
          semesterNumber: semNum,
          sgpa: s.sgpa || 0,
          credits: s.credits || 0,
          failedCourses: s.failedCourses || [],
          courses: s.courses || []
        };

        if (student) {
          student.name = s.name || student.name;
          student.department = s.department || student.department;

          const existingSemIndex = student.semesters.findIndex(
            sem => sem.semesterNumber === semNum
          );

          if (existingSemIndex >= 0) {
            // MERGE Logic for Back-Papers / Re-evaluations
            const existingSem = student.semesters[existingSemIndex];
            existingSem.sgpa = s.sgpa || existingSem.sgpa; 
            existingSem.credits = s.credits || existingSem.credits;
            existingSem.failedCourses = s.failedCourses || [];
            
            // Merge courses: Upsert new grades into existing ones
            const courseMap = {};
            existingSem.courses.forEach(c => {
              courseMap[c.courseCode] = c;
            });
            
            s.courses.forEach(newCourse => {
              if (courseMap[newCourse.courseCode]) {
                courseMap[newCourse.courseCode].grade = newCourse.grade;
              } else {
                existingSem.courses.push(newCourse);
              }
            });
          } else {
            student.semesters.push(semesterData);
          }

          await student.save();
          updated++;
        } else {
          student = new StudentResult({
            rollno: formattedRollNo,
            name: s.name,
            department: s.department,
            semesters: [semesterData]
          });
          await student.save();
          saved++;
        }
      } catch (err) {
        failed++;
        failedEntries.push({ rollno: s.rollno, error: err.message });
      }
    }

    res.json({
      message: `Upload complete: ${saved} new, ${updated} updated, ${failed} failed`,
      saved,
      updated,
      failed,
      failedEntries
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

const Discrepancy = require('../models/Discrepancy');

// @route   GET /api/admin/discrepancies
// @desc    Get all discrepancy reports
// @access  Admin
router.get('/discrepancies', authMiddleware, async (req, res) => {
  try {
    const discrepancies = await Discrepancy.find().sort({ createdAt: -1 });
    res.json(discrepancies);
  } catch (error) {
    console.error('Error fetching discrepancies:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/discrepancies/:id/status
// @desc    Update discrepancy status
// @access  Admin
router.put('/discrepancies/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const discrepancy = await Discrepancy.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!discrepancy) {
      return res.status(404).json({ message: 'Discrepancy not found' });
    }

    res.json({ message: 'Status updated successfully', discrepancy });
  } catch (error) {
    console.error('Error updating discrepancy status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
