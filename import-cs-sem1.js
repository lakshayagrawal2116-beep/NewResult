const axios = require('axios');
const API_URL2 = process.env.API_URL || 'http://localhost:5000';

const API_URL = `${API_URL2}/api/results`;
const fs = require('fs');

// Read the CSV from stdin or from the file passed as argument
async function run() {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.log('Usage: node import-cs-sem1.js <path-to-csv>');
    process.exit(1);
  }

  const content = fs.readFileSync(csvFile, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const dataLines = lines.slice(1); // skip header

  console.log(`Found ${dataLines.length} students. Importing to Semester 1...\n`);

  let saved = 0, failed = 0;

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 7) { failed++; continue; }

    const rollno = fields[0];
    const name = fields[1];
    const department = fields[2];
    const sgpa = parseFloat(fields[3]) || 0;
    const credits = parseFloat(fields[4]) || 0;
    const failedCoursesStr = fields[5];
    const gradesStr = fields[6];

    const failedCourses = failedCoursesStr
      ? failedCoursesStr.split(' ').map(s => s.trim()).filter(s => s)
      : [];

    const courses = parseGrades(gradesStr);

    try {
      await axios.post(API_URL, {
        rollno, name, department,
        semesters: [{ semesterNumber: 1, sgpa, credits, failedCourses, courses }]
      });
      saved++;
      if (saved % 50 === 0) console.log(`  ...saved ${saved} students`);
    } catch (err) {
      console.error(`❌ ${rollno}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Done! ${saved} saved, ${failed} failed out of ${dataLines.length}`);
}

function parseCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += c;
  }
  result.push(current.trim());
  return result;
}

function parseGrades(str) {
  if (!str) return [];
  return str.split(',').map(p => {
    const t = p.trim();
    const i = t.indexOf(':');
    if (i === -1) return null;
    return { courseCode: t.substring(0, i).trim(), courseName: '', credits: 0, grade: t.substring(i + 1).trim() || 'N/A' };
  }).filter(Boolean);
}

run();
