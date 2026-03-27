import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SGPACalculator from './pages/SGPACalculator';
import CGPACalculator from './pages/CGPACalculator';
import GradePredictor from './pages/GradePredictor';
import Results from './pages/Results';
import StudentProfile from './pages/StudentProfile';

// Admin imports
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManager from './pages/admin/StudentManager';
import CSVUpload from './pages/admin/CSVUpload';
import BulkOperations from './pages/admin/BulkOperations';

import Analytics from './pages/Analytics';
import ResultCard from './pages/ResultCard';
import ReportDiscrepancy from './pages/ReportDiscrepancy';
import Discrepancies from './pages/admin/Discrepancies';

// Placeholder components
const SimilarSeniors = () => <div className="glass-card page-padding"><h1>Similar Seniors</h1><p>Connect feature coming soon...</p></div>;

// Protected Route wrapper for admin pages
function AdminProtected({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <Routes>
        {/* ═══ Admin Routes ═══ */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtected>
              <AdminLayout />
            </AdminProtected>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentManager />} />
          <Route path="upload" element={<CSVUpload />} />
          <Route path="bulk" element={<BulkOperations />} />
          <Route path="discrepancies" element={<Discrepancies />} />
        </Route>

        {/* ═══ User Routes ═══ */}
        <Route
          path="*"
          element={
            <div className="app-wrapper">
              <Navbar toggleSidebar={toggleSidebar} />
              <div className="app-container">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/profile" element={<StudentProfile />} />
                    <Route path="/profile/:rollno" element={<StudentProfile />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/result-card" element={<ResultCard />} />
                    <Route path="/report-discrepancy" element={<ReportDiscrepancy />} />
                    <Route path="/sgpa-calculator" element={<SGPACalculator />} />
                    <Route path="/cgpa-calculator" element={<CGPACalculator />} />
                    <Route path="/similar-seniors" element={<SimilarSeniors />} />
                    <Route path="/grade-predictor" element={<GradePredictor />} />
                  </Routes>
                </main>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
