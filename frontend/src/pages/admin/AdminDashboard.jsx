import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, BookOpen, GraduationCap, Upload, UserCog, Clock, Layers } from 'lucide-react';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin');
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of student result data</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card stat-cyan">
          <div className="admin-stat-icon"><Users size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.totalStudents || 0}</span>
            <span className="admin-stat-label">Total Students</span>
          </div>
        </div>
        <div className="admin-stat-card stat-blue">
          <div className="admin-stat-icon"><Building2 size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.totalDepartments || 0}</span>
            <span className="admin-stat-label">Departments</span>
          </div>
        </div>
        <div className="admin-stat-card stat-purple">
          <div className="admin-stat-icon"><BookOpen size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.totalSemesters || 0}</span>
            <span className="admin-stat-label">Semesters Tracked</span>
          </div>
        </div>
        <div className="admin-stat-card stat-amber">
          <div className="admin-stat-icon"><GraduationCap size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.yearStats?.length || 0}</span>
            <span className="admin-stat-label">Graduation Batches</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-section">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-actions-grid">
          <button className="admin-action-card" onClick={() => navigate('/admin/upload')}>
            <Upload size={28} />
            <span>Upload CSV</span>
            <p>Bulk import student results</p>
          </button>
          <button className="admin-action-card" onClick={() => navigate('/admin/students')}>
            <UserCog size={28} />
            <span>Manage Students</span>
            <p>Edit or delete student data</p>
          </button>
          <button className="admin-action-card" onClick={() => navigate('/admin/bulk')}>
            <Layers size={28} />
            <span>Bulk Operations</span>
            <p>Manage by department, year, semester</p>
          </button>
        </div>
      </div>

      {/* Year-wise Distribution */}
      {stats?.yearStats?.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title"><GraduationCap size={18} /> Graduation Year Batches</h2>
          <div className="admin-dept-grid">
            {stats.yearStats.map((y) => (
              <div key={y.year} className="admin-dept-bar">
                <div className="admin-dept-header">
                  <span className="admin-dept-name">Batch {y.year}</span>
                  <span className="admin-dept-count">{y.count} students</span>
                </div>
                <div className="admin-dept-track">
                  <div
                    className="admin-dept-fill fill-amber"
                    style={{
                      width: `${(y.count / stats.totalStudents) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department breakdown */}
      {stats?.departmentStats?.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title"><Building2 size={18} /> Department Distribution</h2>
          <div className="admin-dept-grid">
            {stats.departmentStats.map((d) => (
              <div key={d.name} className="admin-dept-bar">
                <div className="admin-dept-header">
                  <span className="admin-dept-name">{d.name}</span>
                  <span className="admin-dept-count">{d.count}</span>
                </div>
                <div className="admin-dept-track">
                  <div
                    className="admin-dept-fill"
                    style={{
                      width: `${(d.count / stats.totalStudents) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Updated */}
      {stats?.recentlyUpdated?.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">
            <Clock size={18} /> Recently Updated
          </h2>
          <div className="admin-recent-list">
            {stats.recentlyUpdated.map((s) => (
              <div key={s._id} className="admin-recent-item">
                <div>
                  <span className="admin-recent-name">{s.name}</span>
                  <span className="admin-recent-roll">{s.rollno}</span>
                </div>
                <span className="admin-recent-dept">{s.department}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
