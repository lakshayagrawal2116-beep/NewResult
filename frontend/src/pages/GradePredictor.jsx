import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './GradePredictor.css';

const GradePredictor = () => {
  // --- Section 1: Class Stats ---
  const [classMarksInput, setClassMarksInput] = useState('');

  const { validMarks, mean, stdDev, cutoffs } = useMemo(() => {
    const rawMarks = classMarksInput.split(/[\n,]+/).map(m => m.trim()).filter(m => m !== '');
    const validMarksArr = rawMarks.map(Number).filter(n => !isNaN(n));
    
    let m = 65; // Default mean if no input
    let sd = 15; // Default stdDev if no input
    
    if (validMarksArr.length > 0) {
      const sum = validMarksArr.reduce((a, b) => a + b, 0);
      m = sum / validMarksArr.length;
      const variance = validMarksArr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / validMarksArr.length;
      sd = Math.sqrt(variance);
    }
    
    const calculatedCutoffs = {
      'O': Math.min(m + 1.5 * sd, 91),
      'A+': Math.min(m + 1.0 * sd, 82),
      'A': Math.min(m + 0.5 * sd, 73),
      'B+': Math.min(m + 0.0 * sd, 64),
      'B': Math.min(m - 0.5 * sd, 55),
      'C': Math.min(m - 1.0 * sd, 46),
      'P': 35
    };

    return { validMarks: validMarksArr, mean: m, stdDev: sd, cutoffs: calculatedCutoffs };
  }, [classMarksInput]);

  // --- Section 2: User Marks Prediction ---
  const [courseType, setCourseType] = useState('theory_no_lab');
  const [marks, setMarks] = useState({ cws: '', mte: '', ete: '', prs: '', pre: '' });
  const [result, setResult] = useState(null);

  useEffect(() => {
    setMarks({ cws: '', mte: '', ete: '', prs: '', pre: '' });
  }, [courseType]);

  const handleMarkChange = (field, value) => {
    setMarks({ ...marks, [field]: value === '' ? '' : Number(value) });
  };

  useEffect(() => {
    const cws = Number(marks.cws) || 0;
    const mte = Number(marks.mte) || 0;
    const ete = Number(marks.ete) || 0;
    const prs = Number(marks.prs) || 0;
    const pre = Number(marks.pre) || 0;

    let totalMarks = 0;
    let failReason = null;

    if (courseType === 'theory_no_lab') {
      totalMarks = cws + mte + ete;
      if (mte + ete < 26) failReason = 'MTE + ETE combined must be ≥ 26 / 75';
      if (totalMarks < 35) failReason = 'Total marks must be ≥ 35 / 100';
    } else if (courseType === 'theory_with_lab') {
      totalMarks = cws + prs + mte + ete;
      if (mte + ete < 21) failReason = 'MTE + ETE combined must be ≥ 21 / 60';
      if (totalMarks < 35) failReason = 'Total marks must be ≥ 35 / 100';
    } else if (courseType === 'practical') {
      totalMarks = prs + pre;
      if (pre < 17) failReason = 'PRE must be ≥ 17 / 50';
      if (totalMarks < 35) failReason = 'Total marks must be ≥ 35 / 100';
    }

    if (failReason) {
      setResult({ grade: 'F', reason: failReason, total: totalMarks, status: 'Fail' });
      return;
    }

    let predictedGrade = 'F';
    if (totalMarks >= cutoffs['O']) predictedGrade = 'O';
    else if (totalMarks >= cutoffs['A+']) predictedGrade = 'A+';
    else if (totalMarks >= cutoffs['A']) predictedGrade = 'A';
    else if (totalMarks >= cutoffs['B+']) predictedGrade = 'B+';
    else if (totalMarks >= cutoffs['B']) predictedGrade = 'B';
    else if (totalMarks >= cutoffs['C']) predictedGrade = 'C';
    else if (totalMarks >= cutoffs['P']) predictedGrade = 'P';

    setResult({ 
      grade: predictedGrade, 
      reason: 'Meets all passing criteria conditions', 
      total: totalMarks,
      status: predictedGrade === 'F' ? 'Fail' : 'Pass'
    });
  }, [marks, courseType, cutoffs]);

  return (
    <div className="predictor-container page-padding">
      <div className="calculator-header predictor-header">
        <h1 className="text-gradient">Advanced Grade Predictor</h1>
        <p>Predict your final grade by analyzing the class performance. Enter the class marks to dynamically calculate the mean and standard deviation, then input your component scores to see your result against DTU's rigorous passing criteria.</p>
      </div>

      <div className="predictor-layout">
        {/* Left Column */}
        <div className="predictor-left">
          <div className="glass-card mb-4 section-card">
            <h2 className="panel-title">1. Class Performance Data</h2>
            <p className="hint-text mb-3">Paste a comma-separated list of total marks for the class to auto-calculate grading statistics. If left empty, default values (Mean: 65, StdDev: 15) are used.</p>
            <textarea 
              placeholder="e.g., 97, 85, 76, 92..."
              value={classMarksInput}
              onChange={(e) => setClassMarksInput(e.target.value)}
              className="marks-textarea input-field mb-3"
              rows={3}
            />
            
            <div className="live-stats">
                <div className="mini-stat">
                  <span className="mini-label">Students (N)</span>
                  <strong className="mini-value text-gradient">{validMarks.length}</strong>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">Mean (x̄)</span>
                  <strong className="mini-value text-gradient">{mean.toFixed(2)}</strong>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">Std Dev (σ)</span>
                  <strong className="mini-value text-gradient">{stdDev.toFixed(2)}</strong>
                </div>
            </div>
          </div>

          <div className="glass-card section-card">
            <h2 className="panel-title">2. Your Component Marks</h2>
            <div className="form-group mb-4">
                <label>Course Type</label>
                <select value={courseType} onChange={(e) => setCourseType(e.target.value)} className="input-field select-field">
                  <option value="theory_no_lab">Theory Course (Without Lab)</option>
                  <option value="theory_with_lab">Theory Course (With Lab)</option>
                  <option value="practical">Practical Course</option>
                </select>
            </div>

            <div className="marks-grid">
                {courseType !== 'practical' && (
                  <>
                    <div className="form-group">
                      <label>CWS (/{courseType === 'theory_no_lab' ? '25' : '15'})</label>
                      <input type="number" value={marks.cws} onChange={(e) => handleMarkChange('cws', e.target.value)} className="input-field num-input" placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label>MTE (/{courseType === 'theory_no_lab' ? '25' : '20'})</label>
                      <input type="number" value={marks.mte} onChange={(e) => handleMarkChange('mte', e.target.value)} className="input-field num-input" placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label>ETE (/{courseType === 'theory_no_lab' ? '50' : '40'})</label>
                      <input type="number" value={marks.ete} onChange={(e) => handleMarkChange('ete', e.target.value)} className="input-field num-input" placeholder="0" />
                    </div>
                  </>
                )}

                {(courseType === 'theory_with_lab' || courseType === 'practical') && (
                  <div className="form-group">
                    <label>PRS/STS/CMS (/{courseType === 'practical' ? '50' : '25'})</label>
                    <input type="number" value={marks.prs} onChange={(e) => handleMarkChange('prs', e.target.value)} className="input-field num-input" placeholder="0" />
                  </div>
                )}

                {courseType === 'practical' && (
                   <div className="form-group">
                     <label>PRE/STE (/50)</label>
                     <input type="number" value={marks.pre} onChange={(e) => handleMarkChange('pre', e.target.value)} className="input-field num-input" placeholder="0" />
                   </div>
                )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="predictor-right">
          <div className="glass-card mb-4 section-card result-card">
              <h2 className="panel-title">Your Prediction</h2>
              {result && (
                <div className={`result-box ${result.status === 'Pass' ? 'success' : 'fail'}`}>
                  <div className="result-score">
                    <div className="score-block">
                      <span className="score-label">Total Marks</span>
                      <span className="score-value">{result.total.toFixed(0)}</span>
                    </div>
                    <div className="score-block">
                      <span className="score-label">Predicted Grade</span>
                      <span className={`score-value grade-${result.grade.replace('+', 'plus')}`}>{result.grade}</span>
                    </div>
                  </div>

                  <div className="result-status text-center">
                    {result.status === 'Pass' ? (
                      <CheckCircle size={20} className="icon-success inline-icon" />
                    ) : (
                      <AlertCircle size={20} className="icon-fail inline-icon" />
                    )}
                    <span className="status-reason">{result.reason}</span>
                  </div>
                </div>
              )}
          </div>

          <div className="glass-card section-card">
              <h2 className="panel-title">Dynamic Cutoffs Matrix</h2>
              <div className="cutoff-list">
                <div className="cutoff-row header">
                  <span>Grade</span>
                  <span>Minimum Required</span>
                </div>
                {['O', 'A+', 'A', 'B+', 'B', 'C', 'P'].map((g) => (
                  <div className="cutoff-row" key={g}>
                    <span className={`grade-badge badge-${g.replace('+', 'plus')}`}>{g}</span>
                    <span>{cutoffs[g].toFixed(2)}</span>
                  </div>
                ))}
                <div className="cutoff-row">
                  <span className="grade-badge badge-F">F</span>
                  <span>&lt; 35.00</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradePredictor;
