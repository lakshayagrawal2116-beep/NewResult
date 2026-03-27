import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Search, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ResultCard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ResultCard = () => {
  const [searchInput, setSearchInput] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const cardRef = useRef(null);

  const fetchProfile = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setLoading(true);
    setError('');
    setProfileData(null);
    
    try {
      const id = searchInput.trim().replace(/-/g, '/');
      const { data } = await axios.get(`${API_URL}/api/results/profile/${encodeURIComponent(id)}`);
      setProfileData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to find student.');
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    
    try {
      // Temporarily grab the canvas representation of the card DOM element
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher quality for PDF
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate aspect ratio to fit the PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const studentName = profileData?.student?.name?.replace(/\s+/g, '_') || 'Result';
      pdf.save(`${studentName}_ResultCard.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Failed to generate PDF. Please try again.');
    }
    
    setIsDownloading(false);
  };

  return (
    <div className="profile-container">
      {/* HEADER & SEARCH (Mirrors StudentProfile for consistency) */}
      <div className="profile-header">
        <h1>Download Result Card</h1>
        <p>Enter your roll number to generate and download a shareable PDF of your academic performance.</p>
        
        <form onSubmit={fetchProfile} className="search-nav">
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
          <button type="submit" className="btn-blue" disabled={loading}>
            {loading ? 'Searching...' : 'Find Result'}
          </button>
        </form>
      </div>

      {error && <div className="profile-error">{error}</div>}

      {profileData && !loading && (
        <div className="result-card-wrapper">
          
          <div className="action-row">
             <button 
               className="download-btn-large" 
               onClick={handleDownloadPDF}
               disabled={isDownloading}
             >
               <Download size={18} style={{marginRight: 8}} />
               {isDownloading ? 'Generating PDF...' : 'Download PDF Document'}
             </button>
          </div>

          {/* Actual Card to be captured */}
          <div className="printable-card" ref={cardRef}>
             <div className="printable-header">
                <h2>ResultNow DTU</h2>
                <div className="printable-avatar">
                   {profileData.student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <h3>{profileData.student.name}</h3>
                <p className="student-roll">{profileData.student.rollno}</p>
                <p className="student-univ">Delhi Technological University</p>
                <p className="last-updated">Last updated on {new Date().toLocaleDateString('en-GB')}</p>
             </div>

             <div className="printable-metrics-grid">
                <div className="print-metric">
                  <span>Dept Rank</span>
                  <strong>{profileData.metrics.departmentRank}</strong>
                </div>
                <div className="print-metric">
                  <span>Univ Rank</span>
                  <strong>{profileData.metrics.universityRank}</strong>
                </div>
                <div className="print-metric">
                  <span>Best SGPA</span>
                  <strong>{profileData.charts.sgpaTrend.length > 0 ? Math.max(...profileData.charts.sgpaTrend.map(s => s.sgpa)).toFixed(2) : 'N/A'}</strong>
                </div>
                <div className="print-metric">
                  <span>Cumulative CGPA</span>
                  <strong>{profileData.metrics.cgpa.toFixed(3)}</strong>
                </div>
             </div>

             <div className="printable-percentile">
                <span>Percentile</span>
                <strong>{profileData.metrics.percentile.toFixed(2)}</strong>
             </div>

             <div className="printable-footer">
               <strong>Note:</strong> This card is for informational purposes only and is not an official document.
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ResultCard;
