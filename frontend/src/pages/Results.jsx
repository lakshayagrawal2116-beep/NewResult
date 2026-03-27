import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Results.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const YEARS = [2026, 2027, 2028, 2029];
const BRANCHES = ["Cumulative", "AE", "BT", "CE", "CH", "CSE", "EC", "EE", "EN", "EP", "IT", "MC", "ME", "PE", "SE"];

const Results = () => {
  const [selectedYear, setSelectedYear] = useState(2027); // Default to our 23/ batch
  const [selectedBranch, setSelectedBranch] = useState("Cumulative");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/results/leaderboard`, {
        params: {
          year: selectedYear,
          branch: selectedBranch
        }
      });
      setStudents(data);
    } catch (err) {
      setError("Failed to load results. Please try again later.");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear, selectedBranch]);

  // Client-side search filtering
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.rollno.toLowerCase().includes(lowerQuery)
    );
  }, [students, searchQuery]);

  return (
    <div className="results-container">
      <div className="results-header">
        
        {/* Year Tabs */}
        <div className="year-tabs">
          {YEARS.map(year => (
            <button 
              key={year}
              className={`year-tab ${selectedYear === year ? 'active' : ''}`}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Branch Tabs */}
        <div className="branch-tabs">
          {BRANCHES.map(branch => (
            <button 
              key={branch}
              className={`branch-tab ${selectedBranch === branch ? 'active' : ''}`}
              onClick={() => setSelectedBranch(branch)}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* <div className="announcement-banner">
        🚀 Major Update: Student Profiles now include full subject names, detailed grades, and a redesigned UI. Click on any student name to check it out.
      </div> */}

      <div className="search-bar-container">
        <div className="search-label">Search</div>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Name or Roll No..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner">Loading Leaderboard...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>NAME</th>
                <th>ROLL NO</th>
                <th>BRANCH</th>
                <th>SEM I ⇅</th>
                <th>SEM II ⇅</th>
                <th>SEM III ⇅</th>
                <th>CGPA ⇅</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{student.rank}</td>
                    <td>
                      <div className="student-name">
                        <a href={`/profile/${student.rollno.replace(/\//g, '-')}`}>
                          {student.name}
                          <span className="external-link-icon">↗</span>
                        </a>
                        {student.rank === 1 && <span className="medals" title="Rank 1">🥇 🎁</span>}
                        {student.rank === 2 && <span className="medals" title="Rank 2">🥈 🎁</span>}
                        {student.rank === 3 && <span className="medals" title="Rank 3">🥉 🎁</span>}
                      </div>
                    </td>
                    <td>{student.rollno}</td>
                    <td>{student.branch}</td>
                    <td>{student.sem1 !== '-' ? parseFloat(student.sem1).toFixed(2) : '-'}</td>
                    <td>{student.sem2 !== '-' ? parseFloat(student.sem2).toFixed(2) : '-'}</td>
                    <td>{student.sem3 !== '-' ? parseFloat(student.sem3).toFixed(2) : '-'}</td>
                    <td className="cgpa-cell">{student.cgpa > 0 ? student.cgpa.toFixed(3) : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    No results found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Results;
