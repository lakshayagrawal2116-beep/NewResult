import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const navItems = [
    { path: '/results', name: 'Results' },
    { path: '/profile', name: 'Student Profile' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/result-card', name: 'Result Card' },
    { 
      name: 'Tools', 
      dropdown: [
        { path: '/sgpa-calculator', name: 'SGPA Calculator' },
        { path: '/cgpa-calculator', name: 'CGPA Calculator' },
        { path: '/grade-predictor', name: 'Grade Predictor' },
        { path: '/report-discrepancy', name: 'Report Discrepancy' }
      ]
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} color="var(--text-primary)" />
          </button>
          <NavLink to="/" className="navbar-logo text-gradient">
            ResultNowDTU
          </NavLink>
        </div>

        <nav className="navbar-nav desktop-only">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className={item.dropdown ? 'nav-dropdown-container' : ''}>
                {item.dropdown ? (
                  <>
                    <span className="navbar-link dropdown-toggle">
                      {item.name} <ChevronDown size={16} className="dropdown-icon" />
                    </span>
                    <ul className="dropdown-menu">
                      {item.dropdown.map(dropItem => (
                        <li key={dropItem.path}>
                          <NavLink 
                            to={dropItem.path} 
                            className={({ isActive }) => `dropdown-link ${isActive ? 'active' : ''}`}
                          >
                            {dropItem.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  >
                    {item.name}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="navbar-right desktop-only">
          {/* Login functionality temporarily removed */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
