import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import './CSVUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CSVUpload() {
  const [file, setFile] = useState(null);
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === 'text/csv' || dropped.name.endsWith('.csv'))) {
      setFile(dropped);
      setPreview(null);
      setResult(null);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setResult(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const res = await fetch(`${API_URL}/api/admin/upload-csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401) { navigate('/admin'); return; }

      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
        setErrors(data.errors || []);
      } else {
        setErrors([{ error: data.message }]);
      }
    } catch (err) {
      setErrors([{ error: 'Failed to connect to server' }]);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirming(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/confirm-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          students: preview,
          semesterNumber
        })
      });

      const data = await res.json();
      setResult(data);
      setPreview(null);
    } catch (err) {
      setErrors([{ error: 'Failed to save data' }]);
    } finally {
      setConfirming(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="admin-upload">
      <div className="admin-page-header">
        <h1>Upload CSV</h1>
        <p>Bulk import student results from a CSV file</p>
      </div>

      {/* Step 1: File + Semester */}
      {!preview && !result && (
        <div className="upload-card">
          <div className="upload-config">
            <div className="upload-field">
              <label>Semester Number</label>
              <select value={semesterNumber} onChange={e => setSemesterNumber(parseInt(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} hidden />
            
            {file ? (
              <div className="upload-file-info">
                <FileText size={36} className="upload-file-icon" />
                <div>
                  <span className="upload-file-name">{file.name}</span>
                  <span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); resetAll(); }}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={40} />
                <span>Drag & drop your CSV file here</span>
                <span className="upload-hint">or click to browse</span>
              </div>
            )}
          </div>

          <div className="upload-format-hint">
            <AlertCircle size={14} />
            <span>Expected columns: <strong>Roll No., Name, Department, SGPA, Credits, Failed Courses, Subjects and Grades</strong></span>
          </div>

          <button className="btn-primary upload-btn" onClick={handleParse} disabled={!file || uploading}>
            {uploading ? (
              <><Loader2 size={18} className="spin" /> Parsing CSV...</>
            ) : (
              <><Upload size={18} /> Parse & Preview</>
            )}
          </button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="upload-errors">
          <h3><AlertCircle size={16} /> Parsing Errors</h3>
          {errors.map((e, i) => (
            <div key={i} className="upload-error-item">
              {e.row && <span>Row {e.row}: </span>}
              {e.error}
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Preview */}
      {preview && (
        <div className="upload-preview-section">
          <div className="upload-preview-header">
            <h2>Preview — {preview.length} students for Semester {semesterNumber}</h2>
            <div className="upload-preview-actions">
              <button className="btn-secondary" onClick={resetAll}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={confirming}>
                {confirming ? (
                  <><Loader2 size={16} className="spin" /> Saving...</>
                ) : (
                  <><Check size={16} /> Confirm & Upload</>
                )}
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>SGPA</th>
                  <th>Credits</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                    <td className="td-roll">{s.rollno}</td>
                    <td className="td-name">{s.name}</td>
                    <td><span className="dept-badge">{s.department}</span></td>
                    <td className="td-cgpa">{s.sgpa}</td>
                    <td>{s.credits}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.courses?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 100 && (
            <p className="upload-more-info">Showing 100 of {preview.length} students...</p>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {result && (
        <div className="upload-result">
          <div className="upload-result-icon"><Check size={40} /></div>
          <h2>Upload Complete!</h2>
          <div className="upload-result-stats">
            <div className="result-stat stat-new">
              <span className="result-stat-val">{result.saved}</span>
              <span>New Students</span>
            </div>
            <div className="result-stat stat-updated">
              <span className="result-stat-val">{result.updated}</span>
              <span>Updated</span>
            </div>
            {result.failed > 0 && (
              <div className="result-stat stat-failed">
                <span className="result-stat-val">{result.failed}</span>
                <span>Failed</span>
              </div>
            )}
          </div>
          <div className="upload-result-actions">
            <button className="btn-secondary" onClick={resetAll}>Upload Another</button>
            <button className="btn-primary" onClick={() => navigate('/admin/students')}>View Students</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CSVUpload;
