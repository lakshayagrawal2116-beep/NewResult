import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './SGPACalculator.css';

const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0
};

const SGPACalculator = () => {
  const [subjects, setSubjects] = useState([
    { id: Date.now(), name: '', credits: 4, grade: 'O' }
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), name: '', credits: 4, grade: 'O' }]);
  };

  const removeSubject = (id) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(sub => sub.id !== id));
    }
  };

  const updateSubject = (id, field, value) => {
    setSubjects(subjects.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const sgpa = useMemo(() => {
    let totalCredits = 0;
    let earnedPoints = 0;

    subjects.forEach(sub => {
      const credits = parseFloat(sub.credits) || 0;
      const points = GRADE_POINTS[sub.grade] || 0;
      
      totalCredits += credits;
      earnedPoints += (credits * points);
    });

    if (totalCredits === 0) return '0.00';
    return (earnedPoints / totalCredits).toFixed(2);
  }, [subjects]);

  return (
    <div className="calculator-container page-padding">
      <div className="calculator-header">
        <h1 className="text-gradient">SGPA Calculator</h1>
        <p>The SGPA Calculator allows you to calculate your Semester Grade Point Average for a specific semester by inputting your grades and credit hours, helping you track your semester-wise academic progress.</p>
      </div>

      <div className="calculator-card glass-card">
        <div className="calculator-grid-header">
          <div className="col-sno">S.NO</div>
          <div className="col-subject">SUBJECT</div>
          <div className="col-credits">CREDITS</div>
          <div className="col-grade">GRADE</div>
          <div className="col-action">ACTION</div>
        </div>

        <div className="calculator-rows">
          {subjects.map((sub, index) => (
            <div className="calculator-row" key={sub.id}>
              <div className="col-sno">{index + 1}</div>
              <div className="col-subject">
                <input 
                  type="text" 
                  placeholder="Subject/Course" 
                  value={sub.name}
                  onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-credits">
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={sub.credits}
                  onChange={(e) => updateSubject(sub.id, 'credits', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-grade">
                <select 
                  value={sub.grade} 
                  onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                  className="input-field select-field"
                >
                  {Object.keys(GRADE_POINTS).map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="col-action">
                <button 
                  className="btn-icon btn-delete" 
                  onClick={() => removeSubject(sub.id)}
                  disabled={subjects.length === 1}
                  title="Remove Subject"
                  aria-label="Remove Subject"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="calculator-footer">
          <button className="btn-secondary add-btn" onClick={addSubject}>
            <Plus size={18} style={{marginRight: '8px'}} /> Add Subject
          </button>
          
          <div className="result-display">
            <span className="result-label">SGPA:</span>
            <span className="result-value text-gradient">{sgpa}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SGPACalculator;
