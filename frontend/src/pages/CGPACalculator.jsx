import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './CGPACalculator.css';

const CGPACalculator = () => {
  const [semesters, setSemesters] = useState([
    { id: Date.now(), name: 'Semester 1', sgpa: '', credits: '' }
  ]);

  const addSemester = () => {
    setSemesters([
      ...semesters, 
      { id: Date.now(), name: `Semester ${semesters.length + 1}`, sgpa: '', credits: '' }
    ]);
  };

  const removeSemester = (id) => {
    if (semesters.length > 1) {
      setSemesters(semesters.filter(sem => sem.id !== id));
    }
  };

  const updateSemester = (id, field, value) => {
    setSemesters(semesters.map(sem => 
      sem.id === id ? { ...sem, [field]: value } : sem
    ));
  };

  const cgpa = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;

    semesters.forEach(sem => {
      const credits = parseFloat(sem.credits) || 0;
      const sgpaVal = parseFloat(sem.sgpa) || 0;
      
      if (credits > 0 && sgpaVal > 0) {
        totalCredits += credits;
        totalPoints += (credits * sgpaVal);
      }
    });

    if (totalCredits === 0) return '0.00';
    return (totalPoints / totalCredits).toFixed(2);
  }, [semesters]);

  return (
    <div className="calculator-container page-padding">
      <div className="calculator-header">
        <h1 className="text-gradient">CGPA Calculator</h1>
        <p>Calculate your Cumulative Grade Point Average (CGPA) by entering your SGPA and total credits earned for each semester incrementally.</p>
      </div>

      <div className="calculator-card glass-card">
        <div className="calculator-grid-header">
          <div className="col-sno-cgpa">S.NO</div>
          <div className="col-sem-cgpa">SEMESTER</div>
          <div className="col-sgpa-cgpa">SGPA</div>
          <div className="col-credits-cgpa">CREDITS</div>
          <div className="col-action-cgpa">ACTION</div>
        </div>

        <div className="calculator-rows">
          {semesters.map((sem, index) => (
            <div className="calculator-row" key={sem.id}>
              <div className="col-sno-cgpa">{index + 1}</div>
              <div className="col-sem-cgpa">
                <input 
                  type="text" 
                  placeholder="E.g., Semester 1" 
                  value={sem.name}
                  onChange={(e) => updateSemester(sem.id, 'name', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-sgpa-cgpa">
                <input 
                  type="number" 
                  placeholder="SGPA (e.g. 8.5)"
                  step="0.01"
                  min="0"
                  max="10"
                  value={sem.sgpa}
                  onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-credits-cgpa">
                <input 
                  type="number" 
                  placeholder="Credits (e.g. 22)"
                  min="1" 
                  max="40"
                  value={sem.credits}
                  onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-action-cgpa">
                <button 
                  className="btn-icon btn-delete" 
                  onClick={() => removeSemester(sem.id)}
                  disabled={semesters.length === 1}
                  title="Remove Semester"
                  aria-label="Remove Semester"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="calculator-footer">
          <button className="btn-secondary add-btn" onClick={addSemester}>
            <Plus size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Add Semester
          </button>
          
          <div className="result-display">
            <span className="result-label">CGPA:</span>
            <span className="result-value text-gradient">{cgpa}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;
