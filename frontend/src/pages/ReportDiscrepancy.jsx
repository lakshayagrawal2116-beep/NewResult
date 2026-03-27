import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FileText, UploadCloud, AlertTriangle, CheckCircle } from 'lucide-react';
import './ReportDiscrepancy.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReportDiscrepancy = () => {
  const [formData, setFormData] = useState({
    rollno: '',
    email: '',
    description: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be under 5MB.' });
        setPdfFile(null);
      } else {
        setPdfFile(file);
        setMessage({ type: '', text: '' });
      }
    } else {
      setMessage({ type: 'error', text: 'Only PDF files are allowed.' });
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setMessage({ type: 'error', text: 'Please attach a supporting PDF document.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    data.append('rollno', formData.rollno);
    data.append('email', formData.email);
    data.append('description', formData.description);
    data.append('document', pdfFile);

    try {
      const response = await axios.post(`${API_URL}/api/discrepancies`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: response.data.message });
      setFormData({ rollno: '', email: '', description: '' });
      setPdfFile(null);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit report. Please try again later.' 
      });
    }
    setLoading(false);
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <AlertTriangle size={32} color="#facc15" style={{ marginBottom: 10 }} />
        <h1>Report Result Discrepancy</h1>
        <p>Found an error in your grades or missing back-papers? Submit a report with official proof and the administration will update your record.</p>
      </div>

      <div className="report-card">
        {message.text && (
          <div className={`report-message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="rollno">Roll Number *</label>
              <input 
                type="text" 
                id="rollno" 
                name="rollno" 
                placeholder="23/CS/040" 
                value={formData.rollno} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">University Email *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="akshit@dtu.ac.in" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description of Issue *</label>
            <textarea 
              id="description" 
              name="description" 
              rows="5"
              placeholder="e.g. My Sem 3 SGPA is showing as 0.0 because my back-paper in EE205 was cleared but it's not reflected here."
              value={formData.description} 
              onChange={handleInputChange} 
              required 
            ></textarea>
          </div>

          <div className="form-group file-upload-group">
            <label>Supporting Document (PDF Only, Max 5MB) *</label>
            <div className={`file-drop-zone ${pdfFile ? 'has-file' : ''}`}>
              <input 
                type="file" 
                id="document-upload" 
                accept="application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
              />
              <div className="drop-zone-content">
                {pdfFile ? (
                  <>
                    <FileText size={32} color="#10b981" />
                    <span className="file-name">{pdfFile.name}</span>
                    <span className="file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} color="#94a3b8" />
                    <span>Click to browse or drag PDF file here</span>
                    <span className="file-hint">Official marksheets, re-eval notices, etc.</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="submit-report-btn" disabled={loading}>
            {loading ? 'Submitting Report...' : 'Submit Discrepancy Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportDiscrepancy;
