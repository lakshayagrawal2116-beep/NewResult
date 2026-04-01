# 📚 ResultNowDTU — Academic Result Management System

A full-stack **MERN** web application for managing and viewing university academic results. It supports student result lookup, detailed profile analytics, SGPA/CGPA calculators, grade prediction, discrepancy reporting, and a secure admin portal for bulk data management.

---

## 🌟 Features

### 👨‍🎓 Student-Facing
- 🔍 **Result Lookup** — Search results by roll number across all semesters
- 👤 **Student Profile** — Detailed dashboard with CGPA, SGPA trends, grade distribution, and class rank
- 📊 **Analytics** — Department-wide and batch-wide performance charts
- 🧮 **SGPA / CGPA Calculators** — Compute your GPA based on credits and grades
- 🎯 **Grade Predictor** — Simulate target grades to forecast your CGPA
- 🧾 **Result Card** — Download your result as a formatted PDF
- 🚨 **Discrepancy Reporting** — Flag result errors with PDF evidence for admin review

### 🛠️ Admin Portal (`/admin`)
- 🔐 **Secure Login** — JWT-based authentication with 24-hour session tokens
- 📈 **Dashboard** — Overview stats: total students, departments, semester distribution, and recent updates
- 👥 **Student Manager** — Paginated, searchable, filterable CRUD for all student records
- 📤 **CSV Upload** — Two-phase upload (preview → confirm) with smart semester merge logic
- ⚙️ **Bulk Operations** — Batch delete students, remove semesters, or rename departments
- 📋 **Discrepancies** — Review, resolve, or dismiss student-submitted result complaints

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19, Vite, React Router v7, Recharts       |
| Backend    | Node.js, Express 5                              |
| Database   | MongoDB, Mongoose                               |
| Auth       | JSON Web Tokens (JWT)                           |
| File I/O   | Multer (CSV & PDF uploads), csv-parser          |
| PDF Export | jsPDF, html2canvas                              |
| Icons      | Lucide React                                    |

---

## 📁 Project Structure

```
NewResult/
├── backend/
│   ├── models/
│   │   ├── StudentResult.js      # Mongoose schema: student + semesters + courses
│   │   └── Discrepancy.js        # Discrepancy report schema
│   ├── routes/
│   │   ├── resultRoutes.js       # Public: result lookup, analytics
│   │   ├── adminRoutes.js        # Protected: CRUD, CSV upload, bulk ops
│   │   └── discrepancyRoutes.js  # Public submit + admin review
│   ├── uploads/                  # Temp CSV and PDF uploads
│   ├── server.js                 # Express app entry point
│   └── .env                      # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Footer, AdminLayout
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── ReportDiscrepancy.jsx
│   │   │   ├── SGPACalculator.jsx
│   │   │   ├── CGPACalculator.jsx
│   │   │   ├── GradePredictor.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── StudentManager.jsx
│   │   │       ├── CSVUpload.jsx
│   │   │       ├── BulkOperations.jsx
│   │   │       └── Discrepancies.jsx
│   │   └── App.jsx               # Routing + protected admin routes
│   └── .env                      # VITE_API_URL (not committed)
│
├── csv-importer.js               # Standalone CSV seeding script
├── batch-processor.js            # Batch import helper
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/lakshayagrawal2116-beep/NewResult.git
cd NewResult
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
MONGODB_URI=mongodb://localhost:27017/newresult
JWT_SECRET=your_super_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
PORT=5000
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend`:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 📤 CSV Upload Format

The admin CSV upload expects the following column headers:

| Column | Description |
|--------|-------------|
| `Roll No.` | Student roll number (e.g. `23/CS/001`) |
| `Name` | Student full name |
| `Department` | Department code (e.g. `CS`, `EC`, `EE`) |
| `SGPA` | Semester GPA |
| `Credits` | Total credits for the semester |
| `Failed Courses` | Space-separated course codes (optional) |
| `Subjects and Grades` | Format: `CS101:A, MA101:B+` |

> The upload flow shows a **preview** before saving. Re-uploading the same semester merges/updates existing records rather than duplicating them.

---

## 🔐 API Reference

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/results/:rollno` | Get student results by roll number |
| `GET` | `/api/results/analytics` | Department/batch analytics |
| `POST` | `/api/discrepancies` | Submit a discrepancy report |

### Admin Routes (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login → returns JWT |
| `GET` | `/api/admin/stats` | Dashboard overview stats |
| `GET` | `/api/admin/students` | Paginated student list |
| `PUT` | `/api/admin/students/:id` | Update student record |
| `DELETE` | `/api/admin/students/:id` | Delete a student |
| `POST` | `/api/admin/upload-csv` | Parse CSV, return preview |
| `POST` | `/api/admin/confirm-upload` | Commit previewed data to DB |
| `DELETE` | `/api/admin/bulk/students` | Bulk delete by dept/year |
| `DELETE` | `/api/admin/bulk/semester` | Remove a semester from records |
| `PUT` | `/api/admin/bulk/department-rename` | Rename a department |
| `GET` | `/api/admin/discrepancies` | List all discrepancy reports |
| `PUT` | `/api/admin/discrepancies/:id/status` | Update report status |

---

## 📊 Database Schema

### `StudentResult`
```
{
  rollno: String (unique),
  name: String,
  department: String,
  semesters: [
    {
      semesterNumber: Number,
      sgpa: Number,
      credits: Number,
      failedCourses: [String],
      courses: [
        { courseCode, courseName, credits, grade }
      ]
    }
  ],
  createdAt, updatedAt  // auto timestamps
}
```

### `Discrepancy`
```
{
  rollno: String,
  name: String,
  issue: String,
  pdfPath: String,
  status: "Pending" | "Resolved" | "Dismissed",
  createdAt
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push and open a Pull Request



> Built with ❤️ for students, by a student.
