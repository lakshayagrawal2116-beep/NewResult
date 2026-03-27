const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';


function parseCSVLine(line) {
  // Handle quoted fields (the "Subjects and Grades" column has commas inside quotes)
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseGrades(gradesStr) {
  // Parse "AM101:F, CO101:C" or "AM101:F | CO101:C" into courses array
  if (!gradesStr) return [];

  const courses = [];
  const pairs = gradesStr.split(/[,;|]/);

  for (const pair of pairs) {
    const trimmed = pair.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const courseCode = trimmed.substring(0, colonIdx).trim();
    const grade = trimmed.substring(colonIdx + 1).trim();

    if (!courseCode) continue;

    courses.push({
      courseCode: courseCode,
      courseName: '',
      credits: 0, // We don't have per-course credits in this CSV
      grade: grade || 'N/A'
    });
  }

  return courses;
}

async function importCSV(csvFilePath, semesterNumber) {
  const content = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    console.log('CSV file is empty or has no data rows.');
    return;
  }

  // Skip header line
  const dataLines = lines.slice(1);
  console.log(`\nFound ${dataLines.length} students in CSV. Importing...\n`);

  let saved = 0;
  let failed = 0;

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    // Fields: Roll No., Name, Department, SGPA, Credits, Failed Courses, Subjects and Grades

    if (fields.length < 7) {
      console.log(`⚠️  Skipping malformed line: ${line.substring(0, 50)}...`);
      failed++;
      continue;
    }

    const rollno = fields[0];
    const name = fields[1];
    const department = fields[2];
    const sgpa = parseFloat(fields[3]) || 0;
    const credits = parseFloat(fields[4]) || 0;
    const failedCoursesStr = fields[5];
    const gradesStr = fields[6];

    const failedCourses = failedCoursesStr
      ? failedCoursesStr.split(' ').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const courses = parseGrades(gradesStr);

    try {
      await axios.post(API_URL, {
        rollno,
        name,
        department,
        semesters: [{
          semesterNumber: semesterNumber,
          sgpa,
          credits,
          failedCourses,
          courses
        }]
      });
      saved++;
    } catch (err) {
      console.error(`❌ Failed: ${rollno} - ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Import Complete: ${saved} saved, ${failed} failed out of ${dataLines.length} total.`);
}

// Usage: node csv-importer.js <csv_file_path> <semester_number>
const csvFile = process.argv[2];
const semNum = parseInt(process.argv[3]) || 1;

if (!csvFile) {
  console.log('Usage: node csv-importer.js <csv_file_path> <semester_number>');
  console.log('Example: node csv-importer.js data/cs_sem1.csv 1');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.log(`File not found: ${csvFile}`);
  process.exit(1);
}

console.log(`📂 Importing: ${csvFile}`);
console.log(`📅 Semester: ${semNum}`);
importCSV(csvFile, semNum);
