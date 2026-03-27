import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calculator, Award, Users, TrendingUp, X, FileText, UserCircle, BarChart2 } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navItems = [
    { path: '/', name: 'Home', icon: Home },
    { path: '/results', name: 'Results', icon: FileText },
    { path: '/profile', name: 'Student Profile', icon: UserCircle },
    { path: '/analytics', name: 'Analytics', icon: BarChart2 },
    { path: '/result-card', name: 'Result Card', icon: Award },
    { path: '/sgpa-calculator', name: 'SGPA Calculator', icon: Calculator },
    { path: '/cgpa-calculator', name: 'CGPA Calculator', icon: Award },
    { path: '/similar-seniors', name: 'Similar Seniors', icon: Users },
    { path: '/grade-predictor', name: 'Grade Predictor', icon: TrendingUp },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="logo text-gradient">Menu</h2>
        <button className="close-sidebar-btn" onClick={closeSidebar}>
          <X size={24} color="var(--text-primary)" />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon className="nav-icon" size={20} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p>© 2026 ResultNowDTU</p>
      </div>
    </aside>
  );
};

export default Sidebar;
