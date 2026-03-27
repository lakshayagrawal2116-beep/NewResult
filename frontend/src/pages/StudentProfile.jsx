import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Award, TrendingUp, BookOpen, Star, Share2, Search, Gift, Swords } from 'lucide-react';
import './StudentProfile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentProfile = () => {
  const { rollno } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-fetch when rollno changes
  useEffect(() => {
    if (rollno) {
      fetchProfile(rollno.replace(/-/g, '/')); // Roll numbers in URL are joined by dash
    } else {
      setLoading(false);
      setProfileData(null);
    }
  }, [rollno]);

  const fetchProfile = async (id) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_URL}/api/results/profile/${encodeURIComponent(id)}`);
      setProfileData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/profile/${searchInput.trim().replace(/\//g, '-')}`);
    }
  };

  if (loading && rollno) return <div className="profile-container"><div className="profile-loading">Loading student metrics...</div></div>;
  if (error) return <div className="profile-container"><div className="profile-error">{error}</div></div>;

  const renderProfileBody = () => {
    if (!profileData) {
      if (!rollno) {
         return (
           <div className="dashboard-wrapper" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', opacity: 0.7}}>
              <Search size={48} color="#38bdf8" style={{marginBottom: 20}} />
              <h2 style={{color: '#f8fafc', fontWeight: 500, fontSize: 24}}>Search for a Student</h2>
              <p style={{color: '#94a3b8', marginTop: 10}}>Enter a valid university roll number above (e.g. 23/CS/040) to view performance analytics.</p>
           </div>
         );
      }
      return null;
    }

    const { student, metrics, charts } = profileData;
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const joinYear = parseInt(student.rollno.split('/')[0]) + 2000;
    const gradYear = joinYear + 4;

    return (
      <div className="dashboard-wrapper">
        <h2 className="section-title">Student Details</h2>

        {/* STUDENT CARD */}
        <div className="student-card">
          <div className="student-card-left">
            <div className="avatar">{initials}</div>
            <div className="student-card-info">
              <h2>{student.name}</h2>
              <p>{student.rollno} • B.Tech</p>
              <div className="badges">
                <span className="badge">{student.department === 'EC' ? 'electronics & communication' : student.department === 'CS' ? 'computer science engineering' : student.department}</span>
                <span className="badge">{student.department}</span>
              </div>
            </div>
          </div>
          <div className="student-card-right">
             <div className="term-box">
               <span>Admission</span>
               <strong>{joinYear}</strong>
             </div>
             <div className="term-box">
               <span>Graduation</span>
               <strong>{gradYear}</strong>
             </div>
          </div>
        </div>

        {/* 4 METRICS */}
        <div className="metrics-grid">
          <div className="metric-card green">
            <Star />
            <span className="metric-label">Cumulative CGPA</span>
            <span className="metric-value">{metrics.cgpa.toFixed(3)}</span>
          </div>
          <div className="metric-card purple">
            <Award />
            <span className="metric-label">University Rank</span>
            <span className="metric-value">#{metrics.universityRank}</span>
          </div>
          <div className="metric-card blue">
            <TrendingUp />
            <span className="metric-label">Dept. Rank</span>
            <span className="metric-value">#{metrics.departmentRank}</span>
          </div>
          <div className="metric-card orange">
            <BookOpen />
            <span className="metric-label">Credits Completed</span>
            <span className="metric-value">{metrics.totalCredits}</span>
          </div>
        </div>

        {/* ANALYTICS ROW */}
        <div className="two-col-grid">
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 5px 0' }}>Grade Summary</h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>Academic Breakdown</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: '#38bdf8', letterSpacing: 1 }}>O (OUTSTANDING)</span>
              <span style={{ fontSize: 12, fontWeight: 'bold' }}>{charts.gradeBreakdown['O'] || 0}</span>
            </div>
            <div style={{ width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginBottom: 15 }}>
              <div style={{ width: `${Math.min(100, (charts.gradeBreakdown['O'] || 0) * 10)}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: 3 }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: '#a78bfa', letterSpacing: 1 }}>A+ (EXCELLENT)</span>
              <span style={{ fontSize: 12, fontWeight: 'bold' }}>{charts.gradeBreakdown['A+'] || 0}</span>
            </div>
            <div style={{ width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3 }}>
               <div style={{ width: `${Math.min(100, (charts.gradeBreakdown['A+'] || 0) * 10)}%`, height: '100%', backgroundColor: '#a78bfa', borderRadius: 3 }}></div>
            </div>
          </div>

          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 20px 0' }}>Percentile Growth</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
              <span>LOW</span>
              <span>MEDIUM</span>
              <span>HIGH</span>
            </div>

            <div style={{ width: '100%', height: 20, background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)', borderRadius: 4, position: 'relative' }}>
               <div style={{ position: 'absolute', top: -5, left: `${metrics.percentile}%`, transform: 'translateX(-50%)', width: 4, height: 30, backgroundColor: '#fff', borderRadius: 2, boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}></div>
            </div>
            <div style={{ width: '100%', textAlign: 'right', marginTop: 10, fontWeight: 800, fontSize: 18 }}>{metrics.percentile}%</div>
          </div>
        </div>

        <h2 className="section-title">Semester Details</h2>
        <div className="semesters-grid">
          {student.semesters.map(sem => (
            <div className="semester-card" key={sem._id || sem.semesterNumber}>
              <div className="semester-header">
                <h3>Semester {sem.semesterNumber}</h3>
                <span className="sem-sgpa">{sem.credits} Cr | {sem.sgpa.toFixed(2)}</span>
              </div>
              {sem.courses.map((course, i) => (
                <div className="subject-item" key={i}>
                  <div className="subject-info">
                    <div className="sub-code">{course.courseCode}</div>
                    <div className="sub-name">{course.courseName || `Subject ${course.courseCode}`}</div>
                  </div>
                  <div className="sub-grade">{course.grade}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RECHARTS TIER */}
        <h2 className="section-title">SGPA Trend</h2>
        <div className="large-chart-card">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.sgpaTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="semester" stroke="#94a3b8" />
              <YAxis domain={['auto', 10]} stroke="#94a3b8" />
              <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b' }} />
              <Line type="monotone" dataKey="sgpa" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h2 className="section-title">Rank Progression</h2>
        <div className="two-col-grid">
           <div className="large-chart-card" style={{ height: 250 }}>
              <h3 style={{ fontSize: 14 }}>Cumulative University Rank</h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={charts.rankProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="semester" stroke="#94a3b8" />
                  <YAxis reversed stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b' }} />
                  <Line type="stepAfter" dataKey="univRank" stroke="#a78bfa" strokeWidth={3} dot={{ fill: '#a78bfa', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
           <div className="large-chart-card" style={{ height: 250 }}>
              <h3 style={{ fontSize: 14 }}>Cumulative Department Rank</h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={charts.rankProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="semester" stroke="#94a3b8" />
                  <YAxis reversed stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b' }} />
                  <Line type="stepAfter" dataKey="deptRank" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <h2 className="section-title">Branch CGPA Distribution</h2>
        <div className="large-chart-card">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.cgpaDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis domain={[0, 10]} stroke="#94a3b8" />
              <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b' }} cursor={{fill: 'transparent'}}/>
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                 {
                   charts.cgpaDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                   ))
                 }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    );
  };

  return (
    <div className="profile-container">
      
      {/* HEADER & SEARCH */}
      <div className="profile-header">

        <h1>DTU Student Profile</h1>
        <p>Enter your roll number to view a concise report of your semester grades and academic performance.</p>
        
        <form onSubmit={handleSearch} className="search-nav">
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 15, top: 12 }} />
            <input 
              type="text" 
              className="search-input-profile" 
              placeholder="e.g. 23/CS/040" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button type="submit" className="btn-blue">View Grades</button>
          <button type="button" className="btn-green"><Share2 size={16} style={{marginRight: 6, verticalAlign: 'middle'}}/>Share Profile</button>
        </form>
      </div>

      {renderProfileBody()}
    </div>
  );
};

export default StudentProfile;
