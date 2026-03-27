const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const PDF_DIR = path.join(__dirname, 'pdfs_to_process');
const API_URL = process.env.API_URL || 'http://localhost:5000';


async function processPDFFiles() {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR);
    console.log('Created "pdfs_to_process" folder. Please place your PDFs inside it and run this script again!');
    return;
  }

  const files = fs.readdirSync(PDF_DIR).filter(file => file.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No PDFs found in "pdfs_to_process" folder. Please add some and try again.');
    return;
  }

  console.log(`Found ${files.length} PDFs. Starting batch processing...\n`);

  for (const file of files) {
    console.log(`\n📄 Processing: ${file}...`);
    const filePath = path.join(PDF_DIR, file);

    try {
      // 1. Upload the PDF to our Python Parser API
      const formData = new FormData();
      formData.append('pdf', fs.createReadStream(filePath));

      console.log('   -> Parsing PDF...');
      const parseResponse = await axios.post(`${API_URL}/api/results/upload-pdf`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const studentsData = parseResponse.data.data;
      console.log(`   -> Successfully extracted ${studentsData.length} students!`);

      // 2. Save each student to the Database
      let savedCount = 0;
      for (const student of studentsData) {
        try {
          // Dynamically extract Department from Roll No (e.g., 23/CH/323 -> CH)
          let branchCode = "UNKNOWN";
          if (student.rollno && student.rollno.includes('/')) {
            const parts = student.rollno.split('/');
            if (parts.length > 1) {
              branchCode = parts[1].toUpperCase();
            }
          }

          // Dynamically guess Semester from Filename
          let semNum = 1;
          const ufile = file.toUpperCase();
          if (ufile.includes('_I_') || ufile.includes('_1_')) semNum = 1;
          else if (ufile.includes('_II_') || ufile.includes('_2_')) semNum = 2;
          else if (ufile.includes('_III_') || ufile.includes('_3_')) semNum = 3;
          else if (ufile.includes('_IV_') || ufile.includes('_4_')) semNum = 4;
          else if (ufile.includes('_V_') || ufile.includes('_5_')) semNum = 5;
          else if (ufile.includes('_VI_') || ufile.includes('_6_')) semNum = 6;

          // Send to the Database Upload API
          await axios.post(`${API_URL}/api/results`, {
            rollno: student.rollno,
            name: student.name,
            department: branchCode,
            semesters: [
              {
                semesterNumber: semNum,
                sgpa: student.sgpa,
                credits: student.totalCredits,
                failedCourses: student.failedCourses,
                courses: student.courses
              }
            ]
          });
          savedCount++;
        } catch (dbErr) {
          console.error(`   ❌ Failed to save RollNo: ${student.rollno}`);
        }
      }

      console.log(`✅ Completed: Saved ${savedCount}/${studentsData.length} students to MongoDB for ${file}`);

    } catch (err) {
      console.error(`❌ Error processing ${file}: ${err.message}`);
      if (err.response && err.response.data) {
        console.error('API Error:', err.response.data);
      }
    }
  }
}

// Ensure axios and form-data are installed
// Run: npm install axios form-data
processPDFFiles();
