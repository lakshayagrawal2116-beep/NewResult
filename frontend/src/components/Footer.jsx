import React from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="text-gradient">ResultNowDTU</h2>
          <p>Your ultimate academic companion. Track progress, predict success.</p>
        </div>
        
        <div className="footer-links">
          <div className="link-group">
            <h3>Quick Links</h3>
            <ul>
              <li><NavLink to="/">Home</NavLink></li>
              <li><NavLink to="/results">Results</NavLink></li>
              <li><NavLink to="/profile">Profile</NavLink></li>
            </ul>
          </div>
          
          <div className="link-group">
            <h3>Tools</h3>
            <ul>
              <li><NavLink to="/sgpa-calculator">SGPA Calculator</NavLink></li>
              <li><NavLink to="/cgpa-calculator">CGPA Calculator</NavLink></li>
              <li><NavLink to="/grade-predictor">Grade Predictor</NavLink></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ResultNowDTU. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
