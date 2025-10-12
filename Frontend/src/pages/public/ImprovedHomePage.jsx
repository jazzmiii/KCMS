import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clubService from '../../services/clubService';
import '../../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeClubs: 13,
    totalEvents: 50,
    activeMembers: 1200
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await clubService.listClubs({ limit: 12, status: 'active' });
      if (response?.data?.clubs && response.data.clubs.length > 0) {
        setClubs(response.data.clubs);
        setStats(prev => ({
          ...prev,
          activeClubs: response.data.total || response.data.clubs.length
        }));
      } else {
        // Use fallback clubs if no data
        setClubs(fallbackClubs);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      // Use fallback clubs on error
      setClubs(fallbackClubs);
    } finally {
      setLoading(false);
    }
  };

  // Fallback clubs data for better UX
  const fallbackClubs = [
    {
      _id: '1',
      name: 'Organising Committee',
      description: 'Coordinates and manages all club activities and events at KMIT',
      logo: 'https://via.placeholder.com/150?text=OC',
      category: 'Administrative'
    },
    {
      _id: '2',
      name: 'Public Relations',
      description: 'Manages communication and public image of KMIT clubs',
      logo: 'https://via.placeholder.com/150?text=PR',
      category: 'Communication'
    },
    {
      _id: '3',
      name: 'Aakarshan Art Club',
      description: 'Unleash your creativity through various art forms',
      logo: 'https://via.placeholder.com/150?text=Art',
      category: 'Cultural'
    },
    {
      _id: '4',
      name: 'AALAP Music Club',
      description: 'Explore the world of music through performances',
      logo: 'https://via.placeholder.com/150?text=Music',
      category: 'Cultural'
    },
    {
      _id: '5',
      name: 'Recurse Coding Club',
      description: 'Enhance programming skills and participate in hackathons',
      logo: 'https://via.placeholder.com/150?text=Code',
      category: 'Technical'
    },
    {
      _id: '6',
      name: 'Traces of Lenses',
      description: 'Capture moments and learn the art of photography',
      logo: 'https://via.placeholder.com/150?text=Photo',
      category: 'Cultural'
    }
  ];

  const features = [
    {
      icon: '🎯',
      title: 'Diverse Clubs',
      description: 'Choose from 13+ active clubs spanning technical, cultural, sports, and social domains'
    },
    {
      icon: '📅',
      title: 'Regular Events',
      description: 'Participate in workshops, competitions, performances, and networking events'
    },
    {
      icon: '🏆',
      title: 'Skill Development',
      description: 'Enhance your skills through hands-on projects and collaborative learning'
    },
    {
      icon: '🤝',
      title: 'Network & Grow',
      description: 'Connect with like-minded peers and build lasting friendships'
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="highlight">KMIT Clubs Hub</span>
            </h1>
            <p className="hero-subtitle">
              Your Gateway to Campus Life - Explore, Join, and Thrive with 13+ Active Student Clubs
            </p>
            <div className="hero-buttons">
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
                Get Started
              </button>
              <button onClick={() => navigate('/login')} className="btn btn-secondary btn-lg">
                Login
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              🎓
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">{stats.activeClubs}+</div>
            <div className="stat-label">Active Clubs</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.totalEvents}+</div>
            <div className="stat-label">Events Annually</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.activeMembers}+</div>
            <div className="stat-label">Active Members</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Join KMIT Clubs?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs Section */}
      <section className="clubs-section">
        <div className="container">
          <h2 className="section-title">Our Clubs</h2>
          <p className="section-subtitle">Discover clubs that match your interests</p>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading clubs...</p>
            </div>
          ) : (
            <>
              <div className="clubs-grid">
                {clubs.slice(0, 6).map((club) => (
                  <div key={club._id} className="club-card-home">
                    <div className="club-header">
                      <img 
                        src={club.logo || club.logoUrl || 'https://via.placeholder.com/100?text=' + club.name.charAt(0)} 
                        alt={club.name}
                        className="club-logo"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/100?text=${club.name.charAt(0)}`;
                        }}
                      />
                      <span className="club-badge">{club.category}</span>
                    </div>
                    <div className="club-body">
                      <h3 className="club-title">{club.name}</h3>
                      <p className="club-desc">{club.description || 'Join us to explore and grow!'}</p>
                    </div>
                    <div className="club-footer">
                      <button 
                        onClick={() => navigate('/register')} 
                        className="btn btn-outline btn-sm"
                      >
                        Join Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {clubs.length > 6 && (
                <div className="section-cta">
                  <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
                    View All {stats.activeClubs} Clubs
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Register</h3>
              <p>Create your account with your KMIT email and roll number</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Explore</h3>
              <p>Browse through our diverse range of clubs and find your passion</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Apply</h3>
              <p>Submit applications during recruitment drives</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Participate</h3>
              <p>Attend events, collaborate on projects, and grow your skills</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">Student Experiences</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Joining the Coding Club helped me land my dream internship. The projects and hackathons gave me real-world experience!"
              </p>
              <div className="testimonial-author">
                <strong>Rahul S.</strong>
                <span>CSE, 3rd Year</span>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "The Art Club became my creative outlet. I've made amazing friends and showcased my work at multiple exhibitions."
              </p>
              <div className="testimonial-author">
                <strong>Priya K.</strong>
                <span>ECE, 2nd Year</span>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Being part of the Organising Committee taught me leadership and event management skills that I use every day."
              </p>
              <div className="testimonial-author">
                <strong>Arjun M.</strong>
                <span>IT, 4th Year</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of students who are already part of the KMIT Clubs community</p>
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
              Register Now - It's Free!
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3>KMIT Clubs Hub</h3>
              <p>Empowering student engagement at Keshav Memorial Institute of Technology</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
              <Link to="/clubs">Browse Clubs</Link>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📍 Narayanguda, Hyderabad - 500029</p>
              <p>📧 clubs@kmit.in</p>
              <p>📞 +91 40 2761 0348</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 KMIT Clubs Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
