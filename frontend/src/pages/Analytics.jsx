import React, { useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Users, Award, BookOpen, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import './Analytics.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Analytics = () => {
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const YEARS = ['2026', '2027', '2028', '2029'];
  const DEPARTMENTS = ['Cumulative', 'CSE', 'EC', 'ME', 'CE', 'SE', 'PE', 'EE', 'IT', 'BT', 'EN'];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!year || !department) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await axios.get(`${API_URL}/api/results/analytics?year=${year}&department=${department}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data.');
    }
    setLoading(false);
  };

  const COLORS = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c'];
  const TOUGH_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fcd34d', '#fde047'];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Batch Analytics</h1>
        <p>Deep insights into department performance, grading distributions, and subject difficulty.</p>
      </div>

      <form className="analytics-filters" onSubmit={handleGenerate}>
        <select 
          className="filter-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        >
          <option value="" disabled>Select Year</option>
          {YEARS.map(y => <option key={y} value={y}>Batch {y}</option>)}
        </select>

        <select 
          className="filter-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        >
          <option value="" disabled>Select Department</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <button type="submit" className="generate-btn" disabled={loading || !year || !department}>
          {loading ? 'Analyzing...' : 'Generate Report'}
        </button>
      </form>

      {error && <div className="analytics-error">{error}</div>}
      
      {!data && !loading && !error && (
        <div className="analytics-empty">
          <BarChart2 size={48} style={{margin: '0 auto 1rem', opacity: 0.5}} />
          <p>Select a Year and Department to generate the academic analytics report.</p>
        </div>
      )}

      {data && (
        <div className="analytics-dashboard">
          {/* Top Metrics Row */}
          <div className="metrics-row">
            <div className="analytics-metric-card">
              <div className="metric-icon" style={{background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8'}}>
                <Users size={24} />
              </div>
              <div className="metric-info">
                <span>Total Students</span>
                <strong>{data.summary.totalStudents}</strong>
              </div>
            </div>
            <div className="analytics-metric-card">
              <div className="metric-icon" style={{background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8'}}>
                <TrendingUp size={24} />
              </div>
              <div className="metric-info">
                <span>Average CGPA</span>
                <strong>{data.summary.averageCGPA}</strong>
              </div>
            </div>
            <div className="analytics-metric-card">
              <div className="metric-icon" style={{background: 'rgba(250, 204, 21, 0.2)', color: '#facc15'}}>
                <Award size={24} />
              </div>
              <div className="metric-info">
                <span>Highest CGPA</span>
                <strong>{data.summary.highestCGPA}</strong>
              </div>
            </div>
            <div className="analytics-metric-card">
              <div className="metric-icon" style={{background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa'}}>
                <BookOpen size={24} />
              </div>
              <div className="metric-info">
                <span>Subjects Analyzed</span>
                <strong>{data.summary.totalSubjects}</strong>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            {/* CGPA Distribution - Full Width */}
            <div className="chart-wrapper chart-full-width">
              <h3><BarChart2 size={20} color="#38bdf8"/> Overall CGPA Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cgpaDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.cgpaDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Semester Trend */}
            <div className="chart-wrapper chart-full-width">
              <h3><TrendingUp size={20} color="#a78bfa"/> Semester-over-Semester Growth (Avg SGPA)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.sgpaTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="semester" stroke="#94a3b8" />
                  <YAxis domain={['auto', 10]} stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="avgSgpa" name="Average SGPA" stroke="#a78bfa" strokeWidth={4} dot={{ fill: '#a78bfa', r: 6, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Toughest Subjects */}
            <div className="chart-wrapper">
              <h3><AlertCircle size={20} color="#ef4444"/> Toughest Subjects (Most F Grades)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.toughestSubjects} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="failedCount" name="F Grades" radius={[0, 4, 4, 0]}>
                    {data.toughestSubjects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TOUGH_COLORS[index % TOUGH_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Most Scoring Subjects */}
            <div className="chart-wrapper">
              <h3><Award size={20} color="#38bdf8"/> Most Scoring Subjects (Most O/A+)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scoringSubjects} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="scoringCount" name="O/A+ Grades" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
