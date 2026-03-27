/**
 * fix-courses.js
 * 
 * Fix malformed course data in MongoDB where multiple courses got packed
 * into a single course entry's grade field, e.g.:
 *   grade: "A; AP102a: A; CS102: A+; CS104: A+; CS106: A+; VAC6: O"
 * 
 * This splits them back into individual course objects.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zerodha123:zerodha123@cluster0.qiphosx.mongodb.net/university-results';

// Connect
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ Connection failed:', err); process.exit(1); });

// Use the same schema
const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseName: { type: String },
  credits: { type: Number, required: true },
  grade: { type: String, required: true }
}, { _id: false });

const semesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  sgpa: { type: Number, required: true },
  credits: { type: Number, required: true },
  courses: [courseSchema],
  failedCourses: [{ type: String }]
});

const studentResultSchema = new mongoose.Schema({
  rollno: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  semesters: [semesterSchema],
}, { timestamps: true });

const StudentResult = mongoose.model('StudentResult', studentResultSchema);

/**
 * Check if a grade field contains packed courses (has semicolons with course codes)
 */
function isMalformed(grade) {
  // A malformed grade looks like: "A; AP102a: A; CS102: A+" or "A+; CS102: B"
  return grade && grade.includes(';') && grade.includes(':');
}

/**
 * Split a malformed grade string into individual courses
 * Input: courseCode="AM102", grade="A; AP102a: A; CS102: A+; CS104: A+; CS106: A+; VAC6: O"
 * Output: [{courseCode:"AM102", grade:"A"}, {courseCode:"AP102a", grade:"A"}, ...]
 */
function splitPackedCourses(originalCourseCode, packedGrade) {
  const courses = [];

  // Split by semicolons
  const parts = packedGrade.split(';').map(p => p.trim()).filter(p => p.length > 0);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const colonIdx = part.indexOf(':');

    if (colonIdx === -1) {
      // First part: just the grade for the original course code
      courses.push({
        courseCode: originalCourseCode,
        courseName: '',
        credits: 0,
        grade: part.trim()
      });
    } else {
      // "CourseCode: Grade" format
      const code = part.substring(0, colonIdx).trim();
      const grade = part.substring(colonIdx + 1).trim();
      courses.push({
        courseCode: code,
        courseName: '',
        credits: 0,
        grade: grade || 'N/A'
      });
    }
  }

  return courses;
}

async function fixAllStudents() {
  const allStudents = await StudentResult.find({}).lean();
  console.log(`📊 Found ${allStudents.length} total students. Scanning for malformed data...\n`);

  let fixedCount = 0;
  let semestersFixed = 0;

  for (const student of allStudents) {
    let needsFix = false;

    for (const sem of student.semesters) {
      for (const course of sem.courses) {
        if (isMalformed(course.grade)) {
          needsFix = true;
          break;
        }
      }
      if (needsFix) break;
    }

    if (!needsFix) continue;

    // Fix this student
    const updatedSemesters = student.semesters.map(sem => {
      const newCourses = [];
      let semFixed = false;

      for (const course of sem.courses) {
        if (isMalformed(course.grade)) {
          const expanded = splitPackedCourses(course.courseCode, course.grade);
          newCourses.push(...expanded);
          semFixed = true;
        } else {
          newCourses.push(course);
        }
      }

      if (semFixed) semestersFixed++;
      return { ...sem, courses: semFixed ? newCourses : sem.courses };
    });

    // Update in MongoDB
    await StudentResult.updateOne(
      { _id: student._id },
      { $set: { semesters: updatedSemesters } }
    );

    fixedCount++;
    if (fixedCount <= 5) {
      // Print first 5 examples
      console.log(`🔧 Fixed: ${student.rollno} (${student.name})`);
      for (const sem of updatedSemesters) {
        const original = student.semesters.find(s => s.semesterNumber === sem.semesterNumber);
        if (original && original.courses.length !== sem.courses.length) {
          console.log(`   Sem ${sem.semesterNumber}: ${original.courses.length} → ${sem.courses.length} courses`);
        }
      }
    }
  }

  console.log(`\n✅ Done! Fixed ${fixedCount} students (${semestersFixed} semesters repaired).`);
  
  // Show a sample of the fixed data
  if (fixedCount > 0) {
    const sample = await StudentResult.findOne({ rollno: '23/CS/040' }).lean();
    if (sample) {
      console.log('\n📋 Sample (23/CS/040) after fix:');
      for (const sem of sample.semesters) {
        console.log(`   Sem ${sem.semesterNumber}: ${sem.courses.length} courses`);
        sem.courses.forEach(c => console.log(`     ${c.courseCode}: ${c.grade}`));
      }
    }
  }

  mongoose.disconnect();
}

fixAllStudents().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
