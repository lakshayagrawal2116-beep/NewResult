import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, ExternalLink, Activity, FileText } from 'lucide-react';
import './Discrepancies.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Discrepancies = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_URL}/api/admin/discrepancies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/discrepancies/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh list
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="admin-loading">Loading reports...</div>;

  return (
    <div className="admin-reports-container">
      <div className="admin-header-row">
        <div>
          <h2 className="admin-page-title">Discrepancy Reports</h2>
          <p className="admin-page-subtitle">Review student reports and support documents to correct grading errors.</p>
        </div>
      </div>

      {error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date Sent</th>
                <th>Roll Number</th>
                <th>Details</th>
                <th>Proof</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No discrepancy reports found.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id}>
                     <td style={{whiteSpace: 'nowrap'}}>
                        {new Date(report.createdAt).toLocaleDateString()}
                     </td>
                     <td><strong>{report.rollno}</strong><br/><small style={{color: '#94a3b8'}}>{report.email}</small></td>
                     <td style={{maxWidth: '300px'}}>
                        <p style={{margin: 0, fontSize: '0.9rem', lineHeight: '1.4'}}>{report.description}</p>
                     </td>
                     <td>
                        <a 
                          href={`${API_URL}${report.documentPath}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="proof-link"
                        >
                          <FileText size={16} /> View PDF
                        </a>
                     </td>
                     <td>
                        <span className={`status-badge ${report.status.toLowerCase()}`}>
                          {report.status}
                        </span>
                     </td>
                     <td>
                        {report.status === 'Pending' && (
                          <div className="btn-group-sm">
                            <button className="btn-success-sm" onClick={() => updateStatus(report._id, 'Resolved')}>Mark Resolved</button>
                            <button className="btn-danger-sm" onClick={() => updateStatus(report._id, 'Dismissed')}>Dismiss</button>
                          </div>
                        )}
                        {report.status !== 'Pending' && (
                          <button className="btn-ghost-sm" onClick={() => updateStatus(report._id, 'Pending')}>Re-open</button>
                        )}
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Discrepancies;
