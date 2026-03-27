import React from 'react';
import './Home.css';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    major: 'Computer Science, Class of 2026',
    content: 'The grade predictor completely saved my semester! I knew exactly what I needed on my finals to keep my scholarship.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'David Chen',
    major: 'Mechanical Engineering, Class of 2025',
    content: 'Finding similar seniors helped me choose the right electives. The insights here are better than standard academic advising.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 3,
    name: 'Emily Taylor',
    major: 'Business Administration, Class of 2027',
    content: 'The SGPA calculator is so easy to use. I check it almost every week to see where I stand. Highly recommend!',
    rating: 4,
    avatar: 'https://i.pravatar.cc/150?img=5'
  }
];

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Take Control of Your <br />
            <span className="text-gradient">Academic Journey</span>
          </h1>
          <p className="hero-subtitle">
            Calculate your GPA effortlessly, predict future grades, and connect with seniors who share your academic path.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
        
        {/* Decorative elements for modern aesthetic */}
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </section>

      {/* About DTU Section */}
      <section className="about-dtu-section glass-card">
        <h2 className="section-title">About Delhi Technological University</h2>
        <div className="about-content">
          <p>
            Delhi Technological University (DTU), formerly known as Delhi College of Engineering (DCE), is one of India's premier engineering institutions. Established in 1941, DTU has a rich history of academic excellence, cutting-edge research, and producing world-class engineers, innovators, and leaders.
          </p>
          <p>
            With a sprawling campus, state-of-the-art laboratories, and a vibrant student community, DTU continues to foster an environment of technological advancement and holistic development. ResultNowDTU aims to bring the same level of innovation to our academic experience by simplifying result tracking and grade prediction.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">What Students Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card glass-card">
              <div className="stars">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="testimonial-content">"{testimonial.content}"</p>
              <div className="testimonial-author">
                <img src={testimonial.avatar} alt={testimonial.name} className="avatar" />
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.major}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
