import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Edit3, Trash2, X, Save, ChevronLeft, ChevronRight, AlertTriangle, Plus, Minus, GraduationCap } from 'lucide-react';
import './StudentManager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [year, setYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const departments = ['all', 'CSE', 'EC', 'ME', 'CE', 'SE', 'PE', 'EE'];
  const years = ['all', '2026', '2027', '2028', '2029'];

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search, department, year });
      const res = await fetch(`${API_URL}/api/admin/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { navigate('/admin'); return; }
      const data = await res.json();
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [search, department, year, token, navigate]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchStudents(1), 300);
    return () => clearTimeout(debounce);
  }, [search, department, year, fetchStudents]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = async (student) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${student._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullStudent = await res.json();
      setEditingStudent(JSON.parse(JSON.stringify(fullStudent)));
    } catch (err) {
      showToast('Failed to load student data', 'error');
    }
  };

  const handleSave = async () => {
    if (!editingStudent) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingStudent.name,
          department: editingStudent.department,
          rollno: editingStudent.rollno,
          semesters: editingStudent.semesters
        })
      });
      if (res.ok) {
        showToast('Student updated successfully');
        setEditingStudent(null);
        fetchStudents(pagination.page);
      } else {
        const data = await res.json();
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Student deleted successfully');
        setDeleteConfirm(null);
        fetchStudents(pagination.page);
      }
    } catch (err) {
      showToast('Failed to delete student', 'error');
    }
  };

  const handleDeleteSemester = async (studentId, semNumber) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${studentId}/semester/${semNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Semester ${semNumber} deleted`);
        // Refresh editing student
        handleEdit({ _id: studentId });
        fetchStudents(pagination.page);
      }
    } catch (err) {
      showToast('Failed to delete semester', 'error');
    }
  };

  const updateEditField = (field, value) => {
    setEditingStudent(prev => ({ ...prev, [field]: value }));
  };

  const updateSemesterField = (semIndex, field, value) => {
    setEditingStudent(prev => {
      const updated = { ...prev };
      updated.semesters = [...updated.semesters];
      updated.semesters[semIndex] = { ...updated.semesters[semIndex], [field]: value };
      return updated;
    });
  };

  const updateCourseField = (semIndex, courseIndex, field, value) => {
    setEditingStudent(prev => {
      const updated = { ...prev };
      updated.semesters = [...updated.semesters];
      updated.semesters[semIndex] = { ...updated.semesters[semIndex] };
      updated.semesters[semIndex].courses = [...updated.semesters[semIndex].courses];
      updated.semesters[semIndex].courses[courseIndex] = {
        ...updated.semesters[semIndex].courses[courseIndex],
        [field]: value
      };
      return updated;
    });
  };

  const addCourse = (semIndex) => {
    setEditingStudent(prev => {
      const updated = { ...prev };
      updated.semesters = [...updated.semesters];
      updated.semesters[semIndex] = { ...updated.semesters[semIndex] };
      updated.semesters[semIndex].courses = [
        ...updated.semesters[semIndex].courses,
        { courseCode: '', courseName: '', credits: 0, grade: '' }
      ];
      return updated;
    });
  };

  const removeCourse = (semIndex, courseIndex) => {
    setEditingStudent(prev => {
      const updated = { ...prev };
      updated.semesters = [...updated.semesters];
      updated.semesters[semIndex] = { ...updated.semesters[semIndex] };
      updated.semesters[semIndex].courses = updated.semesters[semIndex].courses.filter(
        (_, i) => i !== courseIndex
      );
      return updated;
    });
  };

  return (
    <div className="admin-students">
      <div className="admin-page-header">
        <h1>Student Management</h1>
        <p>Search, edit, or remove student records</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-select">
          <Filter size={16} />
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map(d => (
              <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
        <div className="admin-filter-select">
          <GraduationCap size={16} />
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map(y => (
              <option key={y} value={y}>{y === 'all' ? 'All Batches' : `Batch ${y}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="admin-empty">
          <p>No students found</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semesters</th>
                  <th>CGPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td className="td-roll">{s.rollno}</td>
                    <td className="td-name">{s.name}</td>
                    <td><span className="dept-badge">{s.department}</span></td>
                    <td>{s.semesterCount}</td>
                    <td className="td-cgpa">{s.cgpa}</td>
                    <td className="td-actions">
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(s)} title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteConfirm(s)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="admin-pagination-buttons">
              <button disabled={pagination.page <= 1} onClick={() => fetchStudents(pagination.page - 1)}>
                <ChevronLeft size={18} />
              </button>
              <span>{pagination.page} / {pagination.totalPages}</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchStudents(pagination.page + 1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-icon-warn"><AlertTriangle size={32} /></div>
            <h3>Delete Student?</h3>
            <p>This will permanently delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.rollno}) and all their results.</p>
            <div className="admin-modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="admin-modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Student</h3>
              <button className="btn-icon" onClick={() => setEditingStudent(null)}><X size={20} /></button>
            </div>

            <div className="admin-modal-body">
              {/* Basic Info */}
              <div className="edit-section">
                <h4>Basic Information</h4>
                <div className="edit-row">
                  <div className="edit-field">
                    <label>Roll No.</label>
                    <input value={editingStudent.rollno} onChange={e => updateEditField('rollno', e.target.value)} />
                  </div>
                  <div className="edit-field">
                    <label>Name</label>
                    <input value={editingStudent.name} onChange={e => updateEditField('name', e.target.value)} />
                  </div>
                  <div className="edit-field">
                    <label>Department</label>
                    <input value={editingStudent.department} onChange={e => updateEditField('department', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Semesters */}
              {editingStudent.semesters?.map((sem, si) => (
                <div className="edit-section" key={si}>
                  <div className="edit-section-header">
                    <h4>Semester {sem.semesterNumber}</h4>
                    <button className="btn-text btn-danger-text" onClick={() => handleDeleteSemester(editingStudent._id, sem.semesterNumber)}>
                      <Trash2 size={14} /> Remove Semester
                    </button>
                  </div>
                  <div className="edit-row">
                    <div className="edit-field">
                      <label>SGPA</label>
                      <input type="number" step="0.01" value={sem.sgpa} onChange={e => updateSemesterField(si, 'sgpa', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="edit-field">
                      <label>Credits</label>
                      <input type="number" value={sem.credits} onChange={e => updateSemesterField(si, 'credits', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="edit-courses">
                    <div className="edit-courses-header">
                      <span>Courses</span>
                      <button className="btn-text" onClick={() => addCourse(si)}>
                        <Plus size={14} /> Add Course
                      </button>
                    </div>
                    {sem.courses?.map((course, ci) => (
                      <div className="edit-course-row" key={ci}>
                        <input placeholder="Code" value={course.courseCode} onChange={e => updateCourseField(si, ci, 'courseCode', e.target.value)} />
                        <input placeholder="Name" value={course.courseName} onChange={e => updateCourseField(si, ci, 'courseName', e.target.value)} />
                        <input placeholder="Grade" value={course.grade} onChange={e => updateCourseField(si, ci, 'grade', e.target.value)} className="input-sm" />
                        <button className="btn-icon btn-delete" onClick={() => removeCourse(si, ci)}><Minus size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-modal-footer">
              <button className="btn-secondary" onClick={() => setEditingStudent(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="admin-spinner-sm" /> Saving...</> : <><Save size={16} /> Save Changes</>}
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

export default StudentManager;
