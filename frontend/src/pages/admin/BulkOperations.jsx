import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Building2, GraduationCap, BookOpen, Trash2, AlertTriangle, RefreshCw, Edit3, Users, Loader2 } from 'lucide-react';
import './BulkOperations.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function BulkOperations() {
  const [department, setDepartment] = useState('all');
  const [year, setYear] = useState('all');
  const [semester, setSemester] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [renameModal, setRenameModal] = useState(false);
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const departments = ['all', 'CSE', 'ECE', 'ME', 'CE', 'SE', 'PE', 'EE'];
  const years = ['all', '2026', '2027', '2028', '2029'];
  const semesters = ['', '1', '2', '3', '4', '5', '6', '7', '8'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          department: department,
          year: year,
          semester: semester || undefined
        })
      });
      if (res.status === 401) { navigate('/admin'); return; }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [department, year, semester]);

  const getFilterLabel = () => {
    const parts = [];
    if (department !== 'all') parts.push(department);
    if (year !== 'all') parts.push(`Batch ${year}`);
    if (!parts.length) return 'All Students';
    return parts.join(' — ');
  };

  const handleBulkDeleteStudents = async () => {
    setActionLoading('delete-students');
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ department, year })
      });
      const data = await res.json();
      showToast(data.message);
      setConfirmAction(null);
      fetchSummary();
    } catch (err) {
      showToast('Failed to delete students', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleBulkDeleteSemester = async () => {
    if (!semester) {
      showToast('Please select a semester first', 'error');
      return;
    }
    setActionLoading('delete-semester');
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk/semester`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ department, year, semester })
      });
      const data = await res.json();
      showToast(data.message);
      setConfirmAction(null);
      fetchSummary();
    } catch (err) {
      showToast('Failed to delete semester data', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleRenameDepartment = async () => {
    if (!renameFrom || !renameTo) {
      showToast('Fill both fields', 'error');
      return;
    }
    setActionLoading('rename');
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk/department-rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldName: renameFrom, newName: renameTo, year })
      });
      const data = await res.json();
      showToast(data.message);
      setRenameModal(false);
      setRenameFrom('');
      setRenameTo('');
      fetchSummary();
    } catch (err) {
      showToast('Failed to rename department', 'error');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="admin-bulk">
      <div className="admin-page-header">
        <h1>Bulk Operations</h1>
        <p>Manage students by department, graduation year, and semester</p>
      </div>

      {/* Filters */}
      <div className="bulk-filters">
        <div className="bulk-filter-group">
          <label><Building2 size={14} /> Department</label>
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {departments.map(d => (
              <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
        <div className="bulk-filter-group">
          <label><GraduationCap size={14} /> Graduation Year</label>
          <select value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => (
              <option key={y} value={y}>{y === 'all' ? 'All Batches' : `Batch ${y}`}</option>
            ))}
          </select>
        </div>
        <div className="bulk-filter-group">
          <label><BookOpen size={14} /> Semester</label>
          <select value={semester} onChange={e => setSemester(e.target.value)}>
            {semesters.map(s => (
              <option key={s} value={s}>{s === '' ? 'No Semester Filter' : `Semester ${s}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading summary...</p>
        </div>
      ) : summary && (
        <div className="bulk-summary">
          <div className="bulk-summary-header">
            <h2><Layers size={20} /> {getFilterLabel()}</h2>
            <button className="btn-text" onClick={fetchSummary}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="bulk-stats">
            <div className="bulk-stat">
              <Users size={20} />
              <div>
                <span className="bulk-stat-val">{summary.totalStudents}</span>
                <span className="bulk-stat-label">Students</span>
              </div>
            </div>
            <div className="bulk-stat">
              <Layers size={20} />
              <div>
                <span className="bulk-stat-val">{summary.avgCGPA}</span>
                <span className="bulk-stat-label">Avg. CGPA</span>
              </div>
            </div>
            {summary.semesterInfo && (
              <>
                <div className="bulk-stat">
                  <BookOpen size={20} />
                  <div>
                    <span className="bulk-stat-val">{summary.semesterInfo.studentsWithSemester}</span>
                    <span className="bulk-stat-label">Have Sem {semester} Data</span>
                  </div>
                </div>
                <div className="bulk-stat">
                  <GraduationCap size={20} />
                  <div>
                    <span className="bulk-stat-val">{summary.semesterInfo.avgSGPA}</span>
                    <span className="bulk-stat-label">Avg. SGPA (Sem {semester})</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Department Breakdown in selection */}
          {summary.departmentBreakdown?.length > 1 && (
            <div className="bulk-dept-breakdown">
              <h3>Department Breakdown</h3>
              <div className="bulk-dept-chips">
                {summary.departmentBreakdown.map(d => (
                  <div key={d.name} className="bulk-dept-chip">
                    <span className="chip-name">{d.name}</span>
                    <span className="chip-count">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {summary && summary.totalStudents > 0 && (
        <div className="bulk-actions-section">
          <h2>Bulk Actions</h2>
          <p className="bulk-actions-desc">These actions apply to <strong>{getFilterLabel()}</strong> ({summary.totalStudents} students)</p>

          <div className="bulk-actions-grid">
            {/* Delete Semester Data */}
            <div className="bulk-action-card action-warn">
              <div className="bulk-action-header">
                <BookOpen size={22} />
                <h3>Remove Semester Data</h3>
              </div>
              <p>Remove a specific semester's results from all matching students. Student records are kept, only the semester data is deleted.</p>
              <button
                className="btn-danger"
                onClick={() => {
                  if (!semester) {
                    showToast('Select a semester from the filter above first', 'error');
                    return;
                  }
                  setConfirmAction('delete-semester');
                }}
                disabled={!semester}
              >
                <Trash2 size={16} /> Remove Semester {semester || '(select above)'}
              </button>
            </div>

            {/* Delete ALL Students */}
            <div className="bulk-action-card action-danger">
              <div className="bulk-action-header">
                <Trash2 size={22} />
                <h3>Delete All Students</h3>
              </div>
              <p>Permanently delete all {summary.totalStudents} students matching this filter. This cannot be undone!</p>
              <button
                className="btn-danger"
                onClick={() => setConfirmAction('delete-students')}
                disabled={department === 'all' && year === 'all'}
              >
                <Trash2 size={16} /> Delete {summary.totalStudents} Students
              </button>
              {department === 'all' && year === 'all' && (
                <span className="bulk-action-note">Select a department or year to enable</span>
              )}
            </div>

            {/* Rename Department */}
            <div className="bulk-action-card action-info">
              <div className="bulk-action-header">
                <Edit3 size={22} />
                <h3>Rename Department</h3>
              </div>
              <p>Change the department name for all matching students. Useful when fixing department codes.</p>
              <button
                className="btn-primary"
                onClick={() => setRenameModal(true)}
              >
                <Edit3 size={16} /> Rename Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="admin-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-icon-warn"><AlertTriangle size={32} /></div>
            <h3>
              {confirmAction === 'delete-students' && 'Delete All Students?'}
              {confirmAction === 'delete-semester' && `Remove Semester ${semester} Data?`}
            </h3>
            <p>
              {confirmAction === 'delete-students' && (
                <>This will permanently delete <strong>{summary?.totalStudents}</strong> students from <strong>{getFilterLabel()}</strong>. This cannot be undone.</>
              )}
              {confirmAction === 'delete-semester' && (
                <>This will remove Semester {semester} data from all students in <strong>{getFilterLabel()}</strong>. Student records will be kept.</>
              )}
            </p>
            <div className="admin-modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={confirmAction === 'delete-students' ? handleBulkDeleteStudents : handleBulkDeleteSemester}
                disabled={!!actionLoading}
              >
                {actionLoading ? <><Loader2 size={16} className="spin" /> Processing...</> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <div className="admin-modal-overlay" onClick={() => setRenameModal(false)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '1rem' }}>Rename Department</h3>
            {year !== 'all' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Applies to Batch {year} only
              </p>
            )}
            <div className="edit-field" style={{ marginBottom: '0.75rem' }}>
              <label>Current Name</label>
              <input
                value={renameFrom}
                onChange={e => setRenameFrom(e.target.value)}
                placeholder="e.g. ECE"
              />
            </div>
            <div className="edit-field" style={{ marginBottom: '1.25rem' }}>
              <label>New Name</label>
              <input
                value={renameTo}
                onChange={e => setRenameTo(e.target.value)}
                placeholder="e.g. EC"
              />
            </div>
            <div className="admin-modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setRenameModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRenameDepartment} disabled={!!actionLoading}>
                {actionLoading === 'rename' ? <><Loader2 size={16} className="spin" /> Renaming...</> : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default BulkOperations;
